# P225 — Android WebView raster QA dispatch (2026-11-26)
- Separate private build repository: nmg200101-collab/basair-quran-p88-build.
- Branch: qa/p225-android-webview-raster-20261126.
- CI configuration commit: 857d4d1592e56fc2b85a8aa997131da0a492075b.
- Candidate viewport copied from update repository commit 5798a1fcf24fb1ddac5334b1476c3a43ef5a0494; expected SHA256 7cec81aec32fd8f5581294b7dd0f3d7dac4658b50f4da035df41f5b7421815f3. CI explicitly checks this digest.
- New job p225-android-webview-raster uses CircleCI android:default VM, KVM and Android API 32 x86_64 emulator. It restores and verifies V694 WWW archive, extracts original Tajwid pages 10–12, and runs the 14-check raster fixture in an actual Android WebView, not desktop Chromium.
- Isolated ephemeral QA package app.basair.qa.p225.raster, temporary signing key only; no distribution APK, owner key, or owner package changes. No release publishing task. Evidence includes WebView provider, logcat, moving and final screenshots when generated. Synthetic DOM touch events and digital sentinel are limited fixture checks, not human touch or native shadow acceptance.
- GitHub combined commit status at first query: empty; CircleCI job execution not confirmed. No screenshots or actual test results available yet.
- Local runtime inspected: java and Chromium available; adb/emulator/sdkmanager/avdmanager and /dev/kvm absent. No APK in /mnt/data. Original owner-signed V695 APK remains required for full acceptance; restored V694 WWW archive is not equivalent.
- No rerun of 144 simulated checks, no P225 production code change, no owner-qa manifest change, no signing of Seq147/148. Full nine-item device gate remains NOT_RUN. Do not infer app acceptance from this restricted raster job even if it succeeds.
