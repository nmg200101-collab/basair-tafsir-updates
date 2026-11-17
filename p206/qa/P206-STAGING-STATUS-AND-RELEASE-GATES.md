# P206 — QA staging status / blocked release

## Implemented
- Branch isolated from P205 Seq109.
- Source-level investigation of P205 R33/B345 and P197 rollback.
- p206/staging/p206-six-release-history.js: read-only local history inspector, maximum six distinct valid bundle versions, no database writes, no rollback invocation, and no false activation buttons. Does not alter signed manifest.

## Not implemented / release blockers
- R33/B345 start-first-press and stop-to-static fix requires exact native Android WebView lifecycle integration and actual acceptance tests; cannot claim resolved based on the P205 adapter alone.
- Visible frame parity in both editions requires device screenshot/DOM tests; do not apply speculative duplicate frames.
- Six-step rollback is NOT available with P197's single previous bundle. Must implement signed archive in OTA engine, migration and atomic transaction, full bundle hash/signature verification, downgrade compatibility, failure recovery, retention and eviction.
- Unified notifications and owner-signed P206 release not prepared; no release sequence assigned.
- No signing credentials accessed, no QA-050 pass, no APK or OTA published.

## Acceptance gate
1. Start Follow on first tap in original and Tajwid, 100% and zoomed.
2. Stop returns static page and frame in both editions; pause/resume preserves page and position.
3. Six distinct archived signed versions can be selected with safe rollback and forward restore; user data unchanged.
4. OTA summary includes release number, fix category, notes, date, restart indication and one notification.
5. Owner V695 field acceptance, QA-050, verified signed manifest and rollback before merge/publish.
