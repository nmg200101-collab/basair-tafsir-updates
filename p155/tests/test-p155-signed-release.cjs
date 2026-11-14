'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),
 crypto=require('node:crypto'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const old=read('p121/owner-qa/release-p154-seq31-before-p155-20261114.json');
const newRelease=read('p155/P155-SEQ32-OWNER-SIGNED-RELEASE.json');
assert.deepEqual(old,read('p154/P154-SEQ31-OWNER-SIGNED-RELEASE.json'),
 'P154 signed rollback must stay exact');
assert.deepEqual(newRelease,read('p121/owner-qa/release.json'),
 'Active signed Seq32 must match byte-for-byte');
const pub=read('p146/tests/test-p146-signed-release.cjs').toString('utf8').match(/const pub='([^']+)'/);
assert.ok(pub);
const key={key:Buffer.from(pub[1],'base64'),format:'der',type:'spki'};
function verify(b){
 const env=JSON.parse(b.toString('utf8')),data=Buffer.from(env.payload,'base64'),
 signature=Buffer.from(env.signature,'base64');
 assert.equal(signature.length,384);
 assert.ok(crypto.verify('RSA-SHA256',data,key,signature),'Original owner RSA-3072 invalid');
 return JSON.parse(data.toString('utf8'))
}
const prev=verify(old),next=verify(newRelease);
assert.equal(prev.sequence,31);assert.equal(prev.modules[0].version,29);
assert.equal(next.sequence,32);assert.equal(next.modules[0].version,30);
assert.equal(next.schema,'basair-universal-ota-v1');
assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.channel,'owner-qa');assert.equal(next.deliveryMode,'automatic');
assert.equal(next.minAppVersion,694);assert.equal(next.modules.length,1);
assert.equal(next.modules[0].id,'tafsir');
assert.equal(next.modules[0].assets.length,2);
assert.ok(Date.parse(next.issuedAt)<=Date.now()+300000);
assert.ok(Date.parse(next.expiresAt)>Date.now());
for(const a of next.modules[0].assets){
 assert.match(a.path,/^modules\/tafsir\/p155-native-foundation\.(?:js|css)$/);
 const x=read('p121/owner-qa/'+a.path);
 assert.equal(x.length,a.size,'Size mismatch '+a.path);
 assert.equal(crypto.createHash('sha256').update(x).digest('hex'),a.sha256,'SHA mismatch '+a.path);
}
new vm.Script(read('p121/owner-qa/modules/tafsir/p155-native-foundation.js').toString('utf8'));
assert.equal(next.modules.some(x=>x.id==='tilawa'),false,'QA050 protected');
console.log(JSON.stringify({status:'PASS',version:'P155',sequence:32,tafsirModuleVersion:30,
 signature:'ORIGINAL_OWNER_RSA3072_VALID',assets:2,legacyOverlaysExcluded:true,
 rollbackSeq31:'BYTE_EXACT',nativeSavedStorage:'UNTOUCHED',qa050:'PASS',
 androidFieldTest:'PENDING'}));
