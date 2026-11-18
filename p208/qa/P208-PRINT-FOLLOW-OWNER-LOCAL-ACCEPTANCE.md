# P208 — Native printed Follow surface and dock controls (18 November 2026)

**Base:** Owner-supplied, signed Android V695 APK (`app.basair.qurv2`) and active P207/Seq113 owner-qa. **Scope:** Tilawa only. No APK/DEX change; QA-050 protected components unchanged.

## Observed fault (owner field screenshot)
The Tajwid page image and ornament are the approved 720x1280 local WEBP, but turning on B345 Follow switches to an independent vertical printed sequence and leaves `sequenceMiniControl` (pause/stop) hovering over the next paper page. This is not corrected by P207's first-tap and edition guard, which does not manage the control's DOM containment.

## Verified real V695 mechanism
- `assets/www/tilawa-arkani-nav-header-final-lock-b255.js` creates `#b345NormalStack` inside `#mushafPage` and uses `#mushafReader.scrollTop` for Follow, with a live B345 audio/heartbeat owner.
- `assets/www/print-follow-100-r33.js` and signed P205 render `.r33PrintShell` with `.r33PrintImage` and `.stableFrame`. The correct page image has native 720x1280 dimensions; no extra renderer is necessary.
- `assets/www/index.html` contains the existing `#sequenceMiniControl` within the scrolling `#mushafReader`, while `#mushafDock` is a separate fixed native tools bar. The old control CSS positions the mini control at a fixed bottom offset, visibly intruding on the book during Follow.
- B345 handles native `#sequenceMiniPause` and `#sequenceMiniStop` via delegated event capture. Moving **those identical nodes** to the dock does not replace their handlers.

## Implemented P208
`p121/owner-qa/modules/tilawa/p208-print-follow-surface.js`:
1. Activates only while B345 `state.running`, `state.scaleMode=normal`, real printed R33 active, supported print edition (original, Tajwid, blue), 100% scale, no Hifz/digital session.
2. Reparents the **existing single** mini-control node into the **existing** `#mushafDock`; extends the dock to a compact two-tier layout and confines pause/stop within it. Keeps all six existing dock tools and their handlers.
3. Leaves printed page images, R33/P205 shell/frame nodes, `#mushafReader.scrollTop`, B345 page progress, audio and reciter timing unchanged.
4. On STOP or leaving the printed session, removes the scoped styles and restores the same mini-control node to its original DOM parent and sibling order. Supports repeated start/pause/stop and regenerated reader nodes.
5. Does not read or write favorites, notes, localStorage, IndexedDB or signing data.

**Important limitation:** B345 remains a **vertical sequence scroll**, so while moving between adjacent pages a portion of the next printed page can naturally appear. P208 fixes the floating old-style control overlay and page surface parity; it does **not** convert B345 into a new 3D page-turn or a single-page renderer. This must be judged on the user's actual device after deployment rather than declared visually perfect in advance.

## Local test results (no functional CI quota)
- `node p208/tests/p208-local-lifecycle.cjs`: **20/20 PASS**: start, stop, pause, native control identity, original dock tool count, printed page and frame count unchanged, scroll position unchanged, original DOM restoration, no duplicate controls, resizing only on lifecycle transitions, negative tests for Hifz/digital/130% zoom/unknown edition.
- `node --check` for P208 source: PASS.
- Local test did not instantiate the real Android WebView; a Chromium headless visual attempt was not available in the sandbox. Field QA still REQUIRED.
- Independently verified exact GitHub blob SHA1 `4d78aa48e0fef1c79728b81c37eec7b8ffbcb41c` matches 5580 source bytes with SHA256 `1427558c628a96cb57a28f4c9c3e4c641e5b0be9f06273f162ea8e0ec63704af`.
- Signed new **P208 Seq115**, 44 assets, tilawa v233, tafsir v51, updates v200; new asset appended only in tilawa. Independently signed **emergency Seq116**, 43 assets, tilawa v234, reverting P207 tilawa bundle while retaining updates v200.
- Owner's ORIGINAL RSA3072 and independent Ed25519 signatures match the pinned public keys from the supplied V695 APK. Owner approval expires **2026-11-23T07:31:18Z**.
- Executed the **unmodified actual V695 P121 `verifyEnvelope()`** in a local Node VM: accepted Seq115 + Seq116, rejected altered RSA signature. No APK build or Codemagic.
- GitHub protected `main` requires **one mandatory `guarded-change-check`** on the release pull request; do not weaken/bypass this.

## Owner field acceptance after OTA activation
1. Keep installed V695. Start Follow on colored Tajwid print page with the text/page frame already correctly rendered.
2. Verify native **pause and stop controls appear in the bottom tools bar, not across the next page**, and no additional paper frame appears.
3. Verify page image remains aligned and the native B345 scroll moves at the existing pace with audio.
4. Press pause, resume, then STOP: return to the same static printed page, without ghost scroll or stacked controls.
5. Repeat for original printed edition, with 130% zoom and Hifz excluded. Capture screenshot if the old format persists.
6. Sign and publish Seq116 only if failure is reproducible and owner authorizes emergency rollback. Do not uninstall or clear data.

**QA status before field trial:** source + signature/integrity PASS; owner phone VISUAL/AUDIO QA pending.
