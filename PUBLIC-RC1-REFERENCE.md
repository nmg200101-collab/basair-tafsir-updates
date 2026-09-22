# BASAIR-QURAN PUBLIC-RC1 — RECOVERY B223

- Date: 2026-09-22
- Version: `1.2.0-rc1.10`
- versionCode: `223`
- package/application id: `app.basair.rc20s`
- launch activity: `app.basair.quran.Rc1Activity`
- minSdk: `23`
- targetSdk / compileSdk: `36`

## Recovery status
Builds **221 and 222 are invalidated** for startup testing.

Build 223 is rebuilt from the known field-opening Build 220 payload.

## Root cause direction
Build 222 still loaded the V5 Tilawa script on application startup and started a page-wide MutationObserver at DOMContentLoaded. Even though Mushaf DOM mutations were deferred, the observer itself could process the heavy startup mutation stream and stall WebView before leaving the splash screen.

## Recovery guarantee
Build 223 removes the V5 CSS/JS layer completely.

Binary comparison Build 220 -> Build 223:
- ZIP entry set: identical
- All non-signature payload files: identical except `AndroidManifest.xml`
- Manifest difference: versionCode/versionName only
- Protected `classes.dex`: unchanged
- Protected `classes2.dex`: unchanged
- Quran data: unchanged
- All web app assets: unchanged

## APK
- SHA-256: `113c7242978344d3d4532b9eca0119e9d120b3240f550d8d15c916bea16eeabc`
- v1/v2/v3 signature: PASS
- signer SHA-256: `606d3692df3a6932e0cbe0f0094bd370f99827899cba8e284547cfb840c2443d`

## Field gate
Install B223 directly over B222 without clearing data.
Test cold startup first.
If B223 opens normally, all further Tilawa visual work must branch from B223/Build 220 behavior and must not use a global MutationObserver during application startup.
