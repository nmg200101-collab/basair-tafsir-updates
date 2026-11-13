/* P145 OWNER-QA Tafsir-only UX: one top mic, reliable Muyassar loading, safe source return. */
(function(w,d){'use strict';
 var VERSION='P145-TOP-CONTROLS-MUYASSAR-RETURN-OWNER-QA';
 if(w.__BASAIR_TAFSIR_P145__&&w.__BASAIR_TAFSIR_P145__.version===VERSION)return;
 var ROOT='https://raw.githubusercontent.com/nmg200101-collab/basair-tafsir-updates/main/public-assets/tafsir-muyassar/v1/surahs/';
 var stats={controls:0,repositioned:0,duplicatePruned:0,fetchFallback:0,cacheWrites:0,retryShown:0,externalOpened:0};
 var observe=null,debounce=0,slowTimers=[],surahRequests=new Map(),baseMuyassar=null,seenCore=null,modalBack=false,sourceModal=null;
 function E(id){return d.getElementById(id)}
 function open(){var r=E('tafsirReader');return !!(r&&r.classList.contains('active'))}
 function style(el,key,value){if(el&&el.style&&typeof el.style.setProperty==='function'&&
   (el.style.getPropertyValue(key)!==value||el.style.getPropertyPriority(key)!=='important'))
   el.style.setProperty(key,value,'important')}
 function compact(el){if(!el)return;
  [['box-sizing','border-box'],['display','inline-flex'],['flex-direction','column'],['align-items','center'],
  ['justify-content','center'],['width','49px'],['min-width','49px'],['max-width','49px'],
  ['height','44px'],['min-height','44px'],['max-height','44px'],['padding','3px 2px'],
  ['margin','0 2px'],['gap','1px'],['border-radius','11px'],['font-size','10px'],
  ['line-height','1.05']].forEach(function(p){style(el,p[0],p[1])});
 }
 function topRow(row){
  if(!row||typeof row.querySelector!=='function')return false;
  var mic=row.querySelector('button.p144MicButton'),note=row.querySelector('button.p144NoteChip,button.b263r3NoteChip');
  if(!mic&&!note)return false;
  var strip=row.querySelector('.p145TopControls'),head=row.querySelector('.v194T2Qrow'),body=row.querySelector('.v194T2Body');
  if(!strip){strip=d.createElement('div');strip.className='p145TopControls';strip.setAttribute('role','group');strip.setAttribute('aria-label','أدوات هذه الآية');
   if(head&&head.parentElement===row)head.insertAdjacentElement('afterend',strip);
   else if(body&&body.parentElement===row)row.insertBefore(strip,body);
   else row.insertBefore(strip,row.firstChild);stats.controls++;
  }else if(head&&head.parentElement===row&&strip.previousElementSibling!==head){
   head.insertAdjacentElement('afterend',strip);
  }
  if(note&&note.parentNode!==strip){strip.appendChild(note);stats.repositioned++}
  if(mic&&mic.parentNode!==strip){strip.appendChild(mic);stats.repositioned++}
  compact(note);compact(mic);
  // Retain the original note button and narrator button (no cloned handlers).
  var all=row.querySelectorAll('button.p144MicButton');
  for(var i=1;i<all.length;i++){all[i].hidden=true;all[i].disabled=true;stats.duplicatePruned++}
  var other=row.querySelector('.basairB231AyahActions');
  if(other){
   style(other,'max-height','58px');style(other,'padding','2px');style(other,'gap','3px');
   var buttons=other.children;
   for(var j=0;j<buttons.length;j++){if(buttons[j].tagName!=='BUTTON')continue;
    style(buttons[j],'height','46px');style(buttons[j],'min-height','44px');
    style(buttons[j],'max-height','46px');style(buttons[j],'padding','2px');
   }
  }
  return true;
 }
 function sweep(){
  if(!open())return;
  var host=E('tafsirAyahs');if(!host)return;
  var rows=host.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
  for(var i=0;i<rows.length;i++)topRow(rows[i]);
  var tabs=E('basairTafsirPrimaryTabs');
  if(tabs)tabs.setAttribute('data-p145-tabs','ready');
 }
 function schedule(){if(debounce)return;debounce=w.setTimeout(function(){debounce=0;sweep();syncLoader()},110)}
 function state(){var a=w.__BASAIR_TAFSIR_STEP2__;try{return a&&a.state?a.state():null}catch(_){return null}}
 function key(s){return ('000'+s).slice(-3)}
 function valid(d,s,a){return !!(d&&Number(d.s||s)===s&&Array.isArray(d.ayahs)&&
   d.ayahs.length>=a&&String(d.ayahs[a-1]||'').trim())}
 function fetchBounded(url,ms){
  var ctrl=typeof w.AbortController==='function'?new AbortController():null;
  var stop=w.setTimeout(function(){if(ctrl)ctrl.abort()},ms);
  return w.fetch(url,{mode:'cors',cache:'no-store',credentials:'omit',redirect:'error',
   signal:ctrl?ctrl.signal:undefined}).then(function(res){if(!res.ok)throw Error('HTTP '+res.status);return res.json()})
   .finally(function(){w.clearTimeout(stop)});
 }
 function cacheSurah(data){
  if(!w.indexedDB)return Promise.resolve(data);
  return new Promise(function(resolve){
   var req;try{req=indexedDB.open('basair-tafsir-library-v2',1)}catch(_){resolve(data);return}
   req.onupgradeneeded=function(){if(!req.result.objectStoreNames.contains('surahs'))
    req.result.createObjectStore('surahs',{keyPath:'k'})};
   req.onerror=function(){resolve(data)};
   req.onsuccess=function(){
    var db=req.result;try{
     var tx=db.transaction('surahs','readwrite');
     tx.objectStore('surahs').put(data);tx.oncomplete=function(){stats.cacheWrites++;db.close();resolve(data)};
     tx.onerror=function(){db.close();resolve(data)};
     tx.onabort=function(){db.close();resolve(data)};
    }catch(_){db.close();resolve(data)}
   };
  });
 }
 function fetchFull(s){
  if(surahRequests.has(s))return surahRequests.get(s);
  var url=ROOT+key(s)+'.json',attempt=0;
  function load(){attempt++;return fetchBounded(url,11000).catch(function(e){
   if(attempt>=2||w.navigator.onLine===false)throw e;
   return new Promise(function(resolve){w.setTimeout(resolve,450)}).then(load);
  })}
  var p=load().then(function(j){
   if(j.schema!=='basair-muyassar-surah-v1'||Number(j.s)!==s||
      !Array.isArray(j.ayahs)||j.ayahs.length!==Number(j.ayah_count)||
      j.ayahs.some(function(v){return typeof v!=='string'||!v.trim()}))throw Error('Invalid surah data');
   var data={k:'muyassar:'+s,type:'muyassar',s:s,source:'التفسير الميسر · QuranEnc',
    provider:'QuranEnc',sourceKey:'arabic_moyassar',saved:Date.now(),ayahs:j.ayahs};
   return cacheSurah(data);
  }).finally(function(){surahRequests.delete(s)});
  surahRequests.set(s,p);return p;
 }
 function installLoader(){
  var core=w.__BASAIR_TAFSIR_CORE__,step=w.__BASAIR_TAFSIR_STEP2__;
  if(!core||!step||typeof core.getMuyassarSurah!=='function')return;
  if(core.getMuyassarSurah.__p145)return;
  if(!baseMuyassar||seenCore!==core){baseMuyassar=core.getMuyassarSurah;seenCore=core}
  var original=core.getMuyassarSurah;
  function enhanced(s,allowNetwork){
   s=Number(s)||1;
   if(allowNetwork===false||w.navigator.onLine===false)return original.apply(core,arguments);
   var st=state(),a=Math.max(1,Number(st&&st.s)===s?st.a:1)||1;
   var stale=function(){var curr=state();return curr&&Number(curr.s)===s&&Number(curr.a)===a};
   var backupTimer=0;
   return new Promise(function(resolve,reject){
    var done=false,failed=0;
    function winner(d,source){if(done)return;
     if(!valid(d,s,a)){failure();return}
     done=true;if(backupTimer)w.clearTimeout(backupTimer);
     if(source==='fallback')stats.fetchFallback++;
     // Step2's original async renderer has no request token; do not render old
     // surah/verse after the reader has moved elsewhere.
     if(!stale()){resolve(new Promise(function(){}));return}
     resolve(d);
    }
    function failure(){if(done)return;if(++failed>=2){done=true;reject(Error('مصدر التفسير غير متاح؛ استخدم إعادة المحاولة'))}}
    Promise.resolve().then(function(){return original.call(core,s,true)}).then(function(v){winner(v,'original')},failure);
    function backup(){fetchFull(s).then(function(v){winner(v,'fallback')},failure)}
    backupTimer=w.setTimeout(backup,1350);
   });
  }
  enhanced.__p145=true;enhanced.original=original;
  core.getMuyassarSurah=enhanced;
 }
 function syncLoader(){
  if(!open())return;
  var step=w.__BASAIR_TAFSIR_STEP2__,st=state(),h=E('tafsirAyahs');
  if(!h||!step||!st||st.type!=='muyassar')return;
  var pending=h.querySelector('.v194T2Loading');
  if(!pending)return;
  if(pending.getAttribute('data-p145-retry')==='1')return;
  pending.setAttribute('data-p145-retry','1');
  var target=String(st.s)+':'+String(st.a),t=w.setTimeout(function(){
   if(!pending.isConnected||!open())return;
   var cur=state();if(!cur||cur.type!=='muyassar'||String(cur.s)+':'+String(cur.a)!==target)return;
   var p=d.createElement('p');p.className='p145WaitHint';p.textContent='التحميل يستغرق وقتًا أطول من المعتاد؛ يمكنك إعادة المحاولة دون فقد موضع الآية.';
   var b=d.createElement('button');b.type='button';b.className='p145Retry';b.textContent='إعادة تحميل هذه الآية';
   b.onclick=function(){var n=state();if(!n||typeof step.open!=='function')return;
    step.open(n.s,n.a,'muyassar')};
   pending.appendChild(p);pending.appendChild(b);stats.retryShown++;
  },6500);
  slowTimers.push(t);
  if(slowTimers.length>30){w.clearTimeout(slowTimers.shift())}
 }
 function safeUrl(value){
  try{var u=new URL(value,w.location.href);return u.protocol==='https:'?u.href:null}catch(_){return null}
 }
 function ensureSource(){
  if(sourceModal)return sourceModal;
  var panel=d.createElement('div');panel.id='p145SourceOverlay';panel.hidden=true;
  panel.innerHTML='<div class="p145SourceSheet" role="dialog" aria-modal="true" aria-label="المصدر الخارجي">'+
   '<header><button type="button" id="p145SourceBack">رجوع إلى التفسير</button><b>مصدر التفسير</b></header>'+
   '<p>يظهر المصدر هنا دون مغادرة تطبيق القرآن. إذا منع الموقع العرض الداخلي، استخدم «فتح في المتصفح».</p>'+
   '<iframe id="p145SourceFrame" sandbox="allow-scripts allow-forms allow-popups" referrerpolicy="no-referrer" title="المصدر الخارجي"></iframe>'+
   '<footer><a id="p145SourceExternal" target="_blank" rel="noopener noreferrer">فتح في المتصفح</a></footer></div>';
  d.body.appendChild(panel);sourceModal=panel;
  panel.querySelector('#p145SourceBack').onclick=closeSource;
  panel.addEventListener('click',function(e){if(e.target===panel)closeSource()});
  return panel;
 }
 function openSource(url){
  url=safeUrl(url);if(!url||!open())return false;
  var panel=ensureSource(),frame=panel.querySelector('#p145SourceFrame'),ext=panel.querySelector('#p145SourceExternal');
  ext.href=url;frame.src=url;panel.hidden=false;
  stats.externalOpened++;return true;
 }
 function closeSource(){
  if(!sourceModal||sourceModal.hidden)return false;
  sourceModal.hidden=true;var frame=sourceModal.querySelector('#p145SourceFrame');
  frame.removeAttribute('src');return true;
 }
 function handleExternal(e){
  if(!open()||e.defaultPrevented)return;
  var el=e.target&&e.target.closest&&e.target.closest('a[href],#b243OpenMuyassarSource');
  if(!el||!el.closest('#tafsirReader,#tafsirAyahs,#b243TafsirSourcesModal'))return;
  var url=el.getAttribute('href');
  if(el.id==='b243OpenMuyassarSource'){
   var s=state();if(!s)return;
   url='https://quranenc.com/ar/browse/arabic_moyassar/'+Number(s.s||1)+'/'+Number(s.a||1);
  }
  if(!safeUrl(url))return;
  e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
  openSource(url);
 }
 function init(){
  if(!E('tafsirReader'))return false;
  installLoader();sweep();syncLoader();
  var host=E('tafsirAyahs');
  if(host&&!observe&&w.MutationObserver){observe=new MutationObserver(schedule);observe.observe(host,{childList:true,subtree:true})}
  return true;
 }
 // Capture before old B243 document click listener, which otherwise navigates
 // the app WebView to an external website when window.open returns null.
 w.addEventListener('click',handleExternal,true);
 d.addEventListener('keydown',function(e){if(e.key==='Escape'&&closeSource()){e.preventDefault();e.stopPropagation()}});
 var attempts=0;function ready(){if(init())return;if(attempts++<36)w.setTimeout(ready,250)}
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
 w.setInterval(function(){if(open()){installLoader();sweep();syncLoader()}},1800);
 w.__BASAIR_TAFSIR_P145__={version:VERSION,refresh:sweep,openSource:openSource,closeSource:closeSource,
  fetchFull:fetchFull,status:function(){return Object.assign({mounted:!!observe,reader:open(),loaderInstalled:!!(seenCore&&seenCore.getMuyassarSurah.__p145)},stats)}};
})(window,document);
