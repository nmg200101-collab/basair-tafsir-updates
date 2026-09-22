# BASAIR-QURAN PUBLIC-RC1 — HOME FINAL POLISH V4

- Date: 2026-09-22
- Version: `1.2.0-rc1.3`
- versionCode: `216`
- package: `app.basair.rc20s`
- minSdk: `23`
- targetSdk / compileSdk: `36`
- Offline Quran Library: `1.3.6`
- Baseline B212 remains preserved unchanged.

## Scope
Final Home-page polish only. **No new Home card was added.**

### Top header
- Notifications button restored beside Night mode.
- Unread notification badge is shown only when the existing Home notification count is non-zero.
- Night + Notifications are grouped on one side.
- Easy UI + More are grouped on the opposite side.
- Basair logo/brand remains in a true centered middle grid column.
- Small top-header search remains removed.

### Below the header
- Quick search remains available.
- Home style/layout controls remain available.
- Existing Home options remain unchanged.
- Only the ordinary duplicate `أقسام بصائر` title text is hidden.
- The distinctive sections heading remains.
- `شكل العرض` remains available.
- Existing conditional app-update strip remains; no new card was introduced.

## Protection
- Protected B212 `classes.dex` SHA-256:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- Quran `mushaf-data.js` SHA-256:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- Compatibility `classes2.dex` SHA-256:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- Build 215 -> 216 source changes are limited to:
  - `APP_SOURCE/assets/www/home-ux-v2.js`
  - `APP_SOURCE/assets/www/home-ux-v2.css`
  - `RC1_BUILD/AndroidManifest.xml`
- Unexpected source differences: **0**.

## Offline library validation
- Library version: `1.3.6`
- Manifest items: `180`
- All manifest item SHA-256 checks: PASS.

## Artifact hashes
- Field-test APK:
  `e90d917bb54d68f050046e50f6b910aaa0484939a09bcac3ae8f918803c868c8`
- Production-signed AAB:
  `de59af70f056cc931fb1f0e69359dccb1f730c5659902df0636fb3c545e69854`
- Source ZIP:
  `fd01c415048d694542d0fb5701aa5d7ed2b9c8a99174e7de3dec8a2b094152e8`
- Backup ZIP:
  `4472ba8811545d83015af964352bdac69ce746129c180cb05a9b69dd287291c4`

## Signing
- Field-test APK keeps the B209/B212 test signing chain for in-place testing.
- AAB uses the separate production upload key.
- Private signing material is not stored in GitHub.

## Release gate
Static/package QA: PASS.
Physical Android visual validation is required before locking Home and proceeding to the Tilawa audit.
