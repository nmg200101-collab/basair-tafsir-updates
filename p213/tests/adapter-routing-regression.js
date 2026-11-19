/* P213 isolated routing regression. Load core and bridge first.
 * Run only in a fresh mock window: NEVER inject into V695 or a live WebView.
 */
(function(root) {
  'use strict';
  root.__BASAIR_P213_ROUTING_TESTS__ = function() {
    var core=root.__BASAIR_P213_FOLLOW__,bridge=root.__BASAIR_P213_ADAPTERS__;
    if (!core || !bridge || core.status()) throw Error('Fresh isolated P213 required');
    var errors=[],checks=0,flags={ 'reader-active':true };
    var data={stableFont:'original',v129PrintMode:'original'};
    var zoom=100,digitalStarts=0,printedStarts=0,zoomStarts=0,zoomOpts=null;
    var zoomRunning=false,zoomCanStop=true,printedRunning=false,printedPaused=false;
    function check(label,value){checks++;if(!value)errors.push(label);}
    root.localStorage={getItem:function(k){return Object.prototype.hasOwnProperty.call(data,k)?data[k]:null;}};
    root.document={body:{classList:{contains:function(k){return !!flags[k];}},
      getAttribute:function(){return null;}}};
    root.__BASAIR_B330_ZOOM__={scale:function(){return zoom;}};
    root.__BASAIR_PRINT_FOLLOW_100__={scale:function(){return zoom;}};
    var b345={state:{running:false,paused:false,page:3},
      startSilent:function(){digitalStarts++;this.state.running=true;return true;},
      startAudio:function(){digitalStarts++;this.state.running=true;return true;},
      stop:function(){this.state.running=false;this.state.paused=false;return true;},
      pause:function(){this.state.paused=!this.state.paused;return true;}};
    root.__BASAIR_B345_SEQUENCE__=b345;
    root.__BASAIR_P212_TAJWID_STATIC_FOLLOW__={
      start:function(){printedStarts++;printedRunning=true;return true;},
      stop:function(){if(!printedRunning)return false;printedRunning=false;return true;},
      pause:function(){if(!printedRunning)return false;printedPaused=!printedPaused;return true;},
      status:function(){return {running:printedRunning,paused:printedPaused,page:5};}
    };
    check('install both routes',bridge.install());
    check('original 100 requires verified adapter',core.start('printed','silent')===false);
    check('rejected start clears phantom session',core.status()===null);
    check('original must never reach P212',printedStarts===0);
    flags.stableDigital=true;data.stableFont='digital';
    check('digital eligibility',bridge.digitalEligible());
    var oldStop=b345.stop;b345.stop=null;
    check('digital cannot start without stop contract',core.start('digital','silent')===false);
    check('digital did not start without stop contract',digitalStarts===0 && core.status()===null);
    b345.stop=oldStop;
    check('digital starts',core.start('digital','silent')===true && b345.state.running);
    check('digital pause',core.pause()===true && b345.state.paused);
    check('digital resume',core.resume()===true && !b345.state.paused);
    check('digital stops',core.stop()===true && !b345.state.running);
    printedRunning=true;
    check('digital blocked by external P212 session',core.start('digital','silent')===false && core.status()===null);
    printedRunning=false;
    flags.stableDigital=false;data.stableFont='original';
    var adapter={
      start:function(mode,opts){zoomStarts++;zoomRunning=true;zoomOpts=opts;return true;},
      stop:function(){if(!zoomCanStop)return false;zoomRunning=false;return true;},
      pause:function(){return zoomRunning;},
      resume:function(){return zoomRunning;},
      position:function(){return {page:8};}
    };
    check('register verified print adapter',bridge.registerZoomFollow(adapter));
    b345.state.running=true;
    check('printed blocked by external B345 session',core.start('printed','silent')===false && core.status()===null);
    b345.state.running=false;
    check('original 100 stays with original adapter',core.start('printed','silent')===true &&
      zoomStarts===1 && printedStarts===0 && zoomOpts.preserveZoom===true);
    check('original 100 stop',core.stop()===true);
    zoom=150;
    check('original zoomed starts without reset',core.start('printed','audio')===true &&
      zoom===150 && zoomStarts===2);
    zoomCanStop=false;
    check('refused zoom stop preserves owner',core.stop()===false &&
      core.status() && core.status().route==='printed');
    check('refused stop blocks switching',core.start('digital','silent')===false);
    zoomCanStop=true;
    check('zoom stop after refusal',core.stop()===true && core.status()===null);
    data.v129PrintMode='tajwid';zoom=100;
    check('tajwid 100 uses P212',core.start('printed','silent')===true &&
      printedStarts===1 && zoomStarts===2);
    printedRunning=false; // Engine auto-stopped after its own completion.
    check('auto-stopped P212 clears coordinator',core.stop()===true && core.status()===null);
    zoom=130;
    printedRunning=true;
    check('zoom blocked by external P212',core.start('printed','silent')===false && core.status()===null);
    printedRunning=false;
    check('tajwid zoom uses print adapter',core.start('printed','silent')===true &&
      zoomStarts===3 && printedStarts===1 && zoom===130);
    check('zoomed tajwid cleanup',core.stop()===true);
    flags.stableDigital=true;
    check('digital mode excludes printed adapter',!bridge.printedEligible() &&
      core.start('printed','silent')===false && core.status()===null);
    flags.stableDigital=false;flags['h25-hifz']=true;
    check('hifz mode excludes printed adapter',!bridge.printedEligible() &&
      core.start('printed','audio')===false && core.status()===null);
    return {passed:checks-errors.length,failed:errors.length,errors:errors,
      digitalStarts:digitalStarts,printedStarts:printedStarts,zoomStarts:zoomStarts};
  };
})(typeof window !== 'undefined' ? window : globalThis);
