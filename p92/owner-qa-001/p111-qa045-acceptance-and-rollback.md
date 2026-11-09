# BASAIR P111 / QA-045 — selected recitations: remove unplayable Amer

**Owner field result:** QA-044 downloaded but Mohammed Hussein Amer still fails to play. Owner directed: check a different playable source, otherwise remove the reader. Owner previously directed removal of "More Readers". Scope applies only to Selected Recitations.

## Source verification (9 Nov 2026)
- Way2Quran lists 114 Amer surahs, and Assabile lists 113, with website players; these pages alone cannot establish a valid direct media file playable inside V690.
- SurahQuran links to IA mirrors that were among QA-042 / QA-044 source candidates and did not work on the owner's handset.
- Direct media HTTP status, content type, decoding and on-device playback could not be verified; do not claim any source works.
- **Decision:** remove only the Amer reader card/access from the selected list; do not keep a knowingly dead play button.

## QA-045 implementation
- Exact QA-044 cumulative JS preserved without modification, then a narrow UI-only P111 IIFE appended.
- The P111 patch removes just a reader card whose normalized heading equals "محمد حسين عامر". A MutationObserver re-applies to R109 rerenders/search. Capture-phase handler blocks stale card taps.
- It also removes any cancelled "More Readers" UI that remains in runtime (QA043/P109). The P110 code above already excluded the embedded 1308-reader directory.
- If Amer happens to be the currently selected reader, use the existing R109 back API to leave that view. Do not directly rewrite R109 state or alter other players.
- Underlying reader catalog, locally saved recordings, downloads, other reader sources, fonts, mushaf, interpretation, memorization, navigation and package ID remain unchanged.
- SHA256 of cumulative JS: `105b0fb54f0e98a71e99ec76b878ffab7d7f92712459ea2dc4fcefb7f51995fb` (218515 UTF8 bytes). JS syntax PASS; mocked DOM confirms Amer removed and Masad preserved.

## Release and rollback
- Owner QA sequence 45, minimum V690, same owner's RSA PKCS1v15/SHA256 key/certificate; QA044 sequence 44 is the retained production rollback baseline.
- Asset descriptors 1–7 identical to existing signed QA044; only final selected-recitation script changes.
- Signed QA045 candidate stored as `release-qa-045-p111-hide-amer-signed-candidate-20261109.json`.
- Before activation: archive exact signed QA044 `release.json` as `release-qa-044-before-qa045-20261109.json`, then verify current sequence, signatures and SHA256, then update only the signed owner-QA manifest.
- Post-update check on Android: Amer absent from list and search, More Readers absent, Masad/Sobhi and other readers play and download, Back works, stored data preserved.
- Because QA sequence is monotonic, rollback via new *higher sequence* signed release rather than replaying sequence 44; saved QA044 manifest remains an audit/restore source. Do not clear app data.
