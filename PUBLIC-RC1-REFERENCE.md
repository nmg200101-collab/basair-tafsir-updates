# BASAIR-QURAN PUBLIC-RC1 — TILAWA WORD MEANING B227

- Date: 2026-09-22
- VersionName: `1.2.0-rc1.14`
- VersionCode: `227`
- Package: `app.basair.rc20s`
- Launch activity: `app.basair.quran.Rc1Activity`
- Min SDK: `23`
- Target/Compile SDK: `36`
- Device-installable base lineage: B226 Installation Fix -> field-opening B224

## User-visible scope
When the user taps a Quran word:
- the Makki/Madani badge is temporarily hidden;
- one compact white/green row appears in the same badge area;
- the selected word is in its own framed box;
- the meaning uses a separate framed box that fills the remaining row width;
- close restores the original Makki/Madani badge;
- the Mushaf page layout/scroll is not moved by the meaning row.

If the full meanings bundle is already installed, the existing local meaning is used immediately.

If the meaning is not available locally:
- the meaning frame shows `تنزيل معنى هذه الكلمة ↓`;
- pressing it downloads only the selected word record;
- the complete meanings bundle is NOT downloaded;
- the downloaded word is cached locally in IndexedDB;
- the meaning replaces the download action immediately after success;
- the same word can then be read offline from cache.

## Per-word meanings API
Repository: `nmg200101-collab/basair-tafsir-updates`
API commit: `029a332809bac1160967c6490be8b130c30e4046`
Path: `public-assets/meanings-word-api/v1`

Manifest:
- records: 77,432
- surahs: 114
- ranged data bytes: 10,041,910
- ranged data SHA-256: `d192f636f88c7533d6d77936270fbbae7df0e2a724a464414e979053165e0954`
- source bundle SHA-256: `db6025c825fda31a9b2c195ecf7d4eb812a8e3898a7bd8569e23ca0d18c387f3`

Transport:
1. fetch a small per-surah index;
2. resolve `ayah:word_position -> [byte_offset, byte_length]`;
3. HTTP Range fetch only those bytes from `words.ndjson`;
4. reject the response unless HTTP status is exactly `206 Partial Content`;
5. validate byte length and returned s/a/p coordinates;
6. cache only the selected record.

GitHub Actions validation:
- GitHub Raw byte ranges: PASS / HTTP 206
- generated API boundaries/random records: PASS
- real exact-range word test: PASS
- sample tested: Surah 1 / Ayah 1 / Word 1

## Startup/stability constraints
B227 adds:
- no MutationObserver
- no setInterval
- no setTimeout
- no startup network request

New per-word cache/network work starts only after actual word interaction.

## Protected hashes
- `classes.dex`:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- `classes2.dex`:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- `mushaf-data.js`:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- `resources.arsc`:
  `cc7b3efd55d9d67a131c168477f1cca4edf8e203e0982a68d7fd8bec59a34b37`

## B226 -> B227 APK payload diff
Added:
- `assets/www/tilawa-word-meaning-b227.css`
- `assets/www/tilawa-word-meaning-b227.js`

Changed:
- `AndroidManifest.xml` — version bump
- `assets/www/index.html` — B227 links and targeted word-meaning delegation/fallback

Removed: none
Unexpected differences: **0**

Critical APK storage is preserved exactly like B226:
- classes.dex: STORED
- classes2.dex: STORED
- resources.arsc: STORED

## Regression checks
- APK ZIP integrity: PASS
- zipalign P16 / 4-byte: PASS
- APK signature v1/v2/v3: PASS
- signer SHA-256:
  `606d3692df3a6932e0cbe0f0094bd370f99827899cba8e284547cfb840c2443d`
- libraryVersion: 1.3.6
- Library manifest hashes: 180/180 PASS
- AAB Bundletool validation: PASS
- AAB-derived universal APK: PASS

## Artifact hashes
- APK:
  `268df0c4dd5e7f94665ba86d2dc775a30acd16ba7c70ab70712f29cd8da68ff5`
- AAB:
  `64afa5833dcd2d035630a7d3a57af634bd1d72cc58268501e68118d2a708461d`
- Source ZIP:
  `5b6689bbe80726494ca0a8701ecc2d38e4d6c158f0364b3aace379a02e4ac4ba`
- Backup ZIP:
  `e4ef117ff08cce6b6c7a248fbca35b424b54f9516caf5c231a2956d666e91dc0`
- AAB-derived universal APK:
  `94177006ca8091c9c742bf9034e94f7b6b4dc1efcc5c180bf96e70cfd759c41e`

## Field gate
B227 is a final-lock candidate, not yet final locked.

Required real-device acceptance:
1. install over B226 without clearing data;
2. cold start passes splash;
3. tap a word with full meanings bundle absent;
4. Makki/Madani badge is replaced by word-frame + meaning/download-frame in one row;
5. download action fetches only that selected word and immediately displays it;
6. close/reopen the same word offline reads from per-word cache;
7. close restores Makki/Madani badge without moving the Mushaf page;
8. long meaning remains visually controlled;
9. audio, reciters, sequential recitation, search, index, tools, page turning and back remain stable.

Only after user acceptance should Tilawa be marked FINAL LOCKED.
