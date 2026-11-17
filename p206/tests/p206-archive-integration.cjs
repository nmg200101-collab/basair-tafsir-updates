'use strict';
/* Integration mock of the ORIGINAL P121 IndexedDB v1 state and P206 signed archive. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8'),root=process.cwd();
const clone=x=>x===undefined?undefined:structuredClone(x);
const stores=new Map(),instances=new Map();
function openDb(name,version){
 let req={result:null,onupgradeneeded:null,onsuccess:null,onerror:null};
 queueMicrotask(()=>{
  if(!instances.has(name)){
   const maps=new Map();if(name.includes('p121'))maps.set('meta',new Map());
   const database={
    objectStoreNames:{contains:n=>maps.has(n)},
    createObjectStore(n){maps.set(n,new Map())},
    close(){},
    transaction(n,mode){
     if(!maps.has(n))throw Error('missing store '+n);
     const data=maps.get(n);
     const tx={oncomplete:null,onerror:null,onabort:null,objectStore(){
      return{
       get(key){let r={result:null,onsuccess:null,onerror:null};queueMicrotask(()=>{r.result=clone(data.get(key));if(r.onsuccess)r.onsuccess()});return r},
       getAll(){let r={result:null,onsuccess:null,onerror:null};queueMicrotask(()=>{r.result=clone(Array.from(data.values()));if(r.onsuccess)r.onsuccess()});return r},
       put(value,key){let id=key===undefined?value.sequence:key;data.set(id,clone(value));queueMicrotask(()=>{if(tx.oncomplete)tx.oncomplete()})},
       delete(key){data.delete(key);queueMicrotask(()=>{if(tx.oncomplete)tx.oncomplete()})}
      }
     }};
     return tx;
    }
   };
   stores.set(name,maps);instances.set(name,database);
  }
  req.result=instances.get(name);
  if(req.onupgradeneeded)req.onupgradeneeded();
  if(req.onsuccess)req.onsuccess();
 });return req;
}
const fakeDb={open:openDb},d={readyState:'loading',addEventListener(){},getElementById(){return null}};
let latest=null;
const w={crypto:crypto.webcrypto,indexedDB:fakeDb,BasairUniversalOTA:{async check(){return{envelope:latest}}}};
const sandbox={window:w,document:d,crypto:crypto.webcrypto,indexedDB:fakeDb,TextEncoder,TextDecoder,ArrayBuffer,Uint8Array,Number,Set,Map,Date,Error,Promise,JSON,Array,atob,console};
vm.runInNewContext(read(root+'/p206/staging/p206-signed-six-rollback.js'),sandbox);
const archive=w.__BASAIR_P206_SIGNED_ARCHIVE__;
async function make(sequence,filename){
 const envelope=JSON.parse(read(root+'/'+filename)),m=await archive.verify(envelope),active={};
 for(const mod of m.modules){
  const files={};
  for(const asset of mod.assets){
   const raw=fs.readFileSync(root+'/p121/owner-qa/'+asset.path);
   files[asset.path]=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength);
  }
  active[mod.id]={version:mod.version,assets:mod.assets,files};
 }
 return {envelope,manifest:m,active};
}
function state(s){stores.get('basair:p121:universal:db').get('meta').set('state',clone(s))}
function readState(){return stores.get('basair:p121:universal:db').get('meta').get('state')}
function verify(label,cond){assert.ok(cond,label);console.log('PASS '+label)}
(async()=>{
 await new Promise(r=>{var q=fakeDb.open('basair:p121:universal:db',1);q.onsuccess=r});
 const a=await make(107,'p204/P204-SEQ107-OWNER-SIGNED-AUTOMATIC.json');
 state({active:a.active,previous:null,trial:null,highestSequence:107});latest=a.envelope;
 verify('save signed stable P204',await archive.capture()===107);
 verify('P204 requires explicit owner approval',(await archive.list())[0].approved===false);
 verify('approve active verified P204',await archive.approve(107)===true);
 const b=await make(109,'p205/P205-SEQ109-OWNER-SIGNED-AUTOMATIC.json');
 state({active:b.active,previous:a.active,trial:null,highestSequence:109});latest=b.envelope;
 verify('save signed P205',await archive.capture()===109);
 verify('approve active verified P205',await archive.approve(109)===true);
 const archiveRows=await archive.list();verify('two signed versions available',archiveRows.length===2&&archiveRows.every(x=>x.approved));
 const restored=await archive.restore(107);
 verify('restore previous signed P204 transaction',restored===true);
 const s=readState();
 verify('P121 trial recovery populated',s.highestSequence===109&&s.trial.status==='pending'&&s.trial.seq===107&&s.previous.tilawa.version===b.active.tilawa.version);
 verify('P204 active bytes restored safely',s.active.tilawa.version===a.active.tilawa.version);
 await assert.rejects(archive.restore(109),/جارية/);verify('cannot rollback during pending trial',true);
 s.trial=null;state(s);
 const saved=stores.get('basair:p206:signed-six-archive').get('releases').get(107);
 const mod=saved.envelope&&saved.active.tilawa,asset=mod.assets[0],bytes=new Uint8Array(mod.files[asset.path]);bytes[0]^=1;
 await assert.rejects(archive.restore(107),/سلامة|فشل/);verify('reject damaged archived asset',true);
 // Retention simulation only: earlier owner-signed builds are NOT declared field-stable here.
 stores.get('basair:p206:signed-six-archive').get('releases').clear();
 const releases=[
  [75,'p189/P189-SEQ75-OWNER-SIGNED-AUTOMATIC.json'],
  [85,'p194/P194-SEQ85-OWNER-SIGNED-AUTOMATIC.json'],
  [93,'p197/P197-SEQ93-OWNER-SIGNED-AUTOMATIC.json'],
  [103,'p202/P202-SEQ103-OWNER-SIGNED-AUTOMATIC.json'],
  [105,'p203/P203-SEQ105-OWNER-SIGNED-AUTOMATIC.json'],
  [107,'p204/P204-SEQ107-OWNER-SIGNED-AUTOMATIC.json'],
  [109,'p205/P205-SEQ109-OWNER-SIGNED-AUTOMATIC.json']
 ];
 for(const [seq,path] of releases){
  const x=await make(seq,path);state({active:x.active,previous:null,trial:null,highestSequence:seq});latest=x.envelope;
  assert.equal(await archive.capture(),seq,'capture signed '+seq);
  assert.equal(await archive.approve(seq),true,'mock owner approval '+seq);
 }
 const retained=await archive.list();
 verify('six most recent approved snapshots retained',retained.length===6&&retained.every(x=>x.approved)&&retained[0].sequence===109&&retained[5].sequence===85);
 verify('oldest seventh release evicted',!retained.some(x=>x.sequence===75));
 console.log('RESULT PASS 13 integration assertions');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
