# P134 — Tafsir Natiq and manual scroll QA (NOT RELEASED)

Baseline: P132 owner-qa signed sequence 9, tafsir v8, app >= V694. Tilawa QA-050 sequence 50 remains frozen. Owner handset: V695 reported installed, native bridge not yet proven.

## Source evidence
- `p121/owner-qa/modules/tafsir/p132-natiq.js`: document capture click handler for `.p132NatiqButton` (onClick), start/stop API, Web Speech synthesis; diagnostic method already exposed as `window.__BASAIR_TAFSIR_NATIQ_P132__.diagnostics()`.
- `p121/owner-qa/modules/tafsir/p132-verse-tools.js`: `maintainReadingStrip()` removes old carry articles and adjusts root.scrollTop; `scheduleFeed()` calls it on scroll via requestAnimationFrame. Potential scroll anchoring interaction, not confirmed.
- P133 Android bridge PR #10 and OTA fallback PR #45 remain draft and unmerged. Neither is proof of V695 native bridge.

## Required diagnostics before any patch
1. On V695 with Tafsir open, inspect `typeof window.__BASAIR_TAFSIR_NATIQ_P132__`, `.diagnostics()`, `.status()`; log JS errors and click handler entry (no personal content).
2. Check `typeof window.BasairNativeArabicTts` and Android WebView logs. Do not assume Web Speech voice failure means missing system Arabic voice.
3. Test voice preview, start/stop, short tap, long press and navigation; do not synthesize Quran verses.
4. Reproduce Follow start -> stop -> manual swipe -> load next -> resume. Capture reader scrollTop, DOM article IDs, sentinel position, and mutation/scroll frequency.
5. Check whether native scroll anchoring plus manual root.scrollTop compensation causes jumping. Disable compensation only in isolated tests, never blindly in live code.
6. Verify exact OTA asset hashes, signature against trusted public key, monotonically increasing sequence, and owner-only rollback.

## Acceptance gates
- Natiq tap must produce audible Tafsir or a comprehensible diagnostic message.
- Manual reader must remain responsive, no repeated or pinned verses, next verse ordered, resume from visible verse.
- No protected Tilawa, Quran print, signing, or user data changes.
- Browser and Android tests, owner handset acceptance required.
- Do not update `release.json`, merge, sign or publish without explicit owner approval.

Status: diagnostic plan only; NO CODE PATCH, NO OTA, NO APK, NO RELEASE.
