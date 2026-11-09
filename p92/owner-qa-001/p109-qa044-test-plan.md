# BASAIR P109 — QA-044 staging / approval gate

**Branch:** `fix/basair-p109-qa044-more-readers-amer-hold`  
**Base:** `f6d4939dee0b21cf35ed62802f7aba1abdd33790` (QA-043)  
**Current production/owner release:** QA-043; **no update published or signed**.  
**Candidate script:** `p109-qa044-direct-way2quran-hide-amer-with-qa042.js`

## Verified code-level scope
- Reuses the exact QA-042 cumulative JavaScript, with P109 UI-only extension. It omits QA-043's embedded Way2Quran directory, JSON index fetch, track sharding, cache, and all QA-043 Amer MP3 rewrites.
- Inserts a single real HTTPS link in `#r108List` when R109 is on its reader list: **المزيد من القراء — الطريق إلى القرآن** → `https://way2quran.com/ar/reciters`.
- Temporarily hides Amer card by DOM-only visibility and blocks Amer playback CTA if an already-open Amer screen is restored. Original audio data, favorites, files and source configuration remain unmodified.
- Uses a normal `target="_self"` HTTPS anchor rather than an embedded reader index, iframe, or `target="_blank"` popup, which the V690 QA-042 code documents as unsupported.
- Does not modify other reader URLs, especially عبدالرحمن مسعد and إسلام صبحي; does not edit R109 engine, native back bridge, Qur'an, tafsir, memorization, fonts, motion or overlays.
- JavaScript syntax checked. The unchanged QA-042 prefix was compared before staging.

## External source investigation
- QA-042 sends Amer surahs to an Internet Archive mirror, with an older fallback in P105.
- QA-043 replaces the Amer tracks with guessed CDN-looking paths under `media.way2quran.com/muhammad-hussein-amer/hafs-an-asim/NNN.mp3`.
- The official Way2Quran reciter page lists 114 surahs for Amer, **but a playable MP3 response could not be verified** using the available tools. Do not advertise internal Amer playback until Android device validation.
- Conservative choice for QA-044: hide the **entry point** temporarily; preserve files and restore later only after proven HTTP 200/206 audio bytes plus real device playback.

## Acceptance — pending on Android owner handset
1. Install signed QA-044 **only after explicit owner approval** through existing owner-qa mechanism.
2. Open «التلاوات المختارة»; verify exactly one visible «المزيد من القراء — الطريق إلى القرآن».
3. Tap the link; verify original Way2Quran catalog opens (not internal directory). Check Android Back and app's R109 screen/audio state. **Native external browser routing cannot be guaranteed from JavaScript-only OTA on V690**: if in-place navigation loses state or interrupts audio, reject QA-044 until native bridge is provided; do not claim PASS.
4. Ensure Amer card is invisible in normal reader list/search. If the app was on Amer before update, confirm no dead play buttons are shown.
5. Confirm عبدالرحمن مسعد plays; إسلام صبحي remains and plays; check at least two other readers and their downloads.
6. Confirm reciter card sizes, Tafsir/Hifz/library, Mushaf fonts/motion/highlighting and Back behave as before.
7. Verify no console errors; inspect `window.__BASAIR_P109_QA044__.diagnostics()`.
8. Only after passing tests approve the signed release, then await field result before final adoption.

## Publication / rollback
- Do **not** modify `p92/owner-qa-001/release.json` or `main` until approval and signature from the existing owner signing process; do not fabricate a signature.
- QA-043 exact signed release remains available on `main`; the earlier QA-042 signed envelope is archived in `release-qa-042-before-qa043-20261109.json`.
- Use QA-044 sequence only after confirming that it remains unused and sign an envelope containing the audited cumulative file.
- Branch is staging only; **do not merge automatically** or run release publishing jobs.

## Known limitation
The V690 WebView implementation has no verified `ACTION_VIEW` JS bridge. A normal HTTPS link will reach the site, but opening a separate browser and preserving in-memory state on return must be confirmed on the device. If Android keeps the link inside the WebView, a native host patch may be necessary to guarantee all navigation/audio requirements.
