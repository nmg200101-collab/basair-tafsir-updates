# BASAIR-P95-QA020 — Restore approved Mushaf font (STAGED, NOT RELEASED)
Date: 2026-11-07
Base: V690/P92.3, owner QA019 / sequence 19
Branch: `fix/p95-qa020-restore-printed-font-20261107`

## Field report / diagnosis
Owner reports the original approved Mushaf typeface/line proportions are still wrong after QA019 and suspects the regression began before QA017.
Source comparison QA015 → QA016 → QA017 → QA019 found:
- QA017 appended a JS observer which sets `font-size: ... !important` on B345 continuation-page `.b327UnicodeLine` items when above reference font size.
- QA017 appended CSS with `font-weight:400!important`, `font-synthesis:none!important` and text shadow/stroke resets on `.b345ExactPage.bq947-font-parity .b327UnicodeLine`.
- QA019 kept both QA017 changes while appending reader-header styles.
- QA015/QA016 contain no new direct `.b327UnicodeLine` typography overrides. This is a **source-level causal candidate**, not yet proven on the owner's actual phone.

## QA020 minimal candidate (two new, inert assets)
1. `p951-font-restored-follow.js`: exact bytes of previously published QA016 JS; removes only QA017's appended font parity observer. All pre-existing settings and audio/recovery code remain.
2. `p951-font-restored-header.css`: exact QA019 CSS except the single QA017 `/* Continuation-page typography */` block is removed. QA017 R95 ayah/word highlight colors, QA016 shade controls, and QA019 centered header/logo remain exactly unchanged.
3. NO edits to `release.json`, application code, APK, keystore, or Quranic text.
4. When packaging for QA020, **replace** the QA019 CSS and QA017 JS manifest entries with these two new assets; do not append both copies to the runtime. Keep the other six assets byte-identical. Do not publish an unsigned manifest. Compute actual byte lengths and SHA-256 on the secure signing machine, sign the payload using the existing owner's private key without uploading/exporting it, and verify with V690's embedded public key.

## Static QA performed here
PASS: JavaScript parses as a function without execution.
PASS: CSS brace structure balanced.
PASS: New JS is byte-identical to QA016 JS.
PASS: QA017 JS inline font-size mutation/observer is absent.
PASS: QA017 CSS page-font weight override is absent.
PASS: QA017 ayah/word highlight selectors remain.
PASS: QA019 entire header block remains byte-identical.
PASS: Main and branch `release.json` blob SHA identical (`477231d070ca03d0f23baa70c1f5cd479fd07f64`).
PASS: no original V690, no Quranic text/604 pages, no native engines modified.

## Test plan — pending, MUST pass before adoption
- Test a **signed, owner-only QA020 candidate**, never a production activation.
- Compare same page and zoom 100% before/after: exact font family, weight, baseline, word width, 15 rows, page frame, first and last line not clipped.
- Compare original print, tajweed-color print, Uthmani; first load and returning from another edition.
- Page 1, 2, 3, middle and a late page; change page, exit/return, reopen WebView.
- Compare zoom >100%, vertical scroll, audio Follow normal/large mode, restart and stop/Back, non-voice reading and selected recitations.
- Check centered logo and labels plus day/night toggle and font-tool accessibility.
- Check Tafsir/Hifz/Library, saved locations, installed signature, and rollback.
- If header 40px still alters the reading viewport or any line geometry, classify as FAIL and revise **header isolation only**, not Quran font engines.
- Roll back owner QA channel to a known-good signed release if any text obscuring/blank page/sound issue occurs; never uninstall/clear app storage.

## Deployment gate
**NOT SIGNED — NOT UPLOADED TO ACTIVE CHANNEL — NOT PHONE TESTED — NOT APPROVED FOR RELEASE.**
The two files are inert until referenced by a new signed manifest.
Owner's `main/p92/owner-qa-001/release.json` is still QA019 (sequence 19).
