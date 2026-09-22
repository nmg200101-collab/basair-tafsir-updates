# BASAIR-QURAN PUBLIC-RC1 — TILAWA FINAL LOCK B226 INSTALL FIX

- Date: 2026-09-22
- VersionName: `1.2.0-rc1.13`
- VersionCode: `226`
- Package: `app.basair.rc20s`
- Base: field-installable B224 + B225 final Tilawa layout assets

## B225 status
B225 is **INVALIDATED for device installation testing**.

Desktop checks passed, but B225 repackaging changed APK entry storage:
- B224 `classes.dex`: STORED
- B225 `classes.dex`: DEFLATED
- B224 `classes2.dex`: STORED
- B225 `classes2.dex`: DEFLATED
- B224 `resources.arsc`: STORED
- B225 `resources.arsc`: DEFLATED

The real Android device reported a package parsing error.

## B226 correction
B226 is rebuilt directly from B224 and preserves B224 APK storage/alignment behavior:
- `classes.dex`: STORED
- `classes2.dex`: STORED
- `resources.arsc`: STORED
- `AndroidManifest.xml`: DEFLATED
- `assets/www/index.html`: DEFLATED
- `tilawa-final-lock-b225.css`: DEFLATED

## Protection
- classes.dex: `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- classes2.dex: `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- resources.arsc: `cc7b3efd55d9d67a131c168477f1cca4edf8e203e0982a68d7fd8bec59a34b37`
- mushaf-data.js: `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`

## B224 -> B226 payload diff
Exactly 3 non-signature content differences:
1. AndroidManifest.xml — version bump only
2. assets/www/index.html — final stylesheet link
3. assets/www/tilawa-final-lock-b225.css — final layout stylesheet

Unexpected differences: **0**

## Package QA
- ZIP integrity: PASS
- zipalign -P16 / 4-byte check: PASS
- APK signature v1/v2/v3: PASS
- aapt package parse: PASS
- package: `app.basair.rc20s`
- minSdk: 23
- targetSdk: 36

## Artifact
APK SHA-256:
`7e52e556db8a69014b650553041321c6c2c3033f30c828d7f8a733f0869a73d2`

## Field gate
Install B226 directly over the current working Basair app without clearing data.
First gate: installation must succeed.
Second gate: cold start must pass splash.
Only then inspect the final Tilawa layout.
