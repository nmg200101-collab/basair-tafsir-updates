'use strict';
/* P175 Seq51: no writes, no APK, no private signing keys. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p));
const current=read('p121/owner-qa/release.json');
const old=read('p121/owner-qa/release-p174-seq50-before-p175-20261115.json');
const candidate=read('p175/P175-SEQ51-OWNER-SIGNED-AUTOMATIC.json');
assert.ok(current.equals(candidate)||current.equals(old),'Active must be signed Seq50 or signed Seq51 only');
const match=read('p146/tests/test-p146-signed-release.cjs').toString().match(/const pub='([^']+)'/);
assert.ok(match,'original owner verification public key not found');
const owner={key:Buffer.from(match[1],'base64'),format:'der',type:'spki'};
function signed(e){const x=JSON.parse(e.toString('utf8'));
 const b=Buffer.from(x.payload,'base64'),s=Buffer.from(x.signature,'base64');
 assert.equal(s.length,384,'RSA-3072 signature bytes');
 assert.ok(crypto.verify('RSA-SHA256',b,owner,s),'invalid owner signature');
 return JSON.parse(b.toString('utf8'));
}
const previous=signed(old),now=signed(candidate);
assert.equal(previous.sequence,50);assert.equal(previous.modules[0].version,48);
assert.equal(now.sequence,51);assert.equal(now.modules[0].version,49);
assert.equal(now.deliveryMode,'automatic','owner explicitly selected automatic');
assert.equal(now.schema,'basair-universal-ota-v1');
assert.equal(now.applicationId,'app.basair.qurv2');
assert.equal(now.channel,'owner-qa');
assert.equal(now.minAppVersion,694);
assert.ok(Date.parse(now.expiresAt)>Date.now()&&Date.parse(now.issuedAt)<=Date.now()+300000);
assert.equal(previous.modules[0].assets.length,20);
assert.equal(now.modules[0].assets.length,22);
assert.deepEqual(now.modules[0].assets.slice(0,20),previous.modules[0].assets,'20 previous signed assets must be unchanged');
assert.deepEqual(now.modules[0].assets.slice(-2).map(x=>x.path),[
 'modules/tafsir/p175-tafsir-index-single-owner.css',
 'modules/tafsir/p175-tafsir-index-single-owner.js']);
for(const a of now.modules[0].assets){const bytes=read('p121/owner-qa/'+a.path);
 assert.equal(bytes.length,a.size,'size mismatch '+a.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256,'hash mismatch '+a.path);
 if(a.kind==='js')new vm.Script(bytes.toString('utf8'),{filename:a.path});
}
const js=read('p121/owner-qa/modules/tafsir/p175-tafsir-index-single-owner.js').toString();
const css=read('p121/owner-qa/modules/tafsir/p175-tafsir-index-single-owner.css').toString();
for(const name of ['#bqTf118Topbar','#bqTf118SearchAction','__BASAIR_TAFSIR_P157_STABLE__'])assert.ok(js.includes(name),'missing native target '+name);
for(const name of ['#bqTf118Topbar','#bqTf118SearchAction','#bq175P118FullType'])assert.ok(css.includes(name),'missing CSS native target '+name);
for(const unsafe of ['indexedDB','localStorage','sessionStorage'])assert.ok(!js.includes(unsafe),'may not write to user data '+unsafe);
assert.equal(now.modules[0].id,'tafsir','QA050 requires tafsir only');
console.log(JSON.stringify({result:'PASS',automatic:true,sequence:51,version:49,ownerRSA3072:true,assetsVerified:22,oldAssetsUntouched:20,qa050Scope:'tafsir-only',publication:current.equals(candidate)?'candidate active':'candidate staged'}));
