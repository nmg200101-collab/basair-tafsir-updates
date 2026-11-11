# BASAIR P128 — Tafsir Follow + Manual Reader Coexistence / Restart Action

**Status:** Owner-only QA candidate, signed OTA manifest sequence 5, `deliveryMode: notify`, minimum V694. Does not change P92/QA050/owner lock, Quran data or Android package.

## Field issue
Owner reported (11 Nov 2026): P126 manually swiping while Follow ran stopped Follow, sometimes the same verse was repeated, and a restart button was missing after universal OTA completion. Screenshot at sources/method section where manual reading ended.

## Implemented
- `p128-verse-tools.js`: replaces **P126 Tafsir v3** with **v4**. Removes automatic Follow **stop()** from touchmove/wheel; uses R114/P120's own `fingerPaused` → resume-on-pointer-release. Deliberate **Stop** and timer expiry still stop.
- R114 P120 and native STEP5 both can advance verses. When R114 is running, script sets reader-local `data-basair-main-tab=p128-follow` to suppress native STEP5's independent auto append on window scroll. Restores `tafsir` on stop, without changing any visible tabs. Native STEP5 source code remains intact.
- When Follow is started from a manually appended multi-verse stack, selection is reopened through the original STEP2 interface before running R114 to ensure R114 has **one well-defined current ayah** rather than the first old `data-t2ayah` in a stack. Cancel token ensures a late ready callback cannot restart an intentional Stop.
- Keeps small note above toolbar, Follow/Stop within bar, copy PNG export, original P120 no-flicker transitions and P126 manual-next fallback.
- `p128-updates-restart.js`: **updates** module v1. Adds **«إعادة فتح التطبيق»** after a **confirmed completed** universal update in the in-app update dialog/banner, using `location.reload()` so verified cached modules reinitialize. It **does not restart the Android OS/native process**.

## First-install restart limitation
V694's original receiver does not yet include the new restart control. When **P128 is downloaded for the first time**, the newly downloaded `updates` module only begins on the **next app start**. Thus the owner must **close and reopen V694 once** after installing P128. After that, the button appears for subsequently staged updates. Neither the original receiver nor security checks may be patched live without a new APK.

## Local evidence
- Legacy UI/regression: 63/63; actual STEP5 + B231: 24/24; actual R114 start/stop/speed: 30/30; copy/export PNG: 60/60.
- Targeted P128 anti-duplicate/continuation: 36/36; actual R114 touch/swipe and explicit Stop: 24/24; restart dialog/banner: 21/21; V694 exact signed OTA receiver test: 17/17.
- **Total 275/275 local checks**, with overlaps across fixtures. Chromium/Node simulation, not real Android WebView. Real on-device 20-ayah continuous read remains acceptance blocker.
- Signed RSA envelope includes `sequence=5`, `deliveryMode=notify`, Tafsir v4 + Updates v1; RSA verified against exact V694 `PUB`, 3 assets match SHA256 and size.

## Rollback & security
- Existing P126 Tafsir v3 is preserved as previous for rollback. 
- The first P128 rollback of the `tafsir` module also restores the previous bundle; updating the `updates` module is independent.
- Do not publish to everyone until owner tests manual reading at 15–20 verses, gesture continuation and stops. The new code is **test-only**, not a native APK.
- No private key, password, PKCS12 or original signed APK is included in this folder/repo.
