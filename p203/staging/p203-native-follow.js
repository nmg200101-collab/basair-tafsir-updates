/* BASAIR P203 / QA-050 — One native P189 Mushaf page throughout Tajwid Follow.
 * Source: V694/V695 B345 clock/transition, R33 print bridge, original RC18 localPageStage.
 * This DOES NOT clone/insert any page frame, alter audio or modify the Quran image.
 * B345's vertical stack remains mounted solely for its native timers/transitions.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P203_NATIVE_FOLLOW__)return;
 var active=false,rect=null,lastRendered=0,wanted=0,serial=0,pending=0,started=0,
     transitions=0,restores=0,errors=0,preloads=0,prevStyles=null,stoppedAt=0,cachedBox="";
 function E(id){return d.getElementById(id)}
 function ctl(){return w.__BASAIR_B345_SEQUENCE__}
 function print(){return w.__BASAIR_PRINT_FOLLOW_100__}
 function pg(n){n=Number(n);return Number.isInteger(n)&&n>=1&&n<=604?n:0}
 function candidate(){
   var c=ctl(),p=print(),b=d.body;
   if(!b||!c||!c.state||!c.state.running||c.state.scaleMode!=='normal')return false;
   if(!b.classList.contains('reader-active')||b.classList.contains('stableDigital')||
      b.classList.contains('h25-hifz')||b.classList.contains('h90-review')||b.classList.contains('h100-teacher'))return false;
   if(b.getAttribute('data-v144-print')!=='tajwid')return false;
   try{return !!(p&&p.active()&&p.edition()==='tajwid'&&Number(p.scale())===100)}catch(_){return false}
 }
 function stage(){var host=E('mushafText');return host&&host.querySelector(':scope>.localPageStage')}
 function stagePage(){var s=stage(),img=s&&s.querySelector('img[data-mushaf-page]');return pg(img&&img.getAttribute('data-mushaf-page'))}
 function ready(){
   var s=stage();if(!s)return false;
   var r=s.querySelector('.rc18TajwidRaster');
   return !!(s.classList.contains('rc18-tajwid-ready')&&r&&r.complete&&r.naturalWidth>0);
 }
 function readingRect(){
   var s=stage();if(!s)return null;
   var r=s.getBoundingClientRect();
   if(r.width>=180&&r.height>=250&&r.top>=0&&r.top<=(w.innerHeight||900)-170&&
      r.left>=-10&&r.left+r.width<=(w.innerWidth||500)+10&&r.bottom<=(w.innerHeight||900)+12)
     return {top:r.top,left:r.left,width:r.width,height:r.height};
   return null;
 }
 function remember(){if(candidate())return;var r=readingRect();if(r)rect=r}
 function measure(){
   if(rect&&rect.width>=180&&rect.height>=250){
     var ww=w.innerWidth||400,hh=w.innerHeight||850;
     if(rect.left>=0&&rect.top>=0&&rect.left+rect.width<=ww+10&&rect.top+rect.height<=hh+10)return rect;
   }
   // On orientation/viewport changes, derive the same B313 static 720:1280 face;
   // no second viewport or duplicate frame is created.
   var root=E('mushafReader'),r=root&&root.getBoundingClientRect();if(!r||r.width<180)return null;
   var ww=w.innerWidth||r.width,hh=w.innerHeight||r.height;
   var freeW=Math.min(r.width,ww),freeH=Math.min(r.height,Math.max(0,hh-r.top-8));
   if(freeH<300)return null;
   var width=Math.min(freeW,freeH*720/1280),height=width*1280/720;
   return {left:Math.max(0,r.left)+(freeW-width)/2,top:Math.max(0,r.top)+(freeH-height)/2,width:width,height:height};
 }
 function snapshotInline(host){
   var names=['position','top','left','right','bottom','width','height','max-width','max-height','min-width','min-height','display','z-index','margin','padding','overflow','pointer-events','box-sizing'];
   var out={};names.forEach(function(n){out[n]={value:host.style.getPropertyValue(n),priority:host.style.getPropertyPriority(n)}});return out;
 }
 function restoreInline(host){
   if(!host||!prevStyles)return;
   Object.keys(prevStyles).forEach(function(n){var p=prevStyles[n];if(p.value)host.style.setProperty(n,p.value,p.priority);else host.style.removeProperty(n)});prevStyles=null;
 }
 function layout(){
   if(!active)return false;
   var host=E('mushafText'),r=measure();if(!host||!r)return false;
   var box=[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)].join(':');
   if(box===cachedBox&&host.style.getPropertyValue('position')==='fixed'&&
      host.style.getPropertyValue('display')==='block')return true;
   cachedBox=box;
   host.style.setProperty('position','fixed','important');
   host.style.setProperty('left',Math.round(r.left)+'px','important');
   host.style.setProperty('top',Math.round(r.top)+'px','important');
   host.style.setProperty('width',Math.round(r.width)+'px','important');
   host.style.setProperty('height',Math.round(r.height)+'px','important');
   host.style.setProperty('max-width','none','important');
   host.style.setProperty('max-height','none','important');
   host.style.setProperty('min-width','0','important');
   host.style.setProperty('min-height','0','important');
   host.style.setProperty('right','auto','important');
   host.style.setProperty('bottom','auto','important');
   host.style.setProperty('display','block','important');
   host.style.setProperty('z-index','38','important');
   host.style.setProperty('margin','0','important');
   host.style.setProperty('padding','0','important');
   host.style.setProperty('overflow','hidden','important');
   host.style.setProperty('pointer-events','auto','important');
   host.style.setProperty('box-sizing','border-box','important');
   return true;
 }
 function engage(){
   var host=E('mushafText');if(!host||!ready()||!rect||!candidate())return false;
   if(!active){prevStyles=snapshotInline(host);active=true;started++;}
   if(!layout()){active=false;restoreInline(host);return false;}
   d.body.classList.add('p203-native-follow-active');return true;
 }
 function disengage(){
   if(!active&&!d.body.classList.contains('p203-native-follow-active'))return;
   active=false;cachedBox="";serial++;pending=0;wanted=0;
   d.body.classList.remove('p203-native-follow-active');
   restoreInline(E('mushafText'));
   stoppedAt=Date.now();restores++;
 }
 function loadImage(page,cb){
   var src='assets/tajweed-pages/tajweed-'+String(page).padStart(3,'0')+'.webp';
   var img=new Image(),finished=false;
   function done(ok){if(finished)return;finished=true;img.onload=img.onerror=null;cb(ok)}
   img.onload=function(){done(img.naturalWidth>0&&img.naturalHeight>0)};
   img.onerror=function(){done(false)};
   img.src=src;if(img.complete&&img.naturalWidth>0)w.setTimeout(function(){done(true)},0);
 }
 function switchPage(page){
   page=pg(page);if(!page||page===lastRendered||page===wanted||!candidate())return;
   wanted=page;preloads++;var id=++serial;
   loadImage(page,function(ok){
     if(id!==serial||!candidate()||pg(ctl()&&ctl().state.page)!==page)return;
     wanted=0;
     if(!ok){errors++;pending=page;return;}
     try{if(typeof w.renderLocalPage!=='function'){errors++;return;}
       w.renderLocalPage(page,null);lastRendered=page;transitions++;
       // Keep the actual RC18 page visible. Any pending load retains the same
       // single original stage, rather than drawing a second frame.
       w.setTimeout(function(){if(active&&candidate())layout()},30);
     }catch(_){errors++}
   });
 }
 function tick(){
   try{
     if(!candidate()){
       if(active){var c=ctl(),finalPage=pg(c&&c.state&&c.state.page)||lastRendered;
         disengage();
         // Clear the native R39 freeze only AFTER B345 has stopped; do not stop
         // the audio or alter the following session's page or timestamp.
         if(c&&c.state&&!c.state.running){
           try{if(c.releaseStaticPrint&&(c.state.printStaticHeld||
             (print()&&typeof print().frozenActive==='function'&&print().frozenActive())))c.releaseStaticPrint()}catch(_){}
           try{if(finalPage&&typeof w.renderLocalPage==='function')w.renderLocalPage(finalPage,null)}catch(_){errors++}
         }
       }
       remember();return;
     }
     var c=ctl(),page=pg(c&&c.state&&c.state.page);
     if(!page)return;
     if(!rect){var r=readingRect();if(r)rect=r;}
     if(!active){
       // Do not hide the legacy page until the ORIGINAL image is ready and the
       // last normal-page rectangle is known; this prevents a blank surface.
       if(page!==stagePage())switchPage(page);
       else if(ready()&&rect){lastRendered=page;engage()}
     }else{
       if(!layout())return;
       if(page!==lastRendered)switchPage(page);
     }
   }catch(_){errors++}
 }
 function install(){
   if(!d.body)return;
   w.setInterval(tick,90);
   w.addEventListener('resize',function(){if(!active){rect=null;remember()}else{rect=null;layout()}},{passive:true});
   tick();
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',install,{once:true});else install();
 w.__BASAIR_P203_NATIVE_FOLLOW__={version:203,status:function(){var c=ctl();return{
   active:active,candidate:candidate(),page:pg(c&&c.state&&c.state.page),stagePage:stagePage(),lastRendered:lastRendered,
   transitions:transitions,starts:started,restores:restores,preloads:preloads,errors:errors,
   stackHidden:!!(active&&d.body.classList.contains('p203-native-follow-active'))
 }}};
})(window,document);
