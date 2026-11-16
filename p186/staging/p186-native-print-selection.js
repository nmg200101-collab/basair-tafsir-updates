/* BASAIR P186 — keep P185 interface, repair native print selection only.
 * QA-050 protected: do not alter Quran text, font engine, page data or APK.
 * Load after P185. Window capture preempts its document/target handlers.
 */
(function (w,d) {
 'use strict';
 if (w.__BASAIR_P186_PRINT_SELECTION__) return;
 var choices=['original','tajwid','auto','uthmani','digital','amiri','ruqaa','kufi','traditional'];
 var busy=false,cursor=null,desiredPrint=null,attempts=0,repairs=0,lastFailure='',repairing=false,repairTimer=0;
 var notices=[];
 function E(id){return d.getElementById(id)}
 function stored(k,alt){try{return w.localStorage.getItem(k)||alt}catch(_){return alt}}
 function P(){return w.__BASAIR_RC18__}
 function F(){return w.__BASAIR_RC19__}
 function A(){return w.__BASAIR_PAGE_AUTO_FONT_V1__}
 function api(){return w.__BASAIR_P185_FONT_SWITCH__}
 function onReader(){return !!(d.body.classList.contains('reader-active')&&E('mushafReader')&&E('mushafReader').classList.contains('active'))}
 function activeIndex(){var a=A();if(a&&a.enabled&&a.enabled())return 2;var f=stored('stableFont','original');var k=choices.indexOf(f);return k>=3?k:(stored('v129PrintMode','original')==='tajwid'?1:0)}
 function readyStage(){var r=E('mushafReader');return r&&(r.querySelector('.localPageStage')||r.querySelector('.continuousImagePage'))}
 function baseImage(s){return s&&s.querySelector('img[data-mushaf-page]')}
 function frame(){return new Promise(function(resolve){(w.requestAnimationFrame||function(cb){w.setTimeout(cb,16)})(resolve)})}
 async function until(check,limit){var stop=Date.now()+limit;while(Date.now()<stop){try{if(check())return true}catch(_){}await frame()}return false}
 function report(text){lastFailure=text;notices.push(text);if(notices.length>12)notices.shift();var n=E('p185FontNotice');if(n)n.textContent=text;try{if(typeof w.toast==='function')w.toast(text)}catch(_){}}
 function paint(){try{api()&&api().install&&api().install()}catch(_){}var b=E('p185FontButton');if(b){b.disabled=busy;b.setAttribute('aria-busy',String(busy));b.setAttribute('title',choices[activeIndex()]||'الخط');}}
 async function hydrateOriginal(){
  var s=readyStage(),im=baseImage(s);if(!im)return false;
  if(!(im.complete&&im.naturalWidth>0)){
   var bridge=w.__BASAIR_PRINT_BRIDGE__,page=Number(im.getAttribute('data-mushaf-page'))||0;
   if(bridge&&typeof bridge.hydratePage==='function'&&page>=1&&page<=604&&im.dataset.hydrating!=='1'){
    try{await Promise.race([Promise.resolve(bridge.hydratePage(im,page)),new Promise(function(resolve){w.setTimeout(resolve,4200)})])}catch(_){}
   }
   if(!await until(function(){return im.isConnected&&im.complete&&im.naturalWidth>0},2600))return false;
  }
  // Native hydration may have hidden the image after an earlier failed download.
  im.style.removeProperty('display');var ph=s.querySelector('.pageDownloadPlaceholder');if(ph)ph.remove();
  return true;
 }
 async function restorePrinted(key){
  var f=F(),p=P();if(!f||!p||typeof f.setFont!=='function'||typeof p.setPrint!=='function')return false;
  var a=A();if(a&&typeof a.disable==='function')a.disable();
  await Promise.resolve(f.setFont('original',false));
  if(!await until(function(){return !!readyStage()&&!d.body.classList.contains('stableDigital')},3600))return false;
  if(key==='original'&&!await hydrateOriginal())return false;
  var ok=await Promise.resolve(p.setPrint(key,false));if(ok===false)return false;
  if(key==='tajwid'){
   if(!await until(function(){var s=readyStage(),i=s&&s.querySelector('.rc18TajwidRaster');return !!(s&&s.classList.contains('rc18-tajwid-ready')&&i&&i.complete&&i.naturalWidth>0)},4700))return false;
  }
  await frame();
  var s=readyStage();return !!(s&&!d.body.classList.contains('stableDigital')&&stored('stableFont','original')==='original'&&stored('v129PrintMode','original')===key&&
   (key==='tajwid'?s.classList.contains('rc18-tajwid-ready'):!!baseImage(s)));
 }
 async function revert(snapshot){
  try{
   desiredPrint=null;
   if(snapshot.auto){var a=A();if(a&&a.apply)await Promise.resolve(a.apply(false));return}
   if(snapshot.font!=='original'){await Promise.resolve(F().setFont(snapshot.font,false));return}
   await Promise.resolve(F().setFont('original',false));
   await Promise.resolve(P().setPrint(snapshot.print,false));
  }catch(_){}
 }
 async function selected(index){
  if(busy||!onReader()||!(index>=0&&index<choices.length))return false;
  busy=true;cursor=index;attempts++;paint();
  var prev={font:stored('stableFont','original'),print:stored('v129PrintMode','original'),auto:!!(A()&&A().enabled&&A().enabled())};
  var key=choices[index],ok=false;
  try{
   if(index<2){
    desiredPrint=key;
    ok=await restorePrinted(key);
    if(ok){repairs=0;report('تم اختيار '+(key==='original'?'الطبعة الأصلية':'التجويد الملوّن'))}
    else{await revert(prev);report(key==='original'?'تعذّر تحميل صفحة الطبعة الأصلية. تحقق من تنزيل صفحات المصحف في إدارة التنزيل والتفعيل.':'تعذّر إظهار صورة التجويد الملوّن. لم يتغير نص المصحف.');}
   }else{
    desiredPrint=null;
    if(api()&&api().choose)ok=await Promise.resolve(api().choose(key));
    if(!ok)report('تعذّر اختيار الخط المطلوب');
   }
   if(ok){var popup=E('p185FontPicker');if(popup&&!popup.hidden){popup.hidden=true;popup.setAttribute('aria-hidden','true')}}
   return !!ok;
  }catch(e){await revert(prev);report('تعذّر تنفيذ التغيير؛ أعيد النمط السابق');return false}
  finally{busy=false;paint()}
 }
 function advance(){if(cursor===null)cursor=activeIndex();return selected((cursor+1)%choices.length)}
 // Use window capture: native P183/P185 listeners run later on document or button.
 w.addEventListener('click',function(ev){
  var t=ev.target&&ev.target.closest&&ev.target.closest('#p185FontButton,[data-p185-mode]');
  if(!t||!onReader())return;
  ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
  if(t.id==='p185FontButton'){
   var popup=E('p185FontPicker');if(popup&&!popup.hidden)return; // long-press release click
   if(!busy)advance();return;
  }
  var idx=Number(t.getAttribute('data-p185-mode'));if(!busy&&Number.isInteger(idx))selected(idx);
 },true);
 // A previous asynchronous digital render may arrive after native print selection.
 // Reassert via the native renderer, never force a page with CSS-only appearance.
 var observer=new MutationObserver(function(){
  if(!onReader()||busy||repairing||desiredPrint===null||!d.body.classList.contains('stableDigital'))return;
  if(stored('stableFont','original')!=='original'){desiredPrint=null;return}
  if(repairs>=3)return;
  if(repairTimer)w.clearTimeout(repairTimer);
  repairTimer=w.setTimeout(async function(){
   if(!onReader()||busy||repairing||desiredPrint===null)return;
   repairing=true;repairs++;
   try{await restorePrinted(desiredPrint)}catch(_){}finally{repairing=false;paint()}
  },100);
 });observer.observe(d.body,{attributes:true,attributeFilter:['class']});
 w.__BASAIR_P186_PRINT_SELECTION__={version:186,choose:selected,next:advance,status:function(){return{busy:busy,desiredPrint:desiredPrint,current:choices[activeIndex()],attempts:attempts,repairs:repairs,lastFailure:lastFailure,notices:notices.slice()}}};
})(window,document);
