'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p));
const env=(buf)=>JSON.parse(buf.toString('utf8'));
const old=read('p121/owner-qa/release-p157-seq34-before-p158-20261114.json');
const signed=read('p158/P158-SEQ35-OWNER-SIGNED-RELEASE.json');
const active=read('p121/owner-qa/release.json');
assert.ok(active.equals(old)||active.equals(signed),'Only P157 signed Seq34 or P158 signed Seq35 may be active');
assert.deepEqual(old,read('p157/P157-SEQ34-OWNER-SIGNED-RELEASE.json'),'P157 rollback must be byte identical');
const pubBase64=read('p146/tests/test-p146-signed-release.cjs').toString().match(/const pub='([^']+)'/);
assert.ok(pubBase64,'Original owner OTA verifier missing');
const pub={key:Buffer.from(pubBase64[1],'base64'),format:'der',type:'spki'};
const verify=buf=>{
 const release=env(buf),payload=Buffer.from(release.payload,'base64');
 assert.equal(Buffer.from(release.signature,'base64').length,384);
 assert.ok(crypto.verify('RSA-SHA256',payload,pub,Buffer.from(release.signature,'base64')),
  'Original RSA-3072 owner signature mismatch');
 return JSON.parse(payload.toString('utf8'));
};
const p157=verify(old),p158=verify(signed);
assert.equal(p157.sequence,34);assert.equal(p157.modules[0].version,32);
assert.equal(p158.sequence,35);assert.equal(p158.modules[0].version,33);
assert.equal(p158.applicationId,'app.basair.qurv2');
assert.equal(p158.minAppVersion,695);
assert.equal(p158.channel,'owner-qa');
assert.equal(p158.modules.length,1);assert.equal(p158.modules[0].id,'tafsir');
assert.ok(Date.parse(p158.expiresAt)>Date.now());
const assets=p158.modules[0].assets;
assert.equal(assets.length,4);
assert.deepEqual(assets.map(x=>x.path),[
 'modules/tafsir/p157-native-saved-stability.css',
 'modules/tafsir/p158-tafsir-note-above-tools.css',
 'modules/tafsir/p157-native-saved-stability.js',
 'modules/tafsir/p158-tafsir-note-above-tools.js']);
for(const asset of assets){
 const f=read('p121/owner-qa/'+asset.path);
 assert.equal(f.length,asset.size,'Byte length wrong: '+asset.path);
 assert.equal(crypto.createHash('sha256').update(f).digest('hex'),asset.sha256,
  'Checksum incorrect: '+asset.path);
}
const js=read('p121/owner-qa/modules/tafsir/p158-tafsir-note-above-tools.js').toString('utf8');
const css=read('p121/owner-qa/modules/tafsir/p158-tafsir-note-above-tools.css').toString('utf8');
new vm.Script(js,{filename:'p158-tafsir-note-above-tools.js'});
assert.ok(js.includes('__BASAIR_TAFSIR_P158_NOTE_PLACEMENT__'));
assert.ok(js.includes('__BASAIR_TAFSIR_R2__')&&js.includes('r2.openNote(p.s,p.a)'));
assert.ok(js.includes('.p146TopMic,.p145TopControls'));
assert.ok(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'));
assert.ok(css.includes('.basairB231AyahActions > button[data-r2-action="note"]'));
assert.ok(css.includes('data-bq158-note-ready'));
for(const x of ['data-basair-main-tab','loadNext()', 'localStorage.setItem',
 'indexedDB.deleteDatabase','stopImmediatePropagation','cloneNode','setInterval(','document.write'])
 assert.ok(!js.includes(x),'Unsafe reader/storage API in P158: '+x);
assert.ok(!css.includes('position:fixed')&&!css.includes('pointer-events:none'));
const baseline=p157.modules[0].assets;
assert.equal(assets[0].sha256,baseline[0].sha256);
assert.equal(assets[2].sha256,baseline[1].sha256);
console.log(JSON.stringify({status:'PASS',signedSequence:35,tafsirVersion:33,
 previousSignedReleaseVerified:true,sourceScriptVerified:true,carryP157Index:true,
 onlyFourNativeBottomTools:true,nativeR2NotesPreserved:true,
 bodyScrollingUntouched:true,androidOnDevice:'PENDING_OWNER_TEST'}));
