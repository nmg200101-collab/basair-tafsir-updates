'use strict';
// P177 gated verification; this test never publishes a release.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(ROOT,p));
const previous=read('p177/P176-SEQ52-OWNER-SIGNED-BEFORE-P177.json');
const candidate=read('p177/P177-SEQ53-OWNER-SIGNED-AUTOMATIC.json');
const current=read('p121/owner-qa/release.json');
assert.ok(current.equals(previous)||current.equals(candidate),'Active must be either signed Seq52 or signed Seq53');
const pubSource=read('p146/tests/test-p146-signed-release.cjs').toString('utf8');
const match=pubSource.match(/const pub='([^']+)'/);
assert.ok(match,'Original owner public RSA key unavailable');
const key={key:Buffer.from(match[1],'base64'),format:'der',type:'spki'};
function unpack(raw){
  const env=JSON.parse(raw.toString('utf8'));
  assert.deepEqual(Object.keys(env),['payload','signature']);
  const payload=Buffer.from(env.payload,'base64');
  const sig=Buffer.from(env.signature,'base64');
  assert.equal(sig.length,384,'Owner RSA-3072 expected');
  assert.ok(crypto.verify('RSA-SHA256',payload,key,sig),'Bad owner signature');
  return JSON.parse(payload.toString('utf8'));
}
const a=unpack(previous),b=unpack(candidate);
assert.equal(a.sequence,52);assert.equal(b.sequence,53);
assert.equal(a.modules[0].version,50);assert.equal(b.modules[0].version,51);
assert.equal(b.deliveryMode,'automatic');assert.equal(b.channel,'owner-qa');
assert.equal(b.schema,'basair-universal-ota-v1');
assert.equal(b.applicationId,'app.basair.qurv2');
assert.equal(b.minAppVersion,694);
assert.ok(Date.parse(b.issuedAt)<=Date.now()+300000);
assert.ok(Date.parse(b.expiresAt)>Date.now());
assert.equal(a.modules.length,1);assert.equal(b.modules.length,1);
assert.equal(b.modules[0].id,'tafsir');
assert.equal(a.modules[0].assets.length,24);assert.equal(b.modules[0].assets.length,26);
assert.deepEqual(b.modules[0].assets.slice(0,24),a.modules[0].assets,'Seq52 24 protected assets must remain unchanged');
assert.deepEqual(b.modules[0].assets.slice(24).map(x=>x.path),[
 'modules/tafsir/p177-tafsir-reader-final.css',
 'modules/tafsir/p177-tafsir-reader-final.js'
]);
for(const asset of b.modules[0].assets){
  assert.match(asset.path,/^modules\/tafsir\/[a-zA-Z0-9_.\/-]+\.(css|js|json)$/);
  assert.ok(!asset.path.includes('..'));
  const bytes=read('p121/owner-qa/'+asset.path);
  assert.equal(bytes.length,asset.size,'Incorrect asset size '+asset.path);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256,'Invalid SHA-256 '+asset.path);
  if(asset.kind==='js')new vm.Script(bytes.toString('utf8'),{filename:asset.path});
}
const js=read('p121/owner-qa/modules/tafsir/p177-tafsir-reader-final.js').toString('utf8');
const css=read('p121/owner-qa/modules/tafsir/p177-tafsir-reader-final.css').toString('utf8');
for(const forbidden of ['indexedDB','localStorage','window.basairBack=','__BASAIR_TAFSIR_STEP5__.loadNext']){
 assert.ok(!js.includes(forbidden)&&!css.includes(forbidden),'Unsafe modification '+forbidden);
}
assert.ok(js.includes('p144MicButton')&&js.includes('__BASAIR_TAFSIR_NATIQ_P132__'));
console.log(JSON.stringify({result:'PASS',sequence:53,deliveryMode:'automatic',tafsirVersion:51,
 protectedSeq52Assets:24,newP177Assets:2,allAssetsVerified:26,originalOwnerSignature:true,
 activeStatus:current.equals(candidate)?'Seq53':'Seq52',tilawaUntouched:true,fieldApprovalPending:true}));
