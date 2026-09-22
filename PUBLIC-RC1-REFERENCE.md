# BASAIR-QURAN PUBLIC-RC1 — HOME UX V2 Reference

- Date: 2026-09-22
- Version: `1.2.0-rc1.1`
- versionCode: `214`
- package: `app.basair.rc20s`
- minSdk: `23`
- targetSdk / compileSdk: `36`
- Offline Quran Library: `1.3.6`
- Baseline: B212 remains preserved unchanged.

## Home UX V2 scope
- Home global mini-search removed from the Home experience.
- Four approved primary modules retained: Tilawa, Tafsir/Tadabbur, Hifz, Quran Library.
- Easy UI is now a direct-Mushaf launch mode.
- Root Mushaf Back in Easy mode uses the narrow `BasairApp.finishApp()` native bridge.
- Explicit Easy UI Home control returns to full Home.
- More menu reorganized: Downloads, Updates, Feedback, Guide, Settings, About + existing useful secondary tools.
- Update manifest is live on the repository main branch.
- Feedback uses a pre-filled GitHub issue flow and never claims delivery before the user submits.

## Protection
- Protected B212 `classes.dex` SHA-256:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- Quran `mushaf-data.js` SHA-256:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- New compatibility `classes2.dex` SHA-256:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- APP_SOURCE changes vs previous PUBLIC-RC1 are limited to `index.html` plus new `home-ux-v2.js` and `home-ux-v2.css`.

## Offline library validation
- Categories/subcategories: 76
- Published topics: 150
- Manifest items: 180
- Every manifest item SHA-256 verified.

## Release artifact hashes
- Field-test APK:
  `cdac958862a540ae980ad3cbf08966475113cb64886865e5646a56c08819f1e5`
- Production-signed AAB:
  `1a7bed414448da1e635bf9bfc2abb558a70dd58739919240e768f5a1e4930acd`
- Source ZIP:
  `ce26964f9afd23a1fb95d7930f78ce99529f9af59adae0eb4da966d4c663b59b`
- Backup ZIP:
  `996b296dceb2e3b892ef9a243206756e22725c92c9c4672ecfb02d8fe28bf296`

## Signing
- Field-test APK remains on the B209/B212 test signing chain for in-place field testing.
- AAB uses the separate production upload key.
- No private key or credential is committed to GitHub.

## Release gate
Static/package QA: PASS.
Physical Android validation is required before this Home UX change is locked and before proceeding to Tilawa audit.
