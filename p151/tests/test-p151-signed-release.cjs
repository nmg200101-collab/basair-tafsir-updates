'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const trusted=read('p146/tests/test-p146-signed-release.cjs').toString('utf8').match(/const pub='([^']+)'/);
assert.ok(trusted,'Original OTA verification public key must be present');
const key={key:Buffer.from(trusted[1],'base64'),format:'der',type:'spki'};
function signed(file){
 const env=JSON.parse(read(file).toString('utf8'));
 assert.deepEqual(Object.keys(env),['payload','signature'],'Unexpected release envelope');
 const bytes=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.equal(sig.length,384,'Original RSA3072 signature length invalid');
 assert.ok(crypto.verify('RSA-SHA256',bytes,key,sig),'Original owner signature verification failed: '+file);
 return JSON.parse(bytes.toString('utf8'));
}
const backup='p121/owner-qa/release-p150-seq27-before-p151-20261114.json';
const current='p121/owner-qa/release.json';
const signedRelease='p151/P151-SEQ28-OWNER-SIGNED-RELEASE.json';
assert.deepEqual(read(backup),read('p150/P150-SEQ27-OWNER-SIGNED-RELEASE.json'),
 'Signed Seq27 rollback must remain exact');
assert.deepEqual(read(current),read(signedRelease),'Live manifest must equal original owner-signed Seq28 exactly');
const prev=signed(backup),next=signed(signedRelease);
assert.equal(prev.sequence,27);assert.equal(prev.modules[0].version,25);
assert.equal(next.sequence,28);assert.equal(next.modules[0].version,26);
assert.equal(next.schema,'basair-universal-ota-v1');
assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.channel,'owner-qa');assert.equal(next.deliveryMode,'notify');
assert.equal(next.minAppVersion,694);
assert.ok(Date.parse(next.issuedAt)<=Date.now()+300000,'Future dated OTA rejected by receiver');
assert.ok(Date.parse(next.expiresAt)>Date.now(),'Expired OTA');
assert.equal(next.modules.length,1);
assert.equal(next.modules[0].id,'tafsir');
assert.equal(next.modules[0].assets.length,8);
for(const [i,a] of next.modules[0].assets.entries()){
 assert.match(a.path,/^modules\/tafsir\/[a-z0-9-]+\.(js|css)$/i);
 assert.equal(a.kind,path.extname(a.path).slice(1));
 const asset=read('p121/owner-qa/'+a.path);
 assert.equal(asset.length,a.size,'Size mismatch: '+a.path);
 assert.equal(crypto.createHash('sha256').update(asset).digest('hex'),a.sha256,
  'SHA256 mismatch: '+a.path);
 if(i<6)assert.deepEqual(a,prev.modules[0].assets[i],
  'A protected/inherited Tafsir asset was modified');
}
assert.equal(next.modules[0].assets[6].path,'modules/tafsir/p151-reader-notes.css');
assert.equal(next.modules[0].assets[7].path,'modules/tafsir/p151-reader-notes.js');
console.log(JSON.stringify({status:'PASS',version:'P151',sequence:28,tafsirModule:26,
 ownerRSA3072:'VERIFIED',assets:8,inheritedUnchanged:6,rollback:'SEQ27_EXACT',
 tilawaQA050:'UNMODIFIED',androidAcceptance:'PENDING_OWNER_TEST'}));
