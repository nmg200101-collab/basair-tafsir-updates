/* BASAIR P162: preserve native mic host and original Note ownership.
 * Replaces P161. The native P153 sweeper moves the *button* into .p146TopMic;
 * we relocate only that same native host, never fight the sweeper over the button.
 * Native B231/R2/R3/R114/STEP5/reader scroller remain authoritative.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P162_LAYOUT__)return;
 var VERSION='P162-STABLE-NATIVE-CONTROL-ANCHORS',root=null,watch=null,queued=false,tries=0;
 var stats={hosts:0,reconciled:0,notes:0,follow:0,errors:0};
 function rows(){var h=d.getElementById('tafsirAyahs');return h?h.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)'):[]}
 function narrator(row){
  var heading=row.querySelector(':scope > .v194T2Qrow');
  if(!heading)return;
  var allMic=row.querySelectorAll('button.p144MicButton');
  if(!allMic.length)return;
  // P153 expects the real p146TopMic host and puts p144MicButton back in it.
  var host=row.querySelector(':scope > .p146TopMic');
  var mic=host&&host.querySelector('button.p144MicButton');
  if(!mic){for(var a=0;a<allMic.length;a++)if(!allMic[a].hidden&&!allMic[a].disabled){mic=allMic[a];break}}
  if(!mic)mic=allMic[0];
  if(!host)host=mic.closest('.p146TopMic');
  if(!host){host=d.createElement('div');host.className='p146TopMic';host.setAttribute('role','group');
   host.setAttribute('aria-label','ناطق الآية');stats.hosts++}
  host.classList.add('bq162NativeNarratorHost');
  if(host.parentElement!==row||host.previousElementSibling!==heading){heading.insertAdjacentElement('afterend',host);stats.reconciled++}
  if(mic.parentElement!==host){host.appendChild(mic);stats.reconciled++}
  // Preserve all listeners. Hide redundant microphones of this verse, never across verses.
  var mics=row.querySelectorAll('button.p144MicButton');
  for(var i=0;i<mics.length;i++){
   if(mics[i]===mic){mic.removeAttribute('data-bq162-duplicate-mic');continue}
   mics[i].setAttribute('data-bq162-duplicate-mic','1');
  }
  row.setAttribute('data-bq162-narrator-ready','1');
 }
 function notes(row){
  // Never clone or move the native R3 note: P153 itself keeps it as a direct child.
  var native=row.querySelector(':scope > button.b263r3NoteChip[data-r3-note-pos]')||
    row.querySelector(':scope > button.b263r3NoteChip');
  var proxy=row.querySelector('.p149NoteSlot button.p153NoteProxy');
  // On older V695 builds R3 is directly visible; on P153 builds it is hidden
  // and the existing p153 proxy is the one visible note. Support both layouts.
  var usableNative=!!(native&&!native.hidden&&native.getAttribute('aria-hidden')!=='true'&&
    native.style.display!=='none');
  var type=usableNative?'native':proxy?'proxy':'none';
  if(row.getAttribute('data-bq162-note-owner')!==type){row.setAttribute('data-bq162-note-owner',type);stats.notes++}
 }
 function syncFollow(button){var on=false;
  try{var r=w.__BASAIR_TAFSIR_R114__;on=!!(r&&r.status&&r.status().running)}catch(_){stats.errors++}
  var v=on?'true':'false';if(button.getAttribute('aria-pressed')!==v)button.setAttribute('aria-pressed',v);
  var b=button.querySelector('b'),s=button.querySelector('span');
  if(b&&b.textContent!==(on?'إيقاف':'متابعة'))b.textContent=on?'إيقاف':'متابعة';
  if(s&&s.textContent!==(on?'■':'▶'))s.textContent=on?'■':'▶';
  button.setAttribute('aria-label',on?'إيقاف متابعة الآية':'متابعة الآية');
 }
 function refreshFollow(){var b=d.querySelectorAll('#tafsirAyahs button[data-bq162-follow="1"]');
  for(var i=0;i<b.length;i++)syncFollow(b[i])}
 function clickFollow(e){e.preventDefault();e.stopPropagation();var r=w.__BASAIR_TAFSIR_R114__;
  if(!r||typeof r.toggle!=='function'){stats.errors++;return}
  try{r.toggle();stats.follow++;refreshFollow()}catch(_){stats.errors++}
 }
 function tools(row){var bar=row.querySelector(':scope > .basairB231AyahActions');if(!bar)return;
  var follow=bar.querySelector('button[data-bq162-follow="1"]');
  if(!follow){follow=d.createElement('button');follow.type='button';follow.setAttribute('data-bq162-follow','1');
   follow.innerHTML='<span aria-hidden="true">▶</span><b>متابعة</b>';
   follow.setAttribute('aria-pressed','false');follow.addEventListener('click',clickFollow)}
  if(bar.firstElementChild!==follow)bar.insertBefore(follow,bar.firstChild);
  bar.setAttribute('data-bq162-four-tools','1');syncFollow(follow);
 }
 function repair(row){if(!row||row.classList.contains('b118CarryArticle'))return;
  narrator(row);notes(row);tools(row);
 }
 function scan(){var h=d.getElementById('tafsirAyahs');if(!h)return false;
  var all=rows();for(var i=0;i<all.length;i++)repair(all[i]);
  if(h!==root){if(watch)watch.disconnect();root=h;
   if(w.MutationObserver){watch=new w.MutationObserver(function(changes){
    // Only react to native rows, mic/note controls or toolbars being inserted,
    // not our host relocation, attributes or notes being updated.
    for(var i=0;i<changes.length;i++){
     var m=changes[i];if(m.type!=='childList'||!m.addedNodes.length)continue;
     for(var j=0;j<m.addedNodes.length;j++){
      var x=m.addedNodes[j];if(x.nodeType!==1)continue;
      if(x.classList.contains('bq162NativeNarratorHost')||x.hasAttribute('data-bq162-follow'))continue;
      if(x.matches('.v194T2Ayah,.v194T2Qrow,.basairB231AyahActions,button.p144MicButton,button.b263r3NoteChip,.p149NoteSlot')||
       x.querySelector('.v194T2Ayah,.basairB231AyahActions,button.p144MicButton,button.b263r3NoteChip')){
       schedule();return;
      }
     }
    }
   });watch.observe(h,{childList:true,subtree:true})}
  }return true;
 }
 function schedule(){if(queued)return;queued=true;(w.requestAnimationFrame||function(f){return w.setTimeout(f,16)})(function(){queued=false;scan()})}
 function init(){if(scan())return;if(tries++<40)w.setTimeout(init,160)}
 d.addEventListener('click',function(ev){var t=ev.target;if(t&&t.closest&&
  t.closest('#tafsirAyahs .v194T2Ayah')&&!t.closest('button[data-bq162-follow]'))schedule()},false);
 d.addEventListener('visibilitychange',function(){if(!d.hidden){schedule();refreshFollow()}});
 w.addEventListener('pageshow',schedule);
 // Periodic reconciliation covers APK's own P153 sweeps and late per-ayah
 // mic reparenting without a second narration instance or observer feedback loop.
 w.setInterval(function(){if(!d.hidden){scan();refreshFollow()}},1400);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_TAFSIR_P162_LAYOUT__={version:VERSION,refresh:schedule,status:function(){return{
  version:VERSION,narrators:d.querySelectorAll('#tafsirAyahs .bq162NativeNarratorHost > button.p144MicButton').length,
  noteOwners:Array.from(rows()).map(function(r){return r.getAttribute('data-bq162-note-owner')}),
  follow:d.querySelectorAll('#tafsirAyahs [data-bq162-follow]').length,counters:Object.assign({},stats)
 }}};
})(window,document);
