# BASAIR-QURAN PUBLIC-RC1 — HOME HEADER V3 Reference

- Date: 2026-09-22
- Version: `1.2.0-rc1.2`
- versionCode: `215`
- package: `app.basair.rc20s`
- minSdk: `23`
- targetSdk / compileSdk: `36`
- Offline Quran Library: `1.3.6`
- Baseline B212 remains preserved unchanged.

## Correction scope
This build corrects HOME UX V2 so the change is restricted to the **top Home header only**.

### Top header
- Small top-header search stays removed.
- Basair logo/brand is centered and visually emphasized.
- Night mode + Easy UI are grouped on one side.
- More is placed on the opposite side.
- Easy UI direct-Mushaf launch behavior remains intact.

### Restored below the header
- Quick search restored.
- Home style/layout controls restored.
- Existing Home options/cards below the header are no longer hidden by the RC1 override.
- The existing Home body code and functionality are preserved.

## Protection
- Protected B212 `classes.dex` SHA-256:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- Quran `mushaf-data.js` SHA-256:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- Compatibility `classes2.dex` SHA-256:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- Extracted Build 214 -> 215 payload comparison: **0 unexpected differences**.
- APP_SOURCE changes from Build 214 are limited to `home-ux-v2.css` and `home-ux-v2.js`.

## Offline library validation
- Library version: `1.3.6`
- Published topics: `150`
- Manifest items: `180`
- Every manifest item SHA-256 verified.

## Artifact hashes
- Field-test APK:
  `8eb034d88edb721a4078b7e9d166a1577fcc0af1c867daf8edec9f51ddba552e`
- Production-signed AAB:
  `eacba4b55d4ae4e751f83431b8d0795f4dae6686c0439e62683bb23dc61e0241`
- Source ZIP:
  `3fa6da1b30b88716f049807797023608f24b085261466562ef403f19d97cc2a6`
- Backup ZIP:
  `5af196d7f69ee819c2de17cc8ce0bb1fda687d000e2716280ff1086b9516301e`

## Signing
- Field-test APK remains on the B209/B212 test signing chain for in-place testing.
- AAB uses the separate production upload key.
- Private signing material is not stored in GitHub.

## Release gate
Static/package QA: PASS.
Physical phone validation of header alignment and restored below-header controls is required before locking Home and moving to Tilawa audit.
