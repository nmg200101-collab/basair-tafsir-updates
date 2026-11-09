/* BASAIR P112 / QA-046: remove the temporary P93.2 Uthmani-mode lock.
 * No click interception, mode coercion, forced reload, or mutation of Quran data.
 * The original reader owns print switching and persistence. */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P112_QA046_BLUE_ENABLED__)return;
 var updates=0;
 function adjust(){
   if(!d.body||!d.body.classList.contains('reader-active'))return;
   if(d.body.classList.contains('h25-hifz')||d.body.classList.contains('h90-review')||d.body.classList.contains('h100-teacher'))return;
   d.querySelectorAll('.v144PrintNote').forEach(function(node){
     var old=node.textContent||'';
     if(old.indexOf('العثمانية موقوفة مؤقتًا')<0)return;
     node.textContent='الطبعات: الأصلية، التجويد الملوّن، والعثمانية بإطارها الأزرق الجديد.';
     updates++;
   });
 }
 var ob=null;
 function init(){
   if(!d.body)return;
   if(w.MutationObserver){
     ob=new MutationObserver(function(){adjust()});
     ob.observe(d.body,{attributes:true,attributeFilter:['class','data-v144-print']});
   }
   w.addEventListener('pageshow',adjust,false);
   adjust();
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P112_QA046_BLUE_ENABLED__={version:'QA-046',refresh:adjust,diagnostics:function(){return {unlocked:true,notesCorrected:updates,blueSelected:!!(d.body&&d.body.getAttribute('data-v144-print')==='blue')}}};
})(window,document);