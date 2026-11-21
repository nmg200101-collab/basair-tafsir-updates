/* P214 V695 digital exact-renderer regression: B345 start/stop/pause return FALSE on success.
 * Run in an isolated window after the coordinator and bridge.
 * This is a contract regression, not Android acceptance.
 */
(function(root){
 'use strict';
 root.__BASAIR_P213_ROUTING_TESTS__=function(){
  var core=root.__BASAIR_P213_FOLLOW__,bridge=root.__BASAIR_P213_ADAPTERS__;
  if(!core||!bridge||core.status())throw Error('Requires fresh P213 window');
  var count=0,errors=[],flags={'reader-active':true};
  var data={stableFont:'original',v129PrintMode:'original'};
  var scale=100,r51Available=true,digitalStarts=0,p212Starts=0,externalStarts=0;
  function check(name,valid){count++;if(!valid)errors.push(name);}
  // Match REAL V695 renderExactUnicodePage(): at 100% there is
  // .exactLine.text > .unicodeLine > .quranWord, NO .v160DigitalFlow.
  // B330 above 100% instead renders .v160DigitalFlow > .v160Ayah.
  var digitalWord={textContent:'بسم الله الرحمن الرحيم'};
  var digitalText={textContent:'بسم الله الرحمن الرحيم',
    querySelector:function(k){return k.indexOf('.quranWord')>=0?digitalWord:null;}};
  var digitalHost={childElementCount:15,getAttribute:function(){return null;},
    querySelector:function(k){return k==='.exactLine.text .unicodeLine'?digitalText:null;}};
  var zoomWord={textContent:'بسم الله الرحمن الرحيم'};
  var zoomFlow={textContent:'بسم الله الرحمن الرحيم',
    querySelector:function(k){return k.indexOf('.v160Ayah')>=0?zoomWord:null;}};
  var zoomHost={childElementCount:1,getAttribute:function(k){return k==='data-b329-zoom-source'?'v160-local':k==='data-b330-scroll-owner'?'b274LargeTextHost':null;},
    querySelector:function(k){return k.indexOf('.v160DigitalFlow')>=0?zoomFlow:null;}};
  root.document={body:{classList:{contains:function(k){return !!flags[k];}},
    getAttribute:function(){return null;}},getElementById:function(k){
      if(!flags.stableDigital)return null;
      return k==='stableDigitalHost'?digitalHost:k==='b274LargeTextHost'?zoomHost:null;
    }};
  root.localStorage={getItem:function(k){return Object.prototype.hasOwnProperty.call(data,k)?data[k]:null;}};
  root.__BASAIR_B330_ZOOM__={scale:function(){return scale;}};
  root.__BASAIR_PRINT_FOLLOW_100__={scale:function(){return scale;},
    active:function(){return scale===100&&!flags.stableDigital;},edition:function(){return data.v129PrintMode;}};
  root.__BASAIR_PRINT_ZOOM_FOLLOW_R51__={active:function(){return r51Available&&scale>100&&!flags.stableDigital;},
    edition:function(){return data.v129PrintMode;}};
  var b345={state:{running:false,paused:false,page:4,mode:''},
    startSilent:function(){digitalStarts++;this.state.running=true;this.state.mode='silent';return false;},
    startAudio:function(){digitalStarts++;this.state.running=true;this.state.mode='audio';return false;},
    stop:function(){this.state.running=false;this.state.paused=false;this.state.mode='';return false;},
    _test:{togglePause:function(){b345.state.paused=!b345.state.paused;return false;}}};
  root.__BASAIR_B345_SEQUENCE__=b345;
  var independent={version:213,st:{running:false,paused:false,page:4},
    start:function(){p212Starts++;this.st.running=true;return true;},
    stop:function(){if(!this.st.running)return false;this.st.running=false;return true;},
    pause:function(){if(!this.st.running)return false;this.st.paused=!this.st.paused;return true;},
    status:function(){return this.st;}};
  root.__BASAIR_P212_TAJWID_STATIC_FOLLOW__=independent;
  check('install',bridge.install());
  check('native V695 control surface detected',bridge.nativeReady());
  check('original 100 starts B345 despite false return',core.start('printed','silent')===true&&b345.state.running&&digitalStarts===1);
  flags.stableDigital=true;data.stableFont='digital';digitalHost.childElementCount=0;
  check('unavailable digital route preserves original follow',core.start('digital','audio')===false &&
    core.status()&&core.status().route==='printed'&&b345.state.running);
  flags.stableDigital=false;data.stableFont='original';digitalHost.childElementCount=15;
  check('original pause despite false return',core.pause()===true&&b345.state.paused);
  check('original resume despite false return',core.resume()===true&&!b345.state.paused);
  check('original stop despite false return',core.stop()===true&&!b345.state.running);
  var savedNativeStart=b345.startSilent;
  b345.startSilent=function(){this.state.running=true;this.state.mode='silent';throw Error('simulated post-start failure');};
  var printStartThrew=false;
  try{core.start('printed','silent');}catch(e){printStartThrew=/post-start failure/.test(String(e));}
  check('printed native exception stops orphan clock',printStartThrew&&!b345.state.running&&core.status()===null);
  b345.startSilent=savedNativeStart;
  for(var i=0,scales=[130,150,200];i<scales.length;i++){
   scale=scales[i];
   check('original zoom '+scale+' via R51',core.start('printed','silent')===true&&b345.state.running);
   check('original zoom '+scale+' unchanged',bridge.printedScale()===scale);
   check('original zoom '+scale+' stop',core.stop()===true&&!b345.state.running);
  }
  scale=100;data.v129PrintMode='tajwid';
  check('tajwid 100 uses P212',core.start('printed','audio')===true&&p212Starts===1&&!b345.state.running);
  check('tajwid 100 pause',core.pause()===true&&independent.st.paused);
  check('tajwid 100 resume',core.resume()===true&&!independent.st.paused);
  check('tajwid 100 stop',core.stop()===true&&!independent.st.running);
  var savedP212Start=independent.start;
  independent.start=function(){this.st.running=true;throw Error('simulated independent post-start failure');};
  var coloredStartThrew=false;
  try{core.start('printed','audio');}catch(e){coloredStartThrew=/independent post-start/.test(String(e));}
  check('colored P212 exception stops orphan clock',coloredStartThrew&&!independent.st.running&&core.status()===null);
  independent.start=savedP212Start;
  for(var j=0;j<scales.length;j++){
   scale=scales[j];
   check('tajwid zoom '+scale+' uses native R51',core.start('printed','silent')===true&&b345.state.running&&p212Starts===1);
   check('tajwid zoom '+scale+' stop',core.stop()===true&&!b345.state.running);
  }
  independent.version=212;scale=130;
  check('old P212 cannot steal colored zoom',core.start('printed','silent')===false&&core.status()===null);
  independent.version=213;r51Available=false;
  check('no unverified zoom renderer',core.start('printed','silent')===false&&core.status()===null);
  var x={start:function(){externalStarts++;return true;},stop:function(){return true;},
    pause:function(){return true;},resume:function(){return true;},position:function(){return {page:4};}};
  check('explicit external zoom register',bridge.registerZoomFollow(x));
  check('external zoom fallback',core.start('printed','silent')===true&&externalStarts===1);
  check('external zoom stop',core.stop()===true);
  r51Available=true;
  b345.state.running=true;
  check('external B345 session blocks P213 print',core.start('printed','silent')===false&&core.status()===null);
  b345.state.running=false;
  scale=100;independent.st.running=true;flags.stableDigital=true;data.stableFont='digital';
  check('external P212 session blocks digital',core.start('digital','audio')===false&&core.status()===null);
  independent.st.running=false;
  digitalHost.childElementCount=0;
  check('digital refuses incomplete render',core.start('digital','audio')===false&&core.status()===null);
  digitalHost.childElementCount=15;digitalHost.getAttribute=function(k){return k==='aria-busy'?'true':null;};
  check('digital refuses loading render',core.start('digital','audio')===false&&core.status()===null);
  digitalHost.getAttribute=function(){return null;};
  digitalHost.querySelector=function(){return null;};
  check('100% rejects zoom-only markup',core.start('digital','audio')===false&&core.status()===null);
  digitalHost.querySelector=function(k){return k==='.exactLine.text .unicodeLine'?digitalText:null;};
  digitalWord.textContent='  ';
  check('100% rejects missing Quran word text',core.start('digital','audio')===false&&core.status()===null);
  digitalWord.textContent='بسم الله الرحمن الرحيم';
  for(var f of ['uthmani','digital','amiri','ruqaa','traditional','kufi','hifz']){
    data.stableFont=f;
    check('100% accepts V695 exact-line font '+f,bridge.digitalEligible()===true);
  }
  data.stableFont='digital';
  check('digital runs B345 despite false begin',core.start('digital','audio')===true&&b345.state.mode==='audio');
  flags.stableDigital=false;data.stableFont='original';scale=90;
  check('unavailable printed route preserves digital follow',core.start('printed','silent')===false &&
    core.status()&&core.status().route==='digital'&&b345.state.running);
  flags.stableDigital=true;data.stableFont='digital';scale=100;
  check('digital pause',core.pause()===true&&b345.state.paused);
  check('digital resume',core.resume()===true&&!b345.state.paused);
  check('digital stop',core.stop()===true);
  scale=130;flags.b274LargeMushaf=true;
  check('digital 130 zoom uses large rendered host',core.start('digital','silent')===true && b345.state.running);
  check('digital 130 zoom stops',core.stop()===true);
  zoomHost.getAttribute=function(k){return k==='data-b329-zoom-source'?'diagnostic':k==='data-b330-scroll-owner'?'b274LargeTextHost':null;};
  check('digital refuses zoom diagnostic',core.start('digital','silent')===false && core.status()===null);
  zoomHost.getAttribute=function(k){return k==='data-b329-zoom-source'?'v160-local':k==='data-b330-scroll-owner'?'b274LargeTextHost':null;};
  zoomWord.textContent='   ';
  check('digital refuses empty digital flow',core.start('digital','silent')===false && core.status()===null);
  zoomWord.textContent='بسم الله الرحمن الرحيم';
  zoomFlow.querySelector=function(){return null;};
  check('digital refuses zoom with no indexed Quran word',core.start('digital','silent')===false && core.status()===null);
  zoomFlow.querySelector=function(k){return k.indexOf('.v160Ayah')>=0?zoomWord:null;};
  zoomWord.textContent='بسم الله الرحمن الرحيم';scale=100;flags.b274LargeMushaf=false;
  var savedDigitalStart=b345.startAudio;
  b345.startAudio=function(){this.state.running=true;this.state.mode='audio';throw Error('simulated digital post-start failure');};
  var digitalStartThrew=false;
  try{core.start('digital','audio');}catch(e){digitalStartThrew=/digital post-start/.test(String(e));}
  check('digital exception stops orphan clock',digitalStartThrew&&!b345.state.running&&core.status()===null);
  b345.startAudio=savedDigitalStart;
  check('emergency stop starts',core.start('digital','silent')===true&&b345.state.running);
  var toggle=b345._test.togglePause;b345._test.togglePause=null;
  check('emergency stop without pause interface',core.stop()===true&&!b345.state.running);

  check('missing lifecycle method blocks start',core.start('digital','silent')===false&&core.status()===null);
  b345._test.togglePause=toggle;
  flags.stableDigital=false;data.stableFont='original';flags['h25-hifz']=true;
  check('hifz excluded',!bridge.printedEligible()&&core.start('printed','silent')===false);
  return {passed:count-errors.length,failed:errors.length,errors:errors,
    nativeStarts:digitalStarts,p212Starts:p212Starts,externalStarts:externalStarts};
 };
})(typeof window!=='undefined'?window:globalThis);
