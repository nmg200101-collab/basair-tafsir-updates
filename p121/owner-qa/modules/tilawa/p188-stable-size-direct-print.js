/* BASAIR P188 — QA050 stable size shortcut + direct native print cards.
 * Load strictly after P187. Does not replace RC18, RC19, fonts or page HTML.
 * Short tap: 100% -> 110% -> 120% -> 100%. Long press: existing RC20 Tools.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P188_NATIVE_TOOLS__)return;
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
 function refreshSize(){var b=E(SIZE_ID);if(!b)return;var v=Number(get('readerZoom','1'))||1;b.title='الحجم '+percent(v)+' — اضغط للتكبير أو اضغط مطولًا للأدوات';b.setAttribute('aria-label','تغيير حجم القراءة، الحالي '+percent(v)+'. اضغط مطولًا لعرض الخطوط والنسب المئوية');b.setAttribute('aria-busy',String(working))}
 function sizeStep(){
   var now=Number(get('readerZoom','1'))||1;
   var index=SCALES.reduce(function(best,n,i){return Math.abs(n-now)<Math.abs(SCALES[best]-now)?i:best},0);
   var next=SCALES[(index+1)%SCALES.length];
   set('readerZoom',next);d.documentElement.style.setProperty('--readerZoom',String(next));
   /* Native V181 resizes digital glyphs and refits their lines; printed page is scaled via --readerZoom. */
   var native=w.__BASAIR_V181_TEST__;
   if(native&&typeof native.setFontScale==='function'){
     try{native.setFontScale(next,false)}catch(_){/* the printed-page zoom remains available */}
   }
   refreshSize();changes++;toast('حجم القراءة '+percent(next));return next;
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
 w.__BASAIR_P188_NATIVE_TOOLS__={version:188,step:sizeStep,open:openNativeTools,select:choosePrint,refresh:refreshSize,
   status:function(){return{active:running(),busy:working,zoom:Number(get('readerZoom','1'))||1,lastPrint:lastPrint,changes:changes,lastError:lastError}}};
})(window,document);
