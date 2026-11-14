'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const oldEnv=read('p121/owner-qa/release-p167-seq44-before-p168-20261115.json');
const oldReference=read('p167/P167-SEQ44-OWNER-SIGNED-RELEASE.json');
const nextEnv=read('p168/P168-SEQ45-OWNER-SIGNED-RELEASE.json');
const active=read('p121/owner-qa/release.json');
assert.deepEqual(oldEnv,oldReference,'Previous signed Seq44 rollback must remain exact');
assert.deepEqual(active,nextEnv,'Staged owner signed Seq45 must be active only on the PR branch');
const source=read('p146/tests/test-p146-signed-release.cjs').toString('utf8');
const m=source.match(/const pub='([^']+)'/);assert.ok(m,'Original RSA public key missing');
const pub={key:Buffer.from(m[1],'base64'),format:'der',type:'spki'};
function unpack(b){const e=JSON.parse(b.toString()),v=Buffer.from(e.payload,'base64'),s=Buffer.from(e.signature,'base64');
 assert.equal(s.length,384);assert.ok(crypto.verify('RSA-SHA256',v,pub,s),'Original owner signature invalid');
 return JSON.parse(v.toString());}
const old=unpack(oldEnv),next=unpack(nextEnv);
assert.equal(old.sequence,44);assert.equal(old.modules[0].version,42);
assert.equal(next.sequence,45);assert.equal(next.modules[0].version,43);
assert.equal(next.schema,'basair-universal-ota-v1');assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.channel,'owner-qa');assert.equal(next.deliveryMode,'automatic');assert.equal(next.minAppVersion,694);
assert.ok(Date.parse(next.expiresAt)>Date.now());assert.equal(next.modules.length,1);
assert.equal(next.modules[0].id,'tafsir');
const oldA=old.modules[0].assets,a=next.modules[0].assets;assert.equal(a.length,10);
assert.equal(oldA.length,a.length);
const substitutions={6:'modules/tafsir/p168-tafsir-single-follow-runtime.js',9:'modules/tafsir/p168-tafsir-no-duplicate-follow-adapter.js'};
for(let i=0;i<a.length;i++){
 const x=a[i];assert.equal(x.kind,x.path.split('.').at(-1));
 assert.equal(x.path,substitutions[i]||oldA[i].path,'Unexpected changed asset position '+i);
 const bytes=read('p121/owner-qa/'+x.path);
 assert.equal(bytes.length,x.size,'Size mismatch '+x.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),x.sha256,'SHA mismatch '+x.path);
 if(!substitutions[i])assert.deepEqual(x,oldA[i],'Protected previous module asset altered');
 if(x.kind==='js')new vm.Script(bytes.toString('utf8'),{filename:x.path});
}
const p130=read('p121/owner-qa/'+a[6].path).toString();
const p168=read('p121/owner-qa/'+a[9].path).toString();
for(const needle of ['P168','p168Initialized','function ensureInitialized()','data-bq168-sole-follow',
 'followButtons.forEach','document.addEventListener(\'click\',onClick,true)',
 'p129-manual','document.addEventListener(\'touchend\''])assert.ok(p130.includes(needle),needle);
assert.ok(p168.includes('owner.init()')&&p168.includes('data-bq168-sole-follow'),'P130 owns follow creation');
assert.ok(!p168.includes("button=d.createElement('button');button.type='button';button.className='p125Follow bq166Follow'"),'Second Follow factory forbidden');
assert.ok(!p168.includes('loadNext(')&&!p168.includes('R114.toggle()'),'No competing loader/follow');
console.log(JSON.stringify({status:'PASS',originalOwnerRSA3072:true,sequence:45,moduleVersion:43,
 changedAssets:2,preservedAssets:8,followSingleOwner:true,lateReaderInit:true,androidTouchPreserved:true,
 narratorUnchanged:true,noteUnchanged:true,actualV695:'FIELD_TEST_PENDING'}));
