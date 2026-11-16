# P186 owner-rejected — restore P185 via signed Seq70
Date: 2026-11-16

## Owner field rejection
After publishing P186 / Seq69, the owner reports that font/print switching stopped completely, both in the bottom dock and Tools: one font stays displayed. Owner explicitly requests immediate safe rollback to the last normal behavior **while preserving the compact font button at the bottom**.

## Selected recovery
- Use pre-existing *independently signed* rollback envelope `p186/P186-SEQ70-OWNER-SIGNED-ROLLBACK-P185.json` to activate P185 / Seq67 **content** at a higher accepted sequence 70.
- **P185 look preserved:** last two Tilawa assets are `modules/tilawa/p185-font-cycle.css` and `modules/tilawa/p185-font-cycle.js`. These define the small bottom font button and long-press 9-choice picker.
- `tilawa.version=189` is a monotonic rollback version; the **13 Tilawa assets are exactly identical in path/size/hash/order** to saved signed P185/Seq67 baseline `p185/P185-SEQ67-OWNER-SIGNED-BEFORE-P186.json`.
- All **26 Tafsir assets** also exactly match the P185 baseline. No P186 JS/CSS and no rejected P184 JS/CSS appear among active assets.
- No APK; official signed base remains V695 (`app.basair.qurv2`).
- Archive rejected signed Seq69 under `p186/P186-SEQ69-REJECTED-BEFORE-SEQ70.json` only for audit (not referenced by the active OTA).

## Cryptographic verification
- Independent public-key verifier `verify_p186_signed.py` succeeded on signed Seq69 and Seq70 with a reference P121 APK's pinned RSA and owner Ed25519 keys. No private key was used for this verification.
- Verified exact recovered Seq70 file SHA-256: `6aede0cc28201c7c423d8c280677526edbcc1884059cbee39a611ea22a991c49`.
- Signed Seq70 Git blob: `4062180213b25d34e24252faa2a0690c754dbe16`.
- Owner approval expiration `2026-11-20T13:10:35Z`; valid at this rollback review.
- GitHub proposed active manifest matches signed rollback *byte for byte*.

## Required safeguards
- Successful `tilawa-owner-lock` on the final pull-request head before merging.
- Re-fetch `p121/owner-qa/release.json` from main after merge; check exact signed blob and `sequence=70`.
- This restores **P185**, which already had known difficulty selecting the two photographic editions. It fixes the *new regression* in which all selection stopped, **not** the earlier image-loading fault. Preserve this truthful distinction.
- Android V695 acceptance remains pending until owner opens application online, allows automatic update and restarts, then verifies digital font switching plus unchanged bottom button and long-press choices.
