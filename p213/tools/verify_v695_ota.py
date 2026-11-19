#!/usr/bin/env python3
"""Read-only P213 OTA release gate against the actual V695 receiver.

Usage:
  python3 p213/tools/verify_v695_ota.py --apk basair-v695-owner-signed.apk \
      --release p121/owner-qa/release.json --min-sequence 122 \
      --expected-id P213-SEQ122-OWNER-VERIFIED \
      --asset-root p121/owner-qa

The script NEVER signs, writes a manifest, accesses private keys or publishes.
OpenSSL CLI and Python stdlib only. Exit 0 means crypto/schema/assets verified,
NOT Android WebView acceptance or deployment.
"""
import argparse
import base64
from datetime import datetime, timezone, timedelta
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from zipfile import ZipFile

APP = "app.basair.qurv2"
MODULES = set("home tafsir tilawa hifz library reciters downloads settings navigation shared updates search memorization design".split())
PROTECTED = set("tilawa shared navigation reciters".split())
ASSET_RE = re.compile(r"^modules/([a-z]+)/[a-zA-Z0-9][a-zA-Z0-9._/-]{0,160}\.(js|css|json|html|svg|png|jpg|jpeg|webp|woff2)$")
HEXDIGEST_RE = re.compile(r"^[0-9a-f]{64}$")

def fail(message):
    raise ValueError(message)

def b64(value):
    return base64.b64decode(value, validate=True)

def pubkeys(apk):
    with ZipFile(apk) as archive:
        js = archive.read("assets/www/p121/universal-updates.js").decode("utf-8")
    def extract(name):
        match = re.search(r"\bvar\s+" + name + r"\s*=\s*'([^']+)'", js)
        if not match:
            fail("V695 public verifier not found: " + name)
        return b64(match.group(1))
    app_match = re.search(r"\bAPP_VERSION\s*=\s*(\d+)", js)
    if not app_match:
        fail("V695 receiver APP_VERSION not found")
    return extract("PUB"), extract("OWNER_ED25519"), int(app_match.group(1))

def as_pem(der):
    encoded = base64.b64encode(der).decode("ascii")
    return ("-----BEGIN PUBLIC KEY-----\n" +
            "\n".join(encoded[i:i+64] for i in range(0,len(encoded),64)) +
            "\n-----END PUBLIC KEY-----\n").encode("ascii")

def verify_rsa(data, signature, spki):
    if len(signature) != 384:
        fail("RSA signature must be exactly 384 bytes")
    with tempfile.TemporaryDirectory(prefix="basair-verify-") as d:
        folder = Path(d)
        (folder/"pub.pem").write_bytes(as_pem(spki))
        (folder/"message").write_bytes(data)
        (folder/"sig").write_bytes(signature)
        run = subprocess.run(["openssl","dgst","-sha256","-verify",str(folder/"pub.pem"),
                              "-signature",str(folder/"sig"),str(folder/"message")],
                             capture_output=True,text=True)
        if run.returncode != 0:
            fail("V695 RSA signature invalid")

def verify_ed25519(data, signature, raw_public):
    if len(raw_public) != 32 or len(signature) != 64:
        fail("QA050 public key or signature size invalid")
    # ASN.1 SubjectPublicKeyInfo for an Ed25519 raw public key
    der = bytes.fromhex("302a300506032b6570032100") + raw_public
    with tempfile.TemporaryDirectory(prefix="basair-owner-verify-") as d:
        folder = Path(d)
        (folder/"pub.pem").write_bytes(as_pem(der))
        (folder/"message").write_bytes(data)
        (folder/"sig").write_bytes(signature)
        run = subprocess.run(["openssl","pkeyutl","-verify","-pubin",
                              "-inkey",str(folder/"pub.pem"),"-rawin",
                              "-in",str(folder/"message"),"-sigfile",str(folder/"sig")],
                             capture_output=True,text=True)
        if run.returncode != 0:
            fail("QA050 Ed25519 signature invalid")

def parse_time(s):
    if not isinstance(s,str):
        fail("Invalid signed date")
    try:
        dt = datetime.fromisoformat(s.replace("Z","+00:00"))
    except ValueError:
        fail("Invalid ISO 8601 signed date")
    if dt.tzinfo is None:
        fail("Unsigned timezone on signed date")
    return dt.astimezone(timezone.utc)

def validate_payload(manifest, receiver_version, owner_key, now, min_sequence, expected_id,
                     asset_root):
    if (manifest.get("schema") != "basair-universal-ota-v1" or
        manifest.get("channel") != "owner-qa" or
        manifest.get("applicationId") != APP):
        fail("Wrong schema/channel/applicationId")
    if expected_id and manifest.get("id") != expected_id:
        fail("Expected P213 release id not present; refusing to accept a previous P212 release")
    sequence = manifest.get("sequence")
    if type(sequence) is not int or not 1 <= sequence <= 9999999 or sequence < min_sequence:
        fail("Invalid or non-forward sequence")
    min_app = manifest.get("minAppVersion")
    if type(min_app) is not int or not 693 <= min_app <= receiver_version:
        fail("Not compatible with the actual embedded V695 OTA receiver")
    issued, expires = parse_time(manifest.get("issuedAt")), parse_time(manifest.get("expiresAt"))
    if issued > now + timedelta(minutes=5) or not now <= expires <= now + timedelta(days=366):
        fail("Expired or future-dated envelope")
    modules = manifest.get("modules")
    if not isinstance(modules,list) or len(modules)>len(MODULES):
        fail("Invalid module list")
    if modules and (manifest.get("deliveryMode") not in ("notify","automatic") or min_app<694):
        fail("Required delivery mode missing from signed payload")
    seen_m, seen_f, total_size, count = set(),set(),0,0
    for module in modules:
        if not isinstance(module,dict):
            fail("Invalid module")
        name, version, files = module.get("id"),module.get("version"),module.get("assets")
        if (name not in MODULES or name in seen_m or type(version) is not int or
            version<1 or not isinstance(files,list) or len(files)>100):
            fail("Module id, version or files invalid")
        seen_m.add(name)
        for item in files:
            if not isinstance(item,dict):
                fail("Invalid signed asset")
            path, size, checksum, kind = item.get("path"),item.get("size"),item.get("sha256"),item.get("kind")
            if not isinstance(path,str):
                fail("Asset path not string")
            match = ASSET_RE.fullmatch(path)
            if (not match or match.group(1)!=name or match.group(2)!=kind or
                ".." in path or path in seen_f or
                type(size) is not int or not 0<=size<=8*1024*1024 or
                not isinstance(checksum,str) or not HEXDIGEST_RE.fullmatch(checksum)):
                fail("Invalid signed asset: " + path)
            seen_f.add(path); total_size += size; count += 1
            if asset_root:
                target = Path(asset_root)/path
                if not target.is_file():
                    fail("Referenced asset missing: " + path)
                content = target.read_bytes()
                if len(content)!=size or hashlib.sha256(content).hexdigest()!=checksum:
                    fail("Signed asset hash/size mismatch: " + path)
    if total_size>32*1024*1024 or count>100:
        fail("Payload file count or size exceeded")
    locked = [m for m in modules if m["id"] in PROTECTED]
    if locked:
        approval = manifest.get("ownerApproval")
        if (not isinstance(approval,dict) or approval.get("schema")!=1 or
            approval.get("algorithm")!="Ed25519" or approval.get("sequence")!=sequence or
            not isinstance(approval.get("modulesSha256"),str) or
            not HEXDIGEST_RE.fullmatch(approval["modulesSha256"])):
            fail("Protected Tilawa update missing scoped QA050 approval")
        end = parse_time(approval.get("expiresAt"))
        if not now<=end<=now+timedelta(days=7):
            fail("QA050 owner approval expired or too far in the future")
        canonical = json.dumps(locked,ensure_ascii=False,separators=(",",":")).encode("utf-8")
        hash_locked = hashlib.sha256(canonical).hexdigest()
        if hash_locked != approval["modulesSha256"]:
            fail("QA050 signature is not scoped to exact signed modules")
        proof = ("basair-universal-protected-v1\n" + APP + "\n" +
                 str(sequence) + "\n" + hash_locked + "\n" +
                 approval["expiresAt"]).encode("utf-8")
        verify_ed25519(proof,b64(approval["signature"]),owner_key)
    return {"sequence":sequence,"release":manifest["id"],"modules":[m["id"] for m in modules],
            "assets":count,"total_bytes":total_size,"owner_approval_valid":bool(locked),
            "assets_verified":bool(asset_root)}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apk",type=Path,required=True,help="Original signed V695 APK, read-only")
    parser.add_argument("--release",type=Path,required=True,help="Signed envelope JSON file")
    parser.add_argument("--asset-root",type=Path,help="Directory containing modules/<name>/... assets")
    parser.add_argument("--min-sequence",type=int,default=122)
    parser.add_argument("--expected-id",help="Require exact P213 release id to avoid accepting P212")
    parser.add_argument("--rollback",type=Path,help="Separately owner-signed recovery envelope with a higher sequence")
    parser.add_argument("--rollback-id",help="Exact rollback envelope id")
    parser.add_argument("--baseline-release",type=Path,help="Previously published original owner-signed release envelope")
    parser.add_argument("--strict-publish-gate",action="store_true",
                        help="Require target id, asset hashes and a signed forward-sequence rollback")
    args = parser.parse_args()
    rsa, owner, receiver_version = pubkeys(args.apk)
    env = json.loads(args.release.read_text(encoding="utf-8"))
    payload,sig=b64(env["payload"]),b64(env["signature"])
    if len(payload)>48000 or len(env["payload"])>64000 or len(env["signature"])>1000:
        fail("Envelope exceeds V695 receiver limits")
    verify_rsa(payload,sig,rsa)
    manifest=json.loads(payload.decode("utf-8"))
    result=validate_payload(manifest,receiver_version,owner,datetime.now(timezone.utc),
                            args.min_sequence,args.expected_id,args.asset_root)
    rollback_result=None
    if args.strict_publish_gate and (not args.expected_id or not args.asset_root or
                                    not args.rollback or not args.rollback_id or
                                    not args.baseline_release):
        fail("Strict publish gate requires --expected-id, --asset-root, --rollback, --rollback-id and --baseline-release")
    if args.rollback:
        backward=json.loads(args.rollback.read_text(encoding="utf-8"))
        backwards_payload=b64(backward["payload"])
        verify_rsa(backwards_payload,b64(backward["signature"]),rsa)
        rollback_manifest=json.loads(backwards_payload.decode("utf-8"))
        rollback_result=validate_payload(rollback_manifest,receiver_version,owner,
                                         datetime.now(timezone.utc),result["sequence"]+1,
                                         args.rollback_id,args.asset_root)
        if "tilawa" not in rollback_result["modules"]:
            fail("Recovery envelope must explicitly restore Tilawa")
        live = next((m for m in manifest["modules"] if m["id"]=="tilawa"),None)
        restore = next((m for m in rollback_manifest["modules"] if m["id"]=="tilawa"),None)
        if not live or not restore or restore["version"] <= live["version"]:
            fail("Rollback Tilawa module version must be GREATER than forward version: P121 checks versions")
        if args.baseline_release:
            base_env=json.loads(args.baseline_release.read_text(encoding="utf-8"))
            base_payload=b64(base_env["payload"])
            verify_rsa(base_payload,b64(base_env["signature"]),rsa)
            base_manifest=json.loads(base_payload.decode("utf-8"))
            base_tilawa=next((m for m in base_manifest.get("modules",[]) if m.get("id")=="tilawa"),None)
            if not base_tilawa:
                fail("Baseline signed release missing Tilawa")
            def files(mod):
                return [(a["path"],a["kind"],a["size"],a["sha256"]) for a in mod["assets"]]
            if files(restore)!=files(base_tilawa):
                fail("Rollback assets differ from last signed stable Tilawa baseline")
            if restore["version"]<=base_tilawa["version"]:
                fail("Rollback version must exceed original baseline module version too")
    verdict="PASS_SIGNED_FORWARD_AND_RECOVERY" if rollback_result else "PASS_SIGNED_FORWARD_ONLY"
    print(json.dumps({"status":verdict,"receiver_version":receiver_version,
                      **result,"rollback":rollback_result,
                      "android_webview_acceptance":"NOT_VERIFIED_BY_THIS_TOOL"},
                     ensure_ascii=False,indent=2))
    print("WARNING: signatures and assets do not prove Android WebView acceptance or deployment",
          file=sys.stderr)

if __name__=="__main__":
    try: main()
    except (ValueError,KeyError,TypeError,FileNotFoundError,subprocess.SubprocessError) as error:
        print("FAIL_RELEASE_GATE: "+str(error),file=sys.stderr)
        sys.exit(2)
