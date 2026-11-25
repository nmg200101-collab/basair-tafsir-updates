/* P214 DIGITAL-ONLY correction / V695-verified follow bridge. Opt-in; never rewrites B345/R33/R51 globals.
 * B345 begin(), stop(), togglePause() return FALSE even on successful
 * transitions. State postconditions, not return values, are authoritative.
 * P212-v2 and all printed/colored routes remain byte-semantically unchanged.\n * New asset REPLACES the existing P213 route adapter in the signed module list,\n * never appended after it (P213 adapters use a duplicate-global guard).
 */
(function (root) {
  'use strict';
  if (root.__BASAIR_P213_ADAPTERS__) return;
  function legacy() { return root.__BASAIR_B345_SEQUENCE__; }
  function p212() { return root.__BASAIR_P212_TAJWID_STATIC_FOLLOW__; }
  function r33() { return root.__BASAIR_PRINT_FOLLOW_100__; }
  function r51() { return root.__BASAIR_PRINT_ZOOM_FOLLOW_R51__; }
  function excluded(b) { return !b || !b.classList.contains('reader-active') ||
    b.classList.contains('h25-hifz') || b.classList.contains('h90-review') ||
    b.classList.contains('h100-teacher'); }
  function printedEligible() {
    var b = root.document && root.document.body;
    if (excluded(b) || b.classList.contains('stableDigital')) return false;
    try { var f = root.localStorage && root.localStorage.getItem('stableFont');
      return !f || f === 'original'; } catch (_) { return false; }
  }
  function digitalEligible() {
    var d=root.document,b=d&&d.body;
    if (excluded(b) || !b.classList.contains('stableDigital') ||
        typeof d.getElementById!=='function') return false;
    var font=null;
    try { font=root.localStorage&&root.localStorage.getItem('stableFont'); }
    catch (_) { return false; }
    // V695 selects a font before the exact-page renderer finishes. Avoid
    // stealing controls until a REAL Quran word is committed in its host.
    if (!font || font==='original') return false;
    var scale=printedScale();
    if (!Number.isFinite(scale) || scale<100) return false;
    var large=scale>100, host=d.getElementById(
      large?'b274LargeTextHost':'stableDigitalHost');
    if (!host || host.childElementCount<1 ||
        host.getAttribute('aria-busy')==='true') return false;
    var word=null,flow=null;
    if (large) {
      // V695 B330 uses V160 local/fallback Quran flow above 100%.
      // The host is a standalone vertical scroller BEFORE Follow starts.
      // Do NOT accept its b329ZoomDiagnostic placeholder as Quran text.
      if (!b.classList.contains('b274LargeMushaf') ||
          host.getAttribute('data-b329-zoom-source')==='diagnostic' ||
          host.getAttribute('data-b330-scroll-owner')!=='b274LargeTextHost') return false;
      flow=typeof host.querySelector==='function' &&
        host.querySelector('.v160DigitalFlow:not(.b329ZoomDiagnostic)');
      word=flow && typeof flow.querySelector==='function' &&
        flow.querySelector('.quranWord[data-s][data-selectayah], .v160Ayah[data-s][data-selectayah]');
    } else {
      // IMPORTANT V695 RC18: stableRenderDigital() writes
      // renderExactUnicodePage() => .exactLine.text .unicodeLine .quranWord.
      // It NEVER writes .v160DigitalFlow to the 100% stableDigitalHost.
      // Requiring that unrelated zoom-only class prevented all digital
      // fonts (uthmani, digital, amiri, ruqaa...) from starting at 100%.
      flow=typeof host.querySelector==='function' &&
        host.querySelector('.exactLine.text .unicodeLine');
      word=flow && typeof flow.querySelector==='function' &&
        flow.querySelector('.quranWord[data-s][data-selectayah]');
    }
    return !!(flow && word && String(word.textContent||'').replace(/\s+/g,'').length);
  }
  function edition() {
    var v;
    try { v = root.localStorage && root.localStorage.getItem('v129PrintMode'); }
    catch (_) { return ''; }
    return v === 'muallam' ? 'original' : v === 'original' || v === 'tajwid' || v === 'blue' ? v : '';
  }
  function printedScale() {
    var n=0, b=root.document && root.document.body;
    try {
      var z=root.__BASAIR_B330_ZOOM__;
      if(z && typeof z.scale==='function')n=Number(z.scale())||0;
      if(!(n>0))n=Number(root.localStorage && root.localStorage.getItem('basair:tilawa-page-font-scale:v1'))||0;
      if(!(n>0) && b)n=Number(b.getAttribute('data-b274-mushaf-scale')||b.getAttribute('data-b273-mushaf-scale'))||0;
      if(!(n>0) && r33() && typeof r33().scale==='function')n=Number(r33().scale())||0;
    } catch(_) { return NaN; }
    return Number.isFinite(n) && n>0 ? n : NaN;
  }
  function p212Running() {
    var e=p212(), st=e && typeof e.status==='function' && e.status();
    return !!(st && st.running);
  }
  function nativeReady() {
    var e=legacy();
    return !!(e && e.state && typeof e.state.running==='boolean' &&
      typeof e.startSilent==='function' && typeof e.startAudio==='function' &&
      typeof e.stop==='function' && e._test && typeof e._test.togglePause==='function');
  }
  function nativeStart(mode) {
    if(!nativeReady() || p212Running())return false;
    var e=legacy();
    if(e.state.running)return false; // Do not seize a session started by old UI.
    var fn=mode==='audio'?e.startAudio:e.startSilent;
    // V695 returns false from begin() after successful start; inspect state.
    fn.call(e);
    var started = e.state.running===true && e.state.mode===mode;
    if (!started && e.state.running===true) {
      // The engine began but entered an unexpected mode. Release that clock
      // before reporting a rejected start: no orphan audio may survive.
      if (!nativeStop()) throw Error('B345 started in wrong mode and could not stop');
    }
    return started;
  }
  function nativeStop() {
    var e=legacy();
    // Stop requires ONLY the engine stop contract. UI/pause controls may
    // disappear mid-session and must never make emergency STOP unavailable.
    if(!e || !e.state || typeof e.stop!=='function')return false;
    if(!e.state.running)return true;
    e.stop(); // V695 returns false after successfully stopping.
    return e.state.running===false && e.state.paused===false;
  }
  function nativePauseTo(wanted) {
    if(!nativeReady())return false;
    var e=legacy();
    if(!e.state.running || e.state.paused===wanted)return false;
    e._test.togglePause(); // Verified V695 API; return false is NOT failure.
    return e.state.paused===wanted;
  }
  function nativePosition() {
    var s=legacy() && legacy().state;
    return s?{page:s.page||null,verse:s.rasterFollowAyah||null}:null;
  }
  function digitalCanStart(){ return digitalEligible() && nativeReady(); }
  function printedCanStart(){
    if (!printedEligible() || !edition()) return false;
    var z=printedScale(),ed=edition();
    if (!Number.isFinite(z) || z<100) return false;
    if (z===100 && ed==='tajwid')
      return nativePrintReady(z) && nativeReady() && !!(p212() &&
        typeof p212().start==='function' && typeof p212().status==='function');
    if (nativePrintReady(z))
      return nativeReady() && !(ed==='tajwid' && z>100 &&
        p212() && Number(p212().version)<213);
    return z>100 && !!externalZoom;
  }
  function digitalStart(mode){return digitalCanStart() && nativeStart(mode);}
  function digitalStop(){return nativeStop();}
  function digitalPause(){return nativePauseTo(true);}
  function digitalResume(){return nativePauseTo(false);}
  function digitalPosition(){return nativePosition();}
  var externalZoom=null, printedOwner=null;
  function registerZoomFollow(adapter) {
    if(!adapter || ['start','stop','pause','resume','position'].some(function(k){return typeof adapter[k]!=='function';}))
      throw Error('Incomplete external zoom adapter');
    if(printedOwner)throw Error('Cannot replace an active printed owner');
    externalZoom=adapter;
    return true;
  }
  function nativePrintReady(zoom) {
    try {
      if(zoom===100){var n=r33();return !!(n && typeof n.active==='function' && n.active());}
      if(zoom>100){var p=r51();return !!(p && typeof p.active==='function' && p.active());}
    } catch (_) {}
    return false;
  }
  function printedStart(mode) {
    if(!printedEligible() || !edition() || printedOwner)return false;
    var z=printedScale(), ed=edition(), n=legacy(), st=n&&n.state;
    if(!Number.isFinite(z)||z<100 || st&&st.running || p212Running())return false;
    if(z===100 && ed==='tajwid' && mode==='audio'){
      // P223: B345 is the sole audio owner; P205 supplies local colored R33 cards.
      if(!nativePrintReady(z)||!nativeReady())return false;
      var parity=root.__BASAIR_P205_ORIGINAL_PRINT_PARITY__;
      if(!parity||typeof parity.install!=='function'||!parity.install())return false;
      printedOwner=n;
      if(!nativeStart('audio')){printedOwner=null;return false;}
      return true;
    }
    if(z===100 && ed==='tajwid'){
      if(!nativePrintReady(z))return false;
      var independent=p212();
      if(!independent || typeof independent.start!=='function')return false;
      printedOwner=independent; // Claim it before start in case start throws.
      var accepted=independent.start(mode);
      var state=independent.status && independent.status();
      if(accepted && typeof accepted.then==='function')
        throw Error('P212 start must return synchronously');
      if(accepted===false || !state || !state.running){
        if(state && state.running && !printedStop())
          throw Error('Rejected P212 start could not be stopped');
        printedOwner=null;return false;
      }
      return true;
    }
    if(nativePrintReady(z)) {
      // Colored zoom requires v2, which delegates P212's wrappers to B345.
      if(ed==='tajwid' && z>100 && p212() && Number(p212().version)<213)return false;
      printedOwner=n; // Claim before native start in case B345 throws.
      if(!nativeStart(mode)){
        printedOwner=null;return false;
      }
      return true;
    }
    if(z>100 && externalZoom){
      var ok=externalZoom.start(mode,{preserveZoom:true});
      if(ok && typeof ok.then==='function')return false;
      if(ok===false)return false;
      printedOwner=externalZoom;return true;
    }
    return false;
  }
  function printedStop() {
    var e=printedOwner;
    if(!e)return true;
    if(e===legacy()){if(!nativeStop())return false;printedOwner=null;return true;}
    if(e===p212()){
      var st=e.status&&e.status();
      if(st && !st.running){printedOwner=null;return true;}
    }
    var ok=e.stop('p213-route-stop');
    if(ok && typeof ok.then==='function')return false;
    if(ok===false){
      var after=e.status&&e.status();
      if(!after || after.running!==false)return false;
    }
    printedOwner=null;return true;
  }
  function printedPause() {
    var e=printedOwner;
    if(!e)return false;
    if(e===legacy())return nativePauseTo(true);
    if(e===externalZoom)return e.pause()!==false;
    var st=e.status && e.status();
    if(!st||!st.running||st.paused||typeof e.pause!=='function')return false;
    e.pause();return !!(e.status() && e.status().paused);
  }
  function printedResume() {
    var e=printedOwner;
    if(!e)return false;
    if(e===legacy())return nativePauseTo(false);
    if(e===externalZoom)return e.resume()!==false;
    var st=e.status && e.status();
    if(!st||!st.running||!st.paused||typeof e.pause!=='function')return false;
    e.pause();return !!(e.status() && !e.status().paused);
  }
  function printedPosition() {
    var e=printedOwner;
    if(!e)return null;
    if(e===legacy())return nativePosition();
    if(e===externalZoom)return e.position();
    var st=e.status&&e.status();return st?{page:st.page||null}:null;
  }
  var adapters={
    digital:{canStart:digitalCanStart,start:digitalStart,stop:digitalStop,pause:digitalPause,resume:digitalResume,position:digitalPosition},
    printed:{canStart:printedCanStart,start:printedStart,stop:printedStop,pause:printedPause,resume:printedResume,position:printedPosition}
  };
  function install(){
    var core=root.__BASAIR_P213_FOLLOW__;
    if(!core)return false;
    core.register('digital',adapters.digital);core.register('printed',adapters.printed);return true;
  }
  root.__BASAIR_P213_ADAPTERS__=Object.freeze({install:install,adapters:adapters,
    digitalEligible:digitalEligible,printedEligible:printedEligible,printedScale:printedScale,
    nativeReady:nativeReady,registerZoomFollow:registerZoomFollow});
})(typeof window!=='undefined'?window:globalThis);
