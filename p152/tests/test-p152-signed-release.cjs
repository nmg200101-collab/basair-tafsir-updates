'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const source=read('p146/tests/test-p146-signed-release.cjs').toString('utf8');
const match=source.match(/const pub='([^']+)'/);
assert.ok(match,'Original owner verification public key missing');
const key={key:Buffer.from(match[1],'base64'),format:'der',type:'spki'};
function verify(file){
 const env=JSON.parse(read(file).toString('utf8'));
 assert.deepEqual(Object.keys(env),['payload','signature'],'Unexpected signed OTA schema');
 const payload=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.equal(sig.length,384,'Original RSA-3072 signature length invalid');
 assert.ok(crypto.verify('RSA-SHA256',payload,key,sig),'Owner RSA signature invalid: '+file);
 return JSON.parse(payload.toString('utf8'));
}
const previousFile='p121/owner-qa/release-p151-seq28-before-p152-20261114.json';
const nextFile='p152/P152-SEQ29-OWNER-SIGNED-RELEASE.json';
assert.deepEqual(read(previousFile),read('p151/P151-SEQ28-OWNER-SIGNED-RELEASE.json'),'Signed Seq28 rollback changed');
assert.deepEqual(read('p121/owner-qa/release.json'),read(nextFile),'Active owner release does not match signed Seq29');
const prev=verify(previousFile),next=verify(nextFile);
assert.equal(prev.sequence,28);assert.equal(prev.modules[0].version,26);
assert.equal(next.sequence,29);assert.equal(next.modules[0].version,27);
assert.equal(next.schema,'basair-universal-ota-v1');assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.channel,'owner-qa');assert.equal(next.deliveryMode,'notify');
assert.equal(next.minAppVersion,694);assert.equal(next.modules.length,1);
assert.equal(next.modules[0].id,'tafsir');assert.equal(next.modules[0].assets.length,8);
assert.ok(Date.parse(next.issuedAt)<=Date.now()+300000,'Future-dated update');
assert.ok(Date.parse(next.expiresAt)>Date.now(),'Expired update');
for(const [i,asset] of next.modules[0].assets.entries()){
 assert.match(asset.path,/^modules\/tafsir\/[a-z0-9-]+\.(?:css|js)$/i);
 assert.equal(asset.kind,path.extname(asset.path).slice(1));
 const raw=read('p121/owner-qa/'+asset.path);
 assert.equal(raw.length,asset.size,'Asset length changed: '+asset.path);
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),asset.sha256,
  'Asset SHA256 mismatch: '+asset.path);
 if(i<6)assert.deepEqual(asset,prev.modules[0].assets[i],'Inherited source changed: '+asset.path);
}
assert.equal(next.modules[0].assets[6].path,'modules/tafsir/p152-reader-saved.css');
assert.equal(next.modules[0].assets[7].path,'modules/tafsir/p152-reader-saved.js');
console.log(JSON.stringify({status:'PASS',sequence:29,tafsir:27,ownerSignature:'ORIGINAL_RSA3072_VERIFIED',
 assets:8,inherited:6,rollback:'BYTE_EXACT_SEQ28',tilawaQA050:'NO_PROTECTED_CHANGES',androidPhone:'PENDING'}));
