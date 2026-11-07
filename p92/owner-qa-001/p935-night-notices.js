/* BASAIR QURAN P93.5 OWNER-QA-007: live V690 print-controls + in-app update bell.
 * Visual WebView patch only; no Quran text, native Android or audio changes.
 * Uses V690 BasairP92.check(), which verifies the owner's RSA-SHA256 signature.
 */
(function(){
 'use strict';
 if(window.__BASAIR_P935_NIGHT_NOTICES__)return;
 var KEY='basair:p933:night-print-brightness', INBOX='basair:home:inbox:v559';
 var MIN=55,MAX=120,STEP=5,DEFAULT=100;var level=DEFAULT,railObserver,bodyObserver,scheduled=false,lastCheck=0,pendingId='',checkBusy=false;
 function clamp(v){v=Number(v);return Number.isFinite(v)?Math.max(MIN,Math.min(MAX,Math.round(v/STEP)*STEP)):DEFAULT;}
 try{var saved=localStorage.getItem(KEY);if(saved!==null)level=clamp(saved);}catch(_e){}
 function night(){var b=document.body,r=document.documentElement;return !!(b&&(b.classList.contains('dark')||b.classList.contains('night'))||(r&&(r.classList.contains('dark')||r.classList.contains('night'))));}
 function printed(){var b=document.body;return !!(b&&b.classList.contains('reader-active')&&!b.classList.contains('stableDigital')&&!b.classList.contains('h25-hifz')&&!b.classList.contains('h90-review')&&!b.classList.contains('h100-teacher'));}
 function enabled(){return night()&&printed();}
 function setLevel(v,store){level=clamp(v);if(store){try{localStorage.setItem(KEY,String(level))}catch(_e){}}updateLevel();}
 function updateLevel(){
  document.documentElement.style.setProperty('--p933-night-page-brightness',enabled()?String(level/100):'1');
  var bar=document.getElementById('p935NightControls');if(!bar)return;
  bar.hidden=!enabled();
  var output=bar.querySelector('output'),input=bar.querySelector('input[type=range]');
  if(output)output.textContent=String(level)+'%';if(input&&document.activeElement!==input)input.value=String(level);
 }
 function createBar(){
  var bar=document.createElement('section');bar.id='p935NightControls';bar.className='p935-night-controls';bar.dir='rtl';bar.hidden=true;
  bar.setAttribute('role','group');bar.setAttribute('aria-label','إضاءة طبعات المصحف في الوضع الليلي');
  bar.innerHTML='<div class="p935-night-heading"><strong>☾ إضاءة صفحة المصحف</strong><output for="p935NightRange">100%</output></div>'+
   '<div class="p935-night-row"><button type="button" data-p935="minus" aria-label="خفض الإضاءة">−</button><input id="p935NightRange" type="range" min="55" max="120" step="5" value="100" aria-label="درجة إضاءة المصحف"><button type="button" data-p935="plus" aria-label="رفع الإضاءة">+</button></div>'+
   '<div class="p935-night-foot"><span>الصفحة فقط · لا يغيّر سطوع الهاتف</span><button type="button" data-p935="reset">افتراضي</button></div>';
  bar.querySelector('input').addEventListener('input',function(e){setLevel(e.target.value,true)});
  bar.addEventListener('click',function(e){var btn=e.target.closest('button[data-p935]');if(!btn)return;var op=btn.getAttribute('data-p935');setLevel(op==='minus'?level-STEP:op==='plus'?level+STEP:DEFAULT,true)});
  return bar;
 }
 function install(){
  var rail=document.getElementById('ayahSideRail'),panel=document.getElementById('v14PrintQuick');
  if(rail&&!railObserver&&window.MutationObserver){
   railObserver=new MutationObserver(schedule);railObserver.observe(rail,{childList:true,subtree:true});
  }
  if(!panel||!panel.isConnected){if(rail){var fallback=document.getElementById('p935NightControls')||createBar();if(fallback.parentElement!==rail)rail.appendChild(fallback);}updateLevel();return false;}
  var grid=panel.querySelector('.v14PrintQuickGrid')||panel;
  var bar=document.getElementById('p935NightControls');if(!bar)bar=createBar();
  if(grid===panel){if(bar.parentElement!==panel)panel.appendChild(bar)}else if(bar.parentElement!==panel||bar.previousElementSibling!==grid){grid.insertAdjacentElement('afterend',bar)}
  updateLevel();return true;
 }
 function sync(){scheduled=false;install();badge();}
 function schedule(){if(scheduled)return;scheduled=true;(window.requestAnimationFrame||function(fn){Promise.resolve().then(fn)})(sync);}
 function retryAfterTools(){schedule();[80,240,600,1200].forEach(function(ms){setTimeout(schedule,ms)})}
 document.addEventListener('pointerup',function(e){if(e.target&&e.target.closest&&e.target.closest('#ayahSideHandle,#ayahSideRail,[data-bq="tilawa"],.mushafDock,#h25PageTools'))retryAfterTools();},true);
 document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#ayahSideHandle,#ayahSideRail,[data-bq="tilawa"],.mushafDock,#h25PageTools'))retryAfterTools();},true);
 if(window.MutationObserver&&document.body){bodyObserver=new MutationObserver(schedule);bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class']});}
 // The rail already exists in V690 markup. Observe it even if its print section is created later.
 install();
 document.addEventListener('DOMContentLoaded',retryAfterTools,{once:true});
 // Bound initialization only, not a permanent layout polling loop.
 var warm=0,warmTimer=setInterval(function(){install();if(++warm>=12)clearInterval(warmTimer)},500);
 function inbox(){try{var x=JSON.parse(localStorage.getItem(INBOX)||'[]');return Array.isArray(x)?x:[]}catch(_e){return []}}
 function unread(){return inbox().filter(function(n){return n&&typeof n.id==='string'&&n.id.indexOf('remote-')===0&&!n.read}).length;}
 function badge(){
  var btn=document.querySelector('#v521Home .bq-service-button[data-bq="notices"]');if(!btn)return;
  btn.classList.add('p935-notice-anchor');var n=btn.querySelector('.p935-notice-badge');if(!n){n=document.createElement('span');n.className='p935-notice-badge';n.setAttribute('aria-hidden','true');btn.appendChild(n)}
  var num=unread();n.hidden=!num;n.textContent=num>9?'9+':String(num);
 }
 function getUpdateApi(){var api=window.BasairP92;return api&&typeof api.check==='function'?api:null;}
 function dispatchVerified(info){if(!info||!info.newer||!info.manifest||!info.manifest.id)return false;
  pendingId=info.manifest.id;
  var detail={id:info.manifest.id,title:'تحديث بصائر القرآن متاح: '+String(info.manifest.title||info.manifest.id)};
  window.dispatchEvent(new CustomEvent('basair:p92-notice',{detail:detail}));setTimeout(badge,0);return true;
 }
 async function checkUpdates(force){
  if(document.hidden||checkBusy)return false;
  var now=Date.now(),ttl=force?30000:5*60*1000;
  if(now-lastCheck<ttl)return false;
  var api=getUpdateApi();if(!api)return false;
  lastCheck=now;checkBusy=true;
  try{var info=await api.check();return dispatchVerified(info)}catch(_e){return false}finally{checkBusy=false;badge();}
 }
 window.addEventListener('basair:p92-notice',function(e){if(e.detail&&e.detail.id)pendingId=e.detail.id;setTimeout(badge,0)});
 // Original home controller handles the actual in-app inbox. We add a visible bell badge and a direct action.
 function enhanceInbox(){
  var panel=document.getElementById('bqNoticesSheet');if(!panel)return;
  if(!panel.querySelector('#p935OpenUpdates')){
   var action=document.createElement('button');action.id='p935OpenUpdates';action.type='button';action.textContent='فحص تحديثات التطبيق';
   action.addEventListener('click',function(){var api=getUpdateApi();if(api&&typeof api.open==='function')api.open()});
   var header=panel.querySelector('header');if(header)header.insertAdjacentElement('afterend',action);
  }
 }
 document.addEventListener('click',function(e){
  if(e.target&&e.target.closest&&e.target.closest('[data-bq="notices"]')){enhanceInbox();checkUpdates(true);setTimeout(badge,60)}
  if(e.target&&e.target.closest&&e.target.closest('[data-bq="notice-read"]'))setTimeout(badge,80);
 },true);
 window.addEventListener('pageshow',function(){retryAfterTools();checkUpdates(false)});
 document.addEventListener('visibilitychange',function(){if(!document.hidden){retryAfterTools();checkUpdates(false)}});
 setTimeout(function(){enhanceInbox();badge();checkUpdates(false)},3000);
 // Only check while app/WebView is running. Closed-app Android push is not provided by this patch.
 setInterval(function(){if(!document.hidden){checkUpdates(false);badge()}},15*60*1000);
 window.__BASAIR_P935_NIGHT_NOTICES__={version:'P93.5-QA007',install:install,sync:retryAfterTools,setLevel:function(v){setLevel(v,true)},level:function(){return level},check:function(){return checkUpdates(true)},badge:badge,diagnostics:function(){var b=document.getElementById('p935NightControls');return {night:night(),printed:printed(),rail:!!document.getElementById('ayahSideRail'),printPanel:!!document.getElementById('v14PrintQuick'),brightnessMounted:!!b,brightnessVisible:!!(b&&!b.hidden&&b.getClientRects().length),unreadUpdates:unread(),pendingId:pendingId}}};
})();
