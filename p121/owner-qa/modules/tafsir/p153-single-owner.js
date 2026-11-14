/* P152 Tafsir-only: native R3 saved tabs wired to main index; permanent single-form note control in fifth verse slot. */
(function(w,d){'use strict';
 var VERSION='P153-SINGLE-OWNER-NOTE-AND-SAVED-TABS-OWNER-QA';
 if(w.__BASAIR_TAFSIR_P153_READER__&&w.__BASAIR_TAFSIR_P153_READER__.version===VERSION)return;
 var ROOT='https://raw.githubusercontent.com/nmg200101-collab/basair-tafsir-updates/main/public-assets/tafsir-muyassar/v1/surahs/';
 var stats={controls:0,repositioned:0,duplicatePruned:0,fetchFallback:0,cacheWrites:0,retryShown:0,externalOpened:0};
 var observe=null,debounce=0,slowTimers=[],surahRequests=new Map(),baseMuyassar=null,seenCore=null,modalBack=false,sourceModal=null;
 var nativeNoteByRow=new WeakMap();
 var rowWatchers=new WeakMap();
 var micWatchers=new WeakSet();
 var noteAudit={slotRepairs:0,duplicatesHidden:0,legacyMoved:0,micUpdates:0};

 // One visual slot inside the ORIGINAL 4-column actions grid. P144 retains
 // ownership of its four existing tools; the slot occupies implicit column 5.
 // No race between P144's repeat(4) and P148's repeat(5).
 function rowWatch(row){
  if(!w.MutationObserver||rowWatchers.has(row))return;
  var entry={pending:false};
  var obs=new w.MutationObserver(function(ms){
   if(!open()||!row.isConnected)return;
   var relevant=ms.some(function(m){
    if(m.type==='attributes')return !!(m.target&&m.target.matches&&m.target.matches('button.b263r3NoteChip:not(.p150NoteProxy)')&&
      (m.attributeName==='data-r3-note-pos'||m.attributeName==='class'));
    if(m.type!=='childList')return false;
    if(m.target.classList&&m.target.classList.contains('p149NoteSlot'))return true;
    var nodes=Array.prototype.slice.call(m.addedNodes).concat(Array.prototype.slice.call(m.removedNodes));
    return nodes.some(function(node){
     return node&&node.nodeType===1&&(
      node.matches&&node.matches('button.b263r3NoteChip,button.p144NoteChip,button[data-r3-note-pos],.p150NoteProxy,.p149NoteSlot,.basairB231AyahActions')||
      node.querySelector&&node.querySelector('button.b263r3NoteChip,button.p144NoteChip,button[data-r3-note-pos]'));
    });
   });
   if(!relevant||entry.pending)return;
   entry.pending=true;
   Promise.resolve().then(function(){
    entry.pending=false;
    if(!open()||!row.isConnected)return;
    topRow(row);noteAudit.slotRepairs++;
   });
  });
  obs.observe(row,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-r3-note-pos']});
  rowWatchers.set(row,{observer:obs,entry:entry});
 }
 function reflectMic(button){
  if(!button)return;
  var active=button.getAttribute('aria-pressed')==='true'||button.classList.contains('p132-on');
  var word=active?'يعمل':'متوقف',mode=active?'on':'off';
  if(button.getAttribute('data-p149-mic-state')!==mode){
   button.setAttribute('data-p149-mic-state',mode);noteAudit.micUpdates++;
  }
  var hint=button.querySelector('.p149MicState');
  if(!hint){hint=d.createElement('small');hint.className='p149MicState';hint.setAttribute('aria-hidden','true');button.appendChild(hint)}
  if(hint.textContent!==word)hint.textContent=word;
 }
 function watchMic(button){
  reflectMic(button);
  if(!w.MutationObserver||micWatchers.has(button))return;
  micWatchers.add(button);
  var obs=new w.MutationObserver(function(ms){
   if(ms.some(function(m){return m.attributeName==='aria-pressed'||m.attributeName==='class'}))reflectMic(button);
  });
  obs.observe(button,{attributes:true,attributeFilter:['aria-pressed','class']});
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
  var note=row.querySelector('button.b263r3NoteChip,button[data-r3-note-pos],button.p144NoteChip');
  if(!mic&&!note&&!row.querySelector('.p149NoteSlot')&&!row.querySelector('.basairB231AyahActions'))return false;
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
   compact(mic);watchMic(mic);
  }else if(micHost){micHost.remove()}
  var actions=row.querySelector('.basairB231AyahActions');
  if(actions){
   var slot=actions.querySelector('.p149NoteSlot');
   if(!slot){
    slot=d.createElement('div');slot.className='p149NoteSlot';
    slot.setAttribute('role','group');slot.setAttribute('aria-label','ملاحظة الآية');
    actions.appendChild(slot);
   }else if(slot.parentElement!==actions){actions.appendChild(slot)}
   // IMPORTANT: original V694/V695 R3 syncAyahNotes() ONLY recognizes
   // ':scope > .b263r3NoteChip' directly under the verse article.
   // Moving that original inside the toolbar makes R3 recreate a TOP note
   // on every sync, while P149 then hides all candidates. Keep the real
   // R3 node as a hidden DIRECT child and use exactly ONE visible proxy in
   // the fifth tool slot. R3's document-level click listener accepts its
   // 'data-r3-note-pos' and invokes the existing R2.openNote() storage/editor.
   var notes=row.querySelectorAll('button.b263r3NoteChip,button.p144NoteChip,button[data-r3-note-pos]');
   var native=null,proxy=slot.querySelector('button[data-p150-note-proxy="1"]');
   // Reuse any real R3 node, whether hidden, disabled, or moved by P149.
   for(var pass=0;pass<2&&!native;pass++){
    for(var n=0;n<notes.length;n++){
     var item=notes[n];
     if(item===proxy||item.hasAttribute('data-p150-note-proxy')||
        item.hasAttribute('data-p150-provisional-note'))continue;
     if(pass===0&&item.hasAttribute('data-r3-note-pos')||
        pass===1&&item.classList.contains('b263r3NoteChip')){native=item;break}
    }
   }
   if(native){
    nativeNoteByRow.set(row,native);
    native.classList.add('b263r3NoteChip');
    native.classList.remove('p149NoteTool','p148NoteTool','p147NoteTool');
    // Do not create a new native note; move the same object BACK to the
    // original article level, where R3 syncAyahNotes expects it.
    if(native.parentElement!==row){row.appendChild(native);stats.repositioned++}
    if(!native.hidden)native.hidden=true;
    native.tabIndex=-1;
    if(native.getAttribute('aria-hidden')!=='true')native.setAttribute('aria-hidden','true');
    style(native,'visibility','hidden');style(native,'opacity','0');
    style(native,'pointer-events','none');style(native,'display','none');
   }
   function noteVersePos(){
    var s=state()||{},pos=native&&native.getAttribute('data-r3-note-pos');
    if(/^\d+:\d+$/.test(String(pos||'')))return pos;
    var su=Number(row.getAttribute('data-t5-s'))||Number(s.s)||1;
    var ay=Number(row.getAttribute('data-t5-a'))||Number(row.getAttribute('data-t2ayah'))||0;
    if(!ay&&row.id){
     var match=String(row.id).match(/^ta-(?:(\d+)-)?(\d+)$/);
     if(match){if(match[1])su=Number(match[1])||su;ay=Number(match[2])||0}
    }
    return String(su)+':'+String(ay||Number(s.a)||1);
   }
   if(!proxy){
    // This is a visual proxy, NEVER a second R3 native note or notes store.
    // R3's click listener runs on document bubbling and routes by s:a.
    proxy=d.createElement('button');proxy.type='button';
    proxy.className='p150NoteProxy p149NoteTool p153NoteProxy';
    proxy.innerHTML='<span aria-hidden="true">✎</span><b>ملاحظة</b>';
    proxy.setAttribute('data-p150-note-label','ملاحظة');
    proxy.setAttribute('data-p150-note-proxy','1');
    proxy.setAttribute('aria-label','ملاحظة الآية');
    proxy.setAttribute('title','ملاحظة الآية');
    slot.appendChild(proxy);
    noteAudit.provisionalCreated=(noteAudit.provisionalCreated||0)+1;
   }
   if(proxy.parentElement!==slot)slot.appendChild(proxy);
   var versePos=noteVersePos();
   // The visual button MUST NOT expose data-r3-note-pos: old P144
   // grabs that attribute and rewrites the button HTML/size each sweep.
   if(proxy.hasAttribute('data-r3-note-pos'))proxy.removeAttribute('data-r3-note-pos');
   if(proxy.getAttribute('data-p153-note-pos')!==versePos)
    proxy.setAttribute('data-p153-note-pos',versePos);
   if(proxy.hidden)proxy.hidden=false;
   if(proxy.disabled)proxy.disabled=false;
   if(proxy.getAttribute('aria-hidden')==='true')proxy.removeAttribute('aria-hidden');
   var hasNote=!!(native&&native.classList.contains('has-note'));
   if(proxy.classList.contains('has-note')!==hasNote)
    proxy.classList.toggle('has-note',hasNote);
   // The visible note must NEVER change its icon or wording when the
   // native R3 store changes. Use its non-layout saved-color indicator only.
   var label='ملاحظة';
   var marker='✎';
   proxy.classList.add('p153NoteProxy');
   // Only touch text when it actually changes; avoid mutation loops.
   if(proxy.getAttribute('data-p150-note-label')!==label){
    proxy.setAttribute('data-p150-note-label',label);
    proxy.innerHTML='<span aria-hidden="true">'+marker+'</span><b>'+label+'</b>';
   }
   style(proxy,'display','flex');
   [['box-sizing','border-box'],['width','100%'],['min-width','0px'],['max-width','100%'],
    ['height','44px'],['min-height','44px'],['max-height','44px'],
    ['padding','2px 1px'],['margin','0px'],['display','flex'],
    ['flex-direction','column'],['align-items','center'],['justify-content','center'],
    ['font-size','9px'],['line-height','1.08'],['gap','0px'],
    ['border-radius','8px']
   ].forEach(function(pair){style(proxy,pair[0],pair[1])});
   // Remove stale P149 buttons from the VISUAL slot. The sole native R3
   // anchor (if present) stays under the verse for original sync routines.
   var slotButtons=slot.querySelectorAll('button');
   for(var i=0;i<slotButtons.length;i++)
    if(slotButtons[i]!==proxy)slotButtons[i].remove();
   for(var z=0;z<notes.length;z++){
    var extra=notes[z];
    if(extra===native||extra===proxy)continue;
    if(extra.hasAttribute('data-p150-note-proxy')){extra.remove();continue}
    if(!extra.hidden){extra.hidden=true;stats.duplicatePruned++;noteAudit.duplicatesHidden++}
    extra.tabIndex=-1;
    if(extra.getAttribute('aria-hidden')!=='true')extra.setAttribute('aria-hidden','true');
    style(extra,'visibility','hidden');style(extra,'pointer-events','none');
    style(extra,'display','none');
   }
   if(actions.getAttribute('data-p149-note-layout')!=='native-four-plus-slot')
    actions.setAttribute('data-p149-note-layout','native-four-plus-slot');
   // P144 may rewrite its 4 template columns. Leave them untouched, but
   // declare the fifth implicit equal-width track for the slot.
   style(actions,'grid-auto-columns','minmax(0,1fr)');
   style(actions,'overflow','visible');
   // Stale P148 state is illegal in P149; its five-column rule must not win.
   if(actions.hasAttribute('data-p148-notes'))actions.removeAttribute('data-p148-notes');
   rowWatch(row);
  }
  var staleHost=row.querySelector('.p146BottomNote');
  if(staleHost&&!staleHost.children.length)staleHost.remove();
  var all=row.querySelectorAll('button.p144MicButton');
  for(var i=1;i<all.length;i++){all[i].hidden=true;all[i].disabled=true;stats.duplicatePruned++}
  // Do not alter the legacy four action buttons or their native sizes.
  // No periodic re-layout: the note is permanently in its own slot.
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
 function schedule(){if(debounce)return;debounce=w.setTimeout(function(){debounce=0;sweep();syncLoader()},70)}
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
 w.__BASAIR_TAFSIR_P153_READER__={version:VERSION,refresh:sweep,openSource:openSource,closeSource:closeSource,
  fetchFull:fetchFull,decorateReading:decorateReading,syncVisualMode:syncVisualMode,status:function(){return Object.assign({mounted:!!observe,reader:open(),loaderInstalled:!!(seenCore&&seenCore.getMuyassarSurah.__p145)},stats,{noteAudit:noteAudit})}};
})(window,document);


/* P153 — ONLY owner of the Tafsir main Saved entry; no second note editor
 * and no second verse toolbar builder. The original B263-R2/R3 stores remain
 * the source of truth. P144 may style the native R3 anchor, but cannot
 * capture or redraw the visible proxy (data-p153-note-pos only).
 */
;(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P153_STABLE__)return;
 var VERSION='P153-MAIN-SAVED-SINGLE-OWNER-20261114';
 var scheduled=false,seenIndex=null,indexObserver=null,bootAttempts=0;
 var stats={mounted:0,repaired:0,favoriteOpens:0,noteOpens:0,verseNoteOpens:0,failures:0};
 function byId(id){return d.getElementById(id)}
 function install(){
  var idx=byId('tafsirIndex'),bar=byId('basairTafsirB233TopBar');
  if(!idx||!bar||!idx.contains(bar))return false;
  var fav=bar.querySelector('#basairTafsirB232FavoritesBtn');
  if(!fav)return false;
  // Retask the original compact Search element IN PLACE; no new button,
  // no index-bar reorder, no duplicate controls, no layout jumping.
  var notes=bar.querySelector('#p153NotesIndex')||
    bar.querySelector('button[data-b233-top="search"]');
  if(!notes)return false;
  if(notes.getAttribute('data-p153-tab')!=='notes'){
   notes.removeAttribute('data-b233-top');
   notes.id='p153NotesIndex';
   notes.type='button';
   notes.setAttribute('data-p153-tab','notes');
   notes.setAttribute('aria-label','فتح الملاحظات');
   notes.innerHTML='<span aria-hidden="true">✎</span><b>الملاحظات</b>';
   stats.mounted++;
  }
  if(fav.getAttribute('data-p153-tab')!=='favorites'){
   fav.setAttribute('data-p153-tab','favorites');
   fav.setAttribute('aria-label','فتح المفضلة');
  }
  if(bar.getAttribute('data-p153-ready')!=='1'){
   bar.setAttribute('data-p153-ready','1');stats.repaired++;
  }
  // Track the index, not every individual Tafsir verse or reading card.
  if(w.MutationObserver&&seenIndex!==idx){
   if(indexObserver)indexObserver.disconnect();
   seenIndex=idx;
   indexObserver=new w.MutationObserver(function(ms){
    var changed=ms.some(function(m){
     if(m.type!=='childList')return false;
     if(m.target===bar||m.target===idx)return true;
     for(var i=0;i<m.addedNodes.length;i++){
      var e=m.addedNodes[i];
      if(e.nodeType===1&&(e.id==='basairTafsirB233TopBar'||
        e.id==='basairTafsirB232FavoritesBtn'||e.id==='v194T2IndexNav'))return true;
     }
     return false;
    });
    if(changed)queue();
   });
   indexObserver.observe(idx,{childList:true,subtree:true});
  }
  d.documentElement.classList.remove('p153-boot');
  return true;
 }
 function queue(){
  if(scheduled)return;scheduled=true;
  (w.requestAnimationFrame||function(fn){return w.setTimeout(fn,0)})(function(){
   scheduled=false;install()
  });
 }
 function saved(kind){
  var b233=w.__BASAIR_TAFSIR_FINAL_B233__,r3=w.__BASAIR_TAFSIR_R3__;
  if(!b233||!b233.favorites||typeof b233.favorites.open!=='function')return false;
  b233.favorites.open();
  if(r3&&typeof r3.favoritesUpgrade==='function')r3.favoritesUpgrade();
  var tab=d.querySelector('#basairTafsirR3SavedTabs [data-r3-saved-tab="'+kind+'"]');
  if(!tab)return false;
  tab.click();stats[kind==='notes'?'noteOpens':'favoriteOpens']++;
  return true;
 }
 function onClick(ev){
  var t=ev.target;
  if(!t||typeof t.closest!=='function')return;
  var bar=t.closest('#basairTafsirB233TopBar');
  if(bar){
   // B233 may have just rebuilt its toolbar; reconcile synchronously.
   install();
   var cmd=t.closest('button[data-p153-tab]');
   if(cmd&&bar.contains(cmd)){
    ev.preventDefault();ev.stopPropagation();
    if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
    if(!saved(cmd.getAttribute('data-p153-tab')))stats.failures++;
   }
   return;
  }
  var button=t.closest('#tafsirAyahs .v194T2Ayah button[data-p153-note-pos]');
  if(!button)return;
  ev.preventDefault();ev.stopPropagation();
  if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
  var p=String(button.getAttribute('data-p153-note-pos')||'').match(/^(\d{1,3}):(\d{1,3})$/);
  if(!p)return;
  var r2=w.__BASAIR_TAFSIR_R2__;
  if(r2&&typeof r2.openNote==='function'){
   r2.openNote(Number(p[1]),Number(p[2]));stats.verseNoteOpens++;
  }else stats.failures++;
 }
 // WINDOW capture runs before old B233 / R3 document-level handlers.
 w.addEventListener('click',onClick,true);
 function boot(){
  if(install())return;
  if(bootAttempts++<44)w.setTimeout(boot,180);
 }
 d.documentElement.classList.add('p153-boot');
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
 // A fail-safe ensures the old bar remains visible if the expected B233
 // instance is truly unavailable; avoid blank screens on incompatible builds.
 w.setTimeout(function(){d.documentElement.classList.remove('p153-boot')},1800);
 d.addEventListener('visibilitychange',function(){if(!d.hidden)queue()});
 w.addEventListener('pageshow',queue);
 w.__BASAIR_TAFSIR_P153_STABLE__={
  version:VERSION,refresh:install,openSaved:saved,
  status:function(){return {ready:!!byId('p153NotesIndex'),
   proxyCount:d.querySelectorAll('#tafsirAyahs button[data-p153-note-pos]').length,
   savedPanel:!!byId('basairTafsirR3SavedTabs'),stats:stats}}
 };
})(window,document);
