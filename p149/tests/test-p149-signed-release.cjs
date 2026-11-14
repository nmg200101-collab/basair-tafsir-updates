'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p));
const trusted=read('p146/tests/test-p146-signed-release.cjs').toString('utf8').match(/const pub='([^']+)'/);
assert.ok(trusted,'Trusted owner's OTA verification key not found');
const pub={key:Buffer.from(trusted[1],'base64'),format:'der',type:'spki'};
function verify(file){
 const env=JSON.parse(read(file).toString('utf8'));
 assert.deepEqual(Object.keys(env),['payload','signature'],'Unexpected envelope schema');
 const raw=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.equal(sig.length,384,'Owner RSA-3072 signature must be exactly 384 bytes');
 assert.ok(crypto.verify('RSA-SHA256',raw,pub,sig),'Signature invalid: '+file);
 return JSON.parse(raw.toString('utf8'));
}
const old='p121/owner-qa/release-p148-seq25-before-p149-20261114.json';
const staged='p149/P149-SEQ26-OWNER-SIGNED-RELEASE.json';
const live='p121/owner-qa/release.json';
assert.deepEqual(read(old),read('p148/P148-SEQ25-OWNER-SIGNED-RELEASE.json'),'Signed Seq25 rollback changed');
assert.deepEqual(read(staged),read(live),'Active release must equal signed Seq26 envelope exactly');
const baseline=verify(old),next=verify(staged);
assert.equal(baseline.sequence,25);
assert.equal(baseline.modules[0].version,23);
assert.equal(next.sequence,26);
assert.equal(next.modules.length,1);
assert.equal(next.modules[0].id,'tafsir');
assert.equal(next.modules[0].version,24);
assert.equal(next.schema,'basair-universal-ota-v1');
assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.channel,'owner-qa');
assert.equal(next.deliveryMode,'notify');
assert.equal(next.minAppVersion,694);
assert.match(next.id,/^[A-Za-z0-9-]{1,70}$/);
assert.ok(Date.parse(next.issuedAt)<=Date.now()+300000,'Release issued in the future');
assert.ok(Date.parse(next.expiresAt)>Date.now(),'OTA release expired');
assert.equal(next.modules[0].assets.length,8);
for(const [i,asset] of next.modules[0].assets.entries()){
 assert.match(asset.path,/^modules\/tafsir\/[a-z0-9-]+\.(?:css|js)$/i);
 assert.equal(path.extname(asset.path).slice(1),asset.kind);
 const data=read('p121/owner-qa/'+asset.path);
 assert.equal(data.length,asset.size,'Asset size mismatch: '+asset.path);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),asset.sha256,'SHA256 mismatch: '+asset.path);
 if(i<6)assert.deepEqual(asset,baseline.modules[0].assets[i],'Unchanged inherited asset unexpectedly modified');
}
assert.equal(next.modules[0].assets[6].path,'modules/tafsir/p149-reader-polish.css');
assert.equal(next.modules[0].assets[7].path,'modules/tafsir/p149-reader-polish.js');
console.log(JSON.stringify({status:'PASS',sequence:26,tafsirVersion:24,signature:'ORIGINAL_RSA3072_VERIFIED',
 assets:8,inherited:6,rollback:'BYTE_EXACT',qa050:'NOT_MODIFIED',device:'NOT_TESTED'}));
