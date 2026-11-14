# P159 / Seq36 — Root-cause audit: V694/V695 OTA receiver compatibility

## Actual owner report
On 2026-11-14, the owner confirmed P156/P157/P158 never visibly applied after force-closing and reopening V695. Tafsir index still briefly presents two layouts; notes/actions/scroll may freeze. The release manifests were signed and merged on GitHub, but that is **not** proof of device delivery.

## Proven failure against the original signed APK receiver
The owner-provided authentic `BASAIR-QURAN-V694-P122-DUAL-MODE-OTA-OWNER-SIGNED-TEST.apk` was extracted **locally**; its original `assets/www/p121/universal-updates.js` declares `APP_VERSION = 694`. The exact `verifyEnvelope()` extracted from that file enforces `m.minAppVersion > APP_VERSION` as a fatal incompatible-manifest error. No update is downloaded, no `highestSequence` is advanced.

All P156 (Seq33), P157 (Seq34), and P158 (Seq35) were signed with `minAppVersion=695`. P155 Seq32 was signed with `minAppVersion=694`.

The same authentic receiver method, executed using Node WebCrypto and the ORIGINAL owner RSA public key, yielded:
- P158 Seq35 with receiver=694: **REJECTED**, `البيان غير متوافق مع إصدار التطبيق`.
- P158 Seq35 with receiver=695: **ACCEPTED**, Seq35.
- Newly signed P159 Seq36 with receiver=694: **ACCEPTED**, Seq36.
- Newly signed P159 Seq36 with receiver=695: **ACCEPTED**, Seq36.

The Library's `BASAIR-V695-ANDROID-SOURCE-RECOVERY-20261112.zip` prepares its WWW from the exact V694 signed APK and preserves those files without patching the updater. This makes the same hardcoded-694 receiver plausible on V695, **but the actual installed V695 APK was not available for direct byte-level confirmation**.

## Compatible correction
- Deliver a new owner-signed Seq36, Tafsir module v34, `minAppVersion=694`, `deliveryMode=automatic`.
- Keep the precise four CSS/JS assets of the previously signed P158 Seq35 (P157 index plus P158 note placement) **byte-for-byte identical**, retaining all size/SHA256 attestations.
- No change to V694/V695 Android, no change to root update receiver, and no new listener/observer or visual framework.
- Saved data, Quran text, Tilawa QA050, Hifz, audio, navigation and package identity remain untouched.
- Signature uses the owner's original RSA-3072 certificate via a **local-only signer**. Private materials were never committed.
- Exact signed Seq35 rollback preserved in `p121/owner-qa/release-p158-seq35-before-p159-20261114.json`.

## Release acceptance gate
1. Owner-original RSA signature verifies; original V694 receiver's strict schema/minVersion/ID/date rules accept Seq36.
2. All four assets match SHA256 byte-for-byte; only Tafsir module.
3. GitHub QA050 `guarded-change-check` success required before merging.
4. On-device QA still mandatory. GitHub merge does NOT prove the Android device downloaded, installed, or rendered the correction. If the owner still sees no difference, collect the exact V695 APK and the OTA runtime status; do not issue another speculative cosmetic Seq37.

## Permanent app correction (separate Android update, only with owner approval)
In a future V696 or higher APK, remove the hardcoded obsolete receiver value; bind it securely to Android's real `versionCode` (through a strictly scoped native bridge or generated build constant). Expose read-only OTA diagnostics: `reported APP_VERSION`, `highestSequence`, `active.tafsir.version`, signature validation error, download status, initialization and rollbacks, without leaking user notes or credentials. Validate two restarts and verify the actual WebView native reader has one consistent toolbar/scroll owner before calling it stable.
