# P202 — Restore P189 screenshot / owner QA

User selected the page appearance shown in their 16 November 2026 18:48 phone screenshot.
The screenshot precedes P190's new header (P190 issued 16:29 UTC = 19:29 Yemen), and follows P189 (15:31 UTC = 18:31 Yemen).
Exact rollback target: P189 / Seq75, not P191 or P193.

This is a *new* signed OTA Seq103 because devices at Seq101 cannot accept old sequence 75.
The 10 original P189 Tilawa asset descriptors are identical to the original owner-signed protected digest and were checked 10/10 against current repository sources.
Restore original page header/size and native follow behavior; remove P190–P201 Tilawa assets from active manifest. Preserve V695, 26 Tafsir assets and 1 Updates rollback UI asset.

Independent signed emergency Seq104 keeps previous Seq101 Tilawa content but is NOT activated. Use only with explicit troubleshooting approval. Local rollback button may still see previous Seq101: do not use it unless specifically intended.

RSA3072 transport and Ed25519 owner approvals signed with original V695-pinned keys, validated immediately. QA-050 guarded-change-check must pass for final PR head and merged main before declaring server publication. Real Android field acceptance pending.
