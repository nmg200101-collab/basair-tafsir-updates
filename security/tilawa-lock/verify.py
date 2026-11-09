#!/usr/bin/env python3
"""Fail-closed GitHub CI guard for Basair Quran Tilawa OTA, schema 1.

No password, private signing key, or secret is stored in this repository.
A previously approved branch-ruleset on main is REQUIRED for this check to
block merges and direct commits. Until then it is an audit, not a hard gate.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import tempfile

MODULE = pathlib.Path("security/tilawa-lock")
FREEZE = MODULE / "qa050-freeze.json"
APPROVAL_RE = re.compile(r"^security/tilawa-lock/approvals/pr-([1-9][0-9]*)\.json$")
ASSET_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{0,80}\.(css|js)$")
ID_RE = re.compile(r"^[A-Za-z0-9._-]{1,50}$")
HEX_RE = re.compile(r"^[0-9a-f]{64}$")
SHA1_RE = re.compile(r"^[a-f0-9]{40}$")


def fail(msg: str) -> None:
    raise ValueError(msg)


def cmd(*parts: str, root: pathlib.Path, check: bool = True) -> bytes:
    r = subprocess.run(list(parts), cwd=str(root), stdout=subprocess.PIPE,
                       stderr=subprocess.PIPE, check=False)
    if check and r.returncode:
        fail("git/openssl failed: " + " ".join(parts[:3]) + " (code " + str(r.returncode) + ")")
    return r.stdout


def git_blob(root: pathlib.Path, path: str) -> str:
    return cmd("git", "hash-object", "--", path, root=root).decode().strip()


def git_sha_at_head(root: pathlib.Path, path: str) -> str:
    r = subprocess.run(["git", "rev-parse", "--verify", "HEAD:" + path],
                       cwd=str(root), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode:
        return "-"
    sha = r.stdout.decode().strip()
    if not SHA1_RE.fullmatch(sha):
        fail("Invalid file SHA for " + path)
    return sha


def changed_paths(root: pathlib.Path, base: str | None) -> list[str]:
    if not base:
        return []
    if not SHA1_RE.fullmatch(base):
        fail("Base ref must be an immutable 40-character commit SHA")
    blob = cmd("git", "diff", "--no-renames", "--name-only", "-z", base, "HEAD", root=root)
    paths = [p.decode("utf-8") for p in blob.split(b"\x00") if p]
    if any("\n" in p or "\t" in p or "\x00" in p for p in paths):
        fail("Unsafe file name; cannot calculate change digest")
    return sorted(set(paths))


def diff_digest(root: pathlib.Path, changed: list[str]) -> str:
    # Exclude only owner approval artifacts to avoid a circular signature.
    rows = []
    for path in changed:
        if APPROVAL_RE.fullmatch(path):
            continue
        rows.append(path + "\t" + git_sha_at_head(root, path))
    return hashlib.sha256(("\n".join(rows) + "\n").encode("utf-8")).hexdigest()


def protected(path: str, frozen: dict) -> bool:
    if APPROVAL_RE.fullmatch(path):
        return False
    return path in frozen["protectedExactPaths"] or any(
        path.startswith(prefix) for prefix in frozen["protectedPrefixes"]
    )


def base_owner_public_key(root: pathlib.Path, base: str | None, frozen: dict) -> bytes:
    path = frozen["approvalPublicKeyPath"]
    if base:
        r = subprocess.run(["git", "show", base + ":" + path], cwd=str(root),
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if r.returncode == 0:
            return r.stdout
    # Bootstrap before guard exists on main. Protected bootstrap PR must be signed.
    return (root / path).read_bytes()


def signing_bytes(approval: dict) -> bytes:
    ordered = {key: approval[key] for key in (
        "schema", "repo", "pr", "digest", "purpose", "created_at", "expires_at"
    )}
    return ("BASAIR-TILAWA-OWNER-APPROVAL-V1\n" +
            json.dumps(ordered, sort_keys=True, ensure_ascii=False,
                       separators=(",", ":")) + "\n").encode("utf-8")


def verify_owner_approval(root: pathlib.Path, frozen: dict,
                          base: str | None, event: str, pr: str,
                          changed: list[str]) -> None:
    expected_digest = diff_digest(root, changed)
    additions = [p for p in changed if APPROVAL_RE.fullmatch(p)]
    if not additions:
        fail("LOCKED: Protected Tilawa change has no newly committed owner approval")
    owner_pem = base_owner_public_key(root, base, frozen)
    valid = []
    for path in additions:
        f = root / path
        if not f.is_file() or f.stat().st_size > 8000:
            continue
        try:
            a = json.loads(f.read_text(encoding="utf-8"))
            n = APPROVAL_RE.fullmatch(path).group(1)
            if set(a) != {"schema", "repo", "pr", "digest", "purpose",
                          "created_at", "expires_at", "signature_b64"}:
                continue
            if a["schema"] != 1 or int(a["pr"]) != int(n):
                continue
            if pr and a["pr"] != int(pr):
                continue
            if a["repo"] != "nmg200101-collab/basair-tafsir-updates":
                continue
            if a["digest"] != expected_digest or not HEX_RE.fullmatch(a["digest"]):
                continue
            if not isinstance(a["purpose"], str) or not (10 <= len(a["purpose"]) <= 600):
                continue
            created = dt.datetime.fromisoformat(a["created_at"].replace("Z", "+00:00"))
            expiry = dt.datetime.fromisoformat(a["expires_at"].replace("Z", "+00:00"))
            now = dt.datetime.now(dt.timezone.utc)
            if not (created <= now <= expiry and expiry-created <= dt.timedelta(days=7)):
                continue
            signature = base64.b64decode(a["signature_b64"], validate=True)
            if len(signature) != 64:
                continue
            with tempfile.TemporaryDirectory() as td:
                t = pathlib.Path(td)
                (t / "owner.pem").write_bytes(owner_pem)
                (t / "message").write_bytes(signing_bytes(a))
                (t / "signature").write_bytes(signature)
                verified = subprocess.run([
                    "openssl", "pkeyutl", "-verify", "-pubin",
                    "-inkey", str(t / "owner.pem"), "-rawin",
                    "-in", str(t / "message"), "-sigfile", str(t / "signature")
                ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if verified.returncode == 0:
                valid.append(path)
        except (KeyError, ValueError, TypeError, OSError):
            continue
    if len(valid) != 1:
        fail("LOCKED: No unique valid, timely password-derived owner signature for this exact change set")
    print("OWNER_APPROVAL_VERIFIED", valid[0], "scopeDigest=" + expected_digest)


def validate_release(root: pathlib.Path, frozen: dict) -> None:
    release_path = frozen["baselineReleasePath"]
    release_file = root / release_path
    if not release_file.is_file() or release_file.stat().st_size > 30000:
        fail("Missing or oversized signed OTA manifest")
    current_git_blob = git_blob(root, release_path)
    if current_git_blob != frozen["baselineReleaseBlobSha1"]:
        fail("LOCKED: Active Tilawa manifest does not match frozen registered release")
    try:
        outer = json.loads(release_file.read_text(encoding="utf-8"))
        if set(outer) != {"payload", "signature"}:
            fail("Unexpected signed envelope keys")
        payload = base64.b64decode(outer["payload"], validate=True)
        sig = base64.b64decode(outer["signature"], validate=True)
        manifest = json.loads(payload.decode("utf-8", errors="strict"))
    except (ValueError, KeyError, UnicodeError, TypeError) as e:
        fail("Invalid signed envelope: " + str(e))
    if len(sig) != 384:
        fail("Unexpected owner RSA3072 signature length")
    pub_path = root / frozen["rsaDeliveryPublicKeyPath"]
    if not pub_path.is_file():
        fail("Pinned V690 RSA public key missing")
    with tempfile.TemporaryDirectory() as tmp:
        p = pathlib.Path(tmp)
        (p / "payload").write_bytes(payload)
        (p / "signature").write_bytes(sig)
        check = subprocess.run([
            "openssl", "dgst", "-sha256", "-verify", str(pub_path),
            "-signature", str(p / "signature"), str(p / "payload")
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if check.returncode:
            fail("Published OTA owner RSA signature invalid")
    if (manifest.get("schema") != 1 or manifest.get("channel") != "owner-qa" or
        manifest.get("minAppVersion") != frozen["appVersion"] or
        manifest.get("sequence") != frozen["baselineSequence"] or
        manifest.get("id") != frozen["baselineId"] or
        not ID_RE.fullmatch(str(manifest.get("id", "")))):
        fail("LOCKED: release identity has diverged from owner QA050 freeze")
    assets = manifest.get("assets")
    if (not isinstance(assets, list) or len(assets) != 8 or
            assets != frozen["assets"]):
        fail("LOCKED: OTA asset list differs from the owner-approved QA050 freeze")
    base_dir = release_file.parent
    total = 0
    for a in assets:
        rel = a["path"]
        if not ASSET_RE.fullmatch(rel) or a["kind"] != rel.rsplit(".", 1)[1]:
            fail("Unexpected asset path or kind: " + rel)
        f = base_dir / rel
        if not f.is_file():
            fail("Missing protected asset: " + rel)
        raw = f.read_bytes()
        total += len(raw)
        if len(raw) != a["size"] or len(raw) > 524288 or hashlib.sha256(raw).hexdigest() != a["sha256"]:
            fail("LOCKED: Basair Tilawa protected resource modified: " + rel)
    if total > 1024 * 1024:
        fail("OTA assets exceed V690 client limit")
    print("BASELINE_QA050_VERIFIED", "sequence=50", "assets=8", "sha1=" + current_git_blob)


def main() -> int:
    args = argparse.ArgumentParser(description="Basair Tilawa owner lock gate")
    args.add_argument("--root", type=pathlib.Path, default=pathlib.Path("."))
    args.add_argument("--base", default="")
    args.add_argument("--pr", default="")
    args.add_argument("--event", default="manual")
    opt = args.parse_args()
    root = opt.root.resolve()
    frozen = json.loads((root / FREEZE).read_text(encoding="utf-8"))
    if frozen.get("schema") != 1 or frozen.get("module") != "tilawa":
        fail("Invalid Tilawa lock policy")
    # CRITICAL: check authorization scope using the immutable BASE policy,
    # never attacker-editable PR values. Bootstrap uses HEAD only once.
    base = opt.base or None
    trusted = frozen
    if base:
        old = subprocess.run(["git", "show", base + ":" + str(FREEZE)], cwd=str(root),
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if old.returncode == 0:
            trusted = json.loads(old.stdout.decode("utf-8"))
    changed = changed_paths(root, base)
    restricted = [p for p in changed if protected(p, trusted)]
    if restricted:
        print("PROTECTED_CHANGES_DETECTED", len(restricted), file=sys.stderr)
        for item in restricted[:35]:
            print(" - " + item, file=sys.stderr)
        if not base:
            fail("LOCKED: No immutable base ref provided for approval validation")
        verify_owner_approval(root, trusted, base, opt.event, opt.pr, changed)
    validate_release(root, frozen)
    print("TILAWA_OWNER_LOCK_PASS", "protectedChanges=" + str(len(restricted)))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        print("TILAWA_OWNER_LOCK_BLOCKED: " + str(error), file=sys.stderr)
        raise SystemExit(1)
