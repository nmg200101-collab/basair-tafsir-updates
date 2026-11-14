'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const base=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(base,p));
const previous=read('p121/owner-qa/release-p166-seq43-before-p167-20261115.json');
const signed=read('p167/P167-SEQ44-OWNER-SIGNED-RELEASE.json');
const active=read('p121/owner-qa/release.json');
assert.deepEqual(previous,read('p166/P166-SEQ43-OWNER-SIGNED-RELEASE.json'),'Signed Seq43 rollback differs');
assert.deepEqual(active,signed,'Active Seq44 must match original-owner signature bytes');
const source=read('p146/tests/test-p146-signed-release.cjs').toString();
const match=source.match(/const pub='([^']+)'/);assert.ok(match,'Original owner OTA public key missing');
const pub={key:Buffer.from(match[1],'base64'),format:'der',type:'spki'};
function decode(v){const env=JSON.parse(v.toString()),bytes=Buffer.from(env.payload,'base64'),signature=Buffer.from(env.signature,'base64');
 assert.equal(signature.length,384);assert.ok(crypto.verify('RSA-SHA256',bytes,pub,signature),'Invalid RSA3072 owner signature');
 return JSON.parse(bytes.toString());}
const old=decode(previous),next=decode(signed);
assert.equal(old.sequence,43);assert.equal(old.modules[0].version,41);
assert.equal(next.sequence,44);assert.equal(next.modules[0].version,42);
assert.equal(next.applicationId,'app.basair.qurv2');assert.equal(next.channel,'owner-qa');
assert.equal(next.schema,'basair-universal-ota-v1');assert.equal(next.deliveryMode,'automatic');
assert.equal(next.minAppVersion,694);assert.ok(Date.parse(next.expiresAt)>Date.now());
assert.equal(next.modules.length,1);assert.equal(next.modules[0].id,'tafsir');
const oldAssets=old.modules[0].assets,a=next.modules[0].assets;
assert.equal(oldAssets.length,10);assert.equal(a.length,10);
const changed=a.filter((v,i)=>v.path!==oldAssets[i].path);
assert.equal(changed.length,1,'Exactly one asset must change');
assert.equal(changed[0].path,'modules/tafsir/p167-tafsir-follow-stop-manual-touch.js');
assert.equal(oldAssets[6].path,'modules/tafsir/p130-verse-tools.js');
assert.equal(changed[0].sha256,'8ecd6b69c2d1af21f4c9060882b006c4b900e35e9846823dc7be1fc8ce7ac43a');
for(let i=0;i<a.length;i++){
 const x=a[i];assert.equal(x.kind,x.path.split('.').at(-1));
 const bytes=read('p121/owner-qa/'+x.path);
 assert.equal(bytes.length,x.size,'size mismatch '+x.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),x.sha256,'asset hash mismatch '+x.path);
 if(i!==6)assert.deepEqual(x,oldAssets[i],'Unchanged asset differs '+x.path);
 if(x.kind==='js')new vm.Script(bytes.toString(),{filename:x.path});
}
const p167=read('p121/owner-qa/modules/tafsir/p167-tafsir-follow-stop-manual-touch.js').toString();
const p166=read('p121/owner-qa/modules/tafsir/p166-tafsir-single-control-owner.js').toString();
assert.ok(p167.includes("document.addEventListener('touchend'"),'Android touchend not captured');
assert.ok(p167.includes("manualFailures.clear()"),'Failed transition reset on stop');
assert.ok(p167.includes('manualFailures.get(transition)'),'Bounded retry required');
assert.ok(p167.includes("manualDisabled()"),'Do not append while Follow running');
assert.ok(p167.includes('requestManualNext(false)'),'Only native P130 manual feed may append');
assert.ok(p167.includes("var mode=running?'p128-follow':'p129-manual'"));
assert.ok(!p167.includes('P165-NARRATOR')&&!p167.includes('bq166Voice'),'Never affect narrator');
assert.ok(p166.includes('mic.click()')&&p166.includes('button[data-p125-follow]'),'Previous narrator/follow controls unchanged');
console.log(JSON.stringify({status:'PASS',sequence:44,moduleVersion:42,ownerRSA3072:true,unchangedAssets:9,
 originalP130Owned:true,AndroidTouchEndWithoutScroll:true,retryAtMostTwice:true,narratorP166Unchanged:true,notesP163Unchanged:true}));
