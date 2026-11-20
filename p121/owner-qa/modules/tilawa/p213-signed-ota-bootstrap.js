/* P213 signed-OTA bootstrap for V695.
 * Load LAST in the signed P121 Tilawa JS bundle, after the P212 v2 replacement,
 * coordinator, route adapters and reversible capture bridge.
 * Auto-activation is permitted ONLY when this script was injected by the V695
 * verified P121 'tilawa' loader. Never attempts private-key operations.
 * If startup preflight fails the original B345/UI remains untouched.
 */
(function (root, doc) {
  'use strict';
  if (root.__BASAIR_P213_BOOT__) return;
  var current = doc && doc.currentScript;
  var signedLoader = !!(current && current.dataset &&
    current.dataset.basairP121 === 'tilawa');
  var attempts = 0, maxAttempts = 40, retryDelay = 250;
  var state = {version:213, signedLoader:signedLoader,
    enabled:false, phase:signedLoader?'pending':'disabled',
    attempts:0, lastError:''};
  var activeTimer = null, cancelled = false;
  function emit(reason) {
    state.lastError=String(reason||'');
    try {
      if(root.dispatchEvent&&root.CustomEvent)
        root.dispatchEvent(new root.CustomEvent('basair-p213-boot',
          {detail:{phase:state.phase,reason:state.lastError}}));
    } catch (_) {}
  }
  function ready() {
    var b=root.__BASAIR_B345_SEQUENCE__;
    var p=root.__BASAIR_P212_TAJWID_STATIC_FOLLOW__;
    var coordinator=root.__BASAIR_P213_FOLLOW__;
    var adapters=root.__BASAIR_P213_ADAPTERS__;
    var bridge=root.__BASAIR_P213_CONTROL_BRIDGE__;
    if(!b||!b.state||b.state.installed!==true||b.state.running)return false;
    if(!p||Number(p.version)<213||typeof p.status!=='function')return false;
    var ps=p.status();if(ps&&ps.running)return false;
    if(!coordinator||typeof coordinator.status!=='function'||coordinator.status())return false;
    if(!adapters||typeof adapters.nativeReady!=='function'||!adapters.nativeReady())return false;
    return !!(bridge&&typeof bridge.enable==='function');
  }
  function attempt() {
    activeTimer=null;
    if(cancelled || !signedLoader || state.enabled)return;
    attempts++;state.attempts=attempts;
    if(ready()){
      try {
        var bridge=root.__BASAIR_P213_CONTROL_BRIDGE__;
        state.enabled=bridge.enable()===true;
        if(state.enabled){state.phase='active';emit('');return;}
      }catch(error){emit('enable: '+String(error));}
    }
    if(attempts>=maxAttempts){state.phase='native-fallback';emit('P213 preflight timeout');return;}
    state.phase='pending';
    if(typeof root.setTimeout==='function')
      activeTimer=root.setTimeout(attempt,retryDelay);
    else {state.phase='native-fallback';emit('No timer available');}
  }
  function disable() {
    cancelled=true;
    if(activeTimer!==null && typeof root.clearTimeout==='function')
      root.clearTimeout(activeTimer);
    activeTimer=null;
    var bridge=root.__BASAIR_P213_CONTROL_BRIDGE__;
    if(state.enabled && (!bridge || bridge.disable()!==true)) {
      // The active controller could not stop; never lie about fallback.
      state.phase='active';emit('P213 active session refused stop');return false;
    }
    state.enabled=false;state.phase='disabled';emit('');return true;
  }
  function retry() {
    if(!signedLoader || state.enabled)return false;
    if(activeTimer!==null && typeof root.clearTimeout==='function')
      root.clearTimeout(activeTimer);
    activeTimer=null;cancelled=false;attempts=0;state.attempts=0;
    state.phase='pending';attempt();return true;
  }
  root.__BASAIR_P213_BOOT__=Object.freeze({
    status:function(){return Object.assign({},state);},
    disable:disable,retry:retry
  });
  if(signedLoader)attempt();else emit('Not injected by the signed P121 Tilawa loader');
})(typeof window!=='undefined'?window:globalThis,
   typeof document!=='undefined'?document:null);
