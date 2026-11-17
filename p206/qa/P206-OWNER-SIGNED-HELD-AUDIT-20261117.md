# P206 — Offline owner signing audit (2026-11-17)

**State:** SIGNED-HELD, **NOT PUBLISHED**. This document contains public verification data only; no private Ed25519/RSA key, passphrase, P12, or signed envelope is committed here.

## Prior checks
- Exact P205/Seq109 owner-signed module descriptors transcribed and checked against original signed payload, 38 records. Full modules JSON length 6131 bytes, CRC32 `ac00e616`, protected module SHA256 `30a38dfc92be69a158afa89354d423e3976214a3ca039507b68433703f61b681` — MATCH.
- New three P206 asset sizes and SHA256 sourced from [green P206 packaging CI](https://github.com/nmg200101-collab/basair-tafsir-updates/actions/runs/44130727689); live PR branch source sizes rechecked.
- Owner Ed25519 PEM successfully decrypted offline with the separately archived password, keypair matching the pinned P121 public key (passphrase never disclosed here).
- Original Android RSA3072 owner PKCS#12 key/certificate validated; public SPKI SHA256 `ca29e72d263432c7347dcb0e5b376c142401ad24b543b7ab6d2fc1c2f92e5e88`, cert SHA256 `35066b87e4b854187b5c8fa8321676bacc2de8bef14624072afb33ebd506dc07` — MATCH.

## Local signed candidates
- P206 / Seq111, Tilawa v229, Updates v198, Tafsir v51, **41 signed asset descriptors**. Envelope SHA256: `ec617c3633b295f792b8452fae72f298fac1d72d4d62466768dc6e36bcd7f8bd`.
- Emergency restore / Seq112, Tilawa v230, Updates v199, Tafsir v51, **38 signed asset descriptors**. Envelope SHA256: `f5b9e9e5477bbf490fe03c8c1d633a9e99fd324b33d1f7714b799295c5509732`.
- Owner approval Ed25519 expiry: **2026-11-22 17:37:20 UTC**; regenerate signatures after this instant or if payload or asset hashes change.
- RSA3072 and Ed25519 signatures verified independently with Python cryptography and Node.js WebCrypto (same signature algorithms and proof string as P121). Both PASS.
- Signed envelope copies exist only in the private local handoff, not in git and not at `p121/owner-qa/release.json`.

## Release gate
1. Full Android WebView owner acceptance for BOTH original and Tajwid printed editions: follow starts on first tap, framed page advances, pause/resume, Stop returns to static framed page, zoom and audio remain correct.
2. Owner approval that archived versions are **actually stable** (not just signed); staged module supports up to 6 stable snapshots only after live capture and verification.
3. Confirm PR source hashes and QA-050 guard, then stage Seq111 on the authorized owner-qa channel with a confirmed, tested emergency rollback.
4. If above gates do not pass before Ed25519 expiry, re-sign against same pinned keys before release.

**No APK built or uploaded. No device data modified, and no OTA published.**
