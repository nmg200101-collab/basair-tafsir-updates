/* BASAIR P169 — classify R114 status separately from P144 narrator;
 * compact top status with native stop, and safe hierarchical Notes return.
 * Does not create a second mic, modify TTS, reader/Follow engines, or notes.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P169_STATUS_NOTES_BACK__)return;
 var VERSION='P169-TOP-R114-NOTES-ORIGIN-RETURN';
 var current=null,noteWasOpen=false,ignoreNext=false,root=null,watch=null,scheduled=false;
 var counter={statusUpdates:0,noted:0,closedToVerse:0,closedToSaved:0,backKeys:0};
 function byId(id){return d.getElementById(id)}
 function activeTafsir(){var r=byId('tafsirReader'),i=byId('tafsirIndex');return !!(r&&r.classList.contains('active')||i&&i.classList.contains('active'))}
 function isNoteOpen(){var s=byId('basairTafsirR2NoteSheet');return !!(s&&s.classList.contains('show'))}
 function isSavedOpen(){var s=byId('basairTafsirB232FavoritesPanel');return !!(s&&s.classList.contains('show'))}
 function safeScroll(){var r=byId('tafsirReader'),doc=d.scrollingElement||d.documentElement;return {doc:doc&&doc.scrollTop||0,reader:r&&r.scrollTop||0}}
 function storeOrigin(node){
  if(!node||!node.closest)return;
  var note=node.closest('#tafsirAyahs .v194T2Ayah button[data-bq163-note],'+
    '#tafsirAyahs .v194T2Ayah button[data-p153-note-pos],'+
    '#basairTafsirB232FavoritesPanel button[data-r3-note-edit]');
  if(!note)return;
  var row=note.closest('.v194T2Ayah'),saved=!!note.closest('#basairTafsirB232FavoritesPanel');
  current={origin:saved?'saved':'verse',row:row||null,trigger:note,scroll:safeScroll(),time:Date.now()};
  counter.noted++;
 }
 function returnFocus(saved){
  var ctx=current;if(!ctx)return;
  if(saved){
   var panel=byId('basairTafsirB232FavoritesPanel');
   var tab=panel&&panel.querySelector('[data-r3-saved-tab="notes"]');
   try{(ctx.trigger&&ctx.trigger.isConnected?ctx.trigger:tab)?.focus({preventScroll:true})}catch(_){}
   counter.closedToSaved++;return;
  }
  var r=byId('tafsirReader'),doc=d.scrollingElement||d.documentElement;
  if(!r||!r.classList.contains('active'))return;
  // Note textarea focus can shift the viewport on Android when keyboard opens.
  // Restore only when the SAME verse is still mounted; never jump to another surah.
  if(ctx.row&&ctx.row.isConnected&&ctx.row.closest('#tafsirAyahs')){
   if(r&&Math.abs(r.scrollTop-ctx.scroll.reader)>3)r.scrollTop=ctx.scroll.reader;
   if(doc&&Math.abs(doc.scrollTop-ctx.scroll.doc)>3)doc.scrollTop=ctx.scroll.doc;
   try{(ctx.trigger&&ctx.trigger.isConnected?ctx.trigger:ctx.row)?.focus({preventScroll:true})}catch(_){}
   counter.closedToVerse++;
  }
 }
 function closeNotesOnly(){
  var s=byId('basairTafsirR2NoteSheet');if(!s||!s.classList.contains('show'))return false;
  // Use R2's ORIGINAL close control. No extra editor or data mutation.
  var b=s.querySelector('[data-r2-note-close]');
  if(b){b.click();return true}
  // Fallback is identical to native R2.closeNote(), if native button missing.
  s.classList.remove('show');s.setAttribute('aria-hidden','true');return true;
 }
 function topOffset(){
  var status=byId('basairTafsirR114Status'),frame=byId('p144SpeechFrame');
  if(!status&&!frame)return;
  var heads=d.querySelectorAll('.app>.top,.top,#tafsirReader>.readerHead');
  var y=88;for(var i=0;i<heads.length;i++){
   var h=heads[i],r=h.getBoundingClientRect();
   if(r.height>25&&r.bottom>0&&r.top<180&&r.bottom<300)y=Math.max(y,r.bottom);
  }
  y=Math.min(300,Math.max(70,Math.ceil(y)+4));
  if(status&&status.style.getPropertyValue('--bq169-follow-top')!==y+'px'){
   status.style.setProperty('--bq169-follow-top',y+'px');counter.statusUpdates++;
  }
  var speechY=y+((status&&!status.hidden)?37:0);
  if(frame&&frame.style.getPropertyValue('--bq169-speech-top')!==speechY+'px')
   frame.style.setProperty('--bq169-speech-top',speechY+'px');
 }
 function sync(){
  topOffset();
  var open=isNoteOpen();
  if(open&&!noteWasOpen){noteWasOpen=true;
   var s=byId('basairTafsirR2NoteSheet'),b=s&&s.querySelector('.b263r2SheetHead > button[data-r2-note-close]');
   if(b&&b.getAttribute('data-bq169-back')!=='1'){
    b.setAttribute('data-bq169-back','1');b.setAttribute('aria-label','رجوع من الملاحظة');
    b.textContent='‹ رجوع';
   }
  }else if(!open&&noteWasOpen){
   noteWasOpen=false;var saved=isSavedOpen();
   w.requestAnimationFrame(function(){returnFocus(saved)});
  }
 }
 function noteBackKey(ev){
  if(!isNoteOpen()||!(ev.key==='Escape'||ev.key==='BrowserBack'))return;
  ev.preventDefault();ev.stopPropagation();
  if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
  counter.backKeys++;closeNotesOnly();sync();
 }
 function schedule(){if(scheduled)return;scheduled=true;(w.requestAnimationFrame||function(f){return w.setTimeout(f,16)})(function(){scheduled=false;sync()})}
 // Click capture records the previous view before R2/R3 opens its native sheet.
 w.addEventListener('click',function(ev){storeOrigin(ev.target);
  if(ev.target&&ev.target.closest&&ev.target.closest('[data-r2-note-close]'))schedule();
 },true);
 d.addEventListener('keydown',noteBackKey,true);
 function observe(){if(!d.body||!w.MutationObserver)return;
  var s=byId('basairTafsirR2NoteSheet');
  if(root!==s){if(watch)watch.disconnect();root=s;
   if(s){watch=new w.MutationObserver(schedule);watch.observe(s,{attributes:true,attributeFilter:['class','aria-hidden']})}
  }
 }
 function tick(){if(!activeTafsir()&&!isNoteOpen())return;observe();sync()}
 w.addEventListener('resize',schedule);w.addEventListener('pageshow',schedule);
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});
 w.setInterval(tick,950);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',tick,{once:true});else tick();
 w.__BASAIR_TAFSIR_P169_STATUS_NOTES_BACK__={version:VERSION,refresh:tick,backNote:closeNotesOnly,
  status:function(){return{version:VERSION,noteOpen:isNoteOpen(),savedOpen:isSavedOpen(),
   followBarTop:byId('basairTafsirR114Status')?.style.getPropertyValue('--bq169-follow-top')||'',
   origin:current&&current.origin,counters:Object.assign({},counter)}}};
})(window,document);
