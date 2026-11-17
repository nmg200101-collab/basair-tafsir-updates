# P206 — Independent signature audit and publication safety gate

Date: 2026-11-17. Application: `app.basair.qurv2`, installed base V695.
Status: **SIGNED / HELD / NOT DEPLOYED**.

## Independent, local public-key verification of delivered archive

Evidence source: owner-provided `BASAIR-P206-OWNER-SIGNED-HELD-SEQ111-SEQ112.zip`. ZIP CRC passed. Both signed envelopes were decoded and their P121 manifest compatibility independently checked using the actual pinned original RSA3072 signing certificate and the Ed25519 PUBLIC key extracted from the encrypted P119 backup. No private signing key was re-used for this verification.

| Candidate | Sequence | Modules (version) | Asset descriptors | Envelope SHA256 | RSA3072 | Ed25519 approval |
| --- | ---: | --- | ---: | --- | --- | --- |
| P206 follow/updates | 111 | tafsir:51 / tilawa:229 / updates:198 | 41 | `ec617c3633b295f792b8452fae72f298fac1d72d4d62466768dc6e36bcd7f8bd` | PASS | PASS |
| Emergency revert | 112 | tafsir:51 / tilawa:230 / updates:199 | 38 | `f5b9e9e5477bbf490fe03c8c1d633a9e99fd324b33d1f7714b799295c5509732` | PASS | PASS |

Validated: P121 envelope shape, signatures, Ed25519 signed canonical protected-module hash, same `app.basair.qurv2`, `owner-qa`, original RSA3072 certificate SPKI pin, duplicate-asset-path rejection, Seq111/112 IDs, `minAppVersion=694` compatible with V695, manifest issue and expiration dates. Owner approval expiration is **2026-11-22T17:37:20Z**; re-sign if expired or payload/source changes.

**This independent test proves signatures and manifest metadata, not WebView functionality.** Existing source CI checked the 41/38 underlying repository asset hash records, but a full repeat of all assets against signed envelopes must be performed on the exact merge commit before release.

## Critical P121 auto-publish hazard (confirmed from original source)

Source: `basair-quran-p88-build`, `feature/p121-universal-owner-signed-ota-20261111/p121-universal-staging/universal-updates.js`.
- The original engine pins the LIVE manifest to `https://raw.githubusercontent.com/nmg200101-collab/basair-tafsir-updates/main/p121/owner-qa/release.json`.
- It **automatically calls install()** when a newer manifest is present, shortly after startup, when app visibility resumes and on a recurring check.
- Therefore replacing LIVE `release.json` with Seq111 is an actual release to all clients using that owner-qa channel, **not** a one-device preview. The signed `deliveryMode:automatic` string is not a safe owner-only test switch: original P121 auto-install code does not gate on this field.
- The branch has not altered the LIVE signed manifest; P205/Seq109 remains active at last read.

## Not yet proven and absolute release blockers

1. Real V695 device (original and Tajwid editions): first tap engages Follow, text/frame visible during page movement, correct sequential audio/scroll, Pause / Resume, Stop to the ORIGINAL static framed page without an old scroll layer or duplicate border.
2. Zoom 100% and scaled settings, dark mode, manual scroll, reciter switch and cold restart do not regress accepted QA-050 baseline.
3. Archive actually retains at most six **owner field-approved** complete signed snapshots after real installs; test recovery if a device is interrupted while applying rollback and return-to-newer snapshot.
4. A controlled device-only canary channel is not available in the original pinned P121 source. Do **not** label the LIVE owner-qa channel a canary. No device-only OTA publication until there is a verified safe route.
5. Verify exact signed SHA256 for every changed module asset on the final candidate, PR merge commit and live host, verify QA-050 on the exact final commit, and preserve the independent Seq112 emergency envelope.
6. Explicit owner approval to activate after field evidence (approval of a plan is not evidence of a device PASS).

## Release action decision

**HOLD**: do not merge PR #153 as an active release, and do not replace `p121/owner-qa/release.json`, build APK or change signing keys. Safe work to continue: source QA, public-key verification, isolated previews, and documenting a real-device acceptance procedure. Store secret backups exclusively offline.

Note: QA-050 GitHub guard PASS for a staging-only PR only means no already-protected QA-050 paths were changed without a separate unlock; it is **not a substitute for the required field regression test**.
