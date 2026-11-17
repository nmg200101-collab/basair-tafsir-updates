/* BASAIR P196 / QA-050 — repair Tajwid printed Follow at 100%.
 * B345 lockNormalRenderer wrongly requires a B327 digital font metric even when
 * the active follow renderer is R33's PIXEL-based Tajwid page stack.
 * The original print has no .b327TextLine, so the B345 first-page surface
 * never commits and its heartbeat cannot scroll. This is an internal Follow
 * precondition only; it must NEVER change glyph size, Quran image or UI.
 * P194 printed 3D and P193 ornamental header are not modified.
 */
(function (w,d) {
  'use strict';
  if (w.__BASAIR_P196_TAJWID_FOLLOW__) return;
  var installed=false, base=0, state=null, repairs=0, observed=0, attempts=0;
  var FALLBACK_METRIC=18;
  function isPrintedFollow() {
    try {
      var b=d.body, ctl=w.__BASAIR_B345_SEQUENCE__, print=w.__BASAIR_PRINT_FOLLOW_100__;
      if(!b||!ctl||!ctl.state||ctl.state!==state) return false;
      if(!ctl.state.running||ctl.state.scaleMode!=='normal')return false;
      if(!b.classList.contains('reader-active')||b.classList.contains('stableDigital'))return false;
      if(b.classList.contains('h25-hifz')||b.classList.contains('h90-review')||b.classList.contains('h100-teacher'))return false;
      if(b.getAttribute('data-v144-print')!=='tajwid')return false;
      return !!(print&&typeof print.active==='function'&&print.active()&&typeof print.edition==='function'&&print.edition()==='tajwid');
    }catch(_){return false}
  }
  function install() {
    if(installed)return true;
    var ctl=w.__BASAIR_B345_SEQUENCE__,p=w.__BASAIR_PRINT_FOLLOW_100__;
    if(!ctl||!ctl.state||!p||typeof p.active!=='function')return false;
    var st=ctl.state;
    var prior=Object.getOwnPropertyDescriptor(st,'normalAnchorFontPx');
    if(prior&&!prior.configurable)return false;
    if(prior&&(prior.get||prior.set))return false; // do not wrap another extension
    base=Number(st.normalAnchorFontPx)||0;state=st;
    try{
      Object.defineProperty(st,'normalAnchorFontPx',{
        configurable:true,enumerable:true,
        get:function(){
          if(base>0)return base;
          if(isPrintedFollow()){observed++;return FALLBACK_METRIC;}
          return 0;
        },
        set:function(value){
          base=Number(value)||0;
        }
      });
      installed=true;
      // An already-running session can recover via B345's native heartbeat.
      if(isPrintedFollow()&&typeof ctl._test?.ensureNormalGeometryIntegrity==='function'){
        try{ctl._test.ensureNormalGeometryIntegrity()}catch(_){}
        repairs++;
      }
      return true;
    }catch(_){state=null;return false}
  }
  function boot() {
    if(install())return;
    // Installation may precede the B345 module when the OTA cache refreshes.
    if(++attempts<=15)w.setTimeout(boot,150);
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  w.__BASAIR_P196_TAJWID_FOLLOW__={
    version:196,
    install:install,
    status:function(){return{installed:installed,originalMetric:base,
      effectiveMetric:state?Number(state.normalAnchorFontPx)||0:0,
      printedSession:isPrintedFollow(),observations:observed,repairs:repairs};}
  };
})(window,document);
