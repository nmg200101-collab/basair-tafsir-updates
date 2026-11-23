/* P219 visual-arbiter contract: no fake word timing, no second overlay.
 * All tests are isolated: not Android WebView or signed OTA acceptance.
 */
(function(root){
root.__BASAIR_P219_SINGLE_OWNER_TESTS__=function(src){
 var pass=0,fail=[],n=0;function ck(label,v){if(v)pass++;else fail.push(label)}
 function boot(opts){
  opts=opts||{};
  var active=opts.active===undefined?true:opts.active,enabled=opts.enabled===undefined?true:opts.enabled,
      locked=!!opts.locked,disableCount=0,enableCount=0,startCount=0,stopCount=0;
  var nodes=[{cls:['p215ShadowMark']},{cls:['p215ShadowMark']}];
  var old=opts.noOld?null:{
   version:215,
   status(){return{active:active,enabled:enabled,locked:locked}},
   disable(){disableCount++;enabled=false;active=false;nodes.forEach(x=>x.cls=[]);return true},
   enable(){enableCount++;if(locked)return false;enabled=true;active=true;nodes.forEach(x=>x.cls=['p215ShadowMark']);return true}
  };
  var listeners=[];
  var native={state:{running:true,mode:'audio',page:4},
     startAudio(){startCount++},stop(){stopCount++}};
  var core={status(){return{route:'digital',mode:'audio'}},
    onChange(fn){listeners.push(fn);return()=>{listeners=listeners.filter(x=>x!==fn)}}
  };
  var w={__BASAIR_P215_DIGITAL_SHADOW__:old,
     __BASAIR_P213_FOLLOW__:core,__BASAIR_B345_SEQUENCE__:native};
  new Function('window','document',src)(w,{});
  return{w,api:w.__BASAIR_P219_SINGLE_SHADOW_OWNER__,
    native,core,nodes,old,events(){listeners.forEach(fn=>fn({type:'start'}))},
    counts(){return{disableCount,enableCount,startCount,stopCount}}}
 }
 var x=boot(),s=x.api.status();
 ck('P219 singleton registered',x.api.version===219);
 ck('P215 is disabled immediately after protected load order',x.counts().disableCount===1);
 ck('Existing extra P215 shadow marks removed by its own API',
    x.nodes.every(y=>!y.cls.includes('p215ShadowMark')));
 ck('No new P219 marker is ever inserted',!src.includes("classList.add(")&&!src.includes("style.cssText"));
 ck('Does not modify Quran text or geometry',!src.includes("textContent=")&&!src.includes("scrollTop=")&&!src.includes("innerHTML="));
 ck('No synthetic word timing',s.hasAudioWordTimingProof===false&&
    !src.includes("currentTime")&&!src.includes("playbackRate"));
 ck('Native B345 engine remains running and unmodified',x.native.state.running===true&&
    x.counts().startCount===0&&x.counts().stopCount===0);
 ck('Status explicitly reports native digital follow',s.nativeFollowDetected===true);
 ck('P219 visual owner active only as suppression flag',s.oldShadowSuppressed===true);
 x.events();
 ck('Does not repeatedly disable already disabled P215',x.counts().disableCount===1);
 x.old.enable();x.events();
 ck('Reenabled duplicate is removed at next route event',x.counts().disableCount===2&&x.api.status().oldShadowSuppressed);
 var y=boot({active:false,enabled:false});
 ck('Pre-disabled P215 respected',y.counts().disableCount===0);
 y.api.disable();ck('Restores no previously disabled overlay',y.counts().enableCount===0);
 var z=boot({noOld:true});
 ck('Missing P215 fails closed without creating shading',z.api.status().oldShadowSuppressed===false);
 ck('Missing P215 error is surfaced',z.api.status().lastError.includes('unavailable'));
 var q=boot({locked:true});
 q.api.disable();ck('Locked P215 is never reactivated on shutdown',q.counts().enableCount===0);
 var r=boot();
 r.api.disable();
 ck('Rollback switch restores previously active P215 only once',r.counts().enableCount===1);
 r.events();
 ck('Disabled owner no longer consumes native route events',r.counts().disableCount===1);
 r.api.enable();
 ck('Re-enabled arbitration stops duplicate P215 again',r.api.status().oldShadowSuppressed);
 var t=boot();
 new Function('window','document',src)(t.w,{});
 ck('Duplicate module injection does not install two owners',t.counts().disableCount===1);
 ck('No polling timer or background MutationObserver',!src.includes('setTimeout(')&&!src.includes('MutationObserver'));
 ck('No DOM/CSS node access in suppression module',!src.includes('querySelector')&&!src.includes('createElement'));
 ck('No protected B345 functions invoked by arbiter',!src.includes('.startAudio(')&&!src.includes('.stop('));
 ck('P215 pinned source remains unmodified',src.includes('public disable() API'));
 return{passed:pass,failed:fail.length,errors:fail,limit:'Mock unit tests only; on-device native word cue unverified'};
}
})(typeof window!=='undefined'?window:globalThis);
