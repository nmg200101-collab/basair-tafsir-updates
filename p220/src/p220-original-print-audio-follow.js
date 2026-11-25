/* Basair P220 — V695 original printed AUDIO Follow: ONE native B345/R33 surface.
 * Only original edition, B345 audio mode and 100% print zoom.
 * No page clones, synthetic audio timestamps, new borders or independent scroll loop.
 * Reveals the ALREADY-LOADED native printed page and removes fixed static overlap.
 * Scroll recovery is permitted ONLY when verified B345 progress/page advances
 * while the real native scroller demonstrably stalls. All other modes untouched.
 * STOP/disable restore the original DOM and body class.
 * STAGING only: not an OTA, no keys/signatures, requires device acceptance.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P220_ORIGINAL_AUDIO_FOLLOW__)return;
 var CLASS='p220-original-audio-live', STYLE='p220OriginalAudioSurfaceStyle';
 var current=false, enabled=true, timer=0, oldParent=null, oldNext=null, node=null;
 var lastPage=0,lastProgress=null,lastScroll=null,stall=0,session=0;
 var stats={activations:0,restores:0,controlMoves:0,scrollRecoveries:0,
   nativeScrollMoves:0,pageTransitions:0,waitingForNativePage:0,
   errors:0,lastError:'',lastPage:0,lastProgress:null};
 function get(id){return d.getElementById(id)}
 function safePage(x){return Number.isInteger(Number(x))&&Number(x)>=1&&Number(x)<=604?Number(x):0}
 function state(){var c=w.__BASAIR_B345_SEQUENCE__;return c&&c.state}
 function original(){
   var b=d.body,s=state(),p=w.__BASAIR_PRINT_FOLLOW_100__;
   if(!enabled||!b||!s||!s.running||s.mode!=='audio'||
       s.scaleMode!=='normal'||s.surfaceBusy||!safePage(s.page))return false;
   if(!b.classList.contains('reader-active')||b.classList.contains('stableDigital')||
       b.classList.contains('h25-hifz')||b.classList.contains('h90-review')||
       b.classList.contains('h100-teacher'))return false;
   if(!p||typeof p.active!=='function'||typeof p.edition!=='function'||
      typeof p.scale!=='function')return false;
   try{
     if(!p.active()||p.edition()!=='original'||Number(p.scale())!==100)return false;
     var f=w.localStorage&&w.localStorage.getItem('stableFont');
     if(f&&f!=='original')return false;
   }catch(_){return false}
   return !!(get('mushafReader')&&get('b345NormalStack')&&get('mushafText'));
 }
 function readyCard(page){
   var stack=get('b345NormalStack');if(!stack||!page)return null;
   var card=stack.querySelector('[data-r33-print-page="'+page+'"]')||
            stack.querySelector('[data-b345-page="'+page+'"]');
   if(!card||card.getAttribute('data-b345-ready')!=='1')return null;
   var image=card.querySelector('.r33PrintImage')||card.querySelector('img');
   if(!image||!image.complete||!(Number(image.naturalWidth)>0)||
      !(Number(image.naturalHeight)>0))return null;
   return card;
 }
 function injectStyle(){
   if(get(STYLE))return;
   var tag=d.createElement('style');tag.id=STYLE;
   tag.textContent=
    'body.'+CLASS+' #mushafReader #mushafText{opacity:0!important;visibility:hidden!important;pointer-events:none!important}' +
    'body.'+CLASS+' #mushafReader #b345NormalStack{opacity:1!important;visibility:visible!important;pointer-events:auto!important}' +
    'body.'+CLASS+' #b345NormalStack>.r33PrintShell{border:0!important;outline:0!important;box-shadow:none!important;border-radius:0!important}' +
    'body.'+CLASS+' #b345NormalStack>.r33PrintShell>.stableFrame{display:none!important}' +
    'body.'+CLASS+' #mushafDock{height:calc(96px + env(safe-area-inset-bottom))!important;min-height:96px!important;max-height:none!important;padding:43px 5px env(safe-area-inset-bottom)!important;position:relative!important;box-sizing:border-box!important;overflow:visible!important}' +
    'body.'+CLASS+' #mushafDock>#sequenceMiniControl{display:flex!important;position:absolute!important;top:2px!important;bottom:auto!important;left:4px!important;right:4px!important;width:auto!important;height:38px!important;min-height:38px!important;transform:none!important;z-index:1!important;align-items:center!important;justify-content:center!important;gap:6px!important;padding:3px 6px!important;margin:0!important;border:0!important;box-shadow:none!important;background:rgba(9,67,54,.97)!important}' +
    'body.'+CLASS+' #mushafDock>#sequenceMiniControl:not(.show){display:none!important}' +
    'body.'+CLASS+' #mushafDock>#sequenceMiniControl #sequenceMiniText{display:none!important}' +
    'body.'+CLASS+' #mushafDock>#sequenceMiniControl button{position:static!important;min-height:30px!important;padding:5px 12px!important;margin:0!important;line-height:1.2!important;color:#fff!important}';
   (d.head||d.documentElement).appendChild(tag);
 }
 function moveControl(){
   var control=get('sequenceMiniControl'),dock=get('mushafDock');
   if(!control||!dock||!control.parentNode)return false;
   if(node!==control){node=control;oldParent=control.parentNode;oldNext=control.nextSibling}
   if(control.parentNode!==dock){
     dock.insertBefore(control,dock.firstChild);stats.controlMoves++;
   }
   return control.parentNode===dock;
 }
 function restoreControl(){
   var control=node;
   if(!control||!oldParent||!oldParent.isConnected||
       control.parentNode===oldParent)return;
   var before=oldNext&&oldNext.parentNode===oldParent?oldNext:null;
   oldParent.insertBefore(control,before);
 }
 function stop(){
   if(current){
     current=false;session++;stats.restores++;
     if(d.body)d.body.classList.remove(CLASS);
     restoreControl();
   }
   lastPage=0;lastProgress=null;lastScroll=null;stall=0;
 }
 function scrollRecovery(s,card){
   var reader=get('mushafReader');if(!reader)return;
   var position=Number(reader.scrollTop)||0;
   var progress=typeof s.progress==='number'&&Number.isFinite(s.progress)&&
        s.progress>=0&&s.progress<=1?s.progress:null;
   var page=safePage(s.page);
   // A paused audio session keeps exactly the same native printed page and
   // existing pause/stop controls. It must NOT reveal the stale static stage.
   if(s.paused){lastPage=page;lastProgress=progress;lastScroll=position;stall=0;return}
   var nativeMoved=lastScroll!==null&&Math.abs(position-lastScroll)>1.25;
   if(nativeMoved){stats.nativeScrollMoves++;stall=0}
   if(lastPage&&page!==lastPage)stats.pageTransitions++;
   var pageAdvanced=lastPage>0&&page!==lastPage;
   var progressAdvanced=lastPage===page&&progress!==null&&lastProgress!==null&&
        progress-lastProgress>0.002;
   if(!nativeMoved&&(pageAdvanced||progressAdvanced))stall++;
   if(!nativeMoved&&stall>=2&&s.userScrolling!==true&&
      Number(reader.scrollHeight)>Number(reader.clientHeight)+10){
      // This offset is derived from the REAL B345 page card, not a new renderer.
      var pageOffset=Number(card.offsetTop);
      var pageHeight=Number(card.offsetHeight);
      var viewport=Number(reader.clientHeight);
      if(Number.isFinite(pageOffset)&&pageOffset>=0&&pageHeight>0&&viewport>0){
        var frac=progress===null?0:progress;
        var target=Math.min(Number(reader.scrollHeight)-viewport,
                   Math.max(0,pageOffset+frac*Math.max(0,pageHeight-viewport*.5)));
        if(target>position+2){
          reader.scrollTop=target;
          // Only count a recovery when the real native scroller accepted it.
          if(Math.abs((Number(reader.scrollTop)||0)-target)<=2){
            stats.scrollRecoveries++;position=Number(reader.scrollTop)||0;
          }
        }
      }
      stall=0;
   }
   lastPage=page;lastProgress=progress;lastScroll=position;
   stats.lastPage=page;stats.lastProgress=progress;
 }
 function sync(){
   try{
     if(!original()){stop();return false}
     var s=state(),card=readyCard(safePage(s.page));
     if(!card){
       stats.waitingForNativePage++;
       // Never hide the original page unless the native replacement is ready.
       if(current)stop();
       return false;
     }
     if(!current){
       injectStyle();
       if(!moveControl())return false; // Do not obscure Quran while dock unavailable.
       current=true;session++;stats.activations++;
       d.body.classList.add(CLASS);
       lastPage=0;lastProgress=null;lastScroll=null;stall=0;
     }
     scrollRecovery(s,card);
     return true;
   }catch(e){stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,180);stop();return false}
 }
 function disable(){
   enabled=false;stop();
   if(timer&&typeof w.clearInterval==='function')w.clearInterval(timer);
   timer=0;return true;
 }
 function enable(){enabled=true;if(!timer&&typeof w.setInterval==='function')timer=w.setInterval(sync,120);return sync()}
 function status(){return Object.assign({version:220,enabled:enabled,active:current,
   originalAudioEligible:original(),nativeScrollOwner:'B345/R33'},stats)}
 function init(){
   if(!timer&&typeof w.setInterval==='function')timer=w.setInterval(sync,120);
   sync();
 }
 w.__BASAIR_P220_ORIGINAL_AUDIO_FOLLOW__=Object.freeze({
   version:220,enable:enable,disable:disable,refresh:sync,status:status,
   _test:Object.freeze({eligible:original,readyCard:readyCard,scrollRecovery:scrollRecovery})
 });
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})(typeof window!=='undefined'?window:globalThis,
  typeof document!=='undefined'?document:null);
