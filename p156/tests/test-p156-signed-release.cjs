'use strict';
/* P156 owner-signed release gate: run ONLY after offline signing and staging,
   NEVER as a substitute for signing or the physical Android QA. */
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p));
const source=read('p146/tests/test-p146-signed-release.cjs').toString('utf8');
const found=source.match(/const pub='([A-Za-z0-9+/=]+)'/);
assert.ok(found,'Original OTA owner public verifier missing');
const pub={key:Buffer.from(found[1],'base64'),format:'der',type:'spki'};
const old=read('p121/owner-qa/release-p155-seq32-before-p156-20261114.json');
assert.deepEqual(old,read('p155/P155-SEQ32-OWNER-SIGNED-RELEASE.json'),'Rollback original Seq32 changed');
const envelope=read('p156/P156-SEQ33-OWNER-SIGNED-RELEASE.json');
assert.deepEqual(envelope,read('p121/owner-qa/release.json'),'Active release must be signed P156');
function verify(b){
 const env=JSON.parse(b.toString('utf8'));
 const data=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.equal(sig.length,384);
 assert.ok(crypto.verify('RSA-SHA256',data,pub,sig),'Invalid original owner signature');
 return JSON.parse(data.toString('utf8'));
}
const prev=verify(old),next=verify(envelope);
assert.equal(prev.sequence,32);assert.equal(prev.modules[0].version,30);
assert.equal(next.sequence,33);assert.equal(next.modules[0].version,31);
assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.channel,'owner-qa');
assert.equal(next.deliveryMode,'automatic');
assert.equal(next.minAppVersion,695);
assert.equal(next.modules.length,1);
assert.equal(next.modules[0].id,'tafsir');
assert.equal(next.modules[0].assets.length,2);
assert.ok(Date.parse(next.issuedAt)<=Date.now()+300000);
assert.ok(Date.parse(next.expiresAt)>Date.now());
const candidate=JSON.parse(read('p156/P156-SEQ33-UNSIGNED-CANDIDATE.json'));
assert.ok(candidate.ownerApprovalRecorded&&candidate.publishAuthorization);
for(const [i,a] of next.modules[0].assets.entries()){
 assert.deepEqual(a,candidate.proposedPayload.modules[0].assets[i]);
 assert.match(a.path,/^modules\/tafsir\/p156-tafsir-recovery\.(?:js|css)$/);
 const raw=read('p121/owner-qa/'+a.path);
 assert.equal(raw.length,a.size);
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),a.sha256);
}
assert.equal(next.modules.some(x=>x.id==='tilawa'),false);
console.log(JSON.stringify({status:'PASS',originalOwnerSignature:'RSA3072_VERIFIED',
 activeRelease:'SEQ33',moduleVersion:31,protectedTilawa:'UNCHANGED',
 rollback:'SIGNED_SEQ32_BYTE_EXACT',android:'PENDING_OWNER_HANDSET'}));
