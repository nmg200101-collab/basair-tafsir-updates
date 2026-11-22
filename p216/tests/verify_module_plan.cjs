#!/usr/bin/env node
/* P216 frozen unsigned plan integrity — does not verify an OTA RSA signature. */
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const plan=JSON.parse(fs.readFileSync(path.join(root,'p216/report/P216_UNSIGNED_MODULE_PLAN.json'),'utf8'));
function requireOk(condition,msg){if(!condition)throw Error(msg)}
requireOk(plan.status==='UNSIGNED_NOT_PUBLISHED','Plan must remain unsigned staging');
requireOk(plan.forward.modules.length===1&&plan.forward.modules[0].id==='updates','Wrong module');
const assets=plan.forward.modules[0].assets;
requireOk(assets.length===7,'Must retain 5 prior + 2 new assets');
requireOk(plan.rollback.modules[0].assets.length===5,'Wrong rollback original count');
requireOk(plan.forward.deliveryMode==='notify','Must use signed notification mode on future release');
let checked=0,totalBytes=0;
for(const a of assets){
  const fp=path.resolve(root,'p121/owner-qa',a.path);
  requireOk(fp.startsWith(root+path.sep),'Unsafe path');
  const b=fs.readFileSync(fp);
  const digest=crypto.createHash('sha256').update(b).digest('hex');
  requireOk(b.length===a.size&&digest===a.sha256,'Hash mismatch: '+a.path);
  totalBytes+=b.length;checked++;
}
for(let i=0;i<5;i++){
  const orig=plan.rollback.modules[0].assets[i],retained=assets[i];
  requireOk(orig.path===retained.path&&orig.sha256===retained.sha256&&orig.size===retained.size,
    'Legacy recovery source changed at index '+i);
}
requireOk(totalBytes===plan.forward.totalBytes,'Total bytes changed');
requireOk(assets[5].path.endsWith('/p216-unified-update-center.css')&&
          assets[6].path.endsWith('/p216-unified-update-center.js'),'Wrong signed asset order');
console.log(JSON.stringify({status:'PASS',assetsVerified:checked,totalBytes,rollbackLegacyAssets:5,
  note:'Bytes-only gate; signed release and Android acceptance not yet performed.'},null,2));
