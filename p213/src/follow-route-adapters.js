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
      try { if (root.localStorage.getItem('stableFont') === 'original') return false; }
      catch (_) { return false; }
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
    if (!engine) return false;
    var fn = mode === 'audio' ? engine.startAudio : engine.startSilent;
    if (typeof fn !== 'function') return false;
    return fn.call(engine) !== false;
  }
  function digitalStop() {
    var engine = legacy();
    if (!engine || typeof engine.stop !== 'function') return false;
    return engine.stop() !== false;
  }
  function digitalPause() {
    var engine = legacy();
    if (!engine || typeof engine.pause !== 'function') return false;
    return engine.pause() !== false;
  }
  function digitalResume() { return digitalPause(); } // Legacy toggle; only called after coordinator pause.
  function digitalPosition() {
    var engine = legacy();
    var state = engine && engine.state;
    return state ? {page:state.page || null, verse:state.verse || null} : null;
  }
  function printedStart(mode) {
    // P212 currently rejects printed pages at zoom != 100. Preserve the
    // existing original-print zoom follow rather than silently replacing it.
    var printState = root.__BASAIR_PRINT_FOLLOW_100__;
    var zoom = printState && typeof printState.scale === 'function' ? Number(printState.scale()) : NaN;
    if (!Number.isFinite(zoom) || zoom !== 100) return false;
    var engine = printed();
    return !!(engine && typeof engine.start === 'function' && engine.start(mode));
  }
  function printedStop() {
    var engine = printed();
    return !!(engine && typeof engine.stop === 'function' && engine.stop('p213-route-stop'));
  }
  function printedPause() {
    var engine = printed();
    if (!engine || !engine.status || !engine.pause) return false;
    if (engine.status().paused) return false;
    return engine.pause();
  }
  function printedResume() {
    var engine = printed();
    if (!engine || !engine.status || !engine.pause) return false;
    if (!engine.status().paused) return false;
    return engine.pause();
  }
  function printedPosition() {
    var engine = printed();
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
  root.__BASAIR_P213_ADAPTERS__ = Object.freeze({install:install,adapters:adapters,digitalEligible:digitalEligible});
})(typeof window !== 'undefined' ? window : globalThis);
