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
assert.equal(mod.verifyAssets(automatic),14,'14 current signed OTA assets checked');
bad(()=>mod.verifyCandidate(automatic,'automatic',manual),'Protected active asset changed or removed');
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
 assert.equal(out.assetsVerified,14,'Unsigned plan must validate all actual file hashes before signing');
 const unsafe=structuredClone(payload);
 unsafe.modules[0].assets[0].sha256='0'.repeat(64);
 const unsafeFile=path.join(temp,'invalid-hash.json'),unsafeOut=path.join(temp,'rejected-hash.json');
 fs.writeFileSync(unsafeFile,JSON.stringify(unsafe));
 bad(()=>mod.plan({mode:'manual',input:unsafeFile,out:unsafeOut}),'size/SHA-256 mismatch');
 assert.equal(fs.existsSync(unsafeOut),false,'Must not write draft with invalid asset hash');
 const stale=structuredClone(payload);
 stale.modules[0].version=automatic.modules[0].version;
 const staleFile=path.join(temp,'old-version.json'),staleOut=path.join(temp,'rejected-version.json');
 fs.writeFileSync(staleFile,JSON.stringify(stale));
 bad(()=>mod.plan({mode:'manual',input:staleFile,out:staleOut}),'New version required');
 assert.equal(fs.existsSync(staleOut),false,'Must not write draft with old module version');
 const missing=structuredClone(payload);
 missing.modules[0].assets=missing.modules[0].assets.slice(1);
 const missingFile=path.join(temp,'missing-active-asset.json');
 const missingOut=path.join(temp,'rejected-missing-active-asset.json');
 fs.writeFileSync(missingFile,JSON.stringify(missing));
 bad(()=>mod.plan({mode:'manual',input:missingFile,out:missingOut}),'Protected active asset changed or removed');
 assert.equal(fs.existsSync(missingOut),false,'Must not drop stable active assets');
 const expired=structuredClone(payload);
 expired.expiresAt='2026-11-15T09:00:01Z';
 const expiredFile=path.join(temp,'expired.json'),expiredOut=path.join(temp,'rejected-expired.json');
 fs.writeFileSync(expiredFile,JSON.stringify(expired));
 bad(()=>mod.plan({mode:'automatic',input:expiredFile,out:expiredOut}),'already expired');
 assert.equal(fs.existsSync(expiredOut),false,'Must not write expired draft');
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
    liveSeq47Unchanged:true,preSignHashGuard:true,preSignVersionGuard:true,protectedExistingAssetsGuard:true,expiredDraftBlocked:true,
    privateKeyUsed:false,publication:false}));
