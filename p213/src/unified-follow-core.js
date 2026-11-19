/* Basair P213 unified follow coordinator — isolated foundation.
 * No DOM mutations, no legacy monkey-patching, no publication.
 * Display adapters own rendering. The coordinator owns one active session.
 */
(function (root) {
  'use strict';
  if (root.__BASAIR_P213_FOLLOW__) return;
  var adapters = Object.create(null);
  var session = null, generation = 0;
  var listeners = [];
  function snapshot() {
    return session ? { route:session.route, mode:session.mode, paused:session.paused,
      position:session.position, generation:session.generation } : null;
  }
  function emit(type, detail) {
    var event = {type:type, state:snapshot(), detail:detail || null};
    listeners.slice().forEach(function (fn) { try { fn(event); } catch (_) {} });
  }
  function synchronous(result, operation) {
    if (result && typeof result.then === 'function')
      throw Error('P213 adapter ' + operation + ' must return synchronously');
    return result;
  }
  function validAdapter(adapter) {
    return !!(adapter && typeof adapter.start === 'function' &&
      typeof adapter.stop === 'function' && typeof adapter.pause === 'function' &&
      typeof adapter.resume === 'function' && typeof adapter.position === 'function');
  }
  function register(route, adapter) {
    if (route !== 'digital' && route !== 'printed') throw Error('Invalid follow route');
    if (!validAdapter(adapter)) throw Error('Incomplete follow adapter');
    if (session && session.route === route) throw Error('Cannot replace active adapter');
    adapters[route] = adapter;
    return true;
  }
  function stop(reason) {
    if (!session) return false;
    var previous = session;
    // Keep ownership until the engine confirms it stopped. A synchronous
    // callback must not start a second route during an in-flight stop.
    previous.stopping = true;
    var stopError = null, stopped = false;
    try { stopped = synchronous(previous.adapter.stop(reason || 'user-stop'), 'stop') !== false; }
    catch (error) { stopError = error; }
    if (!stopped) {
      previous.stopping = false;
      emit('stop-failed', {reason:reason || 'user-stop', route:previous.route,
        error:stopError ? String(stopError) : 'adapter rejected stop'});
      if (stopError) throw stopError;
      return false;
    }
    if (session === previous) session = null;
    generation++;
    emit('stop', {reason:reason || 'user-stop', route:previous.route});
    return true;
  }
  function start(route, mode, options) {
    if (route !== 'digital' && route !== 'printed') throw Error('Invalid follow route');
    if (mode !== 'audio' && mode !== 'silent') throw Error('Invalid follow mode');
    var adapter = adapters[route];
    if (!adapter) throw Error('Follow route not registered: ' + route);
    if (session && session.stopping) return false;
    // Validate destination readiness BEFORE stopping an existing recitation.
    // Without preflight, requesting an unavailable digital/print view would
    // stop the currently working route and leave the reader without follow.
    var config = options || {};
    if (typeof adapter.canStart === 'function' &&
        synchronous(adapter.canStart(mode, config), 'canStart') === false) {
      emit('start-unavailable', {route:route, mode:mode});
      return false;
    }
    if (session && stop('route-switch') === false) return false;
    var token = ++generation;
    var candidate = {route:route, mode:mode, paused:false, position:null,
      generation:token, adapter:adapter};
    session = candidate;
    try {
      var accepted = synchronous(adapter.start(mode, config), 'start');
      if (accepted === false) {
        // Adapter contract: returning false means no engine was started.
        // Do NOT call stop() here: an idle legacy engine legitimately returns
        // false from stop(), which otherwise strands a phantom active session.
        if (session === candidate) {
          session = null;
          generation++;
          emit('start-rejected', {route:route, mode:mode});
        }
        return false;
      }
      if (session !== candidate) return false;
      candidate.position = synchronous(adapter.position(), 'position');
      emit('start');
      return true;
    } catch (error) {
      if (session === candidate) {
        try { stop('start-failed'); } catch (_) { /* Preserve original start failure. */ }
      }
      throw error;
    }
  }
  function pause() {
    if (!session || session.paused) return false;
    var current = session;
    if (synchronous(current.adapter.pause(), 'pause') === false) return false;
    if (session !== current) return false;
    current.paused = true; emit('pause'); return true;
  }
  function resume() {
    if (!session || !session.paused) return false;
    var current = session;
    if (synchronous(current.adapter.resume(), 'resume') === false) return false;
    if (session !== current) return false;
    current.paused = false; emit('resume'); return true;
  }
  function syncPosition() {
    if (!session) return null;
    session.position = synchronous(session.adapter.position(), 'position');
    emit('position');
    return session.position;
  }
  function onChange(listener) {
    if (typeof listener !== 'function') throw Error('Listener must be a function');
    listeners.push(listener);
    return function () { var i=listeners.indexOf(listener); if(i>=0)listeners.splice(i,1); };
  }
  root.__BASAIR_P213_FOLLOW__ = Object.freeze({
    version:213, register:register, start:start, stop:stop, pause:pause,
    resume:resume, syncPosition:syncPosition, status:snapshot, onChange:onChange
  });
})(typeof window !== 'undefined' ? window : globalThis);
