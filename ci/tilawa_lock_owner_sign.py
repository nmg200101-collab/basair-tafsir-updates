#!/usr/bin/env python3
"""Create owner unlock for one specific PR; uses offline encrypted key."""
import argparse,base64,getpass,json
from datetime import datetime,timezone,timedelta
from pathlib import Path
from cryptography.hazmat.primitives import serialization
from tilawa_lock_guard import canonical,scope_for,PROTOCOL

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--base',required=True)
    p.add_argument('--head',default='HEAD')
    p.add_argument('--key',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--reason',required=True)
    a=p.parse_args()
    scope=scope_for(a.base,a.head)
    if not scope['protected_files']:
        raise SystemExit('No protected change to approve')
    password=getpass.getpass('Tilawa owner unlock password: ').encode('utf8')
    private=serialization.load_pem_private_key(a.key.read_bytes(),password=password)
    now=datetime.now(timezone.utc)
    request={'protocol':PROTOCOL,'reason':a.reason,
             'issued_at':now.isoformat(),
             'expires_at':(now+timedelta(days=7)).isoformat()}
    signature=private.sign(canonical({'scope':scope,'request':request}))
    approval={'scope':scope,'request':request,'signature':base64.b64encode(signature).decode()}
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(approval,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    print('Signed exact Tilawa diff; public approval saved:',a.out)
    print('Password and private key NOT saved in the approval or repository')

if __name__=='__main__': main()
