/* BASAIR P93.6 QA008 — polish night print & in-app inbox, safe WebView reload after verified OTA staging.
 * No native restart bridge is added: reloads WebView only after user action, never auto-restarts.
 */
(function(){
 'use strict';
 if(window.__BASAIR_P936_UI_RESTART__)return;
 var panelObserver=null,statusObserver=null,notesObserver=null,watchedStatus=null;
 function $id(id){return document.getElementById(id);}
 function polishNight(){
  var bar=$id('p935NightControls');if(!bar||!bar.querySelector)return false;
  if(bar.classList.contains('p936-refined'))return true;
  var heading=bar.querySelector('.p935-night-heading'),strong=heading&&heading.querySelector('strong'),output=heading&&heading.querySelector('output');
  if(!heading||!strong||!output)return false;
  var group=document.createElement('div');group.className='p936-title-group';
  var moon=document.createElement('span');moon.className='p936-moon-icon';moon.setAttribute('aria-hidden','true');moon.textContent='☾';
  var copy=document.createElement('div');copy.className='p936-title-copy';
  strong.textContent='إضاءة صفحة المصحف';
  var sub=document.createElement('small');sub.textContent='للطبعتين الأصلية والملونة';
  copy.append(strong,sub);group.append(moon,copy);heading.insertBefore(group,output);
  output.setAttribute('aria-live','polite');output.setAttribute('aria-label','مستوى الإضاءة');
  var foot=bar.querySelector('.p935-night-foot span');if(foot)foot.textContent='يؤثر على صفحة المصحف فقط، لا سطوع الهاتف';
  bar.classList.add('p936-refined');return true;
 }
 function readUnread(){
  try{var x=JSON.parse(localStorage.getItem('basair:home:inbox:v559')||'[]');return Array.isArray(x)?x.filter(function(a){return a&&!a.read}).length:0}catch(_e){return 0;}
 }
 function refineNotifications(){
  var panel=$id('bqNoticesSheet');if(!panel)return false;
  panel.classList.add('p936-notices');
  var body=panel.querySelector('.bq-dialog-body'),header=body&&body.querySelector('header');if(!body||!header)return false;
  var heading=$id('p936NoticeHeading');
  if(!heading){heading=document.createElement('div');heading.id='p936NoticeHeading';heading.className='p936-notice-heading';
   var title=document.createElement('strong');title.textContent='صندوق إشعارات بصائر';
   var count=document.createElement('span');count.id='p936NoticeCounter';count.className='p936-notice-counter';count.setAttribute('role','status');count.setAttribute('aria-live','polite');
   heading.append(title,count);header.insertAdjacentElement('afterend',heading);
  }
  var toolbar=$id('p936NoticeToolbar');
  if(!toolbar){toolbar=document.createElement('div');toolbar.id='p936NoticeToolbar';toolbar.className='p936-notice-toolbar';heading.insertAdjacentElement('afterend',toolbar);}
  var action=$id('p935OpenUpdates');if(action&&action.parentElement!==toolbar){action.textContent='تحديثات التطبيق';toolbar.appendChild(action);}
  var feed=panel.querySelector('.bq-feed-box');
  for(var s of [{sel:'[data-bq="notice-refresh"]',label:'فحص الجديد'},{sel:'[data-bq="notice-read"]',label:'قراءة الكل'}]){
   var btn=feed&&feed.querySelector(s.sel);if(btn){btn.textContent=s.label;if(btn.parentElement!==toolbar)toolbar.appendChild(btn);}
  }
  var list=panel.querySelector('.bq-live-notices');
  if(list&&!notesObserver&&window.MutationObserver){notesObserver=new MutationObserver(updateNoticeMeta);notesObserver.observe(list,{childList:true});}
  updateNoticeMeta();return true;
 }
 function updateNoticeMeta(){
  var count=$id('p936NoticeCounter');if(!count)return;
  var unread=readUnread();count.textContent=unread?String(unread)+' غير مقروء':'كل الإشعارات مقروءة';
  var list=$id('bqNoticesSheet')?.querySelector('.bq-live-notices');if(!list)return;
  list.querySelectorAll('.bq-notice-item').forEach(function(article){
   var meta=article.querySelector('small');article.classList.toggle('p936-unread',!!(meta&&/جديد/.test(meta.textContent||'')&&!/مقروء/.test(meta.textContent||'')));
  });
 }
 function ensureRestart(){
  var dialog=$id('basairP92Dialog');if(!dialog)return false;
  var box=$id('p936RestartOffer');
  if(!box){
   box=document.createElement('section');box.id='p936RestartOffer';box.className='p936-restart-offer';box.hidden=true;
   box.innerHTML='<strong>التحديث جاهز للتفعيل</strong><p>أُنجز التنزيل والتحقق والحفظ. إعادة تحميل واجهة التطبيق تفعّل الإصلاح؛ قد تعود إلى الرئيسية، لذلك يُفضّل إيقاف الصوت قبل المتابعة.</p>'+
      '<div class="p936-restart-actions"><button type="button" id="p936RestartNow">إعادة فتح التطبيق الآن</button><button type="button" class="p936-later" id="p936RestartLater">لاحقًا</button></div>';
   var actions=dialog.querySelector('.p92-actions'),status=dialog.querySelector('#p92Status');
   (actions||status||dialog.querySelector('.p92-panel')).insertAdjacentElement('afterend',box);
   $id('p936RestartNow').addEventListener('click',function(){
    // V690 has no authorized native process-restart bridge. This reloads only its WebView.
    if(localStorage.getItem('basair:p92:trial')!=='pending')return;
    window.location.reload();
   });
   $id('p936RestartLater').addEventListener('click',function(){box.hidden=true;});
  }
  var status=dialog.querySelector('#p92Status');
  if(status&&status!==watchedStatus){if(statusObserver)statusObserver.disconnect();watchedStatus=status;
   if(window.MutationObserver){statusObserver=new MutationObserver(syncRestart);statusObserver.observe(status,{childList:true,subtree:true,characterData:true});}
  }
  syncRestart();return true;
 }
 function syncRestart(){
  var box=$id('p936RestartOffer');if(!box)return;
  var trial='';try{trial=localStorage.getItem('basair:p92:trial')||'';}catch(_e){}
  var status=$id('p92Status');var confirmed=!!(status&&/تم التحميل والتحقق/.test(status.textContent||''));
  // Show only if the verified bundle was successfully staged. Never before verification.
  box.hidden=trial!=='pending';
  if(trial==='pending'&&confirmed){var label=box.querySelector('strong');if(label)label.textContent='اكتمل التنزيل والتحقق — جاهز للتفعيل';}
 }
 function hookUpdater(){
  var api=window.BasairP92;if(!api||typeof api.open!=='function')return false;
  if(!api.__p936Hooked){var original=api.open;api.open=function(){var ret=original.apply(this,arguments);ensureRestart();return ret;};api.__p936Hooked=true;}
  ensureRestart();return true;
 }
 function sync(){polishNight();refineNotifications();hookUpdater();}
 // Scoped observer: print tools only, never observe the whole app DOM.
 function observePanel(){var rail=$id('ayahSideRail');if(!rail||panelObserver||!window.MutationObserver)return;
  panelObserver=new MutationObserver(function(){polishNight();});panelObserver.observe(rail,{childList:true,subtree:true});}
 document.addEventListener('click',function(e){
  var target=e.target;if(!target||!target.closest)return;
  if(target.closest('[data-bq="notices"],[data-bq="notice-read"],[data-bq="notice-refresh"]'))setTimeout(function(){refineNotifications();updateNoticeMeta();},0);
  if(target.closest('#p92Apply,#p92Check,#p92Set,#p92Rollback,[data-bq="updates-open"]'))ensureRestart();
  if(target.closest('#ayahSideHandle,#ayahSideRail,[data-bq="tilawa"]'))setTimeout(polishNight,0);
 },true);
 window.addEventListener('basair:p92-notice',function(){setTimeout(function(){refineNotifications();updateNoticeMeta()},70)});
 window.addEventListener('pageshow',sync);
 document.addEventListener('DOMContentLoaded',function(){sync();observePanel();},{once:true});
 sync();observePanel();
 window.__BASAIR_P936_UI_RESTART__={version:'P93.6-QA008',sync:sync,polishNight:polishNight,refineNotifications:refineNotifications,ensureRestart:ensureRestart,diagnostics:function(){return{nightRefined:!!$id('p935NightControls')?.classList.contains('p936-refined'),inboxRefined:!!$id('bqNoticesSheet')?.classList.contains('p936-notices'),restartOffer:!!$id('p936RestartOffer'),restartReady:!!($id('p936RestartOffer')&&!$id('p936RestartOffer').hidden)}}};
})();

/* BASAIR P94 / QA-009 — Reader follow session safeguards.
 * Additive WebView navigation and UI-performance adapter ONLY.
 * Does not edit Quran assets, page order, reciter URLs, timing data or native bridges.
 */
(function (w, d) {
  'use strict';
  if (w.__BASAIR_P94_FOLLOW_GUARD__) return;
  var lastVisualAt = 0, lastAudioProgressAt = 0, lastAudioTime = -1;
  var lastPage = 0, lastMode = '', followSince = 0;
  var lastRetryAt = 0, navigationBusy = false, recoveryVisible = false;
  var automaticPageRecovery = '', pendingErrorToken = 0, oneResumeAttempt = '', errorRecovery = false, waitingSourceFail = false;
  var aud = null, errors = [], originalBack = null;
  var STALL_MS = 16000, VISUAL_MS = 240;
  function byId(id) { return d.getElementById(id); }
  function now() { return Date.now(); }
  function reader() {
    var root=byId('mushafReader');
    if (!root || !root.classList.contains('active')) return false;
    if (d.body && /\bh25-hifz\b|\bh90-review\b|\bh100-teacher\b|\bh24-hifz\b/.test(d.body.className||'')) return false;
    return true;
  }
  function mode() { return String(w.sequenceMode || ''); }
  function active() { return reader() && (mode()==='audioPage' && w.playing===true || !!w.silentActive || !!(w.V178 && w.V178.active)); }
  function page() {
    var p = Number(w.V173_AUDIO_PAGE) || Number(w.currentPage) || 1;
    return Math.max(1,Math.min(604,Math.floor(p)));
  }
  function log(code) {
    errors.push({at:now(),code:String(code||'unknown').slice(0,40),page:page()});
    if (errors.length > 12) errors.shift();
  }
  function clearRecover() { var panel=byId('p94FollowRecover'); if(panel) panel.hidden=true; recoveryVisible=false;errorRecovery=false; }
  function ensureRecover() {
    var panel=byId('p94FollowRecover'); if(panel)return panel;
    panel=d.createElement('section'); panel.id='p94FollowRecover';panel.hidden=true;
    panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');
    panel.innerHTML='<strong>توقفت متابعة الصفحة مؤقتًا</strong><span id="p94FollowDetail">تحقق من الاتصال أو أعد المحاولة من الموضع نفسه.</span><div class="p94-follow-actions"><button id="p94FollowRetry" type="button">استئناف الصفحة</button><button id="p94FollowBack" type="button">الرجوع</button><button id="p94FollowDismiss" type="button" aria-label="إخفاء">×</button></div>';
    (d.body||d.documentElement).appendChild(panel);
    panel.querySelector('#p94FollowRetry').addEventListener('click',function(){retryPage();});
    panel.querySelector('#p94FollowBack').addEventListener('click',function(){
      stopSession();clearRecover();if(typeof w.openTilawaIndex==='function')w.openTilawaIndex();
    });
    panel.querySelector('#p94FollowDismiss').addEventListener('click',clearRecover);
    return panel;
  }
  function showRecover(reason){
    if(!reader())return;
    var panel=ensureRecover(),msg=panel.querySelector('#p94FollowDetail');
    if(msg)msg.textContent='الصفحة '+String(page())+' · '+reason+' · لا تُتخطى أي صفحة تلقائيًا.';
    panel.hidden=false;recoveryVisible=true;errorRecovery=/لم يتمكن القارئ/.test(reason);
  }
  function stopSession(){
    if(navigationBusy)return;
    pendingErrorToken++;waitingSourceFail=false;
    navigationBusy=true;
    try{
      if(!active())return;
      var p=page();
      // Keep=true prevents STEP4 from queueing openPage() after navigation.
      if(typeof w.v183StopSequence==='function')w.v183StopSequence(true);
      else if(typeof w.stopSequence==='function')w.stopSequence(true);
      try{w.currentPage=p;}catch(_e){}
      clearRecover();log('navigation-stop');
    }catch(_){log('stop-failed');}
    finally{navigationBusy=false;}
  }
  function retryPage(){
    var t=now();if(t-lastRetryAt<1600)return false;
    lastRetryAt=t;
    if(!reader())return false;
    var p=page();
    stopSession();
    w.currentPage=p;
    var input=byId('readerPageInput');if(input)input.value=String(p);
    clearRecover();followSince=now();lastAudioProgressAt=followSince;lastAudioTime=-1;
    try{
      if(typeof w.startAudioSequence==='function'){w.startAudioSequence();log('manual-resume');return true;}
      log('resume-unavailable');showRecover('تعذر استئناف التلاوة، افتح «متابعة» من أدوات الصفحة');
    }catch(_){log('resume-error');showRecover('تعذر إعادة التشغيل، جرّب اختيار القارئ مجددًا');}
    return false;
  }
  function decorateTimeUpdate(audio){
    if(!audio||typeof audio.ontimeupdate!=='function'||audio.ontimeupdate.__p94Throttle)return;
    var original=audio.ontimeupdate;
    var wrapper=function(ev){
      // Only reduce visual DOM updates. Audio decoding and the original onended
      // chain are completely unchanged. Always update at the very end.
      if(reader() && mode()==='audioPage'){
        var t=now();
        if(t-lastVisualAt<VISUAL_MS && (!isFinite(audio.duration)||audio.duration-audio.currentTime>1.4))return;
        lastVisualAt=t;
      }
      return original.call(this,ev);
    };
    wrapper.__p94Throttle=true;audio.ontimeupdate=wrapper;
  }
  function audioProgress(){
    if(!active()||mode()!=='audioPage')return;
    var x=Number(this.currentTime)||0;
    if(lastAudioTime<0||x>lastAudioTime+0.12||x+1<lastAudioTime){lastAudioProgressAt=now();lastAudioTime=x;clearRecover();}
  }
  function bindAudio(){
    var a=byId('tilawaAudio');if(!a)return;
    if(a!==aud){
      if(aud){aud.removeEventListener('timeupdate',audioProgress);aud.removeEventListener('playing',audioStarted);aud.removeEventListener('error',audioError);}
      a.addEventListener('timeupdate',audioProgress);
      a.addEventListener('playing',audioStarted);
      a.addEventListener('error',audioError);
      aud=a;
    }
    decorateTimeUpdate(a);
  }
  function audioStarted(){lastAudioProgressAt=now();lastAudioTime=Number(this.currentTime)||0;clearRecover();}
  function audioError(){
    if(!reader()||mode()!=='audioPage')return;
    log('audio-error');
    var token=++pendingErrorToken,failedPage=page();waitingSourceFail=true;
    // Let the native owner try alternate audio sources before offering recovery.
    w.setTimeout(function(){
      if(token!==pendingErrorToken||!reader()||page()!==failedPage)return;
      waitingSourceFail=false;
      if(!w.playing&&mode()!=='audioPage')showRecover('لم يتمكن القارئ من تحميل صوت الصفحة');
    },2200);
  }
  function naturalEndRecovery(t){
    if(!aud||!aud.ended||!isFinite(aud.duration)||aud.duration<=0||aud.currentTime<aud.duration-0.7)return false;
    var p=page(),src=String(aud.currentSrc||aud.src||'').slice(0,500),key=p+'|'+src;
    if(automaticPageRecovery===key||t-lastAudioProgressAt<1800)return false;
    if(typeof aud.onended!=='function')return false;
    // The actual audio has ended. Invoke the OWNER's existing completion
    // callback once, never increment the Quran page counter ourselves.
    automaticPageRecovery=key;
    try{aud.onended.call(aud,{type:'ended',target:aud,p94Recovered:true});log('natural-end-recovered');return true;}
    catch(_){log('natural-end-handler-error');return false;}
  }
  function safeResumeBuffering(t){
    if(!aud||!aud.paused||aud.ended||aud.error||Number(aud.readyState)<2)return false;
    if(t-lastAudioProgressAt<11000)return false;
    var key=page()+'|'+String(aud.currentSrc||aud.src||'').slice(0,500);
    if(oneResumeAttempt===key)return false;
    oneResumeAttempt=key;
    try{var p=aud.play();if(p&&typeof p.catch==='function')p.catch(function(){log('resume-rejected');});log('auto-resume-once');return true;}
    catch(_){log('auto-resume-error');return false;}
  }
  function monitor(){
    bindAudio();
    if(!reader()){lastMode='';lastPage=0;followSince=0;pendingErrorToken++;waitingSourceFail=false;clearRecover();return;}
    var m=mode(),p=page(),t=now();
    if(m!==lastMode||p!==lastPage){lastPage=p;lastMode=m;followSince=t;lastAudioProgressAt=t;lastAudioTime=-1;automaticPageRecovery='';oneResumeAttempt='';if(!waitingSourceFail)pendingErrorToken++;if(!errorRecovery)clearRecover();}
    if(m!=='audioPage'||w.playing!==true||!aud){if(recoveryVisible&&m!=='audioPage'&&!errorRecovery)clearRecover();return;}
    if(!followSince){followSince=t;lastAudioProgressAt=t;}
    if(naturalEndRecovery(t))return;
    if(safeResumeBuffering(t))return;
    // Never assume a chapter/verse is complete based on elapsed time.
    if(t-lastAudioProgressAt>STALL_MS && t-followSince>STALL_MS){
      if(!recoveryVisible){log('audio-stalled');showRecover('لا يوجد تقدم مسموع منذ مدة');}
    }
  }
  function wrapNavigation(name){
    var fn=w[name];if(typeof fn!=='function'||fn.__p94NavWrapper)return;
    var wrapper=function(){if(active())stopSession();return fn.apply(this,arguments);};
    wrapper.__p94NavWrapper=true;w[name]=wrapper;
  }
  function bindNavigation(){
    ['openTilawaIndex','openHome','basairBack'].forEach(wrapNavigation);
  }
  // Owner's mBack handler captures a local v191Back reference. Stop first,
  // but allow the original handler to execute one and only one Back action.
  d.addEventListener('click',function(ev){
    var el=ev.target&&ev.target.closest&&ev.target.closest('#mBack,#dockBack,#v180FocusExit');
    if(el&&active())stopSession();
  },true);
  w.addEventListener('pagehide',function(){if(active())stopSession();});
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',function(){bindAudio();bindNavigation();},{once:true});
  else {bindAudio();bindNavigation();}
  w.setInterval(function(){bindNavigation();monitor();},1200);
  w.__BASAIR_P94_FOLLOW_GUARD__={version:'P94-QA009',status:function(){return{reader:reader(),mode:mode(),page:page(),active:active(),recoveryVisible:recoveryVisible,errors:errors.slice(-5)};},
    _test:{monitor:monitor,stopSession:stopSession,retryPage:retryPage,bindNavigation:bindNavigation,bindAudio:bindAudio,showRecover:showRecover}};
})(window,document);

/* BASAIR P94.1 / owner QA-011
   Reader-safe sequential Back after Follow pause/stop, and conservative audio-driven
   printed-page follow. Only additive WebView code; no Quran data/audio engine edits.
   Precise word/ayah alignment requires verified segment timestamps, and is not claimed.
*/
(function(w,d){
 'use strict';
 if(w.__BASAIR_P941_FOLLOW__)return;
 var lastPage=0,lastRaw=-1,lastGeneration=-1,lastAudio=null,backBusy=false,sessionSeen=false;
 var stats={back:0,closedSearch:0,originalStop:0,visualSamples:0,repeatResets:0};
 function E(id){return d.getElementById(id)}
 function ctl(){return w.__BASAIR_B345_SEQUENCE__||w.B345SequenceController||null}
 function st(){var c=ctl();return c&&c.state||null}
 function reading(){var r=E('mushafReader');return !!(r&&r.classList.contains('active')&&!d.body.classList.contains('h25-hifz')&&!d.body.classList.contains('h90-review')&&!d.body.classList.contains('h100-teacher'))}
 function page(){var s=st();return Math.max(1,Math.min(604,Math.floor(Number(s&&s.page)||Number(w.currentPage)||1)))}
 function visible(el,cl){return !!(el&&el.classList.contains(cl))}
 function searchOpen(){return visible(E('quranSearchSheet'),'open')}
 function closeSearch(){
  if(!searchOpen())return false;
  try{if(typeof w.closeQuranSearch==='function')w.closeQuranSearch();else E('quranSearchSheet').classList.remove('open');}catch(_){E('quranSearchSheet').classList.remove('open')}
  stats.closedSearch++;return true;
 }
 function savePage(p){try{w.currentPage=p;var x=E('readerPageInput');if(x)x.value=String(p);w.localStorage.setItem('basair:lastPage',JSON.stringify(p));}catch(_){} }
 function stopOwner(){
  var c=ctl(),s=st(),p=page();
  if(s&&s.running&&c&&typeof c.stop==='function'){c.stop();stats.originalStop++;}
  // P34/R39 retains the exact printed page after Stop; release it on navigation only.
  try{if(s&&s.printStaticHeld&&c&&typeof c.releaseStaticPrint==='function')c.releaseStaticPrint();}catch(_){}
  savePage(p);
 }
 function backToIndex(){
  if(backBusy||!reading())return false;
  if(closeSearch())return true;
  // Respect other visible, transient reader sheets: they must close before leaving.
  var trans=[['ayahSideRail','open'],['navSheet','open'],['fontSheet','open'],['sequenceSheetV10','open'],['readerMoreSheet','open']];
  for(var i=0;i<trans.length;i++)if(visible(E(trans[i][0]),trans[i][1]))return false;
  backBusy=true;
  try{
    var s=st(); if(!s)return false;
    if(s.running||s.printStaticHeld||d.body.getAttribute('data-r39-print-static')==='1')sessionSeen=true;
    if(!sessionSeen)return false;
    stopOwner();
    if(typeof w.openTilawaIndex==='function')w.openTilawaIndex();
    if(reading()&&typeof w.show==='function')w.show('tilawaIndex');
    stats.back++;
    return true;
  }catch(_){return false}
  finally{backBusy=false}
 }
 // React before legacy click handlers, but only for the reader Back controls.
 d.addEventListener('click',function(ev){
   var t=ev.target&&ev.target.closest&&ev.target.closest('#mBack,#dockBack,#v180FocusExit,[data-p941-reader-back]');
   if(!t||!reading())return;
   if(backToIndex()){
      if(ev.preventDefault)ev.preventDefault();
      if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
      if(ev.stopPropagation)ev.stopPropagation();
   }
 },true);
 function installBack(){
   // Native Android may call the established basairBack router directly.
   // Do not hijack it in Tafsir, Hifz, Home or Tilawa index.
   var old=w.basairBack;
   if(typeof old==='function'&&!old.__p941){
     var wrapped=function(){if(reading()&&backToIndex())return false;return old.apply(this,arguments)};
     wrapped.__p941=true;w.basairBack=wrapped;
   }
 }
 function conservative(raw){
   // First 15% of page audio stays on first lines. In the remaining audio keep
   // the final visible row in view; never imply per-word timestamp precision.
   raw=Math.max(0,Math.min(1,Number(raw)||0));
   if(raw<=.15)return 0;
   return Math.max(0,Math.min(.90,(raw-.15)/.85*.90));
 }
 function syncAudio(){
   if(!reading())return;
   var s=st(),a=E('tilawaAudio');
   if(!s||!s.running||s.mode!=='audio'||s.paused||s.scaleMode!=='normal'||s.surfaceBusy||!a)return;
   // Never replace verified exact ayah, zoom, Arkani or teacher plans.
   if(s.exactAyahAudio||s.rasterTimedFollow||s.specialReciter)return;
   var pr=w.__BASAIR_PRINT_FOLLOW_100__;
   if(!pr||typeof pr.active!=='function'||!pr.active())return;
   var dur=Number(a.duration),cur=Number(a.currentTime);
   if(!(dur>0&&isFinite(dur)&&isFinite(cur))||a.ended)return;
   var raw=Math.max(0,Math.min(1,cur/dur)),p=page(),gen=Number(s.generation)||0;
   if(gen!==lastGeneration||p!==lastPage||lastAudio!==String(a.currentSrc||a.src||'')){
     lastPage=p;lastGeneration=gen;lastRaw=-1;lastAudio=String(a.currentSrc||a.src||'');
   }else if(lastRaw>=0&&raw<lastRaw-.20){stats.repeatResets++;}
   lastRaw=raw;
   // B345 itself owns every repaint and pause; feed only its documented print
   // anchor state, leaving transport, playbackRate and page advancement untouched.
   s.printAnchorPage=p;
   s.printAnchorVisual=conservative(raw);
   s.printAnchorClock=raw;
   stats.visualSamples++;
 }
 var audioAttached=null;
 function bindAudio(){var a=E('tilawaAudio');if(a&&a!==audioAttached){
   if(audioAttached){audioAttached.removeEventListener('timeupdate',syncAudio);audioAttached.removeEventListener('seeked',syncAudio);}
   a.addEventListener('timeupdate',syncAudio);a.addEventListener('seeked',syncAudio);audioAttached=a;
 }}
 // Low-frequency binding/Back repair, no mutation observers or additional audio timers.
 var poll=w.setInterval(function(){if(reading()){var s=st();if(s&&(s.running||s.printStaticHeld||d.body.getAttribute('data-r39-print-static')==='1'))sessionSeen=true;installBack();bindAudio();}else {lastPage=0;lastRaw=-1;lastGeneration=-1;sessionSeen=false;}},750);
 d.addEventListener('DOMContentLoaded',function(){installBack();bindAudio()},{once:true});
 installBack();bindAudio();
 w.__BASAIR_P941_FOLLOW__={version:'P94.1-QA011',back:backToIndex,sync:syncAudio,conservative:conservative,diagnostics:function(){
   var s=st();return {reader:reading(),running:!!(s&&s.running),paused:!!(s&&s.paused),staticHeld:!!(s&&s.printStaticHeld),page:page(),visualAnchored:stats.visualSamples,sessionSeen:sessionSeen,repeatResets:stats.repeatResets,backTransitions:stats.back,closedSearch:stats.closedSearch};
 },_test:{stopOwner:stopOwner,installBack:installBack}};
})(window,document);
