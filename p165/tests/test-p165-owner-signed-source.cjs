'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p));
const prev=read('p121/owner-qa/release-p164-seq41-before-p165-20261114.json');
const signed=read('p165/P165-SEQ42-OWNER-SIGNED-RELEASE.json');
const active=read('p121/owner-qa/release.json');
assert.deepEqual(prev,read('p164/P164-SEQ41-OWNER-SIGNED-RELEASE.json'),'Exact signed Seq41 rollback required');
assert.deepEqual(active,signed,'Staged active Seq42 must be original signed byte-exact');
const original=(read('p146/tests/test-p146-signed-release.cjs').toString('utf8').match(/const pub='([^']+)'/)||[])[1];
assert.ok(original,'Original OTA verifier missing');
const key={key:Buffer.from(original,'base64'),format:'der',type:'spki'};
function unseal(blob){
 const j=JSON.parse(blob.toString('utf8')),raw=Buffer.from(j.payload,'base64'),sig=Buffer.from(j.signature,'base64');
 assert.equal(sig.length,384);
 assert.ok(crypto.verify('RSA-SHA256',raw,key,sig),'Original RSA3072 signature failed');
 return JSON.parse(raw.toString('utf8'));
}
const old=unseal(prev),updated=unseal(signed);
assert.equal(old.sequence,41);assert.equal(old.modules[0].version,39);
assert.equal(updated.sequence,42);assert.equal(updated.modules[0].version,40);
assert.equal(updated.schema,'basair-universal-ota-v1');assert.equal(updated.channel,'owner-qa');
assert.equal(updated.applicationId,'app.basair.qurv2');assert.equal(updated.minAppVersion,694);
assert.equal(updated.deliveryMode,'automatic');assert.ok(Date.parse(updated.expiresAt)>Date.now());
assert.equal(updated.modules.length,1);assert.equal(updated.modules[0].id,'tafsir');
const assets=updated.modules[0].assets;
assert.deepEqual(assets.map(x=>x.path),[
 'modules/tafsir/p157-native-saved-stability.css',
 'modules/tafsir/p162-tafsir-stable-anchors.css',
 'modules/tafsir/p163-tafsir-note-fixed-bottom.css',
 'modules/tafsir/p165-tafsir-inline-narrator.css',
 'modules/tafsir/p157-native-saved-stability.js',
 'modules/tafsir/p162-tafsir-stable-anchors.js',
 'modules/tafsir/p163-tafsir-note-fixed-bottom.js',
 'modules/tafsir/p165-tafsir-narrator-scroll-recovery.js']);
for(const i of [0,1,2,4,5,6])assert.deepEqual(assets[i],old.modules[0].assets[i],
 'Previous index/notes/scroll asset modified unexpectedly');
for(const item of assets){
 const bytes=read('p121/owner-qa/'+item.path);
 assert.equal(item.kind,item.path.split('.').at(-1));
 assert.equal(bytes.length,item.size,'Wrong size '+item.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256,'Wrong SHA '+item.path);
 if(item.kind==='js')new vm.Script(bytes.toString('utf8'),{filename:item.path});
}
const js=read('p121/owner-qa/modules/tafsir/p165-tafsir-narrator-scroll-recovery.js').toString('utf8');
const css=read('p121/owner-qa/modules/tafsir/p165-tafsir-inline-narrator.css').toString('utf8');
for(const key of ['v194T2SectionTitle','v194T2FieldTitle','v194T2Qrow','bq165InlineNarrator',
 'm.click()','safeManualNext','manualNext()','step.loadNext()','touchmove','nearEnd','voiceUsed'])
 assert.ok(js.includes(key),'Missing native compatibility feature: '+key);
for(const key of ['height:25px!important','data-bq165-narrator-ready','p146TopMic','display:none!important'])
 assert.ok(css.includes(key),'Missing original narrator dedupe: '+key);
for(const unsafe of ['stopImmediatePropagation',"setAttribute('data-basair-main-tab'",'localStorage.setItem',
 'indexedDB.deleteDatabase','__BASAIR_TAFSIR_R114__.toggle','cloneNode(','setInterval(function(){safeManualNext'])
 assert.ok(!js.includes(unsafe),'Unsafe reader/notes mutation in narrator: '+unsafe);
assert.ok(!css.includes('bq163NoteLower')&&!css.includes('p149NoteSlot'));
console.log(JSON.stringify({status:'PASS',seq42:true,tafsirV40:true,originalOwnerRSA3072:true,
 oldSixAssetsExact:true,manualGestureOnly:true,postSpeechOnly:true,oneTailBoundedRetry:true,
 p163NotesUntouched:true,r114FollowUntouched:true,fieldAndroid:'UNVERIFIED'}));
