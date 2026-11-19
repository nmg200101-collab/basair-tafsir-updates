/* P213 isolated control capture tests. This is not Android acceptance. */
(function(root){
 'use strict';
 root.__BASAIR_P213_CONTROL_TESTS__=function(){
   var failures=[], count=0, listeners={},calls={old:0,start:0,stop:0,pause:0,resume:0};
   function ck(title,valid){count++;if(!valid)failures.push(title);}
   function add(t,cb){if(!listeners[t])listeners[t]=[];if(listeners[t].indexOf(cb)<0)listeners[t].push(cb);}
   function remove(t,cb){var i=(listeners[t]||[]).indexOf(cb);if(i>=0)listeners[t].splice(i,1);}
   root.addEventListener=add;root.removeEventListener=remove;
   root.performance={now:function(){return root.__TEST_CLOCK__;}};root.__TEST_CLOCK__=1000;
   var old=function(){calls.old++;};
   ['touchend','pointerup','click'].forEach(function(t){add(t,old);});
   root.__BASAIR_B345_SEQUENCE__={state:{installed:true,running:false},
     _test:{captureControls:old}};
   var session=null;
   root.__BASAIR_P213_FOLLOW__={
     status:function(){return session;},
     start:function(route,mode){calls.start++;session={route:route,mode:mode,paused:false};return true;},
     stop:function(){calls.stop++;session=null;return true;},
     pause:function(){calls.pause++;session.paused=true;return true;},
     resume:function(){calls.resume++;session.paused=false;return true;}
   };
   root.__BASAIR_P213_ADAPTERS__={
     nativeReady:function(){return true;},install:function(){return true;},
     digitalEligible:function(){return false;},printedEligible:function(){return true;}
   };
   function target(name){return {closest:function(selector){
     return selector.indexOf('#'+name)>=0?{id:name}:null;
   }};}
   function fire(type,name){
     var e={target:target(name),cancelable:true,
       preventDefault:function(){this.prevented=true;},
       stopPropagation:function(){this.propagationStopped=true;},
       stopImmediatePropagation:function(){this.immediateStopped=true;}};
     (listeners[type]||[]).slice().forEach(function(cb){cb(e);});
     return e;
   }
   var api=root.__BASAIR_P213_CONTROL_BRIDGE__;
   ck('bridge exists',!!api && typeof api.enable==='function');
   ck('enable binds safely',api.enable()===true && api.status().enabled);
   ck('native handlers replaced',listeners.click.indexOf(old)<0);
   ck('single follow start',!!fire('click','sequenceSilentB345').prevented&&
     session&&session.route==='printed'&&calls.start===1&&calls.old===0);
   root.__TEST_CLOCK__=1300;
   fire('pointerup','sequenceSilentB345');
   ck('pointerup duplicate debounced',calls.start===1);
   root.__TEST_CLOCK__=2000;
   fire('click','sequenceMiniPause');
   ck('pause routed',calls.pause===1&&session.paused);
   root.__TEST_CLOCK__=2700;
   fire('click','sequenceMiniPause');
   ck('resume routed',calls.resume===1&&!session.paused);
   root.__TEST_CLOCK__=3400;
   fire('click','sequenceMiniStop');
   ck('stop routed',calls.stop===1&&!session);
   root.__TEST_CLOCK__=4100;
   ck('unknown controls delegate',!!fire('click','nextPage') && calls.old===1);
   ck('disabling restores native handlers',api.disable()===true&&
     listeners.click.indexOf(old)>=0&&!api.status().enabled);
   root.__TEST_CLOCK__=4800;
   fire('click','sequenceAudioB345');
   ck('after disable native acts',calls.old===2&&calls.start===1);
   ck('disable does not duplicate original listener',listeners.click.filter(function(x){return x===old;}).length===1);
   return {passed:count-failures.length,failed:failures.length,errors:failures};
 };
})(typeof window!=='undefined'?window:globalThis);
