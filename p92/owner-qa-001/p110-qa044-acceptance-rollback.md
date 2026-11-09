# BASAIR P110 / QA-044 — Selected recitations only

**Owner changed scope (2026-11-09):** Delete "more readers" (any external site/index/browser) and finish the Selected Recitations screen, focusing exclusively on Mohammed Hussein Amer playback. Keep Abdul Rahman Masad, Islam Sobhi and all existing stable application/Android sections unchanged.

## Patch design
- Cumulative asset: `p110-qa044-selected-amer-audio-with-qa042.js`, SHA256 `97999d4e99b853f91fc0859258315b6e29f11eb7c49449b18682bdd105360ef9`, UTF8 bytes `214961`.
- Exact prefix of QA-042 cumulative unchanged. QA-043 added site-based 1,308-reciter index is intentionally **excluded**.
- Remove QA-043 `#bqP108MoreButton` / panel/overlay and any P109 staging link; CSS prevents stale runtime visual resurfacing. No internet reader index request from this patch.
- Restore Amer in selected reader list. Do not delete or alter recorded downloads, saved positions or favorites.
- On Amer selection only, resolve legitimate surah number 001..114 and start with Archive.org download endpoint; if Android audio errors, try 2 Archive mirror variants. This is a **best-effort retry**, not proven that these origins work for all networks.
- Preserve R109's original native HTML audio control, cached offline blobs, state, playback preferences, source list, onended/onplaying handlers, and unrelated readers.
- Keep Masad TVQuran and Islam Sobhi MP3Quran source strings identical to QA-042. No APK, app ID, font, Qur'an, Tafsir, Hifz, Home or Back changes.

## Static and mocked validation
- Full JS syntax checked PASS; exact QA042 cumulative prefix unchanged.
- Mock DOM: old "more readers" button removed, Amer reader kept visible, Masad URL unmodified, Amer URLs auto-filled; simulated error routes archive.org -> ia801600 -> ia800104, then original error fallback. Counted 2 retries.
- QA-043 release assets 1..7 retained exactly (CRC metadata, sizes, hashes); new script is the eighth asset.
- RSA PKCS1v15/SHA-256 signature verified with original owner certificate and pinned V690 public key (offline).
- Signed candidate P110 QA044 sequence 44 is on staging branch. Check latest QA043 main sequence before publication.

## Critical external and Android acceptance
- Archive.org `001.mp3` appears as a direct download link on SurahQuran, yet web-fetch tooling failed following redirect to the Archive media host; this **does not prove HTTP audio works**. Assabile lists 113 tracks but downloads inspected led to ZIP (not playable by HTMLAudio). Avoid claims of verified bytes or real phone playback.
- On owner Android V690: after applying QA044 update and reopening recitations, confirm no "More readers" button, Amer visible, 001 and another medium/long surah play in Android audio player and download caches.
- Verify source error behavior; if all 3 origins fail, show normal source/error UI and retain QA043 rollback, treat audio repair as unresolved; do not claim complete.
- Test Masad start/play, Islam Sobhi and 2 other readers, back navigation, last position, storage, other sections.
- Preserve exact signed QA043 backup at `release-qa-043-before-qa044-20261109.json`. Do not purge user data. Reverting release requires properly signed new higher-sequence envelope or the app's supported rollback option, not overwriting the active manifest with an older sequence.

## Owner QA
Signed update should only be offered through the already-approved owner-qa channel after checks. Field-test status must remain **UNVERIFIED** until owner confirms audio on phone.
