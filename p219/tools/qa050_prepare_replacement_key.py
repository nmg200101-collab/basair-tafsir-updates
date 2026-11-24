#!/usr/bin/env python3
"""Generate an *unapproved replacement* QA-050 Ed25519 key OFFLINE on the owner's trusted device.

Does not rotate GitHub trust, sign old approvals, edit the app, or publish OTA.
Never run inside CI/GitHub Actions or an untrusted cloud environment.
Requires: python3 and the cryptography package in the trusted signing environment.
"""
import argparse
import getpass
import hashlib
import os
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

REPO = Path(__file__).resolve().parents[2]
PRIV = "BASAIR-QA050-REPLACEMENT-PRIVATE-ENCRYPTED-UNAPPROVED.pem"
PUB = "BASAIR-QA050-REPLACEMENT-PUBLIC-UNAPPROVED.pem"

def write_once(path, content):
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    fd = os.open(str(path), flags, 0o600)
    with os.fdopen(fd, "wb") as output:
        output.write(content)
        output.flush()
        os.fsync(output.fileno())

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--outside-repo-dir",required=True,type=Path,
                    help="Trusted LOCAL folder outside the repository (never a cloud sync folder)")
    ap.add_argument("--ack-lost-original",action="store_true",
                    help="Explicit acknowledgement that this is a NEW unapproved trust root")
    args=ap.parse_args()
    if not args.ack_lost_original:
        raise SystemExit("STOP: requires --ack-lost-original; this does not authorize QA050 rotation")
    root=args.outside_repo_dir.expanduser().resolve()
    if root==REPO or REPO in root.parents:
        raise SystemExit("STOP: key output must be outside the repository")
    if root.exists() and any(root.iterdir()):
        raise SystemExit("STOP: output folder must be empty to prevent overwriting credentials")
    password=getpass.getpass("Set NEW strong passphrase for replacement key (never send to chat): ")
    confirmation=getpass.getpass("Confirm passphrase: ")
    if password!=confirmation or len(password)<16:
        raise SystemExit("STOP: passwords differ or have fewer than 16 characters")
    os.umask(0o077)
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    private=Ed25519PrivateKey.generate()
    public=private.public_key()
    raw_public=public.public_bytes(
        encoding=serialization.Encoding.Raw,format=serialization.PublicFormat.Raw)
    pem_public=public.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo)
    pem_private=private.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.BestAvailableEncryption(password.encode("utf-8")))
    try:
        write_once(root/PRIV,pem_private)
        write_once(root/PUB,pem_public)
        public_check=serialization.load_pem_private_key(
            (root/PRIV).read_bytes(),password=password.encode("utf-8"))
        if public_check.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw)!=raw_public:
            raise ValueError("Generated key pair self-check failed")
    finally:
        # Never display or log the passphrase.
        del password, confirmation, private
    print("Local encrypted replacement generated: UNAPPROVED. Trust NOT rotated.")
    print("PUBLIC raw key SHA256: "+hashlib.sha256(raw_public).hexdigest())
    print("PRIVATE key stored ONLY in the trusted local output directory.")
    print("Keep two separately protected encrypted backups. Do NOT upload PRIVATE PEM.")
    print("Independent owner governance review and explicit key-rotation approval REQUIRED.")

if __name__=="__main__":
    main()
