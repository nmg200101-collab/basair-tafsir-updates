/* P216 local P121 IndexedDB integration smoke test. Fake crypto + DB:
 * validates archive/approval/restore state and preserving independent Tilawa.
 * NOT a real signed-WebView or Android deployment acceptance.
 */
(function(root){
root.__BASAIR_P216_STATE_INTEGRATION_TESTS__=async function(legacy,candidate){
var passed=0,failed=[];function ck(name,value){if(value)passed++;else failed.push(name)}
var ABC='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function bytes(s){return Array.from(unescape(encodeURIComponent(s)),x=>x.charCodeAt(0))}
function b64(s){var a=bytes(s),o='';for(var i=0;i<a.length;i+=3){
 var x=a[i],y=a[i+1],z=a[i+2];
 o+=ABC[x>>2]+ABC[(x&3)<<4|(y==null?0:y>>4)];
 o+=y==null?'=':ABC[(y&15)<<2|(z==null?0:z>>6)];
 o+=z==null?'=':ABC[z&63]}return o}
function atob0(s){var v=0,n=0,out='';for(var c of s){var k=ABC.indexOf(c);
 if(k<0)continue;v=v<<6|k;n+=6;if(n>=8){n-=8;out+=String.fromCharCode(v>>n&255)}}return out}
function memory(initial){
 var ds={'basair:p121:universal:db':{meta:new Map([['state',initial]])}};
 function open(name){
  var req={result:null,onsuccess:null,onupgradeneeded:null,onerror:null};
  Promise.resolve().then(function(){
   var fresh=!ds[name];if(fresh)ds[name]={};
   var db={close(){},objectStoreNames:{contains:key=>!!ds[name][key]},
     createObjectStore:function(key){ds[name][key]=new Map()},
     transaction:function(key){
      var tx={oncomplete:null,onabort:null,onerror:null,abort:function(){Promise.resolve().then(()=>this.onabort&&this.onabort())},
        objectStore:function(k){var map=ds[name][k];function req0(fn,finish){
           var r={result:null,onsuccess:null,onerror:null};Promise.resolve().then(function(){
             r.result=fn();if(r.onsuccess)r.onsuccess();
             if(finish)Promise.resolve().then(()=>tx.oncomplete&&tx.oncomplete());
           });return r}
         return{get:k=>req0(()=>map.get(k),true),getAll:()=>req0(()=>[...map.values()],true),
          put:(v,k)=>{map.set(k===undefined?v.sequence:k,v);Promise.resolve().then(()=>tx.oncomplete&&tx.oncomplete())},
          delete:k=>{map.delete(k);Promise.resolve().then(()=>tx.oncomplete&&tx.oncomplete())}};
        }};return tx}
   };req.result=db;if(fresh&&req.onupgradeneeded)req.onupgradeneeded();
   if(req.onsuccess)req.onsuccess();
  });return req;
 }
 return{indexedDB:{open},state:()=>ds['basair:p121:universal:db'].meta.get('state'),
 setState:s=>ds['basair:p121:universal:db'].meta.set('state',s)};
}
function boot(source){
 var asset={path:'modules/updates/p216-signed-six-rollback-v2.js',kind:'js',
 size:1,sha256:'0'.repeat(64)};
 var update={version:216,assets:[asset],files:{[asset.path]:new Uint8Array([55]).buffer}},
 tilawa={version:243,assets:[],files:{}},
 state={highestSequence:128,active:{updates:update,tilawa},previous:null,trial:null},
 db=memory(state),
 manifest={schema:'basair-universal-ota-v1',channel:'owner-qa',
 applicationId:'app.basair.qurv2',minAppVersion:694,sequence:128,
 issuedAt:'2026-11-23T08:03:39Z',expiresAt:'2026-12-28T08:03:39Z',
 modules:[{id:'updates',version:216,assets:[asset]}]},
 envelope={payload:b64(JSON.stringify(manifest)),signature:b64('X'.repeat(384))},
 crypto={subtle:{importKey:async()=>({}),verify:async()=>true,
 digest:async()=>new ArrayBuffer(32)}},
 w={setTimeout(){},crypto,indexedDB:db.indexedDB,
 BasairUniversalOTA:{check:async()=>({manifest,envelope})}},
 d={body:null,readyState:'loading',addEventListener(){},getElementById(){return null}},
 Enc=class{encode(s){return new Uint8Array(bytes(s))}},
 Dec=class{decode(a){return String.fromCharCode(...a)}};
 new Function('window','document','crypto','indexedDB','TextEncoder','TextDecoder','atob',source)(
 w,d,crypto,db.indexedDB,Enc,Dec,atob0);
 return{api:w.__BASAIR_P206_SIGNED_ARCHIVE__,db,tilawa,update,state};
}
var broken=boot(legacy),newer=boot(candidate);
ck('Legacy P206 cannot capture partial updates-only manifest',await broken.api.capture()===null);
ck('V2 captures signed updates-only manifest with active Tilawa',await newer.api.capture()===128);
var list=await newer.api.list();
ck('Capture snapshots only signed modules',list.length===1&&Object.keys(list[0].active).join(',')==='updates');
ck('Newly captured snapshot is unapproved',list[0].approved===false);
ck('Capture does not change active protected Tilawa',newer.db.state().active.tilawa===newer.tilawa);
ck('Owner can explicitly approve a verified active snapshot',await newer.api.approve(128)===true);
list=await newer.api.list();
ck('Approved snapshot persists',list[0].approved===true&&list[0].sequence===128);
ck('Signed snapshot includes trusted update archive runtime',newer.api.hasArchiveRuntime(list[0].active.updates));
newer.db.setState({highestSequence:129,active:{tilawa:newer.tilawa,updates:{version:217,assets:[],files:{}}},
 previous:newer.state.active,trial:null});
ck('Restore of approved updates-only Seq128 succeeds from Seq129',await newer.api.restore(128)===true);
var out=newer.db.state();
ck('Restored update module is v216',out.active.updates.version===216);
ck('Restoring updates preserves original Tilawa exactly',out.active.tilawa===newer.tilawa);
ck('Global highest sequence never decreases',out.highestSequence===129);
ck('P121 pending-trial marker set to restored sequence',out.trial&&out.trial.status==='pending'&&out.trial.seq===128);
ck('P121 prior state kept for trial fallback',out.previous.updates.version===217);
var denied=false;try{await newer.api.restore(128)}catch(_){denied=true}
ck('Concurrent pending trial refuses another restore',denied);
var fresh=boot(candidate),invalid=false;try{await fresh.api.restore(128)}catch(_){invalid=true}
ck('Missing approved archive never restores',invalid);
newer.db.setState({...out,active:{tilawa:{version:244,assets:[],files:{}},updates:out.active.updates},trial:null});
ck('Restore of identical signed updates never changes separately active Tilawa',
  await newer.api.restore(128)===false&&newer.db.state().active.tilawa.version===244);
return{passed,failed:failed.length,errors:failed,
 caveat:'Fake signatures and simplified IndexedDB: tests state transitions only, not RSA, WebView or on-device OTA.'};
};
})(typeof window!=='undefined'?window:globalThis);
