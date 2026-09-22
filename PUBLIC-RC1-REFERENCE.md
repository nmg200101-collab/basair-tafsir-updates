# BASAIR-QURAN PUBLIC-RC1 — TILAWA STABILITY V1

- Date: 2026-09-22
- Version: `1.2.0-rc1.4`
- versionCode: `217`
- package: `app.basair.rc20s`
- minSdk: `23`
- targetSdk / compileSdk: `36`
- Offline Quran Library: `1.3.6`
- Baseline B212 remains preserved unchanged.

## Scope
Tilawa stabilization only. The existing Tilawa/Mushaf top headers were preserved exactly.

### Tilawa UI stabilization
- Sequential recitation remains the existing engine and is explicitly visible in the Mushaf bottom dock.
- The bottom dock remains six actions; the later Downloads shortcut no longer consumes a dock slot.
- Downloads/packages stay available through the existing unified Download Library and are exposed from Page Tools.
- Quran page pack is no longer shown above the Surah chooser.
- Existing automatic fonts remain pinned/static in Page Tools.
- No item was added to the Tilawa page header.
- Existing audio, reciters, verse navigation, sequential audio/silent handlers and Mushaf data were not rewritten.

## Protected verification
- Original B212 `classes.dex` SHA-256:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- Compatibility `classes2.dex` SHA-256:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- Quran `mushaf-data.js` SHA-256:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- Existing Tilawa protected inline blocks: **42/42 SHA-256 PASS**
- Tilawa index header markup: unchanged
- Mushaf reader header markup: unchanged
- Original Mushaf dock HTML markup: unchanged
- Build 216 -> 217 APK payload differences: 5 expected / **0 unexpected**

## Offline library validation
- Library version: `1.3.6`
- Manifest items: `180`
- All manifest item SHA-256 checks: PASS.

## Artifact hashes
- Field-test APK:
  `b46f52dcd89144875959295f776d03e1313eb95f4dde201cc92c3be6d09789f1`
- Production-signed AAB:
  `36ad40aec31d3151124a1a37bb8c3341db898edd11f396f12f3bb81e5df1cef7`
- Source ZIP:
  `7a78227d7f482a887a0417fa1c946b088d6365ed4afa78cd9ee91b5ac2ae4d86`
- Backup ZIP:
  `fe82d50a3fcd1b622074ed78481f2049b766b164dd4e63969ad5c548695ce845`
- AAB-derived universal verification APK:
  `0fc1e65253630b7d9d9ad5b7a80a86a220997784fc535f00f024a3e7d2c18642`

## Signing
- Field-test APK retains the B209/B212 test signing chain for in-place testing.
- AAB uses the separate production upload key.
- Private signing material is not stored in GitHub.

## Release gate
Static/package QA: PASS.
Real-device validation is still required for audio playback, reciter switching, page gestures, long-session stability and final visual acceptance before Tilawa is locked and the project moves to Tafsir audit.
