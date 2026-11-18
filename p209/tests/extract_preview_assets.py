#!/usr/bin/env python3
"""Extract ONLY three page samples from an owner-supplied APK into a LOCAL QA folder.
No upload to GitHub, no APK modifications, no signing keys or user data.
Usage: python tests/extract_preview_assets.py /path/to/basair-v695-owner-signed.apk
"""
import hashlib
import pathlib
import sys
import zipfile

if len(sys.argv) != 2:
    raise SystemExit("Usage: python tests/extract_preview_assets.py OWNER_V695_APK")
apk = pathlib.Path(sys.argv[1]); output = pathlib.Path(__file__).resolve().parents[1] / "preview/assets/tajweed-pages"
if not apk.is_file():
    raise SystemExit("APK does not exist")
with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None, "Invalid APK zip CRC"
    output.mkdir(parents=True, exist_ok=True)
    for p in (4, 5, 6):
        name = f"tajweed-{p:03d}.webp"
        data = z.read(f"assets/www/assets/tajweed-pages/{name}")
        if not data.startswith(b"RIFF") or b"WEBP" not in data[:16]:
            raise ValueError(f"Invalid page image: {name}")
        (output / name).write_bytes(data)
        print(name, len(data), hashlib.sha256(data).hexdigest())
print("Local preview page samples ready; DO NOT commit image files to GitHub")
