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
    var refusesStop = adapter('digital');
    refusesStop.stop = function () { log.push('digital:refused-stop'); return false; };
    core.register('digital', refusesStop);
    assert('digital restart for refusal test', core.start('digital','silent') === true);
    assert('route switch blocked on stop refusal', core.start('printed','silent') === false);
    assert('previous owner retained after refusal', core.status() && core.status().route === 'digital');
    // Recover the deliberately refusing adapter, then exercise reentrant stop.
    refusesStop.stop = function () { return true; };
    assert('cleanup after refusal', core.stop() === true);
    var nestedStartResult = null;
    var reentrant = adapter('digital');
    reentrant.stop = function () {
      nestedStartResult = core.start('printed','audio');
      return true;
    };
    core.register('digital', reentrant);
    assert('reentrant setup', core.start('digital','silent') === true);
    assert('outer switch succeeds', core.start('printed','silent') === true);
    assert('nested start blocked', nestedStartResult === false);
    assert('outer printed owns session', core.status() && core.status().route === 'printed' && core.status().mode === 'silent');
    assert('final cleanup', core.stop() === true && core.status() === null);
    var asyncStart = adapter('digital');
    asyncStart.start = function(){return {then:function(){}};};
    core.register('digital', asyncStart);
    var rejectedAsyncStart=false;
    try { core.start('digital','silent'); } catch(e) { rejectedAsyncStart=/synchronously/.test(String(e)); }
    assert('asynchronous start rejected',rejectedAsyncStart);
    assert('async start cleaned up',core.status()===null);
    asyncStart.start=function(){return true;};
    asyncStart.stop=function(){return {then:function(){}};};
    assert('async stop setup',core.start('digital','silent')===true);
    var rejectedAsyncStop=false;
    try { core.stop(); } catch(e) { rejectedAsyncStop=/synchronously/.test(String(e)); }
    assert('asynchronous stop rejected',rejectedAsyncStop && core.status().route==='digital');
    asyncStart.stop=function(){return true;};
    assert('cleanup after async rejection',core.stop()===true && core.status()===null);
    return {passed:22-errors.length, failed:errors.length, errors:errors, log:log};
  };
})(typeof window !== 'undefined' ? window : globalThis);
