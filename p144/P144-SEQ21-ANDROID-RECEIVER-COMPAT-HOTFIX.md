# P144 / Sequence 21 — Android OTA Receiver Compatibility Hotfix

## Actual field issue
Owner reports no Seq21 notification after Seq20 was received. The signed Seq21 file existed on the public GitHub OTA path, but **V694/V695's bundled `assets/www/p121/universal-updates.js` rejects the manifest before notification**:

```js
!/^[a-zA-Z0-9-]{1,70}$/.test(m.id)
```

- Previously signed P144 ID length: **71** (invalid).
- Corrected ID: `P144-TAFSIR-COMPACT-STATUS-TTS-OWNER-QA-20261113` (**48** characters).
- **Same Sequence 21, Tafsir module v19, same six assets, same notify mode.**
- Original rejected envelope cannot raise IndexedDB `highestSequence` because `verifyEnvelope` runs before `readState`.
- No APK, protected QA050/Tilawa file, Android native bridge, user's local settings or user data changed.

## Proof / validation
- Original owner-signed envelope cryptographically verifies but is rejected by the **real bundled receiver** with `البيان غير متوافق مع إصدار التطبيق`.
- Shortened-ID envelope was **re-signed using the owner's original RSA signing certificate in a private local environment**, never in GitHub, and accepted by that same embedded receiver under WebCrypto.
- The repaired signed envelope has exact Git blob SHA `1c477b844b61a4aa30a747f3dfa6264dc77c8837`.
- `p121/owner-qa/release.json` and `p144/P144-SEQ21-OWNER-SIGNED-RELEASE.json` must match byte-for-byte.
- Regression check now asserts the 70-character ID ceiling in `p144/tests/test-p144-signed-release.cjs`.

## OTA endpoint and acceptance
The embedded receiver checks:
`https://raw.githubusercontent.com/nmg200101-collab/basair-tafsir-updates/main/p121/owner-qa/release.json` (public raw GitHub origin, `cache:'no-store'`).

After this branch merges, reopen app → **التحديثات الشاملة** → **فحص التحديثات** → **تحديث الآن**, then restart WebView/app once.

**Important:** GitHub presence and signed validation do not prove physical-device delivery. Owner should verify the notice and rendered P144 UI on the handset. If still blocked, capture the **exact status text** displayed in the update dialog; investigate network/IndexedDB next rather than incrementing the sequence or rebuilding APK.
