# BASAIR-QURAN PUBLIC-RC1 — TILAWA WORD MEANING B227

- Date: 2026-09-22
- VersionName: `1.2.0-rc1.14`
- VersionCode: `227`
- Package: `app.basair.rc20s`
- Base APK: `B226 INSTALL FIX`
- Source functional base: B225/B226
- Target SDK: 36

## Scope
Final word-meaning behavior correction only.

### UI
- Word meaning reuses the existing `#v194s3SurahBadge` location (Makki/Madani + Surah badge position).
- Selected word appears in its own white framed box.
- Meaning appears in a second white framed box that fills the rest of the row.
- Compact close control is in the same row.
- Long meaning wraps up to three lines.
- Quran page layout does not participate in this badge change, so it should not move.

### Direct selected-word retrieval
- If the meaning is already local/cached, it appears immediately.
- If not, the meaning frame shows: `تنزيل معنى هذه الكلمة`.
- Pressing it uses the existing network word-resolution path for the current surah/ayah/word/position.
- It does **not** call the full meanings-bundle downloader.
- It does **not** reference the 10MB meanings-bundle URL.
- Only the resolved selected-word record is persisted to localStorage/cache.
- On success, the same meaning frame updates immediately without tapping the Quran word again.
- On failure, the same frame becomes a compact retry action.
- Closing restores the original Makki/Madani + Surah badge.

## Stability
New B227 script:
- no MutationObserver
- no setInterval
- no startup DOM mutation
- no full pack download call
- event-driven only: word tap / direct selected-word retrieval / close

## Protected hashes (B226 == B227)
- classes.dex:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- classes2.dex:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- resources.arsc:
  `cc7b3efd55d9d67a131c168477f1cca4edf8e203e0982a68d7fd8bec59a34b37`
- mushaf-data.js:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`

## APK payload diff vs B226
Exactly four expected differences (signature files excluded):
1. AndroidManifest.xml — version only
2. assets/www/index.html — B227 CSS/JS links only
3. assets/www/tilawa-word-meaning-b227.css — new
4. assets/www/tilawa-word-meaning-b227.js — new

Unexpected differences: **0**

## Library
- Manifest items: 180
- SHA-256: 180/180 PASS

## Package QA
- APK ZIP integrity: PASS
- zipalign: PASS
- APK v1/v2/v3 signatures: PASS
- Field signer SHA-256:
  `606d3692df3a6932e0cbe0f0094bd370f99827899cba8e284547cfb840c2443d`
- Package identity: `app.basair.rc20s` PASS
- AAB production upload signing: PASS
- Bundletool validate: PASS
- AAB-derived universal APK generation: PASS

## Artifact hashes
- APK:
  `1d992245a707685f5bd28378105647111c874bee8a30f9c26272bd192bb8a5a1`
- AAB:
  `504805e784896d395622655edbfeabce818119ccc4c717b1fb7956a5a10b4e85`
- Source ZIP:
  `5a4813751a525a81bde22f62377d49fc0ec7309b2596cec60f63adfdf97ce414`
- Backup ZIP:
  `699eb612b411a9cf37fdf9dcdfde5bbf62972d6d63cf8b3fdf584d5db0721a8d`

## Field gate
Install B227 over B226 without clearing data.
Validate:
1. Cold start passes splash.
2. Tap a Quran word.
3. Makki/Madani badge is replaced in-place by word frame + meaning frame.
4. Quran page remains fixed.
5. Missing local meaning shows only “تنزيل معنى هذه الكلمة”.
6. Press it and confirm the full meanings-package download does not start.
7. Meaning appears in the same frame after success.
8. Close restores Makki/Madani badge.

Do not lock Tilawa until these pass on a real Android device.
