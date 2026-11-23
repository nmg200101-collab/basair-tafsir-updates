#!/usr/bin/env python3
"""Sign an exact QA050 GitHub approval in the ORIGINAL, trusted signing environment.

NEVER upload a private key or passphrase to GitHub or ChatGPT. This program
uses the existing trusted main-branch public key and refuses mismatched scope.
Usage on a trusted local clone with checked-out PR #174:
  python3 p219/tools/qa050_sign_request.py \
    --key /secure/off-repository/original-qa050-private.pem \
    --request ci/tilawa-approvals/P219_QA050_GUARD_SCOPE_REQUEST_20261123.json
Then commit ONLY the signed request JSON; GitHub verifies it independently.
"""
import argparse
import base64
from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'ci'))
import tilawa_lock_guard as guard

def git(*args):
    return subprocess.check_output(['git',*args],cwd=ROOT).decode('utf8').strip()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--key',type=Path,required=True,help='Private Ed25519 QA050 PEM path, outside Git')
    parser.add_argument('--request',type=Path,required=True)
    parser.add_argument('--write',action='store_true',help='Write ONLY the signed approval JSON')
    args=parser.parse_args()
    key=args.key.expanduser().resolve()
    req=(ROOT/args.request).resolve() if not args.request.is_absolute() else args.request.resolve()
    if not key.is_file() or key.is_relative_to(ROOT):
        raise ValueError('QA050 private key must be a readable OFF-REPOSITORY original PEM')
    if not req.is_relative_to(ROOT/'ci'/'tilawa-approvals') or req.suffix!='.json':
        raise ValueError('Approval request must remain in ci/tilawa-approvals/*.json')
    if not req.is_file():
        raise ValueError('Approval request JSON missing')
    original=json.loads(req.read_text(encoding='utf8'))
    if original.get('signature'):
        raise ValueError('A signature already exists; review rather than overwrite it')
    scope=original['scope']; request=original['request']
    if scope.get('protocol')!=guard.PROTOCOL or request.get('protocol')!=guard.PROTOCOL:
        raise ValueError('Unknown protocol')
    if not request.get('reason','').strip():
        raise ValueError('Missing explicit owner approval reason')
    now=datetime.now(timezone.utc)
    issued=datetime.fromisoformat(request['issued_at'].replace('Z','+00:00'))
    expires=datetime.fromisoformat(request['expires_at'].replace('Z','+00:00'))
    if issued.tzinfo is None or expires.tzinfo is None or not (issued<=now<expires):
        raise ValueError('QA050 approval window not currently valid')
    if expires-issued>timedelta(days=14):
        raise ValueError('QA050 approval expiry exceeds 14 days')
    if not scope.get('protected_files'):
        raise ValueError('Refusing to approve an empty protected diff')
    if git('rev-parse','HEAD') != git('rev-parse',git('rev-parse','--abbrev-ref','HEAD')):
        raise ValueError('Cannot resolve current HEAD')
    trusted_scope=guard.scope_for('origin/main','HEAD')
    if trusted_scope!=scope:
        raise ValueError('Protected scope/base commit changed; regenerate request and obtain fresh approval')
    original_key=git('show','origin/main:'+guard.PUBLIC)
    if 'BEGIN PUBLIC KEY' not in original_key:
        raise ValueError('Trusted original QA050 public key missing')
    msg=guard.canonical({'scope':scope,'request':request})
    with tempfile.TemporaryDirectory() as tmp:
        d=Path(tmp)
        message=d/'message.bin'; sig=d/'sig.bin'; pub=d/'original-qa050-public.pem'
        message.write_bytes(msg)
        pub.write_text(original_key+'\n',encoding='ascii')
        # OpenSSL prompts for a passphrase ONLY on the trusted terminal if required.
        subprocess.run(['openssl','pkeyutl','-sign','-inkey',str(key),
            '-rawin','-in',str(message),'-out',str(sig)],check=True,cwd=ROOT)
        signature=sig.read_bytes()
        if len(signature)!=64:
            raise ValueError('Original QA050 Ed25519 signature must be 64 bytes')
        verify=subprocess.run(['openssl','pkeyutl','-verify','-pubin',
            '-inkey',str(pub),'-rawin','-in',str(message),'-sigfile',str(sig)],
            capture_output=True,cwd=ROOT)
        if verify.returncode!=0:
            raise ValueError('Signature does NOT match trusted QA050 public key; no approval written')
    if not args.write:
        print('VALIDATED ONLY; add --write after reviewing the exact scope')
        return 0
    original['signature']=base64.b64encode(signature).decode('ascii')
    req.write_text(json.dumps(original,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    print('QA050 VALID signature saved to '+str(req.relative_to(ROOT)))
    print('Approved protected paths: '+str(len(scope['protected_files'])))
    print('Private key and passphrase were never copied to this repository.')

if __name__=='__main__':
    try:sys.exit(main())
    except (ValueError,KeyError,subprocess.CalledProcessError,OSError) as err:
        print('QA050 NOT APPROVED: '+str(err),file=sys.stderr)
        sys.exit(2)
