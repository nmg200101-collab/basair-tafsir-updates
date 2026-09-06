import json, hashlib, pathlib

SURAHS = {17: ("الإسراء", 111), 18: ("الكهف", 110), 19: ("مريم", 98), 20: ("طه", 135)}

def compact(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))

mpath = pathlib.Path("basair-tafsir-manifest.json")
manifest = json.loads(mpath.read_text(encoding="utf-8"))
manifest.setdefault("schema", "basair-tafsir-update-v2")
manifest.setdefault("version", 2)
manifest.setdefault("surahs", {})
changed = False

for num, (name, count) in SURAHS.items():
    if str(num) in manifest["surahs"]:
        continue
    d = pathlib.Path(f"surah-{num:03d}/001")
    if not d.exists():
        continue
    files = sorted(d.glob("part-*.json"))
    if not files:
        continue
    ayahs, parts = [], []
    expect, valid = 1, True
    for f in files:
        raw = f.read_bytes()
        try:
            obj = json.loads(raw.decode("utf-8"))
        except Exception:
            valid = False
            break
        if obj.get("schema") != "basair-tafsir-part-v1" or int(obj.get("surah", -1)) != num or obj.get("name") != name or str(obj.get("content_version")) != "001":
            valid = False
            break
        frm, to = int(obj.get("from", -1)), int(obj.get("to", -1))
        chunk = obj.get("ayahs", [])
        if frm != expect or to < frm or int(obj.get("ayah_count", -1)) != to - frm + 1:
            valid = False
            break
        if len(chunk) != to - frm + 1 or [int(x.get("ayah", -1)) for x in chunk] != list(range(frm, to + 1)):
            valid = False
            break
        for x in chunk:
            for key in ("meaning", "bayan", "tadabbur", "summary"):
                if not isinstance(x.get(key), str) or not x[key].strip():
                    valid = False
            if "knowledge" in x and (not isinstance(x["knowledge"], str) or not x["knowledge"].strip()):
                valid = False
        if not valid:
            break
        ayahs.extend(chunk)
        parts.append({"from": frm, "to": to, "file": str(f).replace("\\", "/"), "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)})
        expect = to + 1
    if not valid or expect != count + 1 or len(ayahs) != count:
        continue
    if [int(x["ayah"]) for x in ayahs] != list(range(1, count + 1)):
        continue

    full = {"schema": "basair-tafsir-content-v1", "surah": num, "name": name, "content_version": "001", "ayah_count": count, "ayahs": ayahs}
    full_text = compact(full)
    full_path = pathlib.Path(f"basair-surah-{num:03d}-001.json")
    if not full_path.exists() or full_path.read_text(encoding="utf-8") != full_text:
        full_path.write_text(full_text, encoding="utf-8")
        changed = True

    entry = {"name": name, "content_version": "001", "ayah_count": count, "parts": parts, "canonical_sha256": hashlib.sha256(full_text.encode("utf-8")).hexdigest()}
    if manifest["surahs"].get(str(num)) != entry:
        manifest["surahs"][str(num)] = entry
        changed = True

if changed:
    mpath.write_text(compact(manifest), encoding="utf-8")
