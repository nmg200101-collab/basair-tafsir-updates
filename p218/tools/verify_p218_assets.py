#!/usr/bin/env python3
"""P218 signed-module asset and shadow de-duplication integrity gate.
Read-only; independently check original V695 RSA/Ed25519 signatures elsewhere.
Run: python3 p218/tools/verify_p218_assets.py --manifest path/to/signed.json
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def assert_ok(x,msg):
 if not x:raise RuntimeError(msg)
def run(path):
 env=json.loads(path.read_text(encoding='utf8'))
 assert_ok(isinstance(env.get('payload'),str) and isinstance(env.get('signature'),str),'Require signed envelope')
 m=json.loads(base64.b64decode(env['payload'],validate=True))
 assert_ok(m['applicationId']=='app.basair.qurv2' and m['channel']=='owner-qa','Wrong signed receiver')
 assert_ok(m['sequence']==128,'Not the P218 forward release')
 modules={x['id']:x for x in m['modules']}
 assert_ok(len(modules)==2 and set(modules)=={'tilawa','updates'},'Wrong modules')
 t,u=modules['tilawa'],modules['updates']
 assert_ok(t['version']==245 and u['version']==218,'Unexpected module versions')
 assert_ok(len(t['assets'])==17 and len(u['assets'])==7,'Unexpected asset counts')
 assert_ok(any(x['path'].endswith('p214-follow-route-adapters.js') for x in t['assets']),'Missing P214 stable adapter')
 assert_ok(all('p215-digital-follow-shadow' not in x['path'] for x in t['assets']),'P215 static shade reintroduced')
 assert_ok(not any(x['path'].endswith('p213-follow-route-adapters.js') for x in t['assets']),'Old P213 adapter reintroduced')
 assert_ok(u['assets'][-2]['path'].endswith('p218-unified-comprehensive-updates.css'),'CSS order wrong')
 assert_ok(u['assets'][-1]['path'].endswith('p218-unified-comprehensive-updates.js'),'JS order wrong')
 seen=set()
 for module in (t,u):
  for entry in module['assets']:
   p=entry['path']
   assert_ok(p not in seen and p.startswith('modules/'+module['id']+'/') and '..' not in p,'Invalid asset path '+p)
   seen.add(p)
   raw=(ROOT/'p121/owner-qa'/p).read_bytes()
   assert_ok(len(raw)==entry['size'] and hashlib.sha256(raw).hexdigest()==entry['sha256'],'Asset digest mismatch '+p)
 assert_ok(len(seen)==24,'Mismatch in total asset count')
 print('PASS: 24/24 asset bytes + SHA256; P214 stable engine, one moving shade and one Updates entry only.')
 print('Separate RSA/Ed25519 verification still required; Android visual QA remains pending.')
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--manifest',type=Path,required=True)
 args=a.parse_args();run(args.manifest)
