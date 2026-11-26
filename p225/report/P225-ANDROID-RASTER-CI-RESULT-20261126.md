# P225 — limited Android WebView raster result
- Source of result: GitHub combined status for build repository nmg200101-collab/basair-quran-p88-build, commit 857d4d1592e56fc2b85a8aa997131da0a492075b.
- Context ci/circleci: p225-android-webview-raster: success.
- Job: https://app.circleci.com/workflow/c2092aea-5d17-457a-ad1f-6c7fc6c92e1a/job/e7de16f7-6b32-4799-a949-0dbc5768e374
- Runner requires PASS 14 from the isolated Android WebView raster fixture. Successful CI status is evidence at job level; raw result.log, provider report, screenshots, and runner logs have not been independently retrieved in this session.
- Coverage: actual Tajwid images restored from verified V694 archive and pinned P225 viewport; limited vertical geometry, next page, synthetic manual gesture, reset, teardown. Digital sentinel is not native digital shadow. No original edition, audio, V695 reader bridge, zoom or precise ayah/surah repeat acceptance.
- Full application acceptance remains NOT_RUN. No release signing, deployment, merge, or modifications to baseline. Seq146 remains the required reference. A private search for the original APK name and known SHA-256 returned no matching code-search result; this does not prove absence from other storage.
- Next prerequisite: original owner-signed APK (known SHA256 925f6116899ad8acf1cba2a9ec75d04db7951af66ad5b3de98b7cbc7cba9d384), accessible to a supported Android test environment, with local candidate injection and no OTA publication. Do not treat V694 restored assets as the original V695 APK.
