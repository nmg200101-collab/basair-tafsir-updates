/* P216: pure display model; inputs are results ALREADY verified by V695 P121
 * or read-only current IndexedDB state. This never authenticates on its own.
 */
(function (w) {
'use strict';
if(w.__BASAIR_P216_MODEL__) return;
var labels={tilawa:'التلاوة',tafsir:'التفسير',updates:'التحديثات',home:'الرئيسية',hifz:'الحفظ',library:'المكتبة',
 reciters:'القراء',navigation:'التنقل',shared:'المكونات المشتركة',settings:'الإعدادات',search:'البحث',downloads:'التنزيلات'};
function clean(x,n){return typeof x==='string'?x.trim().slice(0,n||180):'';}
function modules(items){
 return Array.isArray(items)?items.filter(x=>x&&typeof x.id==='string').slice(0,14).map(x=>({
   id:x.id,name:labels[x.id]||clean(x.id,40),version:Number.isSafeInteger(x.version)?x.version:null})):[];}
function candidate(c){
 if(!c||!c.envelope||typeof c.envelope.payload!=='string'||typeof c.envelope.signature!=='string')return null;
 var m=c.manifest;
 if(!m||m.schema!=='basair-universal-ota-v1'||m.channel!=='owner-qa'||m.applicationId!=='app.basair.qurv2'||
   !Number.isSafeInteger(m.sequence)||m.sequence<=0||!Array.isArray(m.modules)||!['notify','automatic'].includes(m.deliveryMode))return null;
 return {sequence:m.sequence,id:clean(m.id,90),title:clean(m.title,160),date:clean(m.issuedAt,35),
   newer:c.newer===true,deliveryMode:m.deliveryMode,restart:m.restartRequired===true,
   summary:(Array.isArray(m.changeSummary)?m.changeSummary:[]).slice(0,8).map(x=>clean(x,240)).filter(Boolean),
   modules:modules(Array.isArray(c.changes)&&c.changes.length?c.changes:m.modules),
   label:m.deliveryMode==='notify'?'التنزيل بعد موافقتك':'التنزيل التلقائي يحدده البيان الموقّع'};
}
function installed(s){
 if(!s||typeof s!=='object')return null;
 var seq=Number.isSafeInteger(s.highestSequence)&&s.highestSequence>=0?s.highestSequence:null,
     versions=Object.keys(s.active||{}).slice(0,14).map(id=>({id:id,name:labels[id]||clean(id,40),
       version:Number.isSafeInteger(s.active[id]&&s.active[id].version)?s.active[id].version:null}));
 return {sequence:seq,versions:versions,trial:s.trial&&s.trial.status||null,ready:!s.trial,
   nativeVersion:'V695',isLocal:true};
}
function history(rows){
 if(!Array.isArray(rows))return[];
 return rows.slice(0,16).filter(r=>r&&Number.isSafeInteger(r.sequence)&&r.sequence>=1&&r.verified===true)
 .map(r=>({sequence:r.sequence,id:clean(r.id,90),title:clean(r.title,180),
   date:clean(r.date,35),approved:r.approved===true,
   canRestore:r.approved===true&&r.cachedAssetsVerified===true&&r.restoreEngineReady===true,
   moduleVersions:modules(r.moduleVersions||[])})).sort((a,b)=>b.sequence-a.sequence);
}
function restoreMessage(current,record){
 if(!record||record.canRestore!==true)return 'هذا الإصدار غير متاح للاستعادة الآمنة حاليًا.';
 return 'سيتم الرجوع من التسلسل '+(current&&current.sequence!=null?current.sequence:'غير معروف')+
   ' إلى الإصدار '+(record.title||record.id||'Seq '+record.sequence)+'، تسلسل '+record.sequence+
   '. ستُستعاد ملفات التحديث الموقّعة المحفوظة فقط دون حذف الملاحظات والمفضلة. هل توافق؟';
}
w.__BASAIR_P216_MODEL__=Object.freeze({version:216,candidate:candidate,installed:installed,history:history,
  restoreMessage:restoreMessage,moduleNames:labels});
})(typeof window!=='undefined'?window:globalThis);
