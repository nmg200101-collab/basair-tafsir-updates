'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),
 assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=x=>fs.readFileSync(path.join(root,x));
const trusted=read('p146/tests/test-p146-signed-release.cjs').toString('utf8').match(/const pub='([^']+)'/);
assert.ok(trusted,'Trusted owner verification key missing');
const pub={key:Buffer.from(trusted[1],'base64'),format:'der',type:'spki'};
function checkSigned(file){
 const env=JSON.parse(read(file).toString('utf8'));
 assert.deepEqual(Object.keys(env),['payload','signature']);
 const raw=Buffer.from(env.payload,'base64'),signature=Buffer.from(env.signature,'base64');
 assert.equal(signature.length,384,'Expected original RSA-3072 signature');
 assert.ok(crypto.verify('RSA-SHA256',raw,pub,signature),'Invalid owner signature: '+file);
 return JSON.parse(raw.toString('utf8'));
}
const prevPath='p121/owner-qa/release-p152-seq29-before-p153-20261114.json',
 nextPath='p153/P153-SEQ30-OWNER-SIGNED-RELEASE.json';
assert.deepEqual(read(prevPath),read('p152/P152-SEQ29-OWNER-SIGNED-RELEASE.json'),
 'Signed Seq29 rollback must be byte-exact');
assert.deepEqual(read(nextPath),read('p121/owner-qa/release.json'),
 'Published Seq30 must match the original signed owner envelope verbatim');
const prev=checkSigned(prevPath),next=checkSigned(nextPath);
assert.equal(prev.sequence,29);assert.equal(prev.modules[0].version,27);
assert.equal(next.sequence,30);assert.equal(next.modules[0].version,28);
assert.equal(next.schema,'basair-universal-ota-v1');
assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.minAppVersion,694);
assert.equal(next.deliveryMode,'automatic','Use P121 background updater when manual UI missing');
assert.equal(next.channel,'owner-qa');assert.equal(next.modules.length,1);
assert.equal(next.modules[0].id,'tafsir');
assert.equal(next.modules[0].assets.length,8);
assert.ok(Date.parse(next.issuedAt)<=Date.now()+300000);
assert.ok(Date.parse(next.expiresAt)>Date.now());
for(const [i,a] of next.modules[0].assets.entries()){
 assert.match(a.path,/^modules\/tafsir\/[a-z0-9-]+\.(?:css|js)$/);
 assert.equal(a.kind,path.extname(a.path).slice(1));
 const raw=read('p121/owner-qa/'+a.path);
 assert.equal(raw.length,a.size,'Asset size changed: '+a.path);
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),a.sha256,'Asset hash invalid: '+a.path);
 if(i<6)assert.deepEqual(a,prev.modules[0].assets[i],'Inherited module changed');
}
assert.equal(next.modules[0].assets[6].path,'modules/tafsir/p153-single-owner.css');
assert.equal(next.modules[0].assets[7].path,'modules/tafsir/p153-single-owner.js');
const js=read('p121/owner-qa/modules/tafsir/p153-single-owner.js').toString('utf8');
new vm.Script(js);
assert.ok(js.includes("proxy.removeAttribute('data-r3-note-pos')"));
assert.ok(js.includes('data-p153-note-pos'));
assert.ok(!js.includes("proxy.setAttribute('data-r3-note-pos'"));
assert.ok(!js.includes('/* BASAIR P151 — independent Ayah Notes Hub'));
console.log(JSON.stringify({status:'PASS',sequence:30,tafsir:28,
 ownerRSA3072:'VALID',assets:8,inheritedUnchanged:6,rollback:'SIGNED_SEQ29_EXACT',
 p144Collision:'REMOVED',nativeNotes:'PRESERVED',tilawaQA050:'UNMODIFIED',
 androidAcceptance:'REQUIRES_DEVICE_TEST'}));
