/* BASAIR P194 | QA-050 | Non-interfering 3D paper turning.
 * Observes the ORIGINAL reader's stage replacement; never intercepts swipes,
 * arrows, keyboard, native page functions, tap targets, or audio-follow.
 * A removed stage is displayed briefly as an inert visual snapshot ONLY.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P194_PAGE_TURN__)return;
 var root=null,host=null,pane=null,observer=null,paneObserver=null,overlay=null;
 var timeout=0,raf=0,lastFlip=0,flips=0;
 var KEY='basairP194PaperTurn';
 function enabled(){try{return w.localStorage.getItem(KEY)!=='off'}catch(e){return true}}
 function motionOK(){try{return !w.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return true}}
 function visible(){
   if(!root||!root.classList.contains('active')||!d.body.classList.contains('reader-active'))return false;
   var reading=d.getElementById('pageReading');
   if(!reading||reading.classList.contains('hidden'))return false;
   if(d.hidden)return false;
   return !(/\b(h25-hifz|h90-review|h100-teacher|stableDigital)\b/.test(d.body.className));
 }
 function pageNum(stage){
   if(!stage||stage.nodeType!==1||!stage.classList.contains('localPageStage'))return 0;
   var im=stage.querySelector('img[data-mushaf-page]');
   var p=im?Number(im.getAttribute('data-mushaf-page')):0;
   return p>=1&&p<=604?p:0;
 }
 function cancel(){
   if(raf)w.cancelAnimationFrame(raf);raf=0;
   if(timeout)w.clearTimeout(timeout);timeout=0;
   if(overlay){overlay.remove();overlay=null}
 }
 function setEnabled(yes){
   try{w.localStorage.setItem(KEY,yes?'on':'off')}catch(e){}
   if(!yes)cancel();refreshToggle();return enabled();
 }
 function refreshToggle(){
   var b=d.getElementById('p194PaperSwitch');if(!b)return;
   var on=enabled(),reduce=!motionOK();
   b.setAttribute('aria-pressed',on&&!reduce?'true':'false');
   b.textContent=reduce?'حركة منخفضة':(on?'تشغيل':'إيقاف');
   b.disabled=reduce;
 }
 function ensureToggle(){
   pane=d.getElementById('v140FontPane');if(!pane)return;
   if(!pane.querySelector('#p194PaperSwitch')){
     var row=d.createElement('div');row.className='p194SettingsRow';
     var lbl=d.createElement('span');lbl.textContent='تقليب الورق ثلاثي الأبعاد';
     var btn=d.createElement('button');btn.id='p194PaperSwitch';btn.type='button';
     btn.setAttribute('aria-label','تشغيل أو إيقاف تقليب الورق ثلاثي الأبعاد');
     btn.onclick=function(){setEnabled(!enabled())};
     row.appendChild(lbl);row.appendChild(btn);pane.appendChild(row);
   }
   refreshToggle();
   if(!paneObserver){
     paneObserver=new MutationObserver(function(){if(!pane.querySelector('#p194PaperSwitch'))ensureToggle()});
     paneObserver.observe(pane,{childList:true});
   }
 }
 function flip(oldStage,newStage,from,to){
   cancel();
   var now=Date.now();if(now-lastFlip<190)return;
   var r=newStage.getBoundingClientRect();
   if(r.width<120||r.height<160||r.width>w.innerWidth*1.2||r.top>=w.innerHeight||r.bottom<=0)return;
   var copy=oldStage.cloneNode(true);
   copy.classList.add('p194TurnLeaf');
   copy.setAttribute('aria-hidden','true');copy.setAttribute('inert','');
   // Duplicate IDs and interactive/tabbable elements must not leak to the app.
   copy.removeAttribute('id');
   Array.prototype.forEach.call(copy.querySelectorAll('[id]'),function(el){el.removeAttribute('id')});
   Array.prototype.forEach.call(copy.querySelectorAll('button,input,select,textarea,a,[tabindex]'),function(el){
     el.tabIndex=-1;el.setAttribute('aria-hidden','true');el.style.pointerEvents='none';
   });
   var shell=d.createElement('div');
   shell.className='p194TurnOverlay '+(to>from?'p194Forward':'p194Backward');
   shell.setAttribute('aria-hidden','true');
   shell.style.left=r.left+'px';shell.style.top=r.top+'px';
   shell.style.width=r.width+'px';shell.style.height=r.height+'px';
   shell.appendChild(copy);root.appendChild(shell);overlay=shell;
   lastFlip=now;flips++;
   raf=w.requestAnimationFrame(function(){raf=w.requestAnimationFrame(function(){
     raf=0;if(shell===overlay)shell.classList.add('p194Animate');
   })});
   shell.addEventListener('animationend',function(e){
     if(e.target===copy&&shell===overlay)cancel();
   },{once:true});
   timeout=w.setTimeout(function(){if(shell===overlay)cancel()},650);
 }
 function onPagesChanged(records){
   if(!enabled()||!motionOK()||!visible()){cancel();return}
   var removed=null,added=null;
   records.forEach(function(rec){
     if(rec.type!=='childList'||rec.target!==host)return;
     Array.prototype.forEach.call(rec.removedNodes,function(n){if(pageNum(n))removed=n});
     Array.prototype.forEach.call(rec.addedNodes,function(n){if(pageNum(n))added=n});
   });
   if(!removed||!added)return;
   var from=pageNum(removed),to=pageNum(added);
   if(!from||!to||Math.abs(to-from)!==1)return; // no spin on jumps, zoom, or font switches
   flip(removed,added,from,to);
 }
 function init(){
   root=d.getElementById('mushafReader');host=d.getElementById('mushafText');
   if(!root||!host)return;
   observer=new MutationObserver(onPagesChanged);
   observer.observe(host,{childList:true});
   ensureToggle();
   w.addEventListener('resize',cancel,{passive:true});
   w.addEventListener('pagehide',cancel,{passive:true});
   d.addEventListener('visibilitychange',function(){if(d.hidden)cancel()});
   try{w.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',function(){cancel();refreshToggle()})}catch(e){}
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P194_PAGE_TURN__={version:194,enabled:enabled,setEnabled:setEnabled,
   status:function(){return{ready:!!observer,enabled:enabled()&&motionOK(),flips:flips,overlay:!!overlay}},cancel:cancel};
})(window,document);
