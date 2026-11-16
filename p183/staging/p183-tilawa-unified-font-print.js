/* BASAIR P183 — one canonical font/print switcher for bottom dock and Tools.
 * Owner-locked QA-050: additive layer AFTER P182; keeps original RC18/RC19
 * engines and never modifies Qur'an text, images or playback.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P183_UNIFIED_PRINT_FONT__)return;
 var ID='p181DockFont',KEY='basair:tilawa:p183:cycleIndex';
 var MODES=[
  {kind:'print',key:'original',name:'الطبعة الأصلية'},
  {kind:'print',key:'tajwid',name:'التجويد الملوّن'},
  {kind:'auto',key:'auto',name:'الخط التلقائي'},
  {kind:'font',key:'uthmani',name:'العثماني الرقمي'},
  {kind:'font',key:'digital',name:'النسخ الواضح'},
  {kind:'font',key:'amiri',name:'أميري قرآن'},
  {kind:'font',key:'ruqaa',name:'الرقعة'},
  {kind:'font',key:'kufi',name:'الكوفي'},
  {kind:'font',key:'traditional',name:'النسخ التقليدي'}
 ];
 var busy=false,cursor=null,changes=0,failures=0,last='',history=[];
 function $(x){return d.getElementById(x)}
 function read(k,f){try{return w.localStorage.getItem(k)||f}catch(e){return f}}
 function save(k,v){try{w.localStorage.setItem(k,String(v))}catch(e){}}
 function P(){return w.__BASAIR_RC18__}function F(){return w.__BASAIR_RC19__}function A(){return w.__BASAIR_PAGE_AUTO_FONT_V1__}
 function auto(){var a=A();try{return !!(a&&typeof a.enabled==='function'&&a.enabled())}catch(e){return false}}
 function active(){var r=$('mushafReader');return !!(r&&r.classList.contains('active')&&d.body.classList.contains('reader-active')&&!d.body.classList.contains('h25-hifz')&&!d.body.classList.contains('h90-review')&&!d.body.classList.contains('h100-teacher'))}
 function current(){
  if(auto())return 2;
  var f=read('stableFont','original');
  if(f!=='original')for(var i=3;i<MODES.length;i++)if(MODES[i].key===f)return i;
  return read('v129PrintMode','original')==='tajwid'?1:0;
 }
 function init(){if(cursor!==null)return;var n=Number(read(KEY,'-1'));cursor=Number.isInteger(n)&&n>=0&&n<MODES.length?n:current();if(cursor!==current())cursor=current()}
 function notify(s){last=s;history.push(s);if(history.length>10)history.shift();try{if(typeof w.toast==='function')w.toast(s)}catch(e){}}
 function paint(){
  var b=$(ID);if(b){var m=MODES[current()];b.disabled=busy;b.setAttribute('aria-busy',String(busy));b.setAttribute('aria-label',busy?'جارٍ تغيير الخط أو الطبعة':'تغيير الخط؛ الحالي '+m.name+'؛ اضغط للنمط التالي');b.dataset.p183Active=m.key;var small=b.querySelector('small');if(small)small.textContent=busy?'جارٍ التبديل':m.name}
  d.querySelectorAll('[data-v129-print],[data-v181font],[data-final-font]').forEach(function(e){var v=e.getAttribute('data-v129-print')||e.getAttribute('data-v181font')||e.getAttribute('data-final-font');var ok=e.hasAttribute('data-v129-print')?(v==='original'&&current()===0||v==='tajwid'&&current()===1):v===MODES[current()].key;e.classList.toggle('on',!!ok);e.setAttribute('aria-pressed',String(!!ok))});
 }
 function pageImage(){var r=$('mushafReader');return r&&r.querySelector('.localPageStage img[data-mushaf-page],.continuousImagePage img[data-mushaf-page]')}
 function frame(){return new Promise(function(res){(w.requestAnimationFrame||w.setTimeout)(function(){res()},16)})}
 async function prepare(){
  var f=F();if(!f||typeof f.setFont!=='function')return false;
  if(await Promise.resolve(f.setFont('original',false))===false)return false;
  for(var n=0;n<8;n++){var i=pageImage();if(i&&i.closest('.localPageStage,.continuousImagePage')?.isConnected)return true;await frame()}
  return false;
 }
 function readyColor(){var st=pageImage()?.closest('.localPageStage,.continuousImagePage');if(!st)return false;var im=st.querySelector('.rc18TajwidRaster');return !!(st.classList.contains('rc18-tajwid-ready')&&im&&im.complete&&im.naturalWidth>0)}
 async function apply(i){
  var mode=MODES[i],p=P(),f=F(),a=A();
  if(!p||typeof p.setPrint!=='function'||!f||typeof f.setFont!=='function')return {ok:false,reason:'محرك الطبعة أو الخط غير جاهز'};
  if(mode.kind==='print'){
   if(a&&typeof a.disable==='function')a.disable();
   if(!await prepare())return {ok:false,reason:'صفحة المصحف المصوّرة غير مهيّأة'};
   var x=await Promise.resolve(p.setPrint(mode.key,false));
   var ok=read('v129PrintMode','original')===mode.key&&read('stableFont','original')==='original';
   if(mode.key==='tajwid')ok=ok&&readyColor();
   return {ok:x!==false&&ok,reason:mode.key==='tajwid'?'صورة التجويد لهذه الصفحة غير متاحة أو لم تُحمّل':'تعذّر تجهيز الطبعة الأصلية'};
  }
  if(mode.kind==='auto'){
   if(a&&typeof a.disable==='function')a.disable();
   await Promise.resolve(p.setPrint('original',false));
   if(!a||typeof a.apply!=='function')return {ok:false,reason:'محرك الخط التلقائي غير جاهز'};
   var x=await Promise.resolve(a.apply(false));
   return {ok:x!==false&&auto(),reason:'تعذّر تشغيل الخط التلقائي'};
  }
  if(a&&typeof a.disable==='function')a.disable();
  if(await Promise.resolve(p.setPrint('original',false))===false)return {ok:false,reason:'تعذّر تهيئة الخط الرقمي'};
  var y=await Promise.resolve(f.setFont(mode.key,false));
  return {ok:y!==false&&!auto()&&read('stableFont','original')===mode.key,reason:'تعذّر اختيار الخط '+mode.name};
 }
 async function choose(i,cycle){
  if(busy||!active())return false;init();busy=true;paint();
  var tried=[],selected=-1;
  try{
   for(var n=0;n<(cycle?MODES.length:1);n++){
    var k=(i+n)%MODES.length;cursor=k;save(KEY,k);
    var x;try{x=await apply(k)}catch(e){x={ok:false,reason:'خطأ تهيئة '+MODES[k].name}}
    if(x.ok){selected=k;break}
    failures++;tried.push(MODES[k].name);
    if(!cycle){notify(x.reason||'تعذّر اختيار '+MODES[k].name);break}
   }
   if(selected>=0){changes++;notify(tried.length?'تعذّر تحميل '+tried.join('، ')+'؛ عُرض '+MODES[selected].name:'الخط الحالي: '+MODES[selected].name);return true}
   if(cycle)notify('لا تتوفر طبعة أو خط قابل للاستخدام الآن');
   return false
  }finally{busy=false;paint()}
 }
 function next(){init();return choose((cursor+1)%MODES.length,true)}
 function fromSettings(ev){
  var e=ev.target&&ev.target.closest&&ev.target.closest('[data-v129-print],[data-v181font],[data-stfont],[data-final-font],[data-v119-font]');
  if(!e)return null;
  var k=e.getAttribute('data-v129-print')||e.getAttribute('data-v181font')||e.getAttribute('data-stfont')||e.getAttribute('data-final-font')||e.getAttribute('data-v119-font');
  if(k==='blue'||k==='muallam')return {blocked:true};
  if(k==='original2')k='original';
  for(var i=0;i<MODES.length;i++)if(MODES[i].key===k)return {index:i};
  return null
 }
 // Window capture precedes RC18's legacy document capture; one unified path.
 w.addEventListener('click',function(ev){
  if(!active())return;
  var b=ev.target&&ev.target.closest&&ev.target.closest('#'+ID);
  var t=b?{cycle:true}:fromSettings(ev);if(!t)return;
  ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
  if(busy)return;
  if(t.blocked){notify('هذه الطبعة معطلة في نسخة المصحف الحالية');return}
  if(t.cycle)next();else choose(t.index,false)
 },true);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',paint,{once:true});else paint();
 w.setInterval(function(){if(!busy&&active())paint()},2300);
 w.__BASAIR_P183_UNIFIED_PRINT_FONT__={version:183,next:next,choose:choose,refresh:paint,status:function(){return{busy:busy,active:active(),selected:MODES[current()].name,changes:changes,failures:failures,cursor:cursor,lastNotice:last,diagnostics:history.slice()}}};
})(window,document);
