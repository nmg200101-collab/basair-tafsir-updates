# P200 — Unify visual ownership for colored Tajwid Follow

Date: 2026-11-17 | Baseline: P199 / Seq97 | app.basair.qurv2 V695 | Owner lock QA-050

## Field observation
Owner reports that P199 added an extra visible border/frame, and the page still appears to scroll in the old manner. P198 fixed continuous progress, but its B345/R33 vertically stacked image surface remained visible together with P199's full-page visual clone.

## Confirmed cause in the signed V694 base and P199
- B345's runtime `ensureRuntimeStyle()` forces `#mushafText{display:none!important}` while the follow state is `normal`, and enables the original vertically scrolling `#b345NormalStack` under `#pageReading`.
- P199 appends `#p199FixedFollowMirror` directly inside `#mushafReader` as a sibling of `#pageReading` but does not conceal `#pageReading` (the original full scroll surface). Both visible renders may appear concurrently; borders and parts of adjacent pages can leak around the mirror.
- Concealing or removing B345 cards themselves would break scroll geometry and page progress; those cards must remain in the DOM and keep their measured dimensions.

## P200 minimal visual-only correction
- Add no extra border, image, DOM stage, fixed panel or scroll controller.
- When P199 reports a complete live native colored page mirror, toggle `body.p200-one-renderer-active`.
- While the class is active, set `visibility:hidden` **only** on the original `#pageReading` subtree. The B345 cards remain in the DOM and remain fully sized and scrollable; JavaScript still reads and sets native scroller position.
- P199's accepted authentic-stage mirror is the only visible full page, including its green surah header, ornamental border and page number.
- The mini pause/stop control and Mushaf dock are sibling nodes and remain visible.
- On stopping the follow, changing edition, choosing a digital font, changing zoom or leaving reader, remove the class and let P199/B345 restore the original static page.
- Fail open: if mirror has not loaded or is absent, leave old follow surface visible rather than blanking the screen.

## Focused verification
- `node --check` for JS: PASS.
- Real Chromium DOM test (`test_p200_chromium.py`): PASS for start, only one visible surface, original legacy hidden, native `scrollTop` can still advance, 4→5 page update, pause/stop controls visible, stop restores static, digital-font exclusion, and zero page exceptions.
- The test uses the actual P199 implementation and representative DOM with fake B345 state. It does NOT prove behavior in the full V695 Android WebView; owner's field test remains required.

## Release safety
- **Do not activate this patch by merely merging source**. A release requires a new RSA3072-signed manifest, the owner's separate Ed25519 QA-050 approval, and a separately signed rollback to P199/Seq97.
- Preserve V695, 22 current Tilawa assets, 26 Tafsir assets and `updates v197` local rollback UI; add only P200 JS/CSS if approved.
- No APK or changes to Quran text or page imagery.
- If test on phone fails, return through the owner-approved rollback UI when a suitable local snapshot exists.
