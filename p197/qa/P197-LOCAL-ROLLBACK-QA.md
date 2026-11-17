# P197 — Local rollback UI + one-time restore to P194
Date: 2026-11-17
Base: V695, active server P196/Seq91, Tilawa v209; owner-accepted P194 printed page behavior.

## Owner's requested behavior
The owner requests returning to the prior stable Tilawa P194 and adding the ability
for future updates to revert directly from the app's Updates section, **without
publishing a new server rollback sequence each time**.

## Confirmed mechanism (from original V694/V695-compatible runtime)
- `assets/www/p121/universal-updates.js` stores `active`, `previous`, `trial`,
  and `highestSequence` in IndexedDB `basair:p121:universal:db` / `meta` / `state`.
- `BasairUniversalOTA.rollback(module)` already exists and restores a single module
  locally; it does not contact GitHub or require new signatures at rollback time.
- Native P121 dialog contains a basic `استعادة السابق` button, which may not be
  reachable from the user's active Updates and Downloads menus.
- **Limit:** this native engine retains exactly ONE immediately preceding snapshot,
  overwritten on the next successful update. It is not a multiple-version archive.

## P197 implementation
- Add a signed `updates` JS module that surfaces the engine's existing rollback
  action in `التحديثات الشاملة` and the existing `التحديثات والحزم` navigation.
- Display previous/current module versions and availability.
- Require explicit two-step confirmation; display an error if prior files are
  absent or malformed; verify each cached asset against its SHA-256 before use.
- Use `BasairUniversalOTA.rollback(module)` to change ONLY the requested module,
  then reload the WebView; never manipulate OTA state directly.
- Known owner-rejected P195/P196 snapshots cannot be selected for rollback.
- If no prior snapshot exists, display a clear disabled state, not a dummy button.

## One-time combined update (P197 / Seq93)
- Restore Tilawa to the exact 18 assets in signed P194/Seq85, promoted to
  version v211 (monotonic from v209).
- Preserve all 26 Tafsir assets and V695 APK as installed.
- Add updates module v197 containing only `p197-local-rollback.js`.
- The local previous snapshot after this one-time update may contain the rejected
  P196, which the UI blocks; future updates will have a valid immediately prior
  release available for one-tap local rollback after a confirmation.
- Keep prior P193 green header and P194 printed 3D paper-turn behavior intact.

## Tests
- `node --check p197-local-rollback.js`: PASS.
- Focused Node VM logic: 15/15 PASS (prior versions, no backup, corrupt SHA,
  rejected P195/P196, native API presence).
- Headless Chromium navigation was blocked by the tool environment; **DO NOT**
  claim full Android UI or browser E2E pass.
- QA-050 is mandatory on final signed PR head and final merged head.
- Sign release with original owner Ed25519 and RSA3072. No private keys in repo.
- Independently signed emergency Seq94 candidate should disable the added updates
  module while preserving stable P194 Tilawa assets, if the owner needs rollback.

## Field acceptance checklist
1. On V695 after update and WebView restart, confirm P194 colored/printed behavior.
2. Open `المزيد` -> `التحديثات والرجوع` and verify the rollback card appears.
3. Confirm that the old P196 snapshot is explicitly blocked after one-time restore.
4. After a subsequent real update, confirm latest old version appears and local
   rollback succeeds with 2-step confirmation, offline if previously cached.
5. Verify no Quran line, P193 heading, zoom, follow, notes or Tafsir changed.
