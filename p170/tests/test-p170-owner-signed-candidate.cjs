'use strict';
/* P170 pre-publication verification. Does not activate Seq47 or touch P169. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),
crypto=require('node:crypto'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(ROOT,p));
const live=read('p121/owner-qa/release.json');
const frozen=read('p169/P169-SEQ46-OWNER-SIGNED-RELEASE.json');
const signedCandidate=read('p170/P170-SEQ47-OWNER-SIGNED-CANDIDATE.json');
const activeSeq47=live.equals(signedCandidate);
assert.ok(live.equals(frozen)||activeSeq47,
 'Only frozen P169 Seq46 or owner-signed P170 Seq47 may be active');
const fallback=read('p121/owner-qa/release-p168-seq45-before-p169-20261115.json');
assert.deepEqual(fallback,read('p168/P168-SEQ45-OWNER-SIGNED-RELEASE.json'),
  'P168 rollback must remain byte-identical');
const source=read('p146/tests/test-p146-signed-release.cjs').toString();
const match=source.match(/const pub='([^']+)'/);assert.ok(match,'Original owner public key missing');
const publicKey={key:Buffer.from(match[1],'base64'),format:'der',type:'spki'};
function unpack(raw){
 const envelope=JSON.parse(raw.toString('utf8'));
 const payload=Buffer.from(envelope.payload,'base64');
 const signature=Buffer.from(envelope.signature,'base64');
 assert.equal(signature.length,384,'RSA-3072 signature must be 384 bytes');
 assert.ok(crypto.verify('RSA-SHA256',payload,publicKey,signature),
  'Candidate signature does not match original owner key');
 return JSON.parse(payload.toString('utf8'));
}
const old=unpack(frozen),latest=unpack(signedCandidate);
assert.equal(old.sequence,46);assert.equal(old.modules[0].version,44);
assert.equal(latest.sequence,47);assert.equal(latest.modules[0].version,45);
assert.equal(latest.schema,'basair-universal-ota-v1');
assert.equal(latest.applicationId,'app.basair.qurv2');
assert.equal(latest.channel,'owner-qa');
assert.equal(latest.deliveryMode,'automatic');
assert.equal(latest.minAppVersion,694);
assert.equal(latest.modules.length,1);assert.equal(latest.modules[0].id,'tafsir');
assert.ok(Date.parse(latest.expiresAt)>Date.now(),'Candidate expired');
const previous=old.modules[0].assets,assets=latest.modules[0].assets;
assert.equal(previous.length,12);assert.equal(assets.length,14);
assert.deepEqual(assets.filter(x=>!x.path.includes('/p170-')),previous,
  'Any of the 12 protected P169 assets changed');
const added=assets.filter(x=>x.path.includes('/p170-'));
assert.deepEqual(added.map(a=>a.path),[
 'modules/tafsir/p170-tafsir-index-saved-type-stable.css',
 'modules/tafsir/p170-tafsir-index-saved-type-stable.js'
]);
for(const a of assets){
 const b=read('p121/owner-qa/'+a.path);
 assert.equal(b.length,a.size,'Size mismatch: '+a.path);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,
  'SHA-256 mismatch: '+a.path);
 if(a.kind==='js')new vm.Script(b.toString('utf8'),{filename:a.path});
}
const css=read('p121/owner-qa/modules/tafsir/p170-tafsir-index-saved-type-stable.css').toString();
const js=read('p121/owner-qa/modules/tafsir/p170-tafsir-index-saved-type-stable.js').toString();
assert.ok(css.includes('#basairTafsirB232FavoritesBtn'));
assert.ok(css.includes('display:none!important'));
assert.ok(js.includes('data-bq170-index-ready'));
assert.ok(!css.includes('#tafsirReader')&&!css.includes('#tafsirAyahs'));
assert.ok(!js.includes('indexedDB')&&!js.includes('localStorage'));
console.log(JSON.stringify({result:'PASS',sequence:47,tafsirVersion:45,
 signedRSA3072:true,priorProtectedAssetsIdentical:12,
 verifiedAssets:14,activeManifest:activeSeq47?'P170-Seq47':'P169-Seq46',rollbackSeq45Preserved:true,
 androidFieldTest:'PENDING',published:false}));
