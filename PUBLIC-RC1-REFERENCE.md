# BASAIR-QURAN PUBLIC-RC1 — TILAWA STABILITY V2

- Date: 2026-09-22
- Version: `1.2.0-rc1.5`
- versionCode: `218`
- package: `app.basair.rc20s`
- minSdk: `23`
- targetSdk / compileSdk: `36`
- Offline Quran Library: `1.3.6`
- Baseline B212 remains preserved unchanged.

## Scope
Final remaining Tilawa UI stabilization after Build 217. Top Tilawa/Mushaf headers and recitation engines remain untouched.

### Implemented
- `الخط وحجم القراءة` is permanently pinned as the first Page Tools block and no longer behaves as another collapsible duplicate tab.
- Duplicate inner `إعدادات القراءة` heading is removed while keeping the actual reader/speed/timer/focus controls.
- Page Tools downloads are presented through one organized `التنزيلات والحزم` entry that opens the real unified Download Library.
- The previous ad-hoc download block inside the font pane is removed.
- `#stableMeaning` is visually reorganized as a professional reader card above the bottom dock; lookup logic is unchanged.
- A persistent DOM guard moves `packCard` to the unified Download Library and removes `v143PackMenu` if older layers recreate it, so `حزمة الصفحات` cannot remain above the Surah chooser.
- Existing automatic fonts remain static/pinned.

## Protection
- Protected B212 `classes.dex` SHA-256:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- Quran `mushaf-data.js` SHA-256:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- Compatibility `classes2.dex` SHA-256:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- Build 217 -> 218 APP_SOURCE differences:
  - `assets/www/index.html`: only V2 CSS/JS links appended
  - `assets/www/tilawa-stability-v2.css`: new
  - `assets/www/tilawa-stability-v2.js`: new
- Unexpected APP_SOURCE differences: **0**
- Existing Tilawa tools markup: preserved
- Mushaf top reader header markup: preserved
- Existing sequential recitation control markup: preserved
- Existing `index.html` is byte-identical after removing the V2 link block.

## Offline library validation
- Library version: `1.3.6`
- Manifest items: `180`
- All item SHA-256 checks: **180/180 PASS**

## Artifact hashes
- Field-test APK:
  `ee523262a63dd037823d5794a83e1c72750ec37e45789824bbf81cf74b370959`
- Production-signed AAB:
  `460af434ce20e44103725fce29d74e829518e0c8e48328e023490ffef79d755e`
- Source ZIP:
  `8c5ace656a63d5c42be0018ba41d295d29732da1d34f781f442b07cdab62a6e2`
- Backup ZIP:
  `aa1f473fb45978dbf981a84544bab5b4648d6a57548f398be4f9e874aab49fda`

## Signing / package QA
- Field-test APK: PASS with v1/v2/v3 signature schemes on the existing B209/B212 test chain.
- AAB production upload signing: PASS.
- Bundletool manifest validation: PASS.
- AAB-derived Universal APK generation: PASS.
- No private signing material is stored in GitHub.

## Release gate
Static/package QA: PASS.
Physical Android validation is still required before Tilawa is locked:
1. Font + reading size remains fixed at the top of Page Tools.
2. No duplicate Reading Settings heading.
3. Downloads group opens the unified Download Library correctly.
4. Word meaning card is visually accepted in light/dark mode.
5. Mushaf page package never reappears above the Surah chooser after reopening Tilawa.
6. Audio, reciters, silent/audio sequential recitation, page gestures and navigation remain functional.
