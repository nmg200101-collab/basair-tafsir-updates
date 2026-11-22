/* P217 isolated tests. Android/WebView and real signatures are separate gates. */
(function(root){
 'use strict';
 root.__BASAIR_P217_HISTORY_TESTS__=async function(src){
   var pass=0,failed=[],verifyCount=0,matchCount=0,restoreCount=0;
   function ck(name,yes){if(yes)pass++;else failed.push(name)}
   var local={highestSequence:132,trial:null,active:{tilawa:{version:243},updates:{version:216}}};
   var records=[
     {sequence:134,id:'FUTURE',approved:true,envelope:{signed:true},active:{tilawa:{version:245},updates:{version:218}}},
     {sequence:132,id:'SAME',approved:true,envelope:{signed:true},active:{tilawa:{version:243},updates:{version:216}}},
     {sequence:130,id:'OLDER',approved:true,envelope:{signed:true},active:{tilawa:{version:241},updates:{version:216}}},
     {sequence:128,id:'NEWER',approved:true,envelope:{signed:true},active:{tilawa:{version:245},updates:{version:218}}},
     {sequence:126,id:'UNAPPROVED',approved:false,envelope:{signed:true},active:{tilawa:{version:243},updates:{version:216}}},
     {sequence:124,id:'TAMPERED',approved:true,envelope:{signed:false},active:{tilawa:{version:241},updates:{version:200}}},
     {sequence:122,id:'LIMIT',approved:true,envelope:{signed:true},active:{tilawa:{version:240},updates:{version:200}}}
   ];
   var runtimeAvailable=true;
   var api={
     hasArchiveRuntime:function(updates){return !!(runtimeAvailable&&updates&&
       Array.isArray(updates.assets)&&updates.assets.some(function(a){
         return a.path==='modules/updates/p206-signed-six-rollback.js';
       }));},
     list:async function(){return records},
     verify:async function(env){verifyCount++;if(!env.signed)throw Error('RSA failed');
       var rec=records.find(r=>r.envelope===env);
       return {sequence:rec.sequence,id:rec.id,title:rec.id,issuedAt:'2026-11-22T12:00:00Z',
         applicationId:'app.basair.qurv2',channel:'owner-qa',
         modules:[{id:'tilawa',version:rec.active.tilawa.version},{id:'updates',version:rec.active.updates.version}]};},
     matches:async function(active,m){matchCount++;return active.tilawa.version===m.modules[0].version&&active.updates.version===m.modules[1].version},
     restore:async function(seq){restoreCount++;return seq===130}
   };
   records[1].active.updates.assets=[
     {path:'modules/updates/p206-signed-six-rollback.js',kind:'js'}];
   var w={__BASAIR_P206_SIGNED_ARCHIVE__:api,__BASAIR_P207_ACTIVATION__:{read:async()=>local}};
   new Function('window',src)(w);
   var p=w.__BASAIR_P217_VERIFIED_HISTORY__;
   ck('adapter registered',p&&p.version===217&&p.limit===6&&p.pendingLimit===1);
   var rows=await p.list();
   ck('archive retains six approved plus one pending',rows.length===7&&rows[0].sequence===134&&rows[6].sequence===122);
   ck('signature checks invoked',verifyCount===7);
   ck('asset checks invoked on valid proofs',matchCount===6);
   ck('future archived row not restorable',rows[0].verified&&!rows[0].restorable);
   ck('stable matching row recognized',rows[1].comparison==='مماثل للنشط'&&rows[1].restorable);
   ck('older signed version marked',rows[2].comparison==='أقدم من النشط'&&rows[2].restorable);
   ck('newer signed version marked',rows[3].comparison==='أحدث من النشط'&&rows[3].restorable);
   ck('not approved cannot restore',rows[4].verified&&!rows[4].approved&&!rows[4].restorable);
   ck('tampered signature fails closed',!rows[5].verified&&!rows[5].approved&&!rows[5].restorable);
   ck('oldest approved record remains visible despite pending record',
     rows[6].sequence===122&&rows[6].approved&&rows[6].verified&&rows[6].restorable);
   ck('pending record retains its own read-only history status',
     rows[4].sequence===126&&rows[4].status==='بانتظار اعتماد المالك');
   ck('approved count limited without dropping pending',
     rows.filter(x=>x.approved).length===5&&rows.filter(x=>!x.approved).length===2);
   var blocked=false;try{await p.restore(126)}catch(_){blocked=true}
   ck('unapproved restore refused',blocked&&restoreCount===0);
   blocked=false;try{await p.restore(134)}catch(_){blocked=true}
   ck('future sequence restore refused',blocked&&restoreCount===0);
   ck('approved local restore delegated to P206',await p.restore(130)===true&&restoreCount===1);
   runtimeAvailable=false;
   rows=await p.list();
   ck('no approved P206-capable engine disables all restore actions',
     rows.every(x=>!x.restorable));
   ck('missing verified P206 runtime explains restore block',
     rows.some(x=>x.approved&&x.status.includes('محرك الرجوع المحمي')));
   blocked=false;try{await p.restore(130)}catch(_){blocked=true}
   ck('restore cannot bypass missing trusted runtime',blocked&&restoreCount===1);
   runtimeAvailable=true;
   rows=await p.list();
   ck('restoring verified P206 runtime unlocks approved snapshots',
     rows.some(x=>x.sequence===130&&x.restorable));
   local.trial={status:'pending'};
   rows=await p.list();
   ck('active trial blocks restoring all rows',rows.every(x=>!x.restorable));
   blocked=false;try{await p.restore(130)}catch(_){blocked=true}
   ck('trial restore refused',blocked&&restoreCount===1);
   local.trial=null;delete w.__BASAIR_P207_ACTIVATION__;
   rows=await p.list();
   ck('missing local state removes all restore actions',rows.every(x=>!x.restorable));
   blocked=false;try{await p.restore(130)}catch(_){blocked=true}
   ck('no local state prevents rollback',blocked&&restoreCount===1);
   delete w.__BASAIR_P206_SIGNED_ARCHIVE__;
   ck('absent trusted archive yields no records',(await p.list()).length===0);
   blocked=false;try{await p.restore(130)}catch(_){blocked=true}
   ck('absent archive cannot restore',blocked&&restoreCount===1);
   ck('no writes or downloads at initialization',p.status().restoring===false);
   return{passed:pass,failed:failed.length,errors:failed,limit:'Isolated P206 adapter mocks only'};
 };
})(typeof window!=='undefined'?window:globalThis);
