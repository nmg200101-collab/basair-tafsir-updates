'use strict';
/* P166 signed OTA audit: full-module replacement, single owner, no old race. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=(x)=>fs.readFileSync(path.join(root,x));
const prior=read('p121/owner-qa/release-p165-seq42-before-p166-20261115.json');
const signed=read('p166/P166-SEQ43-OWNER-SIGNED-RELEASE.json');
const active=read('p121/owner-qa/release.json');
assert.deepEqual(prior,read('p165/P165-SEQ42-OWNER-SIGNED-RELEASE.json'),'Seq42 rollback changed');
assert.deepEqual(active,signed,'Staged release not exact owner-signed bytes');
const source=read('p146/tests/test-p146-signed-release.cjs').toString('utf8');
const match=source.match(/const pub='([^']+)'/);assert.ok(match,'Original OTA verifier missing');
const pub={key:Buffer.from(match[1],'base64'),format:'der',type:'spki'};
function release(raw){const e=JSON.parse(raw.toString('utf8'));const payload=Buffer.from(e.payload,'base64'),sig=Buffer.from(e.signature,'base64');
assert.equal(sig.length,384,'Owner RSA-3072 signature length');
assert.ok(crypto.verify('RSA-SHA256',payload,pub,sig),'Original owner signature mismatch');
return JSON.parse(payload.toString('utf8'))}
const old=release(prior),next=release(signed);
assert.equal(old.sequence,42);assert.equal(old.modules[0].version,40);
assert.equal(next.sequence,43);assert.equal(next.modules[0].version,41);
assert.equal(next.schema,'basair-universal-ota-v1');assert.equal(next.channel,'owner-qa');
assert.equal(next.applicationId,'app.basair.qurv2');assert.equal(next.minAppVersion,694);
assert.equal(next.deliveryMode,'automatic');assert.ok(Date.parse(next.expiresAt)>Date.now());
assert.equal(next.modules.length,1);assert.equal(next.modules[0].id,'tafsir');
const a=next.modules[0].assets;assert.equal(a.length,10);
const names=a.map(x=>x.path.split('/').pop());
assert.deepEqual(names,[
 'p130-verse-tools.css','p144-natiq.css','p157-native-saved-stability.css','p163-tafsir-note-fixed-bottom.css','p166-tafsir-single-control-owner.css',
 'p144-natiq.js','p130-verse-tools.js','p157-native-saved-stability.js','p163-tafsir-note-fixed-bottom.js','p166-tafsir-single-control-owner.js']);
assert.ok(names.every(x=>!/^p(162|165)-/.test(x)),'Competing scripts P162 and P165 must not be loaded');
const oldAssets=new Map(old.modules[0].assets.map(x=>[x.path,x]));
for(const asset of a){
 const data=read('p121/owner-qa/'+asset.path);
 assert.equal(data.length,asset.size,'Byte size mismatch '+asset.path);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),asset.sha256,'Asset hash mismatch '+asset.path);
 if(oldAssets.has(asset.path))assert.deepEqual(asset,oldAssets.get(asset.path),'Stable P157/P163 asset changed');
 if(asset.kind==='js')new vm.Script(data.toString('utf8'),{filename:asset.path});
}
const p130=read('p121/owner-qa/modules/tafsir/p130-verse-tools.js').toString();
const p144=read('p121/owner-qa/modules/tafsir/p144-natiq.js').toString();
const p166=read('p121/owner-qa/modules/tafsir/p166-tafsir-single-control-owner.js').toString();
const css=read('p121/owner-qa/modules/tafsir/p166-tafsir-single-control-owner.css').toString();
assert.ok(/function stopFromUser\(\)[\s\S]*?synchronizeReaderMode\(\)/.test(p130));
assert.ok(p130.includes("var mode=running?'p128-follow':'p129-manual'"));
assert.ok(p130.includes("document.addEventListener('click',onClick,true)"));
assert.ok(p130.includes("b.hasAttribute('data-p125-follow')"));
assert.ok(p130.includes('requestManualNext(force)'));
assert.ok(p144.includes('function onTafsirChanged(mutations)'));
assert.ok(p166.includes('button[data-p125-follow]'));
assert.ok(p166.includes('mic.click()'));
assert.ok(p166.includes('Never move original P144 microphone'));
assert.ok(css.includes('data-bq166-voice-ready'));
for(const forbidden of ['__BASAIR_TAFSIR_R114__.toggle','r114().toggle','loadNext(',
 'p130().manualNext','localStorage.setItem','data-basair-main-tab\',', 'stopImmediatePropagation','cloneNode'])
 assert.ok(!p166.includes(forbidden),'P166 may not bypass the original owner: '+forbidden);
console.log(JSON.stringify({status:'PASS',signedSeq43:true,ownerRSA3072:true,assetHashes:10,
  p130OnlyFollowAndManualOwner:true,p144OnlyVoiceOwner:true,p163NotesIdentical:true,
  competingP162P165Removed:true,AndroidFieldTest:'PENDING'}));
