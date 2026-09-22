# BASAIR-QURAN PUBLIC-RC1 — TILAWA FINAL LOCK CANDIDATE B225

- Date: 2026-09-22
- VersionName: `1.2.0-rc1.12`
- VersionCode: `225`
- Package: `app.basair.rc20s`
- Launch activity: `app.basair.quran.Rc1Activity`
- Min SDK: `23`
- Target/Compile SDK: `36`
- Base: field-opening `BASAIR-QURAN-PUBLIC-RC1-TILAWA-FINAL-STABLE-B224`

## Scope
Final Tilawa layout-only correction. No new JavaScript was added.

### Meaning strip
- Fixed top overlay; it does not participate in Mushaf layout flow.
- Word and meaning are separate framed boxes on one compact row.
- Long meaning is capped at three lines.
- Source / more / alternatives are hidden in compact state.
- When the meanings pack is missing, the legacy sentence is not shown as the meaning. The existing real download action becomes a compact `تنزيل المعاني ↓` meaning frame.

### Bottom dock
- Six equal compact columns.
- Dock height normalized to 56px.
- Legacy 82px page/wrap bottom padding is overridden to 0.
- Reader reserves only dock height + a small gap.
- Sequence button geometry remains equal to the other controls.

### Font + Reading Size
- Parent is forced to a true full-width block to defeat legacy narrow-column layout.
- Font choices are 3 columns; 2 only on very narrow screens.
- Size controls are horizontal.
- Reset is compact.
- Automatic font presets are also forced into horizontal rows.

## Protection
- `classes.dex` SHA-256:
  `c87a3a22b8125e1305e1933cc0a869c8956c077223674eb2eb091e378063077f`
- `classes2.dex` SHA-256:
  `ec071b458e6d60662e68d7703153fc22414d2caf1238e04b86641ad27160cabf`
- `mushaf-data.js` SHA-256:
  `dc2b22fe3925a08ecf9ee2c32392a681362219b7339c627b8cc500190ef64650`
- `resources.arsc` SHA-256:
  `cc7b3efd55d9d67a131c168477f1cca4edf8e203e0982a68d7fd8bec59a34b37`
  (byte-identical to B224)
- Protected Tilawa inline blocks: **42/42 byte-identical to B224**
- Library manifest items: **180/180 SHA-256 PASS**

## B224 -> B225 APK payload diff
Exactly 3 changes (signature files excluded):
1. `AndroidManifest.xml` — versionCode/versionName only; package remains `app.basair.rc20s`.
2. `assets/www/index.html` — one final stylesheet link appended only.
3. `assets/www/tilawa-final-lock-b225.css` — new layout-only stylesheet.

Unexpected payload differences: **0**

## Package QA
- APK ZIP integrity: PASS
- APK v1/v2/v3 signature: PASS
- Field APK signer certificate SHA-256:
  `606d3692df3a6932e0cbe0f0094bd370f99827899cba8e284547cfb840c2443d`
- AAB upload signing: PASS
- Bundletool validate: PASS
- AAB-derived Universal APK generation: PASS
- CSS parser errors: 0
- New JavaScript files: 0
- New MutationObservers: 0
- New startup timers: 0

## Artifact hashes
- APK:
  `d923503b9f1662a4820952f3e2f7c94faf1c3bff4d13f0e561e5d17b1997cec4`
- AAB:
  `1caae9dee8771a8610643b215ae10450c5f52afb674049f4d39225c0f0c12cc9`
- Source ZIP:
  `4dc3fec0c63ae8f6b5e8a308f136059f3913214beccda7d890e74fc3541775d0`
- Backup ZIP:
  `3c9483ac3134fd9e4da46adc1c79d3dac2918635b0b9e69f8e2d211e208f95ea`

## Field gate
B225 is **not yet FINAL LOCKED** until real-device acceptance.

Required:
1. Cold start passes splash.
2. Word + meaning appear as two compact framed boxes in one row at the top.
3. Long meaning wraps without moving the Quran page.
4. Missing pack shows compact Download Meanings action only.
5. Closing meaning leaves the page at the same position.
6. Final Quran line is reachable above the dock without a large white gap.
7. Six dock controls remain equal and functional.
8. Font choices appear as rows (3+3; 2 columns only on very narrow screens).
9. Font selection, +/- size, reset, audio, reciters, sequential recitation, search, index, tafsir, page turning and back all remain functional.

After user acceptance on a real Android phone, mark Tilawa FINAL LOCKED and do not modify it during Tafsir/Hifz/Library audit unless a true regression is demonstrated.
