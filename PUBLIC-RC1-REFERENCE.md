# BASAIR-QURAN PUBLIC-RC1 — TILAWA FINAL LAYOUT FIX V5

- Date: 2026-09-22
- Version: `1.2.0-rc1.8`
- versionCode: `221`
- package: `app.basair.quran`
- minSdk: `23`
- targetSdk / compileSdk: `36`
- Offline Quran Library: `1.3.6`
- Baseline B212 remains preserved unchanged.

## Device-driven final Tilawa layout scope
- Word meaning is moved into the reader header area instead of occupying space above Quran lines.
- In Easy UI, the center title temporarily becomes: selected word + meaning + close control.
- Long meanings increase the header height automatically within a controlled limit.
- If the meanings pack is missing, the package warning is not used as the meaning; a compact “Download meanings” action is shown instead.
- Bottom Mushaf dock is normalized to six equal compact controls.
- Reader geometry is measured from the real page content top to the real dock top, reserving a visible gap above the dock so the final Quran line is not covered.
- Font + Reading Size is forced into compact rows: 3 choices + 3 choices, with size controls on one horizontal row.
- Existing audio, reciters, sequential recitation, navigation, Quran data and print engines are not rewritten.

## Protection / regression
- Protected B212 `classes.dex`:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- Compatibility `classes2.dex`:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- Quran `mushaf-data.js`:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- Protected Tilawa inline blocks: **42/42 PASS**
- Library manifest items: **180/180 PASS**
- Build 220 -> 221 APK payload differences: exactly **4 expected / 0 unexpected**
  - AndroidManifest.xml — version bump only
  - assets/www/index.html — V5 links only
  - assets/www/tilawa-stability-v5.css — new
  - assets/www/tilawa-stability-v5.js — new

## Artifact hashes
- Field-test APK:
  `9fd3c4b851ebbacf1159944d51cf6c675afbcf7a936c9d24e837045e58c028b5`
- Production-signed AAB:
  `0e815677140a5d21a2f6f8e7e50e50626b5487a5848e404d8f45bff5280333d0`
- Source ZIP:
  `7516b1db311a9a79937d843f87f0bd65e63b07b651cbccee2f496d7bf2ef8d84`
- Backup ZIP:
  `99aa4db33e4c8a5844cd7dff8cfff2f46002f0a68c12239c941792bd3da80e79`

## Signing / packaging
- Field APK: v1/v2/v3 signature PASS using the same B209/B212 test chain.
- Production upload AAB: signing PASS.
- Bundletool validate: PASS.
- AAB-derived Universal APK generation: PASS.
- Private signing material is not stored in GitHub.

## Field-test gate
Before locking Tilawa, verify on a real Android phone:
1. Meaning appears inside the top header, not over Quran lines.
2. Long meaning grows cleanly without covering the page.
3. Missing pack shows a compact download action only.
4. Final Quran line remains fully above the dock.
5. Six dock actions are equal and usable.
6. Font + Reading Size is laid out in compact rows.
7. Audio, reciters, sequential recitation, navigation and page tools remain stable.
