# P204 / Seq107 — Owner-directed return to P189 zoom era

The owner explicitly rejected the P198–P203 attempted Follow changes and requested the last stable version preceding printed Tajwid header changes, when the size shortcut in Tools was correct. That version is **P189 / Seq75**, prior to P190's first header edits.

The signed Seq107 manifest includes exactly the ten original P189 Tilawa asset descriptors, including `p187-stable-page-size`, `p188-stable-size-direct-print`, and `p189-size-shortcut-native-tools.js`. No P190–P203 Tilawa assets remain active. The 26 Tafsir and one Updates/rollback asset are byte-identical to the active P203 baseline. Original V695 APK remains in place; no code or signing keys are published.

**Security:** signed with original owner Ed25519 approval and RSA-3072 transport keys, independently verified using pinned public keys from the installed application's updater. Sequence 107 > 105; Tilawa v225 > v223. Approval expiry is within the application's seven-day limit. Emergency Seq108 is separately signed to reassert the same stable P189 asset set without reintroducing P203. QA-050 guard required on PR final head and merger commit.

**Known limitation:** The recurrent 'Follow' issue is NOT fixed by this rollback; only the historically working older version is restored, and the original zoom shortcut remains. Never describe the Follow bug as fixed without Android field verification.
