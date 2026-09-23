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

---

# TAFSIR UI STABILITY B229 — FIELD CANDIDATE

- Date: 2026-09-23
- VersionName: `1.2.0-rc1.16`
- VersionCode: `229`
- Package: `app.basair.rc20s`
- Base: B228, with Tilawa remaining FINAL LOCKED.

## Scope
Tafsir/Tadabbur UI/windows/options only. No Tafsir content engine, Quran text, Tilawa engine, audio, Hifz, or Quran Library engine changes.

## UI stabilization
- All Tafsir search entry points route to the existing Step109 unified search.
- Legacy duplicate search is hidden/routed away.
- Tafsir text-size control restored as compact `[-] [%] [+] [قياسي]`, using the existing `v194T4Font` preference and `--t4font` variable.
- Reading Tools keeps one Library action; the duplicate large Library setting is replaced by the font control.
- Library keeps core/optional Tafsir sources visible first; update/restore/status tools move under collapsed `إدارة المحتوى والتحديثات`.
- Phone readability and touch targets improved.
- Four existing reader layouts remain unchanged in behavior.
- Back behavior and Tafsir data/update engines are preserved.

## B228 -> B229 APK diff
Exactly four expected non-signature payload differences:
1. `AndroidManifest.xml` — version only.
2. `assets/www/index.html` — B229 CSS/JS links appended at the end only.
3. `assets/www/tafsir-ui-stability-b229.css` — new.
4. `assets/www/tafsir-ui-stability-b229.js` — new.

Unexpected payload differences: **0**.

## Protected B228 content unchanged
- `classes.dex`: `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- `classes2.dex`: `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- `resources.arsc`: `cc7b3efd55d9d67a131c168477f1cca4edf8e203e0982a68d7fd8bec59a34b37`
- `assets/www/assets/mushaf-data.js`: `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- Library manifest SHA: **180/180 PASS**.

Critical APK storage remains field-proven:
- classes.dex: STORED
- classes2.dex: STORED
- resources.arsc: STORED

## QA
- B229 JavaScript syntax: PASS.
- New MutationObserver: 0.
- New setInterval: 0.
- Mock UI interaction test: PASS (unified search routing, legacy handler suppression, font control, single library route, collapsed management section).
- APK zipalign: PASS.
- APK signatures v1/v2/v3: PASS.
- Field signer SHA-256: `606d3692df3a6932e0cbe0f0094bd370f99827899cba8e284547cfb840c2443d`.
- AAB production upload signing: PASS.
- bundletool validate: PASS.
- AAB-derived universal APK generation/package parse: PASS.

## Artifact hashes
- APK: `b9fed57328e0400d06b1ecdf3dd57a607588614b80a8c6a85571fee2045519e3`
- AAB: `ecb4b269aa4ccd8ccd0bd447e087e3019ededc21e2b2c221fda307c5a4ee6817`
- Source ZIP: `de75d13289651e44e365fb8ab160a6bf057c956abd9b0cac7623e932346d18b2`
- Backup ZIP: `0e5440b0c219df136409921c71f6453322bf4c3cdcc52944fd4001acaf969063`

## Field gate
B229 is a **Tafsir UI field candidate**, not a Tafsir final lock yet. Install over B228 without clearing data and verify: Home/cold start, Tafsir index, unified search from both entry points, one Library action, text-size controls, Library management, four layouts, save/copy/share/open-in-Tilawa, Back sequence, night mode, and unchanged B228 Tilawa behavior.
