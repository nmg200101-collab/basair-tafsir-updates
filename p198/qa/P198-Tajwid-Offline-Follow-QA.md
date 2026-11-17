# P198 — Tajwid colored-print Follow: offline page-source and B345 readiness repair

Date: 2026-11-17  |  Owner baseline: P197/Seq93 (Tilawa v211, V695, QA-050)

## Field issue
User confirms Follow in the colored printed Mushaf still fails after P197. The P197
rollback intentionally restored the exact P194 asset list (18 Tilawa assets), so
P196's former metric shim was not active. The P196 patch did not address image
loading of future pages.

## Source-verifiable root causes
Inspected original V694 owner-signed APK source files:
- `assets/www/tilawa-arkani-nav-header-final-lock-b255.js` / B345 controller's
  `lockNormalRenderer`: at normal 100% startup it requires `normalAnchorFontPx > 0`,
  a B327 **digital** font metric absent in the printed image surface.
- `assets/www/print-follow-100-r33.js`: its `tajwidSource(page)` first tries the
  page **already visible** as RC18 Tajwid, but for subsequent page numbers
  falls back to two *remote* JPG sources on jsDelivr and raw.githubusercontent.com.
  B345 refuses to follow into subsequent pages until `data-b345-ready="1"`.
- The exact signed APK includes **all 604 local** `assets/www/assets/tajweed-pages/tajweed-NNN.webp`
  images, e.g. `tajweed-008.webp`, `tajweed-009.webp`, `tajweed-604.webp`.

The combination can leave Follow stuck if the network CDN is slow or unavailable,
even while a static page appears perfectly rendered. This inference is based on
actual source and bundled assets; Android owner field logs have not yet been read.

## P198 implementation
- Add only two signed Tilawa assets, JS and CSS.
- At 100% and active *Tajwid printed Follow*, provide a scoped fallback to satisfy
  the B345 geometry gate without touching the printed page glyphs.
- Wrap R33's `appendNormalPage` only for Tajwid 100% with locally packaged images;
  preserve the original function for original print, digital font, zoom, hifz,
  review and all other modes.
- Build the original R33 shell, including hit targets if present, existing
  frame, image readiness attributes and next-page/preload ordering expected by
  B345. Pre-create the next two pages so the scroller has a nonzero range.
- Keep CSS scoped to B345's temporary follow stack; do not modify the static
  local-page stage, accepted P193 header or P194 page turning.
- Retain original R33 API for `restoreAfterStop`, `freezeAfterStop`, `thawStatic`,
  and user retargeting, so the original state machine remains authoritative.
- No online URL or new app package; no personal data collection.

## Focused tests completed
- `node --check`: PASS.
- Isolated Node VM with fake DOM + fake local image load: **24/24 PASS**.
- Includes gate before/after Follow, local images current+2 pages, ordered
  original R33 cards, no duplicates, never invoke native remote fetch, no
  digital font mutation, original print exclusion, zoom exclusion, hifz
  exclusion, and clean stop.
- Original signed APK scanned: all **604/604** `.webp` assets present.
- Browser E2E on Chromium: **NOT RUN** — local page navigation blocked by
  administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`). Do not claim that
  isolated VM tests equal field acceptance.

## Release gates
1. QA-050 `tilawa-owner-lock` PASS on signed branch head and merged head.
2. RSA-3072 transport signature + owner Ed25519 approval from original keys;
   preserve all prior 18 Tilawa assets, 26 Tafsir assets and updates module.
3. Keep independent signed rollback to P197/Seq93 (no P196, P195).
4. Publish to `owner-qa` only; no APK, no new Android package ID.
5. Android V695 owner field test at printed Tajwid 100%, particularly al-Baqarah
   page 8 -> 9 -> 10: start silent Follow, observe movement, change to voice,
   stop and manually scroll; verify header, word-meaning popup, size and
   selection. Check original print & digital font unaffected.

## Security
No secret, private signing key or passphrase is added to GitHub. Signed OTA
assets retain SHA-256/size validation; this patch does not bypass them.
