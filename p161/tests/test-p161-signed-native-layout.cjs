'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const backup=read('p121/owner-qa/release-p160-seq37-before-p161-20261114.json');
const signed=read('p161/P161-SEQ38-OWNER-SIGNED-RELEASE.json');
assert.deepEqual(backup,read('p160/P160-SEQ37-OWNER-SIGNED-RELEASE.json'),'Exact signed Seq37 backup is missing or modified');
assert.deepEqual(signed,read('p121/owner-qa/release.json'),'Branch active release must match signed Seq38 exactly');
const source=read('p146/tests/test-p146-signed-release.cjs').toString('utf8').match(/const pub='([A-Za-z0-9+/=]+)'/);
assert.ok(source,'Original OTA public verifier missing');
const key={key:Buffer.from(source[1],'base64'),format:'der',type:'spki'};
function unwrap(blob){
 const e=JSON.parse(blob.toString()),payload=Buffer.from(e.payload,'base64'),signature=Buffer.from(e.signature,'base64');
 assert.equal(signature.length,384);
 assert.ok(crypto.verify('RSA-SHA256',payload,key,signature),'Original RSA-3072 verification failed');
 return JSON.parse(payload.toString());
}
const old=unwrap(backup),next=unwrap(signed);
assert.equal(old.sequence,37);assert.equal(old.modules[0].version,35);
assert.equal(next.sequence,38);assert.equal(next.modules[0].version,36);
assert.equal(next.applicationId,'app.basair.qurv2');assert.equal(next.channel,'owner-qa');
assert.equal(next.schema,'basair-universal-ota-v1');assert.equal(next.deliveryMode,'automatic');
assert.equal(next.minAppVersion,694,'V695 may have V694 receiver constant, must remain compatible');
assert.match(next.id,/^[A-Za-z0-9-]{1,70}$/);
assert.ok(Date.parse(next.issuedAt)<Date.now()+300000&&Date.parse(next.expiresAt)>Date.now());
assert.equal(next.modules.length,1);assert.equal(next.modules[0].id,'tafsir');
const assets=next.modules[0].assets;
assert.deepEqual(assets.map(a=>a.path),[
 'modules/tafsir/p157-native-saved-stability.css',
 'modules/tafsir/p161-tafsir-single-narrator-bottom-note.css',
 'modules/tafsir/p157-native-saved-stability.js',
 'modules/tafsir/p161-tafsir-single-narrator-bottom-note.js']);
assert.deepEqual(assets[0],old.modules[0].assets[0],'P157 index CSS should be identical');
assert.deepEqual(assets[2],old.modules[0].assets[2],'P157 index JS should be identical');
for(const a of assets){
 assert.equal(a.kind,a.path.split('.').at(-1));
 const contents=read('p121/owner-qa/'+a.path);
 assert.equal(a.size,contents.length,'File size wrong: '+a.path);
 assert.equal(a.sha256,crypto.createHash('sha256').update(contents).digest('hex'),'SHA256 wrong: '+a.path);
 if(a.kind==='js')new vm.Script(contents.toString('utf8'));
}
const js=read('p121/owner-qa/modules/tafsir/p161-tafsir-single-narrator-bottom-note.js').toString();
const css=read('p121/owner-qa/modules/tafsir/p161-tafsir-single-narrator-bottom-note.css').toString();
for(const symbol of ['.bq161NarratorTop','p144MicButton','originalNote(row)',
 'button.b263r3NoteChip','__BASAIR_TAFSIR_R114__','r.toggle()','data-bq161-follow'])
 assert.ok(js.includes(symbol),'Missing required UI invariant '+symbol);
assert.ok(!js.includes("createElement('button');chip"),'Never create a second native note');
assert.ok(!js.includes('bq160NoteChip')&&!js.includes('bq158NoteChip'),'Never duplicate upper notes');
assert.ok(css.includes('button.b263r3NoteChip:not([hidden])'),'Original lower note must be shown');
assert.ok(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),'Four native tools must remain');
for(const dangerous of ['loadNext()','setAttribute(\'data-basair-main-tab','localStorage.setItem',
 'indexedDB.deleteDatabase','stopImmediatePropagation','document.write','cloneNode'])
 assert.ok(!js.includes(dangerous),'Forbidden reader/storage mutation: '+dangerous);
assert.equal(next.modules.some(m=>['tilawa','shared','navigation','reciters'].includes(m.id)),false);
console.log(JSON.stringify({status:'PASS',sequence:38,tafsirVersion:36,originalOwnerRSA3072:true,
 receiver694Compatible:true,identicalP157Index:true,
 narratorOriginalOneTop:true,noteOriginalOneBottom:true,nativeFourTools:true,
 protectedModulesUntouched:true,fieldAndroid:'PENDING_OWNER_TEST'}));
