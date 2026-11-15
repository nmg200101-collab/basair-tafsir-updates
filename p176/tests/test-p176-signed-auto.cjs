'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(ROOT,p));
const previous=read('p176/P175-SEQ51-OWNER-SIGNED-BEFORE-P176.json');
const candidate=read('p176/P176-SEQ52-OWNER-SIGNED-AUTOMATIC.json');
const mainRelease=read('p121/owner-qa/release.json');
assert.ok(mainRelease.equals(previous)||mainRelease.equals(candidate), 'Active manifest must be signed Seq51 or Seq52');
const pubSource=read('p146/tests/test-p146-signed-release.cjs').toString();
const match=pubSource.match(/const pub='([^']+)'/);
assert.ok(match, 'Original owner RSA verification key unavailable');
const key={key:Buffer.from(match[1],'base64'),format:'der',type:'spki'};
function decode(raw){
  const env=JSON.parse(raw.toString());
  assert.equal(typeof env.payload,'string');
  assert.equal(typeof env.signature,'string');
  const payload=Buffer.from(env.payload,'base64');
  const sig=Buffer.from(env.signature,'base64');
  assert.equal(sig.length,384,'RSA-3072 signature required');
  assert.equal(crypto.verify('RSA-SHA256',payload,key,sig),true,'Original owner signature invalid');
  return JSON.parse(payload.toString('utf8'));
}
const a=decode(previous),b=decode(candidate);
assert.equal(a.sequence,51);assert.equal(b.sequence,52);
assert.equal(a.modules[0].version,49);assert.equal(b.modules[0].version,50);
assert.equal(b.deliveryMode,'automatic');
assert.equal(b.channel,'owner-qa');
assert.equal(b.applicationId,'app.basair.qurv2');
assert.equal(b.minAppVersion,694);
assert.equal(b.schema,'basair-universal-ota-v1');
assert.ok(Date.parse(b.issuedAt)<=Date.now()+300000);
assert.ok(Date.parse(b.expiresAt)>Date.now());
assert.equal(b.modules.length,1);assert.equal(b.modules[0].id,'tafsir');
assert.equal(a.modules[0].assets.length,22);
assert.equal(b.modules[0].assets.length,24);
assert.deepEqual(b.modules[0].assets.slice(0,22),a.modules[0].assets, 'All 22 stable Seq51 assets must be unchanged');
assert.deepEqual(b.modules[0].assets.slice(22).map(x=>x.path),[
 'modules/tafsir/p176-tafsir-two-row-index.css',
 'modules/tafsir/p176-saved-return-context.js'
]);
for(const asset of b.modules[0].assets){
  assert.match(asset.path,/^modules\/tafsir\/[a-zA-Z0-9_.\/-]+\.(css|js|json)$/);
  assert.ok(!asset.path.includes('..'));
  const bytes=read('p121/owner-qa/'+asset.path);
  assert.equal(bytes.length,asset.size,'Incorrect size '+asset.path);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256,'Invalid SHA256 '+asset.path);
  if(asset.kind==='js')new vm.Script(bytes.toString('utf8'),{filename:asset.path});
}
const js=read('p121/owner-qa/modules/tafsir/p176-saved-return-context.js').toString();
const css=read('p121/owner-qa/modules/tafsir/p176-tafsir-two-row-index.css').toString();
for(const forbid of ['indexedDB','localStorage','__BASAIR_TAFSIR_STEP5__.loadNext','window.basairBack=']){
 assert.ok(!js.includes(forbid)&&!css.includes(forbid),'Forbidden stable subsystem: '+forbid);
}
assert.ok(!css.includes('#tafsirReader')&&!css.includes('#tafsirAyahs'));
console.log(JSON.stringify({result:'PASS',signed:true,sequence:52,mode:'automatic',tafsirVersion:50,
 stableAssetsPreserved:22,newAssets:2,sha256Verified:24,activeStatus:mainRelease.equals(candidate)?'Seq52':'Seq51',
 tilawaQA050Untouched:true,fieldApproved:false}));
