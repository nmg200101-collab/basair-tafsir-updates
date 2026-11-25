/* BASAIR P221 / V695 — repair visible ORIGINAL printed Follow after P220.
 * Owner field QA: Seq137 removed extra audio border but page stayed stationary;
 * silent Follow still showed a faint extra border.
 *
 * Root corrective contract:
 * - Do not confuse B345 state.progress with DOM/visible page movement.
 * - Compare cumulative audio progress across many ticks, NOT >0.002 each 120ms.
 * - Test visible page rectangle after scrollTop writes; never accept only the
 *   scrollTop numeric value as proof that the Quran moved.
 * - First attempt the real B345 reader/pageReading scroll surface.
 * - If neither changes the already-mounted R33 printed page, move THAT SAME
 *   native stack (no copy/portal/second frame), using B345's actual progress.
 * - Never change B345 audio, Quran page sources, timing, user data or P219.
 * - The fix must be reversible within the live session and is NOT a proof of
 *   actual audio sync until owner's Android phone confirms it.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P221_VISIBLE_PRINT_FOLLOW__)return;
 var AUDIO='p221-original-audio-visual',SILENT='p221-original-silent-clean',STYLE='p221OriginalSurfaceCss';
 var enabled=true,timer=0,mode='off',activePage=0,owner='native',scroller=null;
 var proofProgress=null,proofTop=null,prevTop=null,prevProgress=null,lastShift=0;
 var stackOriginal=null,stack=null;
 var meters={visualCorrections:0,scrollCorrected:0,stackCorrected:0,
   stalledProgressEvents:0,visibleMovementEvents:0,progressObserved:0,
   silentBorderClears:0,failClosed:0,events:0,lastError:'',lastReason:''};
 function by(id){return d.getElementById(id)}
 function B(){return w.__BASAIR_B345_SEQUENCE__}
 function P(){return w.__BASAIR_PRINT_FOLLOW_100__}
 function safeNum(x){var v=Number(x);return Number.isFinite(v)?v:null}
 function pnum(x){var n=safeNum(x);return n!==null&&n>=0&&n<=1?n:null}
 function printed(){
   try{var s=B()&&B().state,p=P(),b=d.body;
     return !!(enabled&&b&&s&&s.running&&s.scaleMode==='normal'&&!s.surfaceBusy&&
       b.classList.contains('reader-active')&&!b.classList.contains('stableDigital')&&
       !b.classList.contains('h25-hifz')&&!b.classList.contains('h90-review')&&
       !b.classList.contains('h100-teacher')&&p&&typeof p.active==='function'&&
       p.active()&&p.edition()==='original'&&Number(p.scale())===100);
   }catch(_){return false}
 }
 function actualCard(page){
   var host=by('b345NormalStack');if(!host||!page)return null;
   var c=host.querySelector('[data-r33-print-page="'+page+'"]')||
         host.querySelector('[data-b345-page="'+page+'"]');
   if(!c||c.getAttribute('data-b345-ready')!=='1')return null;
   var img=c.querySelector('.r33PrintImage')||c.querySelector('img');
   if(!img||!img.complete||!(Number(img.naturalWidth)>0)||!(Number(img.naturalHeight)>0))return null;
   var r=c.getBoundingClientRect&&c.getBoundingClientRect();
   return r&&r.width>100&&r.height>200?c:null;
 }
 function css(){
   if(by(STYLE))return;
   var n=d.createElement('style');n.id=STYLE;
   n.textContent=
     'body.'+SILENT+' #b345NormalStack>.r33PrintShell{outline:0!important;border:0!important;box-shadow:none!important;border-radius:0!important}' +
     'body.'+SILENT+' #b345NormalStack>.r33PrintShell>.stableFrame{display:none!important}' +
     'body.'+SILENT+' #mushafReader #mushafText{outline:0!important;box-shadow:none!important}' +
     'body.'+AUDIO+'.p220-original-audio-live #mushafReader #mushafText{opacity:0!important;visibility:hidden!important;pointer-events:none!important}' +
     'body.'+AUDIO+'.p220-original-audio-live #mushafReader #b345NormalStack{opacity:1!important;visibility:visible!important}' +
     'body.'+AUDIO+' #b345NormalStack>.r33PrintShell{outline:0!important;border:0!important;box-shadow:none!important}' +
     'body.'+AUDIO+' #b345NormalStack>.r33PrintShell>.stableFrame{display:none!important}';
   (d.head||d.documentElement).appendChild(n);
 }
 function resetTransform(){
   if(stack&&stackOriginal&&stack.style&&typeof stack.style.setProperty==='function'){
     var val=stackOriginal.value,prio=stackOriginal.priority;
     if(val)stack.style.setProperty('transform',val,prio);
     else stack.style.removeProperty('transform');
   }
   stack=null;stackOriginal=null;lastShift=0;
 }
 function reset(){
   resetTransform();
   if(d.body){d.body.classList.remove(AUDIO);d.body.classList.remove(SILENT)}
   mode='off';activePage=0;owner='native';scroller=null;
   proofProgress=proofTop=prevTop=prevProgress=null;meters.lastReason='inactive';
 }
 function clip(num,lo,hi){return Math.min(hi,Math.max(lo,num))}
 function rectTop(card){var r=card&&card.getBoundingClientRect&&card.getBoundingClientRect();return r&&Number.isFinite(r.top)?r.top:null}
 function preserveStyle(elem){
   return {value:elem.style.getPropertyValue('transform'),
           priority:elem.style.getPropertyPriority('transform')};
 }
 // Detect visible movement of the real R33 page. A scrollTop change alone
 // can be a false success if an inner fixed stack never moves on Android.
 function scrollCandidate(elem,card,progress){
   if(!elem||!card||!elem.getBoundingClientRect)return false;
   var height=Number(elem.scrollHeight),viewport=Number(elem.clientHeight);
   if(!(height>viewport+20&&viewport>180))return false;
   var top=rectTop(card),r=elem.getBoundingClientRect(),pageRect=card.getBoundingClientRect();
   if(top===null||!r||!Number.isFinite(r.top)||!pageRect||pageRect.height<=0)return false;
   var now=Number(elem.scrollTop)||0;
   var relativePageTop=top-r.top+now;
   var target=clip(relativePageTop+progress*Math.max(0,pageRect.height-viewport*.45),
                   0,height-viewport);
   if(!(target>now+2))return false;
   elem.scrollTop=target;
   var after=rectTop(card),moved=after!==null&&Math.abs(after-top)>1.0;
   if(!moved){elem.scrollTop=now;return false}
   owner='scroll';scroller=elem;
   meters.scrollCorrected++;meters.visualCorrections++;
   return true;
 }
 function transformCandidate(card,progress){
   var host=by('b345NormalStack'),reader=by('mushafReader');
   if(!host||!host.style||!reader||!reader.getBoundingClientRect)return false;
   if(!stackOriginal){
     var original=preserveStyle(host);
     if(original.value&&original.value!=='none')return false; // B345 owns any existing transform.
     stack=host;stackOriginal=original;
   }else if(stack!==host){resetTransform();return false}
   var cr=card.getBoundingClientRect(),rr=reader.getBoundingClientRect();
   if(!(cr&&rr&&cr.height>200&&rr.height>180))return false;
   var baseTop=cr.top-lastShift;
   var desired=rr.top-baseTop-progress*cr.height;
   var shift=clip(desired,-2*Math.max(1,cr.height),2*Math.max(1,cr.height));
   if(!Number.isFinite(shift))return false;
   var prior=rectTop(card);
   host.style.setProperty('transform','translate3d(0,'+shift.toFixed(2)+'px,0)','important');
   var after=rectTop(card);
   if(after===null||prior===null||Math.abs(after-prior)<.75){
     resetTransform();return false;
   }
   lastShift=shift;owner='native-stack';meters.stackCorrected++;meters.visualCorrections++;
   return true;
 }
 function keepTransform(card,progress){
   if(!stack||!stackOriginal)return false;
   var rr=by('mushafReader')&&by('mushafReader').getBoundingClientRect();
   var cr=card&&card.getBoundingClientRect();
   if(!rr||!cr||!(cr.height>200))return false;
   var base=cr.top-lastShift;
   var shift=clip(rr.top-base-progress*cr.height,-2*cr.height,2*cr.height);
   if(!Number.isFinite(shift))return false;
   stack.style.setProperty('transform','translate3d(0,'+shift.toFixed(2)+'px,0)','important');
   lastShift=shift;return true;
 }
 function sync(){
   try{
     var s=B()&&B().state,print=printed();
     if(!print||!s||!['silent','audio'].includes(s.mode)){reset();return false}
     css();
     if(s.mode==='silent'){
       if(mode!=='silent'){reset();d.body.classList.add(SILENT);mode='silent';meters.silentBorderClears++}
       return true;
     }
     var p220=w.__BASAIR_P220_ORIGINAL_AUDIO_FOLLOW__;
     if(!p220||typeof p220.status!=='function'||!p220.status().active){
       reset();meters.failClosed++;meters.lastReason='P220 original audio surface not active';return false
     }
     var page=Number(s.page),card=actualCard(page);
     if(!card){reset();meters.failClosed++;meters.lastReason='native printed image not ready';return false}
     if(mode!=='audio'||page!==activePage){
       reset();mode='audio';activePage=page;d.body.classList.add(AUDIO);
       proofProgress=pnum(s.progress);proofTop=rectTop(card);
       prevProgress=proofProgress;prevTop=proofTop;
       meters.lastReason='acquiring native audio progress';return true;
     }
     d.body.classList.add(AUDIO);
     if(s.paused||s.userScrolling||d.hidden){proofProgress=pnum(s.progress);proofTop=rectTop(card);return true}
     var progress=pnum(s.progress),top=rectTop(card);
     if(progress===null||top===null){meters.failClosed++;meters.lastReason='no native audio progress or geometry';return false}
     if(prevProgress!==null&&Math.abs(progress-prevProgress)>0.00005)meters.progressObserved++;
     prevProgress=progress;
     if(owner==='native-stack'){
       if(!keepTransform(card,progress)){resetTransform();owner='native'}
       else{prevTop=rectTop(card);return true}
     }
     if(owner==='scroll'&&scroller){
       if(scrollCandidate(scroller,card,progress)){prevTop=rectTop(card);return true}
       // Keep the native scroll placement if the current requested target
       // is already reached; do not layer a transform over working scroll.
       var delta=prevTop===null?0:Math.abs(top-prevTop);
       if(delta>0.6){meters.visibleMovementEvents++;proofProgress=progress;proofTop=top;prevTop=top;return true}
     }
     if(proofProgress===null||proofTop===null||progress<proofProgress){
       proofProgress=progress;proofTop=top;prevTop=top;return true
     }
     var audioDelta=progress-proofProgress;
     var visibleDelta=Math.abs(top-proofTop);
     if(visibleDelta>=1.6){
       meters.visibleMovementEvents++;proofProgress=progress;proofTop=top;prevTop=top;
       meters.lastReason='native page already moving';return true;
     }
     if(audioDelta<0.002){prevTop=top;return true}
     meters.stalledProgressEvents++;
     var sc1=by('mushafReader'),sc2=by('pageReading');
     if(scrollCandidate(sc1,card,progress)||scrollCandidate(sc2,card,progress)){
       meters.lastReason='recovered through real scroller';
     }else if(transformCandidate(card,progress)){
       meters.lastReason='recovered by moving the same native R33 stack';
     }else{
       meters.failClosed++;meters.lastReason='no visible native movement possible';
     }
     proofProgress=progress;proofTop=rectTop(card);prevTop=proofTop;return true;
   }catch(e){meters.lastError=String(e&&e.message||e).slice(0,160);meters.failClosed++;reset();return false}
 }
 function disable(){enabled=false;reset();if(timer&&w.clearInterval)w.clearInterval(timer);timer=0;return true}
 function enable(){enabled=true;if(!timer&&w.setInterval)timer=w.setInterval(sync,120);return sync()}
 function status(){return Object.assign({version:221,enabled:enabled,mode:mode,page:activePage,
    visualOwner:owner,correcting:owner!=='native'},meters)}
 function init(){if(!timer&&w.setInterval)timer=w.setInterval(sync,120);sync()}
 w.__BASAIR_P221_VISIBLE_PRINT_FOLLOW__=Object.freeze({
   version:221,enable:enable,disable:disable,refresh:sync,status:status,
   _test:Object.freeze({scrollCandidate:scrollCandidate,transformCandidate:transformCandidate})
 });
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})(typeof window!=='undefined'?window:globalThis,typeof document!=='undefined'?document:null);
