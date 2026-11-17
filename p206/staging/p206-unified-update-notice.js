/* P206 — unified release details, sourced ONLY from RSA/Ed25519-verified OTA.check().
 * Core P121 status() returns event messages, NOT the signed release. No invented status.
 * Never installs automatically, never changes signed data or existing notification inbox.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P206_NOTICES__)return;
 var ID='p206UnifiedNotice',inFlight=null,latest=null;
 var moduleNames={tilawa:'التلاوة',tafsir:'التفسير',updates:'التحديثات',home:'الرئيسية',hifz:'الحفظ',library:'المكتبة',reciters:'القراء',settings:'الإعدادات',navigation:'التنقل',shared:'المكونات المشتركة',search:'البحث',downloads:'التنزيلات'};
 function api(){return w.BasairUniversalOTA}
 function safe(v){return typeof v==='string'?v.slice(0,300):''}
 function extract(c){
  if(!c||!c.manifest||!c.envelope)return null;
  var m=c.manifest,seq=m.sequence;
  if(!Number.isSafeInteger(seq)||seq<1||typeof m.title!=='string'||!Array.isArray(m.modules))return null;
  return{sequence:seq,id:safe(m.id),title:safe(m.title),date:safe(m.issuedAt),
   modules:m.modules.map(function(x){return moduleNames[x.id]||safe(x.id)}),newer:!!c.newer,
   count:Array.isArray(c.changes)?c.changes.length:0};
 }
 function panel(){
  var dlg=d.getElementById('basairUniversalP121Dialog');
  return dlg&&dlg.querySelector('.bu-p121-panel');
 }
 function text(parent,tag,value){var e=d.createElement(tag);e.textContent=value;parent.appendChild(e);return e}
 function draw(){
  var root=panel();if(!root)return;
  var el=d.getElementById(ID);
  if(!el){el=d.createElement('section');el.id=ID;el.dir='rtl';el.setAttribute('aria-label','تفاصيل التحديثات المعتمدة');
   el.style.cssText='margin:12px 0;padding:12px;border:1px solid #a8c5b5;border-radius:12px;font:14px system-ui;line-height:1.65';root.insertBefore(el,root.querySelector('.bu-p121-actions'))}
  el.replaceChildren();text(el,'strong','معلومات آخر تحديث شامل');
  if(!latest){text(el,'p','اضغط «عرض تفاصيل الإصدار الموقّع» لاستعلام الخادم.');}
  else{var status=latest.newer?'تحديث جديد متاح':'آخر بيان معتمد على الخادم';
   text(el,'p',status+' — رقم '+latest.sequence);
   text(el,'p',latest.title);
   if(latest.id)text(el,'p','رمز الحزمة: '+latest.id);
   if(latest.date)text(el,'p','تاريخ النشر: '+latest.date.slice(0,10));
   if(latest.modules.length)text(el,'p','الأقسام: '+latest.modules.join('، '));
   text(el,'small','مصدر البيانات: بيان P121 الموقّع والمتحقّق منه. لا يعني ظهوره اكتمال التثبيت.');}
  var b=text(el,'button',inFlight?'جارٍ التحقق…':'عرض تفاصيل الإصدار الموقّع');
  b.type='button';b.disabled=!!inFlight;b.style.cssText='border:0;border-radius:8px;padding:10px;background:#286f52;color:#fff;font:inherit';
  b.addEventListener('click',function(){refresh()});
 }
 async function refresh(){
  if(inFlight)return inFlight;
  var a=api();if(!a||typeof a.check!=='function'){latest=null;draw();return null}
  inFlight=Promise.resolve().then(function(){return a.check()}).then(function(v){latest=extract(v);return latest}).catch(function(e){
   latest=null;var root=panel();if(root){draw();var n=d.getElementById(ID);if(n)text(n,'p','تعذر الوصول إلى البيان الموقّع؛ لا تغيير في التحديثات: '+safe(e&&e.message));}return null
  }).finally(function(){inFlight=null;draw()});
  draw();return inFlight;
 }
 function boot(){if(!d.body)return;draw();
  var root=d.getElementById('basairUniversalP121Dialog');if(root&&w.MutationObserver){var ob=new MutationObserver(function(){draw()});ob.observe(root,{childList:true,subtree:false})}
  // The host dialog can be created after initialization; check for it on user request only.
  d.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('[data-basair-p121-button],#p197NavUpdates,#p197MoreUpdates,#p197LibraryUpdates');if(t)w.setTimeout(draw,60)},true);
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 w.__BASAIR_P206_NOTICES__={version:206,extract:extract,refresh:refresh,render:draw};
})(window,document);
