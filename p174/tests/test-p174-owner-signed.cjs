'use strict';
/* No deploy; verify signed payload & all assets against original public key. */
const fs=require('node:fs'), path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const previous=read('p173/P173-SEQ49-OWNER-SIGNED-MANUAL-CANDIDATE.json');
const backup=read('p121/owner-qa/release-p173-seq49-before-p174-20261115.json');
const next=read('p174/P174-SEQ50-OWNER-SIGNED-MANUAL-CANDIDATE.json');
const active=read('p121/owner-qa/release.json');
assert.deepEqual(previous,backup,'Signed Seq49 must stay archived byte-exact');
assert.ok(active.equals(previous)||active.equals(next),'Only original Seq49 or owner-signed Seq50 can be active');
const original=read('p146/tests/test-p146-signed-release.cjs').toString('utf8').match(/const pub='([^']+)'/);
assert.ok(original,'Original owner public verification key unavailable');
const pub={key:Buffer.from(original[1],'base64'),format:'der',type:'spki'};
function extract(buf){const env=JSON.parse(buf.toString());
 const payload=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.equal(sig.length,384);
 assert.ok(crypto.verify('RSA-SHA256',payload,pub,sig),'Owner RSA-3072 signature mismatch');
 return JSON.parse(payload.toString('utf8'));
}
const old=extract(previous),neo=extract(next);
assert.equal(old.sequence,49);assert.equal(old.modules[0].version,47);
assert.equal(neo.sequence,50);assert.equal(neo.modules[0].version,48);
assert.equal(neo.deliveryMode,'notify');
assert.equal(neo.applicationId,'app.basair.qurv2');
assert.equal(neo.channel,'owner-qa');
assert.equal(neo.minAppVersion,694);
assert.equal(neo.modules[0].id,'tafsir');
assert.equal(old.modules[0].assets.length,18);
assert.equal(neo.modules[0].assets.length,20);
assert.deepEqual(neo.modules[0].assets.slice(0,18),old.modules[0].assets,'All signed Seq49 assets must be unchanged');
assert.deepEqual(neo.modules[0].assets.slice(18).map(x=>x.path),[
 'modules/tafsir/p174-tafsir-index-native-final.css',
 'modules/tafsir/p174-tafsir-index-native-final.js']);
assert.ok(Date.parse(neo.expiresAt)>Date.now());
let total=0;
for(const asset of neo.modules[0].assets){
 const file=read('p121/owner-qa/'+asset.path);
 assert.equal(file.length,asset.size,'Wrong size: '+asset.path);
 assert.equal(crypto.createHash('sha256').update(file).digest('hex'),asset.sha256,'Wrong SHA: '+asset.path);
 if(asset.kind==='js')new vm.Script(file.toString('utf8'),{filename:asset.path});
 total++;
}
const script=read('p121/owner-qa/modules/tafsir/p174-tafsir-index-native-final.js').toString();
assert.ok(script.includes('#p153FavoritesIndex'),'Must reuse original P153 saved panel opener');
assert.ok(script.includes('data-p153-tab'),'Must keep existing Favorites action');
assert.ok(!script.includes('localStorage')&&!script.includes('indexedDB'),'Must not create storage');
assert.ok(!script.includes('tafsirReader')&&!script.includes('tafsirAyahs'),'Must not modify reader');
console.log(JSON.stringify({result:'PASS',signedOwnerRSA3072:true,deliveryMode:'notify',sequence:50,tafsirVersion:48,unchangedAssets:18,newAssets:2,verifiedAssets:total,APK:'UNCHANGED',androidFieldTest:'PENDING'}));
