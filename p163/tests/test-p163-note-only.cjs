'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const prev=read('p121/owner-qa/release-p162-seq39-before-p163-20261114.json');
const signed=read('p163/P163-SEQ40-OWNER-SIGNED-RELEASE.json');
const active=read('p121/owner-qa/release.json');
assert.deepEqual(prev,read('p162/P162-SEQ39-OWNER-SIGNED-RELEASE.json'),'Exact Seq39 rollback required');
assert.deepEqual(signed,active,'Active branch must be original owner signed Seq40 bytes');
const pubBase64=(read('p146/tests/test-p146-signed-release.cjs').toString().match(/const pub='([^']+)'/)||[])[1];
assert.ok(pubBase64);
const key={key:Buffer.from(pubBase64,'base64'),format:'der',type:'spki'};
function unpack(raw){
 const e=JSON.parse(raw.toString()),payload=Buffer.from(e.payload,'base64'),sig=Buffer.from(e.signature,'base64');
 assert.equal(sig.length,384);
 assert.ok(crypto.verify('RSA-SHA256',payload,key,sig),'Original OTA owner signature invalid');
 return JSON.parse(payload.toString());
}
const old=unpack(prev),n=unpack(signed);
assert.equal(old.sequence,39);assert.equal(old.modules[0].version,37);
assert.equal(n.sequence,40);assert.equal(n.modules[0].version,38);
assert.equal(n.schema,'basair-universal-ota-v1');
assert.equal(n.channel,'owner-qa');assert.equal(n.applicationId,'app.basair.qurv2');
assert.equal(n.deliveryMode,'automatic');assert.equal(n.minAppVersion,694);
assert.ok(Date.parse(n.expiresAt)>Date.now());
assert.equal(n.modules.length,1);assert.equal(n.modules[0].id,'tafsir');
const items=n.modules[0].assets;
assert.deepEqual(items.map(x=>x.path),[
 'modules/tafsir/p157-native-saved-stability.css',
 'modules/tafsir/p162-tafsir-stable-anchors.css',
 'modules/tafsir/p163-tafsir-note-fixed-bottom.css',
 'modules/tafsir/p157-native-saved-stability.js',
 'modules/tafsir/p162-tafsir-stable-anchors.js',
 'modules/tafsir/p163-tafsir-note-fixed-bottom.js']);
assert.deepEqual(items[0],old.modules[0].assets[0]);
assert.deepEqual(items[1],old.modules[0].assets[1]);
assert.deepEqual(items[3],old.modules[0].assets[2]);
assert.deepEqual(items[4],old.modules[0].assets[3]);
for(const a of items){
 const file=read('p121/owner-qa/'+a.path);
 assert.equal(a.kind,a.path.split('.').at(-1));
 assert.equal(file.length,a.size,'Incorrect asset bytes '+a.path);
 assert.equal(crypto.createHash('sha256').update(file).digest('hex'),a.sha256,'Bad SHA256 '+a.path);
 if(a.kind==='js')new vm.Script(file.toString(),{filename:a.path});
}
const js=read('p121/owner-qa/modules/tafsir/p163-tafsir-note-fixed-bottom.js').toString();
const css=read('p121/owner-qa/modules/tafsir/p163-tafsir-note-fixed-bottom.css').toString();
for(const required of ['bq163NoteLower','data-bq163-note','R2__','r.openNote(p.s,p.a)',
  'row.insertBefore(slot,bar)','row.appendChild(slot)','data-bq163-note-ready'])
 assert.ok(js.includes(required),required);
for(const required of ['width:82px!important','height:34px!important',
 '.p149NoteSlot','data-bq163-note-ready','grid-row:1!important'])
 assert.ok(css.includes(required),required);
for(const forbidden of ['p144MicButton','p146TopMic','__BASAIR_TAFSIR_R114__','loadNext()',
  'data-basair-main-tab','localStorage.setItem','indexedDB.deleteDatabase','stopImmediatePropagation','cloneNode'])
 assert.ok(!js.includes(forbidden),'P163 may NOT modify any narrator/follow/scroll/storage feature: '+forbidden);
assert.ok(!css.includes('.p144MicButton')&&!css.includes('.p146TopMic'));
assert.ok(!JSON.stringify(n).includes('p161-tafsir-single-narrator-bottom-note'));
console.log(JSON.stringify({status:'PASS',signedSeq40:true,ownerRSA3072:true,notesOnly:true,
 oldP162AssetsExact:true,noteWidthPx:82,noteHeightPx:34,independentOfTools:true,
 userDataPreserved:true,otherFeaturesUnchanged:true,androidWebView:'OWNER_TEST_PENDING'}));
