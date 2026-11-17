# P203 — Native P189 image with B345 Tajwid Follow

**Owner screenshot & request:** native P189 single full-frame page is correct but Follow does not advance. Earlier P198 scroll worked but displayed a vertical stack, while P199–P201 added overlay/frame bleed. P202 restored exactly P189.

**Verified source root cause:** B345 uses an independently mounted scroll stack and hides #mushafText when data-b345-sequence-surface="normal". B345 also requires a next ready page, and legacy R33 loads future pages from external CDN while the installed APK has all 604 Tajwid WEBP images.

**New design:** Keep original P189/RC18 `#mushafText > .localPageStage` (no clone or added frame) on screen. While Follow is active, position that ORIGINAL element in the fixed-page reading rectangle, and hide only `#b345NormalStack` with parent-level opacity (CSS visibility descendants cannot escape). B345 remains mounted and can change scrollTop, page, timings and sound. Re-use **only the already owner-signed P198 local-page loader** for B345 background page readiness, avoiding broken external CDN requests. At native B345 page boundary, preload next local WEBP first and call original `renderLocalPage(page,null)` to paint the new page with all the genuine P189 borders. On Stop, restore native inline styles and thaw R39 without altering progress.

**Test basis:** `node --check` pass. Headless Chromium DOM regression with actual P203 code pass: only one native stage, no duplicate border or shell, legacy opacity 0 despite descendant `visibility:visible!important`, scroller scrollTop changes without moving native page, page 4 to 5 update, Stop native layout restore, excludes digital font and no page errors. **Full APK/WebView execution on owner's Android not yet verified**; the local HTTP test was blocked by administrator, so do not claim full end-to-end success.

**Release:** Seq105/tilawa v223, original ten P189 assets unchanged, plus two unchanged previously signed P198 preload assets and two new P203 native-visual assets. Seq106/tilawa v224 independently signed rollback to exact P189 ten assets (not published). All 26 Tafsir and 1 Updates assets untouched; V695 and QA-050 lock remain.

**Owner acceptance:** after Seq105 arrives, use colored Tajwid at 100%, run silent Follow, allow enough time for actual selected per-page duration; assert `pageTransitions` advances and P189 full page changes from 4 to 5 exactly once; test Pause/Resume, Stop/manual page navigation, audio Follow, no second border, digital exclusion.
