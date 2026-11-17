#!/usr/bin/env python3
"""Sign P206 owner-qa manifests exclusively on the owner's OFFLINE computer.

Requires locally installed 'cryptography'. Never upload keys, zip backups, passwords
or decrypted key material to GitHub/CI/ChatGPT. Passwords are requested with getpass.
Run after the owner has accepted the candidate on V695.
"""
import argparse
import base64
import getpass
import hashlib
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zipfile import ZipFile

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ed25519, padding, rsa
from cryptography.hazmat.primitives.serialization import pkcs12

ROOT = Path(__file__).resolve().parents[2]
APP = "app.basair.qurv2"
ED_PIN = base64.b64decode("E5w/6ZiOP+TAolg6STpmeDl0Yo2A/NPHhcqhCo5pitk=")
RSA_SPKI_SHA256_PIN = "ca29e72d263432c7347dcb0e5b376c142401ad24b543b7ab6d2fc1c2f92e5e88"
PROTECTED = {"tilawa", "shared", "navigation", "reciters"}
ZIP_ED = "BASAIR-P119-ED25519-OWNER-ENCRYPTED.pem"
ZIP_ED_PUBLIC = "BASAIR-P119-ED25519-OWNER-PUBLIC.pem"
ZIP_RSA = "01-ANDROID-ORIGINAL-SIGNING/OWNER-SIGNING-KEY.p12"


def compact(obj):
    # Mirrors JSON.stringify for the P206 integer/string/list/dictionary manifest.
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def hashhex(value):
    return hashlib.sha256(value).hexdigest()


def iso(ts):
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def verify_manifest(m):
    if m.get("schema") != "basair-universal-ota-v1" or m.get("channel") != "owner-qa" or m.get("applicationId") != APP:
        raise ValueError("Wrong P121 signed-manifest contract or application")
    if m.get("sequence") not in (111, 112):
        raise ValueError("This signer is restricted to the approved P206 Seq111/112 inputs")
    if not (694 <= m.get("minAppVersion", 0) <= 695):
        raise ValueError("Unexpected application version")
    now = datetime.now(timezone.utc)
    issue, expiry = iso(m["issuedAt"]), iso(m["expiresAt"])
    if issue.tzinfo is None or expiry.tzinfo is None or issue > now + timedelta(minutes=5) or expiry < now or expiry > now + timedelta(days=366):
        raise ValueError("Manifest issuedAt/expiresAt invalid or stale")
    if "ownerApproval" in m:
        raise ValueError("Do not reuse a prior approval; sign only unsigned inputs")
    modules = m.get("modules")
    if not isinstance(modules, list) or not modules:
        raise ValueError("Modules missing")
    if sorted(x.get("id") for x in modules) != ["tafsir", "tilawa", "updates"]:
        raise ValueError("Unexpected module set for P206")
    expected = 41 if m["sequence"] == 111 else 38
    count, total, seen = 0, 0, set()
    for mod in modules:
        if not isinstance(mod.get("version"), int) or mod["version"] < 1:
            raise ValueError("Invalid module version")
        for a in mod["assets"]:
            p = a["path"]
            if not p.startswith("modules/" + mod["id"] + "/") or ".." in p or p in seen or a["kind"] != p.rsplit(".", 1)[-1]:
                raise ValueError("Invalid asset path")
            seen.add(p)
            raw = (ROOT / "p121" / "owner-qa" / p).read_bytes()
            if len(raw) != a["size"] or hashhex(raw) != a["sha256"]:
                raise ValueError("Asset mismatch: " + p)
            count += 1
            total += len(raw)
    if count != expected or total > 32 * 1024 * 1024:
        raise ValueError("Unexpected P206 manifest file inventory")
    if m["sequence"] == 111 and (m["modules"][1]["version"] != 229):
        # This is a strict safety condition: do not silently sign a changed branch.
        raise ValueError("Unexpected P206 Tilawa version")
    return [v for v in modules if v["id"] in PROTECTED]


def ed_from_backup(backup):
    with ZipFile(backup) as z:
        encrypted_pem = z.read(ZIP_ED)
        public_pem = z.read(ZIP_ED_PUBLIC)
    public = serialization.load_pem_public_key(public_pem)
    raw = public.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    if raw != ED_PIN:
        raise ValueError("Backup Ed25519 public key DOES NOT MATCH P121 verifier")
    password = getpass.getpass("Owner Ed25519 passphrase (offline, hidden): ").encode("utf-8")
    key = serialization.load_pem_private_key(encrypted_pem, password=password)
    if not isinstance(key, ed25519.Ed25519PrivateKey):
        raise ValueError("Not an Ed25519 owner key")
    if key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw) != ED_PIN:
        raise ValueError("Owner private key/public key mismatch")
    return key


def rsa_from_p12(p12_bytes):
    password = getpass.getpass("Original Android RSA P12 password (offline, hidden): ").encode("utf-8")
    key, cert, _ = pkcs12.load_key_and_certificates(p12_bytes, password)
    if not isinstance(key, rsa.RSAPrivateKey) or key.key_size != 3072 or cert is None:
        raise ValueError("Missing original RSA3072 certificate or signing key")
    der = cert.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    if hashhex(der) != RSA_SPKI_SHA256_PIN:
        raise ValueError("RSA certificate is NOT the original pinned P121 signer")
    return key, cert.public_key()


def sign(manifest, ed_key, rsa_key, rsa_public):
    m = dict(manifest)
    protected = verify_manifest(m)
    expire = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat().replace("+00:00", "Z")
    modules_hash = hashhex(compact(protected))
    approval_proof = (
        "basair-universal-protected-v1\n" + APP + "\n" + str(m["sequence"]) + "\n" +
        modules_hash + "\n" + expire
    ).encode("utf-8")
    approval_sig = ed_key.sign(approval_proof)
    ed_key.public_key().verify(approval_sig, approval_proof)
    m["ownerApproval"] = {
        "schema": 1, "algorithm": "Ed25519", "sequence": m["sequence"],
        "modulesSha256": modules_hash, "expiresAt": expire,
        "signature": base64.b64encode(approval_sig).decode("ascii"),
    }
    payload = compact(m)
    if len(payload) > 48000:
        raise ValueError("Payload too large for P121")
    signature = rsa_key.sign(payload, padding.PKCS1v15(), hashes.SHA256())
    rsa_public.verify(signature, payload, padding.PKCS1v15(), hashes.SHA256())
    if len(signature) != 384:
        raise ValueError("Unexpected RSA3072 signature size")
    return {
        "payload": base64.b64encode(payload).decode("ascii"),
        "signature": base64.b64encode(signature).decode("ascii"),
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--manifest", type=Path, required=True, help="One P206 unsigned JSON generated locally")
    p.add_argument("--ed-backup", type=Path, required=True, help="Encrypted owner Ed25519 backup ZIP")
    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument("--rsa-p12", type=Path, help="Original RSA3072 Android P12, LOCAL ONLY")
    group.add_argument("--rsa-backup-zip", type=Path, help="Original RSA owner backup ZIP, LOCAL ONLY")
    p.add_argument("--output", type=Path, required=True, help="New signed envelope outside release.json")
    args = p.parse_args()
    if args.output.resolve() == (ROOT / "p121/owner-qa/release.json").resolve():
        p.error("Refusing to overwrite live owner-qa release.json")
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    verify_manifest(manifest)  # Before any passphrase prompts
    ed = ed_from_backup(args.ed_backup)
    if args.rsa_p12:
        rsa_bytes = args.rsa_p12.read_bytes()
    else:
        with ZipFile(args.rsa_backup_zip) as z:
            rsa_bytes = z.read(ZIP_RSA)
    rsa_key, rsa_pub = rsa_from_p12(rsa_bytes)
    envelope = sign(manifest, ed, rsa_key, rsa_pub)
    output = (json.dumps(envelope, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive create: refuse any overwrite of previously signed releases.
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as f:
        f.write(output)
    print(json.dumps({"result": "SIGNED_LOCALLY_ONLY", "sequence": manifest["sequence"],
                      "envelope_sha256": hashhex(output), "output": str(args.output),
                      "published": False}, ensure_ascii=False))
    print("Do NOT publish until QA-050 and V695 Android field acceptance are complete.")


if __name__ == "__main__":
    main()
