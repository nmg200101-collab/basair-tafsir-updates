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
