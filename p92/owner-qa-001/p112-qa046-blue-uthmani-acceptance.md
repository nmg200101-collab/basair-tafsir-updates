# BASAIR P112 / QA-046 — Blue-framed Uthmani print edition

**Owner request:** Replace *only* the temporarily disabled Uthmani printed edition with a clean, blue/turquoise, flower-free decorative frame modeled after the owner's reference. Page 1 is Al-Fatiha (7 verses), page 2 is the opening of Al-Baqarah (5 verses). Keep other printed editions and all non-print reader features untouched.

## Implementation
- V690/P92.3; **partial owner-qa update only**, no APK, package ID change or re-signing of the Android application.
- Exactly eight assets, as demanded by the original V690 P92 OTA receiver.
- Swap out the P93.2 disabled-Uthmani assets:
  - CSS asset #2 → `p112-qa046-enable-blue-print.css` (1007 bytes; SHA256 `17a8b459d2a906f03238bbe853aabaddd26313ab3aaf3cb9a7377cb817d0830e`).
  - JS asset #6 → `p112-qa046-blue-uthmani-frame.js` (18623 bytes; SHA256 `69e5d3b05812a8d2e0180ae363738052a4e5bb233303c66db15454e0ce7a3cc6`).
- Six other signed QA-045 asset descriptors retained byte-identically, most importantly `p111-qa045-selected-no-amer-with-qa044.js`. No changes to sound, Hifz, Tafsir, original print, colored Tajweed print, Back navigation or user storage.
- Re-enable blue edition print choice with its original reader mode handler (no new navigation interception or print-state coercion).
- Decorate a verified native `.v143MuallamPage` by inline SVG blue frame, 100% local/offline, no generated Arabic text or remote media.
- The existing canonical `LOCAL_QURAN` words, verse indices, Quran page ranges and R109 reader renderers remain authoritative.
- First two pages are validated independently for 7 and 5 verses and canonical surah headings. Baqarah page 2 **moves existing bound DOM word nodes**, preserving their IDs/attributes/listeners, never retypes Quran text.
- If a page's canonical verse IDs are incomplete or inconsistent, keep original printed image (fail-open). Existing colored Tajweed and original print are outside CSS selector.
- All frame text is UI labels only: no generated Quran text inserted.

## Tested in headless Chromium on source-reconstructed V690 markup
- JS `node --check` PASS.
- Page 1: Fatiha 7 ayahs and title from original Q; visual render PASS.
- Page 2: Baqarah 5 ayahs; same original word nodes and existing Basmala; visual render PASS.
- Page 3 and page 604: content preserved and titles grounded in canonical data; visual render PASS.
- All four pages: original & colored edition raster visible after switching; no JS page errors; verse word attributes/content unchanged.
- QA-046 specific: rerender of page 2 successful; missing marker triggers original raster fallback; P93 original raster guard overridden only after validation.
- Phone width checks 360/393/430px completed as simulation. Real Android owner phone NOT yet validated.

## Signing and publishing checks
- Prior QA-045 owner RSA signature verified with original owner cert.
- New QA-046 envelope signed with the SAME original key, signature verified offline; signed envelope staged in `release-qa-046-blue-uthmani-signed-candidate-20261109.json`.
- Sequence=46, schema=1, channel=`owner-qa`, minAppVersion=690.
- 8 assets, total 307120 bytes, below receiver limits; each file SHA256 must exactly match its signed descriptor.
- DO NOT publish until current main release is exactly signed QA-045/sequence45 and exact signed backup of QA045 is recorded.
- Publish by replacing `p92/owner-qa-001/release.json` only, after merging tested files into main and reading back the exact new release.
- Never upload owner signing key or credentials.

## Real device acceptance
1. In V690, update from QA045 to QA046 using the built-in update menu, then fully reopen app.
2. Select Uthmani print; page 1 displays Fatiha 7 ayahs with frame, page 2 Al-Baqarah 1–5, no flowers and no duplicate Basmala.
3. Check page 3, page 604, scrolling, ayah highlight, word meanings, verse selection, Arabic font readable, no blank flash.
4. Switch from Uthmani → Original → Colored Tajweed → Uthmani. Confirm both prior editions unchanged and returning works.
5. Check Masad, Sobhi, remaining Selected Recitations; Amer absent as QA045, no More Readers.
6. Verify Hifz, Tafsir, Library, offline reopen and Back; stop if content or navigation regress.
7. If a defect occurs, restore previous signed QA045 via the app's supported local rollback UI (not blindly replaying an old manifest sequence).

**Status before device test:** code/Chromium PASS; Android field verification PENDING.
