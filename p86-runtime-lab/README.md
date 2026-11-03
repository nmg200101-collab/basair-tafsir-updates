# P86.8 — Local V655 asset integration laboratory

SAFETY BOUNDARY: this is **not** a production Basair APK, and has a distinct package name and lab signing key. It is intentionally **not** installed as an update over V655.

Only the generic Android laboratory host and placeholder HTML are kept on GitHub. **No V655 APK, proprietary WebView runtime, Quran data, owner certificates, private signing keys, user data, or tafsir files are uploaded.**

On the local workstation, take the GitHub debug-built APK and inject all `assets/www/*` from the **user's own V655 APK**. Re-sign with an unrelated ephemeral test key; never use owner signing. In Android, this loads protected original offline assets under two different HTTPS origins, with requests intercepted locally and no network fallback.

The initial bridge does NOT provide the original Basair speech, voice, file, or recording services. It intentionally denies microphone and camera permissions and pauses HTML media on context transitions. Such a laboratory does **not** validate Hifz recording, voice session teardown, audio bridge return events, IndexedDB migration, original native Back routing, full Quran page layout, or production latency.

Lab acceptance: both readers become visibly ready; storage separation probe passes; initial visit measures COLD; next visit measures WARM without another document load. After actual Android tests, proceed to native audio bridges. Failure is safe and does not change V655.
