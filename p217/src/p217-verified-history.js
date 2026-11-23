/* BASAIR P217 — verified local history adapter. Staged ONLY, no OTA activation.
 * Delegates all signature and asset verification to original P206; it is not
 * a downloader, signer, rollback writer, or substitute for P121.
 * A known sequence without a locally archived signed snapshot is NOT restorable.
 */
(function(w){
 'use strict';
 if(w.__BASAIR_P217_VERIFIED_HISTORY__)return;
 var VERSION=217, LIMIT=6, PENDING_LIMIT=1, restoring=false;
 function archive(){
   var a=w.__BASAIR_P206_SIGNED_ARCHIVE__;
   return a&&typeof a.list==='function'&&typeof a.restore==='function'&&
     typeof a.verify==='function'&&typeof a.matches==='function'?a:null;
 }
 async function localState(){
   var a=w.__BASAIR_P207_ACTIVATION__;
   if(!a||typeof a.read!=='function')return null;
   try{return await a.read()}catch(_){return null}
 }
 function num(v){return Number.isSafeInteger(v)&&v>0?v:null}
 function label(v,n){return typeof v==='string'?v.slice(0,n||100):''}
 function relation(snapshot,local){
   var a=local&&local.active||{},b=snapshot||{},old=0,newer=0,compared=0;
   Object.keys(b).forEach(function(id){
     var x=num(a[id]&&a[id].version),y=num(b[id]&&b[id].version);
     if(x===null||y===null)return;
     compared++;
     if(y<x)old++;else if(y>x)newer++;
   });
   if(!compared)return 'غير معروف';
   if(old&&newer)return 'مختلط';
   if(old)return 'أقدم من النشط';
   if(newer)return 'أحدث من النشط';
   return 'مماثل للنشط';
 }
 async function inspect(record,state,api){
   var seq=record&&num(record.sequence);
   var out={sequence:seq||0,id:label(record&&record.id,100),
     title:label(record&&record.title,120),date:label(record&&record.date,32),
     approved:false,verified:false,restorable:false,active:null,
     comparison:'غير معروف',modules:[],status:'غير صالح'};
   if(!seq||!record.envelope||!record.active)return out;
   try{
     var manifest=await api.verify(record.envelope);
     if(!manifest||manifest.sequence!==seq||manifest.applicationId!=='app.basair.qurv2'||
       manifest.channel!=='owner-qa'||!Array.isArray(manifest.modules)||
       !(await api.matches(record.active,manifest)))return out;
     out.verified=true;
     out.approved=record.approved===true;
     out.title=label(manifest.title||manifest.id,120);
     out.id=label(manifest.id,100);
     out.date=label(manifest.issuedAt,32);
     out.active=record.active;
     out.comparison=relation(record.active,state);
     out.modules=manifest.modules.map(function(m){
       return{id:label(m.id,50),version:num(m.version)||0};
     });
     out.restorable=!!(out.approved&&state&&!state.trial&&
       num(state.highestSequence)!==null&&seq<=state.highestSequence);
     out.status=!out.approved?'بانتظار اعتماد المالك':
       !state?'تعذر التحقق من حالة الهاتف':
       state.trial?'تحديث جارٍ؛ الرجوع موقوف':
       seq>state.highestSequence?'أحدث من أعلى تسلسل محلي':
       'موقّع ومحفوظ؛ الرجوع يخضع للتحقق النهائي P206';
   }catch(_){/* Verification failed: fail closed, never expose a restore action. */}
   return out;
 }
 async function list(){
   var api=archive(),state=await localState();
   if(!api)return [];
   var rows=await api.list();
   if(!Array.isArray(rows))return [];
   rows=rows.filter(function(x){return !!(x&&num(x.sequence))})
     .sort(function(a,b){return b.sequence-a.sequence});
   // P206 retains SIX owner-approved snapshots AND ONE pending snapshot.
   // Avoid hiding the oldest approved backup when a newer pending entry exists.
   var approved=rows.filter(function(x){return x.approved===true}).slice(0,LIMIT);
   var pending=rows.filter(function(x){return x.approved!==true}).slice(0,PENDING_LIMIT);
   rows=approved.concat(pending).sort(function(a,b){return b.sequence-a.sequence});
   var output=[];
   for(var i=0;i<rows.length;i++)output.push(await inspect(rows[i],state,api));
   // P206 cannot safely restore if no *verified, approved* snapshot still
   // contains a P206-capable signed updates runtime. Refuse the affordance,
   // rather than let the user select an impossible rollback.
   var runtimeTrusted=typeof api.hasArchiveRuntime==='function'&&
     output.some(function(r){return !!(r.verified&&r.approved&&
       r.modules.some(function(m){return m.id==='updates'})&&
       r.active&&api.hasArchiveRuntime(r.active.updates));});
   if(!runtimeTrusted)output.forEach(function(r){
     r.restorable=false;
     if(r.verified&&r.approved)
       r.status='محرك الرجوع المحمي غير محفوظ أو غير معتمد';
   });
   return output;
 }
 async function restore(sequence){
   if(restoring||!num(sequence))return false;
   var api=archive();
   if(!api)throw Error('محرك استعادة النسخ الموقّعة غير متاح');
   restoring=true;
   try{
     var verified=await list(),record=verified.find(function(r){return r.sequence===sequence});
     if(!record||!record.restorable)throw Error('هذا الإصدار غير محفوظ أو غير معتمد للاستعادة');
     // P206 repeats proof/hash checks, atomically checks the current state,
     // and retains the signed P206-capable updates runtime.
     return await api.restore(sequence);
   }finally{restoring=false}
 }
 w.__BASAIR_P217_VERIFIED_HISTORY__=Object.freeze({
   version:VERSION,limit:LIMIT,pendingLimit:PENDING_LIMIT,list:list,restore:restore,
   status:function(){return{version:VERSION,available:!!archive(),restoring:restoring,
     note:'Six approved signed snapshots plus one pending maximum; no remote historical download'};}
 });
})(typeof window!=='undefined'?window:globalThis);
