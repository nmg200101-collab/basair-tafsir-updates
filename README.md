# Basair Quran — Tafsir Updates

مستودع التحديثات الآمنة لمحتوى **تفسير بصائر القرآن**.

- Manifest: `basair-tafsir-manifest.json`
- Current schema: `basair-tafsir-update-v2`
- Surah 3 (آل عمران): version `001`, 200/200 ayahs
- Content is split into SHA-256 verified parts under `surah-003/001/`.
- The app installs a surah only after all parts pass count, sequence, required-field, and SHA-256 validation.
- If any download or validation fails, the existing local/cached Tafsir remains unchanged.

This repository contains Tafsir update data only. The locked Quran text inside the app is not updated from this repository.
