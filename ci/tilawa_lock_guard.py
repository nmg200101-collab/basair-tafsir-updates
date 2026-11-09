#!/usr/bin/env python3
"""BASAIR QA050 Tilawa owner lock: read-only change gate, no signing/deployment."""
import argparse
import base64
from datetime import datetime, timezone, timedelta
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path.cwd().resolve() if (Path.cwd()/'.git').exists() else Path(__file__).resolve().parents[1]
LOCK_ID = 'BASAIR-TILAWA-QA050-OWNER-LOCK-20261109'
PROTOCOL = 'basair-tilawa-unlock-v1'
PUBLIC = 'ci/tilawa-owner-approval-public.pem'
BASELINE = 'ci/tilawa_lock_baseline.json'

def git(*a, binary=False):
    raw=subprocess.check_output(['git',*a],cwd=ROOT,stderr=subprocess.PIPE)
    return raw if binary else raw.decode('utf8').strip()

def protect(p):
    p=p.replace('\\','/')
    if p in ('app-update-manifest.json','.github/CODEOWNERS','BASAIR-TILAWA-QA050-LOCK-20261109.md'): return True
    if p.startswith('basair-tajweed-') and p.endswith(('.json','.js','.css')): return True
    if p.startswith('p92/') and p.endswith(('.js','.css','.html','.json')): return True
    if p.startswith('.github/workflows/') and p.endswith(('.yml','.yaml')): return True
    if p == 'ci/test_tilawa_lock_guard.py': return True
    if p.startswith('ci/tilawa-approvals/'): return False
    if p.startswith(('ci/tilawa_', 'ci/tilawa-')): return True
    return False

def canonical(obj):
    return json.dumps(obj,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode('utf8')

def sha(data): return hashlib.sha256(data).hexdigest()

def blob(ref,path):
    try: return git('show',f'{ref}:{path}',binary=True)
    except subprocess.CalledProcessError: return None

def scope_for(base,head):
    base_sha=git('rev-parse',base)
    head_sha=git('rev-parse',head)
    output=git('diff','--no-renames','--name-only','-z','--diff-filter=ACDMRT',
               base_sha+'...'+head_sha,binary=True)
    paths=sorted({p.decode('utf8') for p in output.split(b'\0') if p and protect(p.decode('utf8'))})
    records=[]
    for path in paths:
        before=blob(base_sha,path)
        after=blob(head_sha,path)
        records.append({'path':path,
                        'before':sha(before) if before is not None else None,
                        'after':sha(after) if after is not None else None})
    return {'protocol':PROTOCOL,'lock_id':LOCK_ID,'base_commit':base_sha,
            'protected_diff_sha256':sha(canonical(records)),'protected_files':paths}

def verify_signature(public,content,signature):
    try:
        raw=base64.b64decode(signature,validate=True)
        if len(raw)!=64: return False
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            (root/'pub.pem').write_bytes(public)
            (root/'message').write_bytes(content)
            (root/'signature').write_bytes(raw)
            result=subprocess.run(['openssl','pkeyutl','-verify','-pubin',
                '-inkey',str(root/'pub.pem'),'-rawin','-in',str(root/'message'),
                '-sigfile',str(root/'signature')],capture_output=True)
            return result.returncode==0
    except (ValueError,TypeError,OSError): return False

def approved(scope,base,head):
    # Read public verifier from the *trusted base*, never from an unreviewed PR.
    pub=blob(base,PUBLIC)
    if not pub: return None
    names=git('ls-tree','-r','--name-only',head).splitlines()
    for name in names:
        if not (name.startswith('ci/tilawa-approvals/') and name.endswith('.json')): continue
        try:
            item=json.loads(blob(head,name))
            if item['scope']!=scope: continue
            req=item['request']
            if req['protocol']!=PROTOCOL or not req['reason'].strip(): continue
            issued=datetime.fromisoformat(req['issued_at'].replace('Z','+00:00'))
            expires=datetime.fromisoformat(req['expires_at'].replace('Z','+00:00'))
            now=datetime.now(timezone.utc)
            if not(issued.tzinfo and expires.tzinfo and issued<=now<=expires and
                   expires-issued<=timedelta(days=14)): continue
            signed=canonical({'scope':scope,'request':req})
            if verify_signature(pub,signed,item['signature']): return name
        except (ValueError,KeyError,TypeError,AttributeError): continue
    return None

def check_stable():
    data=json.loads((ROOT/BASELINE).read_text(encoding='utf8'))
    if data['lock_id']!=LOCK_ID: raise ValueError('different lock baseline')
    manifest=ROOT/data['active_release']
    if git('hash-object',str(manifest))!=data['qa050_manifest_git_blob_sha1']:
        raise ValueError('QA050 signed release changed')
    for entry in data['active_assets']:
        p=ROOT/'p92/owner-qa-001'/entry['path']
        raw=p.read_bytes()
        if len(raw)!=entry['size'] or sha(raw)!=entry['sha256']:
            raise ValueError('QA050 frozen file changed: '+entry['path'])
    print('PASS: QA050 signed manifest + all 8 active assets unchanged')

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--base')
    p.add_argument('--head',default='HEAD')
    p.add_argument('--baseline-only',action='store_true')
    arg=p.parse_args()
    try:
        if arg.baseline_only:
            check_stable()
            return 0
        if not arg.base: p.error('--base is mandatory')
        scope=scope_for(arg.base,arg.head)
        if not scope['protected_files']:
            print('PASS: non-Tilawa update did not change any protected paths')
            return 0
        file=approved(scope,arg.base,arg.head)
        if file:
            print('PASS: scoped owner signature verified:',file)
            return 0
        for name in scope['protected_files']:
            print('OWNER LOCK BLOCKED:',name,file=sys.stderr)
        print('FAIL: owner-signed approval required for exact protected diff',file=sys.stderr)
        return 1
    except (OSError,subprocess.CalledProcessError,ValueError,KeyError) as e:
        print('FAIL: owner lock:',e,file=sys.stderr)
        return 2

if __name__=='__main__': sys.exit(main())
