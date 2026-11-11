# P118 / QA051 — Actual V690 receiver release-signature gate (2026-11-10)

**STAGING ONLY — Never publish an unsigned or improperly approved update.**

The privately uploaded V690 APK was inspected locally; the APK itself, passwords and private keys have **not** been uploaded to GitHub.

## Verified receiver contracts

1. The OTA receiver is `assets/www/p92/remote-updates.js` and fetches a publicly reachable `p92/owner-qa-001/release.json`, with owner confirmation, signed RSA envelope and A/B rollback.
2. The envelope's **RSA-SHA256 public key** from `assets/www/p92/p92-public-key.js` is **byte-for-byte the same RSA public key as the certificate in `META-INF/BASAIR-O.RSA`**. Public SPKI SHA256: `ca29e72d263432c7347dcb0e5b376c142401ad24b543b7ab6d2fc1c2f92e5e88`. The Android certificate SHA256 is `35066b87e4b854187b5c8fa8321676bacc2de8bef14624072afb33ebd506dc07`. This does NOT constitute RSA signing or authorization; it confirms public-key correspondence only.
3. The OTA manifest accepts **at most 8 resources** with filenames ending in JS or CSS, and total size at most 1 MiB. The owner-approved QA050 manifest already contains 8 resources; adding P118 as a ninth asset is rejected.
4. Receiver `requireTilawaOwnerApproval()` requires the **exact ordered list** of the eight frozen QA050 resources (path, kind, size, SHA256) to remain unchanged, or a separate `manifest.tilawaApproval` Ed25519 signature.
5. The OTA Ed25519 proof is the UTF-8 text:
   `basair-tilawa-apk-unlock-v1\n<sequence>\n<sha256(JSON.stringify(assets))>\n<expiresAt>`
   The approval must include `schema=1`, `algorithm='Ed25519'`, same sequence, lowercase 64-char assets hash, valid expiration no more than seven days ahead, and base64 signature.
6. The **GitHub owner-lock guard** uses a different Ed25519 signed payload: `canonical({scope,request})` via `ci/tilawa_lock_owner_sign.py`. It uses **the same underlying Ed25519 public key** as the APK receiver, but the two signed messages/protocols are NOT interchangeable. For protected changes, both approval contexts must be separately satisfied.
7. No owner Ed25519 encrypted private key was supplied with the Android PKCS12 signing ZIP, and GitHub `main` has **zero rulesets**. Neither signature can be bypassed; keep QA051 pending.

## Controlled release plan

- Freeze QA050: no changes to the eight protected resources until exact-scope owner unlock.
- Decide the approved QA051 update method: a cumulative change touching protected resources requires a PR-specific GitHub Ed25519 approval and an OTA-manifest-specific Ed25519 approval.
- Generate the owner approval **offline**, with the encrypted Ed25519 key held on the owner's private device. Share only the public signed approval JSON, never the private key, password, or full signing ZIP.
- Only after branch rulesets and full owner-phone regressions: sign the owner-qa RSA envelope, verify all hashes against staged file bytes, test rolling back to QA050, and publish with express approval.

**Current release verdict: BLOCKED (no OTA update, no APK, no owner approval).**
