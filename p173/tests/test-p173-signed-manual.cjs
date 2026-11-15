'use strict';
// P173: review gate for original-owner signed Seq49, never publishes automatically.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),
  crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const original=read('p171/P171-SEQ48-OWNER-SIGNED-CANDIDATE.json');
const archived=read('p121/owner-qa/release-p171-seq48-before-p173-20261115.json');
const signed=read('p173/P173-SEQ49-OWNER-SIGNED-MANUAL-CANDIDATE.json');
const active=read('p121/owner-qa/release.json');
assert.deepEqual(archived,original,'Exact signed Seq48 rollback snapshot must be preserved');
assert.ok(active.equals(signed)||active.equals(original),'Active may be signed Seq48 or signed Seq49 only');
const text=read('p146/tests/test-p146-signed-release.cjs').toString();
const match=text.match(/const pub='([^']+)'/);
assert.ok(match,'Missing original owner verification key');
const key={key:Buffer.from(match[1],'base64'),format:'der',type:'spki'};
function unpack(data){
 const env=JSON.parse(data.toString('utf8'));
 const payload=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.equal(sig.length,384,'Owner RSA-3072 signature length');
 assert.ok(crypto.verify('RSA-SHA256',payload,key,sig),'Invalid owner RSA signature');
 return JSON.parse(payload.toString('utf8'));
}
const prev=unpack(original),next=unpack(signed);
assert.equal(prev.sequence,48);assert.equal(prev.modules[0].version,46);
assert.equal(next.sequence,49);assert.equal(next.modules[0].version,47);
assert.equal(next.schema,'basair-universal-ota-v1');
assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.channel,'owner-qa');
assert.equal(next.deliveryMode,'notify','P173 owner trial must remain manual');
assert.equal(next.minAppVersion,694,'Never lower APK compatibility without evidence');
assert.ok(Date.parse(next.issuedAt)<=Date.now()+300000);
assert.ok(Date.parse(next.expiresAt)>Date.now());
assert.equal(next.modules.length,1);assert.equal(next.modules[0].id,'tafsir');
assert.equal(prev.modules[0].assets.length,16);assert.equal(next.modules[0].assets.length,18);
assert.deepEqual(next.modules[0].assets.slice(0,16),prev.modules[0].assets,
 'All 16 signed Seq48 assets must remain byte-identical');
assert.deepEqual(next.modules[0].assets.slice(-2).map(x=>x.path),[
 'modules/tafsir/p173-tafsir-index-rebuild-guard.css',
 'modules/tafsir/p173-tafsir-index-rebuild-guard.js'
]);
let count=0;
for(const asset of next.modules[0].assets){
 const bytes=read('p121/owner-qa/'+asset.path);
 assert.equal(bytes.length,asset.size,'Incorrect file size '+asset.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256,
  'Incorrect SHA-256 '+asset.path);
 if(asset.kind==='js')new vm.Script(bytes.toString('utf8'),{filename:asset.path});
 count++;
}
const js=read('p121/owner-qa/modules/tafsir/p173-tafsir-index-rebuild-guard.js').toString();
assert.ok(js.includes('data-bq171-saved')&&js.includes('bq171-tools'),
 'Must reuse P171 proxy to prevent duplicate');
assert.ok(js.includes('Promise.resolve().then'),'Must reconcile before next visible frame');
assert.ok(!js.includes('indexedDB')&&!js.includes('localStorage'),'Must not touch saved data');
assert.ok(next.modules.every(x=>x.id!=='tilawa'),'QA-050 locked');
console.log(JSON.stringify({result:'PASS',sequence:49,tafsirVersion:47,mode:'manual-notify',
 originalOwnerRSA3072:true,protectedPreviousAssets:16,newAssets:2,verifiedAssets:count,
 previousSeq48SignedBackup:true,activeSeq:active.equals(signed)?49:48,
 noTilawaChanges:true,androidFieldAcceptance:'PENDING',published:active.equals(signed)}));
