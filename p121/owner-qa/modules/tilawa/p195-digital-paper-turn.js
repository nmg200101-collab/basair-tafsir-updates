/* BASAIR P195 | QA-050 | Optional 3D turning for DIGITAL Mushaf fonts.
 * B327 updates #stableDigitalHost in place, unlike printed localPageStage.
 * Capture only completed digital pages; animate DISPOSABLE inert clones.
 * Never override navigation, renderers, Quran text, zoom, follow, P193 or P194.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P195_DIGITAL_TURN__)return;
 var root=null,host=null,view=null,observer=null,rootObserver=null;
 var prior=null,overlay=null,raf=0,job=0,timeout=0,flips=0,lastFlip=0;
 var lastResult='idle',ready=false;
 var DELAY=540;
 function num(x){var n=Number(x);return n>=1&&n<=604?n:0}
 function font(){try{return w.localStorage.getItem('stableFont')||'original'}catch(e){return 'original'}}
 function scale(){try{return Number(w.localStorage.getItem('basair:tilawa-page-font-scale:v1'))||100}catch(e){return 100}}
 function on(){
   try{var p=w.__BASAIR_P194_PAGE_TURN__;
     if(p&&typeof p.enabled==='function')return p.enabled();
     return w.localStorage.getItem('basairP194PaperTurn')!=='off'
   }catch(e){return true}
 }
 function motion(){try{return !w.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return true}}
 function visible(){
   if(!d.body.classList.contains('reader-active')||!d.body.classList.contains('stableDigital'))return false;
   if(/\b(h25-hifz|h90-review|h100-teacher)\b/.test(d.body.className)||d.hidden)return false;
   var panel=d.getElementById('pageReading');
   if(!panel||panel.classList.contains('hidden'))return false;
   return !!(host&&host.isConnected&&w.getComputedStyle(host).display!=='none');
 }
 function committedPage(){
   if(!host||!host.isConnected)return 0;
   // B327 is the official exact-15-line renderer when its 100% fitter is on.
   // Do NOT snapshot its intermediate 'commit' or 'preparing' phases.
   var exact=(w.__BASAIR_B328_STABILITY__&&scale()===100);
   if(exact){
     if(host.getAttribute('data-b328-state')!=='ready'||!host.classList.contains('b327Ready'))return 0;
     return num(host.getAttribute('data-b327-page'));
   }
   // At magnifications other than 100%, V160 provides a fitted digital flow.
   if(!host.classList.contains('v160LocalFallback')&&!host.querySelector('.v160DigitalFlow'))return 0;
   var pageInput=d.getElementById('readerPageInput');
   return num(pageInput&&pageInput.value);
 }
 function cleanClone(from){
   var copy=from.cloneNode(true);
   copy.removeAttribute('id');copy.classList.add('p195DigitalSheet');
   copy.setAttribute('aria-hidden','true');copy.setAttribute('inert','');
   var attrs=copy.querySelectorAll('[id],button,input,select,textarea,a,[tabindex],[contenteditable]');
   Array.prototype.forEach.call(attrs,function(x){
     x.removeAttribute('id');x.removeAttribute('contenteditable');
     x.setAttribute('aria-hidden','true');
     x.setAttribute('tabindex','-1');x.style.pointerEvents='none';
   });
   return copy;
 }
 function clear(){
   if(raf){w.cancelAnimationFrame(raf);raf=0}
   if(timeout){w.clearTimeout(timeout);timeout=0}
   if(overlay){overlay.remove();overlay=null}
 }
 function animate(before,after){
   clear();
   if(!before||!after)return;
   var from=before.page,to=after.page;
   if(Math.abs(to-from)!==1||before.font!==after.font)return;
   var now=Date.now();if(now-lastFlip<140)return;
   var rect=host.getBoundingClientRect();
   if(rect.width<120||rect.height<170||rect.top>=w.innerHeight||rect.bottom<=0)return;
   // Avoid an expensive compositing surface at very large zoom.
   if(rect.width>w.innerWidth*1.20)return;
   var shell=d.createElement('div');
   shell.className='p195DigitalTurn '+(to>from?'p195Forward':'p195Backward');
   shell.setAttribute('aria-hidden','true');shell.setAttribute('inert','');
   shell.style.left=rect.left+'px';shell.style.top=rect.top+'px';
   shell.style.width=rect.width+'px';shell.style.height=rect.height+'px';
   var incoming=after.node.cloneNode(true),outgoing=before.node.cloneNode(true);
   incoming.classList.add('p195Incoming');outgoing.classList.add('p195Outgoing');
   shell.appendChild(incoming);shell.appendChild(outgoing);
   // Match dark/light page paper and exact 15-line text dimensions.
   shell.style.setProperty('--p195Paper',w.getComputedStyle(host).backgroundColor||'#fffdf5');
   (root||d.body).appendChild(shell);overlay=shell;
   lastFlip=now;flips++;lastResult='flipped '+from+'-'+to;
   raf=w.requestAnimationFrame(function(){raf=w.requestAnimationFrame(function(){
     raf=0;if(shell===overlay)shell.classList.add('p195Animate');
   })});
   outgoing.addEventListener('animationend',function(e){
     if(e.target===outgoing&&shell===overlay)clear();
   },{once:true});
   timeout=w.setTimeout(function(){if(shell===overlay)clear()},DELAY+190);
 }
 function commit(){
   job=0;
   if(!host||!host.isConnected)return;
   var p=committedPage();if(!p)return;
   var fk=font(),snapshot={page:p,font:fk,node:cleanClone(host)};
   // Always record latest committed page even if the animation is disabled.
   var before=prior;prior=snapshot;
   if(!before||before.page===p){lastResult='primed '+p;return}
   if(!visible()||!on()||!motion()){clear();lastResult='disabled';return}
   if(before.font!==fk){clear();lastResult='font-change';return}
   if(Math.abs(p-before.page)!==1){clear();lastResult='jump';return}
   animate(before,snapshot);
 }
 function schedule(){
   if(job)w.clearTimeout(job);
   // The exact B327 path signals 'ready' AFTER its font fit is complete.
   // V160's fallback requires additional frames for its size fitter.
   job=w.setTimeout(function(){
     job=0;
     raf=w.requestAnimationFrame(function(){
       raf=w.requestAnimationFrame(function(){raf=0;commit()});
     });
   },w.__BASAIR_B328_STABILITY__&&scale()===100?0:95);
 }
 function connected(){
   var x=d.getElementById('stableDigitalHost');
   if(!x||x===host)return;
   if(observer)observer.disconnect();
   host=x;prior=null;clear();
   observer=new MutationObserver(function(recs){
     var hit=false;
     for(var i=0;i<recs.length;i++){
       var r=recs[i];
       if(r.type==='childList')hit=true;
       if(r.type==='attributes'&&(r.attributeName==='class'||r.attributeName==='data-b328-state'||r.attributeName==='data-b327-page'))hit=true;
     }
     if(hit)schedule();
   });
   observer.observe(host,{attributes:true,childList:true,subtree:false,attributeFilter:['class','data-b328-state','data-b327-page']});
   schedule();ready=true;
 }
 function init(){
   root=d.getElementById('mushafReader');view=d.getElementById('mushafPage');
   if(!root||!view)return;
   rootObserver=new MutationObserver(connected);
   rootObserver.observe(view,{childList:true});connected();
   w.addEventListener('resize',clear,{passive:true});
   w.addEventListener('pagehide',clear,{passive:true});
   d.addEventListener('visibilitychange',function(){if(d.hidden)clear()});
   try{w.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',clear)}catch(e){}
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P195_DIGITAL_TURN__={version:195,
   status:function(){return{ready:ready,flips:flips,enabled:on()&&motion(),overlay:!!overlay,last:lastResult,tracked:prior&&prior.page}},
   cancel:clear};
})(window,document);
