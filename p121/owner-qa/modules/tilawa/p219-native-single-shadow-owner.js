/* BASAIR P219 — single native-word highlight owner, protected Tilawa STAGING.
 * V695 P215 adds a screen-center ayah guide that can overlap the B345 word
 * indicator. This arbiter REMOVES only P215's separate visual marker by
 * invoking its public disable() API. No Quran DOM/CSS/audio/page/scroll edits.
 * It does NOT fabricate word timestamps or create a new visual overlay.
 * Must load AFTER p215-digital-follow-shadow.js in a separately owner-signed
 * protected Tilawa OTA, after QA050 authorization.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P219_SINGLE_SHADOW_OWNER__)return;
 var VERSION=219,enabled=true,suppressed=false,priorEnabled=null,
     errors=0,lastError='',actions=0,unsubscribe=null,subscribed=false;
 function old(){return w.__BASAIR_P215_DIGITAL_SHADOW__}
 function inspect(){
   var a=old();
   if(!a||typeof a.disable!=='function'||typeof a.status!=='function')
     return null;
   var state=a.status();
   return state&&typeof state==='object'?{api:a,state:state}:null;
 }
 function suppress(){
   if(!enabled)return false;
   try{
     var entry=inspect();
     if(!entry){lastError='P215 visual adapter unavailable';return false}
     if(priorEnabled===null)priorEnabled=entry.state.enabled!==false;
     if(entry.state.enabled!==false||entry.state.active===true){
       entry.api.disable();actions++;
     }
     var current=entry.api.status();
     suppressed=!!(current&&current.enabled===false&&current.active===false);
     if(!suppressed){lastError='P215 visual overlay not released';errors++;return false}
     lastError='';return true;
   }catch(e){suppressed=false;errors++;lastError=String(e&&e.message||e).slice(0,160);return false}
 }
 function nativeFollowReady(){
   var core=w.__BASAIR_P213_FOLLOW__,b345=w.__BASAIR_B345_SEQUENCE__;
   return !!(core&&typeof core.status==='function'&&
     core.status()&&core.status().route==='digital'&&
     b345&&b345.state&&b345.state.running===true);
 }
 function followChange(){
   if(enabled)suppress(); // Never invokes B345 start/stop/audio methods.
 }
 function subscribe(){
   if(subscribed)return true;
   var core=w.__BASAIR_P213_FOLLOW__;
   if(!core||typeof core.onChange!=='function')return false;
   unsubscribe=core.onChange(followChange);
   subscribed=true;return true;
 }
 function enable(){enabled=true;subscribe();return suppress()}
 function disable(){
   enabled=false;
   if(typeof unsubscribe==='function'){unsubscribe();unsubscribe=null;subscribed=false}
   var entry=null;
   try{entry=inspect()}catch(_){}
   // Only restore P215 if it was enabled before this module took ownership;
   // preserve an existing user/host disabled or locked P215 state.
   if(priorEnabled===true&&entry&&entry.state.locked!==true&&
      entry.state.enabled===false&&typeof entry.api.enable==='function'){
      try{entry.api.enable()}catch(e){lastError=String(e&&e.message||e).slice(0,160);errors++}
   }
   suppressed=false;
   return true;
 }
 function status(){return{
   version:VERSION,enabled:enabled,oldShadowSuppressed:suppressed,
   nativeFollowDetected:nativeFollowReady(),actions:actions,errors:errors,
   lastError:lastError,hasAudioWordTimingProof:false,
   policy:'Native B345 word emphasis only; no P215 screen-center overlay; no synthetic word timing'
 }}
 w.__BASAIR_P219_SINGLE_SHADOW_OWNER__=Object.freeze({
   version:VERSION,enable:enable,disable:disable,status:status,
   _test:Object.freeze({suppress:suppress,subscribe:subscribe})
 });
 // Enforced load order after P215: remove the duplicate immediately, before
 // its next 220 ms paint, and listen to P213 route transitions thereafter.
 subscribe();suppress();
})(typeof window!=='undefined'?window:globalThis,
   typeof document!=='undefined'?document:null);
