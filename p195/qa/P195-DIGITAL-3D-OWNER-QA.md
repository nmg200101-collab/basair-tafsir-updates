# BASAIR P195 | DIGITAL-3D-OWNER-QA | 17 November 2026

## Owner's field report
P194 / Seq85 is accepted as functioning for the printed page; in digitally
rendered fonts no paper-turn is visible. The owner requested a professional
3D page rotation for the digital font editions as well.

## Root cause confirmed in V694 APK / V695-compatible runtime architecture
P194's visible() explicitly excludes body.stableDigital, and its MutationObserver
only detects replacement of #mushafText > .localPageStage. Digital reading instead
rebuilds the contents of #stableDigitalHost. The B327 exact-15-line font renderer
signals completion through data-b328-state=ready and data-b327-page; at zoom
other than 100%, V160 digital fallback reflows in place.

## P195 solution
1. Observe #stableDigitalHost, using B327's READY state to avoid animations
   on temporary or un-fitted Quran text.
2. For zoomed digital-flow fallback wait for fitting to settle.
3. Retain an inert, ID-free snapshot of the last successfully rendered page.
4. On an adjacent page transition of the SAME digital font, animate two
   independent snapshots in 3D perspective (old page folds, new page unfolds,
   shadow plus gentle 540ms curve).
5. All visuals are inert and pointer-events:none and removed after animation.
6. Reuse the existing P194 on/off setting in Page Tools; honor OS reduced
   motion, skip hifz, continuous reading, large page jumps and font switches.
7. DO NOT change Quran content, ayah highlighting, live text, line-fit
   constraints, P191 size, P193 authentic header, P194 printed behavior,
   V695 app, follow/audio, or Tafsir.

## Focused Chromium test harness: PASS 18/18
- Initial digital page snapshot
- Forward 3D (50 to 51)
- Two independent 3D leaves
- No duplicate IDs / preserve host selector
- Overlay removed after end
- Backward 3D (51 to 50)
- Existing P194 toggle OFF
- Existing P194 toggle ON
- Jump to non-adjacent page ignored
- Font-only change ignored
- Digital page movement following font change
- Continuous mode exclusion
- Original print mode exclusion
- Zoomed V160 fallback priming
- Zoomed digital fallback 3D
- Hifz exclusion
- prefers-reduced-motion honored
- No browser JS errors

Local syntax: node --check P195 JavaScript: PASS.
Source inspection based on V694 signed APK's runtime index.html and the
owner-tested OTA P194 code. Chromium tests are DOM simulations, NOT a
substitute for real V695 field acceptance.

## Guardrail and release
Only add P195 JS/CSS under modules/tilawa. Do not modify the signed
owner-qa P194 Seq85 manifest until generating the new owner-signed sequence.
QA-050 must pass on the FINAL branch head. Sign with original owner Ed25519
approval AND pinned RSA3072 transport signature, verify payload and both
file hashes, and retain an independent signed P194 rollback.
Do not generate a new APK.
