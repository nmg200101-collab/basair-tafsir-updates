# BASAIR P124 — Tafsir verse-follow resume + copy and PNG

**Owner QA OTA** — November 11, 2026. Standalone Tafsir-module update. Only the existing V694+ Universal OTA receiver can load it. No APK, P92/QA050 assets, private keys or other app modules are modified.

## User request and implementation

1. Replace redundant **standalone** “ملاحظة” chip above the ayah's four-button toolbar with **▶ متابعة / Ⅱ إيقاف المتابعة**, leaving the toolbar's “إضافة ملاحظة” intact. The button follows the currently displayed/selected ayah; all fresh ayah DOM renderings are decorated. Does not replace top header or the classic R114 settings.
2. Stopping and resuming uses the existing displayed article if it matches the requested surah/ayah/type, without calling Step2.open (which re-rendered the session's initial verse). A last position checkpoint is stored locally; transient automatic-stop recovery is bounded to four retries; explicit Stop and configured timer expiry never auto-restart.
3. On the **selected ayah's** `نسخ` button: tap copies Quran verse text and reference; press and hold 620ms to export a **PNG of only the Qur'an verse card**, excluding tafsir commentary and UI controls. DOM snapshot uses styled SVG foreignObject => Canvas PNG; when disallowed by Android WebView, a matching verse-only canvas fallback is used. Image preview offers **حفظ الصورة** and **مشاركة الصورة**. Saving via anchor or `navigator.share(files)` still depends on Android WebView support; real device acceptance is needed.

## Signed release facts

- `p121/owner-qa/release.json` schema `basair-universal-ota-v1` with `sequence: 2`, `minAppVersion: 694`, **`deliveryMode: notify`**.
- Exactly one module: `tafsir` version 1, with CSS and JS assets inside `p121/owner-qa/modules/tafsir/`.
- RSA PKCS#1 v1.5 / SHA-256 signature verified against V694's embedded owner public key, SHA-256 file hashes verified byte for byte. No Ed25519 approval needed because no protected `tilawa`, `shared`, `navigation`, `reciters` modules or P92 files change.
- The owner can select `automatic` in a **subsequent new signed release**. Do not mutate an already signed `deliveryMode`.
- P123 draft PR #34 is superseded (it targeted the same sequence 2 but was never merged); do not merge it afterward.

## Verification (offline)

- Playwright Chromium synthetic reader DOM: **42/42 PASS** across 320/390/430px, including verse-specific follow, stop/resume without `open()`, copy, long-press PNG bytes, no viewport overflow, retry transient stop, respect explicit stop, no JS errors. Synthetic environment only, not Android WebView.
- Node VM with the ACTUAL V694 P122 receiver and the ACTUAL signed P124 manifest/assets: **13/13 PASS**. No file fetch before manual action, two assets fetched only after click, activated on subsequent session, RSA rejects deliveryMode tampering, repeat update not re-downloaded.
- No integration against owner's *physical* Android WebView has yet occurred. Image sharing and exact pixel parity are device-dependent; report failures and use rollback if necessary.

## Owner device acceptance

Open V694 → **التحديثات الشاملة** → **فحص التحديثات** → **تحديث الآن**. Wait for verified staging. Close and reopen the app. Open Tafsir and select an ayah. Confirm new Follow chip appears above the tools, the bottom Note remains, and Stop/Resume stays at the current ayah. Short-press Copy; long-press and save PNG, then inspect the image in Android Gallery. Test dark mode and 8–10 consecutive verse handoffs. If any regression, use **التحديثات الشاملة → استعادة السابق**, restart the app; do not uninstall.

This release is owner-QA only and should not be labeled broadly stable until on-device acceptance.
