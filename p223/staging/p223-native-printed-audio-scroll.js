/* P223 candidate: native PRINTED AUDIO only, driven by real media events.
 * No page clones, hidden surfaces, transforms, CSS changes or extra audio clock.
 * Only correct a proven stall on the actual visible R33 card and its scroll ancestor.
 * Requires on-device verification: B345 native source and actual WebView not available here.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P223_PRINT_AUDIO__)return;
 var prior=null,raf=0,enabled=true;
 function num(n){return typeof n==='number'&&Number.isFinite(n)}
 function progress(n){return num(n)&&n>=0&&n<=1}
 function page(n){return Number.isInteger(n)&&n>=1&&n<=604}
 function plan(previous,current){
   if(!previous||previous.page!==current.page||previous.card!==current.card||previous.media!==current.media)return 'reset';
   if(current.fraction<previous.fraction||current.time<previous.time)return 'reset';
   if(Math.abs(current.top-previous.top)>1)return 'reset';
   if(current.time<=previous.time||current.fraction-previous.fraction<.003)return 'wait';
   return 'move';
 }
 function context(media){
   var b=d.body,n=w.__BASAIR_B345_SEQUENCE__,s=n&&n.state,p=w.__BASAIR_PRINT_FOLLOW_100__;
   if(!enabled||d.hidden||!b||!s||s.running!==true||s.mode!=='audio'||s.paused||s.userScrolling||s.surfaceBusy||
      s.scaleMode!=='normal'||!page(s.page)||!progress(s.progress)||!p||
      !b.classList.contains('reader-active')||['stableDigital','h25-hifz','h90-review','h100-teacher'].some(function(k){return b.classList.contains(k)}))return null;
   if(!p.active()||Number(p.scale())!==100||['original','tajwid'].indexOf(p.edition())<0)return null;
   if(!media||media.id!=='tilawaAudio'||media.paused||media.ended||media.seeking||!num(media.currentTime))return null;
   var host=d.getElementById('b345NormalStack'),reader=d.getElementById('mushafReader');
   if(!host||!reader||!reader.contains(host))return null;
   var card=host.querySelector('[data-r33-print-page="'+s.page+'"]')||host.querySelector('[data-b345-page="'+s.page+'"]');
   if(!card||card.getAttribute('data-b345-ready')!=='1')return null;
   var image=card.querySelector('.r33PrintImage')||card.querySelector('img');
   if(!image||!image.complete||!(image.naturalWidth>0&&image.naturalHeight>0))return null;
   var r=card.getBoundingClientRect(),v=reader.getBoundingClientRect();
   var left=Math.max(r.left,v.left,0),right=Math.min(r.right,v.right,w.innerWidth),
       top=Math.max(r.top,v.top,0),bottom=Math.min(r.bottom,v.bottom,w.innerHeight);
   if(right-left<5||bottom-top<5)return null;
   // A stale, covered or fixed alternative renderer is NOT a valid target.
   var visible=d.elementFromPoint((left+right)/2,(top+bottom)/2);
   if(!visible||!card.contains(visible))return null;
   return {page:s.page,card:card,media:media,reader:reader,fraction:s.progress,time:media.currentTime,top:r.top};
 }
 function advance(c){
   var card=c.card,el=card.parentElement;
   while(el){
     var css=w.getComputedStyle(el),r=el.getBoundingClientRect(),pr=card.getBoundingClientRect();
     if(/^(auto|scroll)$/.test(css.overflowY)&&el.scrollHeight>el.clientHeight+2&&el.clientHeight>0){
       var before=el.scrollTop;
       var target=Math.min(el.scrollHeight-el.clientHeight,Math.max(0,before+pr.top-r.top+c.fraction*pr.height));
       if(target>before+1){
         el.scrollTop=target;
         var after=card.getBoundingClientRect().top;
         if(pr.top-after>0.5)return true;
         el.scrollTop=before;
       }
     }
     if(el===c.reader)break;
     el=el.parentElement;
   }
   return false;
 }
 function tick(media){
   try{
     var c=context(media);
     if(!c){prior=null;return false}
     var action=plan(prior,c);
     if(action==='reset'){prior=c;return false}
     if(action!=='move')return false;
     var moved=advance(c);
     c.top=c.card.getBoundingClientRect().top;
     prior=c;return moved;
   }catch(_){prior=null;return false}
 }
 function onTime(ev){
   var media=ev.target;
   if(!enabled||!media||media.id!=='tilawaAudio'||raf)return;
   raf=w.requestAnimationFrame(function(){raf=0;tick(media)});
 }
 function reset(){prior=null;if(raf){w.cancelAnimationFrame(raf);raf=0}}
 d.addEventListener('timeupdate',onTime,true);
 ['pause','seeking','ended','emptied'].forEach(function(type){
   d.addEventListener(type,function(ev){if(ev.target&&ev.target.id==='tilawaAudio')reset()},true);
 });
 w.addEventListener('pagehide',reset);
 w.__BASAIR_P223_PRINT_AUDIO__=Object.freeze({
   disable:function(){enabled=false;reset()},enable:function(){enabled=true;reset()},
   _test:Object.freeze({plan:plan,advance:advance,tick:tick})
 });
})(window,document);
