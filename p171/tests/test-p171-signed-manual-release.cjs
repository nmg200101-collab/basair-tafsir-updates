'use strict';
// P171 signed manual owner release regression. Does not deploy anything.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),
 crypto=require('node:crypto'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const get=(p)=>fs.readFileSync(path.join(ROOT,p));
const archived=get('p121/owner-qa/release-p170-seq47-before-p171-20261115.json');
const seq47=get('p170/P170-SEQ47-OWNER-SIGNED-CANDIDATE.json');
assert.deepEqual(archived,seq47,'Preserve exact signed Seq47 before P171');
const signed=get('p171/P171-SEQ48-OWNER-SIGNED-CANDIDATE.json');
const live=get('p121/owner-qa/release.json');
assert.ok(live.equals(signed)||live.equals(archived),'Active manifest must be only Seq47 or signed Seq48');
const match=get('p146/tests/test-p146-signed-release.cjs').toString().match(/const pub='([^']+)'/);
assert.ok(match,'Original owner verification key missing');
const key={key:Buffer.from(match[1],'base64'),format:'der',type:'spki'};
function unpack(raw){
 const env=JSON.parse(raw.toString());
 const bytes=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.equal(sig.length,384);
 assert.equal(crypto.verify('RSA-SHA256',bytes,key,sig),true,'Invalid owner signature');
 return JSON.parse(bytes.toString());
}
const previous=unpack(archived),next=unpack(signed);
assert.equal(previous.sequence,47);assert.equal(next.sequence,48);
assert.equal(previous.modules[0].version,45);assert.equal(next.modules[0].version,46);
assert.equal(next.schema,'basair-universal-ota-v1');
assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.channel,'owner-qa');
assert.equal(next.deliveryMode,'notify','P171 must be optional MANUAL update');
assert.equal(next.minAppVersion,694,'Do not silently lower supported installed APK version');
assert.ok(Date.parse(next.issuedAt)<=Date.now()+300000);
assert.ok(Date.parse(next.expiresAt)>Date.now());
assert.equal(previous.modules.length,1);assert.equal(next.modules.length,1);
assert.equal(next.modules[0].id,'tafsir');
assert.equal(previous.modules[0].assets.length,14);
assert.equal(next.modules[0].assets.length,16);
assert.deepEqual(next.modules[0].assets.slice(0,14),previous.modules[0].assets,
 'All 14 signed P170 assets must remain intact');
const added=next.modules[0].assets.slice(14);
assert.deepEqual(added.map(a=>a.path),[
 'modules/tafsir/p171-tafsir-index-native-saved-recovery.css',
 'modules/tafsir/p171-tafsir-index-native-saved-recovery.js'
]);
let checked=0;
for(const a of next.modules[0].assets){
 const bytes=get('p121/owner-qa/'+a.path);
 assert.equal(bytes.length,a.size,'Size mismatch: '+a.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256,'SHA-256 mismatch: '+a.path);
 if(a.kind==='js')new vm.Script(bytes.toString('utf8'),{filename:a.path});
 checked++;
}
const script=get('p121/owner-qa/modules/tafsir/p171-tafsir-index-native-saved-recovery.js').toString('utf8');
assert.ok(script.includes('__BASAIR_TAFSIR_P157_STABLE__'));
assert.ok(script.includes('__BASAIR_TAFSIR_FINAL_B233__'));
assert.ok(script.includes('data-bq171-saved'));
assert.ok(!script.includes('localStorage')&&!script.includes('indexedDB'));
assert.ok(!script.includes('__BASAIR_TAFSIR_STEP5__.loadNext'));
assert.ok(!script.includes('__BASAIR_TAFSIR_R114__.toggle'));
console.log(JSON.stringify({result:'PASS',sequence:48,mode:'MANUAL_NOTIFY',
 module:'tafsir',version:46,signing:'ORIGINAL_OWNER_RSA3072_VALID',
 retainedP170Assets:14,addedP171Assets:2,assetsVerified:checked,
 oldSeq47ManifestPreserved:true,
 activeManifest:live.equals(signed)?'Seq48':'Seq47',
 protectedQA050Untouched:true,androidV690Compatibility:'NOT_VERIFIED',fieldAcceptance:'PENDING'}));
