# P118 / QA051 — Actual V690 HTML regression and 320px overflow fix

**Date:** 2026-11-10 — **STAGING ONLY / NO APK / NO OTA / NOT PUBLISHED**.

## Root cause and fix

The earlier tests used a synthetic HTML fixture. Testing the complete real `assets/www/index.html` from the owner's signed V690 APK exposed a small but genuine horizontal overflow at 320 CSS pixels: `.v194T104SurahHead small` was `white-space:nowrap` inside a flex row with a 10px gap, and its intrinsic width forced the subtitle 3px beyond the left viewport.

Fixed **only P118's Tafsir-scoped CSS**: the subtitle now has `min-width:0`, `flex:0 1 auto`, `overflow:hidden` and `text-overflow:ellipsis`. The same rules were synchronized into the full P118 JavaScript's embedded CSS; no app engine code, QA050 files, reader, Tilawa, audio, or OTA receiver changed.

- JS SHA256: `30a87fc1897bf0c6820cf830d18408cb2a654121ca98af92feb086d4c85b5fb5`
- CSS SHA256: `6446d97c315f4acd69a7072e15710fee186a3f994408160775bfa169a881b517`

## Regression method (stronger than synthetic fixture)

- The original signed V690 APK was opened **locally only**. Its **actual 4.6 MB index.html**, **64 external bundled JavaScript files**, **46 bundled stylesheets** and the entire corrected P118 source were loaded into an offline Chromium session.
- Bundled JS/CSS tags were inlined solely to work around the browser environment's ban on opening local/localhost URLs. The private APK and original HTML were never uploaded to GitHub.
- A memory-only `localStorage` shim is used because Chromium `about:blank` denies persistent storage. Remote network requests and IndexedDB are unavailable. It is **not equivalent to Android WebView**.
- Each of eight viewport/theme scenarios verifies 9 points: actual Tafsir navigation, 114 real Surah names, downloads header, unique toolbar and last-position button, full P118 CSS applied, no Tafsir horizontal overflow, search button focusing native field, native home-and-back flow, and zero P118 internal errors.

| Width | Light | Dark |
|---|---|---|
| 320px | 9/9 PASS | 9/9 PASS |
| 364px | 9/9 PASS | 9/9 PASS |
| 390px | 9/9 PASS | 9/9 PASS |
| 430px | 9/9 PASS | 9/9 PASS |

**72/72 PASS** using the clean test script (no manual focus forcing).

### Existing offline-environment errors

The full APK HTML emits three page-level JavaScript exceptions in this restricted Chromium fixture: an `insertBefore` error and two IndexedDB access-denied errors. An independent original-HTML control run **without P118** reproduced these same three errors. **P118's own diagnostic counter stays at zero.** Consequently, this report does not claim the complete original HTML runs without browser exceptions.

## Still blocked before release

1. QA050 may already be installed in the owner's phone's OTA A/B storage, which cannot be proven from the base V690 APK or simulated offline Chromium; on-device Tilawa/audio and installed-state regression remain required.
2. V690 OTA accepts no more than **eight** resources; QA050 already occupies all eight. A cumulative QA051 with P118 would change a frozen asset and requires exact-scope **Ed25519** owner approval, separate from Android RSA signing and GitHub's own approval protocol.
3. GitHub `main` has zero mandatory Rulesets. Enable pull-request and required owner-lock check enforcement.
4. The independent encrypted Ed25519 owner key is not included in the previously provided Android signing ZIP. Do not replace it, expose it, or bypass the receiver.

**Decision:** Keep PR #32 as a draft, stage the repaired P118 source only, and do not activate OTA or issue an APK.