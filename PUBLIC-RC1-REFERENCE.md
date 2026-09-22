# BASAIR-QURAN PUBLIC-RC1 — TILAWA FINAL LOCK B228

- Date: 2026-09-22
- VersionName: `1.2.0-rc1.15`
- VersionCode: `228`
- Package: `app.basair.rc20s`
- Base: B227 field-approved visual layout
- Target/Compile SDK: `36`

## Final Tilawa correction
The last Tilawa issue was the selected-word meaning download path.

B227 used the legacy `v130ResolveMeaning` network chain for a missing word meaning. That chain can traverse several external sources and may end in a retry/failure state.

B228 removes that path from the direct download action.

### Direct selected-word API
- Visual layout remains exactly B227.
- Local/contextual/cached meanings still display immediately.
- Missing meaning shows `تنزيل معنى هذه الكلمة`.
- Pressing it uses the Basair Per-Word Meaning API only.
- API commit pinned in app:
  `029a332809bac1160967c6490be8b130c30e4046`
- Per-surah index supplies the exact byte offset/length.
- The app performs an HTTP Range request for the selected word record only.
- The full meanings bundle is never started from this action.
- The changed B228 script contains no old meanings-bundle URL and no `downloadPack()` call.
- On success, only the selected meaning record is cached and shown immediately.
- On failure, the same frame shows one compact retry action; no visible attempt counter and no legacy multi-source chain.

## Basair Per-Word Meaning API
- Generated records: 77,432
- Surahs: 114
- Data format: range-addressable NDJSON
- Latest API generation/verification workflow observed: SUCCESS
- The workflow validates HTTP 206 Range responses and exact selected-record contents.

## Protection
- classes.dex:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- classes2.dex:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- resources.arsc:
  `cc7b3efd55d9d67a131c168477f1cca4edf8e203e0982a68d7fd8bec59a34b37`
- mushaf-data.js:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`

## Diff vs B227
APK payload differences, excluding signature files: exactly **2**
1. `AndroidManifest.xml` — version only
2. `assets/www/tilawa-word-meaning-b227.js` — selected-word transport only

Unexpected APK differences: **0**

Source differences vs B227: exactly **2**
1. `RC1_BUILD/AndroidManifest.xml`
2. `APP_SOURCE/assets/www/tilawa-word-meaning-b227.js`

Library manifest verification: **180/180 PASS**

## Packaging
Critical APK entries preserve field-proven storage:
- classes.dex: STORED
- classes2.dex: STORED
- resources.arsc: STORED

APK ZIP integrity: PASS
zipalign: PASS
APK signatures v1/v2/v3: PASS
Field signer SHA-256:
`606d3692df3a6932e0cbe0f0094bd370f99827899cba8e284547cfb840c2443d`

AAB production upload signing: PASS
Bundletool validate: PASS
AAB-derived Universal APK: PASS

## Artifact hashes
- APK:
  `b351e94fe8bf293e588b7ea66d8b71a98142362f43526a3791e34fad5165b920`
- AAB:
  `0451479fd1336cc76892ae2ec5785e23b3d624f4450e7c649ea462a6c083f94a`
- Source ZIP:
  `d56f4ef4ef86997393be04e71cdf6b4b01da9d92a1028cf7b2487b2bd8fcc374`
- Backup ZIP:
  `acff64842060a5fedbc742226420d999de17d2d1703dfa31dc52a078738e11d5`

## FINAL LOCK RULE
Tilawa is now **FINAL LOCKED on B228**.

Do not modify Tilawa during Tafsir, Hifz, Library, or full-app audit.
The only exception is a real, reproducible regression demonstrated on a physical device. Any such correction must preserve the B228 visual layout and protected hashes.
