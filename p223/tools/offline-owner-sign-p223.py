#!/usr/bin/env python3
"""Prepare P223 signed envelopes OFFLINE. No network, publishing, or key upload.
Run only after detailed V695 native-source review and approval of the exact candidate.
The original P206 signer supplies the pinned owner key checks.
"""
import argparse
import base64
import hashlib
import importlib.util
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / "p223/report/P223_SEQ143_SEQ144_UNSIGNED_DRAFT_PLAN.json"
ASSETS = ROOT / "p121/owner-qa"
BASE_SIGNER = ROOT / "p206/scripts/offline-owner-sign-p206.py"

def require(ok, message):
    if not ok:
        raise ValueError(message)

def compact(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def read_plan():
    p = json.loads(PLAN.read_text(encoding="utf-8"))
    raw = (ASSETS / "release.json").read_bytes()
    require(digest(raw) == p["baseline"]["manifest_sha256"], "Live baseline changed; re-prepare.")
    base = json.loads(base64.b64decode(json.loads(raw)["payload"]))
    require(base["sequence"] == 141, "Not P222 Seq141")
    old = base["modules"][0]["assets"]
    expected = {"p213-tajwid-static-follow-v2.js": "p223-tajwid-native-audio.js",
                "p214-follow-route-adapters.js": "p223-printed-route-adapters.js"}
    for key, seq, version, count in (("forward",143,256,21),("rollback",144,257,20)):
        m = p[key]
        require(m["sequence"] == seq and m["schema"] == "basair-universal-ota-v1"
                and m["channel"] == "owner-qa" and m["applicationId"] == "app.basair.qurv2"
                and m["minAppVersion"] == 694 and m["deliveryMode"] == "notify"
                and m["restartRequired"] is True and "ownerApproval" not in m,
                "Manifest contract mismatch")
        require(len(m["modules"]) == 1 and m["modules"][0]["id"] == "tilawa"
                and m["modules"][0]["version"] == version, "Module mismatch")
        assets = m["modules"][0]["assets"]
        require(len(assets) == count and len({a["path"] for a in assets}) == count, "Inventory mismatch")
        for a in assets:
            path = a["path"]
            require(path.startswith("modules/tilawa/") and "/" not in path[len("modules/tilawa/"):]
                    and ".." not in path and a["kind"] in ("js","css")
                    and path.endswith("."+a["kind"]), "Unexpected asset path")
            raw = (ASSETS / path).read_bytes()
            require(len(raw) == a["size"] and digest(raw) == a["sha256"], "Asset bytes mismatch: "+path)
        if key == "rollback":
            require(assets == old, "Rollback must restore exact P222 bytes")
        else:
            for before, after in zip(old, assets):
                name = before["path"].split("/")[-1]
                if name in expected:
                    require(after["path"] == "modules/tilawa/"+expected[name], "Replacement order mismatch")
                else:
                    require(before == after, "Protected baseline changed")
            require(assets[-1]["path"] == "modules/tilawa/p223-native-printed-audio-scroll.js", "Final asset mismatch")
    return p

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check-only", action="store_true")
    ap.add_argument("--native-audit-reviewed", action="store_true",
                    help="Explicitly confirm actual detailed native source evidence was reviewed.")
    ap.add_argument("--ed-backup", type=Path)
    ap.add_argument("--rsa-p12", type=Path)
    ap.add_argument("--rsa-backup-zip", type=Path)
    ap.add_argument("--output-dir", type=Path)
    args=ap.parse_args()
    p=read_plan()
    print("Exact candidate and rollback bytes verified (not device QA).")
    if args.check_only:
        return
    require(args.native_audit_reviewed, "Detailed native-source review must precede signing.")
    require(args.ed_backup and bool(args.rsa_p12) != bool(args.rsa_backup_zip) and args.output_dir,
            "Provide original encrypted key backups locally and an output directory.")
    output=args.output_dir.resolve()
    require(output != ROOT and ROOT not in output.parents, "Keep signed output outside checkout until verified.")
    output.mkdir(parents=True, exist_ok=True)
    names=["P223-SEQ143-OWNER-SIGNED-HELD.json","P223-SEQ144-OWNER-SIGNED-ROLLBACK-HELD.json"]
    require(not any((output/n).exists() for n in names),"Refusing to overwrite existing signed manifests")
    spec=importlib.util.spec_from_file_location("original_owner_key_checks", BASE_SIGNER)
    signer=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(signer)
    ed=signer.ed_from_backup(args.ed_backup)
    if args.rsa_p12:
        rsa,pub=signer.rsa_from_p12(args.rsa_p12.read_bytes())
    else:
        rsa,pub=signer.original_rsa_from_owner_zip(args.rsa_backup_zip)
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding
    now=datetime.now(timezone.utc).replace(microsecond=0)
    def iso(t): return t.isoformat().replace("+00:00","Z")
    results=[]
    for key,name in zip(("forward","rollback"),names):
        m=dict(p[key])
        m["issuedAt"]=iso(now)
        m["expiresAt"]=iso(now+timedelta(days=30))
        m["changeType"]="protected-visual-only"
        m["changeSummary"]=(["P223 printed audio follow candidate; preserves digital and silent paths; device acceptance pending"]
                            if key=="forward" else ["Restore exact P222 Tilawa asset inventory"])
        exp=iso(now+timedelta(days=3))
        mh=digest(compact(m["modules"]))
        proof=("basair-universal-protected-v1\napp.basair.qurv2\n"+str(m["sequence"])+"\n"+mh+"\n"+exp).encode()
        sig=ed.sign(proof)
        ed.public_key().verify(sig,proof)
        m["ownerApproval"]={"schema":1,"algorithm":"Ed25519","sequence":m["sequence"],
                            "modulesSha256":mh,"expiresAt":exp,"signature":base64.b64encode(sig).decode()}
        payload=compact(m)
        require(len(payload)<=48000,"Payload too large")
        rsig=rsa.sign(payload,padding.PKCS1v15(),hashes.SHA256())
        pub.verify(rsig,payload,padding.PKCS1v15(),hashes.SHA256())
        require(len(rsig)==384,"Wrong RSA signature size")
        results.append((name,{"payload":base64.b64encode(payload).decode(),"signature":base64.b64encode(rsig).decode()}))
    for name,envelope in results:
        with (output/name).open("x",encoding="utf-8") as f:
            json.dump(envelope,f,ensure_ascii=False,indent=2)
            f.write("\n")
        print("SIGNED HELD ONLY:",name)
    print("No publication. Return only signed JSON envelopes after verifying release readiness; never send private keys.")

if __name__=="__main__":
    main()
