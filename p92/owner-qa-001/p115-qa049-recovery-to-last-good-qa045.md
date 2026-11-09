# BASAIR P115 / QA049 — restore owner's last good Selected Recitations state

## Field report / owner instruction
Owner used the native **رجوع** action twice after QA048 but both previous versions retained Quran print faults. The last known good baseline was **immediately after completing Selected Recitations**, before the Uthmani work began. From signed owner-qa archive this is **QA045**. Owner explicitly requests return to that stable state, disabling the problematic Uthmani print completely rather than continuing experiments.

## Recovery design
- **No new browser code, no renderer replacement, no APK build.**
- Re-issue the exact eight signed **QA045** asset descriptors as **QA049, sequence=49**, ensuring it is newer than the deployed QA048 / the handset's rollback stages.
- This restores: original print, coloured Tajweed print, and the old P93.2/P96.1 Uthmani printing HOLD.
- The Uthmani option is hidden in printed edition choices and forcibly redirected to Original if a stale saved selection or previous UI enters `blue` mode. Digital Arabic fonts unrelated to print are left alone.
- Selected Recitations code is **identical to QA045**: Masad / Sobhi source paths preserved; unplayable Mohammed Hussein Amer soft-removed; cancelled More Readers absent.
- No change to original Quran image assets, Hifz, Tafsir, Library, downloads, package ID or Android owner signing.
- No new CSS/JS files required: eight existing QA045 assets are present with verified SHA256 hashes. Publishing only changes the signed manifest pointer `p92/owner-qa-001/release.json` (along with archival report).
- **Do not reopen the suspended Uthmani printed edition** until an independent device-tested implementation exists.

## Verification
- Historical QA045 8 assets rechecked on main GitHub: exact byte sizes/SHA256 hashes all match.
- New QA049 manifest is schema1, owner-qa, sequence49, minAppVersion690, 8 resources, total 291986 bytes, identifier `P115-QA049-RESTORE-PRINTED-EDITIONS` within 50-character receiver policy.
- New envelope RSA-PKCS1v1.5/SHA256 owner signature verified offline with original signing certificate (verified locally against the original owner certificate); compare original QA045 payload resources 1:1.
- The source of truth for signed certificate thumbprint is the original secure signing kit; no secrets uploaded.
- OTA receiver accepts sequence49 on V690 and validates resources independently.
- **On-device playback/rendering not validated in this session.** Acceptance after update: original and Tajweed visible, no blank white page in either mode, Uthmani hidden/disabled, navigation/back works, Masad/Sobhi unaffected.

## Release / rollback safety
- Archive live signed QA048 manifest exactly to `release-qa-048-before-qa049-20261109.json` prior to switching.
- Merge this QA049 signed envelope + report only. Do not merge unrelated QA046–QA048 experimental display branches.
- Re-check current `release.json` sequence48 before activating new signed QA049. Preserve owner certificate, local user data and existing offline cache.
- Changing active manifest is the only activation. After update, fully restart Basair to clear old JS/CSS from QA048 WebView memory.
- If updater reports no available updates after manual rollbacks, close/reopen app and retry check; do not reset app data.
