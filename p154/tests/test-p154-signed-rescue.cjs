'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const source=read('p146/tests/test-p146-signed-release.cjs').toString('utf8').match(/const pub='([^']+)'/);
assert.ok(source,'Trusted original owner public key absent');
const key={key:Buffer.from(source[1],'base64'),format:'der',type:'spki'};
function verify(file){
 const env=JSON.parse(read(file));
 assert.deepEqual(Object.keys(env),['payload','signature']);
 const data=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.equal(sig.length,384,'Expected original 3072 bit RSA signature');
 assert.ok(crypto.verify('RSA-SHA256',data,key,sig),'Owner signature invalid: '+file);
 return JSON.parse(data.toString('utf8'));
}
const oldPath='p121/owner-qa/release-p153-seq30-before-p154-20261114.json';
assert.deepEqual(read(oldPath),read('p153/P153-SEQ30-OWNER-SIGNED-RELEASE.json'),'P153 rollback archive must be byte-exact');
assert.deepEqual(read('p121/owner-qa/release.json'),read('p154/P154-SEQ31-OWNER-SIGNED-RELEASE.json'),'Live release must equal original signed P154');
const bad=verify(oldPath),good=verify('p152/P152-SEQ29-OWNER-SIGNED-RELEASE.json'),
 rescue=verify('p154/P154-SEQ31-OWNER-SIGNED-RELEASE.json');
assert.equal(good.sequence,29);assert.equal(good.modules[0].version,27);
assert.equal(bad.sequence,30);assert.equal(bad.modules[0].version,28);
assert.equal(rescue.sequence,31);assert.equal(rescue.modules[0].version,29);
assert.equal(rescue.channel,'owner-qa');assert.equal(rescue.applicationId,'app.basair.qurv2');
assert.equal(rescue.schema,'basair-universal-ota-v1');
assert.equal(rescue.deliveryMode,'automatic','Rescue should not rely on missing P121 manual UI');
assert.equal(rescue.minAppVersion,694);
assert.ok(Date.parse(rescue.issuedAt)<=Date.now()+300000);
assert.ok(Date.parse(rescue.expiresAt)>Date.now());
assert.equal(rescue.modules.length,1);assert.equal(rescue.modules[0].id,'tafsir');
assert.deepEqual(rescue.modules[0].assets,good.modules[0].assets,'Rescue MUST use the exact P152 signed asset set');
assert.equal(rescue.modules[0].assets.length,8);
assert.ok(!rescue.modules.some(m=>m.id==='tilawa'),'QA050 Tilawa protected');
for(const a of rescue.modules[0].assets){
 const buf=read('p121/owner-qa/'+a.path);
 assert.equal(buf.length,a.size,'Size mismatch: '+a.path);
 assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),a.sha256,'SHA mismatch: '+a.path);
}
console.log(JSON.stringify({status:'PASS',sequence:31,tafsirVersion:29,
 rsaOwnerSignature:'VERIFIED',oldSignedSeq30:'ARCHIVED',restoreAssets:'EXACT_P152_SEQ29',
 receiverAutomatic:true,userStorage:'UNTOUCHED',tilawaQA050:'UNMODIFIED',androidAcceptance:'PENDING'}));
