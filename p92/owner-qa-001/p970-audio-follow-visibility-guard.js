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
