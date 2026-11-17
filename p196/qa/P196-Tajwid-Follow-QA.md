# P196 — إصلاح بدء متابعة التلاوة في الطبعة الملوّنة

Date: 2026-11-17 | Package: app.basair.qurv2 | Android baseline: V695
Source baseline: owner-accepted P194 effective under signed rollback Seq88 / Tilawa v206
Status: source-stage; owner phone validation pending.

## Report
The owner reports that pressing Follow in the colored (Tajwid) print does not scroll the Quran page. The screenshot shows the colored image rendered and a word-meaning banner above the page, but does not by itself prove that the Follow controller began successfully.

## Verified code-path cause
B345's normal-page `lockNormalRenderer()` calls `activateNormalGeometry()` and then requires `state.normalAnchorFontPx > 0` even for the raster-only printed R33 stack. That metric is read only from a B327 digital `.b327TextLine`. A colored image page may have no such digital line, causing the initial Follow surface to remain uncommitted; B345 cannot advance its normal stack. The P196 patch supplies the internal gate a nonzero metric exclusively for active 100% Tajwid raster follow and **does not apply that metric to any actual font or to page assets**.

## Constraints
- No changes to the core B345 source, printed image URLs or Quran page pixels.
- No modifications to P191 fit, P193 authentic green heading, P194 3D printed-page turn, Arabic Quran text, word meanings, Tafsir, or digital fonts.
- No changes to zoom >100%, hifz/tasmee, original/blue print modes, or reading without Follow.
- No new UI buttons or animation.
- No APK build or user data reset. All updates must be owner-Ed25519 + RSA3072 signed with QA-050.

## Focused source verification
- B345 code inspection: false gate verified.
- R33 code inspection: image-based page stack does not require a B327 metric.
- JavaScript `node --check`: PASS.
- Node VM mock lifecycle tests: PASS 13/13 (start, stop, native metric retention, excluded modes, repeat start and no DOM mutation).

## Release gate
Before owner-qa OTA publication: verify exact P196 asset SHA256 + size, preserve signed Seq88 Tafsir (26) + Tilawa (18) assets, issue next monotonically increasing sequence with owner signature, maintain signed rollback to Seq88, pass final and merged QA-050; no APK.
After release, test the owner's phone: colored print page 3, Follow without sound 100% scroll and page switch; Follow with audio; stop/resume manual scrolling; word-meaning banner; original print/digital modes; printed page turn and P193 heading.
