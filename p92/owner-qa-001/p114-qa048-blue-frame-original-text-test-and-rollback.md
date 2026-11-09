# BASAIR P114 / QA-048 — BLUE ORNAMENT (QA046 STYLE) + EXACT ORIGINAL QURAN IMAGE INK

## Owner direction
The field screenshot after QA047 shows the purple original ornamental border still visible beneath a narrow blue outline. Owner explicitly rejected that: **restore the former blue/turquoise ornamental border**, while making the Quran text and line arrangement exactly the original printed edition. Applies to opening pages 1 and 2 and all 604 pages.

## Narrow, safe implementation
- Preserve the original `img[data-mushaf-page]` source and bounding rectangle unchanged, *including the Quran words, line breaks, Basmala, verse medallions, text shapes and highlights*. Do not generate new Quran letters or manipulate word DOM.
- The QA046 blue motif is reused from its original SVG definition. Only side-bar width slightly reduced to ensure the smallest Quran-page left/right text margin stays clear.
- **Mask** the existing purple/brown printed border via CSS clipping restricted to the outer margin (6.4% top, 9.2% left/right, 6.3% bottom). Place a paper-coloured blue-frame SVG (opaque in its ornamental border, TRANSPARENT in text body) so the old purple border cannot show through.
- The header surah title is a **non-Quran UI label** sourced exclusively from `window.LOCAL_QURAN`; the juz name from existing native `.v143MuallamHead`. Footer page number is a UI label. No title is invented when source metadata is unavailable.
- Image source bytes, image geometry, audio source records and downloaded files are never changed.
- Exclude QA046 *entire* word-reflow canvas and QA047 transparent-over-original border code from the cumulative file: the last file is **QA045 byte-identical prefix plus narrow QA048 script**.
- Hide stale QA046 text layer and QA047 overlay only when print mode is `blue`; preserve original and Tajwid edition. Retain exact native `ayahHitLayer` and clickable `ayahHit` positions.
- **Fail open**: do not add a new border to a not-yet-loaded original image; attach load/error listeners and rescan.
- Applies only in standard tilawa print; excludes Hifz, review, teacher and digital print. No APK, package ID or permanent settings change.

## Static / browser tests
- JavaScript syntax PASS.
- Mobile screenshot crop of **owner's real page 6** tested as sample original page raster. After patch, old purple border no longer shows; body Arabic remains directly from the underlying source pixels.
- Chromium tests pages 1,2,6,604: image pixel source and x/y/w/h identical before/after; original/Tajwid mode switches show no blue-frame clipping; Quran DOM unchanged; existing `data-g` hit button preserved; no JavaScript errors.
- In-memory upgrade QA047 -> QA048 test PASS: old transparent frame hidden, new blue frame displayed, no loss of ayah hit.
- Opening-page source rasters were **not** independently available for photographic comparison in this test; require physical Android owner acceptance for page 1 and 2. Do not claim final device-perfect typography before that.
- If page image is unavailable, original image placeholder remains in control.

## Signed candidate
- Channel `owner-qa`; schema1; sequence **48**, minimum V690.
- 8 assets; first 7 signed descriptors from QA047 *unchanged*.
- Modified eighth cumulative script `p114-qa048-original-quran-blue-qa046-frame-with-qa045.js`
- UTF-8 size: 229659 bytes; SHA256 `93360bbcdb0d7a77a69a9d349159d3c5a66b94002693f225ec36adcb6eecd7ad`.
- Manifest: `release-qa-048-signed-candidate-20261109.json`; signed with original RSA owner certificate. Verify signature, asset digest, files and release sequence before activation.
- Preserve exact signed QA047 `release.json` as `release-qa-047-before-qa048-20261109.json` before publication. Reverting owner channel requires a valid *higher sequence* owner-signed candidate or app-supported rollback.

## Owner phone acceptance
1. Update V690 from QA047 to QA048 and fully reopen app.
2. P1 Al-Fatiha and P2 Al-Baqarah opening: same body ink/verse distribution as original, only one blue ornamental frame, correct surah/page title, no clipping of words.
3. Middle page (e.g. P6), P3 and P604: no purple border, no words cut off by frame, all lines match original.
4. Tap several ayahs including those near page edges; confirm shade and word meanings align with text.
5. Switch original → Uthmani blue → coloured Tajweed → original, verify each edition appears correctly with no stale frame/white flash.
6. Check Masad/Sobhi, Amer remains hidden as QA045, Hifz, Tafsir, Library, offline pages, Back.
7. If any line/word is covered, **do not adopt**; use saved QA047 rollback with proper update sequence.

**Status:** signed staging candidate, live-device check not independently performed.
