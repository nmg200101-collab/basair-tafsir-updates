# BASAIR P113 / QA-047 — Original-page geometry, blue frame only

**Owner correction (9 Nov 2026):**
> «الصفحتين الاولى اجعلى مشابهه للطبعة الاصليه بقية الصفحات نفس تنسيق الطبعة الاصليه فقط يتغير شكل البرواز»

## Implementation
- Preserve the **original printed page image for every page 1..604**, pixel size and page layout unchanged. This automatically restores page 1 (Al-Fatiha) and page 2 (Al-Baqarah opening) to their true opening-page layout. No attempt to typeset or rearrange Quran words, basmala, verse numbers or surah titles.
- Use an extremely **thin turquoise/blue frame overlay** with transparent centre; never crop or change the original raster geometry. Decorative only and pointer-events:none.
- All other pages use identical original image, line breaks, text, basmala, ayah markers and hit geometry. Existing original image may contain its own original ornamental edge; it is part of the source bitmap and is not removed by this safe design.
- Cumulative JS = exact QA045 cumulative prefix plus P113 patch; **omit QA046's text-reflow/word-moving code**. Do not delete downloaded pages, cache, sources or settings.
- Keep existing QA046 CSS and print-option JS, and the other five original assets byte-for-byte unchanged.
- Scope limited to `body.reader-active[data-v144-print="blue"] #mushafReader`; original and coloured Tajweed modes never show the new frame. Hifz/review/teacher and digital Uthmani unaffected.
- Existing `.ayahHitLayer` is retained, restoring the correct printed-page selection hitboxes.
- Original image remains visible even when a page is offline-loaded or a parent engine re-renders.
- No changes to APK, package ID, owner certificate, audio/selected recitations/reader Back navigation, Tafsir or Library.

## QA-047 patch hashes
- Cumulative file `p113-qa047-original-layout-blue-frame-with-qa045.js`
- UTF-8 size: **225302 bytes**
- SHA-256: `b8af563d0cce6c5aa780772e3f1f558b7db2e4eedd8605f07450a949f155618f`
- 8 assets total, 296799 bytes. Sequence **47**, minAppVersion **690**, owner-qa schema1.
- RSA signature created with original owner certificate (public SHA256 `35066b87e4b854187b5c8fa8321676bacc2de8bef14624072afb33ebd506dc07`), verified against pinned V690 key. No secret uploaded.

## Tests
- Chromium page tests for 1, 2, 3, 604 PASS: original image bounds unchanged (x/y/width/height); original hit-layer data unchanged; newly generated Quran type layer hidden; thin frame visible only in blue mode.
- Original and Tajwid mode switch PASS: no blue frame visible; base image still visible.
- JS source syntax PASS; existing QA045 base copied exactly. No added/generated Arabic Quran text.
- Physical Android validation **PENDING**. On actual phone, verify page 1, page 2 and a dense middle page, page 604; both portrait and landscape if relevant, correct tapping/highlight and page transitions. If original bitmap has embedded ornate border, check appearance of narrow blue overlay for visual satisfaction.
- Do not claim Quran text has changed. **Do not delete existing bitmap/knowledge.**

## Safe publication and rollback
- Before publishing check active owner release sequence 46 and its signature, and compare first 7 asset descriptors with QA047.
- Archive exact signed QA046 `release.json` in `release-qa-046-before-qa047-20261109.json`.
- Merge staging PR only after checks. Changing `release.json` is the activation event; it must be signed and verified.
- If on-device regression, use built-in rollback or issue a new higher-sequence owner-signed recovery release, not an unsigned/old-sequence manifest.
