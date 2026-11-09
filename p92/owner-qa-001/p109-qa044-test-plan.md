# BASAIR P109 / QA-044 — owner approved scope; NATIVE BROWSER GATE OPEN

## Owner approval (2026-11-09)
The owner approved the P109 repair and clarified that **More Readers must open the phone's external browser directly**, with no in-app website and no relationship to Basair's embedded WebView. This supersedes the earlier QA-044 draft that used a plain `target="_self"` link.

**Staging PR:** #20  
**Last owner-installed:** QA-043 / sequence 43.  
**QA-044:** reserved; unissued, unpublished, unsigned.  
**Protected main:** must remain unchanged until a fully working, signed, device-tested candidate exists.

## Corrected QA-044 behavior
1. The reader-list button is: «المزيد من القراء — الطريق إلى القرآن».
2. Destination only: `https://way2quran.com/ar/reciters`.
3. JavaScript calls an Android native function `BasairExternalBrowser.openExternalUrl(url)`. No WebView URL navigation is allowed, including error fallback.
4. Android host performs system `Intent.ACTION_VIEW` in a **separate browser activity**; returning via Back or app switcher restores the original Basair WebView and its reader context.
5. If no native bridge is installed, **fail closed** and show an in-app informative notice. Do not open the Way2Quran page inside the embedded WebView.
6. Cancel embedded QA-043 reader overlay when present; no index loading/JSON/catalog caching or alternate embedded player.
7. Preserve original QA-042 cumulative code, Masad, Sobhi, other readers; temporarily hide Amer card without editing its source records or downloaded media.

## Verified facts / blockers
- QA-042 source states explicitly: “This V690 APK does not expose a general ACTION_VIEW JavaScript bridge”.
- QA-043 `location`/iframe/catalogue workarounds are unsuitable for this newly clarified requirement.
- P109 candidate JavaScript now enforces browser-only opening, **but** V690 still lacks the required verified Android bridge. Native reference class staged in `p109-qa044-android-external-browser-bridge.java` is **NOT built into an APK** and is not loaded by JS OTA.
- Existing GitHub repo does not contain the owner private OTA signing key. Earlier `release.json` signed QA-043 envelope cannot be reused for modified assets. No new signature is created.
- Therefore **DO NOT PUBLISH QA-044** as a JS-only OTA at this stage: the user-approved browser button would not open the browser.
- The APK source bundle and owner signing key must be supplied securely to an authorized Android build environment for a narrowly-scoped native bridge patch, preserving `app.basair.qurv2` package ID, original certificate and every protected V690/673 asset.
- Do not move/build from old P88 debug/isolated project as a production substitute.

## Static checks
- JavaScript candidate syntax PASS.
- Original QA-042 cumulative source prefix unchanged.
- QA-043 embedded Way2Quran index absent from candidate.
- P109 browser handler does not call `location.assign`, set an `href`, use iframe, `window.open` or navigate the embedded WebView.
- P109 modifies only R109 reader list DOM and temporarily holds Amer; no reciter source object deletion or change.
- QA-044 **not tested physically on an Android phone**; no claim of working external browser until instrumented/native field validation.

## Device acceptance after a native signed build is available
- Clicking button launches default external browser displaying the original Way2Quran readers page, never as an embedded Basair page or Custom Tab.
- Press Android Back or switch to Basair; selected recitations screen remains intact without navigation reset. Check audio focus behavior; do not claim continued audio without verification.
- Search/reader selection shows no dead Amer play button; stored recordings not removed.
- Playback Masad, Sobhi and at least two more readers (with downloads) remains fully functional.
- Check fonts, Quran highlighting, Quran navigation, Tafsir, Hifz, library, app state persist.
- Sign a fresh QA-044 envelope using same trusted original RSA owner signer. Check SHA-256 of cumulative asset and RSA validation against app public key.
- Save QA-043 signed release and QA-042 rollback. Publish only to owner-qa channel after all checks.
- Observe owner field results; do not finally adopt before user confirms.

## Rollback
Current unchanged `main/p92/owner-qa-001/release.json` remains QA-043 / sequence 43.
Exact signed prior QA-042 envelope is `release-qa-042-before-qa043-20261109.json`.
No `release.json` mutation, merge, workflow dispatch or APK distribution is authorized by a failed/unmet gate.
