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
