/* P148 OWNER-QA Tafsir-only: stable note anchor + compact, legible Surah lesson cards. Preserve P147 loading and sources. */
(function(w,d){'use strict';
 var VERSION='P148-LESSONS-NOTE-ANCHOR-OWNER-QA';
 if(w.__BASAIR_TAFSIR_P148__&&w.__BASAIR_TAFSIR_P148__.version===VERSION)return;
 var ROOT='https://raw.githubusercontent.com/nmg200101-collab/basair-tafsir-updates/main/public-assets/tafsir-muyassar/v1/surahs/';
 var stats={controls:0,repositioned:0,duplicatePruned:0,fetchFallback:0,cacheWrites:0,retryShown:0,externalOpened:0};
 var observe=null,debounce=0,slowTimers=[],surahRequests=new Map(),baseMuyassar=null,seenCore=null,modalBack=false,sourceModal=null;
 var stableNoteByRow=new WeakMap();
 var rowNoteWatchers=new WeakMap();
 var noteAudit={repairs:0,legacyCollisions:0,listenerKept:0};
 function noteObserver(row,actions,note){
  if(!w.MutationObserver||!row||!actions||!note)return;
  var info=rowNoteWatchers.get(row);
  if(!info){
   info={queued:false,watched:new WeakSet(),observer:null};
   info.observer=new w.MutationObserver(function(mutations){
    if(!open()||!row.isConnected)return;
    if(mutations.some(function(m){return m.type==='attributes'&&m.target===actions&&
      m.attributeName==='style'}))noteAudit.legacyCollisions++;
    if(info.queued)return;
    info.queued=true;
    // Microtask repair runs before the next paint; no 110ms flicker after
    // the older P144 four-column inline style or original note relocation.
    Promise.resolve().then(function(){
     info.queued=false;
     if(!open()||!row.isConnected)return;
     topRow(row);noteAudit.repairs++;
    });
   });
   rowNoteWatchers.set(row,info);
  }
  [actions,note].forEach(function(el){
   if(info.watched.has(el))return;
   info.observer.observe(el,{
    attributes:true,attributeFilter:['style','hidden','disabled'],
    childList:el===actions,subtree:false
   });
   info.watched.add(el);
  });
 }
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
  // Move EXISTING buttons only: do not duplicate listeners, Quran text,
  // original note storage handlers, or P144 TTS settings.
  var mic=row.querySelector('button.p144MicButton');
  var note=row.querySelector('button.p144NoteChip,button.b263r3NoteChip');
  if(!mic&&!note)return false;
  var head=row.querySelector('.v194T2Qrow'),body=row.querySelector('.v194T2Body');
  var micHost=row.querySelector('.p146TopMic');
  if(mic){
   if(!micHost){
    micHost=d.createElement('div');micHost.className='p146TopMic';
    micHost.setAttribute('role','group');
    micHost.setAttribute('aria-label','ناطق الآية');
    if(head&&head.parentNode===row)head.insertAdjacentElement('afterend',micHost);
    else if(body&&body.parentNode===row)row.insertBefore(micHost,body);
    else row.insertBefore(micHost,row.firstChild);
    stats.controls++;
   }else if(head&&head.parentNode===row&&micHost.previousElementSibling!==head){
    head.insertAdjacentElement('afterend',micHost);
   }
   if(mic.parentNode!==micHost){micHost.appendChild(mic);stats.repositioned++}
   compact(mic);
  }else if(micHost){micHost.remove()}
  // P147: retain exactly one ORIGINAL note button; do not clone its handlers.
  // Keep the note in the actual four-button verse toolbar (fifth compact tool).
  var actions=row.querySelector('.basairB231AyahActions');
  var notes=row.querySelectorAll('button.b263r3NoteChip,button.p144NoteChip,button[data-r3-note-pos]');
  var canonical=null,previous=stableNoteByRow.get(row);
  if(previous&&row.contains(previous)&&!previous.disabled)canonical=previous;
  // Reuse only the real, enabled note button: no duplicate event handlers.
  if(!canonical)for(var pass=0;pass<3&&!canonical;pass++){
   for(var n=0;n<notes.length;n++){
    var candidate=notes[n];
    if(candidate.disabled||candidate.hidden)continue;
    if((pass===0&&candidate.hasAttribute('data-r3-note-pos'))||
       (pass===1&&candidate.classList.contains('b263r3NoteChip'))||
       pass===2){canonical=candidate;break}
   }
  }
  if(canonical)stableNoteByRow.set(row,canonical);
  for(var z=0;z<notes.length;z++){
   if(notes[z]===canonical)continue;
   if(!notes[z].hidden)stats.duplicatePruned++;
   if(!notes[z].hidden)notes[z].hidden=true;
   if(!notes[z].disabled)notes[z].disabled=true;
   if(notes[z].getAttribute('aria-hidden')!=='true')notes[z].setAttribute('aria-hidden','true');
   style(notes[z],'display','none');
  }
  if(canonical&&actions){
   canonical.classList.add('p148NoteTool','p144NoteChip');
   if(canonical.hidden)canonical.hidden=false;
   if(canonical.getAttribute('aria-hidden')==='true')canonical.removeAttribute('aria-hidden');
   if(canonical.parentElement!==actions){actions.appendChild(canonical);stats.repositioned++}
   else if(actions.lastElementChild!==canonical){actions.appendChild(canonical);stats.repositioned++}
   if(actions.getAttribute('data-p148-notes')!=='locked')actions.setAttribute('data-p148-notes','locked');
   // Exactly five independent original buttons, no recreated listeners.
   [['display','grid'],['grid-template-columns','repeat(5,minmax(0,1fr))'],
    ['height','auto'],['min-height','44px'],['max-height','none'],
    ['overflow','visible'],['gap','3px'],['padding','2px']
   ].forEach(function(pair){style(actions,pair[0],pair[1])});
   [['box-sizing','border-box'],['display','flex'],['flex-direction','column'],
    ['align-items','center'],['justify-content','center'],['flex','1 1 0'],
    ['width','100%'],['min-width','0'],['max-width','100%'],
    ['height','44px'],['min-height','44px'],['max-height','44px'],
    ['padding','2px 1px'],['margin','0'],['gap','0'],
    ['font-size','9px'],['line-height','1.12'],['border-radius','8px']
   ].forEach(function(pair){style(canonical,pair[0],pair[1])});
   noteObserver(row,actions,canonical);
  }else if(actions&&actions.getAttribute('data-p148-notes')==='locked'){
   actions.removeAttribute('data-p148-notes');
  }
  var staleHost=row.querySelector('.p146BottomNote');
  if(staleHost&&!staleHost.children.length)staleHost.remove();
  var all=row.querySelectorAll('button.p144MicButton');
  for(var i=1;i<all.length;i++){all[i].hidden=true;all[i].disabled=true;stats.duplicatePruned++}
  var other=row.querySelector('.basairB231AyahActions');
  if(other){
   style(other,'max-height',canonical?'none':'58px');
   style(other,'padding','2px');style(other,'gap','3px');
   if(canonical)style(other,'grid-template-columns','repeat(5,minmax(0,1fr))');
   var buttons=other.children;
   for(var j=0;j<buttons.length;j++){if(buttons[j].tagName!=='BUTTON')continue;
    style(buttons[j],'height','44px');style(buttons[j],'min-height','44px');
    style(buttons[j],'max-height','44px');style(buttons[j],'padding','2px');
   }
  }
  return true;
 }
 // P147 night-mode detection: V695 may set .dark on HTML rather than BODY.
 // Read rendered backgrounds as a fallback; never infer solely from OS preference.
 function darkRgb(v){
  var m=String(v||'').match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/i);
  if(!m||m[4]!==undefined&&Number(m[4])<0.15)return null;
  var r=Number(m[1]),g=Number(m[2]),b=Number(m[3]);
  return (0.2126*r+0.7152*g+0.0722*b)<110;
 }
 function isNight(){
  var body=d.body,html=d.documentElement;
  function darkFlag(x){if(!x)return false;
   var cl=x.classList,cls=String(x.className||'');
   if(cl&&(cl.contains('dark')||cl.contains('night')||cl.contains('dark-mode')))return true;
   if(/(?:^|\s)(?:dark|night|dark-mode)(?:\s|$)/.test(cls))return true;
   var a=x.getAttribute&&[x.getAttribute('data-theme'),x.getAttribute('data-mode'),x.getAttribute('data-bs-theme'),x.getAttribute('data-color-mode')];
   return !!(a&&a.some(function(v){return /^(dark|night)$/i.test(String(v||''))}));
  }
  if(darkFlag(body)||darkFlag(html))return true;
  if(!w.getComputedStyle)return false;
  var nodes=[body,html,E('tafsirReader'),E('tafsirAyahs')];
  for(var i=0;i<nodes.length;i++){
   if(!nodes[i])continue;
   try{
    var bg=w.getComputedStyle(nodes[i]).backgroundColor,choice=darkRgb(bg);
    if(choice!==null)return choice;
   }catch(_){}
  }
  return false;
 }
 function annotateFieldTitles(){
  var host=E('tafsirAyahs');if(!host||!host.querySelectorAll)return;
  var titles=host.querySelectorAll('.v194T2FieldTitle,.v194T2SectionTitle,.v194T2Heading,[data-tafsir-section-title]');
  for(var i=0;i<titles.length;i++){
   var h=titles[i],label=h.querySelector&&h.querySelector('b'),text=String(label?label.textContent:h.textContent||'').trim();
   var tone=/لمس[ةه].*بياني|بيان|بلاغة/.test(text)?'bayani':
    /تدبر|لطائف|فائدة|فوائد/.test(text)?'tadabbur':
    /خلاص|نتيجة/.test(text)?'summary':'meaning';
   if(h.getAttribute('data-p147-field-tone')!==tone)h.setAttribute('data-p147-field-tone',tone);
  }
 }
 function syncVisualMode(){
  var b=d.body;
  if(!b)return;
  var night=isNight(),value=night?'1':'0';
  if(b.getAttribute('data-p147-night')!==value)b.setAttribute('data-p147-night',value);
  annotateFieldTitles();
 }

 // P147 visual hierarchy is opt-in ONLY for visible Intro and Thread panels.
 function readingMode(){
  var tabs=E('basairTafsirPrimaryTabs'),b=d.body;
  var selected=tabs&&tabs.querySelector('button[data-basair-main-tab].on,button[data-basair-main-tab][aria-selected="true"]');
  var mode=selected&&selected.getAttribute('data-basair-main-tab');
  if(!mode)mode=b&&b.getAttribute('data-basair-tafsir-main-tab');
  return mode==='intro'||mode==='thread'?mode:null;
 }
 function decorateReading(){
  var mode=readingMode(),b=d.body;
  if(!b)return;
  if(!mode){b.removeAttribute('data-p147-reading-tab');return}
  b.setAttribute('data-p147-reading-tab',mode);
  var roots=[E('tafsirReader'),E('tafsirAyahs')];
  var titleRe=/^(?:خلاصة السورة|متى نزلت وسياقها|سبب النزول|أبرز المحطات|أهم المعاني في مسار السورة|محطة عند الآية\s*\d+|عند الآية\s*\d+)$/;
  for(var r=0;r<roots.length;r++){
   var root=roots[r];if(!root||!root.querySelectorAll)continue;
   var titles=root.querySelectorAll('div,span,p,h2,h3,h4,h5,h6,strong,b,[class*="Title"],[class*="title"]');
   for(var k=0;k<titles.length;k++){
    var title=titles[k],value=String(title.textContent||'').replace(/\s+/g,' ').trim();
    if(value.length>85||!titleRe.test(value)||!title.parentElement)continue;
    if(title.firstElementChild&&String(title.firstElementChild.textContent||'').trim()===value)continue;
    title.classList.add('p147ReadingHeading');
    var card=title.parentElement;
    // Do not style a whole reading page if its heading is wrapped separately.
    for(var depth=0;depth<2&&card&&card!==root;depth++,card=card.parentElement){
     var length=String(card.textContent||'').trim().length;
     if(length<value.length+16||length>1600||card.children.length<2)continue;
     card.classList.add(/^((محطة )?عند الآية)/.test(value)?'p147ReadingPoint':'p147ReadingCard');
     var candidates=card.querySelectorAll('p,li,small,span,div');
     for(var j=0;j<candidates.length;j++){
      var node=candidates[j],txt=String(node.textContent||'').replace(/\s+/g,' ').trim();
      if(txt.length<18||txt.length>850||titleRe.test(txt)||node===card||node.contains(title))continue;
      if(node.matches('button,a,[role="button"],nav')||node.closest('button,a,nav'))continue;
      if(node.querySelector('p,li,div'))continue; // leaf prose, not entire layout.
      var size=0;try{size=parseFloat(w.getComputedStyle(node).fontSize)||0}catch(_){}
      if(size&&size<18.5)node.classList.add('p147ReadingCopy');
     }
     break;
    }
   }
  }
 }
 function sweep(){
  if(!open())return;
  var host=E('tafsirAyahs');if(!host)return;
  var rows=host.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
  for(var i=0;i<rows.length;i++)topRow(rows[i]);
  var tabs=E('basairTafsirPrimaryTabs');
  if(tabs)tabs.setAttribute('data-p145-tabs','ready');
  syncVisualMode();
  decorateReading();
 }
 function schedule(){if(debounce)return;debounce=w.setTimeout(function(){debounce=0;sweep();syncLoader()},36)}
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
 w.__BASAIR_TAFSIR_P148__={version:VERSION,refresh:sweep,openSource:openSource,closeSource:closeSource,
  fetchFull:fetchFull,decorateReading:decorateReading,syncVisualMode:syncVisualMode,status:function(){return Object.assign({mounted:!!observe,reader:open(),loaderInstalled:!!(seenCore&&seenCore.getMuyassarSurah.__p145)},stats,{noteAudit:noteAudit})}};
})(window,document);
