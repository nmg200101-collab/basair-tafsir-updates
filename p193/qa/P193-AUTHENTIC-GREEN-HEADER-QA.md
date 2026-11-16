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

## Direct source-raster inspection (V694 original owner-signed APK; read-only)
- Extracted the original 720×1280 approved-frame-v682.webp, tajweed-050.webp and tajweed-051.webp for focused visual geometry checks; no APK was rebuilt.
- At x=360,y≈62, center background is opaque ivory; surah text must be deep green #164b36, not ivory.
- At x≈147 and x≈575,y≈62, background is opaque green; both side labels remain ivory.
- At x=360,y≈173 the frame is transparent; first ayah area is not blocked.
- CSS label group now spans top 3.05% / height 3.65%, center x28.5–71.5%, right x72.8–87%, left x13.3–27.5%; coordinates are based on actual frame geometry, not guessed pill positions.
- Focused pixel assertions: center background PASS, left label backdrop PASS, right label backdrop PASS, first-ayah transparency PASS.
- Device QA and release signing are STILL PENDING; no claim of Android acceptance or OTA activation.

## Critical collision correction — V695 P191 vertical fit
Reproduced the printed page 51 from the original V694 signed APK with the
actual 720x1280 original frame and P191 image transform. A full-height unmasked
native header would overlap the first ayah (at approx y76–80 in viewport).
P193 therefore MUST NOT use CSS `mask-image:none` on the original overlay.
Instead keep P190's mask, clone the existing top source image, and compress ONLY
the top 1.5%–8.75% portion to 65% original vertical size. The remaining
original image, decorations, first and final verses, bottom legend and frame
are unmodified. Resulting header bottoms around y73; first verse remains clear.
Scoped selectors and JS remove or hide the clone on genuine surah-opening pages.
The middle ivory label uses dark green text; side badges use ivory text.
This focused source-raster composite inspection is not a substitute for Android
owner field acceptance. Sign only after the owner QA-050 guard passes on final PR.
