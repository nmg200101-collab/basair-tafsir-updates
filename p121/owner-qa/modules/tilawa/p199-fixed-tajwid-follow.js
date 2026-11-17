/* BASAIR P199 | Owner QA-050 | fixed-page Tajwid Follow mirror.
 * Rationale: P198 restores B345's clock/page/audio progress, but B345 paints
 * a vertical stack of R33 shells. The accepted P193/P194 page is RC18's
 * .localPageStage. Do not mutate B345 navigation or timing. Mirror that exact
 * original live page above the scrolling surface and switch only on page
 * boundaries. Remove the mirror, thaw native R39 and restore static layout
 * after Stop; all other editions and zoom paths remain untouched.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P199_FIXED_TAJWID_FOLLOW__)return;
 var root=null, mirror=null, lastRect=null, lastPage=0, wanted=0,
     token=0, timer=0, lastState=false, restored=0, displayed=0, pageChanges=0,
     failed=0, renderCalls=0, skipped=0;
 function el(id){return d.getElementById(id)}
 function controller(){return w.__BASAIR_B345_SEQUENCE__}
 function printApi(){return w.__BASAIR_PRINT_FOLLOW_100__}
 function page(n){n=Number(n);return Number.isInteger(n)&&n>=1&&n<=604?n:0}
 function eligible(){
   var ctl=controller(),p=printApi(),b=d.body;
   if(!b||!ctl||!ctl.state||!ctl.state.running||ctl.state.scaleMode!=='normal')return false;
   if(!b.classList.contains('reader-active')||b.classList.contains('stableDigital')||
      b.classList.contains('h25-hifz')||b.classList.contains('h90-review')||b.classList.contains('h100-teacher'))return false;
   if(b.getAttribute('data-v144-print')!=='tajwid')return false;
   try{return !!(p&&p.active()&&p.edition()==='tajwid'&&Number(p.scale())===100)}catch(_){return false}
 }
 function stage(){var host=el('mushafText');return host&&host.querySelector(':scope > .localPageStage')}
 function currentStagePage(s){var im=s&&s.querySelector('img[data-mushaf-page]');return page(im&&im.getAttribute('data-mushaf-page'))}
 function visibleRect(){
   var s=stage();if(!s||eligible())return;
   var r=s.getBoundingClientRect();
   if(r.width>=140&&r.height>=220&&r.top>=-20&&r.top<w.innerHeight&&r.left>=-20){
     lastRect={left:r.left,top:r.top,width:r.width,height:r.height};
   }
 }
 function bounds(){
   var rect=root&&root.getBoundingClientRect();
   var x=lastRect;
   if(x&&x.width>140&&x.height>220&&x.top>=0&&x.top<w.innerHeight&&x.left+x.width<=w.innerWidth+25&&x.top+x.height<=w.innerHeight+25){
     return x;
   }
   if(!rect||rect.width<140||rect.height<220)return null;
   var left=Math.max(0,rect.left),top=Math.max(0,rect.top),maxW=Math.min(rect.width,w.innerWidth-left),maxH=Math.min(rect.height,w.innerHeight-top-20);
   if(maxH<200)return null;
   var width=Math.min(maxW,Math.max(1,maxH)*720/1280),height=width*1280/720;
   return {left:left+(maxW-width)/2,top:top+(maxH-height)/2,width:width,height:height};
 }
 function setBounds(){
   if(!mirror)return;
   var r=bounds();if(!r)return;
   mirror.style.left=Math.round(r.left)+'px';mirror.style.top=Math.round(r.top)+'px';
   mirror.style.width=Math.round(r.width)+'px';mirror.style.height=Math.round(r.height)+'px';
 }
 function ensureMirror(){
   if(mirror&&mirror.isConnected){setBounds();return mirror}
   root=el('mushafReader');if(!root)return null;
   mirror=d.createElement('div');mirror.id='p199FixedFollowMirror';
   mirror.setAttribute('aria-hidden','true');mirror.setAttribute('inert','');
   mirror.style.visibility='hidden';
   root.appendChild(mirror);setBounds();return mirror;
 }
 function dispose(){
   token++;wanted=0;lastPage=0;
   if(mirror){mirror.remove();mirror=null}
 }
 function restoreAfterStop(){
   // B345/R39 may preserve an old vertical stack after stop. Explicitly
   // release its public frozen ownership before painting the original page.
   var ctl=controller(),p=printApi(),s=ctl&&ctl.state, pg=page(s&&s.page)||lastPage;
   if(!ctl||!s||s.running)return; // another active mode owns the screen
   try{
     if(ctl&&typeof ctl.releaseStaticPrint==='function'&&
       (s&&s.printStaticHeld||(p&&typeof p.frozenActive==='function'&&p.frozenActive())))ctl.releaseStaticPrint();
   }catch(_){failed++}
   try{
     if(pg&&typeof w.renderLocalPage==='function'&&d.body.getAttribute('data-v144-print')==='tajwid'&&
       !d.body.classList.contains('stableDigital')){
       w.renderLocalPage(pg,null);restored++;
     }
   }catch(_){failed++}
 }
 function safeClone(s){
   var clone=s.cloneNode(true);
   clone.classList.add('p199FollowStaticStage');
   clone.removeAttribute('id');clone.setAttribute('aria-hidden','true');clone.setAttribute('inert','');
   // The mirror is never interactive. Remove ID duplicates and disable all
   // live handlers. Do not remove the original hitbox layer from the source.
   Array.prototype.forEach.call(clone.querySelectorAll('[id]'),function(x){x.removeAttribute('id')});
   Array.prototype.forEach.call(clone.querySelectorAll('button,a,input,select,textarea,[tabindex]'),function(x){
     x.tabIndex=-1;x.setAttribute('aria-hidden','true');x.style.pointerEvents='none';
   });
   clone.removeAttribute('data-p192-page');
   clone.classList.remove('p192-meta-ready','p192-native-top-head');
   return clone;
 }
 function readyPage(p){
   var s=stage();if(currentStagePage(s)!==p||!s.classList.contains('rc18-tajwid-ready'))return null;
   var raster=s.querySelector('img.rc18TajwidRaster');
   if(!raster||!raster.complete||raster.naturalWidth<=0)return null;
   return s;
 }
 function commit(p,s,mark){
   if(!eligible()||mark!==token||wanted!==p)return false;
   var host=ensureMirror();if(!host)return false;
   var cp=safeClone(s);
   cp.style.visibility='hidden';
   host.appendChild(cp);
   try{var h=w.__BASAIR_P192_PAGE_HEADING__;if(h&&typeof h.refresh==='function')h.refresh()}catch(_){}
   try{var g=w.__BASAIR_P193_AUTH_HEAD__;if(g&&typeof g.refresh==='function')g.refresh()}catch(_){}
   var img=cp.querySelector('img.rc18TajwidRaster'),settled=false;
   function reveal(ok){
     if(settled)return;settled=true;
     if(!ok||mark!==token||!eligible()||!mirror||mirror!==host){
       cp.remove();if(!ok)failed++;return;
     }
     w.requestAnimationFrame(function(){
       if(mark!==token||!eligible()||host!==mirror){cp.remove();return}
       Array.prototype.forEach.call(host.children,function(x){if(x!==cp)x.remove()});
       cp.style.visibility='visible';host.style.visibility='visible';
       if(lastPage&&lastPage!==p)pageChanges++;
       lastPage=p;displayed++;
     });
   }
   if(img&&img.complete&&img.naturalWidth>0)reveal(true);
   else if(img){
     img.addEventListener('load',function(){reveal(img.naturalWidth>0)},{once:true});
     img.addEventListener('error',function(){reveal(false)},{once:true});
     w.setTimeout(function(){reveal(!!(img.complete&&img.naturalWidth>0))},1200);
   }else reveal(false);
   return true;
 }
 function renderPage(p,mark,attempt){
   if(mark!==token||!eligible()||wanted!==p)return;
   var s=readyPage(p);
   if(s){commit(p,s,mark);return}
   // The real static renderer is hidden by B345. It is safe to ask it to
   // refresh only its off-screen content, without calling openPage(), which
   // would disturb B345's page ownership or audio session.
   if(attempt===0&&currentStagePage(stage())!==p){
     try{if(typeof w.renderLocalPage==='function'){w.renderLocalPage(p,null);renderCalls++}}catch(_){failed++}
   }
   if(attempt===2){
     try{var rc=w.__BASAIR_RC18__;if(rc&&typeof rc.sync==='function')rc.sync(root||d)}catch(_){}
   }
   if(attempt>=24){failed++;return} // keep previous full page until ready
   w.setTimeout(function(){renderPage(p,mark,attempt+1)},45);
 }
 function display(p){
   p=page(p);if(!p||p===wanted)return;
   wanted=p;var mark=++token;
   renderPage(p,mark,0);
 }
 function tick(){
   root=root||el('mushafReader');
   if(!root)return;
   var active=eligible();
   if(!active){
     if(lastState){
       var wasPage=lastPage;
       dispose();lastState=false;
       // Wait for B345 to finish its synchronous stop/freeze before restoring
       // native P193 layout. Old print pages must not remain visible.
       w.setTimeout(function(){if(!eligible()&&wasPage)restoreAfterStop()},40);
     }
     visibleRect();return;
   }
   lastState=true;
   var ctl=controller(),p=page(ctl&&ctl.state&&ctl.state.page);
   if(p)display(p);
   else skipped++;
   setBounds();
 }
 function init(){
   root=el('mushafReader');
   if(!root)return false;
   visibleRect();
   timer=w.setInterval(tick,100);
   w.addEventListener('resize',setBounds,{passive:true});
   d.addEventListener('visibilitychange',function(){if(d.hidden&&mirror)mirror.style.visibility='hidden';else if(mirror&&eligible())mirror.style.visibility='visible'});
   return true;
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P199_FIXED_TAJWID_FOLLOW__={version:199,status:function(){return{
   active:eligible(),mirroring:!!(mirror&&mirror.isConnected&&mirror.style.visibility==='visible'),
   currentPage:lastPage,wantedPage:wanted,renderCalls:renderCalls,displayed:displayed,
   pageChanges:pageChanges,restored:restored,failed:failed,skipped:skipped
 }},refresh:tick};
})(window,document);
