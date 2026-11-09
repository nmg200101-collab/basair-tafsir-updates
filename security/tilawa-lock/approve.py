#!/usr/bin/env python3
"""Owner-only, local one-change approval. Never commits or logs a password.

Requires: pip install cryptography (local owner machine only).
Usage after opening PR:
  python security/tilawa-lock/approve.py --pr 123 --base origin/main \
    --purpose 'QA051: fix follow positioning without touching audio data'
Then commit approvals/pr-123.json on the SAME PR. The gate binds it to the
exact file contents, PR number, repo and seven-day validity window.
"""
from __future__ import annotations
import argparse
import base64
import datetime as dt
import getpass
import hashlib
import json
import pathlib
import sys

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from verify import changed_paths, diff_digest, signing_bytes

BASE = pathlib.Path(__file__).resolve().parents[2]
FREEZE = BASE / "security/tilawa-lock/qa050-freeze.json"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate owner Tilawa approval without exposing password")
    parser.add_argument("--pr", required=True, type=int)
    parser.add_argument("--purpose", required=True)
    parser.add_argument("--base", default="origin/main")
    parser.add_argument("--digest", default="", help="Advanced: exact reviewed changed-file digest")
    parser.add_argument("--out", default="")
    opt = parser.parse_args()
    if opt.pr < 1 or len(opt.purpose.strip()) < 10 or len(opt.purpose.strip()) > 600:
        raise SystemExit("Invalid PR number or purpose length")
    freeze = json.loads(FREEZE.read_text(encoding="utf-8"))
    if opt.digest:
        if len(opt.digest) != 64 or any(c not in "0123456789abcdef" for c in opt.digest):
            raise SystemExit("Invalid reviewed digest")
        digest = opt.digest
    else:
        base = opt.base
        if len(base) != 40:
            import subprocess
            base = subprocess.check_output(["git", "rev-parse", opt.base], cwd=BASE).decode().strip()
        paths = changed_paths(BASE, base)
        digest = diff_digest(BASE, paths)
        if not any(p.startswith(("p92/", "p93/", "security/tilawa-lock/", ".github/workflows/"))
                   or p in freeze["protectedExactPaths"] for p in paths):
            raise SystemExit("No protected change is pending")
    password = getpass.getpass("Tilawa owner-lock password (not echoed): ")
    try:
        kdf = freeze["ownerKDF"]
        seed = hashlib.scrypt(password.encode("utf-8"), salt=base64.b64decode(kdf["salt_b64"]),
                              n=kdf["n"], r=kdf["r"], p=kdf["p"],
                              dklen=32, maxmem=256*1024*1024)
        private = Ed25519PrivateKey.from_private_bytes(seed)
        public = private.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
        if public != (BASE / freeze["approvalPublicKeyPath"]).read_bytes():
            raise SystemExit("Password does not match the registered owner-lock key")
        created = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
        expires = created + dt.timedelta(days=7)
        approval = {
            "schema": 1,
            "repo": "nmg200101-collab/basair-tafsir-updates",
            "pr": opt.pr,
            "digest": digest,
            "purpose": opt.purpose.strip(),
            "created_at": created.isoformat().replace("+00:00", "Z"),
            "expires_at": expires.isoformat().replace("+00:00", "Z")
        }
        approval["signature_b64"] = base64.b64encode(private.sign(signing_bytes(approval))).decode()
        target = pathlib.Path(opt.out or str(BASE / f"security/tilawa-lock/approvals/pr-{opt.pr}.json"))
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(approval, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("OWNER_APPROVAL_CREATED", target, "digest=" + digest)
        print("No password/private key stored. Re-sign after changing any reviewed file.")
    finally:
        password = ""  # Does not persist the secret on disk.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
