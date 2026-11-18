# P208 emergency rollback to previously owner-accepted P207 — 2026-11-18

## Owner-observed regression
After P208 Seq115 activation, the printed Tajwid Follow sequence still used the undesired old layout and, importantly, STOP failed to return to the exact accepted static page that P207 restored correctly. The owner explicitly requested immediate return to the previous update P207.

## Exact owner-approved rollback
- Live prior release: **P208 Seq115**, tilawa v233 (includes p208-print-follow-surface.js), tafsir v51, updates v200.
- Owner-signed recovery: **Seq116**, tilawa v234, tafsir v51, updates v200.
- Seq116 tilawa/tafsir/updates **asset arrays are byte-for-byte identical to P207 Seq113**; no P208 asset is referenced.
- The increased sequence and tilawa module version allow the original P121 installer to install the old, proven P207 assets without violating monotonic replay protection.
- Existing original P207 module files remain on the protected main branch; no new Android APK or native code modifications are needed.
- Owner RSA3072 signature and independent Ed25519 signature PASS offline using public keys pinned within the actual supplied V695 APK. Owner approval expires 2026-11-23T07:31:18Z.
- User data (notes/favorites), Quran image content, QA-050, and unchanged Tafsir/Updates module versions remain intact. No private keys, passwords or user data are included in this PR.

## Execution and follow-up
This PR intentionally modifies only the owner-qa signed manifest and this QA note. Do not alter any signed payload bytes. Run only the single repository-required guarded-change-check; no Codemagic, no APK build, no extra CI. On success merge, verify the live raw release equals the signed source and reports Seq116. Have owner force-close and reopen V695, then validate printed Follow STOP returns to static page. Device acceptance remains pending until confirmed by the owner.

## GitHub CI metadata
The earlier manifest-staging commit had a CI-skip marker in its commit message, which prevented the required check from running. This follow-up documentation commit intentionally omits CI-skip markers so that the protected branch check can run and the owner-lock ruleset remains enforced.
