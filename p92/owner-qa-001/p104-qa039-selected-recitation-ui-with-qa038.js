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
    var token=++pendingErrorToken,failedPage=page(),failedSrc=String(this.currentSrc||this.src||'');waitingSourceFail=true;
    // Let the native owner try alternate audio sources before offering recovery.
    w.setTimeout(function(){
      if(token!==pendingErrorToken||!reader()||page()!==failedPage)return;
      waitingSourceFail=false;
      if(mode()==='audioPage'&&w.playing!==true&&aud&&aud.error&&String(aud.currentSrc||aud.src||'')===failedSrc)showRecover('لم يتمكن القارئ من تحميل صوت الصفحة');
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
    ['openTilawaIndex','openHome'].forEach(wrapNavigation);
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

/* Basair Quran P94.2 QA012 — Follow navigation + configurable visual reading aid.
   Additive WebView only; do not alter Quran, audio URL, reciter, repeat or native bridge.
   Approximate print-page guide is not word/ayah timestamp alignment. */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P942_FOLLOW_FINAL__)return;
 var KEY='basair:p942:follow-guide:v1';
 var defaults={enabled:true,color:'teal',strength:18,delay:22};
 var colors={teal:'20,146,117',gold:'175,132,48',blue:'45,132,194'};
 var options=readPrefs(),seenReader=false,owned=false,ownedPage=0,seenStarts=0,readerGoneAt=0,returnBusy=false;
 var audioBound=null,visualPage=0,lastTime=-1,lastAudioSrc='',lastGeneration=-1,guideNode=null,lastTimeChanged=0;
 var stats={back:0,searchClosed:0,retarget:0,retargetMiss:0,guideUpdates:0,staleFont:0,resumeOffers:0};
 function E(x){return d.getElementById(x)}
 function c(){return w.__BASAIR_B345_SEQUENCE__||w.B345SequenceController||null}
 function state(){var x=c();return x&&x.state||null}
 function reader(){var el=E('mushafReader'),b=d.body;return !!(el&&el.classList.contains('active')&&b&&!b.classList.contains('h25-hifz')&&!b.classList.contains('h90-review')&&!b.classList.contains('h100-teacher'))}
 function num(v,min,max,fallback){var x=Number(v);return isFinite(x)?Math.min(max,Math.max(min,x)):fallback}
 function loadRaw(){try{return JSON.parse(w.localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
 function readPrefs(){var a=loadRaw();return {enabled:a.enabled!==false,color:colors[a.color]?a.color:'teal',strength:num(a.strength,8,35,18),delay:num(a.delay,8,60,22)}}
 function save(){try{w.localStorage.setItem(KEY,JSON.stringify(options))}catch(e){}applyTheme();drawGuide()}
 function audio(){return E('tilawaAudio')}
 function edition(){return (d.body&&d.body.getAttribute('data-v144-print'))||''}
 function isPrinted(){var x=state();return !!(x&&x.scaleMode==='normal'&&!d.body.classList.contains('stableDigital'))}
 function active(){var s=state();return reader()&&!!(s&&(s.running||s.paused))}
 function activeAudio(){var s=state();return reader()&&!!(s&&s.running&&s.mode==='audio')}
 function page(){var s=state();return Math.max(1,Math.min(604,Math.floor(Number(s&&s.page)||Number(w.currentPage)||1)))}
 function markOwned(){var s=state();if(!s||!reader())return;
  if(!seenReader){seenReader=true;seenStarts=Number(s.starts)||0;readerGoneAt=0;}
  if(s.running||s.paused||s.printStaticHeld||d.body.getAttribute('data-r39-print-static')==='1'||Number(s.starts)>seenStarts){owned=true;ownedPage=page();}
 }
 function searchLayer(){var q=E('quranSearchSheet');return q&&q.classList.contains('open')?q:null}
 function hideLayer(){
  if(searchLayer()){try{if(typeof w.closeQuranSearch==='function')w.closeQuranSearch()}catch(e){}var q=searchLayer();if(q)q.classList.remove('open');stats.searchClosed++;return true}
  var defs=[['fontSheet','open'],['navSheet','open'],['sequenceSheetV10','open'],['readerMoreSheet','open'],['ayahSideRail','open'],['sheet','open'],['v180ReadingSettings','open'],['v175GeneralTools','open']];
  for(var i=0;i<defs.length;i++){var el=E(defs[i][0]);if(el&&el.classList.contains(defs[i][1])){
    if(defs[i][0]==='ayahSideRail'){try{if(w.__BASAIR_RC20__?.close)w.__BASAIR_RC20__.close()}catch(e){}d.body.classList.remove('rc20-page-tools-open')}
    el.classList.remove(defs[i][1]);if(defs[i][0]==='sequenceSheetV10')el.setAttribute('aria-hidden','true');return true;
  }}return false;
 }
 function savePage(){var p=ownedPage||page();try{w.currentPage=p;var el=E('readerPageInput');if(el)el.value=String(p);w.localStorage.setItem('basair:lastPage',String(p))}catch(e){}return p}
 function leaveReader(){if(!reader()||returnBusy)return false;returnBusy=true;
  try{
   if(hideLayer())return true;
   if(!owned){markOwned();if(!owned)return false;}
   var controller=c(),s=state();savePage();
   if(s&&s.running&&controller&&typeof controller.stop==='function')controller.stop();
   if(s&&s.printStaticHeld&&controller&&typeof controller.releaseStaticPrint==='function')controller.releaseStaticPrint();
   try{var po=w.__BASAIR_PRINT_FOLLOW_100__;if(po&&typeof po.thawStatic==='function')po.thawStatic()}catch(e){}
   hideGuide();
   if(typeof w.openTilawaIndex==='function')w.openTilawaIndex();
   if(reader()&&typeof w.show==='function')w.show('tilawaIndex');
   var til=E('tilawaIndex');
   if(til&&!til.classList.contains('active')&&typeof w.show==='function')w.show('tilawaIndex');
   stats.back++;owned=false;seenReader=false;return true;
  }catch(e){return false}
  finally{returnBusy=false;}
 }
 // The modern home has a capture-phase #mBack interceptor; listen on WINDOW first.
 function interceptBack(ev){var t=ev.target&&ev.target.closest&&ev.target.closest('#mBack,#dockBack,#v180FocusExit,[data-p941-reader-back]');if(!t||!reader())return;
  if(!owned)markOwned();if(!owned)return;
  if(leaveReader()){ev.preventDefault();ev.stopImmediatePropagation();ev.stopPropagation();}
 }
 /* QA014: retired duplicate click-back capture; one explicit unified router below. */
 function baseBack(){var h=w.__BASAIR_HOME_STEP117__;if(h&&typeof h.back==='function')return h.back();var h2=w.__BASAIR_HOME_STEP116__;if(h2&&typeof h2.back==='function')return h2.back();return false}
 var nativeBridge=function(){if(reader()){markOwned();if(owned&&leaveReader())return false;}return baseBack()};
 nativeBridge.__p942=true;
 function assertBack(){/* QA014: preserve the native home router; do not repeatedly overwrite basairBack. */}
 function resetAfterLeaving(){if(reader()){readerGoneAt=0;markOwned();return}
  if(!readerGoneAt)readerGoneAt=Date.now();
  if((E('tilawaIndex')&&E('tilawaIndex').classList.contains('active'))||(E('home')&&E('home').classList.contains('active'))||Date.now()-readerGoneAt>4500){owned=false;seenReader=false;readerGoneAt=0;hideGuide();d.body.classList.remove('bq942-guide-on','bq942-guide-off');}
 }
 // ----------------- Follow settings in existing sequence sheet -----------------
 function optionsHtml(){return '<section id="bq942Options" aria-label="إعدادات التظليل أثناء المتابعة" class="bq942-settings">'+
  '<div class="bq942-top"><span class="bq942-title"><b>تظليل موضع القراءة</b><small>يساعد على تتبع الصفحة مع الصوت</small></span><label class="bq942-switch"><input type="checkbox" id="bq942Enabled" aria-label="إظهار التظليل"><span>إظهار</span></label></div>'+
  '<details id="bq942More"><summary>المزيد من إعدادات التظليل <span aria-hidden="true">⌄</span></summary><div class="bq942-more">'+
  '<span class="bq942-label">لون التظليل</span><div class="bq942-colors" role="group" aria-label="لون التظليل">'+
  '<button type="button" data-bq942-color="teal">أخضر هادئ</button><button type="button" data-bq942-color="gold">ذهبي</button><button type="button" data-bq942-color="blue">سماوي</button></div>'+
  '<label class="bq942-range"><span>شفافية التظليل <output id="bq942StrengthLabel"></output></span><input id="bq942Strength" type="range" min="8" max="35" step="1"></label>'+
  '<label class="bq942-range"><span>تأخير تقدّم الظل <output id="bq942DelayLabel"></output></span><input id="bq942Delay" type="range" min="8" max="60" step="2"></label>'+
  '<p class="bq942-hint">يحافظ التأخير على السطور ظاهرة مدة أطول. عند تكرار القارئ للآية لا تتوفر مزامنة حرفية إلا ببيانات توقيت معتمدة.</p>'+
  '<button type="button" id="bq942Reset" class="bq942-reset">استعادة الإعدادات الافتراضية</button></div></details></section>'}
 function ensureOptions(){var sh=E('sequenceSheetV10');if(!sh)return false;
  var root=E('bq942Options');if(!root){var target=sh.querySelector('.v170SequenceSettings')||sh.querySelector('.sequencePanelV10');if(!target)return false;var n=d.createElement('div');n.innerHTML=optionsHtml();root=n.firstChild;target.insertAdjacentElement('afterend',root);}
  var cb=E('bq942Enabled');if(cb)cb.checked=!!options.enabled;
  var strength=E('bq942Strength'),delay=E('bq942Delay');if(strength)strength.value=String(options.strength);if(delay)delay.value=String(options.delay);
  var sl=E('bq942StrengthLabel'),dl=E('bq942DelayLabel');if(sl)sl.textContent=options.strength+'%';if(dl)dl.textContent=options.delay+' ثانية';
  root.querySelectorAll('[data-bq942-color]').forEach(function(x){x.classList.toggle('selected',x.getAttribute('data-bq942-color')===options.color);x.setAttribute('aria-pressed',x.classList.contains('selected')?'true':'false')});return true;
 }
 function saveOptionEvent(e){var t=e.target;
  if(!t)return;
  if(t.id==='bq942Enabled')options.enabled=!!t.checked;
  else if(t.id==='bq942Strength')options.strength=num(t.value,8,35,18);
  else if(t.id==='bq942Delay')options.delay=num(t.value,8,60,22);
  else return;
  save();ensureOptions();
 }
 d.addEventListener('change',saveOptionEvent,true);d.addEventListener('input',function(e){if(e.target&&['bq942Strength','bq942Delay'].indexOf(e.target.id)>=0)saveOptionEvent(e)},true);
 d.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('[data-bq942-color],#bq942Reset');if(!t)return;e.preventDefault();e.stopPropagation();
  if(t.id==='bq942Reset')options=Object.assign({},defaults);else options.color=t.getAttribute('data-bq942-color');save();ensureOptions();
 },true);
 // ----------------- Conservative guide, no fake word-by-word timing -----------------
 function applyTheme(){var b=d.body;if(!b)return;b.style.setProperty('--bq942-rgb',colors[options.color]);b.style.setProperty('--bq942-strength',String(options.strength/100));b.classList.toggle('bq942-guide-off',activeAudio()&&!options.enabled);b.classList.toggle('bq942-guide-on',activeAudio()&&options.enabled)}
 function hideGuide(){if(guideNode)guideNode.hidden=true}
 function locateCard(){var p=page(),root=E('b345NormalStack');if(!root)return null;
  var selector='[data-r33-print-page="'+p+'"],[data-b345-page="'+p+'"]';
  return root.querySelector(selector)||null;
 }
 function guideFor(card){if(!card)return null;var guide=card.querySelector(':scope > .bq942-guide');if(!guide){guide=d.createElement('div');guide.className='bq942-guide';guide.setAttribute('aria-hidden','true');card.appendChild(guide)}guideNode=guide;return guide}
 function conservative(raw,duration){var delayFraction=Math.max(.20,Math.min(.65,options.delay/Math.max(1,duration)));raw=num(raw,0,1,0);
  if(raw<=delayFraction)return 0;
  var rest=(raw-delayFraction)/Math.max(.01,1-delayFraction);
  // Maintain a visible final line until the audio actually finishes. Not an ayah timestamp.
  return Math.min(.85,Math.max(0,rest*.85));
 }
 function drawGuide(){if(!reader()||!activeAudio()||!isPrinted()||!options.enabled){hideGuide();return}
  var s=state(),a=audio();if(!s||!a)return;
  var card=locateCard();if(!card){hideGuide();return}
  var dur=Number(a.duration),cur=Number(a.currentTime);if(!(dur>0)||!isFinite(dur)||!isFinite(cur)){hideGuide();return}
  var src=String(a.currentSrc||a.src||''),gen=Number(s.generation)||0,p=page(),raw=num(cur/dur,0,1,0);
  if(lastGeneration!==gen||visualPage!==p||lastAudioSrc!==src||lastTime>cur+.8){lastTimeChanged=Date.now();}
  lastGeneration=gen;visualPage=p;lastAudioSrc=src;lastTime=cur;
  var exact=!!(s.exactAyahAudio||s.rasterTimedFollow||s.specialReciter||s.scaleMode==='zoom');
  var progress=exact?num(s.progress,0,.85,0):conservative(raw,dur);
  if(!exact&&!s.paused&&typeof s.printAnchorVisual==='number'){
    s.printAnchorPage=p;s.printAnchorVisual=progress;s.printAnchorClock=raw;
  }
  var guide=guideFor(card);if(!guide)return;
  guide.hidden=false;guide.style.top=(18+progress*66)+'%';guide.style.height='4.7%';
  stats.guideUpdates++;
 }
 function bindAudio(){var a=audio();if(!a||audioBound===a)return;
  if(audioBound){['timeupdate','seeked','loadedmetadata','playing','pause','ended'].forEach(function(ev){audioBound.removeEventListener(ev,drawGuide)})}
  audioBound=a;['timeupdate','seeked','loadedmetadata','playing','pause','ended'].forEach(function(ev){a.addEventListener(ev,drawGuide)});
 }
 // ----------------- Safe ayah retarget and font change handoff -----------------
 function targetAt(ev){var t=ev.target&&ev.target.closest&&ev.target.closest('[data-selectayah][data-s]');
  if(!t||!t.closest('#mushafReader'))return null;
  var s=Number(t.getAttribute('data-s')),a=Number(t.getAttribute('data-selectayah'));if(!(s>0&&a>0))return null;
  var card=t.closest('[data-r33-print-page],[data-b345-page]');var p=Number(card&&(card.getAttribute('data-r33-print-page')||card.getAttribute('data-b345-page')))||page();
  var pos=0;try{var tr=t.getBoundingClientRect(),cr=card&&card.getBoundingClientRect();if(cr&&cr.height)pos=num((tr.top+tr.height/2-cr.top)/cr.height,0,1,0)}catch(e){}
  return {page:p,s:s,a:a,g:Number(t.getAttribute('data-g'))||0,progress:pos};
 }
 // P96.8 QA028: observe a single original R33 pointerup; never call native
 // retargetPrintAyah twice for the synthetic click from that same physical tap.
 var p968Gesture=null;
 function p968Point(ev){var pt=(ev.changedTouches&&ev.changedTouches[0])||(ev.touches&&ev.touches[0])||ev;
  return {x:Number(pt.clientX)||0,y:Number(pt.clientY)||0}}
 function p968HitAt(q){
  var host=E('b345NormalStack');if(!host||!host.querySelectorAll)return null;
  var shells=host.querySelectorAll('.r33PrintShell');
  for(var i=0;i<shells.length;i++){
   var shell=shells[i],sr=shell.getBoundingClientRect();
   if(q.x<sr.left||q.x>sr.right||q.y<sr.top||q.y>sr.bottom)continue;
   var hits=shell.querySelectorAll('.ayahHit');
   for(var k=0;k<hits.length;k++){
    var h=hits[k],r=h.getBoundingClientRect();
    if(q.x>=r.left&&q.x<=r.right&&q.y>=r.top&&q.y<=r.bottom){
     var s=Number(h.getAttribute('data-s')),a=Number(h.getAttribute('data-selectayah'));
     if(!(s>0&&a>0))return null;
     return {page:Number(shell.getAttribute('data-r33-print-page'))||page(),s:s,a:a,g:Number(h.getAttribute('data-g'))||0,hit:h};
    }
   }
  }
  return null;
 }
 function p968Start(ev){
  p968Gesture=null;if(!activeAudio()||!isPrinted()||state()?.paused)return;
  var q=p968Point(ev),h=p968HitAt(q),st=state();if(!h||!st)return;
  p968Gesture={at:Date.now(),x:q.x,y:q.y,target:h,before:Number(st.printRetargets)||0,accepted:false,endedAt:0};
 }
 function p968End(ev){
  var g=p968Gesture;if(!g||Date.now()-g.at>1300||!activeAudio())return;
  var q=p968Point(ev);if(Math.abs(q.x-g.x)>12||Math.abs(q.y-g.y)>12)return;
  var st=state();if(!st||(Number(st.printRetargets)||0)<=g.before)return;
  if(Number(st.page)!==g.target.page||Number(w.selectedSurah)!==g.target.s||Number(w.selectedTilawaAyah)!==g.target.a)return;
  g.accepted=true;g.endedAt=Date.now();stats.p968NativeConfirmed=(stats.p968NativeConfirmed||0)+1;
  try{var api=w.__BASAIR_P964_AYAH_MEANING__;
   if(api&&typeof api.accept==='function')api.accept(g.target,g.target.hit);
  }catch(_e){}
 }
 w.addEventListener('pointerdown',p968Start,true);
 w.addEventListener('pointerup',p968End,false);
 if(!w.PointerEvent){w.addEventListener('touchstart',p968Start,true);w.addEventListener('touchend',p968End,false);}
 function retargetClick(ev){if(!activeAudio()||state()?.paused)return;
  var g=p968Gesture,q=p968Point(ev),near=g&&Math.abs(q.x-g.x)<=16&&Math.abs(q.y-g.y)<=16;
  if(g&&g.accepted&&near&&Date.now()-g.endedAt<1100){
   stats.p968DuplicateSkipped=(stats.p968DuplicateSkipped||0)+1;return;
  }
  var t=targetAt(ev);if(!t)return;
  var ctrl=c(),method=isPrinted()?'retargetPrintAyah':'retargetDigitalAyah';if(!ctrl||typeof ctrl[method]!=='function')return;
  var ok=false;try{ok=ctrl[method](t)===true}catch(e){}
  if(ok){pendingSelection=Date.now();stats.retarget++;try{var jump=w.__BASAIR_P964_AYAH_MEANING__;if(jump&&typeof jump.accept==='function')jump.accept(t,ev.target)}catch(_e){}ev.preventDefault();ev.stopImmediatePropagation();ev.stopPropagation()}
  else{stats.retargetMiss++;showResume('حدد الآية ثم اضغط استئناف المتابعة')}
 }
 w.addEventListener('click',retargetClick,true);
 function isFontTap(t){return !!(t&&t.closest&&t.closest('[data-stfont],[data-final-font],[data-v181font],[data-v129-print],[data-v119-font],[data-b273-font]'))}
 var pendingFont=0,pendingSelection=0;
 function recordFontTap(ev){if(!reader()||!isFontTap(ev.target))return;var s=state();if(s&&s.running){owned=true;ownedPage=page();pendingFont=Date.now();}}
 w.addEventListener('click',recordFontTap,true);
 function ensureResume(){var host=E('mushafReader');if(!host)return null;var box=E('bq942Resume');if(box)return box;
  box=d.createElement('div');box.id='bq942Resume';box.hidden=true;box.setAttribute('role','status');
  box.innerHTML='<span id="bq942ResumeMsg">متابعة التلاوة من موضعك المحفوظ</span><button id="bq942ResumeButton" type="button">استئناف المتابعة</button><button id="bq942ResumeClose" type="button" aria-label="إخفاء">×</button>';
  host.appendChild(box);
  E('bq942ResumeClose').addEventListener('click',function(){box.hidden=true});
  E('bq942ResumeButton').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(!reader())return;
   var x=c();if(!x||typeof x.startAudio!=='function')return;box.hidden=true;
   try{savePage();x.startAudio()}catch(err){showResume('تعذر الاستئناف؛ افتح «متابعة» واختر القارئ مرة أخرى')}
  });return box;
 }
 function showResume(msg){var box=ensureResume();if(!box)return;E('bq942ResumeMsg').textContent=msg||'التلاوة متوقفة بعد تغيير الخط';box.hidden=false;stats.resumeOffers++}
 function monitor(){resetAfterLeaving();ensureOptions();applyTheme();bindAudio();assertBack();
  if(!reader()){return;}
  var s=state();if(!s)return;
  if(s.running||s.printStaticHeld){owned=true;ownedPage=page()}
  var box=E('bq942Resume');if(s.running&&box)box.hidden=true;
  if(pendingFont&&Date.now()-pendingFont>210){pendingFont=0;if(owned&&!s.running){stats.staleFont++;showResume('تغيّر الخط؛ استأنف المتابعة من الصفحة الحالية بضغطة واحدة')}}
  if(pendingSelection&&Date.now()-pendingSelection>210){pendingSelection=0;if(owned&&!s.running){showResume('تم تحديد الآية؛ اضغط لاستئناف المتابعة من الموضع الحالي')}}
  if(s.running&&s.mode==='audio'){drawGuide()}
  else if(!s.paused)hideGuide();
 }
 // One coalesced lightweight observer loop. No mutation observer on the Quran page.
 var timer=w.setInterval(monitor,850);
 d.addEventListener('DOMContentLoaded',monitor,{once:true});w.addEventListener('pageshow',monitor);monitor();
 w.__BASAIR_P942_FOLLOW_FINAL__={version:'P94.2-QA012',settings:function(){return Object.assign({},options)},set:function(next){options=readPrefs();Object.keys(next||{}).forEach(function(k){if(k in options)options[k]=next[k]});options={enabled:options.enabled!==false,color:colors[options.color]?options.color:'teal',strength:num(options.strength,8,35,18),delay:num(options.delay,8,60,22)};save();ensureOptions()},leave:leaveReader,sync:drawGuide,diagnostics:function(){return {reader:reader(),owned:owned,engineState:(state()&&state().lastReason)||'',guide:!!(guideNode&&!guideNode.hidden),prefs:readPrefs(),stats:Object.assign({},stats)}},_test:{conservative:conservative,markOwned:markOwned,hideLayer:hideLayer,monitor:monitor,retargetClick:retargetClick}};
})(window,document);


/* BASAIR P94.3 / QA014 — ONE back route and functional Follow guide.
 * No Android, Quran, reciter, audio-source or memorisation code is changed.
 * Native `bqNativeBack` is called by MainActivity; keep a safe fallback even after B345 stops.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P944_FOLLOW_FIX__)return;
 var KEY='basair:p942:follow-guide:v1';
 var palette={teal:'20,146,117',gold:'175,132,48',blue:'45,132,194'};
 var counts={native:0,taps:0,sheetClosed:0,searchClosed:0,leftReader:0,delegated:0,options:0,more:0,errors:[]};
 var busy=false, lastBack=0;
 function el(id){return d.getElementById(id)}
 function body(){return d.body}
 function ctrl(){return w.__BASAIR_B345_SEQUENCE__||w.B345SequenceController||null}
 function mainReader(){var x=el('mushafReader'),b=body();return !!(x&&x.classList.contains('active')&&b&&!/\bh25-hifz\b|\bh90-review\b|\bh100-teacher\b/.test(b.className))}
 function view(){var x=d.querySelector('.view.active');return x&&x.id||''}
 function reportError(code){counts.errors.push(String(code).slice(0,50));if(counts.errors.length>5)counts.errors.shift()}
 function sheet(){var x=el('sequenceSheetV10');return x&&x.classList.contains('open')?x:null}
 function closeSheet(){var s=sheet();if(!s)return false;
  try{if(typeof w.closeSequenceV10==='function')w.closeSequenceV10()}catch(e){reportError('close-sequence')}
  s.classList.remove('open');s.setAttribute('aria-hidden','true');s.style.setProperty('display','none','important');
  w.setTimeout(function(){if(!s.classList.contains('open'))s.style.removeProperty('display')},130);
  counts.sheetClosed++;return true;
 }
 function search(){var s=el('quranSearchSheet');return s&&s.classList.contains('open')?s:null}
 function closeSearch(){var s=search();if(!s)return false;
  try{if(typeof w.closeQuranSearch==='function')w.closeQuranSearch()}catch(e){reportError('close-search')}
  s.classList.remove('open');s.setAttribute('aria-hidden','true');counts.searchClosed++;return true;
 }
 function otherLayer(){
  for(var item of [['fontSheet','open'],['navSheet','open'],['readerMoreSheet','open'],['ayahSideRail','open'],['sheet','open'],['v180ReadingSettings','open'],['v175GeneralTools','open']]){
   var s=el(item[0]);if(!s||!s.classList.contains(item[1]))continue;
   if(s.id==='ayahSideRail')try{w.__BASAIR_RC20__?.close?.()}catch(e){}
   s.classList.remove(item[1]);if(s.id==='ayahSideRail'){body()?.classList.remove('rc20-page-tools-open');el('ayahSideShade')?.classList.remove('open')}
   return true;
  }return false;
 }
 function remember(){var x=ctrl(),p=Number(x&&x.state&&x.state.page)||Number(w.currentPage)||Number(el('readerPageInput')?.value)||1;p=Math.max(1,Math.min(604,Math.floor(p)));
  try{w.currentPage=p;w.localStorage?.setItem('basair:lastPage',String(p));var input=el('readerPageInput');if(input)input.value=String(p)}catch(e){reportError('save-page')}
  return p;
 }
 function leaveReader(){if(!mainReader())return false;
  remember();var c=ctrl(),s=c&&c.state;
  try{if(s&&s.running&&typeof c.stop==='function')c.stop()}catch(e){reportError('stop-follow')}
  try{if(s&&s.printStaticHeld&&typeof c.releaseStaticPrint==='function')c.releaseStaticPrint()}catch(e){reportError('release-print')}
  try{w.__BASAIR_PRINT_FOLLOW_100__?.thawStatic?.()}catch(e){}
  body()?.classList.remove('bq942-guide-on','bq942-guide-off');
  try{if(typeof w.openTilawaIndex==='function')w.openTilawaIndex()}catch(e){reportError('open-index')}
  if(view()==='mushafReader')try{if(typeof w.show==='function')w.show('tilawaIndex')}catch(e){reportError('show-index')}
  installNative();
  if(view()==='mushafReader'){reportError('index-not-open');return false}
  counts.leftReader++;return true;
 }
 function delegate(){counts.delegated++;
  try{var home=w.__BASAIR_HOME_STEP117__;if(home&&typeof home.back==='function')return home.back()}catch(e){reportError('home-step117')}
  try{if(typeof w.basairBack==='function'&&w.basairBack!==route)return w.basairBack()}catch(e){reportError('home-back')}
  return false;
 }
 function route(){var n=Date.now();if(busy||n-lastBack<110)return false;lastBack=n;busy=true;
  try{
   if(closeSheet())return false;
   if(closeSearch())return false;
   if(mainReader()){
    if(otherLayer())return false;
    leaveReader();return false;
   }
   delegate();return false;
  }finally{busy=false;}
 }
 function nativeBack(){counts.native++;return route()}
 nativeBack.__p944=true;
 function installNative(){if(body()&&/\bh25-hifz\b|\bh90-review\b|\bh100-teacher\b/.test(body().className))return;
  if(w.bqNativeBack!==nativeBack)w.bqNativeBack=nativeBack;
 }
 function backClick(e){var t=e.target&&e.target.closest&&e.target.closest('#sequenceCloseV10,#sequenceShadeV10,#mBack,#dockBack,#v180FocusExit,#qSearchClose');if(!t)return;
  if(!mainReader()&&!sheet()&&!search())return;
  if((t.id==='sequenceCloseV10'||t.id==='sequenceShadeV10')&&!sheet())return;
  if(t.id==='qSearchClose'&&!search())return;
  e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();counts.taps++;
  if(t.id==='sequenceCloseV10'||t.id==='sequenceShadeV10'){closeSheet();return}
  if(t.id==='qSearchClose'){closeSearch();return}
  route();
 }
 // Window capture precedes legacy DOM/reader button handlers. It does not run in Hifz/Tafsir.
 w.addEventListener('click',backClick,true);
 w.addEventListener('keydown',function(e){if(e.key==='Escape'||e.key==='BrowserBack'){
  if(sheet()||search()||mainReader()){e.preventDefault();route()}
 }},true);
 function guideAPI(){return w.__BASAIR_P942_FOLLOW_FINAL__}
 function prefs(){try{var v=guideAPI()?.settings();if(v)return v}catch(e){}
  try{return JSON.parse(w.localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
 function setOption(v){var a=guideAPI();if(a&&typeof a.set==='function'){try{a.set(v);counts.options++;return true}catch(e){reportError('set-option')}}
  try{var q=Object.assign({enabled:true,color:'teal',strength:18,delay:22},prefs(),v);w.localStorage.setItem(KEY,JSON.stringify(q));counts.options++;return true}catch(e){return false}
 }
 function sync(){var p=prefs(),b=body();if(!b)return;
  var enabled=p.enabled!==false,clr=palette[p.color]||palette.teal,strength=Math.min(35,Math.max(8,Number(p.strength)||18));
  b.classList.toggle('bq944-shade-off',!enabled);
  b.classList.toggle('bq944-shade-on',enabled);
  b.style.setProperty('--bq944-rgb',clr);
  b.style.setProperty('--bq944-alpha',String(strength/100));
  b.style.setProperty('--bq944-word-alpha',String(Math.min(.50,strength/100*1.55)));
  var block=el('bq942Options');if(block){block.setAttribute('data-bq944-ready','1');
   var on=el('bq942Enabled');if(on&&on.checked!==enabled)on.checked=enabled;
   var cap=block.querySelector('.bq942-switch span');if(cap)cap.textContent=enabled?'إظهار':'مخفي';
   var more=el('bq942More');var summary=more&&more.querySelector('summary');if(summary)summary.setAttribute('aria-expanded',more.open?'true':'false');
  }
 }
 w.addEventListener('change',function(e){var t=e.target;if(!t)return;
  if(t.id==='bq942Enabled')setOption({enabled:!!t.checked});
  else if(t.id==='bq942Strength')setOption({strength:Number(t.value)});
  else if(t.id==='bq942Delay')setOption({delay:Number(t.value)});
  else return;sync();
 },true);
 w.addEventListener('input',function(e){var t=e.target;if(!t||!/^bq942(?:Strength|Delay)$/.test(t.id))return;
  setOption({[t.id==='bq942Strength'?'strength':'delay']:Number(t.value)});sync();
 },true);
 w.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('#bq942More>summary,[data-bq942-color],#bq942Reset');if(!t)return;
  e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
  if(t.matches('#bq942More>summary')){var dt=el('bq942More');if(dt){dt.open=!dt.open;counts.more++;sync()}return}
  if(t.id==='bq942Reset')setOption({enabled:true,color:'teal',strength:18,delay:22});
  else setOption({color:t.getAttribute('data-bq942-color')});
  sync();
 },true);
 // Do not install MutationObservers across the Quran pages. One bounded, idempotent 700ms sync.
 var timer=w.setInterval(function(){installNative();sync()},700);
 d.addEventListener('DOMContentLoaded',function(){installNative();sync()},{once:true});
 w.addEventListener('pageshow',function(){installNative();sync()});
 installNative();sync();
 w.__BASAIR_P944_FOLLOW_FIX__={version:'P94.3-QA014',back:nativeBack,close:closeSheet,options:setOption,sync:sync,diagnostics:function(){return {view:view(),sheet:!!sheet(),reader:mainReader(),nativeAttached:w.bqNativeBack===nativeBack,guide:prefs(),events:Object.assign({},counts)}}};
})(window,document);


/* BASAIR P94.4 QA015 — native R95 OFF gate (no changes to the QA014 back router).
   Earlier QA014 used a visual-only override scoped too narrowly and tested only
   backgroundColor; R95 paints gradient backgroundImage and can repaint per frame.
   A root attribute and broad, specificity-safe selector suppress those paints
   instantly while preserving word/ayah DOM, audio, and navigation. */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P945_SHADE_GATE__)return;
 var KEY='basair:p942:follow-guide:v1',mark='data-bq945-shade';
 var counts={toggles:0,hidden:0,shown:0,cleared:0,errors:0};
 function read(){try{var p=JSON.parse(w.localStorage.getItem(KEY)||'{}');return p&&p.enabled!==false}catch(_){return true}}
 function api(){return w.__BASAIR_R93_FOLLOW_HIGHLIGHT__}
 function ui(){return d.getElementById('bq942Enabled')}
 function apply(enabled){
  enabled=enabled!==false;
  var prior=d.documentElement.getAttribute(mark),v=enabled?'on':'off';
  d.documentElement.setAttribute(mark,v);
  if(d.body){
   d.body.classList.toggle('bq944-shade-off',!enabled);
   d.body.classList.toggle('bq944-shade-on',enabled);
   d.body.classList.toggle('bq942-guide-off',!enabled);
   if(!enabled)d.body.classList.remove('bq942-guide-on');
  }
  var box=ui();if(box&&box.checked!==enabled)box.checked=enabled;
  if(!enabled&&prior!==v){
   try{var real=api();if(real&&typeof real.clear==='function'){real.clear();counts.cleared++}}catch(_){counts.errors++}
   counts.hidden++;
  }
  if(enabled&&prior!==v){
   try{var real=api();if(real&&typeof real.invalidate==='function')real.invalidate();
    if(real&&typeof real.refresh==='function'&&real.status&&real.status().running)real.refresh();}catch(_){counts.errors++}
   counts.shown++;
  }
  return v;
 }
 function persist(enabled){
  var a=w.__BASAIR_P944_FOLLOW_FIX__;
  if(a&&typeof a.options==='function'){try{a.options({enabled:enabled});return true}catch(_){counts.errors++}}
  try{var old=JSON.parse(w.localStorage.getItem(KEY)||'{}');old.enabled=enabled;w.localStorage.setItem(KEY,JSON.stringify(old));return true}catch(_){counts.errors++}
  return false;
 }
 function onToggle(e){
  var t=e.target;
  if(!t||t.id!=='bq942Enabled')return;
  var val=!!t.checked;
  persist(val);apply(val);counts.toggles++;
  // Other existing listeners may update the same UI after us. Reapply only
  // the stored user's choice once the event has completely propagated.
  w.setTimeout(function(){apply(read())},0);
 }
 w.addEventListener('change',onToggle,true);
 w.addEventListener('pageshow',function(){apply(read())});
 w.addEventListener('storage',function(e){if(e.key===KEY)apply(read())});
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',function(){apply(read())},{once:true});
 else apply(read());
 w.__BASAIR_P945_SHADE_GATE__={version:'P94.4-QA015',sync:function(){return apply(read())},set:function(v){persist(v!==false);return apply(read())},diagnostics:function(){return {state:d.documentElement.getAttribute(mark),enabled:read(),nativeApi:!!api(),counts:Object.assign({},counts)}}};
})(window,document);


/* P94.5/QA015 compact Follow settings composition.
 * Reuses ORIGINAL inputs and click handlers. Move only late-inserted advanced
 * field labels, never clone/remove controls or alter Follow/audio/Back engines. */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P946_COMPACT_FOLLOW__)return;
 var applyCount=0, moveCount=0, observer=null, liveSettings=null;
 function el(id){return d.getElementById(id)}
 function mount(){
  var sheet=el('sequenceSheetV10');if(!sheet)return false;
  var panel=sheet.querySelector('.sequencePanelV10');if(!panel)return false;
  panel.classList.add('bq946-compact');
  var settings=panel.querySelector('.v170SequenceSettings');if(!settings)return false;
  var more=el('bq946Advanced');
  if(!more){
   more=d.createElement('details');more.id='bq946Advanced';more.className='bq946-advanced';
   var summary=d.createElement('summary');
   summary.innerHTML='<span>المزيد من إعدادات التشغيل <small style="font-weight:400;opacity:.8">(الصوت والمؤقت)</small></span><span class="bq946-arrow" aria-hidden="true">⌄</span>';
   more.appendChild(summary);
   var body=d.createElement('div');body.className='bq946-advanced-body';body.id='bq946AdvancedBody';
   more.appendChild(body);
   var shade=el('bq942Options');
   if(shade&&shade.parentElement===panel)shade.insertAdjacentElement('afterend',more);
   else settings.insertAdjacentElement('afterend',more);
  }
  var target=el('bq946AdvancedBody');if(!target)return false;
  // Original v180SleepTimer and v194s3Volume are inserted later by the app.
  // Their DOM identity and original oninput/onchange handlers must survive.
  for(var id of ['v194s3Volume','v180SleepTimer']){
   var ctl=el(id);if(!ctl||!settings.contains(ctl))continue;
   var lab=ctl.closest('label');
   if(lab&&lab.parentElement===settings){target.appendChild(lab);moveCount++;}
  }
  // Preserve the reading-point explanation above sticky start buttons.
  var modeButtons=panel.querySelector('.sequenceModeV10');
  if(modeButtons){
   for(var cls of ['.sequenceStartV10','.sequenceHintV10']){
    var node=panel.querySelector(cls);
    if(node&&node.parentElement===panel)panel.insertBefore(node,modeButtons);
   }
  }
  // Keep 2x2 core choices and the single reciter field visible.
  var guide=el('bq942Options');
  if(guide&&guide.parentElement===panel&&more.previousElementSibling!==guide){guide.insertAdjacentElement('afterend',more);}
  if(settings!==liveSettings && w.MutationObserver){
   if(observer)observer.disconnect();liveSettings=settings;
   observer=new MutationObserver(function(){mount();});
   observer.observe(settings,{childList:true});
  }
  applyCount++;return true;
 }
 // Only mount on the actual Follow settings sheet; no polling of Quran DOM.
 d.addEventListener('click',function(e){
  var t=e.target;if(!t||!t.closest)return;
  if(t.closest('[id*="Follow"],#sequenceSheetV10,#v170SequenceOpen,#sequenceAudioV10,#sequenceSilentV10')){
   w.setTimeout(mount,0);
  }
 },true);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 w.addEventListener('pageshow',mount);
 w.__BASAIR_P946_COMPACT_FOLLOW__={version:'P94.5-QA015',mount:mount,diagnostics:function(){
  return {mounted:!!(el('sequenceSheetV10')?.querySelector('.bq946-compact')),advanced:!!el('bq946Advanced'),moved:moveCount,applied:applyCount};
 }};
})(window,document);

/* BASAIR P94.6 QA016 — explicit, sole visual shade control + lightweight page-line guide.
 * No changes to B345, R95, Android Back, reciters, Quran data or navigation.
 * Uses actual Follow audio and page geometry. Non-timed readers use a conservative
 * page-time approximation (never represents itself as per-word alignment).
 */
(function (w,d) {
 'use strict';
 if (w.__BASAIR_P946_SHADE_SMOOTH__) return;
 var KEY='basair:p942:follow-guide:v1', MARK='data-bq916-shade', API='__BASAIR_P946_SHADE_SMOOTH__';
 var runtimeEnabled=null,lastRendered=-1,lastPage=-1,lastAudioSrc='',audioEl=null,raf=0;
 var activeCard=null,anchor=null,renderTick=0,renderCount=0,offCount=0,uiCount=0,failCount=0;
 var lastSessionKey='',settleTimer=0,settleCount=0,pageReady=false,missedPages=0,rebinding=0,approxPaints=0,exactPaints=0;
 function E(id){return d.getElementById(id)}
 function getPrefs(){try{var o=JSON.parse(w.localStorage.getItem(KEY)||'{}');return o&&typeof o==='object'?o:{}}catch(e){return {}}}
 function enabled(){return runtimeEnabled===null?getPrefs().enabled!==false:runtimeEnabled}
 function state(){return (w.__BASAIR_B345_SEQUENCE__||w.B345SequenceController||{}).state||{}}
 function audio(){return E('tilawaAudio')}
 function readerActive(){var el=E('mushafReader');return !!(el&&el.classList.contains('active')&&d.body&&!/\bh25-hifz\b|\bh90-review\b|\bh100-teacher\b/.test(d.body.className||''))}
 function followActive(){var s=state();return readerActive()&&s.running&&s.mode==='audio'}
 function readPage(){var s=state();return Math.max(1,Math.min(604,Number(s.page)||Number(w.currentPage)||1))}
 function markVisual(v){var off=!v;d.documentElement.setAttribute(MARK,off?'off':'on');
  var b=d.body;if(b){b.classList.toggle('bq944-shade-off',off);b.classList.toggle('bq944-shade-on',!off);b.classList.toggle('bq942-guide-off',off);if(off)b.classList.remove('bq942-guide-on')}
  if(anchor)anchor.hidden=off;if(off){var r=w.__BASAIR_R93_FOLLOW_HIGHLIGHT__;try{if(r&&typeof r.clear==='function')r.clear()}catch(e){failCount++}offCount++}
 }
 function renderControl(){var panel=E('bq942Options');if(!panel)return false;
  var top=panel.querySelector('.bq942-top');if(!top)return false;
  var button=E('bq916Toggle');if(!button){button=d.createElement('button');button.type='button';button.id='bq916Toggle';button.className='bq916-toggle';button.setAttribute('aria-label','إظهار أو إخفاء تظليل القراءة');top.appendChild(button);
   button.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();var next=!enabled();persist(next);markVisual(next);renderControl();requestPaint(true);});}
  var v=enabled();button.setAttribute('aria-pressed',v?'true':'false');button.innerHTML=v?'<span aria-hidden="true">●</span> التظليل مفعّل':'<span aria-hidden="true">○</span> التظليل مخفي';
  var cb=E('bq942Enabled');if(cb&&cb.checked!==v)cb.checked=v;
  d.documentElement.setAttribute('data-bq916-ready','1');uiCount++;return true;
 }
 function persist(v){runtimeEnabled=!!v;var p=getPrefs();p.enabled=!!v;
  // Preserve original color, strength and delay. Reuse the already-loaded settings controller.
  try{var ctrl=w.__BASAIR_P942_FOLLOW_FINAL__;if(ctrl&&typeof ctrl.set==='function')ctrl.set({enabled:!!v})}catch(e){failCount++}
  try{w.localStorage.setItem(KEY,JSON.stringify(p))}catch(e){failCount++}
  // Legacy P945 gate can remain installed, but does not own this new visible button.
  try{var old=w.__BASAIR_P945_SHADE_GATE__;if(old&&typeof old.sync==='function')old.sync()}catch(e){failCount++}
 }
 function updateCheckbox(ev){if(ev.target&&ev.target.id==='bq942Enabled'){
  var next=!!ev.target.checked;w.setTimeout(function(){persist(next);markVisual(next);renderControl();requestPaint(true)},0)
 }}
 d.addEventListener('change',updateCheckbox,false);
 function currentCard(){var s=state(),p=readPage(),root=E('b345NormalStack');
  if(!root||s.scaleMode!=='normal')return null;
  return root.querySelector('[data-b345-page="'+p+'"],[data-r33-print-page="'+p+'"]');
 }
 function ensureGuide(card){if(!card)return null;
  var el=card.querySelector(':scope > .bq916-reading-line');
  if(!el){el=d.createElement('div');el.className='bq916-reading-line';el.setAttribute('aria-hidden','true');card.appendChild(el)}
  anchor=el;activeCard=card;return el;
 }
 function clamp(x,min,max){return Math.max(min,Math.min(max,Number(x)||0))}
 function lineGeometry(card,i){var lines=Array.prototype.slice.call(card.querySelectorAll(':scope > .exactLine.text'));
  if(!lines.length)lines=Array.prototype.slice.call(card.querySelectorAll(':scope > .exactLine'));
  if(!lines.length)return null;return {line:lines[Math.max(0,Math.min(lines.length-1,i))],length:lines.length};
 }
 function actualLineIndex(card){var native=card.querySelector('.b441FollowWord,.b441FollowAyah,.b441FollowHit');
  var line=native&&native.closest&&native.closest('.exactLine');if(!line)return -1;
  var all=Array.prototype.slice.call(card.querySelectorAll(':scope > .exactLine.text'));
  return all.indexOf(line);
 }
 function conservativeIndex(a,s,lines){var cur=Number(a.currentTime),duration=Number(a.duration);
  if(!isFinite(cur)||!isFinite(duration)||!(duration>0))return 0;
  var opt=getPrefs(),delay=clamp(opt.delay==null?22:opt.delay,8,60),f=clamp((cur-delay)/Math.max(1,duration-delay),0,.98);
  // Never clear or outrun the last printed line until the audio actually ends.
  return Math.min(lines-1,Math.floor(f*Math.max(1,lines-1)));
 }
 function sessionKey(){var a=audio(),s=state();return readPage()+'|'+String(a&&(a.currentSrc||a.src)||'')+'|'+String(s.generation||0)}
 function retryMount(){if(settleTimer||settleCount>=9||!enabled()||!followActive())return;
  settleCount++;settleTimer=w.setTimeout(function(){settleTimer=0;bindAudio();requestPaint(true)},160);
 }
 function paint(){raf=0;
  if(!enabled()||!followActive()){if(anchor)anchor.hidden=true;pageReady=false;return false}
  var key=sessionKey();if(key!==lastSessionKey){lastSessionKey=key;settleCount=0;pageReady=false;lastRendered=-1;if(anchor)anchor.hidden=true;}
  var s=state(),a=audio(),card=currentCard();
  if(!a||!card||!card.isConnected){missedPages++;pageReady=false;if(anchor)anchor.hidden=true;retryMount();return false}
  var pg=readPage(),src=String(a.currentSrc||a.src||'');
  if(card!==activeCard||pg!==lastPage||src!==lastAudioSrc){if(anchor&&activeCard!==card)anchor.hidden=true;lastRendered=-1;lastPage=pg;lastAudioSrc=src;}
  var lines=Array.prototype.slice.call(card.querySelectorAll(':scope > .exactLine.text'));
  if(!lines.length)lines=Array.prototype.slice.call(card.querySelectorAll(':scope > .exactLine'));
  if(!lines.length){pageReady=false;if(anchor)anchor.hidden=true;retryMount();return false;}
  if(!(Number(a.duration)>0)){pageReady=false;if(anchor)anchor.hidden=true;retryMount();return false;}
  // Native marked ayah/word takes precedence whenever it exists on the current rendered page.
  var natural=actualLineIndex(card);
  var index=natural>=0?natural:conservativeIndex(a,s,lines.length);
  var sameMode=anchor&&anchor.classList.contains('bq963-fallback')===(natural<0);
  if(index===lastRendered&&anchor&&anchor.isConnected&&pageReady&&sameMode&&anchor.hidden===(natural>=0))return true;
  var loc=lineGeometry(card,index);if(!loc)return false;
  var element=ensureGuide(card),cr=card.getBoundingClientRect(),lr=loc.line.getBoundingClientRect();
  if(cr.height<=0||lr.height<=0){element.hidden=true;pageReady=false;retryMount();return false;}
  element.style.top=(lr.top-cr.top)+'px';element.style.height=Math.max(15,lr.height)+'px';
  // The owner's native ayah/word mark is primary. A faint line guide is only an approximate fallback.
  var approximate=natural<0;element.classList.toggle('bq963-fallback',approximate);
  element.setAttribute('data-bq963-accuracy',approximate?'approximate':'native');
  element.hidden=!approximate;pageReady=true;lastRendered=index;renderCount++;
  if(approximate)approxPaints++;else exactPaints++;return true;
 }
 function requestPaint(force){if(force){lastRendered=-1}if(raf)return;
  raf=w.requestAnimationFrame(function(){paint()});
 }
 function bindAudio(){var a=audio();if(!a||a===audioEl)return;
  if(audioEl){['timeupdate','playing','loadedmetadata','seeked','pause','ended'].forEach(function(ev){audioEl.removeEventListener(ev,requestPaintSafe)})}
  audioEl=a;rebinding++;pageReady=false;['timeupdate','playing','loadedmetadata','seeked','pause','ended'].forEach(function(ev){a.addEventListener(ev,requestPaintSafe,{passive:true})});
 }
 function requestPaintSafe(){requestPaint(false)}
 function mount(){markVisual(enabled());renderControl();bindAudio();requestPaint(true)}
 // Very light liveness check: rebind if the audio element was replaced and retry an unsettled page.
 // Never touches media playback, page counter, scroll, font or Quran engine.
 w.setInterval(function(){if(!enabled()||!followActive())return;
  if(audio()!==audioEl){bindAudio();requestPaint(true);return;}
  if(sessionKey()!==lastSessionKey||!pageReady)requestPaint(true);
 },750);
 // Bind to the actual settings open action and audio events; do not observe Quran DOM or scroll continuously.
 d.addEventListener('click',function(ev){var t=ev.target;if(t&&t.closest&&t.closest('#sequenceSheetV10,#v170SequenceOpen,#sequenceOpenV10')){
  w.setTimeout(mount,0);
 }},false);
 w.addEventListener('pageshow',mount);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 w[API]={version:'P94.6-QA016',mount:mount,enable:function(v){persist(!!v);markVisual(!!v);renderControl();requestPaint(true)},refresh:requestPaint,diagnostics:function(){return{enabled:enabled(),htmlShade:d.documentElement.getAttribute(MARK),toggle:!!E('bq916Toggle'),guide:!!(anchor&&anchor.isConnected&&!anchor.hidden),paintCount:renderCount,offCount:offCount,uiSync:uiCount,failures:failCount,reader:readerActive(),follow:followActive(),page:readPage(),pageReady:pageReady,missedPages:missedPages,audioRebinds:rebinding,approximateFrames:approxPaints,nativeFrames:exactPaints,settleAttempts:settleCount}}};
})(window,document);


/* BASAIR P96.4 / QA024: life-cycle cleanup for official/legacy word cards,
 * and ayah-focus for a NATIVE-ACKNOWLEDGED Follow retarget. No Quran/audio
 * engine, page counter, verse timing, font size or page artwork modified.
 */
(function(w,d){
 'use strict';
 var API='__BASAIR_P964_AYAH_MEANING__';
 if(w[API])return;
 var counts={meaningClosed:0,staleMeaning:0,selectionAccepted:0,selectionLocated:0,scrollAligned:0,scrollSkipped:0,selectionMiss:0,focusOnly:0};
 var bound=[],busy=false,focus=null,pending=0,lastReader=null,p968Preview=null,p968Marks=[];
 function E(id){return d.getElementById(id)}
 function isHifz(){var b=d.body;return !!(b&&/\bh25-hifz\b|\bh90-review\b|\bh100-teacher\b|\bh24-hifz\b/.test(b.className||''))}
 function reader(){var r=E('mushafReader');return !!(r&&r.classList.contains('active')&&d.body&&d.body.classList.contains('reader-active')&&!isHifz())}
 function hideNode(id,clear){
  var n=E(id);if(!n)return false;
  var shown=n.classList.contains('show')||n.classList.contains('open')||n.getAttribute('aria-hidden')==='false';
  if(shown)counts.staleMeaning++;
  n.classList.remove('show','open','expanded');
  if(n.getAttribute('aria-hidden')!=='true')n.setAttribute('aria-hidden','true');
  if(n.style&&n.style.getPropertyValue('display')!=='none')n.style.setProperty('display','none','important');
  if(clear&&n.innerHTML)n.innerHTML='';
  return shown;
 }
 function exitMeaning(){
  if(reader()||isHifz()||busy)return false;
  busy=true;
  try{
   var active=!!(E('b300WordMeaningOverlay')?.classList.contains('show')||E('stableMeaning')?.classList.contains('show'));
   var api=w.__BASAIR_B250_STABILITY__;
   if(active&&api&&typeof api.closeMeaning==='function')try{api.closeMeaning()}catch(_e){}
   var native=w.__BASAIR_WORD_MEANING_B227__;
   if(active&&native&&typeof native.close==='function')try{native.close()}catch(_e){}
   if(typeof w.__BASAIR_B249_HIDE_LEGACY_MEANING__==='function')try{w.__BASAIR_B249_HIDE_LEGACY_MEANING__()}catch(_e){}
   hideNode('b300WordMeaningOverlay',false);
   hideNode('stableMeaning',false);
   var legacy=E('wordMeaningBox');if(legacy&&!legacy.classList.contains('hidden'))legacy.classList.add('hidden');
   if(active)counts.meaningClosed++;
   return active;
  }finally{busy=false}
 }
 function restoreMeaning(){var official=E('b300WordMeaningOverlay');if(official&&official.style&&official.style.getPropertyValue('display')==='none')official.style.removeProperty('display');
  // B249 already owns legacy stableMeaning inside reader: never resurrect or re-close it here.
 }
 function sync(){
  if(reader()){restoreMeaning();return}
  if(focus){focus.classList.remove('bq964-ayah-focus');focus=null}
  p968ClearPreview();
  exitMeaning();
 }
 function observe(){
  if(!w.MutationObserver)return;
  var observer=new w.MutationObserver(function(){if(!busy)queue()});
  var roots=[d.body,E('mushafReader'),E('stableMeaning'),E('b300WordMeaningOverlay')];
  roots.forEach(function(node){if(!node||bound.includes(node))return;bound.push(node);
   observer.observe(node,{attributes:true,attributeFilter:['class','aria-hidden']})});
 }
 var scheduled=false;
 function queue(){if(scheduled)return;scheduled=true;w.requestAnimationFrame(function(){scheduled=false;sync()})}
 function clearFocus(){if(focus){focus.classList.remove('bq964-ayah-focus');focus=null}}
 function nativeState(){var c=w.__BASAIR_B345_SEQUENCE__||w.B345SequenceController;return c&&c.state||null}
 function findSelected(ayah,initial){
  var readerRoot=E('mushafReader');if(!readerRoot)return null;
  var card=initial&&initial.closest&&initial.closest('[data-b345-page],[data-r33-print-page]');
  if(card&&!card.isConnected)card=null;
  var p=String(ayah.page);
  if(!card){
   var host=E('b345NormalStack');
   card=host&&host.querySelector('[data-b345-page="'+p+'"],[data-r33-print-page="'+p+'"]');
  }
  if(!card)card=readerRoot;
  var s=Number(ayah.s),a=Number(ayah.a);
  if(!(s>=1&&s<=114&&a>=1&&a<=286))return null;
  return card.querySelector('#pv-'+s+'-'+a)||
   card.querySelector('.quranWord[data-s="'+s+'"][data-selectayah="'+a+'"][data-wordpos="1"]')||
   card.querySelector('[data-s="'+s+'"][data-selectayah="'+a+'"]')||
   (initial&&initial.isConnected?initial:null);
 }
 function scrollSelected(node){
  if(!node)return false;
  var root=E('mushafReader'),p=node.parentElement,steps=0;
  while(p&&steps++<15&&p!==d.body){
   if(p.scrollHeight>p.clientHeight+12&&p.clientHeight>50){
    var style=w.getComputedStyle?w.getComputedStyle(p):null;
    var overflow=style&&style.overflowY||'';
    if(/auto|scroll/.test(overflow)){
     var r=p.getBoundingClientRect(),v=node.getBoundingClientRect();
     var current=Number(p.scrollTop)||0;
     var top=Math.max(0,Math.min(p.scrollHeight-p.clientHeight,current+(v.top+v.height/2)-(r.top+r.height/2)));
     if(Math.abs(top-current)>10){
      if(typeof p.scrollTo==='function')p.scrollTo({top:top,behavior:'smooth'});else p.scrollTop=top;
      counts.scrollAligned++;return true;
     }
     return false;
    }
   }
   if(p===root)break;p=p.parentElement;
  }
  counts.scrollSkipped++;return false;
 }
 // P96.8: show actual printed ayahHit immediately after the original
 // R33 retarget confirms success. No audio timing inference or page movement.
 function p968ClearPreview(){
  p968Marks.forEach(function(node){if(node&&node.classList)node.classList.remove('bq968-selected-ayah')});
  p968Marks=[];p968Preview=null;
 }
 function p968ShowPreview(ayah){
  if(!reader())return false;
  var host=E('b345NormalStack'),pg=Number(ayah.page),s=Number(ayah.s),a=Number(ayah.a);
  if(!host||!(pg>=1&&pg<=604&&s>=1&&s<=114&&a>=1&&a<=286))return false;
  var card=host.querySelector('.r33PrintShell[data-r33-print-page="'+pg+'"]');
  if(!card)return false;
  var hits=Array.prototype.slice.call(card.querySelectorAll('.ayahHit[data-s="'+s+'"][data-selectayah="'+a+'"]'));
  if(!hits.length)return false;
  p968ClearPreview();
  hits.forEach(function(node){node.classList.add('bq968-selected-ayah')});
  p968Marks=hits;
  p968Preview={page:pg,s:s,a:a,at:Date.now(),
   nativeAtStart:card.querySelector('.ayahHit.b441FollowHit')};
  counts.p968PreviewShown=(counts.p968PreviewShown||0)+1;return true;
 }
 function p968Handoff(){
  var v=p968Preview;if(!v)return;
  var st=nativeState();
  if(!reader()||!st||!(st.running||st.paused)||Number(st.page)!==v.page||Date.now()-v.at>20000){
   p968ClearPreview();return;
  }
  var host=E('b345NormalStack'),card=host&&host.querySelector('.r33PrintShell[data-r33-print-page="'+v.page+'"]');
  if(!card){p968ClearPreview();return}
  var native=card.querySelector('.ayahHit.b441FollowHit');
  if(!native||native===v.nativeAtStart)return;
  var s=Number(native.getAttribute('data-s'))||0,a=Number(native.getAttribute('data-selectayah'))||0;
  if(s===v.s&&a>=v.a){p968ClearPreview();counts.p968NativeHandoff=(counts.p968NativeHandoff||0)+1}
 }
 w.setInterval(function(){if(p968Preview)p968Handoff()},220);
 function accept(ayah,origin){
  if(!reader()||!ayah||!origin)return false;
  var s=nativeState(),validPage=Number(ayah.page);
  if(!s||!(s.running||s.paused)||!(validPage>=1&&validPage<=604))return false;
  counts.selectionAccepted++;p968ShowPreview(ayah);var id=++pending,tries=0;
  function settle(){
   if(id!==pending||!reader())return;
   var st=nativeState();
   if(!st||(Number(st.page)||Number(w.currentPage)||1)!==validPage){if(tries++<5)w.setTimeout(settle,90);return}
   var node=findSelected(ayah,origin);if(!node){if(tries++<5)w.setTimeout(settle,90);else counts.selectionMiss++;return}
   clearFocus();focus=node;node.classList.add('bq964-ayah-focus');counts.selectionLocated++;
   counts.focusOnly++;counts.p968OverlayScrollPrevented=(counts.p968OverlayScrollPrevented||0)+1;
   try{var shade=w.__BASAIR_P946_SHADE_SMOOTH__;if(shade&&typeof shade.refresh==='function')shade.refresh()}catch(_e){}
   w.setTimeout(function(){if(focus===node){clearFocus()}},1700);
  }
  w.requestAnimationFrame(settle);return true;
 }
 // Existing QA012 retarget callback calls accept() only after the OWNER's method returned true.
 // This observer handles nav exits, native Back, restored app home, and late async word cards.
 w.addEventListener('pageshow',queue);
 w.addEventListener('pagehide',function(){if(!isHifz())exitMeaning()});
 d.addEventListener('visibilitychange',queue);
 w.addEventListener('click',function(ev){
  var t=ev.target&&ev.target.closest&&ev.target.closest('#mBack,#dockBack,#v180FocusExit,[data-nav],[data-bq="home"],#sidePlay');
  if(t){w.setTimeout(queue,0);}
 },true);
 w.setInterval(function(){observe();if(!reader()&&!isHifz())sync()},850);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',function(){observe();queue()},{once:true});
 else{observe();queue()}
 w[API]={version:'P96.8-QA028',accept:accept,closeIfOutside:exitMeaning,sync:sync,diagnostics:function(){return Object.assign({reader:reader(),bound:bound.length},counts)}};
})(window,document);

/* Read-only diagnostics: no personal data, audio URLs or Quran text. */
window.__BASAIR_P968_DIAGNOSTICS__={version:'P96.8-QA028',snapshot:function(){var c=window.__BASAIR_B345_SEQUENCE__||window.B345SequenceController,st=c&&c.state||{},a=window.__BASAIR_P964_AYAH_MEANING__,b=window.__BASAIR_P942_FOLLOW_FINAL__,r=window.__BASAIR_PRINT_FOLLOW_100__;return{sequence:28,printRetargets:Number(st.printRetargets)||0,normalFollow:st.scaleMode==='normal',mode:st.mode||'',page:Number(st.page)||0,selectedSurah:Number(window.selectedSurah)||0,selectedAyah:Number(window.selectedTilawaAyah)||0,overlay:a&&a.diagnostics?a.diagnostics():null,follow:b&&b.diagnostics?b.diagnostics().stats:null,print:r&&r.status?r.status().stats:null}}};

/* BASAIR P97.0 / QA030 — audio-origin, visibility-checked micro-guard.
 * QA029 regression: persistent scrollTop override suppressed every movement
 * after 140ms / 3 writes, including required page/position changes.
 * This candidate starts from the unmodified QA028 JS and protects only
 * onAudioClock's brief timeupdate phase when the current printed ayah is
 * safely visible. It fails open if DOM state or source is uncertain.
 * Natural page advancement, manual gestures, >100% zoom and audio are owned
 * by the original V690 runtime. No publication or auto-updating here.
 */
(function(w,d){
 'use strict';
 var API='__BASAIR_P970_NATURAL_FOLLOW__';
 if(w[API])return;
 // Release the QA029 bridge if its script is still loaded in this WebView.
 try{var old=w.__BASAIR_P969_STILL_AYAH_PAGE__;if(old&&typeof old.disable==='function')old.disable()}catch(_){}
 var el=null, own=null, access=null, audio=null, timer=0, serial=0, bindTimer=0;
 var pulsePage=0, pulseUntil=0, manualUntil=0, pulseSource='',tapTarget=null;
 var stats={audioTicks:0,ayahTaps:0,armed:0,suppressed:0,passed:0,failOpen:0,restored:0,errors:0};
 function E(id){return d.getElementById(id)}
 function state(){var c=w.__BASAIR_B345_SEQUENCE__||w.B345SequenceController;return c&&c.state||null}
 function eligible(r,s){return !!(r&&s&&s.running&&s.mode==='audio'&&!s.surfaceBusy&&s.scaleMode==='normal'&&
  Number(s.page)>=1&&Number(s.page)<=604&&r.classList&&r.classList.contains('active')&&
  d.body&&d.body.classList&&d.body.classList.contains('reader-active')&&
  !d.body.classList.contains('h25-hifz')&&!d.body.classList.contains('h90-review')&&!d.body.classList.contains('h100-teacher'))}
 function nearEnd(a){
  var duration=Number(a&&a.duration),pos=Number(a&&a.currentTime);
  return duration>0&&isFinite(duration)&&isFinite(pos)&&duration-pos<1.5
 }
 function visible(r,s){
  var host=E('b345NormalStack');
  if(!host||typeof host.querySelector!=='function'||!r.getBoundingClientRect)return false;
  var pg=Number(s.page),shell=host.querySelector('.r33PrintShell[data-r33-print-page="'+pg+'"]');
  if(!shell)return false;
  var hit=shell.querySelector('.ayahHit.b441FollowHit');
  if(!hit||!hit.getBoundingClientRect)return false;
  return visibleTarget(r,hit);
 }
 function visibleTarget(r,hit){
  if(!r||!hit||!r.getBoundingClientRect||!hit.getBoundingClientRect)return false;
  var hr=hit.getBoundingClientRect(),rr=r.getBoundingClientRect(),pad=6;
  if(!isFinite(hr.top)||!isFinite(hr.bottom)||!isFinite(rr.top)||!isFinite(rr.bottom))return false;
  if(hr.bottom-hr.top<1||rr.bottom-rr.top<80||hr.top<rr.top+pad||hr.bottom>rr.bottom-pad)return false;
  var dock=E('mushafDock');
  if(dock&&dock.getBoundingClientRect){
   var dr=dock.getBoundingClientRect();
   if(dr.height>0&&hr.bottom>dr.top-4&&hr.top<dr.bottom)return false;
  }
  return true;
 }
 function baseAccess(r){
  var p=Object.getPrototypeOf(r);
  while(p){var x=Object.getOwnPropertyDescriptor(p,'scrollTop');
   if(x&&typeof x.get==='function'&&typeof x.set==='function')return x;
   p=Object.getPrototypeOf(p);
  }
  return null;
 }
 function restore(){
  if(!el)return;
  try{if(own)Object.defineProperty(el,'scrollTop',own);else delete el.scrollTop;stats.restored++}
  catch(_){stats.errors++}
  el=null;own=null;access=null;pulseUntil=0;
 }
 function arm(r,s){
  if(el&&el!==r)restore();
  if(el===r)return true;
  var prev=Object.getOwnPropertyDescriptor(r,'scrollTop');
  if(prev&&!prev.configurable){stats.failOpen++;return false}
  var x=prev&&prev.get&&prev.set?prev:baseAccess(r);
  if(!x){stats.failOpen++;return false}
  try{
   Object.defineProperty(r,'scrollTop',{configurable:true,enumerable:false,
    get:function(){return x.get.call(r)},
    set:function(next){
     var now=Date.now(),st=state();
     // No blanket scroll lock: only an audio tick, same rendered page,
     // unzoomed Follow, current ayah fully visible, and no touch gesture.
     if(now<=pulseUntil&&now>manualUntil&&Number(st&&st.page)===pulsePage&&
        eligible(r,st)&&(pulseSource==='tap'?visibleTarget(r,tapTarget):(!nearEnd(audio)&&visible(r,st)))){
      stats.suppressed++;return;
     }
     stats.passed++;x.set.call(r,next);
    }
   });
   el=r;own=prev;access=x;stats.armed++;return true;
  }catch(_){stats.errors++;return false}
 }
 function tick(){
  stats.audioTicks++;
  var s=state(),r=E('mushafReader');
  if(Date.now()<=manualUntil||!eligible(r,s)||nearEnd(audio)||!visible(r,s)){
   restore();stats.failOpen++;return;
  }
  pulseSource='audio';tapTarget=null;pulsePage=Number(s.page);pulseUntil=Date.now()+56;
  if(!arm(r,s)){pulseUntil=0;return}
  var token=++serial;
  w.setTimeout(function(){if(token===serial)restore()},64);
 }
 function tap(ev){
  if(!ev||Date.now()<=manualUntil||!ev.target||!ev.target.closest)return;
  var target=ev.target.closest('.ayahHit[data-selectayah][data-s]');
  if(!target||!target.closest)return;
  var card=target.closest('.r33PrintShell[data-r33-print-page]'),s=state(),r=E('mushafReader');
  if(!card||!eligible(r,s)||Number(card.getAttribute('data-r33-print-page'))!==Number(s.page)||
     !visibleTarget(r,target))return;
  pulseSource='tap';tapTarget=target;pulsePage=Number(s.page);pulseUntil=Date.now()+56;
  if(!arm(r,s)){pulseUntil=0;return}
  stats.ayahTaps++;
  var token=++serial;w.setTimeout(function(){if(token===serial)restore()},64);
 }
 function gesture(){manualUntil=Date.now()+900;restore()}
 function bind(){
  var a=E('tilawaAudio');if(a===audio)return;
  if(audio){audio.removeEventListener('timeupdate',tick,true);
   ['ended','pause','seeking'].forEach(function(k){audio.removeEventListener(k,restore,true)})}
  restore();audio=a;
  if(a){a.addEventListener('timeupdate',tick,true);
   ['ended','pause','seeking'].forEach(function(k){a.addEventListener(k,restore,true)})}
 }
 function disable(){
  if(bindTimer){w.clearInterval(bindTimer);bindTimer=0}
  if(audio){audio.removeEventListener('timeupdate',tick,true);
   ['ended','pause','seeking'].forEach(function(k){audio.removeEventListener(k,restore,true)})}
  ['pointerup','touchend','click'].forEach(function(k){d.removeEventListener(k,tap,true)});
  d.removeEventListener('touchmove',gesture,true);
  d.removeEventListener('wheel',gesture,true);
  w.removeEventListener('pagehide',restore);
  audio=null;restore();delete w[API];
 }
 ['pointerup','touchend','click'].forEach(function(k){d.addEventListener(k,tap,true)});
 d.addEventListener('touchmove',gesture,{capture:true,passive:true});
 d.addEventListener('wheel',gesture,{capture:true,passive:true});
 w.addEventListener('pagehide',restore);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
 bindTimer=w.setInterval(bind,1500);
 w[API]={version:'P97.0-QA030',disable:disable,status:function(){
  var s=state();return {version:'P97.0-QA030',temporaryBridge:!!el,page:Number(s&&s.page)||0,
   scaleMode:String(s&&s.scaleMode||''),stats:Object.assign({},stats)};
 }};
})(window,document);

/* BASAIR P97.1 / QA031 — paced AUDIO viewport reposition, isolated to >100%.
 * Honor the existing sequenceSpeedV10 / v170Speed page-rate preference.
 * QA030 remains the unmodified 100%-print guard; never change audio speed,
 * Quran verse progression, B345 calculations, CSS, pages, or saved settings.
 * Fail open on ambiguous DOM/source/state. In particular, do NOT lock a page.
 */
(function(w,d){
 'use strict';
 var API='__BASAIR_P971_AUDIO_PACE__';if(w[API])return;
 var reader=null, priorOwn=null, nativeScroll=null, audio=null, binder=0, idleTimer=0, token=0,raf=0;
 var pulseUntil=0,pulsePage=0,pulseSerial=0,manualUntil=0,target=null,motion=null;
 var stats={ticks:0,armed:0,coalesced:0,visibleHeld:0,animated:0,completed:0,
   passed:0,disabledBySettings:0,manualCancels:0,failOpen:0,restores:0,errors:0};
 function E(id){return d.getElementById(id)}
 function now(){return Date.now()}
 function state(){var c=w.__BASAIR_B345_SEQUENCE__||w.B345SequenceController;return c&&c.state||null}
 function rate(){
  var x=E('sequenceSpeedV10'),v=Number(x&&x.value);
  if(!x||!isFinite(v)||v<=0){
   try{v=Number(w.localStorage&&w.localStorage.getItem('v170Speed'))}catch(_){v=NaN}
  }
  var choices=[.25,.33,.5,.75,1];
  for(var i=0;i<choices.length;i++)if(Math.abs(v-choices[i])<.011)return choices[i];
  return null;
 }
 function active(r,s){
  return !!(r&&s&&s.running&&s.mode==='audio'&&!s.surfaceBusy&&s.scaleMode!=='normal'&&
    s.scaleMode&&Number(s.page)>=1&&Number(s.page)<=604&&
    r.classList&&r.classList.contains('active')&&
    d.body&&d.body.classList&&d.body.classList.contains('reader-active')&&
    !d.body.classList.contains('h25-hifz')&&!d.body.classList.contains('h90-review')&&
    !d.body.classList.contains('h100-teacher')&&
    r.clientHeight>60&&r.scrollHeight>r.clientHeight+12&&
    audio&&!audio.paused&&!audio.ended);
 }
 function descriptor(r){
  var p=Object.getPrototypeOf(r);
  while(p){
   var v=Object.getOwnPropertyDescriptor(p,'scrollTop');
   if(v&&typeof v.get==='function'&&typeof v.set==='function')return v;
   p=Object.getPrototypeOf(p);
  }
  return null;
 }
 function stopMotion(){if(raf){w.cancelAnimationFrame(raf);raf=0}motion=null;target=null;token++}
 function restore(stop){
  if(stop)stopMotion();
  if(reader){
   try{if(priorOwn)Object.defineProperty(reader,'scrollTop',priorOwn);
    else delete reader.scrollTop;stats.restores++}
   catch(_){stats.errors++}
  }
  reader=null;priorOwn=null;nativeScroll=null;pulseUntil=0;
 }
 function visible(r,s){
  var stack=E('b345NormalStack');if(!stack||!stack.querySelector)return false;
  var shell=stack.querySelector('.r33PrintShell[data-r33-print-page="'+Number(s.page)+'"]');
  var hit=shell&&shell.querySelector('.ayahHit.b441FollowHit');
  if(!hit||!hit.getBoundingClientRect||!r.getBoundingClientRect)return false;
  var a=hit.getBoundingClientRect(),b=r.getBoundingClientRect();
  return a.bottom>a.top&&b.bottom>b.top+80&&a.top>=b.top+10&&a.bottom<=b.bottom-10;
 }
 function duration(msRate,delta){
  // Existing preference is pages/minute, NOT the audio playback rate.
  // Map its order to visual easing only; avoid falling behind a distant ayah.
  var desired=Math.max(320,Math.min(1150,360/msRate));
  if(delta>300)desired=Math.min(desired,750);
  return desired;
 }
 function frame(ts,sequence){
  if(sequence!==token||!motion)return;
  var s=state(),r=E('mushafReader');
  if(now()<=manualUntil||!active(r,s)||r!==motion.el||
     Number(s.page)!==motion.page||rate()===null){restore(true);return}
  var t=Math.max(0,Math.min(1,(ts-motion.started)/motion.ms)),e=t*(2-t);
  var max=r.scrollHeight-r.clientHeight;
  var next=Math.max(0,Math.min(max,motion.from+(motion.to-motion.from)*e));
  try{motion.access.set.call(r,next);stats.animated++}catch(_){stats.errors++;restore(true);return}
  if(t>=1){stats.completed++;motion=null;target=null;raf=0;return}
  raf=w.requestAnimationFrame(function(t2){frame(t2,sequence)});
 }
 function pace(r,s,access,wanted,sp){
  var value=Number(wanted),current=Number(access.get.call(r));
  if(!isFinite(value)||!isFinite(current)){stats.failOpen++;access.set.call(r,wanted);return}
  var max=r.scrollHeight-r.clientHeight,dest=Math.max(0,Math.min(max,value));
  if(Math.abs(dest-current)<=3){stats.passed++;access.set.call(r,dest);return}
  // Never recenter a readable ayah unnecessarily during repeated audio ticks.
  if(visible(r,s)){stats.visibleHeld++;return}
  if(motion&&motion.el===r&&motion.page===Number(s.page)&&
     Math.abs(motion.to-dest)<=4){stats.coalesced++;return}
  if(raf){w.cancelAnimationFrame(raf);raf=0}
  target=dest;
  var ms=duration(sp,Math.abs(dest-current)),version=++token;
  motion={el:r,page:Number(s.page),access:access,from:current,to:dest,
    started:w.performance&&typeof w.performance.now==='function'?w.performance.now():now(),ms:ms};
  stats.coalesced++;
  raf=w.requestAnimationFrame(function(t){frame(t,version)});
 }
 function arm(r,s,sp){
  if(reader&&reader!==r)restore(true);
  if(reader===r)return true;
  var own=Object.getOwnPropertyDescriptor(r,'scrollTop');
  // Do not layer over QA030's temporary descriptor or any other owner.
  if(own){stats.failOpen++;return false}
  var access=descriptor(r);if(!access){stats.failOpen++;return false}
  try{
   Object.defineProperty(r,'scrollTop',{configurable:true,enumerable:false,
    get:function(){return access.get.call(r)},
    set:function(v){
     var st=state(),n=now();
     if(n>pulseUntil||n<=manualUntil||Number(st&&st.page)!==pulsePage||
        !active(r,st)||rate()===null){stats.passed++;access.set.call(r,v);return}
     pace(r,st,access,v,rate());
    }});
   reader=r;priorOwn=own;nativeScroll=access;stats.armed++;return true;
  }catch(_){stats.errors++;return false}
 }
 function tick(){
  stats.ticks++;
  var r=E('mushafReader'),s=state(),sp=rate();
  if(!sp||now()<=manualUntil||!active(r,s)){if(!sp)stats.disabledBySettings++;restore(true);return}
  pulsePage=Number(s.page);pulseUntil=now()+65;
  if(!arm(r,s,sp))return;
  var serial=++pulseSerial;
  // Setter interception is short; the in-flight animation can finish normally.
  if(idleTimer)w.clearTimeout(idleTimer);
  idleTimer=w.setTimeout(function(){if(serial===pulseSerial)restore(false)},72);
 }
 function gesture(){manualUntil=now()+1000;stats.manualCancels++;restore(true)}
 function clear(){restore(true)}
 function bind(){
  var a=E('tilawaAudio');if(a===audio)return;
  if(audio){audio.removeEventListener('timeupdate',tick,true);
   ['pause','ended','seeking','emptied'].forEach(function(ev){audio.removeEventListener(ev,clear,true)})}
  restore(true);audio=a;
  if(audio){audio.addEventListener('timeupdate',tick,true);
   ['pause','ended','seeking','emptied'].forEach(function(ev){audio.addEventListener(ev,clear,true)})}
 }
 function disable(){
  if(binder)w.clearInterval(binder);
  if(idleTimer)w.clearTimeout(idleTimer);
  if(audio){audio.removeEventListener('timeupdate',tick,true);
   ['pause','ended','seeking','emptied'].forEach(function(ev){audio.removeEventListener(ev,clear,true)})}
  d.removeEventListener('touchmove',gesture,true);d.removeEventListener('wheel',gesture,true);
  w.removeEventListener('pagehide',clear);
  restore(true);audio=null;delete w[API];
 }
 d.addEventListener('touchmove',gesture,{capture:true,passive:true});
 d.addEventListener('wheel',gesture,{capture:true,passive:true});
 w.addEventListener('pagehide',clear);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
 binder=w.setInterval(bind,1500);
 w[API]={version:'P97.1-QA031-CANDIDATE',disable:disable,status:function(){
  var s=state();return {version:'P97.1-QA031-CANDIDATE',
   ratePagesPerMinute:rate(),page:Number(s&&s.page)||0,activeAnimation:!!motion,
   stats:Object.assign({},stats)};}};
})(window,document);

/* BASAIR P97.2 / QA032 — render-acknowledged ayah-shade continuity.
 * Hold only the most recently VERIFIED printed ayah briefly while native
 * painting is exchanging nodes, or show an accepted retarget before its
 * first paint. Never estimate Qur'an verse from audio time, modify audio,
 * move the page, or alter the saved appearance setting.
 */
(function(w,d){
 'use strict';
 var API='__BASAIR_P972_AYAH_SHADE__';
 if(w[API])return;
 var prevApi=null,prevAccept=null,wrapper=null;
 var stack=null,observer=null,bodyObserver=null,raf=0,ticker=0,audio=null;
 var page=0,pending=null,lastNative=null,marked=[],lastSource='',disabled=false;
 var stats={accepted:0,acceptedBeforeRender:0,nativeHandoffs:0,
  marked:0,restored:0,missingShell:0,missingNative:0,changes:0,
  forcedOff:0,expired:0,sourceChanges:0,failOpen:0,errors:0};
 function E(id){return d.getElementById(id)}
 function state(){var c=w.__BASAIR_B345_SEQUENCE__||w.B345SequenceController;return c&&c.state||null}
 function userEnabled(){
  try{var o=JSON.parse(w.localStorage.getItem('basair:p942:follow-guide:v1')||'{}');return o&&o.enabled!==false}
  catch(_){return true}
 }
 function readerOn(s){
  var r=E('mushafReader'),b=d.body;
  return !!(s&&r&&r.classList&&r.classList.contains('active')&&
    b&&b.classList&&b.classList.contains('reader-active')&&
    !b.classList.contains('h25-hifz')&&!b.classList.contains('h90-review')&&
    !b.classList.contains('h100-teacher')&&
    s.scaleMode==='normal'&&(s.running||s.paused)&&
    Number(s.page)>=1&&Number(s.page)<=604&&userEnabled()&&
    d.documentElement.getAttribute('data-bq916-shade')!=='off'&&
    d.documentElement.getAttribute('data-bq945-shade')!=='off');
 }
 function key(v){return v&&v.page+'|'+v.s+'|'+v.a}
 function identity(n,pg){
  if(!n||!n.getAttribute)return null;
  var s=Number(n.getAttribute('data-s')),a=Number(n.getAttribute('data-selectayah'));
  if(!(s>=1&&s<=114&&a>=1&&a<=286))return null;
  return {page:pg,s:s,a:a};
 }
 function currentShell(st){
  var host=E('b345NormalStack');if(!host||!host.querySelector)return null;
  return host.querySelector('.r33PrintShell[data-r33-print-page="'+Number(st.page)+'"]');
 }
 function nodes(shell,v){
  if(!shell||!v||!shell.querySelectorAll)return [];
  return Array.prototype.slice.call(shell.querySelectorAll(
   '.ayahHit[data-s="'+v.s+'"][data-selectayah="'+v.a+'"]'));
 }
 function firstNative(shell,pg){
  if(!shell||!shell.querySelectorAll)return null;
  var els=shell.querySelectorAll('.b441FollowHit,.b441FollowAyah,.b441FollowWord');
  for(var i=0;i<els.length;i++){
   var h=els[i].closest&&els[i].closest('.ayahHit[data-s][data-selectayah]');
   var v=identity(h,pg);
   if(v)return v;
  }
  return null;
 }
 function clear(){
  for(var i=0;i<marked.length;i++){
   var n=marked[i];if(n&&n.classList&&n.classList.contains('bq972-shade-hold')){
    n.classList.remove('bq972-shade-hold');stats.restored++;
   }
  }
  marked=[];
 }
 function apply(shell,v){
  var a=nodes(shell,v);
  if(!a.length){clear();return false}
  // Re-rendered page/ayah nodes require reattachment; unchanged nodes must
  // not be repeatedly rewritten (avoids observer/class-change feedback).
  if(a.length===marked.length&&a.every(function(n,i){return n===marked[i]&&n.classList.contains('bq972-shade-hold')}))return true;
  clear();
  for(var i=0;i<a.length;i++){if(a[i]&&a[i].classList){a[i].classList.add('bq972-shade-hold');marked.push(a[i])}}
  stats.marked++;return marked.length>0;
 }
 function schedule(){if(disabled||raf)return;raf=w.requestAnimationFrame(function(){raf=0;sync()})}
 function updatePage(pg){
  if(page===pg)return;
  page=pg;
  // Keep a just-accepted retarget if its target page has now rendered.
  if(!pending||pending.page!==pg||Date.now()-pending.at>3200)pending=null;
  lastNative=null;clear();stats.changes++;
 }
 function sync(){
  if(disabled)return;
  var st=state(),p=Number(st&&st.page)||0;
  if(!readerOn(st)){clear();pending=null;lastNative=null;return}
  updatePage(p);
  var shell=currentShell(st);
  if(!shell||!shell.isConnected){clear();stats.missingShell++;return}
  var t=Date.now(),src=String(audio&&(audio.currentSrc||audio.src)||'');
  if(src!==lastSource){
   lastSource=src;lastNative=null;
   if(pending&&t-pending.at>1200)pending=null;
   stats.sourceChanges++;
  }
  var native=firstNative(shell,p);
  if(native){
   // Native paint is authoritative. Do not introduce a competing
   // artificial shadow on top of it.
   lastNative=Object.assign({at:t},native);
   if(pending&&key(pending)===key(native)){pending=null;stats.nativeHandoffs++}
   // A newly advanced native ayah invalidates any stale retarget request.
   else if(pending&&t-pending.at>900&&key(native)!==key(pending)){pending=null}
   if(pending&&key(pending)!==key(native)&&t-pending.at<=1400){
    // Preview is needed only before the newly selected verse is native.
    if(apply(shell,pending)){stats.acceptedBeforeRender++;return}
   }
   clear();return;
  }
  stats.missingNative++;
  if(pending&&t-pending.at<=3200&&pending.page===p){
   if(apply(shell,pending))return;
  }
  if(pending&&t-pending.at>3200){pending=null;stats.expired++}
  // Preserve a recently VERIFIED native verse through short DOM repaint
  // gaps. Stop after 2.4 s rather than falsely claim an unsynchronized
  // verse is still being recited.
  if(lastNative&&t-lastNative.at<=2400&&lastNative.page===p){
   if(apply(shell,lastNative))return;
  }
  clear();
 }
 function accept(v,origin){
  var ok=prevAccept.apply(this,arguments);
  if(ok&&v&&Number(v.page)>=1&&Number(v.page)<=604&&
   Number(v.s)>=1&&Number(v.s)<=114&&Number(v.a)>=1&&Number(v.a)<=286){
   var st=state();
   if(readerOn(st)){
    pending={page:Number(v.page),s:Number(v.s),a:Number(v.a),at:Date.now()};
    stats.accepted++;schedule();
   }
  }
  return ok;
 }
 function bindApi(){
  var api=w.__BASAIR_P964_AYAH_MEANING__;
  if(!api||typeof api.accept!=='function')return;
  if(api===prevApi&&api.accept===wrapper)return;
  if(prevApi&&prevApi.accept===wrapper)prevApi.accept=prevAccept;
  prevApi=api;prevAccept=api.accept;
  if(prevAccept.__bq972)return;
  wrapper=accept;wrapper.__bq972=true;api.accept=wrapper;
 }
 function bindAudio(){
  var a=E('tilawaAudio');if(a===audio)return;
  if(audio){
   ['timeupdate','playing','pause','ended','seeked','loadedmetadata'].forEach(function(x){audio.removeEventListener(x,schedule)});
  }
  audio=a;lastSource='';lastNative=null;
  if(audio){
   ['timeupdate','playing','pause','ended','seeked','loadedmetadata'].forEach(function(x){audio.addEventListener(x,schedule,{passive:true})});
  }
  schedule();
 }
 function observe(){
  var root=E('b345NormalStack');
  if(root===stack)return;
  if(observer)observer.disconnect();
  stack=root;
  if(root&&w.MutationObserver){
   observer=new w.MutationObserver(function(records){
    // Class/childList notifications are coalesced into one rAF, never
    // repaint via a full-page synchronous mutation callback.
    if(records&&records.length)schedule();
   });
   observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  schedule();
 }
 function disable(){
  disabled=true;
  if(ticker)w.clearInterval(ticker);
  if(raf&&w.cancelAnimationFrame)w.cancelAnimationFrame(raf);
  if(observer)observer.disconnect();
  if(bodyObserver)bodyObserver.disconnect();
  if(audio){
   ['timeupdate','playing','pause','ended','seeked','loadedmetadata'].forEach(function(x){audio.removeEventListener(x,schedule)});
  }
  if(prevApi&&prevApi.accept===wrapper)prevApi.accept=prevAccept;
  w.removeEventListener('pageshow',schedule);
  w.removeEventListener('pagehide',clear);
  d.removeEventListener('visibilitychange',schedule);
  d.removeEventListener('change',schedule,true);
  clear();pending=null;lastNative=null;delete w[API];
 }
 w.addEventListener('pageshow',schedule);
 w.addEventListener('pagehide',clear);
 d.addEventListener('visibilitychange',schedule);
 d.addEventListener('change',schedule,true);
 if(w.MutationObserver&&d.documentElement){
  bodyObserver=new w.MutationObserver(schedule);
  bodyObserver.observe(d.documentElement,{attributes:true,attributeFilter:['data-bq916-shade','data-bq945-shade']});
 }
 function init(){bindApi();bindAudio();observe();schedule()}
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 ticker=w.setInterval(function(){if(disabled)return;bindApi();bindAudio();observe();schedule()},500);
 w[API]={version:'P97.2-QA032-CANDIDATE',disable:disable,refresh:schedule,status:function(){
  return {version:'P97.2-QA032-CANDIDATE',page:page,
   fallbackNodes:marked.length,pending:pending&&{page:pending.page,s:pending.s,a:pending.a},
   lastNative:lastNative&&{page:lastNative.page,s:lastNative.s,a:lastNative.a},
   stats:Object.assign({},stats)};
 }};
})(window,document);


/* BASAIR P98 — Tilawa landing-only cleanup (QA candidate; NOT published).
 * V690/P92.3 + signed QA032. UI adapter only: no page rendering, sound,
 * reciter catalog, local data, Android bridge, update receiver or back hooks.
 */
(function (w, d) {
  'use strict';
  if (w.__BASAIR_P98_TILAWA_HOME__) return;
  var buttonId = 'bqP98TilawaDownloads';
  var observed = false, planned = false, sheetObserved = false;
  var downloadOpenCount = 0, errors = [];
  function byId(id) { return d.getElementById(id); }
  function inTilawa() {
    var nav = w.__BASAIR_SECTION_HEADER_P26__;
    if (nav && typeof nav.section === 'function') {
      try { return nav.section() === 'tilawaIndex'; } catch (_) { return false; }
    }
    var view = byId('tilawaIndex');
    var body = d.body;
    return !!(view && view.classList.contains('active') && body &&
      !/\b(reader-active|h25-hifz|h100-teacher|h90-review)\b/.test(body.className || ''));
  }
  function record(code) {
    errors.push(code);
    if (errors.length > 6) errors.shift();
  }
  function notify(msg) {
    if (typeof w.toast === 'function') { try { w.toast(msg); } catch (_) {} }
  }
  function clearTilawaDownloadContext() {
    var sheet = byId('v211DownloadSheet');
    if (!sheet || sheet.classList.contains('open')) return;
    delete sheet.dataset.bqP98Context;
    var text = sheet.querySelector('.v211HeadText b');
    if (text && text.dataset.bqP98OriginalTitle !== undefined) {
      text.textContent = text.dataset.bqP98OriginalTitle;
      delete text.dataset.bqP98OriginalTitle;
    }
    var panel = sheet.querySelector('.v211Panel');
    if (panel && panel.dataset.bqP98OriginalLabel !== undefined) {
      panel.setAttribute('aria-label', panel.dataset.bqP98OriginalLabel);
      delete panel.dataset.bqP98OriginalLabel;
    }
  }
  function observeSheet(sheet) {
    if (sheetObserved || !w.MutationObserver) return;
    var observer = new MutationObserver(clearTilawaDownloadContext);
    observer.observe(sheet, {attributes: true, attributeFilter: ['class']});
    sheetObserved = true;
  }
  function openTilawaDownloads() {
    if (!inTilawa()) return false;
    var api = w.__BASAIR_DOWNLOADS_V211__;
    if (!api || typeof api.open !== 'function') {
      record('original-download-manager-unavailable');
      notify('تنزيلات التلاوة غير جاهزة، جرّب أدوات صفحة المصحف');
      return false;
    }
    try {
      // Exact same original API used by Mushaf dock and page tools.
      var ok = api.open();
      var sheet = byId('v211DownloadSheet');
      if (ok === false || !sheet || !sheet.classList.contains('open')) {
        record('original-download-manager-not-open');
        notify('تعذر فتح تنزيلات التلاوة الآن');
        return false;
      }
      sheet.dataset.bqP98Context = 'tilawa';
      var text = sheet.querySelector('.v211HeadText b');
      if (text) {
        if (text.dataset.bqP98OriginalTitle === undefined)
          text.dataset.bqP98OriginalTitle = text.textContent;
        text.textContent = 'تنزيلات التلاوة';
      }
      var panel = sheet.querySelector('.v211Panel');
      if (panel) {
        if (panel.dataset.bqP98OriginalLabel === undefined)
          panel.dataset.bqP98OriginalLabel = panel.getAttribute('aria-label') || '';
        panel.setAttribute('aria-label', 'تنزيلات التلاوة');
      }
      observeSheet(sheet);
      downloadOpenCount++;
      return true;
    } catch (_) {
      record('original-download-manager-error');
      notify('تعذر فتح تنزيلات التلاوة الآن');
      return false;
    }
  }
  function ensureButton() {
    var original = byId('bqP26More');
    if (!original || !original.parentNode) return false;
    var button = byId(buttonId);
    if (button) return true;
    button = d.createElement('button');
    button.id = buttonId;
    button.type = 'button';
    button.className = 'bq-p26-action bq-p98-download-button';
    button.textContent = '⇩';
    button.title = 'تنزيلات التلاوة';
    button.setAttribute('aria-label', 'تنزيلات التلاوة');
    button.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (inTilawa()) openTilawaDownloads();
    });
    original.insertAdjacentElement('afterend', button);
    return true;
  }
  function sync() {
    planned = false;
    if (!d.body) return false;
    var ready = ensureButton();
    var enabled = ready && inTilawa();
    d.body.classList.toggle('bq-p98-tilawa-head', enabled);
    // Preserve P26's original button and menu for every other section.
    if (enabled) {
      var menu = byId('bqP26Menu'), more = byId('bqP26More');
      if (menu) menu.hidden = true;
      if (more) more.setAttribute('aria-expanded', 'false');
    }
    return enabled;
  }
  function schedule() {
    if (planned) return;
    planned = true;
    Promise.resolve().then(sync);
  }
  function boot() {
    sync();
    if (observed || !w.MutationObserver) return;
    observed = true;
    var main = d.querySelector('body > .app > main');
    // Observe view roots ONLY; never subscribe to Mushaf descendants / scroll.
    if (main) {
      var views = main.querySelectorAll(':scope > .view');
      for (var i = 0; i < views.length; i++) {
        new MutationObserver(schedule).observe(views[i], {
          attributes: true, attributeFilter: ['class']
        });
      }
    }
    new MutationObserver(schedule).observe(d.body, {
      attributes: true, attributeFilter: ['class']
    });
    w.addEventListener('pageshow', schedule, false);
    w.addEventListener('popstate', schedule, false);
  }
  if (d.readyState === 'loading')
    d.addEventListener('DOMContentLoaded', boot, {once: true});
  else boot();
  w.__BASAIR_P98_TILAWA_HOME__ = {
    version: 'P98-TILAWA-HOME-CANDIDATE',
    sync: sync,
    openDownloads: openTilawaDownloads,
    diagnostics: function () {
      return {
        tilawa: inTilawa(),
        button: !!byId(buttonId),
        originalMenu: !!byId('bqP26Menu'),
        originalDownloads: !!(w.__BASAIR_DOWNLOADS_V211__ &&
          typeof w.__BASAIR_DOWNLOADS_V211__.open === 'function'),
        selectedRecitations: !!byId('r108EntryButton'),
        selectedRecitationsAPI: !!(w.__BASAIR_R109_SELECTED__ &&
          typeof w.__BASAIR_R109_SELECTED__.open === 'function'),
        downloadOpenCount: downloadOpenCount,
        errors: errors.slice()
      };
    }
  };
})(window, document);


/* BASAIR P99 / QA034 — Tilawa tool stack and R109 selected recitations back.
 * Overlay ONLY. Keep native P79, protected Mushaf, reader and audio engines intact.
 * Never push/replace browser history; do not read or change local user data.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_P99_SEQUENTIAL_BACK__)return;
 var version='P99-QA034-CANDIDATE', origNative=w.bqNativeBack;
 var lastAt=0,lastResult='',counts=Object.create(null),reciterPatched=false;
 function E(id){return d.getElementById(id)}
 function activeView(){var x=d.querySelector('body > .app > main > .view.active');return x&&x.id||''}
 function allowed(){var v=activeView();return (v==='tilawaIndex'||v==='mushafReader')&&
   !(d.body&&/\bh25-hifz\b|\bh90-review\b|\bh100-teacher\b|\bh24-hifz\b/.test(d.body.className||''))}
 function shown(id,flag){var e=E(id);return !!(e&&(!flag?(!e.hidden):e.classList.contains(flag))&&e.getAttribute('aria-hidden')!=='true')}
 function mark(s){lastResult=s;counts[s]=(counts[s]||0)+1;lastAt=Date.now();return true}
 function selected(){var a=w.__BASAIR_R109_SELECTED__;return a&&typeof a.active==='function'&&a.active()?a:null}
 function patchSelected(){var a=w.__BASAIR_R109_SELECTED__;if(!a||typeof a.back!=='function')return false;
  if(a.back.__bqP99){reciterPatched=true;return true}
  var base=a.back;
  function back(){if(!a.active||!a.active())return false;
   var S=a._test&&a._test.state;
   if(S&&S.screen==='source'){
    // Source viewer already called original clearPlayer(). Its iframe must stop
    // without closing the sheet or re-playing audio on return to the list.
    var media=E('r108MediaArea');if(media){media.innerHTML='';media.hidden=true}
    S.screen='records';var b=E('r108Back');if(b)b.hidden=false;
    var p=E('r108Panel');if(p){var scroll=Number(S.listScroll)||0;w.requestAnimationFrame(function(){if(a.active())p.scrollTop=scroll})}
    mark('selected-source-to-records');return true;
   }
   var before=S&&S.screen, r=base.apply(this,arguments);
   if(before==='player'&&S&&S.screen==='records'){
    var panel=E('r108Panel');if(panel){var top=Math.max(0,Number(S.listScroll)||0);w.requestAnimationFrame(function(){if(a.active())panel.scrollTop=top})}
   }
   if(before&&before!==S.screen)mark('selected-'+before+'-to-'+S.screen);
   else if(before==='readers')mark('selected-readers-to-tilawa');
   return r;
  }
  back.__bqP99=true;back.__bqP99Base=base;a.back=back;
  if(w.__BASAIR_R108_SELECTED__===a)w.__BASAIR_R108_SELECTED__.back=back;
  reciterPatched=true;return true;
 }
 function click(selector){var b=d.querySelector(selector);if(!b||typeof b.click!=='function')return false;try{b.click();return true}catch(_){return false}}
 function call(obj,fn){try{if(obj&&typeof obj[fn]==='function')return obj[fn]()!==false}catch(_){ }return false}
 function run(){
  if(!allowed())return false;
  patchSelected();
  var s=selected();if(s){s.back();return mark('selected');}
  // A body-level tools modal is above a page-tools rail. Its close control
  // must be tried before any section/reader navigation.
  if(shown('v211DownloadSheet','open')&&call(w.__BASAIR_DOWNLOADS_V211__,'close'))return mark('downloads');
  if(shown('b106PageLightSheet','b106Open')&&call(w.__BASAIR_R106_PAGE_LIGHT__,'close'))return mark('page-light');
  if(shown('b271TopicEditorSheet','open')&&click('#b271TopicEditorSheet [data-b271-topic-editor-close]'))return mark('topic-editor');
  if(shown('b265ExportSheet','open')&&click('#b265ExportSheet [data-b265-export-close]'))return mark('export');
  if(E('b265Panel')&&!E('b265Panel').classList.contains('hidden')&&click('#b265Panel [data-b265-close]'))return mark('tilawa-tool-panel');
  var r=w.__BASAIR_R92_TILAWA_STABILITY__;
  if(r&&call(r,'closeTransient'))return mark('page-tool-subpanel');
  if(shown('b300WordMeaningOverlay','show')&&call(w.__BASAIR_WORD_MEANING_B227__,'close'))return mark('word-meaning');
  if(shown('sequenceSheetV10','open')&&call(w,'closeSequenceV10'))return mark('sequence-options');
  if(shown('ayahSideRail','open')&&r&&typeof r.back==='function'){
   try{r.back();return mark('page-tools-rail')}catch(_){}
  }
  if(shown('ayahSideRail','open')&&call(w,'closeSideRailV098'))return mark('page-tools-rail-original');
  // Use the original owners for legacy tools; never mutate their class or data.
  var layer=[
   ['quranSearchSheet','open','closeQuranSearch'],['textSelectSheet','open','closeTextSelect'],
   ['navSheet','open','closeNavSheet'],['fontSheet','open','closeFontSheet'],
   ['readerOverlay','open','closeReaderOverlay']
  ];
  for(var i=0;i<layer.length;i++){
   if(shown(layer[i][0],layer[i][1])&&call(w,layer[i][2]))return mark('original-'+layer[i][0]);
  }
  if(shown('readerMoreSheet','open')&&click('#readerMoreClose'))return mark('reader-more');
  return false;
 }
 function stop(e){if(!e)return;try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}catch(_){}}
 function fromUser(ev){if(run()){stop(ev);return true}return false}
 function key(ev){if(ev.key!=='Escape'&&ev.key!=='BrowserBack'&&ev.key!=='Backspace')return;
  var t=ev.target;if(t&&t.closest&&t.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(w.__BASAIR_P100_TARGET_BACK__&&w.__BASAIR_P100_TARGET_BACK__.hasLayer())return;
  fromUser(ev);
 }
 function clickBack(ev){var t=ev.target&&ev.target.closest&&ev.target.closest('#mBack,#dockBack,#r108Back');
  if(!t||!allowed())return;
  // All R109 Back presses use the exposed wrapped back instead of the
  // original private onclick closure (which has no 'source' branch).
  if(t.id==='r108Back'&&!selected())return;
  if(w.__BASAIR_P100_TARGET_BACK__&&w.__BASAIR_P100_TARGET_BACK__.hasLayer())return;
  fromUser(ev);
 }
 function captureSourceScroll(ev){var t=ev.target&&ev.target.closest&&ev.target.closest('#r108List .r109Track button');
  if(!t||t.textContent.trim()!=='المصدر')return;var a=selected();if(!a)return;
  var S=a._test&&a._test.state,p=E('r108Panel');if(S&&p)S.listScroll=p.scrollTop;
 }
 function nativeBack(){if(run())return false;
  return typeof origNative==='function'?origNative.apply(this,arguments):false;
 }
 function boot(){patchSelected();w.addEventListener('keydown',key,true);
  w.addEventListener('click',clickBack,true);w.addEventListener('click',captureSourceScroll,true);
  // No observer on Quran pages, scrolling, audio, verse selection or reader.
  // R109 is installed synchronously with the V690 scripts before OTA activation.
 }
 if(typeof origNative==='function')w.bqNativeBack=nativeBack;
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 w.__BASAIR_P99_SEQUENTIAL_BACK__={version:version,back:run,patchSelected:patchSelected,
   diagnostics:function(){var S=selected(),t=S&&S._test&&S._test.state;return{view:activeView(),allowed:allowed(),selected:!!S,selectedScreen:t&&t.screen||'',reciterPatched:reciterPatched,last:lastResult,counts:Object.assign({},counts),nativeBridge:typeof origNative==='function'}}};
})(window,document);


/* BASAIR P100 / QA035 — Device-real Back for V211 Downloads, B271 My Topics,
   R109 Selected Recitations. Overlay only. Do not alter data, mushaf/audio
   engines, reader navigation or app history except via the original owners. */
(function(w,d){'use strict';
 if(w.__BASAIR_P100_TARGET_BACK__)return;
 var topicDetail='', nativeBase=null, nativeWrapper=null, descBase=null, descriptorInstalled=false;
 var installing=false, bridgeBusy=false, count=Object.create(null), last='', lastTime=0;
 function E(s){return d.getElementById(s)}
 function view(){var x=d.querySelector('body > .app > main > .view.active');return x&&x.id||''}
 function shown(id,cl){var el=E(id);return !!(el&&(!cl||el.classList.contains(cl))&&el.getAttribute('aria-hidden')!=='true'&&!el.hidden)}
 function selected(){var a=w.__BASAIR_R109_SELECTED__;return !!(a&&typeof a.active==='function'&&a.active()&&!E('r108Sheet')?.hidden)}
 function topics(){var p=E('v135ToolPanel');return view()==='tilawaIndex'&&!!(p&&!p.classList.contains('hidden')&&p.getAttribute('data-b265-panel')==='topic')}
 function layer(){
  if(selected())return 'selected';
  if(shown('v211DownloadSheet','open'))return 'downloads';
  if(view()==='tilawaIndex'&&shown('b271TopicEditorSheet','open'))return 'topic-editor';
  if(view()==='tilawaIndex'&&shown('b265ExportSheet','open'))return 'topic-export';
  if(topics())return topicDetail?'topic-detail':'topic-root';
  return '';
 }
 function record(s){last=s;count[s]=(count[s]||0)+1;lastTime=Date.now();return true}
 function click(s){var el=d.querySelector(s);if(!el||typeof el.click!=='function')return false;try{el.click();return true}catch(_){return false}}
 function ensureDownloadsButton(){
  var sheet=E('v211DownloadSheet'),head=sheet&&sheet.querySelector('.v211Head'),close=E('v211Close');
  if(!head||!close||E('v211P100Back'))return false;
  var btn=d.createElement('button');btn.id='v211P100Back';btn.type='button';btn.className='v211Close';
  btn.textContent='‹';btn.setAttribute('aria-label','رجوع من التنزيلات');btn.title='رجوع';
  head.insertBefore(btn,close);return true;
 }
 function topicHome(){
  if(!topics())return false;var b=d.querySelector('#v135TilawaTools [data-b265-tool="topic"]');
  if(!b)return false;topicDetail='';b.click();return record('topic-detail-to-list');
 }
 function closeOwner(s,still){
  if(!click(s))return false;
  // V690/B271 normally closes on native popstate; if WebView drops this event,
  // notify its *existing* popstate owner once, never mutate its private state.
  w.setTimeout(function(){
   if(still()&&view()==='tilawaIndex'){
    try{w.dispatchEvent(new PopStateEvent('popstate',{state:w.history.state}))}catch(_){}
   }
  },360);
  return true;
 }
 function go(){
  var k=layer();if(!k)return false;
  if(k==='selected'){
   var api=w.__BASAIR_R109_SELECTED__,before=api&&api._test&&api._test.state&&api._test.state.screen;
   if(api&&typeof api.back==='function'){
    // P99 patched the exported back(), not R109's private basairBack closure.
    if(before==='source'&&!api.back.__bqP99){
     var media=E('r108MediaArea'),s=api._test.state;
     if(media){media.innerHTML='';media.hidden=true}
     s.screen='records';var arrow=E('r108Back');if(arrow)arrow.hidden=false;
    }else api.back();
    return record('selected-'+String(before||'sheet'));
   }
   return false;
  }
  if(k==='downloads'){
   var manager=w.__BASAIR_DOWNLOADS_V211__;
   if(manager&&typeof manager.close==='function')manager.close();
   else if(!click('#v211Close'))return false;
   return record('downloads');
  }
  if(k==='topic-editor'){
   if(closeOwner('#b271TopicEditorSheet [data-b271-topic-editor-close]',function(){return shown('b271TopicEditorSheet','open')}))return record('topic-editor');
   return false;
  }
  if(k==='topic-export'){
   if(closeOwner('#b265ExportSheet [data-b265-export-close]',function(){return shown('b265ExportSheet','open')}))return record('topic-export');
   return false;
  }
  if(k==='topic-detail')return topicHome();
  if(k==='topic-root'){
   if(closeOwner('#v135ToolPanel .b265PanelHead [data-b265-close]',topics)){
    topicDetail='';return record('topic-root');
   }
   return false;
  }
  return false;
 }
 function stop(e){if(!e)return;try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}catch(_){}}
 function onClick(e){
  var t=e.target&&e.target.closest&&e.target.closest('#v211P100Back,#mBack,#dockBack,#r108Back,#v135ToolPanel .b265PanelHead [data-b265-close]');
  if(!t)return;
  // The B271 header's root Back is owned by its existing history router.
  if(t.hasAttribute('data-b265-close')&&layer()==='topic-root')return;
  if(go())stop(e);
 }
 function onKey(e){if(e.key!=='Escape'&&e.key!=='BrowserBack'&&e.key!=='Backspace')return;
  var t=e.target;if(t&&t.closest&&t.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(go())stop(e);
 }
 function onTrack(e){var t=e.target&&e.target.closest&&e.target.closest('[data-b271-custom-topic],[data-b265-tool="topic"],[data-b266-topic],#b265SearchClear');
  if(!t)return;
  if(t.hasAttribute('data-b271-custom-topic')&&topics()){topicDetail=t.getAttribute('data-b271-custom-topic')||'';return;}
  if(t.hasAttribute('data-b265-tool')&&t.getAttribute('data-b265-tool')==='topic'){topicDetail='';return;}
  if(t.hasAttribute('data-b266-topic')||t.id==='b265SearchClear')topicDetail='';
 }
 function baseBack(){if(!descBase)return null;
  try{return typeof descBase.get==='function'?descBase.get.call(w):descBase.value}catch(_){return null}
 }
 function basairBridge(){
  if(go())return false;
  // B273 can capture this bridge as a fallback during a transient modal.
  // Do not enter the B273/R109 recursive back chain after the modal closes.
  if(bridgeBusy)return false;
  bridgeBusy=true;
  try{
   var b=baseBack();
   if(typeof b==='function'&&b!==basairBridge)return b.apply(this,arguments);
   return false;
  }catch(_){return false}finally{bridgeBusy=false}
 }
 function installBasair(){
  if(installing)return false;
  var desc=Object.getOwnPropertyDescriptor(w,'basairBack');
  if(!desc||!desc.configurable||desc.get&&desc.get.__bqP100)return false;
  installing=true;descBase=desc;
  var g=function(){return layer()?basairBridge:baseBack()};g.__bqP100=true;
  try{Object.defineProperty(w,'basairBack',{
    configurable:true,enumerable:true,get:g,
    set:function(fn){if(typeof fn!=='function'||fn===basairBridge)return;
      try{if(typeof descBase.set==='function')descBase.set.call(w,fn);else descBase.value=fn}catch(_){}
    }
   });descriptorInstalled=true;return true;
  }catch(_){return false}finally{installing=false}
 }
 function installNative(){
  if(w.bqNativeBack===nativeWrapper)return;
  // Preserve the prior P99/P79 Back owner for every non-target screen.
  nativeBase=typeof w.bqNativeBack==='function'?w.bqNativeBack:null;
  nativeWrapper=function(){if(go())return false;
   return typeof nativeBase==='function'&&nativeBase!==nativeWrapper?nativeBase.apply(this,arguments):false;
  };
  w.bqNativeBack=nativeWrapper;
 }
 function install(){installBasair();installNative();ensureDownloadsButton();}
 function boot(){install();
  w.addEventListener('click',onTrack,true);
  w.addEventListener('click',onClick,true);
  w.addEventListener('keydown',onKey,true);
  d.addEventListener('input',function(e){if(e.target&&e.target.id==='b265SearchInput')topicDetail='';},true);
  d.addEventListener('click',function(){w.setTimeout(install,280)},false);
  w.addEventListener('pageshow',install,false);
  w.addEventListener('basair:p92-activated',install,false);
  w.setTimeout(install,200);w.setTimeout(install,850);
 }
 w.__BASAIR_P100_TARGET_BACK__={version:'P100-QA035',layer:layer,back:go,hasLayer:function(){return !!layer()},
  diagnostics:function(){return {layer:layer(),view:view(),topicDetail:!!topicDetail,basairBridge:descriptorInstalled,native:!!nativeWrapper,last:last,counts:Object.assign({},count),lastAt:lastTime}}};
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);


/* P101 QA036: ensure P79 never schedules its 460ms HOME fallback after
   a successful P100 Tilawa nested Back. Keep all non-Tilawa routing intact. */
(function(w,d){'use strict';
 if(w.__BASAIR_P101_BACK_ROUTER__)return;
 var facade=null,installed=0,touches=null,counts={p79:0,direct:0,swipe:0};
 function layer(){var a=w.__BASAIR_P100_TARGET_BACK__,k='';
  try{if(a&&a.layer&&a.back)k=a.layer()}catch(_){}
  return /^(downloads|selected|topic-editor|topic-export|topic-detail|topic-root)$/.test(k)?{a:a,k:k}:null;
 }
 function consume(kind){var x=layer();if(!x)return false;
  try{if(x.a.back()!==true)return false}catch(_){return false}
  counts[kind]++;return true;
 }
 function install(){var p=w.__BASAIR_NAV_P79__;
  if(!p||typeof p.back!=='function'||p===facade||p.back.__p101)return false;
  var previous=p.back,copy=Object.create(p);
  function back(){if(consume('p79'))return false;return previous.apply(p,arguments)}
  back.__p101=true;Object.defineProperty(copy,'back',{value:back,enumerable:true});
  w.__BASAIR_NAV_P79__=facade=copy;installed++;return true;
 }
 function stop(e){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation()}
 function click(e){var t=e.target&&e.target.closest&&e.target.closest('#mBack,#dockBack,#v211P100Back,#r108Back');
  if(t&&consume('direct'))stop(e);
 }
 function key(e){if(!['Escape','BrowserBack','Backspace'].includes(e.key))return;
  if(e.target&&e.target.closest&&e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(consume('direct'))stop(e);
 }
 function start(e){touches=null;if(!layer()||!e.touches||e.touches.length!==1)return;
  var t=e.touches[0],w0=w.innerWidth||393,band=Math.min(76,Math.max(48,Math.round(w0*.18)));
  if(t.clientX>band&&t.clientX<w0-band||t.clientY<50||t.clientY>(w.innerHeight||800)-28)return;
  touches={x:t.clientX,y:t.clientY,id:t.identifier,side:t.clientX<=band?'l':'r',time:Date.now(),kind:layer().k};
 }
 function end(e){var s=touches;touches=null;if(!s||!e.changedTouches||e.changedTouches.length!==1)return;
  var t=e.changedTouches[0],a=layer(),dx=t.clientX-s.x,dy=t.clientY-s.y;
  if(!a||a.k!==s.kind||t.identifier!==s.id||Date.now()-s.time>1350||Math.abs(dx)<72||Math.abs(dy)>Math.max(30,Math.abs(dx)*.38))return;
  if(s.side==='l'?dx<=0:dx>=0)return;
  if(consume('swipe'))stop(e);
 }
 function boot(){install();
  w.addEventListener('click',click,true);w.addEventListener('keydown',key,true);
  w.addEventListener('touchstart',start,{capture:true,passive:true});
  w.addEventListener('touchend',end,{capture:true,passive:false});
  w.addEventListener('pageshow',install);w.addEventListener('basair:p92-activated',install);
  d.addEventListener('click',function(){setTimeout(install,260)},false);
 }
 w.__BASAIR_P101_BACK_ROUTER__={version:'P101-QA036',back:function(){return consume('direct')},install:install,
  diagnostics:function(){return {p79Intercepted:!!(w.__BASAIR_NAV_P79__&&w.__BASAIR_NAV_P79__.back.__p101),installed:installed,counts:counts,layer:layer()&&layer().k||''}}};
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);


/* BASAIR P102 / QA037 — modal-owned back, no section-name dependency.
 * Repairs P100's stale tilawaIndex gate when B255 relocates "موضوعاتي" to
 * document.body and when a view switch leaves a visible nested dialog.
 * OTA UI router only. Does not mutate Qur'an, reciter/audio, user data, or
 * Android resources. All non-target requests retain their original owner.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_P102_VISIBLE_BACK__)return;
 var p100=w.__BASAIR_P100_TARGET_BACK__;
 if(!p100||typeof p100.layer!=='function'||typeof p100.back!=='function')return;
 var oldLayer=p100.layer,oldBack=p100.back;
 var savedDescriptor=null,installed=false,lastAt=0,lastKind='',counts={},errors=[];
 function E(id){return d.getElementById(id)}
 function open(id,cls){var e=E(id);return !!(e&&!e.hidden&&(!cls||e.classList.contains(cls))&&e.getAttribute('aria-hidden')!=='true')}
 function topicPanel(){var p=E('v135ToolPanel');return p&&!p.hidden&&!p.classList.contains('hidden')&&p.getAttribute('data-b265-panel')==='topic'?p:null}
 function selected(){var a=w.__BASAIR_R109_SELECTED__;return a&&typeof a.active==='function'&&a.active()&&open('r108Sheet')?a:null}
 function kind(){
  if(selected())return 'selected';
  if(open('v211DownloadSheet','open'))return 'downloads';
  if(open('b271TopicEditorSheet','open'))return 'topic-editor';
  if(open('b265ExportSheet','open'))return 'topic-export';
  var p=topicPanel();
  if(p){
   var count=E('b265SearchCount'),label=count&&count.textContent||'';
   var q=E('b265SearchInput');
   if(/^\s*موضوع محفوظ\s*:/.test(label)||((q&&q.value.trim())&&(/^\s*(?:موضوع\s*:|مطابقة لفظية)/.test(label))))return 'topic-detail';
   return 'topic-root';
  }
  return oldLayer();
 }
 function back(){
  var k=kind();if(!k)return false;
  var now=Date.now();
  // Two native/history callbacks for the same physical gesture must not
  // close two layers. A second, distinct user press remains possible.
  if(now-lastAt<180){counts['duplicate']=(counts['duplicate']||0)+1;return true}
  var ok=false;
  try{
   if(k==='selected'){
    var rec=selected();ok=!!(rec&&typeof rec.back==='function'&&rec.back()!==false);
   }else if(k==='downloads'){
    var mgr=w.__BASAIR_DOWNLOADS_V211__;if(mgr&&typeof mgr.close==='function'){mgr.close();ok=true}
    else{var close=E('v211Close');if(close){close.click();ok=true}}
   }else if(k==='topic-detail'){
    var btn=d.querySelector('#v135TilawaTools [data-b265-tool="topic"]');
    if(btn){btn.click();ok=true}
   }else if(k==='topic-root'){
    var owner=w.__BASAIR_TILAWA_B274_STABILITY__||w.__BASAIR_TILAWA_B273_STABILITY__;
    if(owner&&typeof owner.backTopicPanel==='function')ok=owner.backTopicPanel()!==false;
    else{var b=d.querySelector('#v135ToolPanel [data-b265-close]');if(b){b.click();ok=true}}
   }else if(k==='topic-editor'||k==='topic-export'){
    var selector=k==='topic-editor'?'#b271TopicEditorSheet [data-b271-topic-editor-close]':'#b265ExportSheet [data-b265-export-close]';
    var c=d.querySelector(selector);if(c){c.click();ok=true}
   }else ok=oldBack();
  }catch(e){errors.push(k);if(errors.length>5)errors.shift();ok=false}
  if(ok){lastAt=now;lastKind=k;counts[k]=(counts[k]||0)+1}
  return ok;
 }
 // P101's facade obtains P100.layer/back at each invocation; replace the
 // methods, not P79 (which is frozen and used by P06's history bridge).
 p100.layer=kind;p100.back=back;p100.hasLayer=function(){return !!kind()};
 function rawBack(){try{if(!savedDescriptor)return null;return typeof savedDescriptor.get==='function'?savedDescriptor.get.call(w):savedDescriptor.value}catch(_){return null}}
 function bridge(){if(back())return false;var fn=rawBack();if(typeof fn==='function'&&fn!==bridge)return fn.apply(this,arguments);return false}
 function install(){
  var desc=Object.getOwnPropertyDescriptor(w,'basairBack');
  if(!desc||!desc.configurable)return false;
  if(desc.get&&desc.get.__bqP102)return true;
  // P100 must recognize this as an installed getter, and never recursively
  // install another proxy over it on every click.
  savedDescriptor=desc;
  var get=function(){return kind()?bridge:rawBack()};
  get.__bqP102=true;get.__bqP100=true;
  try{Object.defineProperty(w,'basairBack',{configurable:true,enumerable:true,get:get,set:function(fn){
    if(typeof fn!=='function'||fn===bridge)return;
    try{if(savedDescriptor&&typeof savedDescriptor.set==='function')savedDescriptor.set.call(w,fn);
    else if(savedDescriptor)savedDescriptor.value=fn}catch(_){}
  }});installed=true;return true}catch(_){errors.push('basair-descriptor');return false}
 }
 install();w.addEventListener('pageshow',install,false);
 w.addEventListener('basair:p92-activated',install,false);
 w.__BASAIR_P102_VISIBLE_BACK__={version:'P102-QA037-CANDIDATE',layer:kind,back:back,install:install,diagnostics:function(){
  return {layer:kind(),owner:!!topicPanel(),selected:!!selected(),basairIntercept:installed,lastKind:lastKind,counts:Object.assign({},counts),errors:errors.slice()};
 }};
})(window,document);


/* BASAIR P103 / QA038 — fix Android hardware Back bypassing OTA router.
 * Native MainActivity calls window.bqNativeBack(), not P100/P102's exported
 * functions. The old P100 native wrapper used its private go() closure and
 * fell through to P79, whose signature missed body-portal Tilawa sheets.
 * Handle only visible P102 owner layers at the STABLE native entry; forward
 * other screens to P79's native-compatible original. No native APK change,
 * data mutation, autoplay, history push, or reader engine changes.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_P103_NATIVE_BACK__)return;
 var router=w.__BASAIR_P102_VISIBLE_BACK__;
 var nativeBefore=typeof w.bqNativeBack==='function'?w.bqNativeBack:null;
 var descriptor=Object.getOwnPropertyDescriptor(w,'bqNativeBack');
 var installed=false,busy=false,counters={owned:0,ordinary:0,failed:0,externalSetters:0};
 var recent=[],maxRecent=12;
 function trace(kind,outcome){
  recent.push({kind:String(kind||'none'),result:outcome,at:Date.now()});
  if(recent.length>maxRecent)recent.shift();
 }
 function layer(){try{return router&&router.layer&&router.layer()||''}catch(_){return ''}}
 function nativeBack(){
  if(busy)return false;
  busy=true;
  try{
   var k=layer();
   if(k){
    var consumed=false;
    try{consumed=router.back()===true}catch(_){counters.failed++}
    if(consumed){counters.owned++;trace(k,'nested-back');return false}
    // A visible sheet must NOT fall through to P79 -> Home when its owner
    // cannot close it. Preserve state for troubleshooting instead.
    if(layer()){counters.failed++;trace(k,'owner-refused');return false}
    counters.owned++;trace(k,'owner-closed');return false;
   }
   counters.ordinary++;trace('none','delegate-p79');
   var nav=w.__BASAIR_NAV_P79__;
   if(nav&&typeof nav.back==='function')return nav.back('android-hardware');
   // In unusual startup races P79 may not yet exist. Preserve original.
   if(nativeBefore&&nativeBefore!==nativeBack)return nativeBefore.apply(w,arguments);
   return false;
  }finally{busy=false}
 }
 function install(){
  if(!router||typeof router.layer!=='function'||typeof router.back!=='function')return false;
  var cur=Object.getOwnPropertyDescriptor(w,'bqNativeBack');
  if(!cur||cur.configurable===false)return false;
  // P100 may re-assign bqNativeBack after every click. A stable accessor
  // prevents those late reassignments from bypassing this native bridge.
  // Its own internal wrappers remain untouched for other entry points.
  try{
   Object.defineProperty(w,'bqNativeBack',{
    configurable:true,enumerable:true,
    get:function(){return nativeBack},
    set:function(fn){if(fn!==nativeBack)counters.externalSetters++}
   });
   installed=true;return true;
  }catch(_){return false}
 }
 install();
 w.addEventListener('pageshow',install,false);
 w.__BASAIR_P103_NATIVE_BACK__=Object.freeze({
  version:'P103-QA038',back:nativeBack,install:install,
  diagnostics:function(){return {
   installed:installed,exported:w.bqNativeBack===nativeBack,
   layer:layer(),ordinary:counters.ordinary,owned:counters.owned,
   failed:counters.failed,externalSetters:counters.externalSetters,
   recent:recent.slice()
  }}
 });
})(window,document);


(function(){var css="/* BASAIR P104 — approved green/gold Selected Recitations visual concept.\n   ALL selectors scoped to the existing R108/R109 sheet, not Mushaf or audio engines. */\n#r108Sheet.p104-ui{--p104-green:#124d3f;--p104-forest:#06362e;--p104-gold:#c6a15a;--p104-cream:#fcf8f0;--p104-ink:#123b30;--p104-muted:#6e756f}\n#r108Sheet.p104-ui #r108Panel{\n  max-height:calc(100dvh - 12px);height:min(94dvh,1000px);\n  width:min(100vw,580px);box-sizing:border-box;\n  padding:0 13px calc(16px + env(safe-area-inset-bottom,0px));\n  border-radius:28px 28px 0 0;\n  border:1px solid rgba(193,161,96,.55);background:var(--p104-cream);\n  color:var(--p104-ink);box-shadow:0 -18px 60px rgba(1,26,19,.34);\n  overscroll-behavior:contain;scroll-behavior:auto;direction:rtl;\n}\n#r108Sheet.p104-ui .p104Hero{position:relative;display:flex;align-items:center;justify-content:center;flex-direction:column;\n  height:156px;margin:0 -13px;overflow:hidden;isolation:isolate;\n  background:radial-gradient(circle at 50% -18%,#396c5b 0%,#114a3e 53%,#073329 100%);color:#fcf1d9;}\n#r108Sheet.p104-ui .p104Hero::before{content:'';position:absolute;width:96%;height:184px;top:12px;\n  border:2px solid rgba(213,173,94,.72);border-radius:50% 50% 20% 20%;transform:translateY(17px);\n  box-shadow:0 0 0 9px rgba(226,191,113,.045),inset 0 0 30px rgba(6,28,21,.4);z-index:-1;}\n#r108Sheet.p104-ui .p104Hero::after{content:'۞';position:absolute;left:12px;top:6px;\n  color:rgba(215,179,100,.24);font-size:80px;line-height:1;transform:rotate(-25deg);}\n#r108Sheet.p104-ui .p104BrandLogo{width:53px;height:53px;display:grid;place-items:center;\n  border:1.5px solid var(--p104-gold);border-radius:16px;\n  background:radial-gradient(circle,#225d47,#0a3229);box-shadow:0 6px 18px rgba(0,0,0,.25);margin:7px 0 5px;}\n#r108Sheet.p104-ui .p104BrandLogo img{display:block;width:100%;height:100%;object-fit:cover;border-radius:14px}\n#r108Sheet.p104-ui .p104BrandName{font-weight:800;font-size:1.23rem;line-height:1.3;color:#faf1df}\n#r108Sheet.p104-ui .p104BrandEnglish{direction:ltr;letter-spacing:3px;font:600 9px/1.5 sans-serif;color:#dec69c}\n#r108Sheet.p104-ui .p104Lantern{position:absolute;top:36px;color:#ecd397;font-size:26px;filter:drop-shadow(0 0 9px #eabb65)}\n#r108Sheet.p104-ui .p104Lantern::before{content:'';position:absolute;top:-44px;height:44px;border-left:1px solid #c7a462;left:50%}\n#r108Sheet.p104-ui .p104Lantern.right{right:12%}#r108Sheet.p104-ui .p104Lantern.left{left:12%}\n#r108Sheet.p104-ui #r108Panel>header{position:sticky;top:0;z-index:6;display:flex;align-items:center;justify-content:space-between;\n  min-height:57px;padding:0 11px!important;margin:0 -13px 12px!important;\n  border-bottom:1px solid rgba(200,162,98,.55);border-radius:0 0 15px 15px;\n  background:linear-gradient(#fffdf7,#f6eee2);box-shadow:0 5px 11px rgba(80,62,33,.065);}\n#r108Sheet.p104-ui #r108Panel>header b{font-size:1.23rem!important;color:var(--p104-green);font-weight:800;\n  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%;}\n#r108Sheet.p104-ui #r108Close,#r108Sheet.p104-ui #r108Back{display:grid;place-items:center;flex:0 0 40px;\n  width:40px;min-width:40px;height:40px;background:#fffdf8;border:1px solid #d8c7a6;\n  border-radius:12px;font-size:1.38rem;color:#174b3b;box-shadow:0 2px 4px rgba(46,38,24,.04)}\n#r108Sheet.p104-ui #r108Back[hidden]{visibility:hidden!important;display:grid!important;pointer-events:none}\n#r108Sheet.p104-ui #r109PlayerOptions{display:none!important}\n#r108Sheet.p104-ui #r108List{margin-top:0!important;padding:0 2px 8px!important;gap:11px!important}\n#r108Sheet.p104-ui .r91Heading{display:none!important}\n#r108Sheet.p104-ui .r91SearchRow{display:flex;align-items:center;gap:9px;margin:3px 1px 13px;position:relative}\n#r108Sheet.p104-ui .r109Search{height:45px!important;min-height:45px!important;border-radius:15px;\n  background:#fffefb!important;border:1px solid #cbbfaf!important;padding:8px 36px 8px 10px!important;\n  box-shadow:0 4px 8px rgba(31,42,29,.055);font-size:.86rem!important;color:#233f36}\n#r108Sheet.p104-ui .r91SearchRow::before{content:'⌕';position:absolute;top:7px;right:12px;z-index:1;font-size:24px;color:#436b5a;pointer-events:none}\n#r108Sheet.p104-ui .r91Filter{width:115px;flex:0 0 115px;max-width:34%;min-height:45px;\n  border:1px solid #c5a873;background:#fffaf1;color:#204a3b;border-radius:15px;\n  box-shadow:0 3px 7px rgba(44,33,23,.06);font-size:.82rem;font-weight:700}\n#r108Sheet.p104-ui .r109ReaderGrid{gap:12px!important}\n#r108Sheet.p104-ui .r91ReaderCard{position:relative;padding:15px 13px 12px!important;overflow:hidden;border-radius:18px!important;\n  background:linear-gradient(115deg,#fdfbf6 5%,#f9f5ed 100%)!important;\n  border:1px solid #d7c9b4!important;box-shadow:0 4px 14px rgba(45,35,18,.095)!important;}\n#r108Sheet.p104-ui .r91ReaderCard::after{content:'۞';position:absolute;right:-22px;bottom:-51px;\n  font-size:160px;line-height:1;color:rgba(189,155,91,.085);pointer-events:none}\n#r108Sheet.p104-ui .r91ReaderDetails{display:grid!important;grid-template-columns:86px minmax(0,1fr);grid-template-rows:auto auto;\n  align-items:start;column-gap:12px;row-gap:3px;direction:rtl;min-width:0}\n#r108Sheet.p104-ui .p104Portrait{grid-column:1;grid-row:1/span 2;position:relative;width:83px;height:103px;\n  padding:3px;border:2px solid #b79857;border-radius:49% 49% 22px 22px/25% 25% 18px 18px;\n  background:linear-gradient(#efdaa9,#fff8df);box-shadow:0 0 0 2px #fffef8,0 0 0 4px #d7ba7c;overflow:hidden;\n  box-sizing:border-box;display:grid;place-items:center;}\n#r108Sheet.p104-ui .p104Portrait img{position:absolute;inset:3px;object-fit:cover;object-position:50% 16%;\n  width:calc(100% - 6px);height:calc(100% - 6px);border-radius:48% 48% 19px 19px/23% 23% 16px 16px;\n  filter:saturate(.9);z-index:2}\n#r108Sheet.p104-ui .p104Portrait .p104Avatar{font-size:30px;color:#366852;font-weight:900;line-height:1}\n#r108Sheet.p104-ui .r91ReaderText{grid-column:2;grid-row:1;min-width:0;gap:5px!important}\n#r108Sheet.p104-ui .r91ReaderText b{font-size:1.13rem!important;line-height:1.35!important;color:#0c4738!important}\n#r108Sheet.p104-ui .r91ReaderText small{font-size:.70rem;opacity:1;color:#686e68;line-height:1.55}\n#r108Sheet.p104-ui .r91Chips{grid-column:2;grid-row:2;align-items:flex-start;gap:5px!important;min-width:0}\n#r108Sheet.p104-ui .r91Chips span{padding:2px 8px!important;max-width:100%;white-space:normal;\n  font-size:.69rem!important;background:#e8eee6!important;color:#174c3e!important;line-height:1.35;border:0}\n#r108Sheet.p104-ui .r91ReaderCard .r91Actions{position:relative;z-index:1;display:grid;\n  grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:14px!important}\n#r108Sheet.p104-ui .r91ReaderCard .r91Actions>.r91Btn{width:100%;min-height:41px;border-radius:12px!important;\n  border:1px solid #24745d;font-size:.84rem!important;font-weight:700;white-space:nowrap;padding:6px}\n#r108Sheet.p104-ui .r91ReaderCard .r91Actions>.r91Primary{order:0;background:linear-gradient(#2d7360,#0b4c3a)!important;color:#fff!important}\n#r108Sheet.p104-ui .r91ReaderCard .r91Actions>.r91Btn:not(.r91Primary){order:1;background:#fffdf5;color:#135140}\n#r108Sheet.p104-ui .r91ReaderCard .r91Actions>.r91Note{grid-column:1/-1}\n#r108Sheet.p104-ui .p104CardMenu{position:absolute;top:15px;left:12px;z-index:3;\n  width:34px;height:34px;display:grid;place-items:center;border-radius:10px;\n  border:1px solid #d4be97;background:#fffcf4;color:#195544;font-size:22px;cursor:pointer;line-height:1}\n#r108Sheet.p104-ui .r91Profile{border:1px solid #d7c39b;border-radius:16px;background:#fffaf0;}\n#r108Sheet.p104-ui .r109Tracks{gap:9px!important}\n#r108Sheet.p104-ui .r109Track{border:1px solid #d8c7aa!important;background:#fffdf8!important;\n  border-radius:14px!important;padding:11px 12px!important;box-shadow:0 2px 7px rgba(43,33,18,.07)}\n#r108Sheet.p104-ui .r109Track .r91TrackHeadline{display:flex;align-items:center;gap:8px;padding-left:39px}\n#r108Sheet.p104-ui .r109Track .r91TrackHeadline b{font-size:.9rem!important;color:#13503e!important}\n#r108Sheet.p104-ui .r109Actions{display:flex!important;align-items:center;gap:7px;margin-top:8px;padding-left:35px}\n#r108Sheet.p104-ui .r109Actions .r91Btn{min-height:34px;font-size:.76rem!important;border-radius:10px;padding:6px 10px}\n#r108Sheet.p104-ui .r109Actions .r91Primary{background:#1d6451;color:#fff}\n#r108Sheet.p104-ui .p104TrackMenu{position:absolute;top:10px;left:10px;width:34px;height:34px;display:grid;place-items:center;\n  background:#f5efe1;border:1px solid #d1ba91;border-radius:10px;color:#174c3c;font-size:20px;cursor:pointer}\n#r108Sheet.p104-ui .r109Track{position:relative}\n#r108Sheet.p104-ui .r91ListControls{gap:9px;margin-bottom:11px}\n#r108Sheet.p104-ui .r91Btn:focus-visible,#r108Sheet.p104-ui .p104CardMenu:focus-visible,\n#r108Sheet.p104-ui .p104TrackMenu:focus-visible{outline:3px solid #c9a562;outline-offset:2px}\n#r108Sheet.p104-ui #r108MediaArea{background:#fffbf3!important;border-color:#c8b493!important;border-radius:16px;z-index:4}\n#r108Sheet.p104-ui #r108Status{padding:4px 8px;font-size:.72rem;color:#506b5e;line-height:1.6}\n.p104OptionsOverlay{position:fixed;inset:0;display:flex;justify-content:center;align-items:flex-end;\n  z-index:2147483600;background:rgba(6,32,24,.48);direction:rtl;font-family:inherit}\n.p104OptionsOverlay[hidden]{display:none!important}\n.p104OptionsSheet{box-sizing:border-box;width:min(100vw,560px);max-height:min(73dvh,680px);overflow-y:auto;\n  padding:12px 17px calc(18px + env(safe-area-inset-bottom,0px));border-radius:26px 26px 0 0;\n  background:linear-gradient(160deg,#fffefa,#f8f1e7);border:1px solid #d4bf95;box-shadow:0 -12px 34px #061b1657;color:#144836}\n.p104OptionsHandle{width:52px;height:5px;background:#c5c4be;border-radius:100px;margin:0 auto 10px}\n.p104OptionsHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:5px 0 12px}\n.p104OptionsTitle{font-weight:800;font-size:1.17rem;color:#0c4436}\n.p104OptionsClose{width:37px;height:37px;border:1px solid #d6c8ac;border-radius:10px;\n  background:#fffdf7;color:#143f31;font-size:23px;cursor:pointer}\n.p104OptionsFor{font-size:.73rem;color:#748076;margin-top:-5px;margin-bottom:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.p104OptionRow{display:flex;align-items:center;gap:11px;min-height:60px;padding:8px;border-radius:13px;\n  border-bottom:1px solid #e3dcd0;cursor:pointer;color:#1a4639}\n.p104OptionRow:has(input:checked){background:#eaf0e8}\n.p104OptionRow input{width:20px;height:20px;accent-color:#11674e;flex:0 0 auto}\n.p104OptionIcon{width:40px;height:40px;display:grid;place-items:center;flex:0 0 40px;\n  border:1px solid #ddc9a7;border-radius:11px;font-size:20px;background:#fff9eb;color:#155540}\n.p104OptionContent{flex:1;min-width:0}.p104OptionContent b{display:block;font-size:.91rem}\n.p104OptionContent small{display:block;color:#768077;font-size:.69rem;line-height:1.4}\n.p104TimerChoices{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:11px 0 3px}\n.p104TimerChoices button{border:1px solid #c7b28b;border-radius:11px;padding:8px 10px;\n  background:#fffcf6;color:#174c3c;font:inherit;font-size:.76rem;cursor:pointer}\n.p104TimerChoices button[aria-pressed=\"true\"]{background:#17664f;color:#fff;border-color:#17664f}\n.p104OptionsNote{font-size:.71rem;line-height:1.55;margin-top:12px;color:#617168}\nbody.dark #r108Sheet.p104-ui #r108Panel{background:#172b24;color:#e2f0e7}\nbody.dark #r108Sheet.p104-ui #r108Panel>header,body.dark #r108Sheet.p104-ui .r91ReaderCard,\nbody.dark #r108Sheet.p104-ui .r109Track{background:#253b30!important;color:#e9eee8!important;border-color:#a4875780!important}\nbody.dark #r108Sheet.p104-ui .r91ReaderText b,body.dark #r108Sheet.p104-ui .r109Track b{color:#e0f3e7!important}\nbody.dark .p104OptionsSheet{background:#223a2f;color:#e7f1e9}\nbody.dark .p104OptionRow,body.dark .p104OptionsTitle{color:#ebf5eb}\nbody.dark .p104OptionRow:has(input:checked){background:#285641}\n@media (max-width:390px){#r108Sheet.p104-ui .p104Hero{height:125px}#r108Sheet.p104-ui .r91ReaderDetails{grid-template-columns:72px minmax(0,1fr);column-gap:9px}\n #r108Sheet.p104-ui .p104Portrait{width:69px;height:88px}\n #r108Sheet.p104-ui .r91ReaderCard{padding:11px 10px 10px!important}\n #r108Sheet.p104-ui .r91ReaderText b{font-size:1rem!important}\n #r108Sheet.p104-ui .r91Chips span{font-size:.62rem!important}\n #r108Sheet.p104-ui .r91ReaderCard .r91Actions>.r91Btn{font-size:.75rem!important}\n #r108Sheet.p104-ui #r108Panel>header b{font-size:1.1rem!important}}\n@media(prefers-reduced-motion:reduce){#r108Sheet.p104-ui *, .p104OptionsOverlay *{transition:none!important;scroll-behavior:auto!important}}\n";var t=document.getElementById("p104SelectedStyle")||document.createElement("style");t.id="p104SelectedStyle";t.textContent=css;if(!t.isConnected)document.head.appendChild(t);})();
/* BASAIR P104 — SELECTED RECITATIONS, UI-only retrofit on the V690 R109 engine.
 * Scope: #r108Sheet, R109 DOM only. Does not replace R109, change reciter
 * catalog, native Back, MP3 URLs, reader text, IndexedDB or history.
 * Photo images are OPTIONAL remote assets; decorative offline avatar fallback.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P104_SELECTED_UI__) return;
 var VERSION='P104-SELECTED-RECITATIONS-UI-039';
 var SETTINGS_KEY='BASAIR_P104_PLAY_OPTIONS_V1';
 var reciterNames=[
  ['masad','عبد الرحمن مسعد'],['dukhain','هيثم الدخين'],['ghamdi','سعد الغامدي'],
  ['abkar','إدريس أبكر'],['abbad','فارس عباد'],['basit','عبد الباسط عبد الصمد'],
  ['salmi','منصور السالمي'],['afasy','مشاري العفاسي'],['ayyub','محمد أيوب'],
  ['dosari','ياسر الدوسري'],['arkani','عبدالولي الأركاني'],['maher','ماهر المعيقلي'],
  ['amer','محمد حسين عامر']
 ];
 // Official names and the images shown alongside these readers on the Way2Quran
 // reciter pages. These are EMBEDDED URLs, not copied, repackaged or cached.
 // If an image is unavailable or the user is offline, show an offline avatar.
 var images={
  masad:'https://media.way2quran.com/imgs/abdul-rahman-musaad.jpg',
  dukhain:'https://media.way2quran.com/imgs/haitham-al-dukhin.jpg',
  ghamdi:'https://media.way2quran.com/imgs/saad-al-ghamdi.jpg'
 };
 var details={
  masad:'تلاوات ومقاطع مختارة بجودة عالية.',
  dukhain:'فهرس التلاوات يُستمد من المصدر الموثوق.',
  ghamdi:'المصحف المرتل والتسجيلات المتاحة.'
 };
 var timerOptions=[0,5,10,15,30,45,60];
 var observer=null,sheetObserver=null,renderPlanned=false,sheet=null,modal=null;
 var menuKey='',currentTrack='',openedAt=0,initialized=false,preventNextClick=false;
 var stats={decoratedReaders:0,decoratedTracks:0,menuOpens:0,playOptionsApplied:0,providerFallbacks:0,failures:[]};
 function $(id){return d.getElementById(id)}
 function el(tag,cls,text){var a=d.createElement(tag);if(cls)a.className=cls;if(text!==undefined)a.textContent=text;return a}
 function diag(s){stats.failures.push(String(s));if(stats.failures.length>8)stats.failures.shift()}
 function normalize(s){return String(s||'').replace(/[\u064b-\u065f\u0670ـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,'').toLowerCase()}
 function readerId(name){var n=normalize(name);for(var i=0;i<reciterNames.length;i++)if(normalize(reciterNames[i][1])===n)return reciterNames[i][0];return ''}
 function getAPI(){return w.__BASAIR_R109_SELECTED__}
 function getState(){var a=getAPI();return a&&a._test&&a._test.state||null}
 function readSettings(){try{var v=JSON.parse(w.localStorage.getItem(SETTINGS_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(_){return {}}}
 function writeSettings(data){try{w.localStorage.setItem(SETTINGS_KEY,JSON.stringify(data));return true}catch(_){diag('preferences-save-failed');return false}}
 function safeGet(key){var obj=readSettings();return obj[key]||{mode:'stop',timer:0}}
 function readerOfTrack(key){var state=getState();if(!state)return '';var item=(state.items||[]).filter(function(x){return x.key===key})[0];return item&&item.reader||state.reader&&state.reader.id||''}
 function itemOfTrack(key){var state=getState();return state&&(state.items||[]).filter(function(x){return x.key===key})[0]||null}
 function bestSettings(key){var all=readSettings();var reader=key.indexOf('reader:')===0?key.slice(7):readerOfTrack(key);return all[key]||all['reader:'+reader]||{mode:'stop',timer:0}}
 function radioMode(mode){var m=$('r109Mode'),r=$('r91Repeat');var state=getState();
  if(!state||!m||!r)return false;
  var mapped=mode==='repeat'?'repeat':mode==='next'?'next':'stop';
  m.value=mapped;m.dispatchEvent(new Event('change',{bubbles:true}));
  // R109 repeatLimit 0 loops the current track even when mode=next: never leave
  // stale repeat counts while switching modes.
  r.value=mode==='repeat'?'0':'1';r.dispatchEvent(new Event('change',{bubbles:true}));
  stats.playOptionsApplied++;return true;
 }
 function applyTrackOptions(key){var options=bestSettings(key),mode=options.mode;
  if(!['stop','repeat','next'].includes(mode))mode='stop';
  radioMode(mode);
  var state=getState(),track=itemOfTrack(key);
  if(track&&track.provider!=='tv'&&track.reader!=='masad'&&track.reader!=='basit'){
    if(options.timer>0&&state&&state.audio&&state.audio.paused===false){
      try{getAPI()._test.setTimer(options.timer)}catch(_){diag('timer-apply-failed')}
    }
  }
 }
 function initial(key){var n=readerId(key)||key;return n&&n[0]?n.charAt(0).toUpperCase():'۞'}
 function portrait(reciter){
  var fig=el('span','p104Portrait');fig.setAttribute('role','img');fig.setAttribute('aria-label','صورة أو رمز القارئ '+reciter);
  var fallback=el('span','p104Avatar','۞');fig.appendChild(fallback);
  var id=readerId(reciter),src=images[id];
  if(src&&/^https:\/\/media\.way2quran\.com\/imgs\/[a-z-]+\.jpg$/.test(src)){
    var img=el('img');img.alt=reciter;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
    img.onerror=function(){stats.providerFallbacks++;img.remove()};img.src=src;fig.appendChild(img);
  }
  return fig;
 }
 function hero(){
  var e=el('section','p104Hero');e.setAttribute('aria-label','بصائر القرآن');
  var logo=el('div','p104BrandLogo');var brand=el('img');brand.src='assets/brand-logo.webp';brand.alt='';brand.setAttribute('aria-hidden','true');logo.appendChild(brand);e.appendChild(logo);
  e.appendChild(el('b','p104BrandName','بصائر القرآن'));
  e.appendChild(el('small','p104BrandEnglish','BASAIR QURAN'));
  e.appendChild(el('span','p104Lantern right','♧'));e.appendChild(el('span','p104Lantern left','♧'));
  return e;
 }
 function decorateReaders(list){
  list.querySelectorAll('.r91ReaderCard:not([data-p104-ready])').forEach(function(card){
    card.dataset.p104Ready='1';
    var text=card.querySelector('.r91ReaderText b'),info=card.querySelector('.r91ReaderText small'),detailsEl=card.querySelector('.r91ReaderDetails');
    if(!text||!detailsEl)return;
    var name=text.textContent.trim(),id=readerId(name);
    detailsEl.insertBefore(portrait(name),detailsEl.firstChild);
    if(details[id]&&info)info.textContent=details[id];
    var actions=card.querySelector('.r91Actions');
    if(actions){
      // Keep official bulk downloader, and allow the existing TV Quran queue to
      // be requested only by an explicit user click.
      if(id==='masad'||id==='basit'){
        var old=actions.querySelector('.r91Note');
        if(old){var btn=el('button','r91Btn p104BulkTV','↓ تحميل الكل');btn.type='button';
          btn.addEventListener('click',function(){
            var openBtn=actions.querySelector('.r91Primary');
            if(openBtn)openBtn.click();
            w.setTimeout(function(){var real=$('r91BulkButton');if(real&&getState()&&getState().reader&&getState().reader.id===id)real.click();},0);
          });old.replaceWith(btn);
        }
      }
    }
    var opts=el('button','p104CardMenu','⋮');opts.type='button';opts.setAttribute('aria-label','خيارات تشغيل القارئ '+name);
    opts.addEventListener('click',function(){openOptions('reader:'+id,name)});
    card.appendChild(opts);stats.decoratedReaders++;
  });
 }
 function decorateTracks(list){
  list.querySelectorAll('.r109Track:not([data-p104-ready])').forEach(function(row){
    row.dataset.p104Ready='1';var key=row.dataset.key||'';if(!key)return;
    var title=row.querySelector('.r91TrackHeadline b');
    var opts=el('button','p104TrackMenu','⋮');opts.type='button';
    opts.setAttribute('aria-label','خيارات تشغيل '+(title&&title.textContent||'التلاوة'));
    opts.addEventListener('click',function(){openOptions(key,title&&title.textContent||'التلاوة')});
    row.appendChild(opts);
    var sourceButtons=row.querySelectorAll('.r109Actions .r91Subtle');
    sourceButtons.forEach(function(btn){if(btn.textContent.trim()==='المصدر')btn.textContent='↗ المشغل الأصلي'});
    stats.decoratedTracks++;
  });
 }
 function render(){renderPlanned=false;if(!sheet||sheet.hidden)return;var list=$('r108List');if(!list)return;
  decorateReaders(list);decorateTracks(list);
 }
 function schedule(){if(renderPlanned)return;renderPlanned=true;w.requestAnimationFrame(render)}
 function overlay(){
  if(modal)return modal;
  modal=el('div','p104OptionsOverlay');modal.id='p104OptionsOverlay';modal.hidden=true;modal.dir='rtl';
  var panel=el('section','p104OptionsSheet');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','خيارات تشغيل التسجيل');
  var handle=el('div','p104OptionsHandle');panel.appendChild(handle);
  var head=el('div','p104OptionsHead');head.appendChild(el('strong','p104OptionsTitle','⚙ خيارات التشغيل'));
  var close=el('button','p104OptionsClose','×');close.type='button';close.setAttribute('aria-label','إغلاق خيارات التشغيل');
  close.addEventListener('click',closeOptions);head.appendChild(close);panel.appendChild(head);
  var forEl=el('p','p104OptionsFor');forEl.id='p104OptionsFor';panel.appendChild(forEl);
  var kinds=[
   ['stop','■','توقّف عند النهاية','إيقاف الصوت بعد انتهاء التلاوة الحالية.'],
   ['repeat','↪','إعادة التشغيل','تكرار التسجيل الحالي حتى إيقافه.'],
   ['next','≡▶','تشغيل تلقائي للتالي','تشغيل التلاوة التالية من نفس القائمة.']
  ];
  kinds.forEach(function(v){
    var label=el('label','p104OptionRow');
    var icon=el('span','p104OptionIcon',v[1]);
    var content=el('span','p104OptionContent');content.appendChild(el('b','',v[2]));content.appendChild(el('small','',v[3]));
    var radio=el('input');radio.type='radio';radio.name='p104PlaybackMode';radio.value=v[0];
    radio.addEventListener('change',function(){if(radio.checked)saveSelection('mode',v[0]);});
    label.appendChild(icon);label.appendChild(content);label.appendChild(radio);panel.appendChild(label);
  });
  var timerTitle=el('div','p104OptionRow');var ico=el('span','p104OptionIcon','◷');var wrap=el('span','p104OptionContent');
  wrap.appendChild(el('b','','مؤقت الإيقاف'));wrap.appendChild(el('small','','إيقاف التشغيل بعد مدة تختارها.'));
  timerTitle.appendChild(ico);timerTitle.appendChild(wrap);panel.appendChild(timerTitle);
  var choice=el('div','p104TimerChoices');choice.id='p104TimerChoices';timerOptions.forEach(function(n){
    var b=el('button','',n===0?'بدون مؤقت':n===60?'60 دقيقة':n+' دقائق');b.type='button';b.dataset.minutes=String(n);
    b.addEventListener('click',function(){saveSelection('timer',n)});choice.appendChild(b);
  });panel.appendChild(choice);
  var note=el('p','p104OptionsNote','الخيارات تخص المشغل الداخلي. التسجيلات التي يفتحها مشغل الموقع تخضع لإعدادات ذلك الموقع.');panel.appendChild(note);
  modal.appendChild(panel);d.body.appendChild(modal);
  modal.addEventListener('click',function(e){if(e.target===modal)closeOptions()});
  return modal;
 }
 function openOptions(key,label){
  menuKey=key;openedAt=Date.now();var data=bestSettings(key);var o=overlay();
  $('p104OptionsFor').textContent=label||'التلاوة';
  o.querySelectorAll('input[name="p104PlaybackMode"]').forEach(function(r){r.checked=r.value===(data.mode||'stop')});
  o.querySelectorAll('#p104TimerChoices button').forEach(function(b){b.setAttribute('aria-pressed',String(Number(b.dataset.minutes)===(data.timer||0)))});
  o.hidden=false;stats.menuOpens++;o.querySelector('.p104OptionsClose').focus();
 }
 function closeOptions(){if(!modal||modal.hidden)return false;modal.hidden=true;menuKey='';return true}
 function saveSelection(key,value){if(!menuKey)return;var all=readSettings();var obj=all[menuKey]||{mode:'stop',timer:0};obj[key]=value;all[menuKey]=obj;writeSettings(all);
  if(key==='timer'){
    modal.querySelectorAll('#p104TimerChoices button').forEach(function(b){b.setAttribute('aria-pressed',String(Number(b.dataset.minutes)===value))});
    var state=getState();if(state&&state.audio&&state.playing&&state.playing.key===menuKey){try{getAPI()._test.setTimer(value)}catch(_){diag('timer-live-failed')}}
  }else{
    var state=getState();if(state&&state.playing&&state.playing.key===menuKey)radioMode(value);
  }
 }
 function boot(){
  var api=getAPI();sheet=$('r108Sheet');if(!api||!sheet){diag('r109-not-installed');return false}
  if(initialized)return true;initialized=true;
  sheet.classList.add('p104-ui');var panel=$('r108Panel');if(!panel)return false;
  if(!panel.querySelector('.p104Hero'))panel.insertBefore(hero(),panel.firstChild);
  overlay();
  var list=$('r108List');if(list){
    observer=new MutationObserver(schedule);observer.observe(list,{childList:true,subtree:true});
    list.addEventListener('click',function(e){
      var b=e.target&&e.target.closest&&e.target.closest('.r109Track .r109Actions .r91Primary');
      if(!b)return;var row=b.closest('.r109Track');if(!row||!row.dataset.key)return;
      currentTrack=row.dataset.key;radioMode(bestSettings(currentTrack).mode||'stop');
      var options=bestSettings(currentTrack);
      if(options.timer>0){try{api._test.setTimer(options.timer)}catch(_){diag('timer-apply-failed')}}
      else{try{api._test.setTimer(0)}catch(_){}}
    },true);
  }
  sheetObserver=new MutationObserver(function(){if(sheet.hidden)closeOptions();else schedule()});
  sheetObserver.observe(sheet,{attributes:true,attributeFilter:['hidden']});
  var back=api.back,close=api.close;
  if(typeof back==='function')api.back=function(){if(closeOptions())return true;return back.apply(this,arguments)};
  if(typeof close==='function')api.close=function(){closeOptions();return close.apply(this,arguments)};
  // Original R109 close/back DOM uses its local functions, so capture only
  // when our options sheet is visible. Do not interfere with P103 hardware Back.
  sheet.addEventListener('click',function(e){if(!modal.hidden&&e.target&&e.target.closest&&e.target.closest('#r108Close,#r108Back')){
    closeOptions();e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
  }},true);
  w.addEventListener('keydown',function(e){if(!modal||modal.hidden)return;
    if(e.key==='Escape'||e.key==='Backspace'||e.key==='BrowserBack'){
      if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;
      e.preventDefault();e.stopImmediatePropagation();closeOptions();
    }
  },true);
  schedule();return true;
 }
 w.__BASAIR_P104_SELECTED_UI__={version:VERSION,install:boot,openOptions:openOptions,closeOptions:closeOptions,
  diagnostics:function(){return {version:VERSION,installed:initialized,visible:!!(sheet&&!sheet.hidden),
   portraits:stats.decoratedReaders,tracks:stats.decoratedTracks,options:stats.menuOpens,
   applied:stats.playOptionsApplied,imageFallbacks:stats.providerFallbacks,failures:stats.failures.slice()}}
 };
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);
