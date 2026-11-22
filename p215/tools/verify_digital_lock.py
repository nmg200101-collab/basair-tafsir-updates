#!/usr/bin/env python3
"""P215 fail-closed digital-follow/visual-shadow asset lock.

Usage:
  python3 p215/tools/verify_digital_lock.py
  python3 p215/tools/verify_digital_lock.py --manifest path/to/signed/release.json

This check independently verifies file bytes and OPTIONAL signed-manifest
asset descriptors. It does NOT replace RSA3072/owner-Ed25519 verification,
GitHub QA-050 authorization, or Android field acceptance.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
PIN = ROOT / "p215/qa/P215_DIGITAL_STABILITY_LOCK.json"

def fail(message):
    raise RuntimeError(message)

def raw_file(path):
    candidate = (ROOT / path).resolve()
    if not candidate.is_relative_to(ROOT) or not candidate.is_file():
        fail("Missing/unsafe locked file: " + str(path))
    return candidate.read_bytes()

def check_baseline(pin):
    seen = set()
    for record in pin["immutable"]:
        path, expect = record["path"], record["gitBlobSha1"]
        if path in seen or not path.startswith("p121/owner-qa/modules/tilawa/"):
            fail("Invalid locked path " + path)
        seen.add(path)
        content = raw_file(path)
        actual = subprocess.check_output(["git", "hash-object", "--", str(ROOT / path)],
                                         cwd=ROOT, text=True).strip()
        if actual != expect:
            fail(f"Locked asset changed: {path} — {actual} != {expect}")
        if len(content) == 0:
            fail("Empty locked file: " + path)
    print(f"PASS: {len(seen)} P214/P215 immutable files retain approved Git blobs.")

def check_release(pin, manifest_path):
    envelope = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    if isinstance(envelope, dict) and "payload" in envelope:
        raw = base64.b64decode(envelope["payload"], validate=True)
        manifest = json.loads(raw.decode("utf-8"))
    else:
        # Unsigned preview accepted for developer lint ONLY, NOT permission to publish.
        manifest = envelope
    gate = pin["releaseGate"]
    if manifest.get("schema") != "basair-universal-ota-v1" or \
       manifest.get("applicationId") != pin["reference"]["applicationId"] or \
       manifest.get("channel") != "owner-qa":
        fail("Wrong application/schema/channel")
    if manifest.get("sequence", 0) < gate["minimumSequence"]:
        fail("Release sequence before P215")
    tilawa = next((x for x in manifest.get("modules", []) if x.get("id") == "tilawa"), None)
    if not tilawa or tilawa.get("version", 0) < gate["minimumTilawaVersion"]:
        fail("Missing/outdated Tilawa module")
    assets = tilawa.get("assets", [])
    paths = [item.get("path") for item in assets]
    if len(paths) != len(set(paths)):
        fail("Duplicate signed Tilawa asset path")
    required = gate["requiredAssets"]
    for path in required:
        if paths.count(path) != 1:
            fail("P214/P215 module missing/repeated required asset: " + path)
    if gate["forbiddenLegacyActiveAdapter"] in paths:
        fail("P213 stale adapter must not coexist with P214 adapter")
    if paths.index("modules/tilawa/p215-digital-follow-shadow.js") <= \
       paths.index("modules/tilawa/p214-follow-route-adapters.js"):
        fail("Shadow must load after stable follow route adapter")
    for item in assets:
        if item["path"] in required:
            filename = "p121/owner-qa/" + item["path"]
            content = raw_file(filename)
            digest = hashlib.sha256(content).hexdigest()
            if digest != item.get("sha256") or len(content) != item.get("size"):
                fail("Signed descriptor does not match locked bytes: " + filename)
    print(f"PASS: P215 signed-asset descriptors, order, sizes, and hashes match {manifest['id']}.")
    print("NOTE: RSA/Ed25519 signatures require separate verification by original V695 OTA receiver.")

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args()
    pin = json.loads(PIN.read_text(encoding="utf-8"))
    if pin.get("schema") != "basair-p215-digital-follow-freeze-v1":
        fail("Unexpected QA baseline schema")
    check_baseline(pin)
    if args.manifest:
        check_release(pin, args.manifest)
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, ValueError, KeyError, OSError, subprocess.CalledProcessError) as e:
        print("FAIL: " + str(e), file=sys.stderr)
        sys.exit(1)
