/* BASAIR P184 — owner QA050: unify REAL printed and digital Quran displays.
 * Load AFTER P183. Never changes native Quran assets, RC18/RC19 or app shell.
 * New IDs bypass P181/P182/P183 captive legacy listeners safely.
 */
(function (w,d){
 'use strict';
 if(w.__BASAIR_P184_PRINTED_DIGITAL__) return;
 var BTN='p184DockFont',PICK='p184FontPicker',OLD='p181DockFont';
 var MODES=[
  {id:'original',name:'الطبعة الأصلية',kind:'print'},
  {id:'tajwid',name:'التجويد الملوّن',kind:'print'},
  {id:'auto',name:'الخط التلقائي',kind:'auto'},
  {id:'uthmani',name:'العثماني الرقمي',kind:'digital'},
  {id:'digital',name:'النسخ الواضح',kind:'digital'},
  {id:'amiri',name:'أميري قرآن',kind:'digital'},
  {id:'ruqaa',name:'الرقعة',kind:'digital'},
  {id:'kufi',name:'الكوفي',kind:'digital'},
  {id:'traditional',name:'النسخ التقليدي',kind:'digital'}
 ];
 var cursor=null,busy=false,applied=0,failed=0,lastError='',lastPrint=null,resizeTimer=null;
 function E(x){return d.getElementById(x)}
 function read(k,def){try{return w.localStorage.getItem(k)||def}catch(_){return def}}
 function save(k,v){try{w.localStorage.setItem(k,String(v))}catch(_){}}
 function Print(){return w.__BASAIR_RC18__}function Font(){return w.__BASAIR_RC19__}function Auto(){return w.__BASAIR_PAGE_AUTO_FONT_V1__}
 function onReader(){var r=E('mushafReader');return !!(r&&r.classList.contains('active')&&d.body.classList.contains('reader-active')&&!d.body.classList.contains('h25-hifz')&&!d.body.classList.contains('h90-review')&&!d.body.classList.contains('h100-teacher'))}
 function autoEnabled(){try{return !!(Auto()&&typeof Auto().enabled==='function'&&Auto().enabled())}catch(_){return false}}
 function index(){
  if(autoEnabled())return 2;
  var f=read('stableFont','original');
  if(f!=='original'){for(var i=3;i<MODES.length;i++)if(MODES[i].id===f)return i;}
  return read('v129PrintMode','original')==='tajwid'?1:0;
 }
 function notify(t){lastError=t;try{if(typeof w.toast==='function')w.toast(t)}catch(_){}}
 function raf(){return new Promise(function(resolve){(w.requestAnimationFrame||function(cb){return w.setTimeout(cb,16)})(resolve)})}
 function getStage(){
  var reader=E('mushafReader');if(!reader)return null;
  var nodes=reader.querySelectorAll('.localPageStage,.continuousImagePage');
  for(var i=0;i<nodes.length;i++){
   var n=nodes[i],im=n.querySelector('img[data-mushaf-page]');
   if(n.isConnected&&im&&Number(im.getAttribute('data-mushaf-page'))>=1)return n;
  }
  return null;
 }
 function nativePage(){var st=getStage(),im=st&&st.querySelector('img[data-mushaf-page]');return Number(im&&im.getAttribute('data-mushaf-page'))||0}
 function waitImage(image,timeout){
  return new Promise(function(resolve){
   if(!image){resolve(false);return}
   if(image.complete&&image.naturalWidth>0){resolve(true);return}
   var done=false;
   function finish(ok){if(done)return;done=true;image.removeEventListener('load',good);image.removeEventListener('error',bad);w.clearTimeout(timer);resolve(ok)}
   function good(){finish(image.naturalWidth>0)}function bad(){finish(false)}
   image.addEventListener('load',good,{once:true});image.addEventListener('error',bad,{once:true});
   var timer=w.setTimeout(function(){finish(image.complete&&image.naturalWidth>0)},timeout||4500);
  });
 }
 function markPrint(key){
  d.body.classList.remove('stableDigital','p184-digital-view');d.body.classList.add('p184-print-view');
  d.body.setAttribute('data-v13-page-presentation','print');
  d.body.setAttribute('data-v144-print',key);
  var m=E('mushafText');if(m){m.style.removeProperty('display');m.removeAttribute('aria-hidden');}
  var host=E('stableDigitalHost');if(host){host.style.removeProperty('display');host.setAttribute('aria-hidden','true');}
  lastPrint=key;
 }
 function markDigital(){
  d.body.classList.remove('p184-print-view');d.body.classList.add('p184-digital-view','stableDigital');
  d.body.setAttribute('data-v13-page-presentation','digital');lastPrint=null;
  var host=E('stableDigitalHost');if(host)host.removeAttribute('aria-hidden');
 }
 async function prepareOriginal(){
  var f=Font();if(!f||typeof f.setFont!=='function')return {ok:false,reason:'محرك الخط الأساسي غير متاح'};
  var a=Auto();if(a&&typeof a.disable==='function')a.disable();
  var res=await Promise.resolve(f.setFont('original',false));
  if(res===false)return {ok:false,reason:'تعذّرت العودة إلى العرض الأصلي'};
  var stage=null;
  for(var i=0;i<65;i++){
   stage=getStage();if(stage)break;
   await raf();
  }
  if(!stage)return {ok:false,reason:'تعذّر تجهيز صفحة المصحف الأصلية'};
  var image=stage.querySelector('img[data-mushaf-page]'),page=Number(image.getAttribute('data-mushaf-page'));
  if(!(page>=1&&page<=604))return {ok:false,reason:'رقم الصفحة غير متاح'};
  // Reuse the existing page loader (cache, offline pack, then network).
  if(!(image.complete&&image.naturalWidth>0)){
   var bridge=w.__BASAIR_PRINT_BRIDGE__;
   if(bridge&&typeof bridge.hydratePage==='function'&&image.dataset.hydrating!=='1'){
    try{await Promise.resolve(bridge.hydratePage(image,page))}catch(_){/* waitImage reports actual failure */}
   }
   if(!await waitImage(image,5500))return {ok:false,reason:'صفحة المصحف الأصلية غير منزّلة؛ تحقق من تنزيل صفحات المصحف'};
  }
  return {ok:true,stage:stage,image:image,page:page};
 }
 async function applyMode(mode){
  var p=Print(),f=Font(),a=Auto();
  if(!p||typeof p.setPrint!=='function'||!f||typeof f.setFont!=='function')return{ok:false,reason:'محركات المصحف غير جاهزة'};
  if(mode.kind==='print'){
   var prep=await prepareOriginal();if(!prep.ok)return prep;
   // Choose via the native print renderer, not CSS-only appearance changes.
   var r=await Promise.resolve(p.setPrint(mode.id,false));
   var actual=read('v129PrintMode','original');
   if(r===false||actual!==mode.id)return{ok:false,reason:mode.id==='tajwid'?'صورة التجويد الملونة غير متاحة لهذه الصفحة':'تعذّر اختيار الطبعة الأصلية'};
   if(mode.id==='tajwid'){
    var stage=prep.stage,im=stage.querySelector('.rc18TajwidRaster');
    if(!stage.isConnected||!stage.classList.contains('rc18-tajwid-ready')||!im||!im.complete||im.naturalWidth<=0)return {ok:false,reason:'لم تكتمل صورة التجويد الملونة'};
   }
   markPrint(mode.id);await raf();await raf();
   // A late digital render can re-assert body.stableDigital; restore printed view.
   markPrint(mode.id);
   var visible=prep.image.isConnected&&prep.image.naturalWidth>0&&getStage();
   return {ok:!!visible,reason:'لم تظهر الصفحة المصوّرة'};
  }
  if(a&&typeof a.disable==='function')a.disable();
  if(await Promise.resolve(p.setPrint('original',false))===false)return{ok:false,reason:'تعذّرت تهيئة الخط الرقمي'};
  if(mode.kind==='auto'){
   if(!a||typeof a.apply!=='function')return{ok:false,reason:'الخط التلقائي غير متاح'};
   var autoResult=await Promise.resolve(a.apply(false));
   if(autoResult===false||!autoEnabled())return{ok:false,reason:'تعذّر تطبيق الخط التلقائي'};
  }else{
   var result=await Promise.resolve(f.setFont(mode.id,false));
   if(result===false||read('stableFont','original')!==mode.id)return{ok:false,reason:'تعذّر تحميل الخط '+mode.name};
  }
  markDigital();await raf();await raf();fitDigital();
  return {ok:true};
 }
 function fitDigital(){
  if(!onReader()||!d.body.classList.contains('stableDigital'))return;
  var host=E('stableDigitalHost');if(!host)return;
  var rows=host.querySelectorAll('.exactLine .unicodeLine,.b327TextLine .b327UnicodeLine,.b327UnicodeLine');
  rows.forEach(function(line){
   var parent=line.parentElement;if(!parent)return;
   line.style.removeProperty('font-size');
   var maxWidth=parent.clientWidth-6;
   if(maxWidth<40)return;
   var width=Math.max(line.scrollWidth,line.getBoundingClientRect().width);
   if(width<=maxWidth+2)return;
   var original=parseFloat(w.getComputedStyle(line).fontSize)||24;
   var adjusted=Math.max(11,Math.min(original,original*(maxWidth/width)*.96));
   if(adjusted<original)line.style.setProperty('font-size',adjusted.toFixed(2)+'px','important');
  });
 }
 async function choose(idx){
  if(!onReader()||busy)return false;
  if(idx<0||idx>=MODES.length)return false;
  busy=true;render();cursor=idx;save('basair:p184:cursor',idx);
  var mode=MODES[idx],previousFont=read('stableFont','original'),previousPrint=read('v129PrintMode','original'),previousAuto=autoEnabled();
  var result;
  try{
   result=await applyMode(mode);
   if(result.ok){applied++;notify('تم اختيار '+mode.name);return true;}
   failed++;
   // A failed print switch may already have changed RC19 to original. Restore
   // the prior visible digital view instead of leaving a blank reader frame.
   if(previousFont!=='original'&&!previousAuto&&Font()&&typeof Font().setFont==='function'){
    try{await Promise.resolve(Font().setFont(previousFont,false));markDigital();fitDigital()}catch(_){/* do not obscure the original error */}
   }else if(previousAuto&&Auto()&&typeof Auto().apply==='function'){
    try{await Promise.resolve(Auto().apply(false));markDigital()}catch(_){/* native engine owns the recovery */}
   }else if(previousPrint==='original'&&getStage()&&getStage().querySelector('img[data-mushaf-page]')?.naturalWidth>0){
    try{await Promise.resolve(Print().setPrint('original',false));markPrint('original')}catch(_){/* keep native fallback */}
   }
   notify(result.reason||('تعذّر اختيار '+mode.name));
   return false;
  }catch(e){failed++;notify('تعذّر الانتقال إلى '+mode.name);return false;}
  finally{busy=false;render();}
 }
 function next(){if(cursor===null){cursor=index();}return choose((cursor+1)%MODES.length)}
 function render(){
  var b=E(BTN),mode=MODES[index()];
  if(b){b.disabled=busy;b.setAttribute('aria-busy',busy?'true':'false');b.setAttribute('aria-label','تغيير الخط والطبعة؛ الحالي: '+mode.name);b.title=mode.name;
   b.classList.toggle('p184-busy',busy);}
  d.querySelectorAll('[data-p184-mode]').forEach(function(el){var on=el.getAttribute('data-p184-mode')===mode.id;
   el.classList.toggle('p184-selected',on);el.setAttribute('aria-pressed',on?'true':'false');el.disabled=busy;});
  d.querySelectorAll('.p184CurrentMode').forEach(function(el){el.textContent='المحدد: '+mode.name});
 }
 function makeButton(){
  var b=E(BTN);if(b)return b;
  b=d.createElement('button');b.id=BTN;b.type='button';b.className='p184DockFont';
  var icon=d.createElement('span');icon.className='p184DockGlyph';icon.textContent='ض';
  var label=d.createElement('small');label.textContent='الخط';
  b.appendChild(icon);b.appendChild(label);return b;
 }
 function makePicker(id){
  var root=d.createElement('section');root.className='p184Picker';root.id=id;
  var title=d.createElement('div');title.className='p184PickerTitle';
  var name=d.createElement('strong');name.textContent='الطبعات والخطوط';
  var current=d.createElement('small');current.className='p184CurrentMode';title.append(name,current);
  var grid=d.createElement('div');grid.className='p184ModeGrid';
  MODES.forEach(function(m){var b=d.createElement('button');b.type='button';b.setAttribute('data-p184-mode',m.id);
   var l=d.createElement('strong');l.textContent=m.name;var sub=d.createElement('small');sub.textContent=m.kind==='print'?'طبعة مصوّرة':m.kind==='auto'?'اختيار آلي':'خط رقمي';b.append(l,sub);grid.appendChild(b);});
  root.append(title,grid);return root;
 }
 function install(){
  if(!d.body)return;
  var dock=E('mushafDock'),old=E(OLD),b=makeButton();
  if(dock){if(old){old.classList.add('p184LegacyFont');old.hidden=true;}
   if(b.parentElement!==dock){if(old&&old.parentElement===dock)dock.insertBefore(b,old);else dock.appendChild(b);}}
  var pane=E('v140FontPane');if(pane&&!E(PICK))pane.insertBefore(makePicker(PICK),pane.firstChild);
  var sheet=E('fontSheet'),panel=sheet&&sheet.querySelector('.fontPanel');
  if(panel&&!E('p184FontSheetPicker')){var insert=panel.querySelector('.fontChoices');var picker=makePicker('p184FontSheetPicker');
   if(insert)panel.insertBefore(picker,insert);else panel.appendChild(picker);}
  render();
 }
 d.addEventListener('click',function(ev){
  var target=ev.target;
  var b=target&&target.closest&&target.closest('#'+BTN+', [data-p184-mode]');if(!b)return;
  ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
  if(busy||!onReader())return;
  var mode=b.getAttribute('data-p184-mode');if(mode){for(var i=0;i<MODES.length;i++)if(MODES[i].id===mode){choose(i);break;}}
  else next();
 },true);
 function init(){install();
  // Legacy P181 creates the old button lazily and RC20 rebuilds its Tools pane.
  w.setInterval(function(){install();if(onReader()&&lastPrint){markPrint(lastPrint)}},1600);
  d.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#ayahSideHandle,[data-v140-tab]'))w.setTimeout(install,100);},false);
  w.addEventListener('resize',function(){if(resizeTimer)w.clearTimeout(resizeTimer);resizeTimer=w.setTimeout(fitDigital,140)});
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P184_PRINTED_DIGITAL__={version:184,next:next,choose:function(id){var i=MODES.findIndex(function(x){return x.id===id});return choose(i)},refresh:install,
  status:function(){return{active:onReader(),busy:busy,mode:MODES[index()].name,applied:applied,failures:failed,lastError:lastError,printedView:d.body.classList.contains('p184-print-view'),stagePage:nativePage()}}};
})(window,document);
