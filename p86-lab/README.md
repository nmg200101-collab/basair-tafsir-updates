# P86 synthetic dual-WebView Android lab

**ISOLATED EXPERIMENT: NOT BASAIR QURAN.**

This folder is intentionally stored in the `p86-lab-isolated` branch only.
Do not merge this branch into `main` (tafsir publication branch).

This project has a separate package ID (`p86.lab.isolated.synthetic`) and uses two synthetic HTTPS origins:
- `https://tilawa.p86.invalid/index.html`
- `https://hifz.p86.invalid/index.html`

The app keeps two WebView instances alive, toggles visibility, measures first-load and subsequent warm switching, and probes whether localStorage is isolated by origin. The synthetic pages contain *no Quran text* and make *no production audio/speech claims*.

The test uses synthetic acknowledgment of media release, which cannot prove compatibility with V655's native voice and speech bridges. It does not solve Basair's production delay, nor test IndexedDB migration or original 604 pages.

The GitHub Actions workflow is scoped to the P86 branch and files only. It builds a **debug-signed laboratory APK**, not an update to V655. No original owner signing materials, V655 APK, protected sources, backups, interpretation content or user data are published by this branch.

On the device: open both tabs once; then switch back and forth. The status shows cold vs warm transitions. Click "فحص التخزين" after both are loaded.

Do not install the lab expecting it to update the original Basair app.
