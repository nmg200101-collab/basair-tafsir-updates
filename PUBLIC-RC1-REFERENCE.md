# BASAIR-QURAN PUBLIC-RC1 — TILAWA FINAL LOCK V4

- Date: 2026-09-22
- Version: `1.2.0-rc1.7`
- versionCode: `220`
- targetSdk / compileSdk: `36`

## Final device-driven Tilawa corrections
- Word meaning card moved into the Mushaf reader top flow; it no longer overlays Quran lines.
- Selected word and meaning stay on one compact row; long meanings grow vertically within a controlled limit.
- Missing meaning-package status is no longer shown as the meaning itself; download requirement is separated.
- Real viewport space is reserved above the permanent bottom Mushaf dock so the final Quran line is not covered.
- Font + Reading Size options use compact multi-column rows; automatic font choices use compact rows too.

## Protection
- classes.dex: `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- classes2.dex: `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- mushaf-data.js: `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- Build 219 -> 220 payload changes: 4 expected / 0 unexpected.

## Artifact hashes
- APK: `a71d8b0f00657143120a773a1941a2eb3981517e48909182a5ff36cbba2183ef`
- AAB: `8b8056f7c89d30a067a19c5dc0945416a945299d91e6184df215edc9366558bd`
- Source ZIP: `f2d02cd3d7045d6d8cbeef9537d1b35c0e1aa1ddacb1ac6a2aae2b9f2104d53b`
- Backup ZIP: `ace77aa443983f885fe0f48573158f08f9f793eb1fdf4b1f1ad14efb4a7768be`

## Release gate
Static/package QA PASS. After real-device acceptance, Tilawa is FINAL LOCKED and must not change during Tafsir/Hifz/Library audit unless a true regression is demonstrated.
