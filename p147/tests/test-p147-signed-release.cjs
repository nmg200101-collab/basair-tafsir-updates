'use strict';
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto'), assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'), read=p=>fs.readFileSync(path.join(root,p));
const source=read('p146/tests/test-p146-signed-release.cjs').toString('utf8');
const match=source.match(/const pub='([^']+)'/);
assert.ok(match,'missing trusted P146 RSA-3072 verification key');
const key={key:Buffer.from(match[1],'base64'),format:'der',type:'spki'};
function verify(file){
 const env=JSON.parse(read(file));
 assert.deepEqual(Object.keys(env),['payload','signature']);
 const raw=Buffer.from(env.payload,'base64'),signature=Buffer.from(env.signature,'base64');
 assert.equal(signature.length,384,'RSA-3072 signature required');
 assert.ok(crypto.verify('RSA-SHA256',raw,key,signature),'owner signature INVALID: '+file);
 return JSON.parse(raw.toString('utf8'));
}
const prevFile='p121/owner-qa/release-p146-seq23-before-p147-20261114.json';
const signedFile='p147/P147-SEQ24-OWNER-SIGNED-RELEASE.json';
assert.deepEqual(read(prevFile),read('p146/P146-SEQ23-OWNER-SIGNED-RELEASE.json'),'rollback not exact');
const p146=verify(prevFile),next=verify(signedFile),live=verify('p121/owner-qa/release.json');
assert.deepEqual(live,next,'active release differs from signed owner Seq24');
assert.deepEqual(read('p121/owner-qa/release.json'),read(signedFile),'active bytes must match signed artifact');
assert.equal(p146.sequence,23);assert.equal(p146.modules[0].version,21);
assert.equal(next.sequence,24);assert.equal(next.modules[0].version,22);
assert.equal(next.schema,'basair-universal-ota-v1');
assert.equal(next.channel,'owner-qa');assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.minAppVersion,694);assert.equal(next.deliveryMode,'notify');
assert.match(next.id,/^[A-Za-z0-9-]{1,70}$/);
assert.ok(Date.parse(next.issuedAt)<=Date.now()+300000);
assert.ok(Date.parse(next.expiresAt)>Date.now());
assert.equal(next.modules.length,1);assert.equal(next.modules[0].id,'tafsir');
assert.equal(next.modules[0].assets.length,8);
for(const [i,a] of next.modules[0].assets.entries()){
 assert.match(a.path,/^modules\/tafsir\/[a-z0-9-]+\.(js|css)$/i);
 assert.equal(path.extname(a.path).slice(1),a.kind);
 const actual=read('p121/owner-qa/'+a.path);
 assert.equal(actual.length,a.size,'byte length: '+a.path);
 assert.equal(crypto.createHash('sha256').update(actual).digest('hex'),a.sha256,'digest: '+a.path);
 if(i<6)assert.deepEqual(a,p146.modules[0].assets[i],'protected inherited Tafsir asset changed');
}
assert.equal(next.modules[0].assets[6].path,'modules/tafsir/p147-reader-polish.css');
assert.equal(next.modules[0].assets[7].path,'modules/tafsir/p147-reader-polish.js');
console.log(JSON.stringify({status:'PASS',release:'P147',sequence:next.sequence,tafsir:next.modules[0].version,
 ownerRSA:true,rollbackExact:true,assets:8,unchangedInherited:6,tilawaQA050:'protected',physicalPhone:'NOT TESTED'}));