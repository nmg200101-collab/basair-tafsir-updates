/* BASAIR P185 | Tilawa QA-050, preserve V695 native Quran renderers.
 * Load AFTER P183 on the owner-qa channel only. No modifications to the Quran.
 * Single tap: next mode. Long press: all available prints/fonts.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P185_FONT_SWITCH__)return;
 var OLD='p181DockFont',BUTTON='p185FontButton',PICKER='p185FontPicker',TOOL='p185ToolsPicker';
 var MODES=[
  {key:'original',type:'print',label:'الطبعة الأصلية'},
  {key:'tajwid',type:'print',label:'التجويد الملوّن'},
  {key:'auto',type:'auto',label:'خط تلقائي'},
  {key:'uthmani',type:'digital',label:'العثماني الرقمي'},
  {key:'digital',type:'digital',label:'نسخ واضح'},
  {key:'amiri',type:'digital',label:'أميري قرآن'},
  {key:'ruqaa',type:'digital',label:'رقعة'},
  {key:'kufi',type:'digital',label:'كوفي'},
  {key:'traditional',type:'digital',label:'نسخ تقليدي'}
 ];
 var busy=false,lastTap=-1,longTimer=null,held=false,
     startX=0,startY=0,recentError='',successes=0,failures=0,menu=null,watchUntil=0;
 function $(id){return d.getElementById(id)}
 function get(k,alt){try{return w.localStorage.getItem(k)||alt}catch(_){return alt}}
 function P(){return w.__BASAIR_RC18__}
 function F(){return w.__BASAIR_RC19__}
 function A(){return w.__BASAIR_PAGE_AUTO_FONT_V1__}
 function running(){var r=$('mushafReader');return !!(r&&r.classList.contains('active')&&d.body.classList.contains('reader-active')&&!d.body.classList.contains('h25-hifz')&&!d.body.classList.contains('h90-review')&&!d.body.classList.contains('h100-teacher'))}
 function autoEnabled(){try{return !!(A()&&A().enabled&&A().enabled())}catch(_){return false}}
 function actual(){
  if(autoEnabled())return 2;
  var f=get('stableFont','original');
  if(f!=='original')for(var i=3;i<MODES.length;i++)if(MODES[i].key===f)return i;
  return get('v129PrintMode','original')==='tajwid'?1:0;
 }
 function frame(){return new Promise(function(ok){w.requestAnimationFrame?w.requestAnimationFrame(ok):w.setTimeout(ok,16)})}
 async function until(check,ms){var end=Date.now()+ms;while(Date.now()<end){try{if(check())return true}catch(_){ }await frame()}return false}
 function stage(){
  var root=$('mushafText');
  if(!root)return null;
  var st=root.querySelector('.localPageStage');
  if(!st)st=root.querySelector('.continuousImagePage');
  return st&&st.isConnected?st:null;
 }
 function pageImage(st){return st&&st.querySelector('img[data-mushaf-page]')}
 async function decoded(img,timeout){
  if(!img)return false;
  if(img.complete&&img.naturalWidth>0)return true;
  if(img.decode){try{await Promise.race([img.decode(),new Promise(function(_,reject){w.setTimeout(function(){reject(new Error('image-timeout'))},timeout)})]);return img.naturalWidth>0}catch(_){}}
  return until(function(){return img.complete&&img.naturalWidth>0},timeout);
 }
 function notify(message){recentError=message;try{if(typeof w.toast==='function')w.toast(message)}catch(_){ }var status=$('p185FontNotice');if(status)status.textContent=message}
 function snapshot(){return{font:get('stableFont','original'),print:get('v129PrintMode','original'),auto:autoEnabled()}}
 async function printReady(){
  var f=F(),auto=A();if(!f||typeof f.setFont!=='function')return {ok:false,why:'محرك المصحف غير جاهز'};
  if(auto&&typeof auto.disable==='function')auto.disable();
  await Promise.resolve(f.setFont('original',false));
  var ok=await until(function(){return !d.body.classList.contains('stableDigital')&&!!pageImage(stage())},1800);
  if(!ok)return{ok:false,why:'لم تجهز صفحة الطبعة الأصلية'};
  return{ok:true};
 }
 async function imageReady(){
  var st=stage(),img=pageImage(st);if(!img)return false;
  if(img.complete&&img.naturalWidth>0)return true;
  var bridge=w.__BASAIR_PRINT_BRIDGE__;
  if(bridge&&typeof bridge.hydratePage==='function'&&img.dataset.hydrating!=='1'){
   try{await Promise.resolve(bridge.hydratePage(img,Number(img.getAttribute('data-mushaf-page'))))}catch(_){ }
  }
  return decoded(img,4200);
 }
 async function setMode(mode){
  var f=F(),p=P(),auto=A();
  if(!f||typeof f.setFont!=='function'||!p||typeof p.setPrint!=='function')return{ok:false,why:'محرك تغيير الخط غير جاهز'};
  if(mode.type==='print'){
   var ready=await printReady();if(!ready.ok)return ready;
   if(mode.key==='original'&&!await imageReady())return{ok:false,why:'صفحة الطبعة الأصلية غير منزّلة؛ افتح إدارة التنزيل والتفعيل'};
   var result=await Promise.resolve(p.setPrint(mode.key,false));
   if(result===false)return{ok:false,why:'تعذّر تحميل '+mode.label};
   if(mode.key==='tajwid'){
    var colored=await until(function(){var s=stage(),im=s&&s.querySelector('.rc18TajwidRaster');return !!(s&&s.classList.contains('rc18-tajwid-ready')&&im&&im.complete&&im.naturalWidth>0)},4400);
    if(!colored)return{ok:false,why:'صورة التجويد الملوّن غير متاحة لهذه الصفحة'};
   }
   // A previous async digital render must not overwrite this printed selection.
   for(var retry=0;retry<2;retry++){
    await frame();await frame();
    if(d.body.classList.contains('stableDigital')){
     await Promise.resolve(f.setFont('original',false));
     await until(function(){return !!pageImage(stage())},1200);
     await Promise.resolve(p.setPrint(mode.key,false));
    }
   }
   var st=stage();
   var ok=!!(st&&!d.body.classList.contains('stableDigital')&&get('stableFont','original')==='original'&&get('v129PrintMode','original')===mode.key);
   if(mode.key==='tajwid')ok=ok&&st.classList.contains('rc18-tajwid-ready');
   if(!ok)return{ok:false,why:'لم تكتمل العودة إلى عرض الطبعة المصوّرة'};
   watchUntil=Date.now()+1500;
   return{ok:true};
  }
  if(auto&&auto.disable)auto.disable();
  await Promise.resolve(p.setPrint('original',false));
  if(mode.type==='auto'){
   if(!auto||typeof auto.apply!=='function')return{ok:false,why:'الخط التلقائي غير جاهز'};
   var autoResult=await Promise.resolve(auto.apply(false));
   if(autoResult===false||!autoEnabled())return{ok:false,why:'تعذّر اختيار الخط التلقائي'};
  }else{
   var res=await Promise.resolve(f.setFont(mode.key,false));
   if(res===false||get('stableFont','original')!==mode.key)return{ok:false,why:'تعذّر اختيار '+mode.label};
  }
  var rendered=await until(function(){var h=$('stableDigitalHost');return !!(d.body.classList.contains('stableDigital')&&h&&h.children.length)},2600);
  if(!rendered)return{ok:false,why:'لم يكتمل عرض الخط الرقمي'};
  return{ok:true};
 }
 async function restore(before){
  try{
   if(before.auto&&A()&&typeof A().apply==='function'){await Promise.resolve(A().apply(false));return}
   if(before.font!=='original'){await Promise.resolve(F().setFont(before.font,false));return}
   await Promise.resolve(F().setFont('original',false));
   if(before.print==='tajwid')await Promise.resolve(P().setPrint('tajwid',false));
   else await Promise.resolve(P().setPrint('original',false));
  }catch(_){ }
 }
 async function choose(index){
  if(!running()||busy||index<0||index>=MODES.length)return false;
  busy=true;lastTap=index;showState();var prior=snapshot(),mode=MODES[index],r;
  try{
   r=await setMode(mode);
   if(r.ok){successes++;notify('تم اختيار '+mode.label);return true}
   failures++;await restore(prior);notify(r.why||('تعذّر اختيار '+mode.label));return false;
  }catch(_){failures++;await restore(prior);notify('تعذّر تبديل '+mode.label);return false}
  finally{busy=false;showState()}
 }
 function next(){if(lastTap<0)lastTap=actual();return choose((lastTap+1)%MODES.length)}
 function hideMenu(){if(!menu)return;menu.hidden=true;menu.setAttribute('aria-hidden','true')}
 function openMenu(){install();if(!menu)return;menu.hidden=false;menu.setAttribute('aria-hidden','false');showState();var first=menu.querySelector('[data-p185-mode]');if(first)first.focus({preventScroll:true})}
 function modal(){
  if(menu)return menu;
  menu=d.createElement('div');menu.id=PICKER;menu.className='p185Overlay';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');menu.setAttribute('aria-label','الطبعات والخطوط');menu.setAttribute('aria-hidden','true');
  var box=d.createElement('section');box.className='p185Sheet';box.dir='rtl';
  var header=d.createElement('header');var h=d.createElement('strong');h.textContent='الطبعات والخطوط';var close=d.createElement('button');close.type='button';close.className='p185Close';close.textContent='إغلاق';close.addEventListener('click',hideMenu);header.append(h,close);
  var desc=d.createElement('p');desc.textContent='اضغط لاختيار نمط، أو اضغط ضغطة قصيرة على زر الخط للانتقال بالتتابع.';
  var grid=buildGrid('menu');var feedback=d.createElement('small');feedback.id='p185FontNotice';feedback.className='p185Feedback';
  var locked=d.createElement('p');locked.className='p185Locked';locked.textContent='الطبعة العثمانية المصوّرة معطّلة وفق حماية التلاوة. الخط العثماني الرقمي متاح.';
  box.append(header,desc,grid,feedback,locked);menu.appendChild(box);menu.addEventListener('click',function(e){if(e.target===menu)hideMenu()});d.body.appendChild(menu);
  return menu;
 }
 function buildGrid(target){
  var grid=d.createElement('div');grid.className='p185Grid';grid.setAttribute('data-p185-grid',target);
  MODES.forEach(function(m,i){var b=d.createElement('button');b.type='button';b.setAttribute('data-p185-mode',String(i));
   var name=d.createElement('b');name.textContent=m.label;var kind=d.createElement('small');kind.textContent=m.type==='print'?'طبعة مصوّرة':m.type==='auto'?'تلقائي':'خط رقمي';b.append(name,kind);grid.appendChild(b)});
  return grid;
 }
 function makeButton(){var b=$(BUTTON);if(b)return b;b=d.createElement('button');b.type='button';b.id=BUTTON;b.className='p185DockFont';
  var icon=d.createElement('span');icon.textContent='ض';icon.className='p185Glyph';var text=d.createElement('small');text.textContent='الخط';b.append(icon,text);
  b.addEventListener('pointerdown',function(e){if(e.button!==0||busy)return;startX=e.clientX;startY=e.clientY;held=false;clearTimeout(longTimer);longTimer=w.setTimeout(function(){held=true;openMenu()},460)});
  function cancel(){clearTimeout(longTimer);longTimer=null}
  b.addEventListener('pointermove',function(e){if(Math.abs(e.clientX-startX)>12||Math.abs(e.clientY-startY)>12)cancel()});
  b.addEventListener('pointerup',cancel);b.addEventListener('pointercancel',cancel);b.addEventListener('pointerleave',cancel);
  b.addEventListener('contextmenu',function(e){e.preventDefault();held=true;cancel();openMenu()});
  b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(held){held=false;return}next()});
  return b;
 }
 function install(){
  if(!running())return;
  var dock=$('mushafDock'),old=$(OLD),b=makeButton();
  if(dock){if(old){old.hidden=true;old.classList.add('p185Legacy');if(b.parentNode!==dock||b.nextSibling!==old)dock.insertBefore(b,old)}else if(b.parentNode!==dock)dock.appendChild(b)}
  modal();var pane=$('v140FontPane');if(pane&&!$(TOOL)){
   var section=d.createElement('section');section.id=TOOL;section.className='p185Tools';var label=d.createElement('strong');label.textContent='اختيار الخط أو الطبعة';section.append(label,buildGrid('tools'));pane.insertBefore(section,pane.firstChild);
  }
  showState();
 }
 function showState(){
  var i=actual(),b=$(BUTTON);if(b){b.disabled=busy;b.setAttribute('aria-busy',String(busy));b.setAttribute('aria-label','تغيير الخط. الحالي: '+MODES[i].label+'. ضغط مطول لعرض الخيارات');b.title='الحالي: '+MODES[i].label;}
  d.querySelectorAll('[data-p185-mode]').forEach(function(n){n.classList.toggle('p185On',Number(n.getAttribute('data-p185-mode'))===i);n.disabled=busy;n.setAttribute('aria-pressed',Number(n.getAttribute('data-p185-mode'))===i?'true':'false')});
 }
 d.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('[data-p185-mode]');if(!t)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(!busy)choose(Number(t.getAttribute('data-p185-mode'))).then(function(ok){if(ok&&menu&&!menu.hidden)hideMenu()})},true);
 d.addEventListener('keydown',function(e){if(e.key==='Escape'&&menu&&!menu.hidden)hideMenu()});
 // Guard stale late digital renders only briefly, without overriding native layout CSS.
 var fixing=false;var observer=new MutationObserver(function(){
  if(Date.now()>watchUntil||fixing||busy||!running())return;
  if(d.body.classList.contains('stableDigital')&&get('stableFont','original')==='original'){
   fixing=true;watchUntil=0;Promise.resolve(F().setFont('original',false)).then(function(){return P().setPrint(get('v129PrintMode','original'),false)}).catch(function(){}).finally(function(){fixing=false;showState()});
  }
 });observer.observe(d.body,{attributes:true,attributeFilter:['class']});
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',install,{once:true});else install();
 w.setInterval(function(){if(running()){install()}else if(menu&&!menu.hidden)hideMenu()},1900);
 w.__BASAIR_P185_FONT_SWITCH__={version:185,install:install,next:next,choose:function(key){var i=MODES.findIndex(function(x){return x.key===key});return choose(i)},open:openMenu,
  status:function(){return{active:running(),busy:busy,selected:MODES[actual()].label,successes:successes,failures:failures,last:recentError,menuOpen:!!(menu&&!menu.hidden)}}};
})(window,document);
