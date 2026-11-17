/* P207 — read-only owner QA activation evidence (no app-data mutation).
 * Reports the locally ACTIVE P121 module versions, not the server's latest manifest.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P207_ACTIVATION__)return;
 var ID='p207ActivationStatus',DB='basair:p121:universal:db',last=null;
 function locate(){var dlg=d.getElementById('basairUniversalP121Dialog');return dlg&&dlg.querySelector('.bu-p121-panel')}
 function add(p,tag,txt){var e=d.createElement(tag);e.textContent=String(txt);p.appendChild(e);return e}
 function localState(){return new Promise(function(resolve,reject){
  if(!w.indexedDB)return reject(Error('IndexedDB غير متاح'));
  var req=w.indexedDB.open(DB,1);req.onerror=function(){reject(req.error||Error('تعذر فتح قاعدة التحديثات'))};
  req.onsuccess=function(){var db=req.result;try{
   if(!db.objectStoreNames.contains('meta')){db.close();resolve(null);return}
   var tx=db.transaction('meta','readonly'),q=tx.objectStore('meta').get('state');
   q.onsuccess=function(){resolve(q.result||null)};q.onerror=function(){reject(q.error||Error('تعذر قراءة الحالة'))};
   tx.oncomplete=function(){db.close()};tx.onabort=function(){db.close()};
  }catch(e){db.close();reject(e)}};
 })}
 function snapshot(s){
  var a=s&&s.active||{},p205=w.__BASAIR_P205_ORIGINAL_PRINT_PARITY__,p207=w.__BASAIR_P207_FOLLOW_GUARD__;
  var native=null,guard=null;
  try{if(p205&&typeof p205.status==='function')native=p205.status()}catch(_){}
  try{if(p207&&typeof p207.status==='function')guard=p207.status()}catch(_){}
  var tilawa=a.tilawa&&Number(a.tilawa.version)||0,updates=a.updates&&Number(a.updates.version)||0;
  return{highestSequence:s&&s.highestSequence||0,tilawa:tilawa,updates:updates,
   trial:s&&s.trial&&s.trial.status||'none',
   edition:guard&&guard.edition||native&&native.edition||'غير معروف',
   followPatch:!!p207,originalAdapter:!!(native&&native.installed),
   firstTapMatches:guard&&guard.buttonMatches||0,
   staticRestores:guard&&guard.restores||0,
   followEligible:!!(guard&&guard.eligible)};
 }
 function show(){
  var root=locate();if(!root)return;
  var panel=d.getElementById(ID);
  if(!panel){panel=d.createElement('section');panel.id=ID;panel.dir='rtl';
   panel.style.cssText='margin:10px 0;padding:12px;border:1px solid #a7c8b5;border-radius:12px;font:14px system-ui;line-height:1.65';
   root.appendChild(panel)}
  panel.replaceChildren();add(panel,'strong','التحقق المحلي من تفعيل التحديث');
  if(!last){add(panel,'p','لم تُقرأ حالة الهاتف بعد.')}
  else if(last.error){add(panel,'p','تعذر القراءة: '+last.error)}
  else{add(panel,'p','آخر تسلسل محفوظ: '+last.highestSequence+' — التلاوة v'+last.tilawa+' — التحديثات v'+last.updates);
   add(panel,'p','حالة التفعيل: '+(last.trial==='none'?'مستقر محليًا':last.trial));
   add(panel,'p','معالجة P207: '+(last.followPatch?'محمّلة':'غير محمّلة')+' — محول P205: '+(last.originalAdapter?'مثبّت':'غير مثبت'));
   add(panel,'p','الطبعة: '+last.edition+' — ضغطات المتابعة المعروفة: '+last.firstTapMatches+' — عودة الثابت: '+last.staticRestores);
   add(panel,'small','الأرقام من قاعدة التحديثات على هذا الهاتف، وليست مجرد رقم الخادم.')}
  var b=add(panel,'button','تحديث قراءة الحالة');b.type='button';b.style.cssText='padding:9px 12px;border:0;border-radius:8px;background:#286f52;color:#fff;font:inherit';
  b.addEventListener('click',function(){refresh()});
 }
 async function refresh(){try{last=snapshot(await localState())}catch(e){last={error:String(e&&e.message||e).slice(0,160)}}show();return last}
 function boot(){if(!d.body)return;
  d.addEventListener('click',function(e){
   var target=e.target&&e.target.closest&&e.target.closest('[data-basair-p121-button],#p197NavUpdates,#p197MoreUpdates,#p197LibraryUpdates');
   if(target)w.setTimeout(refresh,100);
  },true);
  // Do not display a persistent overlay on the Mushaf.
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 w.__BASAIR_P207_ACTIVATION__={version:207,read:localState,snapshot:snapshot,refresh:refresh};
})(window,document);
