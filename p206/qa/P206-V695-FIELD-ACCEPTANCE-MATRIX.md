# P206 — Owner V695 acceptance matrix (do NOT test on live auto-OTA)

State at preparation: **SIGNED-HELD**, V695 installed, public channel `main/p121/owner-qa/release.json` still P205/Seq109.

**Important:** The original V695 P121 updater polls and auto-installs the live signed manifest. Do NOT replace LIVE `release.json` for a one-handset trial. Use this sheet **only after** a genuinely isolated authorized test route has been established, or during safe regression of P205 currently installed.

## Field steps — record PASS/FAIL and screenshot evidence

| ID | Edition / test | Required result | Status |
| --- | --- | --- | --- |
| F01 | Original, static, page 1 | Exactly one native ornamental frame, page occupies viewport, no top/bottom blank strips | NOT RUN |
| F02 | Original, static, middle page | Layout, colors, controls, zoom match accepted baseline | NOT RUN |
| F03 | Original, Follow first tap | Begins immediately (no second tap), original full page/frame remains visible | NOT RUN |
| F04 | Original, Follow crosses a page | Audio/ayah tracking and vertical geometry remain synchronized; next page advances | NOT RUN |
| F05 | Original, Pause then Resume | Resumes same ayah/page without duplicate playback or reset | NOT RUN |
| F06 | Original, Stop | Exits old scroll layer; returns to one fixed original framed page; manual nav works | NOT RUN |
| F07 | Tajwid, static, page 1 | Full colored native page with single correct frame and no blank strips | NOT RUN |
| F08 | Tajwid, static, middle page | Identical frame treatment on EVERY page; no duplicated header | NOT RUN |
| F09 | Tajwid, Follow first tap | One tap begins Follow; colored page and real frame remain visible | NOT RUN |
| F10 | Tajwid, Follow crosses a page | Next colored printed page advances, audio matches, no old frame behind image | NOT RUN |
| F11 | Tajwid, Pause then Resume | Same position without flicker or double renderer | NOT RUN |
| F12 | Tajwid, Stop | Correct original fixed-colored page; no residual scrolling/overlays | NOT RUN |
| F13 | Both editions zoom | 100%, 130%, and 200% via native toolbar; size and page remain stable | NOT RUN |
| F14 | Dark mode and navigation | Toolbar, search, back, reciter change unaffected | NOT RUN |
| F15 | App cold restart and relaunch | P206 active, no blank page, no app data loss, original baseline unchanged | NOT RUN |
| R01 | Owner updates dialog | Verified Seq111/type/date/list visible once; no fabricated “installed” state | NOT RUN |
| R02 | Six snapshots | Only complete hash-verified owner field-approved bundles are selectable; no rejected patch | NOT RUN |
| R03 | Rollback one step | Reverts selected complete bundle; same notes, favorites, bookmarks | NOT RUN |
| R04 | Rollback multiple steps | Signed persistent P206 updater survives older module; forward restore possible | NOT RUN |
| R05 | Failed/corrupted rollback | Denied cleanly; no partial state changes or data loss | NOT RUN |

## Pass criterion

Every relevant F/R row PASS and owner confirms screenshot evidence for original + Tajwid, followed by signature hash recheck on exact source commit, QA-050 owner gate, and dedicated signed emergency revert capability. Do not mark PASS from Node tests; those are not Android field tests.

## Capturing failures

Record: Android version and WebView version (no personal identifiers), exact selected edition/zoom/page, first-tap behavior, screenshot before/after, pause/stop transition, and whether manual scrolling still works. On failure, STOP candidate rollout and keep `main/p121/owner-qa/release.json` unchanged.

## Publication route

The installed P121 client pins `https://raw.githubusercontent.com/nmg200101-collab/basair-tafsir-updates/main/p121/owner-qa/release.json`. It has automatic checks on startup and visibility changes; therefore **owner-qa is a real auto-publishing channel, not a private canary**. No safe one-device test distribution without an independently verified isolated mechanism.
