# P207 — Field-reported P206 no-visible-effect diagnosis (2026-11-17)

**STATUS: STAGING ONLY / NOT SIGNED / NOT PUBLISHED.** Owner reported that P206 Seq111 arrived, but the printed Follow behaviour and promised UI improvements were not visible. Do not conflate a server manifest with local WebView activation.

## Verified upstream facts
- LIVE `main/p121/owner-qa/release.json` is **Seq111** (P206): `tafsir v51`, `tilawa v229`, `updates v198`; it lists 41 signed assets.
- P121 downloads new module versions into IndexedDB, then activates the stored JavaScript only at the next full WebView startup. A downloaded update may be pending; merely comparing server seq is insufficient.
- P205 reads colored print edition from `localStorage.v129PrintMode` and exposes `__BASAIR_P205_ORIGINAL_PRINT_PARITY__.status().edition`. P206 incorrectly tries `__BASAIR_PRINT_FOLLOW_100__.edition()` (not in the exposed P205 adapter) and falls back to `data-v144-print` / original, often reporting original when Tajwid is selected.
- P206 click regexp matches `متابعة` or `إيقاف` with symbols **after** the label, not the V695 icon-prefixed forms `▶ متابعة` / `■ إيقاف`; this suppresses intended click-specific lifecycle transitions.
- P206 `frames()` mistakenly requires a static frame inside `#mushafText`; P205 gets native print images from `#mushafReader`. The unnecessary dependency may prevent frame recovery. P205 already appends a decorative `.stableFrame` on its colored shells; P206 did not implement a new page rendering pipeline.
- Existing P197 rollback UI reads the **local** IndexedDB state, not the server. If the current v229 is installed and the previous v227 is retained, the selector can show `التلاوة — من v229 إلى v227`. If it does, Seq111's tilawa module is active locally; do NOT press Rollback without a separate deliberate decision.

## Corrections in staging
- `p121/owner-qa/modules/tilawa/p207-native-follow-lifecycle.js`: selects edition by P205 status or `v129PrintMode`, aligns 100%-only font/zoom checks, handles icons before buttons, and checks B345 follow page frames without depending on `#mushafText`. No separate playback clock and no new APK.
- `p121/owner-qa/modules/updates/p207-local-activation-status.js`: read-only updates-dialog panel showing IndexedDB highestSequence / trial / tilawa version / updates version plus P205/P207 runtime presence, selected print edition, recognized button count and static restores. No Mushaf overlay or data changes.
- Unsigned **provisional** Seq113 now replaces P206's follow module with P207's corrected source, adds the P207 read-only local-activation diagnostic and the actual More-modal entry. It requires a **new, higher-sequence Seq114 emergency rollback**, because the old signed emergency Seq112 cannot supersede Seq113 under P121 monotonic sequence protection. The local-only unsigned Seq113/Seq114 inputs are prepared; no Seq113/114 owner signatures exist yet. Do not update `main/p121/owner-qa/release.json` until real V695 activation compatibility and field QA are verified.

## Local tests (no GitHub Actions, no Codemagic)
Executed with V8/Node-compatible local JavaScript mocks against the actual staged source, including a before/after P206 reproduction. **10/10 PASS**:
1. Tajwid selected correctly; old P206 falsely reports original in the same fixture.
2. Local Tajwid image prewarm initiated.
3. `▶ متابعة` captured on first tap.
4. Passive inspection confirms the actual P205 printed frame without appending a synthetic second frame (corrected after owner duplicate-border reports).
5. `⏸ إيقاف مؤقت` never restores static page.
6. `■ إيقاف` restores the same native page.
7. 130% zoom bypasses P206's 100%-only logic.
8. Original edition retained.
9. Digital font bypasses printed-mode helper.
10. Diagnostic snapshot maps local seq / tilawa / updates / trial correctly.

These tests **DO NOT** establish real V695 WebView repair. Device evidence is needed to separate "OTA downloaded but not activated" from "activated yet still visually wrong".

## Owner's diagnostic without losing data
1. Keep installed V695; do not uninstall, clear storage or change signing keys.
2. Open **المزيد → إدارة التحديثات والرجوع**, inspect the existing P197 prior-version text.
3. If it offers `التلاوة — من v229 إلى v227`, active module v229 is detected. Otherwise supply one screenshot of that screen so the pending/active branch can be diagnosed safely.
4. Test printed Follow only after one complete Android app relaunch. Compare `▶ متابعة`, `■ إيقاف` and whether next printed page visually changes; keep screenshots for follow before/after.

## Release gate
No second automatic OTA rollout merely because local mocks pass. P121 is pinned to the repository's live `main` and checks automatically. A new Seq113 must be signed with original RSA3072 and separate Ed25519 owner key, be accepted for V695, and be offered via the protected PR workflow. Do not charge remote build/CI minutes for functional QA; the repository's required protected-change guard cannot be bypassed during eventual release.

## P207 visible More-modal entry — confirmed owner screenshot (2026-11-18)
- The owner demonstrated that **«التحديثات الشاملة»** and **«التحديثات والرجوع»** appear UNDER the new More modal, not as choices inside it. Prior requests to tap the ghost buttons were incorrect. This is a real UI placement defect, not evidence that P121 is absent.
- **Confirmed source cause:** P121 `installButton()` appends a button to `#bqP26Menu` and `#bqMoreCenter`; P197 `linkInto()` appends `#p197NavUpdates` and `#p197MoreUpdates` to the same outdated roots. Neither targets the new six-tile More modal shown on the owner phone.
- **Staged UI fix:** `p121/owner-qa/modules/updates/p207-more-modal-entry.js`. It identifies the V695 More dialog by its visible `المزيد` heading and distinctive card titles, inserts a seventh actual clickable tile beside `تحديثات التطبيق` inside its card layout, hides only the two obsolete background-root update buttons using scoped CSS, and delegates open to the real `BasairUniversalOTA.open()` (including P197 previous-history, P206 release notes, and P207 on-device activation diagnostic). It does not change the original P92 `تحديثات التطبيق` card or app data.
- Handles modal re-creation idempotently, watches only More-related DOM mutations rather than the entire reader's changing contents, and does not create an inert button when P121 is unavailable.
- **Seven local mock DOM acceptance checks PASS**: actual modal matching; correct card insertion and order; ghost button CSS; correct P121/P197/P206/P207 hooks on tap; no duplicate tile; restoration after modal re-render; no cloud CI used.
- Still **UNSIGNED / NOT DEPLOYED**; current live P206 Seq111 cannot retrospectively carry this new script. Must be included in a separately owner-signed, tested future OTA release. Displaying the ghost controls does **not** prove P206 is the active module on device.

## Additional local test and release audit — 18 November 2026

- PASS **17/17 local V8 functional/source checks**, including P207 source syntax, Tajwid/Original mode, first tap, native image prewarm, icon-prefixed start/Stop, pause/stop race, avoiding a second frame, zoom, digital-font guard, actual IndexedDB module/baseVersion reporting, and unsigned safety contracts.
- PASS local RSA3072 and Ed25519 verification of the previously signed Seq111 and Seq112 owner envelopes; confirmed true SHA256 of published original envelopes. No private credentials exported.
- Prepared **unsigned only** Seq113 (43 assets, Tilawa v231, Updates v200) and **unsigned only** emergency Seq114 (38 assets, Tilawa v232, Updates v201) from authentic signed Seq111/Seq112; file paths unique, original asset inventory retained, three changed asset SHA256 and sizes independently calculated from exact GitHub source.
- Local preparation package: `BASAIR-P207-UNSIGNED-LOCAL-HOLD.zip` delivered to owner (not an APK, not installable, not signed).
- Local manifest generator (no network or CI): `p207/scripts/prepare-unsigned-p207.cjs`.
- **Critical compatibility gate:** the original P121 source from `basair-quran-p88-build/feature/p121-universal-owner-signed-ota-20261111/p121-universal-staging/universal-updates.js` sets `APP_VERSION=693`, checks `m.minAppVersion>APP_VERSION`, and exposes `BasairUniversalOTA.baseVersion`. Current signed P206 and proposed P207 specify `minAppVersion=694`. If this original P121 runtime is still inside V695, the engine **rejects P206 before installing**, a plausible explanation for no visible effect. **Installed APK's actual P121 baseVersion has not yet been independently inspected**, so do not weaken the signed minimum or declare a definitive APK mismatch.
- The P207 diagnostics panel displays `BasairUniversalOTA.baseVersion` alongside active local Tilawa/Updates versions, when loaded; it cannot fix a pre-existing P121 compatibility rejection by itself.
- Do not repeat automatic OTA publication until the real installed engine compatibility and WebView acceptance are proven. Protect the actual baseline, favorites/notes and QA-050.
