/* P213 contract checks: run in a browser test harness after loading core + adapters.
 * This does not execute or modify legacy B345/P212 engines.
 */
(function (root) {
  'use strict';
  root.__BASAIR_P213_CONTRACT_TESTS__ = function () {
    var core = root.__BASAIR_P213_FOLLOW__;
    var bridge = root.__BASAIR_P213_ADAPTERS__;
    if (!core || !bridge) throw Error('Load P213 core and adapters first');
    var errors = [], passed = 0;
    function check(name, predicate) {
      try { if (!predicate()) throw Error('Assertion failed'); passed++; }
      catch (e) { errors.push(name + ': ' + String(e)); }
    }
    check('Core initially idle', function () { return core.status() === null; });
    check('Zoom adapter registration is explicit', function () {
      return typeof bridge.registerZoomFollow === 'function';
    });
    check('Printed zoom is not silently reset', function () {
      var zoom = root.__BASAIR_PRINT_FOLLOW_100__;
      return !zoom || typeof zoom.scale !== 'function' || Number.isFinite(Number(zoom.scale()));
    });
    check('Two routes exist', function () {
      return !!(bridge.adapters.digital && bridge.adapters.printed);
    });
    return {passed:passed,failed:errors.length,errors:errors,
      note:'Contract smoke checks only; not Android/WebView or live follow acceptance'};
  };
})(typeof window !== 'undefined' ? window : globalThis);
