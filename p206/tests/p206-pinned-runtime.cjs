'use strict';
/* Ephemeral test-only RSA3072 + Ed25519 keys. Never committed as production keys.
 * Exercises the ACTUAL P206 archive source with test public keys injected in VM.
 */
const fs=require('node:fs'),vm=require('node:vm'),c=require('node:crypto'),assert=require('node:assert/strict');
const source=fs.readFileSync('p206/staging/p206-signed-six-rollback.js','utf8');
const rsa=c.generateKeyPairSync('rsa',{modulusLength:3072}),ed=c.generateKeyPairSync('ed25519');
const rsaPub=rsa.publicKey.export({type:'spki',format:'der'}).toString('base64');
const edPub=ed.publicKey.export({type:'spki',format:'der'}).subarray(-32).toString('base64');
const staged=source.replace(/var RSA_PUBLIC='[^']+'/,'var RSA_PUBLIC=\''+rsaPub+'\'')
                   .replace(/OWNER_PUBLIC='[^']+'/,'OWNER_PUBLIC=\''+edPub+'\'');
assert.notEqual(staged,source);
let beforeWriteRead=null;
const tables=new Map(),connections=new Map();
function clone(v){return v===undefined?undefined:structuredClone(v)}
function conn(name){
 if(connections.has(name))return connections.get(name);
 const maps=new Map();if(name.includes('p121'))maps.set('meta',new Map());
 const obj={close(){},objectStoreNames:{contains:n=>maps.has(n)},createObjectStore(n){maps.set(n,new Map())},
  transaction(n,mode){
   const data=maps.get(n);if(!data)throw Error('missing store '+n);
   let finished=false;
   const tx={oncomplete:null,onerror:null,onabort:null,aborted:false,abort(){tx.aborted=true;queueMicrotask(()=>tx.onabort&&tx.onabort())},
    objectStore(){return{
     get(key){const req={result:null,onsuccess:null,onerror:null};queueMicrotask(()=>{if(tx.aborted)return;
      if(n==='meta'&&mode==='readwrite'&&beforeWriteRead){const f=beforeWriteRead;beforeWriteRead=null;f()}
      req.result=clone(data.get(key));req.onsuccess&&req.onsuccess()});return req},
     getAll(){const req={result:null,onsuccess:null,onerror:null};queueMicrotask(()=>{req.result=clone([...data.values()]);req.onsuccess&&req.onsuccess()});return req},
     put(v,key){data.set(key===undefined?v.sequence:key,clone(v));queueMicrotask(()=>{if(!finished&&!tx.aborted){finished=true;tx.oncomplete&&tx.oncomplete()}})},
     delete(k){data.delete(k)}
    }}
   };return tx;
  }};
 tables.set(name,maps);connections.set(name,obj);return obj;
}
const indexedDB={open(name){const req={result:null,onsuccess:null,onupgradeneeded:null,onerror:null};queueMicrotask(()=>{req.result=conn(name);req.onupgradeneeded&&req.onupgradeneeded();req.onsuccess&&req.onsuccess()});return req}};
const doc={readyState:'loading',addEventListener(){},getElementById(){return null}};
let served=null;
const w={crypto:c.webcrypto,indexedDB,BasairUniversalOTA:{async check(){return{envelope:served}}}};
vm.runInNewContext(staged,{window:w,document:doc,indexedDB,crypto:c.webcrypto,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Number,Date,JSON,Promise,Set,Map,Error,atob},{timeout:5000});
const archive=w.__BASAIR_P206_SIGNED_ARCHIVE__,APP='app.basair.qurv2';
const sha=x=>c.createHash('sha256').update(x).digest('hex');
function make(seq,tver,upver,legacy){
 const t=Buffer.from('tilawa '+tver),up=Buffer.from(legacy?'legacy rollback':'original P206 archive implementation');
 const ta={path:'modules/tilawa/fixture.js',kind:'js',size:t.length,sha256:sha(t)};
 const ua={path:legacy?'modules/updates/p197-local-rollback.js':'modules/updates/p206-signed-six-rollback.js',kind:'js',size:up.length,sha256:sha(up)};
 const tilawa={id:'tilawa',version:tver,assets:[ta]},updates={id:'updates',version:upver,assets:[ua]};
 const modules=[tilawa,updates],approvalExp=new Date(Date.now()+3*86400000).toISOString();
 const ownerHash=sha(Buffer.from(JSON.stringify([tilawa])));
 const proof='basair-universal-protected-v1\n'+APP+'\n'+seq+'\n'+ownerHash+'\n'+approvalExp;
 const approval={schema:1,algorithm:'Ed25519',sequence:seq,modulesSha256:ownerHash,expiresAt:approvalExp,signature:c.sign(null,Buffer.from(proof),ed.privateKey).toString('base64')};
 const manifest={schema:'basair-universal-ota-v1',channel:'owner-qa',applicationId:APP,minAppVersion:695,sequence:seq,id:'TEST-'+seq,title:'test '+seq,issuedAt:new Date().toISOString(),expiresAt:approvalExp,ownerApproval:approval,modules};
 const payload=Buffer.from(JSON.stringify(manifest)),envelope={payload:payload.toString('base64'),signature:c.sign('RSA-SHA256',payload,rsa.privateKey).toString('base64')};
 const filesT={[ta.path]:t.buffer.slice(t.byteOffset,t.byteOffset+t.byteLength)},filesU={[ua.path]:up.buffer.slice(up.byteOffset,up.byteOffset+up.byteLength)};
 return{sequence:seq,envelope,active:{tilawa:{version:tver,assets:[ta],files:filesT},updates:{version:upver,assets:[ua],files:filesU}}};
}
const old=make(100,100,197,true),newer=make(111,111,206,false),latest=make(113,113,206,false);
function state(v){tables.get('basair:p121:universal:db').get('meta').set('state',clone(v))}
function read(){return tables.get('basair:p121:universal:db').get('meta').get('state')}
async function capture(r){
 state({active:r.active,previous:null,trial:null,highestSequence:r.sequence});served=r.envelope;
 assert.equal(await archive.capture(),r.sequence);assert.equal(await archive.approve(r.sequence),true);
}
function pass(x){console.log('PASS '+x)}
(async()=>{
 await new Promise(resolve=>{const req=indexedDB.open('basair:p121:universal:db');req.onsuccess=resolve});
 await capture(old);await capture(newer);await capture(latest);
 assert.equal(await archive.restore(100),true);
 assert.equal(read().active.tilawa.version,100);
 assert.equal(read().active.updates.version,206);
 assert.equal(archive.hasArchiveRuntime(read().active.updates),true);
 pass('old signed release restores while P206 updater survives');
 let s=read();s.trial=null;state(s);
 assert.equal(await archive.restore(111),true);
 assert.equal(read().active.tilawa.version,111);
 assert.equal(read().active.updates.version,206);
 pass('second older step keeps P206 updater alive');
 s=read();s.trial=null;state(s);
 assert.equal(await archive.restore(113),true);
 assert.equal(read().active.tilawa.version,113);
 assert.equal(read().highestSequence,113);
 pass('forward restore available after multiple downgrades');
 s=read();s.trial=null;state(s);
 beforeWriteRead=()=>{const v=read();v.highestSequence=114;state(v)};
 await assert.rejects(archive.restore(100),/تغيّرت حالة/);
 assert.equal(read().highestSequence,114);
 assert.equal(read().active.tilawa.version,113);
 pass('concurrent P121 update aborts stale rollback without overwriting state');
 console.log('RESULT PASS P206 signed persistent-runtime and concurrency tests');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
