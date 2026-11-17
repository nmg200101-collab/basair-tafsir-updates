# P206 — integration and acceptance checklist (staging only)

## Staged assets
- p206/staging/p206-six-release-history.js: read-only listing of locally available bundle versions, SHA-256 verification API; never calls rollback.
- p206/staging/p206-unified-update-notice.js: read-only rendering of a release record returned by BasairUniversalOTA.status(), when such record is available. No synthetic notifications.

## Integration prerequisites
1. Determine whether the signed V695 universal OTA engine exposes status().release/currentRelease/manifest. If not, extend the signed engine contract before shipping the notice.
2. Locate R33/B345 original native start/stop/pause and static page renderer. Implement lifecycle fix there rather than CSS overlay or DOM clone. P205's adapter does not control native stop transitions.
3. Replace P197 single-previous-only rollback with an OTA-engine transaction retaining six complete, compatible signed snapshots. No UI button until engine can select and activate a specific signed version safely.
4. Only then add both P206 modules to the owner-signed release payload and calculate SHA-256/size. The files in p206/staging are NOT included in active p121/owner-qa/release.json.

## Tests required before publication
- V695 first-tap start on both editions; repeated start does not reset state.
- Pause/resume at page 4 and 5; stop returns native static page with one frame, both editions.
- No duplicate border, overlay, old renderer, flash or lost zoom.
- OTA six successive installs; six-step rollback and forward restore with power-loss recovery, signature/hash checks and no data loss.
- Notice displays real signed sequence/type/date, never fabricated metadata; restart only after confirmed install.
- QA-050 plus owner device acceptance; preserve original signing and an independent rollback.

## Current gate
BLOCKED: no source access to the packaged native R33/B345 and OTA archive implementation through this update repository; no device test evidence; no signing run. Keep PR draft and do not publish.
