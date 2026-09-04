# Basair Quran — Tafsir Updates

مستودع التحديثات الآمنة لمحتوى **تفسير بصائر القرآن**.

- Manifest: `basair-tafsir-manifest.json`
- Current schema: `basair-tafsir-update-v2`
- Published Basair surahs in the manifest: 3–8
  - 3 آل عمران: 200/200
  - 4 النساء: 176/176
  - 5 المائدة: 120/120
  - 6 الأنعام: 165/165
  - 7 الأعراف: 206/206
  - 8 الأنفال: 75/75 — latest published surah
- Content is split into SHA-256 verified parts under each `surah-XXX/001/` directory.
- The app installs a surah only after all parts pass count, sequence, required-field, and SHA-256 validation.
- The app keeps Quran text locked to its local Mushaf data; remote Tafsir packages cannot replace Quran text.
- If any download or validation fails, the existing local/cached Tafsir remains unchanged.

This repository contains Tafsir update data only. The locked Quran text inside the app is not updated from this repository.
