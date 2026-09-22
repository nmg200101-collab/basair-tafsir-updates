# BASAIR-QURAN PUBLIC-RC1 — TILAWA V5 BOOT FIX B222

- Date: 2026-09-22
- Version: `1.2.0-rc1.9`
- versionCode: `222`
- package/application id: `app.basair.rc20s`
- launch activity: `app.basair.quran.Rc1Activity`
- minSdk: `23`
- targetSdk / compileSdk: `36`

## Critical regression record
Build **221 is INVALIDATED** and must not be used.

Root cause found:
- Build 220 application id: `app.basair.rc20s`
- Build 221 application id: `app.basair.quran` ❌
- Build 222 application id: `app.basair.rc20s` ✅

The wrong package id made Android treat Build 221 as a different application identity while the protected native bridge remained on the established code package.

## Additional startup hardening
Tilawa V5 is now lazy:
- It does not move meaning DOM, recalculate Mushaf geometry, or run page-fit work during the splash screen.
- It activates only after the Mushaf reader is actually active.
- This isolates Tilawa layout work from cold application startup.

## Protection
- `classes.dex` SHA-256:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- `classes2.dex` SHA-256:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- `mushaf-data.js` SHA-256:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`

## APK QA
- v1/v2/v3 signature verification: PASS
- signer certificate SHA-256:
  `606d3692df3a6932e0cbe0f0094bd370f99827899cba8e284547cfb840c2443d`
- package identity restored: PASS
- targetSdk 36: PASS
- JavaScript syntax: PASS

## Artifact
- Field-test APK SHA-256:
  `d9987acb97ec13f1ff1e28d02595fa430875397963153b867b15aa6dfa8741c8`

## Field gate
First test **cold startup only**.
If Build 222 opens past the splash reliably, then validate the V5 Tilawa layout. Do not promote to RC2/RELEASE before that real-device check.
