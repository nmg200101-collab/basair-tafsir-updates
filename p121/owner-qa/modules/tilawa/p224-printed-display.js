/* P224: narrowly restore the native B345 raster startup precondition.
 * V695 lockNormalRenderer requires normalAnchorFontPx > 0 before R33 can
 * append the first page. P205's existing raster fallback covers Tajwid only.
 * Preserve the existing getter/setter and extend it to ORIGINAL AUDIO only.
 * No scroll writer, CSS, overlay, renderer, timer clock or audio changes. */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P224_PRINT_METRIC__)return;
 var installed=false,attempts=0;
 function eligible(s){
   var b=d.body,p=w.__BASAIR_PRINT_FOLLOW_100__;
   if(!b||!s||!s.running||s.mode!=='audio'||s.scaleMode!=='normal'||s.printEditionAtStart!=='original'||
      !b.classList.contains('reader-active')||['stableDigital','h25-hifz','h90-review','h100-teacher'].some(function(k){return b.classList.contains(k)}))return false;
   try{return !!(p&&p.active()&&Number(p.scale())===100&&p.edition()==='original'&&
     (w.localStorage.getItem('stableFont')||'original')==='original')}catch(_){return false}
 }
 function install(){
   if(installed)return true;
   var c=w.__BASAIR_B345_SEQUENCE__,p=w.__BASAIR_P205_ORIGINAL_PRINT_PARITY__;
   if(!c||!c.state||!p||typeof p.install!=='function'||!p.install())return false;
   var s=c.state,prior=Object.getOwnPropertyDescriptor(s,'normalAnchorFontPx');
   if(!prior||!prior.configurable||typeof prior.get!=='function'||typeof prior.set!=='function')return false;
   Object.defineProperty(s,'normalAnchorFontPx',{configurable:true,enumerable:prior.enumerable,
     get:function(){var n=prior.get.call(s);return Number(n)>0?n:eligible(s)?18:n},
     set:function(v){prior.set.call(s,v)}});
   installed=true;return true;
 }
 function boot(){if(!install()&&++attempts<70)w.setTimeout(boot,150)}
 w.__BASAIR_P224_PRINT_METRIC__=Object.freeze({install:install,status:function(){return {installed:installed,attempts:attempts}}});
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);
