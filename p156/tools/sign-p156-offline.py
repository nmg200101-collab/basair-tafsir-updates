#!/usr/bin/env python3
"""P156 owner OFFLINE signer. Does not upload, commit, publish or print credentials.
Requires: python -m pip install cryptography
Use ONLY original owner's RSA-3072 key. The verified owner PKCS12 shares the trusted OTA RSA public key.
"""
import argparse
import base64
from datetime import datetime,timedelta,timezone
import getpass
import hashlib
import json
import os
from pathlib import Path
import re
import zipfile
from cryptography.hazmat.primitives import hashes,serialization
from cryptography.hazmat.primitives.asymmetric import padding,rsa
from cryptography.hazmat.primitives.serialization import pkcs12

ROOT=Path(__file__).resolve().parents[2]
JS=ROOT/'p146/tests/test-p146-signed-release.cjs'
CANDIDATE=ROOT/'p156/P156-SEQ33-UNSIGNED-CANDIDATE.json'
CURRENT=ROOT/'p121/owner-qa/release.json'
OUTPUT=ROOT/'p156/P156-SEQ33-OWNER-SIGNED-RELEASE.json'

def compact(obj):
    return json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode('utf-8')
def sha(raw):
    return hashlib.sha256(raw).hexdigest()
def verifier():
    # Trusted original RSA public verifier, not an arbitrary new key.
    source=JS.read_text('utf-8')
    match=re.search(r"const pub='([A-Za-z0-9+/=]+)'",source)
    if not match:raise SystemExit('Missing original owner RSA public verifier')
    pub=serialization.load_der_public_key(base64.b64decode(match.group(1)))
    if not isinstance(pub,rsa.RSAPublicKey) or pub.key_size!=3072:
        raise SystemExit('Unexpected original OTA verifier')
    return pub
def verify_envelope(raw,pub):
    env=json.loads(raw)
    payload=base64.b64decode(env['payload'],validate=True)
    signature=base64.b64decode(env['signature'],validate=True)
    pub.verify(signature,payload,padding.PKCS1v15(),hashes.SHA256())
    return json.loads(payload)
def load_private(path):
    suffix=path.suffix.lower()
    if suffix=='.zip':
        # Original owner ZIP is read only in private/local memory; no extraction or upload.
        with zipfile.ZipFile(path,'r') as archive:
            raw=archive.read('OWNER-SIGNING-KEY.p12')
            credentials=archive.read('SIGNING-CREDENTIALS-PRIVATE.txt').decode('utf-8')
        found=re.search(r'(?m)^Keystore password:\s*(.*?)\s*$',credentials)
        if not found:raise SystemExit('No keystore password inside private ZIP')
        private,cert,_=pkcs12.load_key_and_certificates(raw,found.group(1).encode('utf-8'))
        if not private or not cert:raise SystemExit('No usable original private key/certificate in ZIP')
        return private
    if suffix in ('.p12','.pfx'):
        password=getpass.getpass('Owner PKCS12 password: ').encode('utf-8')
        private,cert,_=pkcs12.load_key_and_certificates(path.read_bytes(),password)
        if not private or not cert:raise SystemExit('No usable original private key in PKCS12')
        return private
    raw=path.read_bytes()
    try:return serialization.load_pem_private_key(raw,password=None)
    except TypeError:
        pw=getpass.getpass('Owner RSA PEM password: ').encode('utf-8')
        return serialization.load_pem_private_key(raw,password=pw)

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--key',required=True,type=Path,help='Original owner RSA key in private ZIP, PKCS12 or PEM; never upload')
    p.add_argument('--out',type=Path,default=OUTPUT,help='Local signed JSON output')
    a=p.parse_args()
    pub=verifier()
    current=verify_envelope(CURRENT.read_bytes(),pub)
    if current.get('sequence')!=32 or current.get('applicationId')!='app.basair.qurv2' or (
        current.get('modules') or [{}])[0].get('version')!=30:
        raise SystemExit('Active owner release changed; refuse to sign or allocate Seq33')
    candidate=json.loads(CANDIDATE.read_text('utf-8'))
    if candidate.get('signed') or candidate.get('published'):
        raise SystemExit('Candidate must remain unsigned and unpublished')
    item=candidate['proposedPayload']
    if item['sequence']!=33 or item['applicationId']!='app.basair.qurv2' or (
        len(item['modules'])!=1 or item['modules'][0]['id']!='tafsir' or
        item['modules'][0]['version']!=31 or len(item['modules'][0]['assets'])!=2 or
        item['deliveryMode']!='automatic' or item['minAppVersion']!=695
    ):
        raise SystemExit('Unexpected P156 payload contract')
    for asset in item['modules'][0]['assets']:
        if not re.fullmatch(r'modules/tafsir/p156-tafsir-recovery\.(?:css|js)',asset['path']):
            raise SystemExit('Unapproved asset path')
        raw=(ROOT/'p121/owner-qa'/asset['path']).read_bytes()
        if len(raw)!=asset['size'] or sha(raw)!=asset['sha256']:
            raise SystemExit('Asset checksum/size mismatch')
    key=load_private(a.key)
    if not isinstance(key,rsa.RSAPrivateKey) or key.key_size!=3072 or (
        key.public_key().public_numbers()!=pub.public_numbers()
    ):
        raise SystemExit('Wrong key: original owner OTA RSA-3072 required; Android APK key is not acceptable')
    now=datetime.now(timezone.utc)
    item['issuedAt']=now.isoformat(timespec='seconds').replace('+00:00','Z')
    item['expiresAt']=(now+timedelta(days=90)).isoformat(timespec='seconds').replace('+00:00','Z')
    data=compact(item)
    sig=key.sign(data,padding.PKCS1v15(),hashes.SHA256())
    env={'payload':base64.b64encode(data).decode('ascii'),
         'signature':base64.b64encode(sig).decode('ascii')}
    b=compact(env)
    verify_envelope(b,pub)
    out=a.out.resolve()
    out.parent.mkdir(parents=True,exist_ok=True)
    if out.exists():raise SystemExit('Refusing to overwrite signed output')
    fd=os.open(out,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as stream:stream.write(b)
    print(json.dumps({'status':'SIGNED_VALID_ORIGINAL_RSA3072',
      'sequence':33,'moduleVersion':31,'sha256':sha(b),
      'path':str(out),'published':False,'androidTest':'PENDING'},
      ensure_ascii=False))
if __name__=='__main__':main()
