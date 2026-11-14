/* BASAIR P163 — one compact, persistent note entrance below Tafsir content.
 * Presentation-only adapter. R2/R3/P153 keep ownership of notes and storage.
 * NO narrator, audio, follow, verse scrolling or loader changes.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P163_NOTE_ONLY__)return;
 var VERSION='P163-COMPACT-NOTE-ALWAYS-LOWER',host=null,watch=null,scheduled=false,attempt=0;
 var counters={mounted:0,repaired:0,opened:0,missingPosition:0,missingEditor:0};
 function position(row){
  var native=row.querySelector(':scope > button.b263r3NoteChip[data-r3-note-pos]');
  var proxy=row.querySelector('.p149NoteSlot button[data-p153-note-pos]');
  var source=String(native&&native.getAttribute('data-r3-note-pos')||proxy&&proxy.getAttribute('data-p153-note-pos')||'');
  var m=source.match(/^(\d{1,3}):(\d{1,3})$/),state=null;
  try{state=w.__BASAIR_TAFSIR_STEP2__&&w.__BASAIR_TAFSIR_STEP2__.state&&w.__BASAIR_TAFSIR_STEP2__.state()}catch(_){}
  var id=String(row.id||'').match(/^ta-(?:(\d+)-)?(\d+)$/);
  var s=Number(m&&m[1]||row.getAttribute('data-t5-s')||id&&id[1]||state&&state.s);
  var a=Number(m&&m[2]||row.getAttribute('data-t5-a')||row.getAttribute('data-t2ayah')||id&&id[2]);
  return Number.isInteger(s)&&s>=1&&s<=114&&Number.isInteger(a)&&a>=1&&a<=286?{s:s,a:a}:null;
 }
 function isSaved(p){try{var r=w.__BASAIR_TAFSIR_R2__;return !!(p&&r&&r.notes&&r.notes.get&&r.notes.get(p.s,p.a))}catch(_){return false}}
 function refreshButton(button,row){
  var p=position(row),saved=isSaved(p);
  button.classList.toggle('has-note',saved);
  button.setAttribute('aria-label',saved?'تعديل ملاحظة الآية':'ملاحظة الآية');
  if(p)button.setAttribute('data-bq163-pos',p.s+':'+p.a);
  else button.removeAttribute('data-bq163-pos');
 }
 function open(ev){
  ev.preventDefault();ev.stopPropagation();
  var button=ev.currentTarget,row=button.closest('.v194T2Ayah'),p=row&&position(row);
  if(!p){counters.missingPosition++;return}
  var r=w.__BASAIR_TAFSIR_R2__;
  if(r&&typeof r.openNote==='function'){
   try{r.openNote(p.s,p.a);counters.opened++}catch(_){counters.missingEditor++}
  }else{
   // Native P153 fallback: opens the exact existing R3-backed note editor.
   var fallback=row.querySelector('.p149NoteSlot button[data-p153-note-pos]');
   if(fallback){fallback.click();counters.opened++}
   else counters.missingEditor++;
  }
  w.setTimeout(function(){if(button.isConnected)refreshButton(button,row)},150);
 }
 function mountRow(row){
  if(!row||row.classList.contains('b118CarryArticle'))return;
  var bar=row.querySelector(':scope > .basairB231AyahActions');
  var slot=row.querySelector(':scope > .bq163NoteLower');
  if(!slot){slot=d.createElement('div');slot.className='bq163NoteLower';slot.setAttribute('role','group');slot.setAttribute('aria-label','ملاحظة الآية')}
  var button=slot.querySelector('button[data-bq163-note="1"]');
  if(!button){button=d.createElement('button');button.type='button';button.className='bq163NoteChip';
   button.setAttribute('data-bq163-note','1');button.innerHTML='<span aria-hidden="true">✎</span><b>ملاحظة</b>';
   button.addEventListener('click',open);slot.appendChild(button);counters.mounted++}
  // The note row is attached to the article itself, NEVER to the tools strip.
  // On first mount append at the end; when a toolbar later appears, place before it.
  if(bar){if(slot.parentElement!==row||slot.nextElementSibling!==bar){row.insertBefore(slot,bar);counters.repaired++}}
  else if(slot.parentElement!==row){row.appendChild(slot);counters.repaired++}
  if(row.getAttribute('data-bq163-note-ready')!=='1')row.setAttribute('data-bq163-note-ready','1');
  refreshButton(button,row);
 }
 function scan(){var h=d.getElementById('tafsirAyahs');if(!h)return false;
  var rows=h.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
  for(var i=0;i<rows.length;i++)mountRow(rows[i]);
  if(host!==h){if(watch)watch.disconnect();host=h;
   if(w.MutationObserver){watch=new w.MutationObserver(function(ms){
    for(var i=0;i<ms.length;i++){
     var m=ms[i];if(m.type!=='childList')continue;
     for(var j=0;j<m.addedNodes.length;j++){
      var n=m.addedNodes[j];if(n.nodeType!==1||n.classList.contains('bq163NoteLower')||n.hasAttribute('data-bq163-note'))continue;
      if(n.matches('.v194T2Ayah,.basairB231AyahActions,.v194T2Body,button.b263r3NoteChip')||
       n.querySelector('.v194T2Ayah,.basairB231AyahActions,.v194T2Body')){schedule();return}
     }
    }
   });watch.observe(h,{childList:true,subtree:true})}
  }return true;
 }
 function schedule(){if(scheduled)return;scheduled=true;
  (w.requestAnimationFrame||function(f){return w.setTimeout(f,16)})(function(){scheduled=false;scan()})}
 function init(){if(scan())return;if(attempt++<40)w.setTimeout(init,150)}
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});
 w.addEventListener('pageshow',schedule);
 // This interval changes note state labels only when needed; never reflows a row.
 w.setInterval(function(){if(!d.hidden)scan()},2000);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_TAFSIR_P163_NOTE_ONLY__={version:VERSION,refresh:schedule,
  status:function(){return{version:VERSION,visibleNoteButtons:d.querySelectorAll('#tafsirAyahs .bq163NoteChip').length,
   metrics:Object.assign({},counters)}}};
})(window,document);
