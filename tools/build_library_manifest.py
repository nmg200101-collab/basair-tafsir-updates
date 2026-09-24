#!/usr/bin/env python3
import json, hashlib, re
from pathlib import Path
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parents[1]
LIB=ROOT/"library"; MANIFEST=LIB/"manifest.json"; CATEGORIES=LIB/"categories.json"; INDEX=LIB/"topics/index.json"
IMAGE_EXT={".png",".jpg",".jpeg",".webp",".gif",".svg"}
now=lambda: datetime.now(timezone.utc).isoformat().replace("+00:00","Z")
sha=lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
def bump(v):
    a=[int(x) for x in str(v or "1.0.0").split(".")[:3]]
    while len(a)<3:a.append(0)
    a[2]+=1
    return ".".join(map(str,a))
def item_version(old, iid, digest, declared=None):
    o=old.get(iid)
    if not o: return int(declared or 1)
    if o.get("sha256")==digest: return int(o.get("version",declared or 1))
    if declared is not None:
        if int(declared)<=int(o.get("version",0)):
            raise SystemExit(f"Version must increase for changed topic {iid}")
        return int(declared)
    return int(o.get("version",0))+1
def asset_id(path):
    return re.sub(r"[^a-z0-9-]+","-",path.lower().replace("library/assets/","").replace("/", "-").rsplit(".",1)[0]).strip("-")[:100]

oldm=json.loads(MANIFEST.read_text("utf-8")) if MANIFEST.exists() else {}
old={x["id"]:x for x in oldm.get("items",[])}
cats=json.loads(CATEGORIES.read_text("utf-8"))
published=[c for c in cats if c.get("status")=="published"]
cat_by={c["id"]:c for c in published}; children={}
for c in published:
    if c.get("parentId"): children.setdefault(c["parentId"],[]).append(c["id"])
roots=sorted([c for c in published if not c.get("parentId")],key=lambda c:c.get("order",0))
idx=json.loads(INDEX.read_text("utf-8"))
canonical=idx.get("topics",[])
topics=[]; topic_by={}
for ent in canonical:
    p=ROOT/ent["path"]
    if not p.exists(): raise SystemExit(f"Missing canonical topic: {ent['path']}")
    t=json.loads(p.read_text("utf-8"))
    if t.get("status")!="published" or t.get("id")!=ent.get("id"): raise SystemExit(f"Invalid canonical topic: {ent['id']}")
    digest=sha(p); ver=item_version(old,t["id"],digest,t.get("version"))
    it={"entityType":"topic","id":t["id"],"version":ver,"path":ent["path"],"sha256":digest,"bytes":p.stat().st_size,"updatedAt":t.get("updatedAt") or now()}
    topics.append((t,it)); topic_by[t["id"]]=t

cat_digest=sha(CATEGORIES)
cat_ver=item_version(old,"library-categories",cat_digest)
cat_item={"entityType":"catalog","id":"library-categories","version":cat_ver,"path":"library/categories.json","sha256":cat_digest,"bytes":CATEGORIES.stat().st_size,"updatedAt":now()}

known_topics=set(topic_by); known_cats=set(cat_by)
assets=[]
for p in sorted((LIB/"assets").rglob("*")):
    if not p.is_file() or p.suffix.lower() not in IMAGE_EXT: continue
    rel=p.relative_to(ROOT).as_posix(); existing=next((x for x in old.values() if x.get("path")==rel and x.get("entityType")=="asset"),None)
    owner_type=existing.get("ownerType") if existing else None; owner_id=existing.get("ownerId") if existing else None; kind=existing.get("assetKind") if existing else None; iid=existing.get("id") if existing else None
    parts=rel.split("/")
    if not existing and len(parts)>=4 and parts[2]=="categories":
        stem=p.stem
        if stem not in known_cats: raise SystemExit(f"Orphan category image: {rel}")
        owner_type,owner_id,kind,iid="category",stem,"category-image",f"cat-{stem}-cover"
    elif not existing and len(parts)>=5 and parts[2]=="topics":
        tid=parts[3]
        if tid not in known_topics: raise SystemExit(f"Orphan topic image: {rel}")
        owner_type,owner_id,kind,iid="topic",tid,"topic-image",f"topic-{tid}-{asset_id(rel)}"
    elif not existing:
        raise SystemExit(f"Unowned library asset: {rel}")
    digest=sha(p); ver=item_version(old,iid,digest)
    mime={"svg": "image/svg+xml","png":"image/png","jpg":"image/jpeg","jpeg":"image/jpeg","webp":"image/webp","gif":"image/gif"}.get(p.suffix.lower().lstrip("."),"application/octet-stream")
    assets.append({"entityType":"asset","id":iid,"version":ver,"path":rel,"sha256":digest,"bytes":p.stat().st_size,"updatedAt":now(),"assetKind":kind or "asset","ownerType":owner_type or "library","ownerId":owner_id or "library","mimeType":mime})

pre=[cat_item]+[it for _,it in topics]+assets
old_non_index={k:v for k,v in old.items() if k!="library-topic-index"}
changed_pre=any(not old_non_index.get(x["id"]) or old_non_index[x["id"]].get("sha256")!=x["sha256"] for x in pre)
deleted_pre=any(k not in {x["id"] for x in pre} for k in old_non_index)
libver=bump(oldm.get("libraryVersion","1.0.0")) if (changed_pre or deleted_pre) else oldm.get("libraryVersion","1.0.0")

index_obj={"schema":"basair-quran-library-topic-index-v1","schemaVersion":1,"libraryVersion":libver,"topics":[]}
for t,it in topics:
    index_obj["topics"].append({"id":t["id"],"version":it["version"],"status":"published","categoryId":t.get("categoryId"),"subCategoryId":t.get("subCategoryId"),"title":t.get("title"),"path":it["path"],"sha256":it["sha256"],"updatedAt":t.get("updatedAt") or it["updatedAt"],"displayOrder":int(t.get("displayOrder",0))})
INDEX.write_text(json.dumps(index_obj,ensure_ascii=False,indent=2)+"\n","utf-8")
idx_digest=sha(INDEX); idx_ver=item_version(old,"library-topic-index",idx_digest)
idx_item={"entityType":"catalog","id":"library-topic-index","version":idx_ver,"path":"library/topics/index.json","sha256":idx_digest,"bytes":INDEX.stat().st_size,"updatedAt":now()}
items=[cat_item,idx_item]+[it for _,it in topics]+assets
by={x["id"]:x for x in items}

def descendants(root):
    out=[]; stack=[root]
    while stack:
        x=stack.pop(); out.append(x); stack.extend(children.get(x,[]))
    return out
packages=[]
for root in roots:
    ids=set(descendants(root["id"]))
    tids=sorted(t["id"] for t,_ in topics if t.get("categoryId") in ids or t.get("subCategoryId") in ids); tset=set(tids)
    aids=[]
    for a in assets:
        inc=(a.get("ownerType")=="category" and a.get("ownerId") in ids) or (a.get("ownerType")=="topic" and a.get("ownerId") in tset)
        if not inc and a.get("ownerType")=="stage":
            pp=a["path"].split("/")
            if "topics" in pp:
                z=pp.index("topics"); inc=z+1<len(pp) and pp[z+1] in tset
        if inc:aids.append(a["id"])
    ids2=["library-categories","library-topic-index"]+[x for x in tids if x in by]+[x for x in sorted(set(aids)) if x in by]
    ids2=list(dict.fromkeys(ids2))
    packages.append({"id":"category:"+root["id"],"categoryId":root["id"],"title":root["title"],"version":int(root.get("version",1)),"categoryIds":sorted(ids),"topicIds":tids,"assetIds":sorted(set(aids)),"itemIds":ids2,"bytes":sum(int(by[x].get("bytes",0)) for x in ids2),"updatedAt":now()})
pkg={"schema":"basair-quran-library-packages-v1","version":1,"all":{"id":"library:all","title":"مكتبة القرآن كاملة","version":libver,"categoryIds":[c["id"] for c in roots],"itemIds":[x["id"] for x in items],"bytes":sum(int(x.get("bytes",0)) for x in items),"updatedAt":now()},"categories":packages}
def pline(p): return f"{p.get('id','')}|{p.get('version','')}|{','.join(p.get('itemIds',[]))}|{p.get('bytes',0)}"
pkg_checksum=hashlib.sha256("\n".join(sorted([pline(pkg["all"])]+[pline(x) for x in packages])).encode()).hexdigest()
checksum=hashlib.sha256("\n".join(sorted(f"{x['path']}:{x['sha256']}" for x in items)).encode()).hexdigest()
new_ids={x["id"] for x in items}; changed=[x for x in items if not old.get(x["id"]) or old[x["id"]].get("sha256")!=x["sha256"]]
deleted=[]
for iid,o in old.items():
    if iid not in new_ids:
        deleted.append({"entityType":o.get("entityType","topic"),"id":iid,"categoryId":o.get("categoryId"),"ownerId":o.get("ownerId")})
m={"schema":"basair-quran-library-manifest-v1","schemaVersion":1,"libraryVersion":libver,"publishedAt":now(),"minimumAppVersion":oldm.get("minimumAppVersion","1.1.5"),"categoriesVersion":cat_ver,"contentVersion":max([x[1]["version"] for x in topics] or [1]),"assetsVersion":max([x["version"] for x in assets] or [1]),"totalItems":len(items),"summary":{"newTopics":sum(1 for x in changed if x["entityType"]=="topic" and x["id"] not in old),"updatedTopics":sum(1 for x in changed if x["entityType"]=="topic" and x["id"] in old),"newJourneys":0,"newInsights":0,"newAssets":sum(1 for x in changed if x["entityType"]=="asset" and x["id"] not in old),"updatedAssets":sum(1 for x in changed if x["entityType"]=="asset" and x["id"] in old),"message":"تحديث مكتبة القرآن منشور آليًا مع حزم الأقسام والصور."},"items":items,"changedItems":changed,"deletedItems":deleted,"catalog":{"categories":{"path":cat_item["path"],"sha256":cat_item["sha256"],"bytes":cat_item["bytes"]},"topicsIndex":{"path":idx_item["path"],"sha256":idx_item["sha256"],"bytes":idx_item["bytes"]}},"distributionVersion":1,"packages":pkg,"packagesChecksum":pkg_checksum,"checksum":checksum}
MANIFEST.write_text(json.dumps(m,ensure_ascii=False,separators=(",",":")),"utf-8")
print(f"libraryVersion={libver} items={len(items)} packages={len(packages)} changed={len(changed)} deleted={len(deleted)}")
