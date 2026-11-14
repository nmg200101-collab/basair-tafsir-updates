'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),
crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const css=read('p121/owner-qa/modules/tafsir/p157-native-saved-stability.css'),
      js=read('p121/owner-qa/modules/tafsir/p157-native-saved-stability.js');
const candidate=JSON.parse(read('p157/P157-SEQ34-UNSIGNED-CANDIDATE.json'));
const old=read('p121/owner-qa/release-p156-seq33-before-p157-20261114.json');
const current=read('p121/owner-qa/release.json');
const signedNext=read('p157/P157-SEQ34-OWNER-SIGNED-RELEASE.json');
assert.ok(current.equals(old)||current.equals(signedNext),
 'Only original signed Seq33 or verified signed P157 Seq34 may be active');
assert.deepEqual(old,read('p156/P156-SEQ33-OWNER-SIGNED-RELEASE.json'));
const env=JSON.parse(old),payload=Buffer.from(env.payload,'base64'),
 pubMatch=read('p146/tests/test-p146-signed-release.cjs').toString().match(/const pub='([^']+)'/);
assert.ok(pubMatch);
const pub={key:Buffer.from(pubMatch[1],'base64'),format:'der',type:'spki'};
assert.ok(crypto.verify('RSA-SHA256',payload,pub,Buffer.from(env.signature,'base64')));
const prev=JSON.parse(payload.toString());assert.equal(prev.sequence,33);
const nextEnvelope=JSON.parse(signedNext);
const rawNext=Buffer.from(nextEnvelope.payload,'base64');
assert.equal(Buffer.from(nextEnvelope.signature,'base64').length,384);
assert.ok(crypto.verify('RSA-SHA256',rawNext,pub,Buffer.from(nextEnvelope.signature,'base64')),
 'Owner RSA3072 signature mismatch for P157');
const signedPayload=JSON.parse(rawNext.toString('utf8'));
assert.equal(signedPayload.sequence,34);
assert.equal(signedPayload.applicationId,'app.basair.qurv2');
assert.equal(signedPayload.modules[0].version,32);
assert.ok(Date.parse(signedPayload.expiresAt)>Date.now());
assert.ok(Date.parse(signedPayload.issuedAt)<Date.now()+300000);
const next=candidate.proposedPayload;
assert.equal(next.sequence,34);assert.equal(next.applicationId,'app.basair.qurv2');
for(const key of ['schema','channel','applicationId','sequence','id','title',
 'minAppVersion','deliveryMode','modules'])assert.deepEqual(signedPayload[key],next[key],
 'Signed manifest differs from staged candidate field: '+key);
assert.equal(next.minAppVersion,695);assert.equal(next.deliveryMode,'automatic');
assert.equal(next.modules.length,1);assert.equal(next.modules[0].id,'tafsir');
assert.equal(next.modules[0].version,32);
for(const [i,file] of [css,js].entries()){
 const a=next.modules[0].assets[i];
 assert.equal(file.length,a.size,'asset size mismatch: '+a.path);
 assert.equal(crypto.createHash('sha256').update(file).digest('hex'),a.sha256,
  'asset checksum mismatch: '+a.path);
}
new vm.Script(js.toString(),{filename:'p157.js'});
const src=js.toString(),style=css.toString();
assert.ok(src.includes('bq157SavedGroup'));
assert.ok(src.includes('data-bq157-saved="favorites"')&&src.includes('data-bq157-saved="notes"'));
assert.ok(src.includes('favorites.open()')&&src.includes('favoritesUpgrade()'));
assert.ok(style.includes('data-bq157-saved-ready="1"'));
assert.ok(style.includes('data-b233-top="search"'));
assert.ok(style.includes('#basairTafsirB232FavoritesBtn'));
assert.ok(!src.includes("setAttribute('data-basair-main-tab'"));
assert.ok(!src.includes("setAttribute(\"data-basair-main-tab\""));
assert.ok(!src.includes('loadNext()'));
assert.ok(!src.includes('v194T5Ayah'));
assert.ok(!src.includes('stopImmediatePropagation'));
assert.ok(!src.includes('localStorage.setItem')&&!src.includes('localStorage.clear'));
assert.ok(!src.includes('document.write'));
assert.ok(!src.includes('cloneNode'));
assert.ok(!src.includes('setInterval('));
assert.ok(!style.includes('position:fixed')&&!style.includes('pointer-events:none'));
assert.ok(!style.includes('#tafsirReader')&&!style.includes('#tafsirAyahs'),
 'P157 CSS must never touch native reader layouts');
assert.equal(candidate.signed,false);
assert.equal(candidate.published,false);
assert.equal(candidate.ownerApprovalToPublish,true);
console.log(JSON.stringify({status:'PASS',sequence:34,oldSignedSeq33Preserved:true,signedSeq34RSA3072:true,
 ownNativeReader:false,savedTabsGroup:2,scope:'TAFSIR_INDEX_ONLY',
 shaCss:next.modules[0].assets[0].sha256,shaJs:next.modules[0].assets[1].sha256,
 androidWebView:'NOT_TESTED'}));
