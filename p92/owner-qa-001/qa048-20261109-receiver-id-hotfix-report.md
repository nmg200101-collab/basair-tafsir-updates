# Basair Quran QA-048 — Signed manifest ID hotfix (9 Nov 2026)

## Owner's actual Android error
Screenshot: «تعذر الفحص: قائمة ملفات غير صالحة» after tapping **فحص التحديث**.

## Root cause proven from the original signed V690 receiver
In `assets/www/p92/remote-updates.js`, the V690 `parseSignedEnvelope` enforces `/^[A-Za-z0-9._-]{1,50}$/` for `manifest.id`; the original QA048 published ID had **63 characters**, causing this exact error message. The manifest was correctly signed but still rejected by this independent policy check.

## Repair
- Preserve QA048 **sequence=48**, channel `owner-qa`, schema1, minAppVersion=690, title and all eight asset descriptors **byte-for-byte / object-identical** (paths, sizes, SHA256 hashes, kinds).
- Shorten only `id` to **`P114-QA048-ORIGINAL-TEXT-BLUE-FRAME`** (35 chars), matching V690 regex.
- Sign the corrected payload with the SAME owner's original RSA private signing key, verify RSA PKCS#1 v1.5 SHA256 using the original certificate and V690 pinned public key. No signing keys or credentials uploaded.
- Signed candidate: `release-qa-048-fixed-id-owner-signed-20261109.json`.
- The faulty signed manifest is already archived as `release-qa-048-signed-candidate-20261109.json`. QA047 signed pre-QA048 rollback archive remains `release-qa-047-before-qa048-20261109.json`.

## Verification
- Exact rejection reproduced by the receiver's identifier regex on 63-char ID; corrected 35-char ID passes.
- Eight paths permitted, all size/sha256 descriptors match existing published QA048; total resources **301156 bytes**, no changes to code, font, Quran pages, reciters or app version.
- Owner signature was verified offline by the original certificate; app pinned public key matches.
- Android phone **not** yet rechecked after the manifest change; user should press `فحص التحديث` again, then install QA048.

## Release procedure
Merge only this signed candidate + report; read current main release and compare original failing blob SHA before replacing `p92/owner-qa-001/release.json`. Read back and confirm corrected ID and signature. No APK distribution and no changes to active application content until user confirms update installation.
