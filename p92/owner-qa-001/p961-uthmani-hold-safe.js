/* BASAIR QURAN P93.2 — printed Uthmani temporarily disabled after owner field test.
 * Keeps original and coloured Tajweed choices; does not modify the Quran text,
 * image assets, Hifz, audio, or digital 'Uthmani' font.
 */
(function(){
 'use strict';
 if(window.__BASAIR_P932_UTHMANI_HOLD__)return;
 var body=document.body, html=document.documentElement;
 if(!body||!html||!window.MutationObserver)return;
 var pending=false, applying=false;
 var stats={redirected:0,intercepted:0};
 function tilawa(){return body.classList.contains('reader-active')&&!body.classList.contains('h25-hifz')&&!body.classList.contains('h90-review')&&!body.classList.contains('h100-teacher');}
 function isBlue(){var live=body.getAttribute('data-v144-print');return live==='blue'||(!live&&html.getAttribute('data-v686-print-intent')==='blue');}
 function amendNotes(){
   if(!tilawa())return;
   document.querySelectorAll('.v144PrintNote').forEach(function(node){
     var txt='الطبعتان المتاحتان: الأصلية والتجويد الملون. العثمانية موقوفة مؤقتًا للمراجعة.';
     if(node.textContent!==txt)node.textContent=txt;
   });
 }
 function repair(){
  if(applying||!tilawa())return;
  applying=true;
  try{
   if(isBlue()){
    try{localStorage.setItem('v129PrintMode','original');}catch(e){}
    var rc=window.__BASAIR_RC18__;
    // Public print setter belongs to the existing reader; never rebuild the engine.
    if(rc&&typeof rc.setPrint==='function')rc.setPrint('original',false);
    else if(typeof window.v129SetPrint==='function')window.v129SetPrint('original',false);
    else {body.setAttribute('data-v144-print','original');html.setAttribute('data-v686-print-intent','original');html.setAttribute('data-v684-print','original');}
    stats.redirected++;
   }
   amendNotes();
  }catch(e){ /* do not interrupt the Quran reader if an older UI is present */ }
  finally{applying=false;}
 }
 function schedule(){if(pending)return;pending=true;(window.requestAnimationFrame||function(cb){return Promise.resolve().then(cb);})(function(){pending=false;repair();});}
 // Window capture runs before the legacy document capture handler that owns print changes.
 window.addEventListener('click',function(ev){
  if(!tilawa())return;
  var target=ev.target&&ev.target.closest&&ev.target.closest('[data-v129-print="blue"],[data-v14-print="blue"]');
  if(!target)return;
  ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
  stats.intercepted++;schedule();
  if(typeof window.toast==='function')window.toast('الطبعة العثمانية موقوفة مؤقتًا؛ استخدم الأصلية أو التجويد الملوّن');
 },true);
 window.addEventListener('change',function(ev){
  if(!tilawa())return;
  var e=ev.target;
  if(e&&e.tagName==='SELECT'&&e.value==='blue'&&(/print/i.test(e.id||'')||/print/i.test(e.name||''))){
   ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
   e.value='original';stats.intercepted++;schedule();
  }
 },true);
 var mo=new MutationObserver(schedule);
 mo.observe(body,{attributes:true,attributeFilter:['class','data-v144-print']});
 mo.observe(html,{attributes:true,attributeFilter:['data-v686-print-intent']});
 window.addEventListener('pageshow',schedule,false);
 document.addEventListener('DOMContentLoaded',schedule,{once:true});
 window.__BASAIR_P932_UTHMANI_HOLD__={version:'P93.2-OWNER-QA-004',status:stats,check:schedule};
 schedule();
})();
