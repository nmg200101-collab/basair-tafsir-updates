/* BASAIR P161 — single native narrator above each ayah, original R3 note below.
 * All reading/scrolling remains owned by signed APK B231/STEP5/R114/R2/R3.
 * This module replaces P160 (not layered over it) and never creates a Note button.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P161_LAYOUT__)return;
 var VERSION='P161-NARRATOR-TOP-ORIGINAL-NOTE-BOTTOM',root=null,watch=null;
 var scheduled=false,attempt=0,metrics={narratorsMoved:0,secondaryHidden:0,notesRepositioned:0,followCreated:0,followClicks:0,errors:0};
 function get(id){return d.getElementById(id)}
 function originalNote(row){try{return row.querySelector(':scope > button.b263r3NoteChip[data-r3-note-pos]')||row.querySelector(':scope > button.b263r3NoteChip')}catch(_){return null}}
 function placeNarrator(row){
  var head=row.querySelector(':scope > .v194T2Qrow');
  var micButtons=row.querySelectorAll('button.p144MicButton');
  if(!head||!micButtons.length)return false;
  var top=row.querySelector(':scope > .bq161NarratorTop');
  if(!top){top=d.createElement('div');top.className='bq161NarratorTop';top.setAttribute('role','group');top.setAttribute('aria-label','ناطق الآية')}
  if(top.parentElement!==row||top.previousElementSibling!==head)head.insertAdjacentElement('afterend',top);
  var primary=top.querySelector('button.p144MicButton');
  if(!primary){
   for(var i=0;i<micButtons.length;i++)if(!micButtons[i].disabled&&!micButtons[i].hidden){primary=micButtons[i];break}
   if(!primary)primary=micButtons[0];
  }
  if(primary.parentElement!==top){top.appendChild(primary);metrics.narratorsMoved++}
  primary.removeAttribute('data-bq161-secondary-narrator');
  for(var j=0;j<micButtons.length;j++){
   var other=micButtons[j];if(other===primary)continue;
   if(other.getAttribute('data-bq161-secondary-narrator')!=='1'){
    other.setAttribute('data-bq161-secondary-narrator','1');metrics.secondaryHidden++;
   }
  }
  row.setAttribute('data-bq161-narrator-ready','1');
  return true;
 }
 function preserveBottomNote(row){
  // R3 owns this direct-child node and its click and save state; do not clone or replace.
  var note=originalNote(row),bar=row.querySelector(':scope > .basairB231AyahActions');
  if(!note)return;
  if(bar&&note.nextElementSibling!==bar){row.insertBefore(note,bar);metrics.notesRepositioned++}
  row.setAttribute('data-bq161-bottom-note','1');
 }
 function followState(btn){if(!btn)return;var on=false;
  try{var r=w.__BASAIR_TAFSIR_R114__;on=!!(r&&r.status&&r.status().running)}catch(_){metrics.errors++}
  var current=on?'true':'false';if(btn.getAttribute('aria-pressed')!==current)btn.setAttribute('aria-pressed',current);
  var caption=btn.querySelector('b'),glyph=btn.querySelector('span');
  if(caption&&caption.textContent!==(on?'إيقاف':'متابعة'))caption.textContent=on?'إيقاف':'متابعة';
  if(glyph&&glyph.textContent!==(on?'■':'▶'))glyph.textContent=on?'■':'▶';
  btn.setAttribute('aria-label',on?'إيقاف متابعة الآية':'متابعة الآية');
 }
 function toggleFollow(ev){ev.preventDefault();ev.stopPropagation();
  var r=w.__BASAIR_TAFSIR_R114__;
  if(!r||typeof r.toggle!=='function'){metrics.errors++;return}
  try{r.toggle();metrics.followClicks++;refreshFollow()}catch(_){metrics.errors++}
 }
 function refreshFollow(){var buttons=d.querySelectorAll('#tafsirAyahs button[data-bq161-follow="1"]');
  for(var i=0;i<buttons.length;i++)followState(buttons[i]);
 }
 function restoreFourTools(row){var bar=row.querySelector(':scope > .basairB231AyahActions');if(!bar)return;
  var follow=bar.querySelector('button[data-bq161-follow="1"]');
  if(!follow){follow=d.createElement('button');follow.type='button';follow.setAttribute('data-bq161-follow','1');
   follow.innerHTML='<span aria-hidden="true">▶</span><b>متابعة</b>';follow.setAttribute('aria-pressed','false');
   follow.addEventListener('click',toggleFollow);metrics.followCreated++}
  if(bar.firstElementChild!==follow)bar.insertBefore(follow,bar.firstChild);
  bar.setAttribute('data-bq161-four-tools','1');followState(follow);
 }
 function repair(row){
  // A stale previous page may be retained temporarily for a seamless transition.
  if(!row||row.classList.contains('b118CarryArticle'))return;
  placeNarrator(row);
  preserveBottomNote(row);
  restoreFourTools(row);
 }
 function mount(){var h=get('tafsirAyahs');if(!h)return false;
  var rows=h.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
  for(var i=0;i<rows.length;i++)repair(rows[i]);
  if(h!==root){if(watch)watch.disconnect();root=h;
   if(w.MutationObserver){watch=new w.MutationObserver(function(events){
    // Observe only native additions. Ignore self-authored header/follow changes.
    for(var i=0;i<events.length;i++){var e=events[i];if(e.type!=='childList')continue;
     for(var j=0;j<e.addedNodes.length;j++){
      var n=e.addedNodes[j];if(n.nodeType!==1||n.classList.contains('bq161NarratorTop')||
       n.hasAttribute('data-bq161-follow'))continue;
      if(n.matches('.v194T2Ayah,.v194T2Qrow,.basairB231AyahActions,button.p144MicButton,button.b263r3NoteChip')||
       n.querySelector('.v194T2Ayah,.basairB231AyahActions,button.p144MicButton,button.b263r3NoteChip')){
        schedule();return;
      }
     }
    }
   });watch.observe(h,{childList:true,subtree:true})}
  }
  return true;
 }
 function schedule(){if(scheduled)return;scheduled=true;
  (w.requestAnimationFrame||function(fn){return w.setTimeout(fn,16)})(function(){scheduled=false;mount()})}
 function init(){if(mount())return;if(attempt++<40)w.setTimeout(init,160)}
 d.addEventListener('click',function(ev){var t=ev.target;if(t&&t.closest&&
  t.closest('#tafsirAyahs .v194T2Ayah')&&!t.closest('button[data-bq161-follow]'))schedule()},false);
 d.addEventListener('visibilitychange',function(){if(!d.hidden){schedule();refreshFollow()}});
 w.addEventListener('pageshow',schedule);
 // R114 can stop on its own; refresh only button text, no state mutation.
 w.setInterval(function(){if(!d.hidden)refreshFollow()},1500);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_TAFSIR_P161_LAYOUT__={version:VERSION,refresh:schedule,status:function(){
  return{version:VERSION,topNarrators:d.querySelectorAll('#tafsirAyahs .bq161NarratorTop button.p144MicButton').length,
   nativeBottomNotes:d.querySelectorAll('#tafsirAyahs .v194T2Ayah > button.b263r3NoteChip').length,
   followButtons:d.querySelectorAll('#tafsirAyahs [data-bq161-follow="1"]').length,
   metrics:Object.assign({},metrics)};
 }};
})(window,document);
