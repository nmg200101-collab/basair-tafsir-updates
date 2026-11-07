/* BASAIR P93.3 OWNER-QA-005 — night-only printed-page brightness.
 * No bridge calls, no Quran modifications, no native changes, no network access.
 */
(function(){
 'use strict';
 if(window.__BASAIR_P933_NIGHT_PRINT__)return;
 var KEY='basair:p933:night-print-brightness',MIN=55,MAX=120,STEP=5,DEFAULT=100;
 var body=document.body,root=document.documentElement;
 if(!body||!root)return;
 var level=DEFAULT,scheduled=false,observer=null,bar=null;
 function clamp(v){v=Number(v);if(!isFinite(v))v=DEFAULT;return Math.max(MIN,Math.min(MAX,Math.round(v/STEP)*STEP));}
 try{var fromStore=localStorage.getItem(KEY);if(fromStore!==null)level=clamp(fromStore);}catch(e){}
 function isNight(){return body.classList.contains('dark')||body.classList.contains('night');}
 function isPrintedTilawa(){return body.classList.contains('reader-active')&&!body.classList.contains('stableDigital')&&!body.classList.contains('h25-hifz')&&!body.classList.contains('h90-review')&&!body.classList.contains('h100-teacher');}
 function apply(){
  var enabled=isNight()&&isPrintedTilawa();
  root.style.setProperty('--p933-night-page-brightness', enabled?String(level/100):'1');
  if(bar){var slider=bar.querySelector('input'),n=bar.querySelector('.p933Percent');
   if(slider&&document.activeElement!==slider)slider.value=String(level);
   if(n&&n.textContent!==String(level)+'%')n.textContent=String(level)+'%';
   bar.setAttribute('data-active',enabled?'yes':'no');
  }
 }
 function change(v,save){level=clamp(v);apply();if(save){try{localStorage.setItem(KEY,String(level));}catch(e){}}}
 function install(){
  var host=document.getElementById('v144OriginalPrintsPinned');
  if(!host)return false;
  var grid=host.querySelector('.v144PrintGrid');if(!grid)return false;
  var node=host.querySelector('#p933NightBrightness');
  if(!node){
   node=document.createElement('section');node.id='p933NightBrightness';node.className='p933NightBrightness';
   node.setAttribute('role','group');node.setAttribute('aria-label','إضاءة صفحات المصحف في الوضع الليلي');
   node.innerHTML='<div class="p933Head"><span class="p933Title">☾ إضاءة صفحات المصحف</span><output class="p933Percent" for="p933BrightnessRange">100%</output></div>'+
     '<div class="p933Row"><button type="button" class="p933Minus" aria-label="خفض الإضاءة">−</button><input id="p933BrightnessRange" type="range" min="55" max="120" step="5" value="100" aria-label="مستوى إضاءة صفحة المصحف"/><button type="button" class="p933Plus" aria-label="رفع الإضاءة">+</button></div>'+
     '<div class="p933Footer"><span class="p933Hint">للوضع الليلي فقط، ولا يغيّر سطوع الهاتف.</span><button type="button" class="p933Reset">افتراضي</button></div>';
   grid.insertAdjacentElement('afterend',node);
   node.querySelector('input').addEventListener('input',function(ev){change(ev.target.value,true);});
   node.querySelector('input').addEventListener('change',function(ev){change(ev.target.value,true);});
   node.querySelector('.p933Minus').addEventListener('click',function(){change(level-STEP,true);});
   node.querySelector('.p933Plus').addEventListener('click',function(){change(level+STEP,true);});
   node.querySelector('.p933Reset').addEventListener('click',function(){change(DEFAULT,true);});
  }
  bar=node;apply();return true;
 }
 function refresh(){scheduled=false;install();apply();}
 function schedule(){if(scheduled)return;scheduled=true;(window.requestAnimationFrame||function(f){return Promise.resolve().then(f);})(refresh);}
 if(window.MutationObserver){
  observer=new MutationObserver(schedule);
  observer.observe(body,{attributes:true,attributeFilter:['class','data-v144-print']});
  var pane=document.getElementById('v140FontPane')||document.getElementById('ayahSideRail');
  if(pane)observer.observe(pane,{childList:true,subtree:true});
 }
 window.addEventListener('pageshow',schedule,false);
 document.addEventListener('visibilitychange',function(){if(!document.hidden)schedule();});
 document.addEventListener('DOMContentLoaded',schedule,{once:true});
 window.__BASAIR_P933_NIGHT_PRINT__={version:'P93.3-OWNER-QA-005',getLevel:function(){return level;},setLevel:function(v){change(v,true);},sync:schedule};
 schedule();
})();

/* P93.4 follow-up: actual visible print panel */
/* BASAIR P93.4 OWNER-QA-006 — show night brightness BELOW the actually visible
   RC20/V14 print choices. Presentation only; reuses signed QA005 dimmer engine.
   No Android changes, network access, recitation or Quran text changes. */
(function(){
 'use strict';
 if(window.__BASAIR_P934_VISIBLE_NIGHT__)return;
 var ID='p934VisibleNightBrightness',KEY='basair:p933:night-print-brightness';
 var MIN=55,MAX=120,STEP=5,BASE=100;
 var body=document.body,root=document.documentElement,scheduled=false;
 if(!body||!root)return;
 var node=null,level=BASE;
 function clamp(v){v=Number(v);return Number.isFinite(v)?Math.max(MIN,Math.min(MAX,Math.round(v/STEP)*STEP)):BASE;}
 function saved(){try{var v=localStorage.getItem(KEY);return v===null?BASE:clamp(v)}catch(e){return BASE;}}
 level=saved();
 function isNight(){return body.classList.contains('dark')||body.classList.contains('night')||root.classList.contains('dark')||root.classList.contains('night');}
 function allow(){return !body.classList.contains('h25-hifz')&&!body.classList.contains('h90-review')&&!body.classList.contains('h100-teacher')&&!body.classList.contains('stableDigital');}
 function active(){return isNight()&&allow();}
 function updateUI(){
  if(!node)return;
  var value=node.querySelector('.p934Value'),range=node.querySelector('input[type=range]');
  if(value)value.textContent=String(level)+'%';
  if(range&&range!==document.activeElement)range.value=String(level);
  node.hidden=!active();
 }
 function change(n){
  level=clamp(n);
  try{localStorage.setItem(KEY,String(level))}catch(e){}
  var engine=window.__BASAIR_P933_NIGHT_PRINT__;
  if(engine&&typeof engine.setLevel==='function'){engine.setLevel(level)}
  else root.style.setProperty('--p933-night-page-brightness',active()?String(level/100):'1');
  updateUI();
 }
 function install(){
  var section=document.getElementById('v14PrintQuick');
  if(!section||!section.isConnected)return false;
  var grid=section.querySelector('.v14PrintQuickGrid');
  if(!grid)return false;
  var existing=document.getElementById(ID);
  if(existing&&existing.parentElement!==section)existing.remove();
  if(!existing||!existing.isConnected){
   existing=document.createElement('section');existing.id=ID;existing.className='p934VisibleNightBrightness';existing.dir='rtl';
   existing.setAttribute('role','group');existing.setAttribute('aria-label','إضاءة طبعات المصحف في الليل');
   existing.innerHTML='<div class="p934Head"><b>☾ إضاءة صفحة المصحف</b><output class="p934Value" for="p934Range">100%</output></div>'+
     '<div class="p934Adjust"><button type="button" data-p934="minus" aria-label="خفض الإضاءة">−</button><input id="p934Range" type="range" min="55" max="120" step="5" value="100" aria-label="درجة إضاءة صفحة المصحف"/><button type="button" data-p934="plus" aria-label="رفع الإضاءة">+</button></div>'+
     '<div class="p934Foot"><span>داخل التطبيق فقط</span><button type="button" data-p934="reset">افتراضي</button></div>';
   grid.insertAdjacentElement('afterend',existing);
   existing.querySelector('input').addEventListener('input',function(e){change(e.target.value)});
   existing.querySelector('input').addEventListener('change',function(e){change(e.target.value)});
   existing.addEventListener('click',function(e){var b=e.target.closest('button[data-p934]');if(!b)return;var mode=b.getAttribute('data-p934');change(mode==='minus'?level-STEP:mode==='plus'?level+STEP:BASE)});
  }
  node=existing;
  var engine=window.__BASAIR_P933_NIGHT_PRINT__;
  if(engine&&typeof engine.getLevel==='function')level=clamp(engine.getLevel());
  updateUI();return true;
 }
 function sync(){scheduled=false;install();updateUI();}
 function schedule(){if(scheduled)return;scheduled=true;(window.requestAnimationFrame||function(fn){return Promise.resolve().then(fn)})(sync);}
 if(window.MutationObserver){
  var ob=new MutationObserver(schedule);ob.observe(body,{attributes:true,attributeFilter:['class'],childList:true});
  var rail=document.getElementById('ayahSideRail');if(rail)ob.observe(rail,{childList:true,subtree:true});
 }
 document.addEventListener('pointerdown',function(e){if(e.target.closest&&e.target.closest('#ayahSideHandle,#h25PageTools,#h25PageSettings,#v14PrintQuick'))schedule()},true);
 document.addEventListener('DOMContentLoaded',schedule,{once:true});
 document.addEventListener('visibilitychange',function(){if(!document.hidden)schedule()});
 window.addEventListener('pageshow',schedule);
 window.__BASAIR_P934_VISIBLE_NIGHT__={version:'P93.4-OWNER-QA-006',sync:schedule,getLevel:function(){return level},setLevel:change,visible:function(){return !!(node&&!node.hidden&&node.isConnected)}};
 schedule();
})();

