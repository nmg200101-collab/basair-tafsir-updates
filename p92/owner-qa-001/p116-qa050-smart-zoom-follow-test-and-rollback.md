# BASAIR P116 / QA050: smart audio follow on zoomed original & colored Tajweed print

Owner request: "نفذ هذا على الطبعتين الطبعه الاصليه والملونه بشكل صحيح" after QA049 successfully restored the last good QA045 printed/recitations state.

## Scope and design

- Preserve QA049's seven CSS/JS resources and original QA045 cumulative JS as an **exact byte prefix**. Append only the small P116 feature; no APK, package-ID, downloaded source, Quran text/image, audio-provider or navigation changes.
- Operates when the app is in standard tilawa reader, **zoom >100%**, printed **original/tajwid only**, audio running. No behavior change to digital, Hifz, review, teacher, the suspended blue Uthmani option, or 100% normal-scale mode.
- Use the preinstalled original `R51/R58` zoomed-page engine and the authoritative `BASAIR_MUSHAF_HIT` row geometry. Use exact ayah audio state when available, or `R54` timed page-follow verse targets when available. For other page-level recitations, use only R51's estimated visual progress, never claim it is an exact word/ayah timestamp.
- No new Quran words, page renderers, line breaks, audio URLs or recitation engine replacements.
- Hold scrolling while touching/dragging/pinching and for 4.5 seconds after a manual gesture. Native R68's manual-scrolling flag/hold is also respected. Small 'استئناف التمرير' button lets the owner resume promptly.
- Move only if the target leaves a comfortable viewport area. Bounded step <=42% viewport height, <=32% width; >=1050ms between issued scrolls; throttled target lookup to ~7 Hz. Prevents repeated jump to page top; preserves zoom and audio playback.
- Adds opt-out checkbox `متابعة صوتية ذكية عند تكبير الطبعة الأصلية أو الملونة` to the existing Appearance panel. Default on; stored locally in the owner's existing WebView.
- If the printed original/tajwid image isn't ready, do not scroll/guess or force the page renderer; existing R51's maintain/prepare remains responsible.
- Diagnostics `window.__BASAIR_P116_PRINT_ZOOM_SMART_FOLLOW__.status()` are anonymous counters only.

## Static and local Chromium tests

- `node --check` PASS.
- Chromium uses actual V690 `print-zoom-follow-r51.js` with representative printed-page hit geometry and native-B345 state simulation. No network or real Android WebView hardware used.
- `test_qa050.py` PASS: original zoom no move while visible, bounded forward moves for later ayah, manual pointer drag suppresses, resume works, disabling option really suppresses, Tajweed not-ready hold and ready follow, Hifz ignored, no JS errors.
- `test_qa050_regression.py` PASS for page 1, 2, 6, 604 on both original and Tajweed, plus 100% no override, existing raster nodes preserved, no JS errors.
- Real phone field acceptance remains REQUIRED for accurate source recordings and user touch gestures. Do not claim production-perfect follow in advance.

## OTA & rollback

- Current baseline QA049, sequence 49, signed at `p92/owner-qa-001/release.json`.
- New signed QA050, sequence 50, channel `owner-qa`, schema1, min V690, 8 assets, total 304822 bytes, receiver `id` 35 chars.
- Seven resource descriptors exactly identical to QA049. Only 8th cumulative JS changes:
  - `p116-qa050-qa045-with-print-zoom-smart-follow.js`
  - 231351 UTF8 bytes, SHA256 `42f91b09f46182561dbf68138d937b3f13764dc9396e29598d423284f971d8fe`
  - cumulative source begins with **exact QA045 JS bytes** and adds P116 at end.
- Signed with original private owner certificate; signature and original pinned app public key independently checked. Do not upload credentials.
- Archive exact QA049 signed manifest before activation as `release-qa-049-before-qa050-20261109.json`.
- If owner finds a regression, use app's built-in one-step rollback to QA049 or sign a higher-sequence QA051 recovery using exact QA049 assets. Never write a lower sequence to the active channel as a supposed OTA rollback.

## Phone acceptance

1. Install QA050 from Updates; fully restart app. Confirm **original and colored Tajweed** both appear; blue Uthmani remains disabled.
2. Start audio Follow; zoom original print to 150% / 200%; visible current verse should not trigger movement. When next ayah is outside viewport, page moves once smoothly, preserving exact zoom and current reader page.
3. Swipe/drag/pinch while audio continues; page must immediately stop auto-follow. 'استئناف التمرير' resumes when tapped. No re-centering at each audio tick.
4. Disable zoom auto-follow in Appearance; manually swipe and check no automatic scrolling; re-enable to resume. Rotate and return to 100%: default V690 behavior retained.
5. Repeat with **colored Tajweed**; avoid a jump/white flash while colored asset is still loading.
6. Switch between editions, tap several ayahs, navigate Back, use Masad / Sobhi, check Hifz/Tafsir/Library untouched. When recording lacks exact verse timing, allow estimated follow and never claim verse-sync precision.