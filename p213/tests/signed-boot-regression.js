/* Isolated P213 signed-OTA boot: provenance, pending sessions,
 * retries and safe fallback. Never accesses an Android device. */
(function(root){
  'use strict';
  root.__BASAIR_P213_BOOT_TESTS__=function(bootSource){
    var checks=0,errors=[];
    function test(name,value){checks++;if(!value)errors.push(name);}
    function scenario(signed,blocked,oldP212){
      var timers=[],enableCount=0,disableCount=0;
      var state={installed:true,running:!!blocked};
      var p={version:oldP212?212:213,status:function(){return {running:false};}};
      var c={status:function(){return null;}};
      var b={nativeReady:function(){return true;}};
      var bridge={enable:function(){enableCount++;return true;},disable:function(){disableCount++;return true;}};
      var w={
        __BASAIR_B345_SEQUENCE__:{state:state},
        __BASAIR_P212_TAJWID_STATIC_FOLLOW__:p,
        __BASAIR_P213_FOLLOW__:c,
        __BASAIR_P213_ADAPTERS__:b,
        __BASAIR_P213_CONTROL_BRIDGE__:bridge,
        setTimeout:function(f){timers.push(f);return timers.length;},
        clearTimeout:function(){},
      };
      var d={currentScript:signed?{dataset:{basairP121:'tilawa'}}:{dataset:{basairP121:'test'}}};
      new Function('window','document',bootSource)(w,d);
      return {w:w,d:d,timers:timers,engine:state,p212:p,
        enabled:function(){return enableCount;},disabled:function(){return disableCount;}};
    }
    var no=scenario(false,false,false);
    test('untrusted script cannot auto-enable',no.enabled()===0 && no.w.__BASAIR_P213_BOOT__.status().phase==='disabled');
    test('untrusted script cannot retry',no.w.__BASAIR_P213_BOOT__.retry()===false);
    var ready=scenario(true,false,false);
    test('signed ready boot activates exactly once',ready.enabled()===1 &&
      ready.w.__BASAIR_P213_BOOT__.status().phase==='active');
    test('active boot retry refused',ready.w.__BASAIR_P213_BOOT__.retry()===false);
    test('disable restores previous listener',ready.w.__BASAIR_P213_BOOT__.disable()===true &&
      ready.disabled()===1 && ready.w.__BASAIR_P213_BOOT__.status().phase==='disabled');
    var busy=scenario(true,true,false);
    test('active B345 never seized',busy.enabled()===0 &&
      busy.w.__BASAIR_P213_BOOT__.status().phase==='pending');
    busy.engine.running=false;busy.timers.shift()();
    test('boot activates after old engine idle',busy.enabled()===1 &&
      busy.w.__BASAIR_P213_BOOT__.status().phase==='active');
    var obsolete=scenario(true,false,true);
    test('old P212 never auto-seized',obsolete.enabled()===0);
    obsolete.p212.version=213;obsolete.timers.shift()();
    test('boot waits for P212 replacement',obsolete.enabled()===1);
    var timeout=scenario(true,true,false);
    for(var i=0;i<39;i++)if(timeout.timers.length)timeout.timers.shift()();
    test('timeout preserves original native engine',timeout.enabled()===0 &&
      timeout.w.__BASAIR_P213_BOOT__.status().phase==='native-fallback');
    test('timed-out boot supports explicit retry',timeout.w.__BASAIR_P213_BOOT__.retry()===true &&
      timeout.w.__BASAIR_P213_BOOT__.status().phase==='pending');
    return {passed:checks-errors.length,failed:errors.length,errors:errors};
  };
})(typeof window!=='undefined'?window:globalThis);
