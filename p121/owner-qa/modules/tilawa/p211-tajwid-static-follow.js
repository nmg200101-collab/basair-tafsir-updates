/* Basair Quran P211 — independent STATIC Tajwid Follow engine.
 * The new engine never invokes B345 startSilent/startAudio for colored print.
 * Existing renderLocalPage() owns the single authentic printed page + frame.
 * B345 stays available ONLY for the original/non-colored editions.
 * No P209 overlays, no duplicate page stacks, no experimental tools.
 * NOT owner-signed and NOT an OTA release until Android acceptance.
 */
(function (w, d) {
  'use strict';
  if (w.__BASAIR_P211_TAJWID_STATIC_FOLLOW__) return;
  var BODY_ROUTE = 'data-p211-tajwid-route', BODY_ACTIVE = 'data-p211-tajwid-running';
  var ID = 'p211FollowControls', STYLE = 'p211FollowRouteStyle';
  var maxPage = 604, raf = 0, timer = 0, serial = 0;
  var reciterKeyAtStart = '';
  var st = {running: false, paused: false, mode: '', page: 0, progress: 0,
    duration: 120000, anchor: 0, held: 0, failures: 0, starts: 0,
    stops: 0, transitions: 0, audioError: '', lastReason: '', sources: [], sourceIndex: 0,
    audioStarted: false, pending: false};
  var preloads = Object.create(null);
  var audioCallbacks = null;
  var baseFunctions = null;
  function E(id){return d.getElementById(id)}
  function page(n){n=Number(n);return Number.isInteger(n)&&n>=1&&n<=maxPage?n:0}
  function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0))}
  function printedEdition(){
    try {var value = w.localStorage && w.localStorage.getItem('v129PrintMode');
      return value==='tajwid';}
    catch(_){return false}
  }
  function colored(){
    var b=d.body;return !!(b&&b.classList.contains('reader-active')&&printedEdition()&&
      !b.classList.contains('h25-hifz')&&!b.classList.contains('h90-review')&&
      !b.classList.contains('h100-teacher'));
  }
  function fixed(){
    var b=d.body,p=w.__BASAIR_PRINT_FOLLOW_100__;
    if(!colored()||b.classList.contains('stableDigital'))return false;
    try {if(w.localStorage){var font=w.localStorage.getItem('stableFont');if(font&&font!=='original')return false}}
    catch(_){return false}
    try {if(!p||typeof p.active!=='function'||!p.active()||typeof p.scale!=='function'||Number(p.scale())!==100)return false}
    catch(_){return false}
    return !!(E('mushafText')&&E('mushafDock')&&E('mushafReader'));
  }
  function existingPage(){
    var img=d.querySelector('#mushafText .localPageStage img[data-mushaf-page]');
    return page(img&&img.getAttribute('data-mushaf-page'))||page(w.currentPage)||page(E('readerPageInput')&&E('readerPageInput').value);
  }
  function imagePath(n){return 'assets/tajweed-pages/tajweed-'+String(n).padStart(3,'0')+'.webp'}
  function preload(n){
    n=page(n);if(!n)return Promise.resolve(false);
    if(preloads[n])return preloads[n];
    var promise=new Promise(function(resolve){
      var im=new Image(),done=false;
      var settle=function(ok){if(done)return;done=true;resolve(ok)};
      im.onload=function(){settle(!!(im.naturalWidth&&im.naturalHeight))};
      im.onerror=function(){settle(false)};
      im.src=imagePath(n);
      if(im.complete)settle(!!im.naturalWidth);
    });
    preloads[n]=promise.then(function(ok){if(!ok)delete preloads[n];return ok});
    return preloads[n];
  }
  function notice(text){
    var status=E('p211FollowStatus');if(status)status.textContent=String(text||'');
  }
  function status(){return Object.assign({},st,{edition:'tajwid',baseFollowRunning:!!(w.__BASAIR_B345_SEQUENCE__&&w.__BASAIR_B345_SEQUENCE__.state&&w.__BASAIR_B345_SEQUENCE__.state.running)})}
  function hideSheet(){var s=E('sequenceSheetV10');if(s){s.classList.remove('open');s.setAttribute('aria-hidden','true')}}
  function sound(){return E('tilawaAudio')}
  function selectedReciter(){
    var picker=E('sequenceReciterV17'),key=String(picker&&picker.value||'');
    if(key)return key;
    try{key=String(w.localStorage&&w.localStorage.getItem('v170Reciter')||'')}catch(_){}
    return key||'alafasy';
  }
  function sourceUrls(n,key){
    var a=[],v180=w.__BASAIR_V180_TEST__,v173=w.__BASAIR_V173_TEST__;
    // The special teacher/Arkani formats need multi-segment timing. Never
    // silently substitute a different reciter or launch legacy B345.
    if(key==='arkani'||key==='minshawy_teacher')return [];
    function append(v){if(typeof v==='string'&&v&&a.indexOf(v)<0)a.push(v)}
    try {if(v180&&typeof v180.peek==='function')append(v180.peek(n,key))}catch(_){}
    try {if(v180&&typeof v180.packUrl==='function')append(v180.packUrl(key,n))}catch(_){}
    try {if(key==='alafasy'&&v173&&typeof v173.pageAudioUrls==='function')(v173.pageAudioUrls(n)||[]).forEach(append)}catch(_){}
    return a;
  }
  function holdAudio(){var a=sound();if(a){try{a.pause()}catch(_){}}}
  function detachAudio(){
    var a=sound();if(a&&audioCallbacks){
      Object.keys(audioCallbacks).forEach(function(type){a.removeEventListener(type,audioCallbacks[type])});
      audioCallbacks=null;
    }
  }
  function resetAudio(){
    var a=sound();detachAudio();if(a){try{a.pause();a.removeAttribute('src');a.load()}catch(_){}}
  }
  function playSource(token){
    if(!st.running||st.paused||st.mode!=='audio'||token!==serial)return Promise.resolve(false);
    var a=sound();if(!a)return Promise.resolve(false);
    if(st.sourceIndex>=st.sources.length)return Promise.resolve(false);
    var next=st.sources[st.sourceIndex++],result;
    try {a.pause();a.src=next;a.preload='auto';a.load();a.playbackRate=clamp(Number(E('sequenceAudioRateV174')&&E('sequenceAudioRateV174').value)||1,.75,1.75);result=a.play()}
    catch(_){return playSource(token)}
    return Promise.resolve(result).then(function(){
      if(token!==serial||!st.running)return false;
      st.audioStarted=true;return true;
    }).catch(function(){
      if(token!==serial||!st.running)return false;
      return playSource(token);
    });
  }
  function bindAudio(){
    if(audioCallbacks)return true;
    var a=sound();if(!a)return false;
    audioCallbacks={
      timeupdate:function(){
        if(st.running&&!st.paused&&st.mode==='audio'&&isFinite(a.duration)&&a.duration>0){
          st.progress=clamp(a.currentTime/a.duration,0,1);updateProgress();
        }
      },
      ended:function(){if(st.running&&!st.paused&&st.mode==='audio')advance('audio-ended')},
      error:function(){
        if(!st.running||st.mode!=='audio')return;
        var token=serial;
        if(st.sourceIndex<st.sources.length)playSource(token);
        else {st.audioError='تعذر تشغيل صوت القارئ المحدد';stop('audio-error');notice('تعذر تشغيل الصوت، اختر قارئًا متاحًا')}
      }
    };
    Object.keys(audioCallbacks).forEach(function(type){a.addEventListener(type,audioCallbacks[type])});
    return true;
  }
  function selectedDuration(){
    var x=Number(E('sequenceSpeedV10')&&E('sequenceSpeedV10').value);
    if(!(x>0)) x=.5;
    return clamp(60000/x,12000,600000);
  }
  function updateProgress(){
    var bar=E('p211FollowProgress'),label=E('p211FollowStatus');
    if(bar)bar.style.width=(st.progress*100).toFixed(2)+'%';
    if(label)label.textContent='صفحة '+st.page+' · '+(st.paused?'متوقف مؤقتًا':st.mode==='audio'?'التلاوة الصوتية':'متابعة بدون صوت');
    var pause=E('p211Pause');if(pause)pause.textContent=st.paused?'▶ استئناف':'⏸ إيقاف مؤقت';
  }
  function updateFixedPage(n){
    // Render the ORIGINAL static printed page; never create a second frame,
    // B345 stack, image viewport or background renderer.
    var render=typeof w.renderLocalPage==='function'?w.renderLocalPage:
      (typeof w.openPage==='function'?w.openPage:null);
    if(!render)return false;
    var old=existingPage();
    try{
      w.currentPage=n;
      var input=E('readerPageInput');if(input)input.value=String(n);
      if(old!==n)render.call(w,n,null);
      return true;
    }catch(e){st.audioError=String(e&&e.message||e);return false}
  }
  function clearSurface(){
    if(d.body)d.body.removeAttribute(BODY_ACTIVE);
    var bar=E(ID);if(bar)bar.hidden=true;
  }
  function stop(reason){
    if(!st.running){clearSurface();return false}
    var n=st.page;st.running=false;st.paused=false;st.pending=false;st.mode='';st.lastReason=reason||'stopped';st.stops++;
    serial++;if(raf){w.cancelAnimationFrame(raf);raf=0}resetAudio();clearSurface();
    // In P211, we never left the approved static page DOM. No R39 frozen stack,
    // no tear-down/re-render unless another subsystem changed the page.
    if(fixed()&&n&&existingPage()!==n)updateFixedPage(n);
    return true;
  }
  function nextReady(n){return preload(n)}
  function advance(reason){
    if(!st.running||st.pending)return;
    var token=serial,nowPage=st.page,next=nowPage+1;
    if(next>maxPage){stop('quran-finished');return}
    st.pending=true;
    nextReady(next).then(function(ok){
      if(token!==serial||!st.running)return;
      if(!ok||!updateFixedPage(next)){
        st.failures++;st.pending=false;stop(ok?'next-static-render-failed':'next-image-not-ready');notice('تعذر تحميل الصفحة التالية، بقي المصحف على الصفحة الثابتة');return;
      }
      st.page=next;st.progress=0;st.pending=false;st.anchor=w.performance&&w.performance.now?w.performance.now():Date.now();st.transitions++;
      updateProgress();preload(next+1);
      if(st.mode==='audio'){
        st.sources=sourceUrls(next,reciterKeyAtStart);st.sourceIndex=0;st.audioStarted=false;
        if(!st.sources.length){stop('no-next-audio');notice('لا يوجد ملف صوتي للصفحة التالية');return}
        playSource(token).then(function(success){if(!success&&st.running&&token===serial){stop('audio-play-failed');notice('تعذر متابعة الصوت')}});
      }
    }).catch(function(){st.pending=false;if(st.running)stop('load-failure')});
  }
  function heartbeat(ts){
    raf=0;
    if(!st.running)return;
    if(!fixed()) {stop('left-colored-static-mode');return}
    var b345=w.__BASAIR_B345_SEQUENCE__;
    if(b345&&b345.state&&b345.state.running){stop('other-follow-started');return}
    // User may navigate the static printed Mushaf manually. Adapt the new engine
    // to that page, never ask the old B345 renderer to retarget the page.
    var displayed=existingPage();
    if(displayed&&displayed!==st.page&&!st.pending){
      st.page=displayed;st.progress=0;st.anchor=ts;preload(displayed+1);
      if(st.mode==='audio'){
        var token=serial;st.sources=sourceUrls(displayed,reciterKeyAtStart);st.sourceIndex=0;
        if(st.sources.length)playSource(token);else stop('manual-page-audio-missing');
      }
    }
    if(!st.paused&&!st.pending&&st.mode==='silent'){
      st.progress=clamp((ts-st.anchor)/st.duration,0,1);updateProgress();
      if(st.progress>=1)advance('duration-complete');
    }
    if(st.running)raf=w.requestAnimationFrame(heartbeat);
  }
  function start(mode){
    mode=mode==='audio'?'audio':'silent';
    if(!fixed()){notice('اختر الطبعة الملونة بخط الصفحة والحجم 100%');return false}
    var legacy=w.__BASAIR_B345_SEQUENCE__;
    if(legacy&&legacy.state&&legacy.state.running){notice('أوقف المتابعة السابقة أولًا');return false}
    if(st.running)stop('restart');
    var initial=existingPage();if(!initial){notice('لم تتجهز الصفحة الثابتة');return false}
    if(mode==='audio'&&!sound()){notice('المشغل الصوتي غير متاح');return false}
    reciterKeyAtStart=selectedReciter();
    if(mode==='audio'){
      st.sources=sourceUrls(initial,reciterKeyAtStart);st.sourceIndex=0;
      if(!st.sources.length){notice('القارئ المحدد لا يدعم صوت الصفحة في هذا المحرك');return false}
      if(!bindAudio()){notice('تعذر تهيئة الصوت');return false}
    }
    serial++;var token=serial;
    st.running=true;st.paused=false;st.mode=mode;st.page=initial;st.progress=0;st.duration=selectedDuration();
    st.anchor=w.performance&&w.performance.now?w.performance.now():Date.now();st.held=0;
    st.audioError='';st.audioStarted=false;st.pending=false;st.starts++;st.lastReason='started-'+mode;
    hideSheet();d.body.setAttribute(BODY_ACTIVE,'1');var control=E(ID);if(control)control.hidden=false;
    updateProgress();preload(initial+1);preload(initial+2);
    // This .play() runs synchronously within the user's button gesture.
    if(mode==='audio')playSource(token).then(function(ok){if(!ok&&st.running&&token===serial){stop('audio-play-failed');notice('تعذر تشغيل صوت القارئ')}});
    raf=w.requestAnimationFrame(heartbeat);
    return true;
  }
  function pause(){
    if(!st.running)return false;
    var ts=w.performance&&w.performance.now?w.performance.now():Date.now();
    if(st.paused){
      st.paused=false;if(st.mode==='silent')st.anchor+=Math.max(0,ts-st.held);
      if(st.mode==='audio'){
        var a=sound(),token=serial;
        if(a){var p;try{p=a.play()}catch(e){p=Promise.reject(e)}Promise.resolve(p).catch(function(){if(st.running&&token===serial){st.paused=true;notice('تعذر استئناف الصوت')}})}
      }
    }else{st.paused=true;st.held=ts;if(st.mode==='audio')holdAudio()}
    updateProgress();return true;
  }
  function buildUI(){
    if(!d.body)return;
    var existing=E(ID);
    if(!existing){
      var dock=E('mushafDock');if(!dock)return;
      var panel=d.createElement('div');panel.id=ID;panel.hidden=true;panel.dir='rtl';
      var controls=d.createElement('div');controls.className='p211Controls';
      var status=d.createElement('span');status.id='p211FollowStatus';status.textContent='';
      var pauseButton=d.createElement('button');pauseButton.id='p211Pause';pauseButton.textContent='⏸ إيقاف مؤقت';pauseButton.addEventListener('click',pause);
      var stopButton=d.createElement('button');stopButton.id='p211Stop';stopButton.textContent='■ إيقاف';stopButton.addEventListener('click',function(){stop('user-stop')});
      controls.appendChild(status);controls.appendChild(pauseButton);controls.appendChild(stopButton);
      var progressShell=d.createElement('div');progressShell.className='p211ProgressShell';var progress=d.createElement('div');progress.id='p211FollowProgress';progressShell.appendChild(progress);
      panel.appendChild(controls);panel.appendChild(progressShell);
      dock.parentNode.appendChild(panel);
    }
    var sheet=E('sequenceSheetV10');
    if(sheet){
      [['sequenceSilentV10','p211Silent','▤ متابعة بدون صوت','silent'],['sequenceAudioV10','p211Audio','🔊 متابعة بالصوت','audio']].forEach(function(pair){
        var nativeButton=E(pair[0]);
        if(!nativeButton||E(pair[1])||!nativeButton.parentNode)return;
        var newButton=d.createElement('button');newButton.id=pair[1];newButton.type='button';newButton.className=nativeButton.className;
        newButton.textContent=pair[2];newButton.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();start(pair[3])});
        nativeButton.parentNode.insertBefore(newButton,nativeButton.nextSibling);
      });
    }
    var player=E('playSeq');
    if(player&&!E('p211PlayerStart')&&player.parentNode){
      var button=d.createElement('button');button.id='p211PlayerStart';button.className=player.className;button.textContent='▶ متابعة';
      button.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();if(st.running)stop('user-stop');else {
        var sheet=E('sequenceSheetV10');if(sheet){sheet.classList.add('open');sheet.setAttribute('aria-hidden','false')}
        else start('silent');}});
      player.parentNode.insertBefore(button,player.nextSibling);
    }
  }
  function styles(){
    if(E(STYLE))return;var el=d.createElement('style');el.id=STYLE;
    el.textContent=
      'body['+BODY_ROUTE+'="1"] #sequenceSilentV10,'+
      'body['+BODY_ROUTE+'="1"] #sequenceAudioV10,'+
      'body['+BODY_ROUTE+'="1"] #sequenceSilent,'+
      'body['+BODY_ROUTE+'="1"] #sequenceAudio,'+
      'body['+BODY_ROUTE+'="1"] #sequenceSilentV177,'+
      'body['+BODY_ROUTE+'="1"] #sequenceSilentV178,'+
      'body['+BODY_ROUTE+'="1"] #sequenceSilentB336,'+
      'body['+BODY_ROUTE+'="1"] #sequenceSilentB337,'+
      'body['+BODY_ROUTE+'="1"] #sequenceSilentB338,'+
      'body['+BODY_ROUTE+'="1"] #sequenceSilentB339,'+
      'body['+BODY_ROUTE+'="1"] #sequenceSilentB340,'+
      'body['+BODY_ROUTE+'="1"] #sequenceSilentB345,'+
      'body['+BODY_ROUTE+'="1"] #sequenceAudioB336,'+
      'body['+BODY_ROUTE+'="1"] #sequenceAudioB337,'+
      'body['+BODY_ROUTE+'="1"] #sequenceAudioB338,'+
      'body['+BODY_ROUTE+'="1"] #sequenceAudioB339,'+
      'body['+BODY_ROUTE+'="1"] #sequenceAudioB340,'+
      'body['+BODY_ROUTE+'="1"] #sequenceAudioB345,'+
      'body['+BODY_ROUTE+'="1"] [data-b345-sequence],'+
      'body['+BODY_ROUTE+'="1"] #playSeq,'+
      'body['+BODY_ROUTE+'="1"] #p209TrialFieldCard{display:none!important}'+
      'body:not(['+BODY_ROUTE+'="1"]) #p211Silent,'+
      'body:not(['+BODY_ROUTE+'="1"]) #p211Audio,'+
      'body:not(['+BODY_ROUTE+'="1"]) #p211PlayerStart{display:none!important}'+
      'body['+BODY_ACTIVE+'="1"] #sequenceMiniControl{display:none!important}'+
      '#'+ID+'[hidden]{display:none!important}'+
      '#'+ID+'{position:fixed;z-index:75;left:8px;right:8px;bottom:var(--p211-dock-bottom,78px);'+
      'background:#faf8ee;color:#155244;border:1px solid #9db9a7;border-radius:12px;'+
      'padding:7px;box-shadow:0 3px 12px #0002;font:13px system-ui}'+
      '#'+ID+' .p211Controls{display:flex;align-items:center;gap:7px}'+
      '#'+ID+' .p211Controls span{flex:1;min-width:0}'+
      '#'+ID+' button{font:inherit;border:0;border-radius:8px;padding:9px;color:white;background:#1c6955}'+
      '#'+ID+' #p211Stop{background:#8a2b27}'+
      '#'+ID+' .p211ProgressShell{height:3px;border-radius:3px;background:#d6e5dc;margin-top:6px;overflow:hidden}'+
      '#'+ID+' #p211FollowProgress{height:100%;width:0;background:#13664c;transition:width .15s linear}';
    (d.head||d.documentElement).appendChild(el);
  }
  function alignBar(){
    if(!st.running)return;var dock=E('mushafDock');if(!dock||!dock.getBoundingClientRect)return;
    var b=dock.getBoundingClientRect();
    if(b.top>0){d.documentElement.style.setProperty('--p211-dock-bottom',Math.max(0,Math.round(w.innerHeight-b.top+6))+'px')}
  }
  function route(){
    var b=d.body;if(!b)return;
    var on=colored();
    if(on){b.setAttribute(BODY_ROUTE,'1');
      // Disable the P209 experimental visual projection; P211 is definitive,
      // not an extra trial of the legacy Follow mechanism.
      w.__BASAIR_P209_FIELD_QA_ENABLED__=false;
      var legacyOverlay=w.__BASAIR_P209_ONE_SURFACE__;
      if(legacyOverlay&&typeof legacyOverlay.disable==='function')try{legacyOverlay.disable()}catch(_){}
    } else {b.removeAttribute(BODY_ROUTE);if(st.running)stop('edition-changed')}
    if(st.running)alignBar();
  }
  function wrapAliases(){
    if(baseFunctions)return;
    var legacy=w.__BASAIR_B345_SEQUENCE__;
    if(!legacy)return;
    baseFunctions={silent:w.startSilentSequence,audio:w.startAudioSequence,cs:legacy.startSilent,ca:legacy.startAudio};
    w.startSilentSequence=function(){if(colored())return start('silent');return typeof baseFunctions.silent==='function'?baseFunctions.silent.apply(this,arguments):false};
    w.startAudioSequence=function(){if(colored())return start('audio');return typeof baseFunctions.audio==='function'?baseFunctions.audio.apply(this,arguments):false};
    legacy.startSilent=function(){if(colored())return start('silent');return baseFunctions.cs.apply(legacy,arguments)};
    legacy.startAudio=function(){if(colored())return start('audio');return baseFunctions.ca.apply(legacy,arguments)};
  }
  function boot(){
    if(timer)return;
    styles();buildUI();wrapAliases();route();
    timer=w.setInterval(function(){buildUI();wrapAliases();route()},400);
    w.addEventListener('resize',alignBar,{passive:true});
    w.addEventListener('pagehide',function(){if(st.running)stop('pagehide')},{passive:true});
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  w.__BASAIR_P211_TAJWID_STATIC_FOLLOW__={version:211,mode:'replaces-colored-B345',start:start,stop:stop,pause:pause,status:status,route:route,boot:boot};
})(window,document);
