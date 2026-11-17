# P205 — Original printed follow engine parity for colored Tajwid

**Reference:** installed V695 `app.basair.qurv2`; source code extracted from the owner-signed V694 reference APK with the same R33/B345 print renderer. Active pre-change P204 / Seq107, Tilawa v225, ten P189 assets.

## Root cause and design

The original printed Mushaf's `print-follow-100-r33.js` supplies its pages through the application's trusted page bridge (`originalSource -> __BASAIR_PRINT_BRIDGE__.resolvePage`), while the colored Tajwid edition's `tajwidSource` fetches JPEGs from two public CDN URLs. That makes its subsequent pages dependent on remote fetching even though the native APK bundles 604 colored `WEBP` pages, all at 720×1280. The `B345` normal Follow path refuses page transition until the next R33 card reports `data-b345-ready=1`. There is also a shared numerical B345 normal-font-metric gate which raster-only Tajwid cannot necessarily fulfill.

## Minimal parity implementation

- Reuse the **same native R33 shell, loading, ordering, ready-flag, scrollbar, transition and audio/timing ownership** as the original printed mode. Preserve original R33 CSS and page ratio.
- Change only Tajwid image source resolution to `assets/tajweed-pages/tajweed-NNN.webp`; no outside network calls.
- Provide a conservative 18 px internal *metric only* if raster Tajwid 100% Follow starts with no B327 digital line metric. Do not alter the visible image, zoom, typography, or the original print edition.
- Use the original `b345NormalStack`, `r33PrintShell` and existing controls. **No clone, overlay, mirror, extra frame, appearance rewrite, or extra page owner.**
- When running in original print or digital modes, delegate to the existing `__BASAIR_PRINT_FOLLOW_100__.appendNormalPage` unchanged.

## Source and browser checks

- `node --check` on P205 source: PASS.
- Verified packaged Tajwid WEBP files: **604/604**, sample pages 1,4,5,6,50,604 **720×1280**.
- Chromium in-memory DOM harness loads the **actual native R33 JS** plus the P205 override. Tajwid page 4 loaded and marked ready; pages 5 and 6 preloaded and ready; same `.r33PrintShell` / image structure as native source. No mirror, extra frame, or duplicate renderer. Original print page 8 delegated successfully; metric returned to zero when leaving Tajwid. PASS.
- Full app WebView on owner's V695: **PENDING**. Browser navigation to full local APK webpage is blocked by environment policy; the in-memory DOM harness is not an Android field acceptance test.

## Delivery controls

- Candidate: **P205 / Seq109**, Tilawa v227, prior ten P189 assets unchanged, one P205 JS asset added. All 26 Tafsir assets and one Updates asset unchanged. V695 APK, signature, package ID and local data preserved.
- Original owner Ed25519 signature and pinned RSA-3072 transport signature generated/verified locally. Signed approval ends inside seven-day window.
- Independent signed **Seq110** rollback, Tilawa v228, restores ten original P189 assets. **Do not publish rollback unless separately requested.**
- Gate: QA-050 `tilawa-owner-lock` must pass on exact release commit and merged commit. Field acceptance must verify colored 100% printed Follow, change from page 4→5, stop/resume, original print 100% parity, zoom and digital unaffected.
