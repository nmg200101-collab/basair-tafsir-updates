# BASAIR-QURAN PUBLIC-RC1 Reference

- Date: 2026-09-22
- Version: `1.2.0-rc1`
- versionCode: `213`
- package: `app.basair.rc20s`
- minSdk: `23`
- targetSdk / compileSdk: `36`
- Baseline: B212 preserved unchanged.

## Protection
- Original B212 `classes.dex` SHA-256: `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- Quran `mushaf-data.js` SHA-256: `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- Non-library source differences vs B212: 0.
- RC1 compatibility layer is separate `classes2.dex`; original `MainActivity` remains untouched.

## Android 16 compatibility
- Edge-to-edge system bar insets handled by `Rc1Activity`.
- Predictive Back is temporarily opted out to preserve B212 `onBackPressed()` navigation behavior.

## Offline Quran Library
- Library version: `1.3.6`
- Categories/subcategories: `76`
- Published topics: `150`
- Manifest items: `180`
- Manifest checksum and every item SHA-256 verified.
- Failed optional asset downloads are no longer marked as successfully installed.

## Release artifacts
- APK SHA-256: `159dd1186d85f6a8898bfac214014ff4821749a5efb334aab5c98d06879a6d5b`
- AAB SHA-256: `89f423bb2a90dbf69c54af3eedf629df96c62436521d38727527b94e204a7b0f`
- AAB-derived Universal APK SHA-256: `2c0de56159402178ad365cce05e476a78cf6518582973cbdc2d1a6113063c7a0`

## Signing
- Field-test APK remains signed with the B209/B212 test chain so it can update B212 in place.
- AAB is signed with a separate production upload key.
- Private signing key and credentials are intentionally **not stored in GitHub**.

## Release gate
PUBLIC-RC1 has passed static/package QA. Physical Android validation is required before RC2/RELEASE.
