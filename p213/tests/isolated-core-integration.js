/* P213 integration gate: run in a dedicated browser/Node VM, not in the live app.
 * Requires unified-follow-core.js loaded in a fresh isolated global.
 */
(function (root) {
  'use strict';
  root.__BASAIR_P213_TEST_RUNNER__ = function () {
    var core = root.__BASAIR_P213_FOLLOW__;
    if (!core || core.status()) throw Error('P213 test requires an idle isolated core');
    var log = [], errors = [];
    function assert(label, condition) { if (!condition) errors.push(label); }
    function adapter(name) {
      return {
        start:function (mode) { log.push(name+':start:'+mode); return true; },
        stop:function () { log.push(name+':stop'); return true; },
        pause:function () { log.push(name+':pause'); return true; },
        resume:function () { log.push(name+':resume'); return true; },
        position:function () { return {page:name === 'printed' ? 4 : null, verse:2}; }
      };
    }
    core.register('digital', adapter('digital'));
    core.register('printed', adapter('printed'));
    assert('digital starts', core.start('digital','silent') === true);
    assert('digital active', core.status().route === 'digital');
    assert('pause works', core.pause() && core.status().paused);
    assert('resume works', core.resume() && !core.status().paused);
    assert('printed switches', core.start('printed','audio') === true);
    assert('digital stopped before printed starts',
      log.indexOf('digital:stop') >= 0 &&
      log.indexOf('digital:stop') < log.indexOf('printed:start:audio'));
    assert('printed position', core.syncPosition().page === 4);
    assert('printed stops', core.stop() && core.status() === null);
    return {passed:9-errors.length, failed:errors.length, errors:errors, log:log};
  };
})(typeof window !== 'undefined' ? window : globalThis);
