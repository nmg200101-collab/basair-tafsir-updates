# BASAIR-QURAN PUBLIC-RC1 — TILAWA FINAL STABLE B224

- Date: 2026-09-22
- Version: `1.2.0-rc1.11`
- versionCode: `224`
- package/application id: `app.basair.rc20s`
- launch activity: `app.basair.quran.Rc1Activity`
- minSdk: `23`
- targetSdk / compileSdk: `36`

## Stable base
Built directly on field-opening Recovery B223.

Builds 221 and 222 remain invalidated.
No JavaScript layer was added in B224.

## Final Tilawa layout correction
- Word meaning card is fixed at the top center of the screen.
- Opening/closing the meaning card does not participate in Mushaf layout flow and therefore does not move the Quran page.
- Word + meaning remain on one compact row when possible; long meanings wrap and increase card height within a capped area.
- Source text is hidden in compact mode.
- Missing meaning-pack download is a separate compact action.
- Bottom Mushaf dock is normalized and real clear space is reserved below reader content.
- Font + Reading Size is forced into a real compact grid using selectors that override the legacy `display:initial` rule.
- Automatic font presets are also forced into compact rows.
- Recitation, audio, reciters, sequence engine, navigation and Quran data are unchanged.

## Protection
- `classes.dex`:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- `classes2.dex`:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- `mushaf-data.js`:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`

## B223 -> B224 payload diff
Exactly 3 expected changes:
- AndroidManifest.xml — version bump only
- assets/www/index.html — stylesheet link only
- assets/www/tilawa-final-layout-b224.css — new CSS-only correction

Unexpected differences: **0**

## APK QA
- v1/v2/v3 signature: PASS
- signer certificate SHA-256:
  `606d3692df3a6932e0cbe0f0094bd370f99827899cba8e284547cfb840c2443d`
- package identity: `app.basair.rc20s`
- targetSdk 36: PASS

## Artifact hashes
- APK:
  `c59ce39055e7d0364b4296771d3f40fc56a6af2b7b39d4998a64074ab99e6d77`
- Source ZIP:
  `c764fe144345d93fbc4f5a43ea2110a2a7bb5d2da60b61199cbc5872137dfbea`

## Field gate
Install B224 directly over B223 without clearing data.
Verify cold startup first, then:
1. meaning card stays at top and the Quran page remains fixed;
2. long meaning wraps cleanly;
3. final Quran line can be reached above the dock;
4. Font + Reading Size appears as compact rows;
5. audio, reciters, sequential recitation and navigation remain unchanged.

After successful real-device acceptance, lock Tilawa and move to Tafsir audit.
