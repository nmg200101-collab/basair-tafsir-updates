/* BASAIR P160 — compact note + one upper narrator, restore native R114 follow.
 * UI-only adapter for the owner-approved P159 stable reading/scrolling baseline.
 * One R2 notes editor, one R114 follow engine; never mutate STEP5, reader mode or user storage.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P160_COMPACT__)return;
 var VERSION='P160-COMPACT-NOTE-NARRATOR-FOUR-TOOLS',host=null,observer=null;
 var pending=false,attempt=0,counts={notes:0,followToggles:0,rows:0,failures:0};
 function el(id){return d.getElementById(id)}
 function state(){try{var t=w.__BASAIR_TAFSIR_STEP2__;return t&&t.state?t.state():null}catch(_){return null}}
 function pos(row){
  if(!row)return null;
  var bar=row.querySelector('.basairB231AyahActions');
  var native=row.querySelector(':scope > .b263r3NoteChip[data-r3-note-pos]');
  var m=String(native&&native.getAttribute('data-r3-note-pos')||'').match(/^(\d{1,3}):(\d{1,3})$/);
  var st=state()||{},id=String(row.id||'').match(/^ta-(?:(\d+)-)?(\d+)$/);
  var su=Number(row.getAttribute('data-t5-s')||(bar&&bar.getAttribute('data-s'))||(m&&m[1])||(id&&id[1])||st.s);
  var ay=Number(row.getAttribute('data-t5-a')||row.getAttribute('data-t2ayah')||(bar&&bar.getAttribute('data-a'))||(m&&m[2])||(id&&id[2])||st.a);
  return Number.isInteger(su)&&su>0&&su<=114&&Number.isInteger(ay)&&ay>0&&ay<=286?{s:su,a:ay}:null;
 }
 function hasNote(p){try{var r=w.__BASAIR_TAFSIR_R2__;return !!(p&&r&&r.notes&&r.notes.get&&r.notes.get(p.s,p.a))}catch(_){return false}}
 function syncNote(button,row){var p=pos(row);button.disabled=!p;button.classList.toggle('has-note',hasNote(p));
  button.setAttribute('aria-label',p?(hasNote(p)?'تعديل ملاحظة الآية':'إضافة ملاحظة للآية'):'موضع الآية غير متاح')}
 function clickNote(e){e.preventDefault();e.stopPropagation();
  var button=e.currentTarget,row=button.closest('.v194T2Ayah'),p=pos(row),r=w.__BASAIR_TAFSIR_R2__;
  if(!p||!r||typeof r.openNote!=='function'){counts.failures++;return}
  try{r.openNote(p.s,p.a);counts.notes++;w.setTimeout(function(){if(button.isConnected)syncNote(button,row)},250)}catch(_){counts.failures++}
 }
 function upperHost(row){
  var head=row.querySelector(':scope > .v194T2Qrow')||row.querySelector('.v194T2Qrow');
  var mic=row.querySelector('button.p144MicButton');
  var mh=mic&&mic.closest('.p146TopMic,.p145TopControls');
  if(mh){
   var mics=row.querySelectorAll('button.p144MicButton');
   for(var i=0;i<mics.length;i++){
    if(mics[i]!==mic)mics[i].setAttribute('data-bq160-secondary-narrator','1');
    else mics[i].removeAttribute('data-bq160-secondary-narrator');
   }
   // Reposition the ORIGINAL narrator host only; never clone the audio button/listeners.
   // P153 already expects the mic host immediately after the ayah heading.
   if(head&&head.parentElement===row&&mh.previousElementSibling!==head)head.insertAdjacentElement('afterend',mh);
   mh.classList.add('bq160UpperControlHost');return mh;
  }
  var upper=row.querySelector(':scope > .bq160UpperControlHost');
  if(!upper){upper=d.createElement('div');upper.className='bq160UpperControlHost bq160OwnUpper';
   upper.setAttribute('role','group');upper.setAttribute('aria-label','ملاحظة الآية');
   if(head&&head.parentElement===row)head.insertAdjacentElement('afterend',upper);
   else row.insertBefore(upper,row.firstChild);
  }
  return upper;
 }
 function syncFollow(button){if(!button)return;var running=false;
  try{var r=w.__BASAIR_TAFSIR_R114__;running=!!(r&&r.status&&r.status().running)}catch(_){}
  var pressed=running?'true':'false';if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
  var label=button.querySelector('b'),icon=button.querySelector('span');
  if(label&&label.textContent!==(running?'إيقاف':'متابعة'))label.textContent=running?'إيقاف':'متابعة';
  if(icon&&icon.textContent!==(running?'■':'▶'))icon.textContent=running?'■':'▶';
  button.setAttribute('aria-label',running?'إيقاف متابعة الآية':'متابعة الآية');
 }
 function clickFollow(ev){ev.preventDefault();ev.stopPropagation();
  var r=w.__BASAIR_TAFSIR_R114__;if(!r||typeof r.toggle!=='function'){counts.failures++;return}
  try{r.toggle();counts.followToggles++;syncAllFollow()}catch(_){counts.failures++}
 }
 function syncAllFollow(){var all=d.querySelectorAll('#tafsirAyahs button[data-bq160-follow="1"]');
  for(var i=0;i<all.length;i++)syncFollow(all[i])}
 function place(row){
  var top=upperHost(row),note=row.querySelector('button[data-bq160-note="1"]');
  if(!note){note=d.createElement('button');note.type='button';note.className='bq160NoteChip';
   note.setAttribute('data-bq160-note','1');note.innerHTML='<span aria-hidden="true">✎</span><b>ملاحظة</b>';
   note.addEventListener('click',clickNote);counts.rows++;
  }
  if(note.parentElement!==top)top.appendChild(note);
  // The note remains in the Quran-header row whether or not the bottom bar exists.
  if(row.getAttribute('data-bq160-ready')!=='1')row.setAttribute('data-bq160-ready','1');
  syncNote(note,row);
  var bar=row.querySelector('.basairB231AyahActions');if(!bar)return;
  var follow=bar.querySelector('button[data-bq160-follow="1"]');
  if(!follow){follow=d.createElement('button');follow.type='button';follow.setAttribute('data-bq160-follow','1');
   follow.innerHTML='<span aria-hidden="true">▶</span><b>متابعة</b>';
   follow.setAttribute('aria-pressed','false');follow.addEventListener('click',clickFollow);
  }
  // RTL native B231 grid: first child is the RIGHTMOST cell, followed by native copy/compare/favorite.
  if(bar.firstElementChild!==follow)bar.insertBefore(follow,bar.firstChild);
  if(bar.getAttribute('data-bq160-four-tools')!=='1')bar.setAttribute('data-bq160-four-tools','1');
  syncFollow(follow);
 }
 function mount(){var h=el('tafsirAyahs');if(!h)return false;
  var rows=h.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
  for(var i=0;i<rows.length;i++)place(rows[i]);
  if(host!==h){if(observer)observer.disconnect();host=h;
   if(w.MutationObserver){observer=new w.MutationObserver(function(ms){
    for(var i=0;i<ms.length;i++){var m=ms[i];if(m.type!=='childList'||!m.addedNodes.length)continue;
     for(var j=0;j<m.addedNodes.length;j++){var n=m.addedNodes[j];if(n.nodeType!==1)continue;
      if(n.matches('.v194T2Ayah,.v194T2Qrow,.basairB231AyahActions,.p146TopMic,.p145TopControls,button.p144MicButton')||
       n.querySelector('.v194T2Ayah,.v194T2Qrow,.basairB231AyahActions,button.p144MicButton')){schedule();return}
     }
    }
   });observer.observe(h,{childList:true,subtree:true})}
  }
  return true;
 }
 function schedule(){if(pending)return;pending=true;
  (w.requestAnimationFrame||function(f){return w.setTimeout(f,16)})(function(){pending=false;mount()})}
 function init(){if(mount())return;if(attempt++<45)w.setTimeout(init,150)}
 d.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&
  t.closest('#tafsirAyahs .v194T2Ayah')&&!t.closest('button[data-bq160-note],button[data-bq160-follow]'))schedule()},false);
 d.addEventListener('visibilitychange',function(){if(!d.hidden){schedule();syncAllFollow()}});
 w.addEventListener('pageshow',schedule);
 // R114 may stop itself (timer/surah change); only re-label the UI, never touch its state.
 w.setInterval(function(){if(!d.hidden)syncAllFollow()},1200);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_TAFSIR_P160_COMPACT__={version:VERSION,refresh:schedule,
  status:function(){return{version:VERSION,notes:d.querySelectorAll('#tafsirAyahs .bq160NoteChip').length,
   followButtons:d.querySelectorAll('#tafsirAyahs [data-bq160-follow="1"]').length,
   counts:Object.assign({},counts)}}};
})(window,document);
