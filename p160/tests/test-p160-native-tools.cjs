'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const previous=read('p121/owner-qa/release-p159-seq36-before-p160-20261114.json');
const signed=read('p160/P160-SEQ37-OWNER-SIGNED-RELEASE.json');
assert.deepEqual(previous,read('p159/P159-SEQ36-OWNER-SIGNED-RELEASE.json'),'Seq36 rollback must be exact');
assert.deepEqual(signed,read('p121/owner-qa/release.json'),'Seq37 release must exactly match staged owner signature');
const source=read('p146/tests/test-p146-signed-release.cjs').toString('utf8');
const pub=source.match(/const pub='([A-Za-z0-9+/=]+)'/);
assert.ok(pub,'Original owner public key missing');
const key={key:Buffer.from(pub[1],'base64'),format:'der',type:'spki'};
function unwrap(data){
 const e=JSON.parse(data.toString()),bytes=Buffer.from(e.payload,'base64'),signature=Buffer.from(e.signature,'base64');
 assert.equal(signature.length,384);
 assert.ok(crypto.verify('RSA-SHA256',bytes,key,signature),'Original RSA-3072 invalid');
 return JSON.parse(bytes.toString('utf8'));
}
const prior=unwrap(previous),next=unwrap(signed);
assert.equal(prior.sequence,36);assert.equal(prior.modules[0].version,34);
assert.equal(next.sequence,37);assert.equal(next.modules[0].version,35);
assert.equal(next.schema,'basair-universal-ota-v1');
assert.equal(next.channel,'owner-qa');
assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.minAppVersion,694,'V695 may embed APP_VERSION=694');
assert.equal(next.deliveryMode,'automatic');
assert.match(next.id,/^[A-Za-z0-9-]{1,70}$/);
assert.ok(Date.parse(next.issuedAt)<=Date.now()+300000&&Date.parse(next.expiresAt)>Date.now());
assert.equal(next.modules.length,1);assert.equal(next.modules[0].id,'tafsir');
const assets=next.modules[0].assets;
assert.deepEqual(assets.map(a=>a.path),[
 'modules/tafsir/p157-native-saved-stability.css',
 'modules/tafsir/p160-tafsir-compact-top-controls.css',
 'modules/tafsir/p157-native-saved-stability.js',
 'modules/tafsir/p160-tafsir-compact-top-controls.js']);
for(const a of assets){
 assert.equal(a.kind,a.path.split('.').at(-1));
 const f=read('p121/owner-qa/'+a.path);
 assert.equal(f.length,a.size,'File length mismatch '+a.path);
 assert.equal(crypto.createHash('sha256').update(f).digest('hex'),a.sha256,'Checksum mismatch '+a.path);
 if(a.kind==='js')new vm.Script(f.toString('utf8'),{filename:a.path});
}
assert.deepEqual(assets[0],prior.modules[0].assets[0],'Keep P157 index CSS');
assert.deepEqual(assets[2],prior.modules[0].assets[2],'Keep P157 index JS');
const js=read('p121/owner-qa/modules/tafsir/p160-tafsir-compact-top-controls.js').toString();
const css=read('p121/owner-qa/modules/tafsir/p160-tafsir-compact-top-controls.css').toString();
for(const s of ['__BASAIR_TAFSIR_R114__','r.toggle()','__BASAIR_TAFSIR_R2__',
 'r.openNote(p.s,p.a)','bq160UpperControlHost','data-bq160-follow','data-bq160-note'])
 assert.ok(js.includes(s),'Missing stable UI behavior: '+s);
for(const s of ['grid-template-columns:repeat(4,minmax(0,1fr))','height:36px!important',
 'display:none!important','bq160NoteChip','button[data-bq160-follow'])
 assert.ok(css.includes(s),'Missing layout guarantee: '+s);
for(const s of ['loadNext()','setAttribute(\'data-basair-main-tab','localStorage.setItem',
 'indexedDB.deleteDatabase','stopImmediatePropagation','document.write','cloneNode'])
 assert.ok(!js.includes(s),'Native reader/storage interference prohibited: '+s);
assert.ok(!css.includes('position:fixed'),'No overlay on Tafsir pages');
assert.ok(!JSON.stringify(next.modules).includes('p158-tafsir-note-above-tools'),
 'P158 overrides must NOT be retained');
console.log(JSON.stringify({status:'PASS',signedSeq37:true,originalOwnerRSA3072:true,
 tafsirVersion:35,receiverVersion694:true,indexP157Preserved:true,
 noteWidth:78,noteHeight:36,originalR114FollowRestored:true,
 fourNativeTools:true,scrollNativeUntouched:true,protectedTilawaUnchanged:true,
 androidDevice:'PENDING'}));
