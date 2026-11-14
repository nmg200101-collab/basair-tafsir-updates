'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p));
const trusted=read('p146/tests/test-p146-signed-release.cjs').toString('utf8').match(/const pub='([^']+)'/);
assert.ok(trusted,'The original owner's OTA public verification key must exist');
const key={key:Buffer.from(trusted[1],'base64'),format:'der',type:'spki'};
function signed(file){
 const obj=JSON.parse(read(file).toString('utf8'));
 assert.deepEqual(Object.keys(obj),['payload','signature']);
 const raw=Buffer.from(obj.payload,'base64'),sig=Buffer.from(obj.signature,'base64');
 assert.equal(sig.length,384,'Owner RSA3072 signature must be 384 bytes');
 assert.ok(crypto.verify('RSA-SHA256',raw,key,sig),'Owner signature invalid: '+file);
 return JSON.parse(raw.toString('utf8'));
}
const previousFile='p121/owner-qa/release-p149-seq26-before-p150-20261114.json';
const newSignedFile='p150/P150-SEQ27-OWNER-SIGNED-RELEASE.json';
const active='p121/owner-qa/release.json';
assert.deepEqual(read(previousFile),read('p149/P149-SEQ26-OWNER-SIGNED-RELEASE.json'),
 'Rollback must retain the exact owner-signed Seq26');
assert.deepEqual(read(active),read(newSignedFile),'Active release must be byte-exact signed owner Seq27');
const previous=signed(previousFile),next=signed(newSignedFile);
assert.equal(previous.sequence,26);
assert.equal(previous.modules[0].version,24);
assert.equal(next.sequence,27);
assert.equal(next.modules[0].version,25);
assert.equal(next.schema,'basair-universal-ota-v1');
assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.minAppVersion,694);
assert.equal(next.channel,'owner-qa');
assert.equal(next.deliveryMode,'notify');
assert.ok(Date.parse(next.issuedAt)<=Date.now()+300000);
assert.ok(Date.parse(next.expiresAt)>Date.now());
assert.equal(next.modules.length,1);
assert.equal(next.modules[0].id,'tafsir');
assert.equal(next.modules[0].assets.length,8);
for(const [i,a] of next.modules[0].assets.entries()){
 assert.match(a.path,/^modules\/tafsir\/[a-z0-9-]+\.(?:css|js)$/);
 assert.equal(path.extname(a.path).slice(1),a.kind);
 const file=read('p121/owner-qa/'+a.path);
 assert.equal(file.length,a.size,'Wrong length: '+a.path);
 assert.equal(crypto.createHash('sha256').update(file).digest('hex'),a.sha256,'Wrong SHA256: '+a.path);
 if(i<6)assert.deepEqual(a,previous.modules[0].assets[i],'Inherited Tafsir asset changed');
}
assert.equal(next.modules[0].assets[6].path,'modules/tafsir/p150-reader-polish.css');
assert.equal(next.modules[0].assets[7].path,'modules/tafsir/p150-reader-polish.js');
console.log(JSON.stringify({status:'PASS',sequence:27,tafsir:25,signature:'OWNER_RSA3072_VERIFIED',assets:8,
 previousRollback:'EXACT_SEQ26',qa050:'UNMODIFIED',androidDevice:'AWAITING_OWNER_TEST'}));
