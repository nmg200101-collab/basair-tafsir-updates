# P118 / QA051 — Full corrected source Chromium verification (2026-11-10)

**STAGING ONLY — Do not sign, merge automatically, or activate owner-qa OTA.**

## Source authenticity

- Owner APK: `app.basair.qurv2`, versionCode `690`, APK SHA256 `4f95dd781c23b04e27581ab8257cce2393a83bfe1a0ea2f31ea076a4262535fc`. Private APK and private keys were **not uploaded**.
- P117 real JS/CSS were extracted locally from `assets/www/tafsir-index-p117.js` and `tafsir-index-p117.css`.
- Corrected *full* P118 JavaScript: `82f8b8d08b97f478c8165f7bfbd23585bbda45c761e939f6c22e8922d4a06cb9` (SHA256).
- P118 standalone CSS: `64623bde653c12693224c6b4578e8599b1fe586e055f183316c3d4139e897614` (SHA256), matches embedded CSS ignoring the trailing newline.
- The nine originally invalid font shorthands are replaced by valid longhand declarations.

## Real headless Chromium + Playwright tests

HTML is a synthetic fixture, but the P117 JS/CSS from the actual APK and full corrected P118 JS including embedded CSS are real source bytes.

| CSS px | Light | Dark |
|---|---|---|
| 320 | 13/13 PASS | 13/13 PASS |
| 364 | 13/13 PASS | 13/13 PASS |
| 390 | 13/13 PASS | 13/13 PASS |
| 430 | 13/13 PASS | 13/13 PASS |

**104/104 passed**, with 114 Surah elements; header downloads/more isolation; search; favorites; resume; last verse; verse jump; navigation back to Tilawa and reentry; no overflow, duplicate toolbar, or uncaught JS exceptions in the test fixture.

**Stress:** eight full Tafsir-exit-and-reentry cycles on 320px viewport, plus additional 4 seconds of runtime timers; 9/9 observations passed, P118 diagnostics `errors=0`, no duplicated toolbar or missing 114 Surahs.

## Why release is still BLOCKED

1. This verifies **Chromium on synthetic HTML**, not the original complete Android WebView screen or a phone install. Native theme variables and audio/reader integration still require field QA.
2. APK's `assets/www/p92/remote-updates.js` accepts at most 8 manifest resources and demands independent **Ed25519 owner approval** if the entire ordered QA050 eight-resource inventory differs. P118 cannot simply be added as a ninth asset, and Android RSA alone is not approval.
3. No Ed25519 owner-approval signature is provided, and the GitHub `main` Rulesets have not been enabled.
4. No official RSA-signed QA051 manifest/rollback or real-phone acceptance has been completed.

**No QA050 asset changed. No OTA and no APK were published.**

See `P118-QA051-FULL-CHROMIUM-EVIDENCE-V3.json` for structured results and [PR #32](https://github.com/nmg200101-collab/basair-tafsir-updates/pull/32).
