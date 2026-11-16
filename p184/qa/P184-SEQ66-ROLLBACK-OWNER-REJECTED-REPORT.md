# P184 OWNER REJECTION → P183 RESTORE (16 November 2026)

Owner explicitly rejected the P184/Seq65 Android update and ordered a return to the previous version.

## Rollback contract
- Preserve the installed signed APK V695 (app.basair.qurv2); no APK generated.
- Activate the independently owner-signed P184 rollback envelope at `p184/P184-SEQ66-OWNER-SIGNED-ROLLBACK.json` as `p121/owner-qa/release.json`.
- The new **sequence is 66** (strictly greater than Seq65) and the nominal tilawa module version is **185** for monotonicity, but the actual **11 tilawa assets are exactly the same as the accepted P183/Seq63 assets**.
- All 26 tafsir v51 assets remain bit-for-bit identical to the signed P183/Seq63 snapshot.
- No P184 CSS/JS entries appear in the activated rollback manifest; the source files remain archived in GitHub for audit only and are NOT part of the active OTA asset list.
- Current rejected Seq65 is retained for audit at `p184/P184-SEQ65-REJECTED-BEFORE-SEQ66.json`.
- The prior baseline is `p183/P183-SEQ63-OWNER-SIGNED-BEFORE-P184.json`.

## Independently verified signatures on local signed rollback file
- SHA-256 of rollback envelope: `2f3b8caa8f565ce31db111561d8abdce27e3c15d5c79211119008c99bad87353`.
- Git blob expected: `cda81c33f05f0b240d961b85a6dacaf506432077`.
- RSA-3072 PKCS#1 v1.5 / SHA-256: PASS against APK P121 pinned public verifier.
- Ed25519 owner approval: PASS against APK P121 owner public key, raw pin SHA-256 `47fec7dbe6fc3949c01b000658b2f2d376adcbd98c42c02cdc280c313ec7dbcf`.
- Protected modules SHA-256: PASS against `JSON.stringify(lockedModules)` canonicalized as in the APK.
- Approval expiry: 2026-11-20T09:30:00Z; valid for this rollback at time of review.
- No keys or credentials have been copied to GitHub.

## Publication safety gate
- Require successful `tilawa-owner-lock` GitHub Action on final rollback PR head.
- Merge only after verifying active proposed release matches exact signed Git blob and previous snapshot.
- After merging, re-fetch main `p121/owner-qa/release.json` and verify sequence 66 and exact file equality.
- Cloud rollback is distinct from on-device acceptance: restart V695 after download and test P183 print/font behavior. Do not claim that P183 has no print regressions (owner earlier reported some). The request is specifically to remove P184 changes.
