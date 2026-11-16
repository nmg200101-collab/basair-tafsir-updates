# P193 — Owner QA: original green Mushaf header
Date: 2026-11-16
Baseline: V695 / P192 Seq81 / tilawa v200 / QA-050.

## User report
On Android page 51 (Al-Imran), P192 shows 3 separate white capsules
(Surah in center, Juz on right, page on left) instead of the original
integrated green-and-gold Mushaf heading. The existing font/page fit was
accepted. Do not proceed to 3-D page-turning before this is fixed.

## Root cause / minimal source change
P190 masked the central upper band of approved-frame-v682.webp;
P192 put its own three pill backgrounds and borders on top.
One NEW CSS file unmasks the already-shipped ORIGINAL decorative image
on Tajwid continuation pages only and removes individual pill backgrounds,
borders and shadows. It reuses the dynamic metadata from P192.
Do not modify the source Quran imagery, P191 transforms, digital/standard
printing, page navigation, the bottom Tajwid legend or any Tafsir assets.

## QA gates (focused; no redundant builds)
1. Page 51: original GREEN integrated header, labels over the image, no pills.
2. Page 50: genuine QPC surah-opening raster head; no overlay duplicate.
3. Page 525: title At-Tur from its first ayah; not An-Najm at page bottom.
4. No new margins / no clipping of first or last line / footer preserved.
5. Confirm printed original and digital modes are unchanged.
6. Run QA-050 tilawa-owner-lock before merging; verify signed delivery
   against RSA3072 + Ed25519 owner keys before updating owner-qa manifest.

## Release safety
STAGING SOURCE ONLY. Current p121/owner-qa/release.json remains the signed
P192/Seq81 production manifest. These files are not automatically applied
until a NEW valid owner-signed sequence is issued. Do not merge/publish an
unsigned manifest, do not generate a new APK, and retain signed Seq82 rollback
restoring P191/Seq79.
Next independent phase: P194 optional 3D page-turn effect.
