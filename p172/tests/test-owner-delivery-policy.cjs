'use strict';
/* P172 dual delivery mode: no release publication, no private keys. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),
 os=require('node:os'),crypto=require('node:crypto');
const mod=require('../tools/owner-delivery-policy.cjs');
const ROOT=path.resolve(__dirname,'../..');
const live=path.join(ROOT,'p121/owner-qa/release.json');
const archivedManual=path.join(ROOT,'p121/owner-qa/release-p130-seq7-before-p131-20261111.json');
const liveCopy=fs.readFileSync(live);
function bad(fn,part){assert.throws(fn,e=>!part||String(e.message).includes(part))}
assert.deepEqual(mod.MODE,{manual:'notify',automatic:'automatic'});
const manual=mod.signedEnvelope(archivedManual);
const automatic=mod.signedEnvelope(live);
assert.equal(manual.sequence,7);
assert.equal(manual.deliveryMode,'notify');
assert.equal(automatic.sequence,47);
assert.equal(automatic.deliveryMode,'automatic');
mod.assertChoice(manual,'manual');
mod.assertChoice(automatic,'automatic');
bad(()=>mod.assertChoice(manual,'automatic'),'Signed deliveryMode');
bad(()=>mod.assertChoice(automatic,'manual'),'Signed deliveryMode');
assert.equal(mod.verifyCandidate(automatic,'automatic',manual),14,'14 active OTA assets checked');
bad(()=>mod.verifyCandidate(manual,'manual',automatic),'strictly exceed');
bad(()=>mod.metadata({...manual,modules:[{...manual.modules[0],id:'tilawa'}]}),'Protected');
bad(()=>mod.metadata({...manual,modules:[{...manual.modules[0],assets:[
 {...manual.modules[0].assets[0],path:'modules/tafsir/../../attack.js'}]}]}),'Unsafe');
bad(()=>mod.argsParse(['prepare','--input','x.json','--out','y.json']),'Choose');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'basair-p172-'));
try{
 const draft=path.join(temp,'unsigned.json'),input=path.join(temp,'input.json');
 const payload=structuredClone(automatic);
 payload.sequence=48;
 payload.modules[0].version=46;
 payload.id='P172-TEST-UNSIGNED-SEQ48';
 fs.writeFileSync(input,JSON.stringify(payload));
 const out=mod.plan({mode:'manual',input,out:draft});
 assert.equal(out.signedDeliveryMode,'notify');
 assert.equal(JSON.parse(fs.readFileSync(draft,'utf8')).deliveryMode,'notify');
 assert.deepEqual(fs.readFileSync(live),liveCopy,'Live signed release must never change');
 bad(()=>mod.plan({mode:'automatic',input,out:draft}),'EEXIST');
 bad(()=>mod.plan({mode:'manual',input,out:live}),'Refusing');
 bad(()=>mod.plan({mode:'manual',input:live,out:path.join(temp,'bad.json')}),'Do not edit signed');
}finally{fs.rmSync(temp,{recursive:true,force:true})}
const tampered=JSON.parse(liveCopy.toString());
const orig=Buffer.from(tampered.payload,'base64');
const m=JSON.parse(orig.toString());m.deliveryMode='notify';
tampered.payload=Buffer.from(JSON.stringify(m)).toString('base64');
const forged=path.join(os.tmpdir(),'basair-p172-signature-'+process.pid+'.json');
try{
 fs.writeFileSync(forged,JSON.stringify(tampered));
 bad(()=>mod.signedEnvelope(forged),'signature invalid');
}finally{try{fs.rmSync(forged)}catch(_){}}
console.log(JSON.stringify({status:'PASS',historicalManualNotifySeq7:true,activeAutoSeq47:true,
    originalOwnerRSA3072Verified:true,activeAssetsSHA256Verified:14,
    noConsentFetchInManualMode:'HISTORICAL_RECEIVER_TEST_ONLY',
    noProtectedModuleChanges:true,modeSelectionRequired:true,immutableSignedDeliveryMode:true,
    liveSeq47Unchanged:true,privateKeyUsed:false,publication:false}));
