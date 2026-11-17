# P195 → P194 / Seq88 — owner-requested rollback
Date: 2026-11-17
App baseline: app.basair.qurv2 V695
Reason: Owner reported visible discrepancy in P195 digital 3D animation and explicitly requested restoration to prior release P194.
Active before rollback: P195 / Seq87 (Tilawa v205, 20 Tilawa assets, 26 Tafsir assets).
Restored signed payload: p195/P195-SEQ88-SIGNED-ROLLBACK-NOT-PUBLISHED.json (Git blob 0f937f1ec873acce1cd820f79aace3dddcda5aec).
Target after PR merge: owner-qa Seq88 (Tilawa v206, 18 Tilawa assets, 26 Tafsir assets).
Diff scope: swap ONLY p121/owner-qa/release.json for the exact pre-existing RSA3072/Ed25519 owner-signed Seq88 envelope; no changes to scripts or app files.
Verification performed:
- Seq88 restores exactly the 18 Tilawa asset descriptors from P194/Seq85: PASS.
- Seq88 Tafsir 26 asset descriptors identical to active Seq87: PASS.
- Original application ID matches app.basair.qurv2: PASS.
- Seq88 > Seq87 and Tilawa version 206 > 205: PASS.
- Signature envelopes have expected base64 lengths (RSA3072 512; Ed25519 88); do not claim field acceptance until Android checks update.
- QA-050 tilawa-owner-lock must succeed for FINAL PR commit and final merged commit.
Safety: Keep V695 APK unchanged, protect QA-050, preserve P193 green original head and P194 printed 3D turn, retain digital fonts without P195 effect.
