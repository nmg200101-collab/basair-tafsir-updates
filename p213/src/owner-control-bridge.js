/* P213 experimental UI ownership bridge — DO NOT auto-enable in V695.
 * Explicit enable() replaces only B345's three capture handlers and restores
 * the originals via disable(). It reuses B345/P212 renderers and audio.
 */
(function(root){
 'use strict';
 if(root.__BASAIR_P213_CONTROL_BRIDGE__)return;
 var core,adapter,legacyHandler,enabled=false,attached=false,lastAction='',lastAt=-1e10,errors=[];
 var EVENTS=['touchend','pointerup','click'];
 var SILENT='#sequenceSilent,#sequenceSilentV10,#sequenceSilentV177,#sequenceSilentV178,#sequenceSilentB336,#sequenceSilentB337,#sequenceSilentB338,#sequenceSilentB339,#sequenceSilentB340,#sequenceSilentB345,[data-b336-sequence="silent"],[data-b337-sequence="silent"],[data-b338-sequence="silent"],[data-b339-sequence="silent"],[data-b340-sequence="silent"],[data-b345-sequence="silent"],#p212Silent';
 var AUDIO='#sequenceAudio,#sequenceAudioV10,#sequenceAudioB336,#sequenceAudioB337,#sequenceAudioB338,#sequenceAudioB339,#sequenceAudioB340,#sequenceAudioB345,[data-b336-sequence="audio"],[data-b337-sequence="audio"],[data-b338-sequence="audio"],[data-b339-sequence="audio"],[data-b340-sequence="audio"],[data-b345-sequence="audio"],#p212Audio';
 var STOP='#playSeq,#sequenceMiniStop,[data-b336-sequence-stop],[data-b337-sequence-stop],[data-b345-sequence-stop],#p212Stop';
 var PAUSE='#sequenceMiniPause,#p212Pause';
 function match(el,selector){return el&&typeof el.closest==='function'&&el.closest(selector)}
 function now(){return root.performance&&root.performance.now?root.performance.now():Date.now()}
 function emit(reason){
   errors.push(reason);if(errors.length>20)errors.shift();
   try{if(root.CustomEvent&&root.dispatchEvent)root.dispatchEvent(new root.CustomEvent('basair-p213-follow-failure',{detail:{reason:reason}}))}catch(_){}
 }
 function takeover(ev){
   if(!enabled)return;
   var el=ev&&ev.target;
   var mode=match(el,SILENT)?'silent':match(el,AUDIO)?'audio':'';
   var op=mode?'start':match(el,STOP)?'stop':match(el,PAUSE)?'pause':'';
   if(!op){legacyHandler.call(root,ev);return;}
   var state=core.status();
   if(op!=='start'&&!state){
     // Let preexisting external sessions and direct P212 buttons act normally.
     if(match(el,'#p212Stop,#p212Pause'))return;
     legacyHandler.call(root,ev);return;
   }
   if(ev.cancelable!==false&&ev.preventDefault)ev.preventDefault();
   if(ev.stopPropagation)ev.stopPropagation();
   if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
   var key=op+':'+mode,at=now();
   if(key===lastAction&&at-lastAt<550)return;
   lastAction=key;lastAt=at;
   try{
     var result=false;
     if(op==='start'){
       var route=adapter.digitalEligible()?'digital':adapter.printedEligible()?'printed':'';
       result=!!(route&&core.start(route,mode));
     } else if(op==='stop')result=core.stop('p213-ui-stop');
     else result=state.paused?core.resume():core.pause();
     if(!result)emit('unavailable '+key);
   }catch(err){emit('error '+key+': '+String(err));}
 }
 function enable(){
   if(enabled)return true;
   var engine=root.__BASAIR_B345_SEQUENCE__;
   if(!engine||!engine.state||!engine.state.installed||!engine._test||
     typeof engine._test.captureControls!=='function'||engine.state.running)return false;
   // Never seize UI controls while a P212 session started by the older UI
   // is active. That audio would otherwise be invisible to P213 ownership.
   var p212=root.__BASAIR_P212_TAJWID_STATIC_FOLLOW__;
   // If P212 v1 was already registered in this WebView, the v2 script's
   // duplicate-global guard cannot replace it; fail closed until reload.
   if(p212 && Number(p212.version)<213)return false;
   if(p212&&typeof p212.status==='function'){
     var prior=p212.status();
     if(prior&&prior.running)return false;
   }
   core=root.__BASAIR_P213_FOLLOW__;adapter=root.__BASAIR_P213_ADAPTERS__;
   if(!core||!adapter||!adapter.nativeReady||!adapter.nativeReady()||core.status())return false;
   if(adapter.install()===false)return false;
   legacyHandler=engine._test.captureControls;
   // Do not create a second handler; replace precisely the three exposed
   // native capture handlers. Other scroll/pointer listeners remain intact.
   try{
     EVENTS.forEach(function(type){root.removeEventListener(type,legacyHandler,true)});
     EVENTS.forEach(function(type){root.addEventListener(type,takeover,{capture:true,passive:false})});
     enabled=true;attached=true;return true;
   }catch(err){
     EVENTS.forEach(function(type){root.removeEventListener(type,takeover,true)});
     EVENTS.forEach(function(type){root.addEventListener(type,legacyHandler,{capture:true,passive:false})});
     emit('install: '+String(err));return false;
   }
 }
 function disable(){
   if(!enabled)return false;
   if(core.status()&&core.stop('p213-ui-uninstall')===false)return false;
   EVENTS.forEach(function(type){root.removeEventListener(type,takeover,true)});
   EVENTS.forEach(function(type){root.addEventListener(type,legacyHandler,{capture:true,passive:false})});
   enabled=false;attached=false;return true;
 }
 root.__BASAIR_P213_CONTROL_BRIDGE__=Object.freeze({enable:enable,disable:disable,
   status:function(){return {enabled:enabled,attached:attached,errors:errors.slice()}}});
})(typeof window!=='undefined'?window:globalThis);
