#!/usr/bin/env python3
"""Self-contained dry-run test; generated test keys never leave temp directory."""
import base64,datetime as dt,hashlib,json,pathlib,subprocess,sys,tempfile,shutil
from cryptography.hazmat.primitives.asymmetric import rsa,padding,ed25519
from cryptography.hazmat.primitives import hashes,serialization

ROOT=pathlib.Path(__file__).resolve().parents[2]
VERIFIER=ROOT/'security/tilawa-lock/verify.py'

def sh(repo,*args):
 p=subprocess.run(args,cwd=repo,capture_output=True,text=True)
 if p.returncode: raise RuntimeError(str(args)+"\n"+p.stderr)
 return p.stdout.strip()

def write(repo,path,data):
 p=repo/path;p.parent.mkdir(parents=True,exist_ok=True)
 p.write_bytes(data if isinstance(data,bytes) else data.encode('utf-8'))

def check(repo,expect_ok,**opts):
 args=[sys.executable,str(VERIFIER),'--root',str(repo),'--event',opts.get('event','pull_request')]
 if opts.get('base'):args+=['--base',opts['base']]
 if opts.get('pr'):args+=['--pr',str(opts['pr'])]
 p=subprocess.run(args,capture_output=True,text=True)
 if (p.returncode==0)!=expect_ok:
  raise AssertionError(f"Expected {expect_ok}: exit {p.returncode}\n{p.stdout}\n{p.stderr}")
 return p

def run():
 with tempfile.TemporaryDirectory() as tmp:
  repo=pathlib.Path(tmp)/'repo';repo.mkdir()
  for rel in ('security/tilawa-lock/verify.py','security/tilawa-lock/owner-approval-public.pem'):
   write(repo,rel,(ROOT/rel).read_bytes())
  kdf=json.loads((ROOT/'security/tilawa-lock/qa050-freeze.json').read_text())['ownerKDF']
  # Generate fixture-only, disconnected test owner key.
  owner=ed25519.Ed25519PrivateKey.generate()
  pub=owner.public_key().public_bytes(serialization.Encoding.PEM,serialization.PublicFormat.SubjectPublicKeyInfo)
  write(repo,'security/tilawa-lock/owner-approval-public.pem',pub)
  delivery=rsa.generate_private_key(public_exponent=65537,key_size=3072)
  write(repo,'security/tilawa-lock/v690-ota-rsa-public.pem',delivery.public_key().public_bytes(serialization.Encoding.PEM,serialization.PublicFormat.SubjectPublicKeyInfo))
  original=b'CSS original-asset-fixture\n'
  write(repo,'p92/owner-qa-001/tilawa.css',original)
  assets=[dict(path='tilawa.css',kind='css',size=len(original),sha256=hashlib.sha256(original).hexdigest())]
  # Test guard's strict 8-asset requirement with independently signed real-format fixture.
  for i in range(1,8):
   suffix='css' if i<3 else 'js'
   path=f'module-{i}.{suffix}'
   data=f'/* resource {i} */\n'.encode()
   write(repo,'p92/owner-qa-001/'+path,data)
   assets.append(dict(path=path,kind=suffix,size=len(data),sha256=hashlib.sha256(data).hexdigest()))
  manifest=dict(schema=1,channel='owner-qa',sequence=50,id='P116-QA050-PRINT-ZOOM-SMART-FOLLOW',title='fixture',minAppVersion=690,assets=assets)
  raw=json.dumps(manifest,separators=(',',':'),ensure_ascii=False).encode()
  signature=delivery.sign(raw,padding.PKCS1v15(),hashes.SHA256())
  outer={'payload':base64.b64encode(raw).decode(),'signature':base64.b64encode(signature).decode()}
  write(repo,'p92/owner-qa-001/release.json',json.dumps(outer,separators=(',',':')))
  sh(repo,'git','init','-q');sh(repo,'git','config','user.email','tests@example.invalid');sh(repo,'git','config','user.name','Test')
  freeze=dict(schema=1,module='tilawa',appVersion=690,channel='owner-qa',baselineSequence=50,baselineId=manifest['id'],baselineReleasePath='p92/owner-qa-001/release.json',baselineReleaseBlobSha1=sh(repo,'git','hash-object','p92/owner-qa-001/release.json'),ownerKDF=kdf,approvalPublicKeyPath='security/tilawa-lock/owner-approval-public.pem',rsaDeliveryPublicKeyPath='security/tilawa-lock/v690-ota-rsa-public.pem',assets=assets,protectedPrefixes=['p92/','p93/','.github/workflows/','security/tilawa-lock/'],protectedExactPaths=['app-update-manifest.json'])
  write(repo,'security/tilawa-lock/qa050-freeze.json',json.dumps(freeze))
  sh(repo,'git','add','.');sh(repo,'git','commit','-qm','baseline');old=sh(repo,'git','rev-parse','HEAD')
  check(repo,True)
  # Independent Tafsir/Library JSON must not need password.
  write(repo,'library/topics/note.json','{"independent":true}\n')
  sh(repo,'git','add','.');sh(repo,'git','commit','-qm','unrelated library update')
  check(repo,True,base=old,pr=123)
  # Unauthorized Tilawa changes must fail closed.
  libbase=sh(repo,'git','rev-parse','HEAD')
  write(repo,'security/tilawa-lock/README.md','# protected policy change')
  sh(repo,'git','add','.');sh(repo,'git','commit','-qm','protected policy edit')
  check(repo,False,base=libbase,pr=123)
  # Sign exact proposed changes with fixture owner private key; without a password in repository.
  sys.path.insert(0,str(ROOT/'security/tilawa-lock'))
  from verify import changed_paths,diff_digest,signing_bytes
  digest=diff_digest(repo,changed_paths(repo,libbase))
  now=dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
  approval=dict(schema=1,repo='nmg200101-collab/basair-tafsir-updates',pr=123,digest=digest,purpose='Test authorized metadata-only protected file change',created_at=now.isoformat().replace('+00:00','Z'),expires_at=(now+dt.timedelta(days=3)).isoformat().replace('+00:00','Z'))
  approval['signature_b64']=base64.b64encode(owner.sign(signing_bytes(approval))).decode()
  write(repo,'security/tilawa-lock/approvals/pr-123.json',json.dumps(approval))
  sh(repo,'git','add','.');sh(repo,'git','commit','-qm','signed owner approval')
  check(repo,True,base=libbase,pr=123)
  check(repo,True,base=libbase,event='push')
  # Any changed file after authorization must invalidate the signed content digest.
  write(repo,'security/tilawa-lock/README.md','# protected policy change after signing')
  sh(repo,'git','add','.');sh(repo,'git','commit','-qm','mutated after owner signed')
  check(repo,False,base=libbase,pr=123)
  # Even with approval, asset modifications fail if they diverge from locked QA050 resource hashes.
  write(repo,'p92/owner-qa-001/tilawa.css','tampered')
  sh(repo,'git','add','.');sh(repo,'git','commit','-qm','asset changed')
  check(repo,False,base=libbase,pr=123)
  print('PASS: Baseline RSA; unrelated JSON allowed; unsigned protected change blocked; signed PR allowed; push signature allowed; mutated digest blocked; frozen asset mismatch blocked')

if __name__=='__main__':run()
