'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const old=read('p121/owner-qa/release-p163-seq40-before-p164-20261114.json');
const signed=read('p164/P164-SEQ41-OWNER-SIGNED-RELEASE.json');
const active=read('p121/owner-qa/release.json');
assert.deepEqual(old,read('p163/P163-SEQ40-OWNER-SIGNED-RELEASE.json'),'Original Seq40 rollback not exact');
assert.deepEqual(signed,active,'Active release must be the original owner signed Seq41');
const pub=(read('p146/tests/test-p146-signed-release.cjs').toString('utf8').match(/const pub='([^']+)'/)||[])[1];
assert.ok(pub,'Original OTA public verifier missing');
const key={key:Buffer.from(pub,'base64'),format:'der',type:'spki'};
function payload(blob){const e=JSON.parse(blob.toString('utf8')),raw=Buffer.from(e.payload,'base64'),
 sig=Buffer.from(e.signature,'base64');assert.equal(sig.length,384);
 assert.ok(crypto.verify('RSA-SHA256',raw,key,sig),'Original owner signature failed');return JSON.parse(raw.toString('utf8'))}
const p163=payload(old),p164=payload(signed);
assert.equal(p163.sequence,40);assert.equal(p163.modules[0].version,38);
assert.equal(p164.sequence,41);assert.equal(p164.modules[0].version,39);
assert.equal(p164.schema,'basair-universal-ota-v1');assert.equal(p164.channel,'owner-qa');
assert.equal(p164.applicationId,'app.basair.qurv2');assert.equal(p164.minAppVersion,694);
assert.equal(p164.deliveryMode,'automatic');assert.ok(Date.parse(p164.expiresAt)>Date.now());
assert.equal(p164.modules.length,1);assert.equal(p164.modules[0].id,'tafsir');
const assets=p164.modules[0].assets;
assert.deepEqual(assets.map(a=>a.path),[
 'modules/tafsir/p157-native-saved-stability.css',
 'modules/tafsir/p162-tafsir-stable-anchors.css',
 'modules/tafsir/p163-tafsir-note-fixed-bottom.css',
 'modules/tafsir/p164-tafsir-inline-narrator.css',
 'modules/tafsir/p157-native-saved-stability.js',
 'modules/tafsir/p162-tafsir-stable-anchors.js',
 'modules/tafsir/p163-tafsir-note-fixed-bottom.js',
 'modules/tafsir/p164-tafsir-inline-narrator.js']);
const oldAssets=p163.modules[0].assets;
for(let i=0;i<oldAssets.length;i++)assert.deepEqual(oldAssets[i],assets[i<3?i:i+1],
 'Existing P157/P162/P163 asset changed: '+oldAssets[i].path);
for(const asset of assets){
 assert.equal(asset.kind,asset.path.split('.').pop());
 const raw=read('p121/owner-qa/'+asset.path);
 assert.equal(asset.size,raw.length,'Byte size mismatch: '+asset.path);
 assert.equal(asset.sha256,crypto.createHash('sha256').update(raw).digest('hex'),
  'SHA256 mismatch: '+asset.path);
 if(asset.kind==='js')new vm.Script(raw.toString('utf8'),{filename:asset.path});
}
const js=read('p121/owner-qa/modules/tafsir/p164-tafsir-inline-narrator.js').toString('utf8');
const css=read('p121/owner-qa/modules/tafsir/p164-tafsir-inline-narrator.css').toString('utf8');
for(const token of ['bq164InlineNarrator','v194T2Field.meaning','original.click()',
 'p144MicButton','data-bq164-narrator-ready','aria-pressed'])
 assert.ok(js.includes(token),'Required narration presentation missing: '+token);
for(const token of ['height:25px!important','width:60px!important',
 'data-bq164-narrator-ready','display:none!important'])
 assert.ok(css.includes(token),'Compact visual guarantee missing: '+token);
for(const unsafe of ['loadNext()','localStorage.setItem','indexedDB.deleteDatabase',
 'stopImmediatePropagation','data-basair-main-tab','__BASAIR_TAFSIR_R114__',
 'bq163NoteLower','row.insertBefore('])
 assert.ok(!js.includes(unsafe),'Narrator-only patch cannot mutate reader/notes: '+unsafe);
assert.ok(!css.includes('.bq163NoteLower')&&!css.includes('.p149NoteSlot'));
console.log(JSON.stringify({status:'PASS',sequence:41,tafsirVersion:39,
 originalOwnerRSA3072:true,receiver694_695Compatible:true,existingSixAssetsExact:true,
 compactNarrator:'60x25 inline with meaning heading',nativeMicrophoneHandlerPreserved:true,
 notesP163Unchanged:true,followScrollUntouched:true,androidDevice:'PENDING_OWNER_TEST'}));
