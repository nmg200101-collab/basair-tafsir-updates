/* P224 colored printed follow: compatibility facade for P214, no independent
 * renderer, timer, audio element, CSS or aliases. Native B345 owns both modes.
 * Exact V695 source: tilawa-arkani-nav-header-final-lock-b255.js, verified APK.
 * Staging only: requires integration/phone validation. */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P212_TAJWID_STATIC_FOLLOW__)return;
 var owned=null;
 function engine(){return w.__BASAIR_B345_SEQUENCE__}
 function eligible(){
   var b=d.body,p=w.__BASAIR_PRINT_FOLLOW_100__,c=engine();
   if(!b||!b.classList.contains('reader-active')||
      ['stableDigital','h25-hifz','h90-review','h100-teacher'].some(function(k){return b.classList.contains(k)}))return false;
   try{return !!(w.localStorage.getItem('v129PrintMode')==='tajwid'&&
     (w.localStorage.getItem('stableFont')||'original')==='original'&&
     p&&p.active()&&Number(p.scale())===100&&p.edition()==='tajwid'&&c&&c.state&&
     c.state.installed&&typeof c.startSilent==='function'&&typeof c.startAudio==='function'&&
     typeof c.stop==='function'&&c._test&&typeof c._test.togglePause==='function')}catch(_){return false}
 }
 function session(){
   var c=engine(),s=c&&c.state;
   if(!owned||c!==owned.engine||!s||!s.running||s.generation!==owned.generation){owned=null;return null}
   return s;
 }
 function status(){
   var s=session();return {running:!!s,paused:!!(s&&s.paused),mode:s?s.mode:'',page:s?s.page:null,progress:s?s.progress:0};
 }
 function start(mode){
   if((mode!=='audio'&&mode!=='silent')||!eligible()||session())return false;
   var c=engine(),p=w.__BASAIR_P205_ORIGINAL_PRINT_PARITY__;
   if(c.state.running||!p||typeof p.install!=='function'||!p.install())return false;
   // Native start returns false even on success; state is the contract.
   var generation=c.state.generation;
   try{(mode==='audio'?c.startAudio:c.startSilent).call(c)}
   catch(err){if(c.state.running&&c.state.generation!==generation)c.stop();throw err}
   if(!c.state.running||c.state.generation===generation)return false;
   if(c.state.mode!==mode){c.stop();return false}
   owned={engine:c,generation:c.state.generation};
   return true;
 }
 function stop(){var s=session();if(!s)return true;engine().stop();return !session()}
 function pause(){var s=session();if(!s)return false;var before=!!s.paused;engine()._test.togglePause();s=session();return !!s&&!!s.paused!==before}
 // No P212-specific body route or controls. Native UI remains visible.
 w.__BASAIR_P212_TAJWID_STATIC_FOLLOW__=Object.freeze({version:224,mode:'native-r33-both-modes',
   start:start,stop:stop,pause:pause,status:status,route:function(){return eligible()},boot:function(){return true}});
})(window,document);
