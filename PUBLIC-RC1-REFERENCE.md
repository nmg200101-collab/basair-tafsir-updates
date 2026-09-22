# BASAIR-QURAN PUBLIC-RC1 — TILAWA FINAL LOCK V3

- Date: 2026-09-22
- Version: `1.2.0-rc1.6`
- versionCode: `219`
- package: `app.basair.rc20s`
- minSdk: `23`
- targetSdk / compileSdk: `36`
- Offline Quran Library: `1.3.6`
- Baseline B212 remains preserved unchanged.

## Final Tilawa correction
This is the final Tilawa lock candidate. Scope is visual-only on top of Build 218.

- Word meaning card is now compact and positioned at the top of the Mushaf reader, immediately below the existing reader header.
- Expanded alternate meanings remain scrollable.
- Font + Reading Size remains permanently pinned/stable.
- Font + Reading Size visual design is restored to the prior coordinated Basair design: green Arabic-A icon, organized font choices, balanced +/- controls and standard reset.
- No new item was added to the Tilawa/Mushaf top header.
- All Build 218 Tilawa stabilization remains in place: sequential recitation visibility, downloads organization, duplicate Reading Settings removal, page-package guard, and unified download route.

## Protection / regression
- Protected B212 `classes.dex`:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- Compatibility `classes2.dex`:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- Quran `mushaf-data.js`:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- Build 218 -> 219 unsigned payload differences: exactly 3:
  - `AndroidManifest.xml` — version bump only
  - `assets/www/index.html` — one final CSS link
  - `assets/www/tilawa-stability-v3.css` — new final visual-only layer
- Unexpected payload differences: **0**

## Offline library validation
- Library version: `1.3.6`
- Manifest items: `180`
- SHA-256 checks: **180/180 PASS**

## Artifact hashes
- Field-test APK:
  `f75042247bb2589f407eed00ae606bc9da8d2b8278bd231128c6c490ab7cce61`
- Production-signed AAB:
  `31111096e1c681002a6725985ebb17682b6551c9f1bd827995961f3a80e6dfd0`
- Source ZIP:
  `92bfb4e3cfca32a52105f6e06776c1bf661dad717296af44dbeed721cb8c2c9b`
- Backup ZIP:
  `f5f0fce40b0a98c0da0635b859e4a5c7bad97198980aa845e8d963640a4f8ff5`

## Package QA
- Field APK: v1/v2/v3 signature PASS using existing B209/B212 test chain.
- AAB production upload signing: PASS.
- Bundletool manifest validation: PASS.
- AAB-derived Universal APK generation: PASS.
- Private signing material is not committed to GitHub.

## Lock rule
After user acceptance on a real Android phone, Tilawa is considered **FINAL LOCKED**.
During Tafsir, Hifz and Library audits, do not modify Tilawa unless a true regression is demonstrated.
