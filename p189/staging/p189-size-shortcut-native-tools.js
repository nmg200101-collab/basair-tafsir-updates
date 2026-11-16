/* BASAIR P188 — QA050 stable size shortcut + direct native print cards.
 * Load strictly after P187. Does not replace RC18, RC19, fonts or page HTML.
 * Short tap: 100% -> 110% -> 120% -> 100%. Long press: existing RC20 Tools.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P189_NATIVE_TOOLS__)return;
 var SIZE_ID='p187DockSize', SCALES=[1,1.1,1.2];
 var timer=0,held=false,down=false,px=0,py=0,working=false,lastPrint='',lastError='',changes=0;
 function E(k){return d.getElementById(k)}
 function get(k,v){try{return w.localStorage.getItem(k)||v}catch(_){return v}}
 function set(k,v){try{w.localStorage.setItem(k,String(v))}catch(_){}}
 function rc18(){return w.__BASAIR_RC18__}
 function rc19(){return w.__BASAIR_RC19__}
 function running(){var r=E('mushafReader');return !!(r&&r.classList.contains('active')&&d.body.classList.contains('reader-active')&&!d.body.classList.contains('h25-hifz')&&!d.body.classList.contains('h90-review')&&!d.body.classList.contains('h100-teacher'))}
 function toast(s){lastError=s;try{if(typeof w.toast==='function')w.toast(s)}catch(_){}}
 function percent(v){return Math.round(Number(v)*100)+'٪'}
 /* Read the SAME percentage buttons as the existing 'حجم نص صفحة المصحف' Tools card.
  Never store a separate readerZoom/scale setting or synthesize glyph scaling here. */
 function asciiNumber(s){return String(s||'').replace(/[٠-٩]/g,function(c){return String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))}).replace(/[۰-۹]/g,function(c){return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))})}
 function buttonPercent(b){
   var t=asciiNumber(b&&b.textContent).replace(/[\u200e\u200f\u061c\s]/g,'');
   if(!/[٪%]/.test(t))return 0;
   t=t.replace(/[٪%]/g,'');
   return /^\d{2,3}$/.test(t)?Number(t):0;
 }
 function nativeSizeGroup(){
   var nodes=d.querySelectorAll('b,strong,h2,h3,h4,h5,label,span,div');
   for(var i=0;i<nodes.length;i++){
     var title=(nodes[i].textContent||'').replace(/\s+/g,' ').trim();
     if(title!=='حجم نص صفحة المصحف'&&title!=='حجم صفحة المصحف')continue;
     var ancestor=nodes[i];
     for(var depth=0;depth<6&&ancestor;depth++,ancestor=ancestor.parentElement){
       var buttons=Array.prototype.slice.call(ancestor.querySelectorAll('button')).filter(function(b){return buttonPercent(b)>0});
       if(buttons.some(function(b){return buttonPercent(b)===100})&&
          buttons.some(function(b){return buttonPercent(b)===110})&&
          buttons.some(function(b){return buttonPercent(b)===120}))return buttons;
     }
   }
   return null;
 }
 function selectedPercent(buttons){
   if(!buttons)return 0;
   for(var i=0;i<buttons.length;i++){
     var b=buttons[i];
     if(b.matches('.on,.active,.selected,.is-active,[aria-pressed="true"],[aria-selected="true"],[data-selected="true"]'))return buttonPercent(b);
   }
   return 0;
 }
 function currentSize(){
   var buttons=nativeSizeGroup();
   var selected=selectedPercent(buttons);
   if(selected)return selected/100;
   var stored=Number(get('basair:p189:tools-size','0'));
   return stored>=100&&stored<=250?stored/100:1;
 }
 function refreshSize(){var b=E(SIZE_ID);if(!b)return;var v=currentSize();b.title='الحجم '+percent(v)+' — اضغط للتكبير أو اضغط مطولًا للأدوات';b.setAttribute('aria-label','تغيير حجم القراءة، الحالي '+percent(v)+'. اضغط مطولًا لعرض الخطوط والنسب المئوية');b.setAttribute('aria-busy',String(working))}
 function sizeStep(){
   var options=nativeSizeGroup();
   if(!options){
     var rc=w.__BASAIR_RC20__;
     if(rc&&typeof rc.install==='function')try{rc.install()}catch(_){}
     if(rc&&typeof rc.normalize==='function')try{rc.normalize()}catch(_){}
     options=nativeSizeGroup();
   }
   if(!options){toast('أداة حجم نص المصحف غير جاهزة؛ افتح أدوات الصفحة مرة واحدة');return false}
   var now=selectedPercent(options)||Math.round(currentSize()*100);
   var i=SCALES.reduce(function(best,n,j){return Math.abs(n*100-now)<Math.abs(SCALES[best]*100-now)?j:best},0);
   var next=Math.round(SCALES[(i+1)%SCALES.length]*100);
   var target=options.find(function(b){return buttonPercent(b)===next});
   if(!target||target.disabled){toast('خيار '+next+'٪ غير متاح في أدوات الصفحة');return false}
   /* One real native Tools click, the same handler as a manual percentage selection. */
   target.click();
   set('basair:p189:tools-size',next);
   refreshSize();changes++;
   return next/100;
 }
 function openNativeTools(){
   if(!running())return false;
   var rc=w.__BASAIR_RC20__;
   if(rc&&typeof rc.open==='function')rc.open();
   else{var button=E('dockTools')||E('ayahSideHandle');if(button)button.click();else return false}
   w.setTimeout(function(){
     var font=E('v181FontPrimary');
     if(font){
       if(font.getAttribute('data-rc20-open')!=='1'){
         var trigger=font.querySelector(':scope > .rc20SectionToggle');
         if(trigger)trigger.click();else font.setAttribute('data-rc20-open','1');
       }
       try{font.scrollIntoView({block:'nearest',behavior:'instant'})}catch(_){font.scrollIntoView()}
     }
   },75);
   return true;
 }
 function stopTimer(){if(timer){w.clearTimeout(timer);timer=0}}
 function pointerStart(ev){
   var b=ev.target&&ev.target.closest&&ev.target.closest('#'+SIZE_ID);
   if(!b||!running()||working||ev.button>0)return;
   stopTimer();down=true;held=false;px=ev.clientX;py=ev.clientY;
   timer=w.setTimeout(function(){timer=0;if(!down)return;held=true;openNativeTools()},500);
 }
 function pointerMove(ev){if(!down)return;if(Math.abs(ev.clientX-px)>14||Math.abs(ev.clientY-py)>14){down=false;stopTimer()}}
 function pointerEnd(){down=false;stopTimer()}
 function waitFrame(){return new Promise(function(resolve){(w.requestAnimationFrame||function(cb){w.setTimeout(cb,16)})(resolve)})}
 async function until(fn,maxMs){var stop=Date.now()+maxMs;while(Date.now()<stop){try{if(fn())return true}catch(_){}await waitFrame()}return false}
 function stage(){var r=E('mushafReader');return r&&(r.querySelector('.localPageStage')||r.querySelector('.continuousImagePage'))}
 function sourceImage(st){return st&&st.querySelector('img[data-mushaf-page]')}
 function painted(k){
   d.querySelectorAll('[data-v129-print],[data-v14-print]').forEach(function(b){var x=b.getAttribute('data-v129-print')||b.getAttribute('data-v14-print'),sel=x===k;b.classList.toggle('on',sel);b.classList.toggle('p188PrintSelected',sel);b.setAttribute('aria-pressed',String(sel))});
 }
 async function revert(saved){
   try{
     var a=w.__BASAIR_PAGE_AUTO_FONT_V1__;
     if(saved.auto&&a&&typeof a.apply==='function'){await Promise.resolve(a.apply(false));return}
     if(saved.font!=='original'&&rc19()){await Promise.resolve(rc19().setFont(saved.font,false));return}
     if(rc19())await Promise.resolve(rc19().setFont('original',false));
     if(rc18())await Promise.resolve(rc18().setPrint(saved.print,false));
   }catch(_){ }
 }
 async function choosePrint(k){
   if(!running()||working)return false;
   if(k==='blue'){toast('هذه الطبعة غير مفعّلة في النسخة المحمية');return false}
   if(k!=='original'&&k!=='tajwid')return false;
   var f=rc19(),p=rc18();
   if(!f||typeof f.setFont!=='function'||!p||typeof p.setPrint!=='function'){
     toast('محرك الطبعات غير جاهز');return false;
   }
   working=true;refreshSize();
   var a=w.__BASAIR_PAGE_AUTO_FONT_V1__,prev={font:get('stableFont','original'),print:get('v129PrintMode','original'),auto:!!(a&&a.enabled&&a.enabled())};
   try{
     if(a&&typeof a.disable==='function')a.disable();
     var reset=await Promise.resolve(f.setFont('original',false));
     if(reset===false)throw Error('تعذّر استعادة صفحة المصحف المصوّرة');
     var ready=await until(function(){return !d.body.classList.contains('stableDigital')&&!!stage()},3300);
     if(!ready)throw Error('صفحة المصحف المصوّرة غير جاهزة');
     if(k==='original'){
       var loaded=await until(function(){var im=sourceImage(stage());return !!(im&&im.complete&&im.naturalWidth>0)},5500);
       if(!loaded)throw Error('صفحة الطبعة الأصلية غير منزّلة؛ افحص تنزيل صفحات المصحف');
     }
     var result=await Promise.resolve(p.setPrint(k,false));
     if(result===false)throw Error(k==='tajwid'?'تعذّر تحميل صورة التجويد الملون':'تعذّر تطبيق الطبعة الأصلية');
     if(k==='tajwid'){
       var colored=await until(function(){var s=stage(),im=s&&s.querySelector('.rc18TajwidRaster');return !!(s&&s.classList.contains('rc18-tajwid-ready')&&im&&im.complete&&im.naturalWidth>0)},4500);
       if(!colored)throw Error('لم تكتمل صورة التجويد الملوّن لهذه الصفحة');
     }
     await waitFrame();await waitFrame();
     var displayed=!!(stage()&&!d.body.classList.contains('stableDigital')&&get('stableFont','original')==='original'&&get('v129PrintMode','original')===k);
     if(!displayed)throw Error('لم يكتمل الانتقال المرئي إلى الطبعة');
     lastPrint=k;painted(k);toast(k==='original'?'تم عرض الطبعة الأصلية':'تم عرض التجويد الملوّن');return true;
   }catch(err){await revert(prev);painted(get('v129PrintMode','original'));toast(String(err&&err.message||'تعذّر اختيار الطبعة'));return false}
   finally{working=false;refreshSize()}
 }
 function click(ev){
   if(!running())return;
   var t=ev.target&&ev.target.closest&&ev.target.closest('#'+SIZE_ID+', [data-v14-print], [data-v129-print]');if(!t)return;
   var size=t.id===SIZE_ID;
   var k=t.getAttribute('data-v14-print')||t.getAttribute('data-v129-print');
   if(!size&&['original','tajwid','blue'].indexOf(k)<0)return;
   ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
   if(size){if(held){held=false;return}if(!working)sizeStep();return}
   if(!working)choosePrint(k);
 }
 w.addEventListener('click',click,true);
 w.addEventListener('pointerdown',pointerStart,true);
 w.addEventListener('pointermove',pointerMove,true);
 w.addEventListener('pointerup',pointerEnd,true);
 w.addEventListener('pointercancel',pointerEnd,true);
 w.addEventListener('contextmenu',function(ev){var b=ev.target&&ev.target.closest&&ev.target.closest('#'+SIZE_ID);if(!b)return;ev.preventDefault();ev.stopPropagation();held=true;pointerEnd();openNativeTools()},true);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',refreshSize,{once:true});else refreshSize();
 w.__BASAIR_P189_NATIVE_TOOLS__={version:189,step:sizeStep,open:openNativeTools,select:choosePrint,refresh:refreshSize,
   status:function(){return{active:running(),busy:working,zoom:Number(get('readerZoom','1'))||1,lastPrint:lastPrint,changes:changes,lastError:lastError}}};
})(window,document);
