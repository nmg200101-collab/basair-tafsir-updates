#!/usr/bin/env python3
"""P224 release gate: freeze P222 exact assets; isolate printed rendering.
No signing, no publication, no device QA claims.
Usage: python3 p224/tools/check_printed_isolation.py [--candidate manifest.json]
Without --candidate, checks the 20 accepted baseline files only.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OTA = ROOT / "p121/owner-qa"
ROLLBACK = ROOT / "p223/recovery/P223-SEQ144-OWNER-SIGNED-HELD.json"
BASE_REPLACEMENT = "modules/tilawa/p213-tajwid-static-follow-v2.js"
# ONLY these explicitly printed-route additions may be introduced by P224.
ALLOWED_NEW = {
    "modules/tilawa/p224-printed-display.js",
    "modules/tilawa/p224-tajwid-follow.js",
}
def require(condition, message):
    if not condition:
        raise ValueError(message)

def read_manifest(path):
    m = json.loads(path.read_text(encoding="utf-8"))
    return json.loads(base64.b64decode(m["payload"], validate=True)) if "payload" in m else m

def asset_map(m):
    require(len(m["modules"]) == 1 and m["modules"][0]["id"] == "tilawa", "Unexpected module scope")
    assets = m["modules"][0]["assets"]
    result = {a["path"]: a for a in assets}
    require(len(assets) == len(result), "Duplicate assets")
    return result

def verify_bytes(a):
    p = a["path"]
    require(p.startswith("modules/tilawa/") and "/" not in p[len("modules/tilawa/"):] and ".." not in p,
            "Unexpected path: " + p)
    require(a["kind"] in ("js", "css") and p.endswith("." + a["kind"]), "Asset type mismatch")
    raw = (OTA / p).read_bytes()
    require(len(raw) == a["size"] and hashlib.sha256(raw).hexdigest() == a["sha256"], "Changed asset: " + p)

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--candidate", type=Path)
    args = ap.parse_args()
    base = read_manifest(ROLLBACK)
    require(base["sequence"] == 144 and base["modules"][0]["version"] == 257, "Wrong rollback baseline")
    original = asset_map(base)
    require(len(original) == 20, "Wrong P222 inventory size")
    for a in original.values():
        verify_bytes(a)
    print("PASS: exact 20 P222 assets; digital shadow, shared coordinator and route adapters frozen.")
    if not args.candidate:
        return
    m = read_manifest(args.candidate)
    require(m["applicationId"] == "app.basair.qurv2" and m["channel"] == "owner-qa"
            and m["sequence"] >= 145 and m["modules"][0]["version"] >= 258, "Wrong target")
    proposed = asset_map(m)
    removed = set(original) - set(proposed)
    added = set(proposed) - set(original)
    require(removed <= {BASE_REPLACEMENT}, "Protected baseline removed: "+str(removed))
    require(added <= ALLOWED_NEW and added, "Unapproved new asset scope: "+str(added))
    require((BASE_REPLACEMENT in removed) == ("modules/tilawa/p224-tajwid-follow.js" in added),
            "Do not load both old/new colored aliases, or remove old without replacement")
    for path in set(original) & set(proposed):
        require(original[path] == proposed[path], "Protected descriptor changed: "+path)
    for a in proposed.values():
        verify_bytes(a)
    before = list(original)
    expected = [("modules/tilawa/p224-tajwid-follow.js" if p == BASE_REPLACEMENT and p in removed else p) for p in before]
    if "modules/tilawa/p224-printed-display.js" in added:
        expected.append("modules/tilawa/p224-printed-display.js")
    require(list(proposed) == expected, "Unsafe load order")
    require(not any("/p220-" in p or "/p221-" in p or "/p223-" in p for p in proposed), "Rejected experiments reintroduced")
    print("PASS: printed-only manifest isolation and asset integrity. Not a device acceptance test.")

if __name__ == "__main__":
    main()
