'use strict';
/* QA gate for owner V694/V695 receiver compatibility, no Android/WWW changes.
 * Local field reproduction used exact verifyEnvelope() from the owner's
 * signed V694 APK (only the fetch URL was excluded from source extraction).
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),
 crypto=require('node:crypto'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const original=read('p121/owner-qa/release-p158-seq35-before-p159-20261114.json');
const staged=read('p159/P159-SEQ36-OWNER-SIGNED-RELEASE.json');
assert.deepEqual(original,read('p158/P158-SEQ35-OWNER-SIGNED-RELEASE.json'),
 'Rollback signed Seq35 must be byte-exact');
assert.deepEqual(staged,read('p121/owner-qa/release.json'),
 'Seq36 active manifest in PR must be exact owner signed bytes');
const source=read('p146/tests/test-p146-signed-release.cjs').toString();
const pubMatch=source.match(/const pub='([A-Za-z0-9+/=]+)'/);
assert.ok(pubMatch,'Original OTA public verification key missing');
const pub={key:Buffer.from(pubMatch[1],'base64'),format:'der',type:'spki'};
function verify(b){
 const e=JSON.parse(b.toString()),data=Buffer.from(e.payload,'base64'),
   sig=Buffer.from(e.signature,'base64');
 assert.equal(sig.length,384);
 assert.ok(crypto.verify('RSA-SHA256',data,pub,sig),'Original-owner RSA signature invalid');
 return JSON.parse(data.toString('utf8'));
}
const p158=verify(original),p159=verify(staged);
assert.equal(p158.sequence,35);assert.equal(p158.minAppVersion,695);
assert.equal(p159.sequence,36);assert.equal(p159.minAppVersion,694);
assert.equal(p159.modules[0].version,34);
assert.equal(p159.schema,'basair-universal-ota-v1');
assert.equal(p159.channel,'owner-qa');
assert.equal(p159.applicationId,'app.basair.qurv2');
assert.equal(p159.deliveryMode,'automatic');
assert.match(p159.id,/^[A-Za-z0-9-]{1,70}$/);
assert.ok(Date.parse(p159.issuedAt)<=Date.now()+300000);
assert.ok(Date.parse(p159.expiresAt)>Date.now());
assert.equal(p159.modules.length,1);
assert.equal(p159.modules[0].id,'tafsir');
assert.equal(p159.modules[0].assets.length,4);
assert.deepEqual(p159.modules[0].assets,p158.modules[0].assets,
 'Only receiver compatibility (and version/sequence) may change; do not touch assets');
for(const item of p159.modules[0].assets){
 assert.match(item.path,/^modules\/tafsir\/[a-zA-Z0-9._/-]+\.(css|js)$/);
 assert.equal(item.kind,item.path.split('.').pop());
 const data=read('p121/owner-qa/'+item.path);
 assert.equal(data.length,item.size,'Byte count mismatched '+item.path);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),item.sha256);
 if(item.kind==='js')new vm.Script(data.toString('utf8'),{filename:item.path});
}
assert.equal(p159.modules.some(m=>['tilawa','shared','navigation','reciters'].includes(m.id)),false);
console.log(JSON.stringify({status:'PASS',originalV694ReceiverCompatible:true,
 originalOwnerRSASignature:'VERIFIED',previousSeq35Receiver694:'REJECTED',
 fixedSeq36Receiver694:'ACCEPTED',fixedSeq36Receiver695:'ACCEPTED',
 identicalTafsirAssets:true,protectedModules:'UNCHANGED',
 signedRelease:'Seq36 Tafsir v34',handsetV695:'NOT_TESTED'}));
