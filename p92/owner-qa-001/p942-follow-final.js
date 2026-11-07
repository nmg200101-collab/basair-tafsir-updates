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
 w.addEventListener('click',interceptBack,true);
 function baseBack(){var h=w.__BASAIR_HOME_STEP117__;if(h&&typeof h.back==='function')return h.back();var h2=w.__BASAIR_HOME_STEP116__;if(h2&&typeof h2.back==='function')return h2.back();return false}
 var nativeBridge=function(){if(reader()){markOwned();if(owned&&leaveReader())return false;}return baseBack()};
 nativeBridge.__p942=true;
 function assertBack(){if(reader()&&owned){try{w.basairBack=nativeBridge}catch(e){}}}
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
 function retargetClick(ev){if(!activeAudio()||state()?.paused)return;var t=targetAt(ev);if(!t)return;
  var ctrl=c(),method=isPrinted()?'retargetPrintAyah':'retargetDigitalAyah';if(!ctrl||typeof ctrl[method]!=='function')return;
  var ok=false;try{ok=ctrl[method](t)===true}catch(e){}
  if(ok){pendingSelection=Date.now();stats.retarget++;ev.preventDefault();ev.stopImmediatePropagation();ev.stopPropagation()}
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
