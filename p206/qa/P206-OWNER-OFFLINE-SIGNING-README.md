# P206 — Owner-only offline signing handoff (2026-11-17)

**STATUS: PREPARATION ONLY. Do NOT deploy P206 before real V695 phone acceptance and final QA-050.**

## Public-only inspection of provided encrypted backup
- Source supplied separately by the owner: `BASAIR-P119-OWNER-ED25519-ENCRYPTED-BACKUP.zip`.
- ZIP integrity: passed. It contains an encrypted Ed25519 PEM, the public Ed25519 PEM, and a README.
- Public Ed25519 key **matches the pinned P121/P206 OTA owner-approval key**.
- Public Ed25519 key **does not match** the separate GitHub `ci/tilawa-owner-approval-public.pem` key used by the QA-050 protected-diff guard. Do NOT use this new backup to claim an old QA-050 protected-diff unlock has been signed.
- The encrypted private key was **not decrypted** and its passphrase is **not inside the ZIP**. The ZIP does NOT contain the original RSA3072 Android signing key or P12.
- The uploaded archive and any plaintext passwords/private keys have NOT been pushed to this GitHub repository.

## Non-secret signing tool prepared
`p206/scripts/offline-owner-sign-p206.py` is a standalone local signer which:
1. Regenerates/validates the P206 unsigned manifest inventory, checking the SHA256 and size of all 41 assets for Seq111 (or 38 assets for emergency Seq112).
2. Checks the Ed25519 ZIP **public** key matches the pinned OTA verifier, then prompts for its passphrase securely through a local console (`getpass`); it does not print or store the passphrase or decrypted PEM.
3. Prompts for the **original RSA3072 PKCS12** password separately; verifies the certificate against the pinned original RSA public key hash.
4. Builds the specific Ed25519 protected ownerApproval and original RSA3072 OTA envelope, verifies the signatures locally, and creates a **new** signed file with restrictive permissions, without modifying `p121/owner-qa/release.json`.

## Procedure — ONLY on owner's own trusted/offline computer
After field acceptance, in a trusted local checkout of this exact branch:

```sh
python -m pip install cryptography
node p206/scripts/prepare-unsigned-p206.cjs --write

python p206/scripts/offline-owner-sign-p206.py \
  --manifest p206/generated/P206-SEQ111-UNSIGNED-INPUT.json \
  --ed-backup /path/to/BASAIR-P119-OWNER-ED25519-ENCRYPTED-BACKUP.zip \
  --rsa-p12 /path/to/ORIGINAL-OWNER-KEY.p12 \
  --output /secure-local-folder/P206-SEQ111-OWNER-SIGNED.json
```

For the independent rollback, use the Seq112 manifest and a **different** output filename:

```sh
python p206/scripts/offline-owner-sign-p206.py \
  --manifest p206/generated/P206-SEQ112-EMERGENCY-UNSIGNED-INPUT.json \
  --ed-backup /path/to/BASAIR-P119-OWNER-ED25519-ENCRYPTED-BACKUP.zip \
  --rsa-p12 /path/to/ORIGINAL-OWNER-KEY.p12 \
  --output /secure-local-folder/P206-SEQ112-EMERGENCY-OWNER-SIGNED.json
```

Use `--rsa-backup-zip /path/to/secure-owner-backup.zip` in place of `--rsa-p12` **only** when the ZIP contains the original `01-ANDROID-ORIGINAL-SIGNING/OWNER-SIGNING-KEY.p12`.

**Do not** put passwords on a command line, in an environment variable committed to a repo, in this chat, or in a CI configuration. Never upload private keys, encrypted key backups, or owner passphrases to GitHub.

## Outstanding blockers
- Owner passphrase is not available in this chat and should stay with the owner.
- Original RSA3072 private key and password are not part of the uploaded Ed25519 backup.
- Full V695 Android WebView/phone first-tap, Stop/Pause, frame, zoom/audio, and six-step rollback tests have not been completed.
- Signed envelopes must be verified and separately approved before an owner-qa release PR and actual installation.
