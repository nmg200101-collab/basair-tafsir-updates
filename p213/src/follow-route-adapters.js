/* P213 adapter bridge, opt-in only. Does not attach UI or patch legacy globals.
 * Digital uses B345 only when non-printed. Printed uses P212 only when
 * the authentic colored static edition is active. No speculative API calls.
 */
(function (root) {
  'use strict';
  if (root.__BASAIR_P213_ADAPTERS__) return;
  function legacy() { return root.__BASAIR_B345_SEQUENCE__; }
  function printed() { return root.__BASAIR_P212_TAJWID_STATIC_FOLLOW__; }
  function digitalEligible() {
    var b = root.document && root.document.body;
    if (!b || !b.classList.contains('reader-active')) return false;
    // Only digital fonts may enter this adapter. Never hijack printed zoom follow.
    if (!b.classList.contains('stableDigital')) {
      try {
        var font = root.localStorage && root.localStorage.getItem('stableFont');
        if (!font || font === 'original') return false;
      } catch (_) { return false; }
    }
    if (b.classList.contains('h25-hifz') || b.classList.contains('h90-review') || b.classList.contains('h100-teacher')) return false;
    try {
      var storage = root.localStorage;
      if (storage && storage.getItem('v129PrintMode') === 'tajwid' &&
          root.__BASAIR_PRINT_FOLLOW_100__ && root.__BASAIR_PRINT_FOLLOW_100__.active &&
          root.__BASAIR_PRINT_FOLLOW_100__.active()) return false;
    } catch (_) { return false; }
    return true;
  }
  function digitalStart(mode) {
    if (!digitalEligible()) return false;
    var engine = legacy();
    // B345's complete control surface must be present BEFORE starting.
    // Refuse to start an engine that P213 could not subsequently stop.
    if (!engine || !engine.state || typeof engine.state.running !== 'boolean' ||
        engine.state.running || typeof engine.stop !== 'function' ||
        typeof engine.pause !== 'function') return false;
    var fn = mode === 'audio' ? engine.startAudio : engine.startSilent;
    if (typeof fn !== 'function') return false;
    var accepted = fn.call(engine);
    return accepted !== false && engine.state.running === true;
  }
  function digitalStop() {
    var engine = legacy();
    if (!engine || !engine.state || typeof engine.state.running !== 'boolean') return false;
    if (!engine.state.running) return true; // The engine stopped itself.
    if (typeof engine.stop !== 'function' || engine.stop() === false) return false;
    return engine.state.running === false;
  }
  function digitalPaused(state) {
    return !!(state && (state.paused === true || state.pause === true ||
      state.status === 'paused' || state.phase === 'paused'));
  }
  function digitalPause() {
    var engine = legacy();
    if (!engine || typeof engine.pause !== 'function' || !engine.state ||
        !engine.state.running || digitalPaused(engine.state)) return false;
    if (engine.pause() === false) return false;
    return digitalPaused(engine.state);
  }
  function digitalResume() {
    var engine = legacy();
    if (!engine || typeof engine.pause !== 'function' || !engine.state ||
        !engine.state.running || !digitalPaused(engine.state)) return false;
    if (engine.pause() === false) return false;
    return !digitalPaused(engine.state);
  }
  function digitalPosition() {
    var engine = legacy();
    var state = engine && engine.state;
    return state ? {page:state.page || null, verse:state.verse || null} : null;
  }
  function printedEligible() {
    var b = root.document && root.document.body;
    if (!b || !b.classList.contains('reader-active') ||
        b.classList.contains('stableDigital') ||
        b.classList.contains('h25-hifz') || b.classList.contains('h90-review') ||
        b.classList.contains('h100-teacher')) return false;
    try {
      var font = root.localStorage && root.localStorage.getItem('stableFont');
      return !font || font === 'original';
    } catch (_) { return false; }
  }
  function printedScale() {
    var value = NaN;
    try {
      var z = root.__BASAIR_B330_ZOOM__;
      if (z && typeof z.scale === 'function') value = Number(z.scale());
      if (!(value > 0)) value = Number(root.localStorage &&
        root.localStorage.getItem('basair:tilawa-page-font-scale:v1'));
      if (!(value > 0)) {
        var b = root.document && root.document.body;
        value = Number(b && (b.getAttribute('data-b274-mushaf-scale') ||
          b.getAttribute('data-b273-mushaf-scale')));
      }
      if (!(value > 0)) {
        var p = root.__BASAIR_PRINT_FOLLOW_100__;
        value = p && typeof p.scale === 'function' ? Number(p.scale()) : NaN;
      }
    } catch (_) { return NaN; }
    return Number.isFinite(value) && value > 0 ? value : NaN;
  }
  var zoomFollow = null;
  var printedOwner = null;
  function registerZoomFollow(adapter) {
    if (!adapter || ['start','stop','pause','resume','position'].some(function (k) { return typeof adapter[k] !== 'function'; }))
      throw Error('Incomplete original-print zoom adapter');
    if (printedOwner) throw Error('Cannot replace active printed follow');
    zoomFollow = adapter;
    return true;
  }
  function printedStart(mode) {
    if (!printedEligible()) return false;
    // P212 rejects printed pages at zoom != 100. Do not reset zoom.
    var zoom = printedScale();
    // Original printed pages ALWAYS use the verified print adapter, including
    // 100% and every zoom level. P212 is reserved for colored tajwid at 100%.
    var edition = null;
    try { edition = root.localStorage && root.localStorage.getItem('v129PrintMode'); }
    catch (_) { return false; }
    if (edition !== 'tajwid' || !Number.isFinite(zoom) || zoom !== 100) {
      if (!zoomFollow) return false;
      var accepted = zoomFollow.start(mode, {preserveZoom:true});
      if (accepted === false) return false;
      printedOwner = zoomFollow;
      return true;
    }
    var engine = printed();
    if (!engine || typeof engine.start !== 'function' || engine.start(mode) === false) return false;
    printedOwner = engine;
    return true;
  }
  function printedStop() {
    var engine = printedOwner;
    if (!engine) return true; // Rejected starts never establish ownership.
    var state = engine !== zoomFollow && engine.status && engine.status();
    if (state && state.running === false) { printedOwner = null; return true; }
    if (engine.stop('p213-route-stop') === false) {
      // Do not release ownership if the previous engine still runs.
      state = engine !== zoomFollow && engine.status && engine.status();
      if (!state || state.running !== false) return false;
    }
    printedOwner = null;
    return true;
  }
  function printedPause() {
    var engine = printedOwner;
    if (!engine) return false;
    if (engine === zoomFollow) return engine.pause() !== false;
    if (!engine.status || !engine.pause || engine.status().paused) return false;
    return engine.pause();
  }
  function printedResume() {
    var engine = printedOwner;
    if (!engine) return false;
    if (engine === zoomFollow) return engine.resume() !== false;
    if (!engine.status || !engine.pause || !engine.status().paused) return false;
    return engine.pause();
  }
  function printedPosition() {
    var engine = printedOwner;
    if (engine === zoomFollow) return engine.position();
    var state = engine && engine.status && engine.status();
    return state ? {page:state.page || null} : null;
  }
  var adapters = {
    digital:{start:digitalStart,stop:digitalStop,pause:digitalPause,resume:digitalResume,position:digitalPosition},
    printed:{start:printedStart,stop:printedStop,pause:printedPause,resume:printedResume,position:printedPosition}
  };
  function install() {
    var core = root.__BASAIR_P213_FOLLOW__;
    if (!core) return false;
    core.register('digital', adapters.digital);
    core.register('printed', adapters.printed);
    return true;
  }
  root.__BASAIR_P213_ADAPTERS__ = Object.freeze({install:install,adapters:adapters,
    digitalEligible:digitalEligible,printedEligible:printedEligible,
    printedScale:printedScale,registerZoomFollow:registerZoomFollow});
})(typeof window !== 'undefined' ? window : globalThis);
