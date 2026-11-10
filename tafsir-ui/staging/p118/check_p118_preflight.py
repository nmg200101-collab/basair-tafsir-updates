#!/usr/bin/env python3
"""Read-only preflight for Basair P118 staging. Not a release approval or signing tool.

Run from a checkout of nmg200101-collab/basair-tafsir-updates:
    python3 tafsir-ui/staging/p118/check_p118_preflight.py

Exit 0 means only that local static checks passed. It never means OTA is releasable.
"""
from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path
import re
import sys

P118_DIR = Path(__file__).resolve().parent
ROOT = P118_DIR.parents[2]
BASELINE = ROOT / "ci/tilawa_lock_baseline.json"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git_blob_sha1(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def check(condition: bool, desc: str, failures: list[str]) -> None:
    print(("PASS" if condition else "FAIL") + ": " + desc)
    if not condition:
        failures.append(desc)


def main() -> int:
    failures: list[str] = []
    print("BASAIR P118 / QA051 — read-only STATIC preflight, NO RELEASE\n")
    js_path = P118_DIR / "p118-tafsir-visual-match.js"
    css_path = P118_DIR / "p118-tafsir-visual-match.css"
    for p in (js_path, css_path, BASELINE):
        if not p.is_file():
            check(False, f"required file exists: {p.relative_to(ROOT)}", failures)
    if failures:
        return 1

    js = js_path.read_text(encoding="utf-8")
    css = css_path.read_text(encoding="utf-8")
    start = "var css=String.raw" + chr(96)
    a = js.find(start)
    b = js.find(chr(96) + ";", a + len(start)) if a >= 0 else -1
    check(a >= 0 and b > a, "JS embeds the CSS source as a template literal", failures)
    if a >= 0 and b > a:
        embedded = js[a + len(start):b]
        check(embedded.rstrip("\r\n") == css.rstrip("\r\n"),
              "embedded JS CSS matches separate CSS (ignoring final newline)", failures)

    selectors = re.findall(r"(?m)^\s*([^@/\s][^\n{}]*?)\s*\{", css)
    escaped = [s for s in selectors if "body.bq-tf117-index" not in s]
    check(bool(selectors) and not escaped,
          "CSS declaration selectors are scoped to Tafsir index" +
          (f"; unscoped: {escaped[:3]}" if escaped else ""), failures)
    check("function tafsirReady()" in js and
          "__BASAIR_TAFSIR_INDEX_P117__" in js and
          "classList.contains('active')" in js,
          "P118 activates only with the expected Tafsir interface and active screen", failures)
    check("v194T104SurahGrid" in js and "bqTf117Dashboard" in js and
          "bqTf118Topbar" in js,
          "index, dashboard, and top toolbar selectors are included", failures)
    bad_tokens = [s for s in (
        "localStorage.setItem", "sessionStorage.setItem", "indexedDB", "innerHTML =",
        "XMLHttpRequest", "fetch(", "location.href =", "location.replace(",
        "document.write(", "navigator.serviceWorker", "window.Audio", "new Audio(",
    ) if s in js]
    check(not bad_tokens, f"no direct storage/navigation/network/audio mutators {bad_tokens}", failures)

    # The old P118 CSS used "font: 750 11px/1.2 inherit", which browsers
    # reject: 'inherit' cannot be a family token within font shorthand.
    invalid_font_shorthands = re.findall(
        r"font\s*:\s*\d+\s+[\d.]+px/[\d.]+\s+inherit\s*!important",
        css
    )
    check(not invalid_font_shorthands,
          "no invalid CSS font shorthands (font family inherit)", failures)
    fixed_font_longhands = re.findall(
        r"font-weight:\d+!important;\s*font-size:[\d.]+px!important;"
        r"\s*line-height:[\d.]+!important;\s*font-family:inherit!important;",
        css
    )
    check(len(fixed_font_longhands) == 9,
          "all nine invalid font declarations replaced by valid longhands", failures)

    candidate_file = P118_DIR / "P118-QA051-STAGING-CANDIDATE.json"
    check(candidate_file.is_file(), "staging candidate inventory exists", failures)
    if candidate_file.is_file():
        candidate = json.loads(candidate_file.read_text(encoding="utf-8"))
        files = {str(f["path"]): str(f["sha256"]) for f in candidate.get("stagedFiles", [])}
        for item in (js_path, css_path):
            relative = item.relative_to(ROOT).as_posix()
            check(files.get(relative) == sha256(item.read_bytes()),
                  "staging SHA256 inventory matches: " + relative, failures)

    baseline = json.loads(BASELINE.read_text(encoding="utf-8"))
    manifest_path = ROOT / baseline["active_release"]
    check(manifest_path.is_file(), "QA050 reference manifest exists", failures)
    if manifest_path.is_file():
        manifest = manifest_path.read_bytes()
        check(git_blob_sha1(manifest) == baseline["qa050_manifest_git_blob_sha1"],
              "QA050 signed manifest has exactly the frozen bytes", failures)
        try:
            signed = json.loads(manifest)
            payload = json.loads(base64.b64decode(signed["payload"], validate=True))
            assets = payload.get("assets", [])
            check(payload.get("sequence") == 50 and payload.get("channel") == "owner-qa"
                  and len(assets) == 8, "QA050 release is owner-qa sequence 50 / 8 assets", failures)
            recorded = {x["path"]: x for x in baseline["active_assets"]}
            check({x["path"] for x in assets} == set(recorded),
                  "QA050 release inventory matches the frozen inventory", failures)
            check(all(x.get("sha256") == recorded.get(x["path"], {}).get("sha256")
                      and x.get("size") == recorded.get(x["path"], {}).get("size")
                      for x in assets), "QA050 manifest asset metadata is unchanged", failures)
        except (ValueError, KeyError, TypeError) as e:
            check(False, f"parse QA050 signed payload: {type(e).__name__}", failures)
    for entry in baseline["active_assets"]:
        asset = ROOT / "p92/owner-qa-001" / entry["path"]
        check(asset.is_file() and asset.stat().st_size == entry["size"] and
              sha256(asset.read_bytes()) == entry["sha256"],
              "frozen QA050 asset unchanged: " + entry["path"], failures)

    print("\nUNVERIFIED (mandatory before any release):")
    print("- Does the ACTUAL V690/P117 Android WebView provide __BASAIR_TAFSIR_INDEX_P117__?")
    print("- Are all 114 surah buttons and original Tafsir listeners present and working?")
    print("- Has the owner produced the exact scoped Ed25519 approval, if protected bytes change?")
    print("- Does the OTA RSA signature and receiver P117 validation pass above QA050?")
    print("- Are main rulesets, a real-phone regression test, and explicit owner publish permit complete?")
    print("\nCHECK RESULTS: " + ("FAIL — static invariants broken" if failures else
                                "PASS — static invariants only; RELEASE STILL BLOCKED"))
    return int(bool(failures))


if __name__ == "__main__":
    sys.exit(main())
