#!/usr/bin/env python3
import json, hashlib, re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "library"
MANIFEST = LIB / "manifest.json"
CATEGORIES = LIB / "categories.json"
INDEX = LIB / "topics/index.json"
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
IMAGE_PRIORITY = [".webp", ".png", ".jpg", ".jpeg", ".svg", ".gif"]

def now():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def mime_for(path):
    return {
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }.get(path.suffix.lower(), "application/octet-stream")

def bump_semver(value):
    parts = [int(x) for x in str(value or "1.0.0").split(".")[:3]]
    while len(parts) < 3:
        parts.append(0)
    parts[2] += 1
    return ".".join(map(str, parts))

def next_int(value):
    try:
        return int(value) + 1
    except Exception:
        return 1

def item_version(old_by_id, item_id, digest, declared=None):
    old = old_by_id.get(item_id)
    if not old:
        return int(declared or 1)
    if old.get("sha256") == digest:
        return int(old.get("version", declared or 1))
    if declared is not None:
        if int(declared) <= int(old.get("version", 0)):
            raise SystemExit(f"Version must increase for changed topic {item_id}")
        return int(declared)
    return int(old.get("version", 0)) + 1

def asset_auto_id(prefix, owner_id, path):
    stem = re.sub(r"[^a-z0-9-]+", "-", path.stem.lower()).strip("-") or "image"
    ext = path.suffix.lower().lstrip(".")
    return f"{prefix}-{owner_id}-{stem}-{ext}"[:120]

def path_ref(obj):
    if not isinstance(obj, dict):
        return None
    p = obj.get("path")
    if not isinstance(p, str):
        return None
    if not p.startswith("library/assets/"):
        return None
    if Path(p).suffix.lower() not in IMAGE_EXT:
        return None
    return obj

def collect_image_refs(obj, out, context=None):
    if isinstance(obj, dict):
        ref = path_ref(obj)
        if ref:
            out.append((ref, context))
        local_context = context
        if obj.get("id") and any(k in obj for k in ("images", "image", "heroImage", "coverImage")):
            local_context = obj.get("id")
        for k, v in obj.items():
            if k in ("path",):
                continue
            collect_image_refs(v, out, local_context)
    elif isinstance(obj, list):
        for v in obj:
            collect_image_refs(v, out, context)

def pick_auto_image(directory, basenames):
    if not directory.exists():
        return None
    for base in basenames:
        for ext in IMAGE_PRIORITY:
            p = directory / f"{base}{ext}"
            if p.exists():
                return p
    return None

oldm = json.loads(MANIFEST.read_text("utf-8")) if MANIFEST.exists() else {}
old_items = oldm.get("items", [])
old_by_id = {x["id"]: x for x in old_items}
old_by_path = {x.get("path"): x for x in old_items if x.get("path")}
old_packages = oldm.get("packages", {})

cats = json.loads(CATEGORIES.read_text("utf-8"))
published = [c for c in cats if c.get("status") == "published"]
cat_by = {c["id"]: c for c in published}
children = {}
for c in published:
    if c.get("parentId"):
        children.setdefault(c["parentId"], []).append(c["id"])
roots = sorted([c for c in published if not c.get("parentId")], key=lambda c: c.get("order", 0))

idx = json.loads(INDEX.read_text("utf-8"))
control_by_id = {x["id"]: x for x in idx.get("topics", []) if x.get("id")}
old_index_input_sha = sha(INDEX)
allowed_route_status = {"published","hidden","archived","draft","review","deprecated"}

def category_root(category_id):
    seen=set()
    c=cat_by.get(category_id)
    while c and c.get("parentId") and c["id"] not in seen:
        seen.add(c["id"])
        c=cat_by.get(c["parentId"])
    return c["id"] if c else None

def effective_route(topic, path):
    ctrl = control_by_id.get(topic["id"], {})
    status = str(ctrl.get("status", topic.get("status", "published")))
    if status not in allowed_route_status:
        status = "hidden"
    visible = ctrl.get("visible", topic.get("visible", True))
    category_id = ctrl.get("categoryId", topic.get("categoryId"))
    sub_id = ctrl["subCategoryId"] if "subCategoryId" in ctrl else topic.get("subCategoryId")
    order = int(ctrl.get("displayOrder", topic.get("displayOrder", 0)) or 0)
    title = ctrl.get("title") or topic.get("title")
    if not category_id or category_id not in cat_by:
        raise SystemExit(f"Unknown category for {topic['id']}: {category_id}")
    root = category_root(sub_id or category_id)
    if sub_id:
        sub = cat_by.get(sub_id)
        if not sub or not sub.get("parentId"):
            raise SystemExit(f"Invalid subcategory for {topic['id']}: {sub_id}")
        if root != category_id:
            raise SystemExit(f"Cross-category route for {topic['id']}: {category_id} / {sub_id}")
    return {
        "id": topic["id"],
        "version": int(topic.get("version", 1)),
        "status": status,
        "visible": bool(visible),
        "categoryId": category_id,
        "subCategoryId": sub_id,
        "title": title,
        "path": path,
        "displayOrder": order,
        "updatedAt": ctrl.get("updatedAt") or topic.get("updatedAt") or topic.get("publishedAt") or now(),
    }

topics = []
topic_by = {}
routing_entries = []
seen_topic_ids = set()
topic_files = sorted(
    p for p in (LIB / "topics").glob("*.json")
    if p.name != "index.json"
)
for p in topic_files:
    t = json.loads(p.read_text("utf-8"))
    if t.get("schema") != "basair-quran-library-topic-v1" or not t.get("id"):
        raise SystemExit(f"Invalid topic schema: {p.relative_to(ROOT).as_posix()}")
    if t["id"] in seen_topic_ids:
        raise SystemExit(f"Duplicate topic id: {t['id']}")
    seen_topic_ids.add(t["id"])
    rel = p.relative_to(ROOT).as_posix()
    route = effective_route(t, rel)
    routing_entries.append(route)
    published = route["status"] == "published" and route["visible"] is not False
    if not published:
        continue
    if t.get("status") not in ("published","approved"):
        raise SystemExit(f"Route publishes non-publishable topic {t['id']} with file status {t.get('status')}")
    effective = dict(t)
    effective["categoryId"] = route["categoryId"]
    effective["subCategoryId"] = route.get("subCategoryId")
    effective["displayOrder"] = route["displayOrder"]
    effective["title"] = route["title"]
    effective["status"] = "published"
    effective["visible"] = True
    digest = sha(p)
    ver = item_version(old_by_id, t["id"], digest, t.get("version"))
    old = old_by_id.get(t["id"], {})
    item = {
        "entityType": "topic",
        "id": t["id"],
        "version": ver,
        "path": rel,
        "sha256": digest,
        "bytes": p.stat().st_size,
        "updatedAt": t.get("updatedAt") or old.get("updatedAt") or now(),
    }
    topics.append((effective, item))
    topic_by[t["id"]] = effective

# Keep explicit control records only for files that still exist. A missing published
# file is an error; missing hidden/archived records are simply removed from the index.
for cid, ctrl in control_by_id.items():
    if cid in seen_topic_ids:
        continue
    if str(ctrl.get("status","published")) == "published" and ctrl.get("visible", True) is not False:
        raise SystemExit(f"Published topic index entry has no file: {cid}")

cat_digest = sha(CATEGORIES)
cat_ver = item_version(old_by_id, "library-categories", cat_digest)
old_cat = old_by_id.get("library-categories", {})
cat_item = {
    "entityType": "catalog",
    "id": "library-categories",
    "version": cat_ver,
    "path": "library/categories.json",
    "sha256": cat_digest,
    "bytes": CATEGORIES.stat().st_size,
    "updatedAt": old_cat.get("updatedAt") if old_cat.get("sha256") == cat_digest else now(),
}

# Build the published asset set from explicit JSON references first.
# Unreferenced legacy alternatives are intentionally ignored, so stale files do not
# suddenly become app content. If a category/topic has no image reference at all,
# a canonical uploaded cover/hero file can be adopted automatically.
asset_specs = {}

def register_asset(ref, owner_type, owner_id, fallback_id, fallback_kind):
    rel = ref.get("path")
    p = ROOT / rel
    if not p.exists():
        if ref.get("required") is True:
            raise SystemExit(f"Missing required image: {rel}")
        return
    existing = old_by_path.get(rel)
    item_id = ref.get("id") or (existing or {}).get("id") or fallback_id
    kind = ref.get("kind") or (existing or {}).get("assetKind") or fallback_kind
    actual_owner_type = (existing or {}).get("ownerType") or owner_type
    actual_owner_id = (existing or {}).get("ownerId") or owner_id
    if item_id in asset_specs and asset_specs[item_id]["path"] != rel:
        raise SystemExit(f"Duplicate asset id {item_id}: {asset_specs[item_id]['path']} vs {rel}")
    asset_specs[item_id] = {
        "path": rel,
        "kind": kind,
        "ownerType": actual_owner_type,
        "ownerId": actual_owner_id,
        "mimeType": ref.get("mimeType") or mime_for(p),
        "required": bool(ref.get("required", False)),
    }

for c in published:
    refs = []
    for key in ("coverImage", "heroImage"):
        if path_ref(c.get(key)):
            refs.append(c[key])
    for key in ("images", "assets"):
        if isinstance(c.get(key), list):
            refs.extend([x for x in c[key] if path_ref(x)])
    if not refs:
        auto = pick_auto_image(LIB / "assets/categories", [c["id"]])
        if auto:
            rel = auto.relative_to(ROOT).as_posix()
            refs = [{"id": f"cat-{c['id']}-cover", "kind": "category-image", "path": rel}]
    for ref in refs:
        register_asset(ref, "category", c["id"], f"cat-{c['id']}-cover", "category-image")

for t, _ in topics:
    refs = []
    collect_image_refs(t, refs, None)
    if not refs:
        auto = pick_auto_image(LIB / "assets/topics" / t["id"], ["hero", "cover"])
        if auto:
            rel = auto.relative_to(ROOT).as_posix()
            refs = [{"id": f"topic-{t['id']}-cover", "kind": "topic-image", "path": rel}]
        else:
            refs = []
    for ref_ctx in refs:
        if isinstance(ref_ctx, tuple):
            ref, ctx = ref_ctx
        else:
            ref, ctx = ref_ctx, None
        existing = old_by_path.get(ref.get("path"))
        if existing:
            fallback_id = existing.get("id")
            fallback_kind = existing.get("assetKind") or ref.get("kind") or "topic-image"
            owner_type = existing.get("ownerType") or "topic"
            owner_id = existing.get("ownerId") or t["id"]
        else:
            owner_type = "stage" if ref.get("kind") == "stage-image" and ctx else "topic"
            owner_id = ctx if owner_type == "stage" else t["id"]
            prefix = "stage" if owner_type == "stage" else "topic"
            fallback_id = asset_auto_id(prefix, owner_id, ROOT / ref["path"])
            fallback_kind = ref.get("kind") or ("stage-image" if owner_type == "stage" else "topic-image")
        register_asset(ref, owner_type, owner_id, fallback_id, fallback_kind)

assets = []
seen_paths = set()
for item_id, spec in sorted(asset_specs.items(), key=lambda kv: kv[1]["path"]):
    rel = spec["path"]
    if rel in seen_paths:
        continue
    seen_paths.add(rel)
    p = ROOT / rel
    digest = sha(p)
    ver = item_version(old_by_id, item_id, digest)
    old = old_by_id.get(item_id, {})
    asset = {
        "entityType": "asset",
        "id": item_id,
        "version": ver,
        "path": rel,
        "sha256": digest,
        "bytes": p.stat().st_size,
        "updatedAt": old.get("updatedAt") if old.get("sha256") == digest else now(),
        "assetKind": spec["kind"],
        "ownerType": spec["ownerType"],
        "ownerId": spec["ownerId"],
        "mimeType": spec["mimeType"],
    }
    if spec.get("required"):
        asset["required"] = True
    assets.append(asset)

pre = [cat_item] + [it for _, it in topics] + assets
old_non_index = {k: v for k, v in old_by_id.items() if k != "library-topic-index"}
new_pre_ids = {x["id"] for x in pre}
changed_pre = any(not old_non_index.get(x["id"]) or old_non_index[x["id"]].get("sha256") != x["sha256"] for x in pre)
deleted_pre = any(k not in new_pre_ids for k in old_non_index)
old_index_item = old_by_id.get("library-topic-index", {})
structural_input_changed = bool(old_index_item and old_index_input_sha != old_index_item.get("sha256"))

# True no-op: a harmless workflow probe/manual dispatch must not reformat files,
# mutate timestamps or manufacture a library update. Structural index edits are
# intentionally not a no-op: they can move/reorder/hide topics without APK changes.
if not changed_pre and not deleted_pre and not structural_input_changed and old_packages.get("categories"):
    print(f"libraryVersion={oldm.get('libraryVersion')} content unchanged; manifest/index unchanged")
    raise SystemExit(0)

libver = bump_semver(oldm.get("libraryVersion", "1.0.0")) if (changed_pre or deleted_pre or structural_input_changed) else oldm.get("libraryVersion", "1.0.0")

index_obj = {
    "schema": "basair-quran-library-topic-index-v1",
    "schemaVersion": 1,
    "libraryVersion": libver,
    "topics": [],
}
published_items_by_id = {it["id"]: it for _, it in topics}
for route in sorted(routing_entries, key=lambda x: (str(x.get("categoryId","")), str(x.get("subCategoryId") or ""), int(x.get("displayOrder",0)), str(x.get("title","")))):
    p = ROOT / route["path"]
    digest = sha(p)
    out = dict(route)
    out["sha256"] = digest
    out["version"] = int(json.loads(p.read_text("utf-8")).get("version", route.get("version",1)))
    index_obj["topics"].append(out)
INDEX.write_text(json.dumps(index_obj, ensure_ascii=False, separators=(",", ":")), "utf-8")

idx_digest = sha(INDEX)
idx_ver = item_version(old_by_id, "library-topic-index", idx_digest)
old_idx = old_by_id.get("library-topic-index", {})
idx_item = {
    "entityType": "catalog",
    "id": "library-topic-index",
    "version": idx_ver,
    "path": "library/topics/index.json",
    "sha256": idx_digest,
    "bytes": INDEX.stat().st_size,
    "updatedAt": old_idx.get("updatedAt") if old_idx.get("sha256") == idx_digest else now(),
}

items = [cat_item, idx_item] + [it for _, it in topics] + assets
by = {x["id"]: x for x in items}
if len(by) != len(items):
    raise SystemExit("Duplicate manifest item id detected")
paths = [x["path"] for x in items]
if len(set(paths)) != len(paths):
    raise SystemExit("Duplicate manifest item path detected")

def descendants(root):
    out, stack = [], [root]
    while stack:
        x = stack.pop()
        out.append(x)
        stack.extend(children.get(x, []))
    return out

packages = []
for root in roots:
    category_ids = set(descendants(root["id"]))
    topic_ids = sorted(
        t["id"] for t, _ in topics
        if t.get("categoryId") in category_ids or t.get("subCategoryId") in category_ids
    )
    topic_set = set(topic_ids)
    asset_ids = []
    for a in assets:
        include = (
            (a.get("ownerType") == "category" and a.get("ownerId") in category_ids)
            or (a.get("ownerType") == "topic" and a.get("ownerId") in topic_set)
        )
        if not include and a.get("ownerType") == "stage":
            # Existing stage ownership may use the stage id, so package by topic path.
            parts = a["path"].split("/")
            if "topics" in parts:
                pos = parts.index("topics")
                include = pos + 1 < len(parts) and parts[pos + 1] in topic_set
        if include:
            asset_ids.append(a["id"])
    item_ids = ["library-categories", "library-topic-index"]
    item_ids += [x for x in topic_ids if x in by]
    item_ids += [x for x in sorted(set(asset_ids)) if x in by]
    item_ids = list(dict.fromkeys(item_ids))
    packages.append({
        "id": "category:" + root["id"],
        "categoryId": root["id"],
        "title": root["title"],
        "version": int(root.get("version", 1)),
        "categoryIds": sorted(category_ids),
        "topicIds": topic_ids,
        "assetIds": sorted(set(asset_ids)),
        "itemIds": item_ids,
        "bytes": sum(int(by[x].get("bytes", 0)) for x in item_ids),
        "updatedAt": now(),
    })

pkg = {
    "schema": "basair-quran-library-packages-v1",
    "version": 1,
    "all": {
        "id": "library:all",
        "title": "مكتبة القرآن كاملة",
        "version": libver,
        "categoryIds": [c["id"] for c in roots],
        "itemIds": [x["id"] for x in items],
        "bytes": sum(int(x.get("bytes", 0)) for x in items),
        "updatedAt": now(),
    },
    "categories": packages,
}

def package_line(p):
    return f"{p.get('id','')}|{p.get('version','')}|{','.join(p.get('itemIds',[]))}|{p.get('bytes',0)}"

pkg_checksum = hashlib.sha256(
    "\n".join(sorted([package_line(pkg["all"])] + [package_line(x) for x in packages])).encode()
).hexdigest()
checksum = hashlib.sha256(
    "\n".join(sorted(f"{x['path']}:{x['sha256']}" for x in items)).encode()
).hexdigest()

new_ids = {x["id"] for x in items}
changed = [x for x in items if not old_by_id.get(x["id"]) or old_by_id[x["id"]].get("sha256") != x["sha256"]]
deleted = []
old_topic_root = {}
for op in oldm.get("packages",{}).get("categories",[]):
    for tid in op.get("topicIds",[]):
        old_topic_root.setdefault(tid, op.get("categoryId"))
for item_id, old in old_by_id.items():
    if item_id not in new_ids:
        deleted.append({
            "entityType": old.get("entityType", "topic"),
            "id": item_id,
            "categoryId": old.get("categoryId") or old_topic_root.get(item_id),
            "ownerId": old.get("ownerId"),
        })

topic_changed = any(x["entityType"] == "topic" for x in changed) or any(x.get("entityType") == "topic" for x in deleted)
asset_changed = any(x["entityType"] == "asset" for x in changed) or any(x.get("entityType") == "asset" for x in deleted)
content_version = next_int(oldm.get("contentVersion", 0)) if topic_changed else int(oldm.get("contentVersion", 1))
assets_version = next_int(oldm.get("assetsVersion", 0)) if asset_changed else int(oldm.get("assetsVersion", 1))

summary = {
    "newTopics": sum(1 for x in changed if x["entityType"] == "topic" and x["id"] not in old_by_id),
    "updatedTopics": sum(1 for x in changed if x["entityType"] == "topic" and x["id"] in old_by_id),
    "newJourneys": 0,
    "newInsights": 0,
    "newAssets": sum(1 for x in changed if x["entityType"] == "asset" and x["id"] not in old_by_id),
    "updatedAssets": sum(1 for x in changed if x["entityType"] == "asset" and x["id"] in old_by_id),
    "message": "تحديث مكتبة القرآن منشور آليًا مع حزم الأقسام والصور.",
}

manifest = {
    "schema": "basair-quran-library-manifest-v1",
    "schemaVersion": 1,
    "libraryVersion": libver,
    "publishedAt": now(),
    "minimumAppVersion": oldm.get("minimumAppVersion", "1.1.5"),
    "categoriesVersion": cat_ver,
    "contentVersion": content_version,
    "assetsVersion": assets_version,
    "totalItems": len(items),
    "summary": summary,
    "items": items,
    "changedItems": changed,
    "deletedItems": deleted,
    "catalog": {
        "categories": {"path": cat_item["path"], "sha256": cat_item["sha256"], "bytes": cat_item["bytes"]},
        "topicsIndex": {"path": idx_item["path"], "sha256": idx_item["sha256"], "bytes": idx_item["bytes"]},
    },
    "checksum": checksum,
    "distributionVersion": 1,
    "packages": pkg,
    "packagesChecksum": pkg_checksum,
}

# Final self-checks before writing the manifest.
for item in items:
    p = ROOT / item["path"]
    if not p.exists():
        raise SystemExit(f"Manifest path missing: {item['path']}")
    if sha(p) != item["sha256"]:
        raise SystemExit(f"Manifest sha mismatch: {item['path']}")
valid_ids = set(by)
for package in [pkg["all"]] + pkg["categories"]:
    unknown = [x for x in package.get("itemIds", []) if x not in valid_ids]
    if unknown:
        raise SystemExit(f"Package {package['id']} references unknown items: {unknown}")

MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), "utf-8")
print(
    f"libraryVersion={libver} items={len(items)} packages={len(packages)} "
    f"changed={len(changed)} deleted={len(deleted)}"
)
