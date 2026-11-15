/* BASAIR P181 — QA-050 owner-locked Tilawa controls: top night + tap-to-cycle font.
 * Additive WebView enhancement for V695; no native/printed Qur'an rendering change.
 * Reuses the original dockNight, RC18 print and RC19 digital font engines.
 */
(function (w, d) {
 'use strict';
 if (w.__BASAIR_P181_NIGHT_FONT_CYCLE__) return;
 var NIGHT='dockNight', FONT='p181DockFont', TOP='bqUnifiedSectionHeaderP26';
 var PRINT=w.__BASAIR_RC18__, DIGITAL=w.__BASAIR_RC19__;
 var variants=[
  {kind:'print',key:'original',name:'الطبعة الأصلية'},
  {kind:'print',key:'tajwid',name:'التجويد الملوّن'},
  {kind:'print',key:'blue',name:'الطبعة العثمانية'},
  {kind:'auto',key:'auto',name:'الخط التلقائي'},
  {kind:'digital',key:'uthmani',name:'الخط العثماني الرقمي'},
  {kind:'digital',key:'digital',name:'النسخ الواضح'},
  {kind:'digital',key:'amiri',name:'أميري قرآن'},
  {kind:'digital',key:'ruqaa',name:'خط الرقعة'},
  {kind:'digital',key:'kufi',name:'الخط الكوفي'},
  {kind:'digital',key:'traditional',name:'النسخ التقليدي'}
 ];
 var night=null, busy=false, initial=false, swaps=0, lastName='', reentrant=false;
 function $(id){return d.getElementById(id);}
 function read(k, fallback){try{return w.localStorage.getItem(k)||fallback;}catch(e){return fallback;}}
 function active(){var r=$('mushafReader');return !!(r&&r.classList.contains('active')&&d.body.classList.contains('reader-active')&&!d.body.classList.contains('h25-hifz')&&!d.body.classList.contains('h90-review')&&!d.body.classList.contains('h100-teacher'));}
 function available(){PRINT=w.__BASAIR_RC18__;DIGITAL=w.__BASAIR_RC19__;return PRINT&&typeof PRINT.setPrint==='function'&&DIGITAL&&typeof DIGITAL.setFont==='function';}
 function auto(){var a=w.__BASAIR_PAGE_AUTO_FONT_V1__;return a&&typeof a.enabled==='function'&&a.enabled();}
 function current(){
  if(auto())return 3;
  var f=read('stableFont','original');
  if(f!=='original')for(var i=4;i<variants.length;i++)if(variants[i].key===f)return i;
  var p=read('v129PrintMode','original');
  if(p==='tajwid')return 1;if(p==='blue')return 2;
  return 0;
 }
 function notify(message){
  // Native toast comes from the original print/font engines. No fake success toast.
  var b=$(FONT);if(b)b.title=message;
  lastName=message;
 }
 function update(){
  var b=$(FONT);if(!b)return;
  var a=variants[current()];
  b.setAttribute('aria-label','تغيير الخط. الحالي: '+a.name+'. اضغط لاختيار النمط التالي');
  b.setAttribute('aria-busy',busy?'true':'false');
  b.classList.toggle('p181Busy',busy);
  b.dataset.p181Active=a.key;
  b.title='تغيير الخط · الحالي: '+a.name;
  if(night){var dark=d.body.classList.contains('dark');night.classList.toggle('p181NightActive',dark);night.setAttribute('aria-pressed',dark?'true':'false');night.title=dark?'إيقاف الوضع الليلي':'تفعيل الوضع الليلي';}
 }
 function setAutoOff(){var a=w.__BASAIR_PAGE_AUTO_FONT_V1__;if(a&&typeof a.disable==='function')a.disable();}
 function finalize(success, expected){
  busy=false;
  if(success)swaps++;
  update();
  if(success)notify('الخط الحالي: '+expected.name);
 }
 function select(variant){
  if(variant.kind==='auto'){
   var a=w.__BASAIR_PAGE_AUTO_FONT_V1__;
   if(!a||typeof a.apply!=='function')return Promise.resolve(false);
   PRINT.setPrint('original',false);
   return Promise.resolve(a.apply(true)).then(function(){return auto();});
  }
  setAutoOff();
  if(variant.kind==='digital'){
   return Promise.resolve(PRINT.setPrint('original',false)).then(function(){
     DIGITAL.setFont(variant.key,true);
     return read('stableFont','original')===variant.key;
   });
  }
  // A bitmap/coloured print uses the official RC18 engine only, never CSS
  // font substitution over the scanned Mushaf page or Tajwid marks.
  DIGITAL.setFont('original',false);
  return Promise.resolve(PRINT.setPrint(variant.key,true)).then(function(result){
    return result!==false && read('v129PrintMode','original')===variant.key;
  });
 }
 function cycle(ev){
  if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}
  if(!active()||busy)return false;
  if(!available()){notify('أداة الخطوط الأصلية غير جاهزة');return false;}
  var next=variants[(current()+1)%variants.length];busy=true;update();
  try{Promise.resolve(select(next)).then(function(ok){finalize(ok,next);},function(){finalize(false,next);});}
  catch(e){finalize(false,next);}
  return true;
 }
 function makeFont(){
  var b=$(FONT);if(b)return b;
  b=d.createElement('button');b.type='button';b.id=FONT;b.className='p181FontCycle';
  var icon=d.createElement('span');icon.textContent='ض+';
  var caption=d.createElement('small');caption.textContent='تغيير الخط';
  b.append(icon,caption);b.addEventListener('click',cycle,true);
  return b;
 }
 function sync(){
  if(reentrant)return false;reentrant=true;
  try{
   var dock=$('mushafDock'),host=$(TOP),reader=$('mushafReader');
   if(!dock||!reader)return false;
   night=night||$(NIGHT);
   if(!night)return false;
   var font=makeFont(),on=active();
   if(on){
    if(host){
     host.classList.add('p181NightHeader');
     if(night.parentElement!==host)host.appendChild(night);
     night.classList.add('p181NightTop');
     night.setAttribute('aria-label','الوضع الليلي للتلاوة');
    }else{ // Don't lose access if a legacy/embedded header isn't mounted.
     if(night.parentElement!==dock)dock.insertBefore(night,$('dockTafsirStable'));
     night.classList.remove('p181NightTop');
    }
    if(font.parentElement!==dock){
     var anchor=$('dockTafsirStable');
     if(anchor&&anchor.parentElement===dock)dock.insertBefore(font,anchor);
     else dock.appendChild(font);
    }
   }else{
    // The original dock Night node and all of its click bindings survive.
    if(night.parentElement!==dock){
     var anchor2=font.parentElement===dock?font:$('dockTafsirStable');
     dock.insertBefore(night,anchor2&&anchor2.parentElement===dock?anchor2:null);
    }
    night.classList.remove('p181NightTop');
    if(host)host.classList.remove('p181NightHeader');
    if(font.parentElement)font.remove();
   }
   update();initial=true;return true;
  }finally{reentrant=false;}
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
 // Reader and header can remount on navigation; do not watch 604 ayahs.
 var obs=new MutationObserver(function(records){
  for(var i=0;i<records.length;i++){if(records[i].type==='attributes'&&records[i].target===d.body){sync();return;}}
 });
 obs.observe(d.body,{attributes:true,attributeFilter:['class']});
 w.setInterval(sync,1800);
 w.__BASAIR_P181_NIGHT_FONT_CYCLE__={version:181,refresh:sync,cycle:cycle,status:function(){return{ready:initial,active:active(),selected:variants[current()].name,nightAbove:!!(night&&night.classList.contains('p181NightTop')),busy:busy,changes:swaps};}};
})(window,document);
