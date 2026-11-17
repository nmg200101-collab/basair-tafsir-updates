# BASAIR P199 — Colored Tajwid Follow in the accepted fixed printed Mushaf

Date: 2026-11-17; target: owner-qa, app.basair.qurv2 V695.
Accepted baseline: P198/Seq95, preserving P197 rollback UI, P194 printed paper turn,
P193 authentic green Mushaf heading, P191 vertical fit and owner lock QA-050.

## Owner's field evidence
Two screenshots on Android: Follow now moves after P198, but activates B345/R33's
old tall, vertically stacked cards (first screenshot). At rest, the reader
presents the accepted one-page decorative Tajwid Mushaf (second screenshot).
Owner requires the *same fixed page view* throughout Follow, with a whole-page
replacement when the native controller advances to the next page.

## Confirmed V694/V695-compatible source behavior
Extracted the exact original V694 owner-signed APK into a private test directory:
- `assets/www/tilawa-arkani-nav-header-final-lock-b255.js` B345 forcibly sets
  `#mushafText{display:none!important}` and builds `#b345NormalStack` under
  `#mushafPage`, then increments `state.page` inside `advancePage`.
- `assets/www/print-follow-100-r33.js` builds `r33PrintShell` for the scroller,
  and its `freezeAfterStop()` can leave that vertical stack visible after Stop.
- Native `window.renderLocalPage(page, null)` redraws the ordinary P193-compatible
  `.localPageStage` in the *hidden* original `#mushafText`; it does not call
  `openPage()` and does not reset B345 Follow ownership.
- `__BASAIR_B345_SEQUENCE__.releaseStaticPrint()` is the native, public R39
  release function, restoring page geometry and removing the B345 stack.

## Implementation — isolated visual mirror (P199)
- B345 and R33 retain all audio/silent timing, page progress, user touch and
  preloaded local image ownership from P198. Do not replace/patch their functions.
- A new, aria-hidden, inert and pointer-events-none fixed overlay in
  `#mushafReader` copies the current *original* `.localPageStage`, including
  its P191 image fit, P192 page metadata and P193 green printed ornament.
- As B345 advances `state.page`, refresh the native offscreen
  `renderLocalPage(page,null)` and replace the mirror only after the colored
  raster has fully loaded. Show one complete page, never adjacent cards.
- Measure the already-approved static page position before Follow to preserve
  original size and margins; use an aspect-ratio fallback if unavailable.
- The overlay is read-only. It cannot capture swipes, controls, highlighting,
  search, zoom, favorite, notes, or bottom dock interactions.
- At Stop, remove the overlay, then use B345's `releaseStaticPrint` public API
  to thaw the retained vertical stack, and redraw the native static page.
- If the static raster cannot load, keep the last complete mirrored page;
  do not reveal a blank or unsafe partial page.
- Scope is ONLY colored printed Tajwid 100% during Follow. At other zoom levels,
  digital fonts, hifz, review, original print, Tafsir and other modules: inactive.

## Tests actually performed
- `node --check p199-fixed-tajwid-follow.js`: PASS.
- Headless Chromium inline DOM harness: PASS for initial absence, Tajwid Follow
  activation, same static-page shape, aria-hidden/inert overlay, no duplicate IDs,
  no pointer interception, sequential page 4 -> 5, single overlay stage,
  native renderer call exactly once for page 5, Stop and R39 thaw/restore,
  stableDigital exclusion, zero JS page errors.
- Direct V694 source inspection: selectors, native public APIs and Follow state
  transitions confirmed, plus CSS namespace check.
- **Full V694 app browser E2E NOT TESTED**: network/file navigation blocked by
  system administrator. Chromium test uses DOM simulation and does not prove
  all original app interactions in production Android WebView.
- Device acceptance REQUIRED after owner-qa signed OTA: page 4, 5, 8, 9,
  silent Follow, audio Follow, pause/resume, manual swipe, Stop, full green
  heading/footer/legend, no duplicate pages/blank areas, no font change.

## Publishing gate
New Tilawa CSS and JS only; preserve the complete 20-asset P198 Tilawa list,
26 Tafsir assets, and one P197 Updates asset. Keep APK V695 and original
signing keys. Generate monotonically increasing owner-signed OTA sequence,
independently signed rollback to P198/Seq95, and require QA-050 success on
final signed PR head and merged commit. No private keys/passwords on GitHub.
