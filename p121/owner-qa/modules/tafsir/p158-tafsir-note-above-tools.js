/* BASAIR P158 — restore the small verse Note beside the narrator.
 * The existing R2 note editor and R3 saved notes remain the only data owners.
 * Do not relocate/hide R3's direct-child synchronization anchor in JS.
 * Do not modify ayah scroll, Follow, STEP5, reader mode, or bottom tool order.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P158_NOTE_PLACEMENT__)return;
 var VERSION='P158-NOTE-ABOVE-FOUR-TOOLS',observer=null,watched=null,queued=false,attempts=0;
 var counts={mounted:0,restored:0,opened:0,failures:0};
 function pos(row){
  var bar=row&&row.querySelector('.basairB231AyahActions'),native=row&&row.querySelector(':scope > .b263r3NoteChip[data-r3-note-pos]');
  var raw=native&&native.getAttribute('data-r3-note-pos'),match=raw&&raw.match(/^(\d{1,3}):(\d{1,3})$/);
  var st=null;try{var step=w.__BASAIR_TAFSIR_STEP2__;st=step&&step.state&&step.state()}catch(_){}
  var s=Number(row.getAttribute('data-t5-s')||(bar&&bar.getAttribute('data-s'))||(match&&match[1])||(st&&st.s)),
      a=Number(row.getAttribute('data-t2ayah')||row.getAttribute('data-t5-a')||(bar&&bar.getAttribute('data-a'))||(match&&match[2])||(st&&st.a));
  return Number.isInteger(s)&&s>=1&&s<=114&&Number.isInteger(a)&&a>=1&&a<=286?{s:s,a:a}:null;
 }
 function saved(p){
  try{var api=w.__BASAIR_TAFSIR_R2__;return !!(p&&api&&api.notes&&typeof api.notes.get==='function'&&api.notes.get(p.s,p.a))}
  catch(_){return false}
 }
 function updateButton(button,row){
  var p=pos(row),exists=saved(p);
  button.disabled=!p;
  button.classList.toggle('has-note',exists);
  button.setAttribute('aria-label',p?(exists?'تعديل ملاحظة الآية':'إضافة ملاحظة للآية'):'موضع الآية غير محدد');
 }
 function onNote(ev){
  ev.preventDefault();ev.stopPropagation();
  var button=ev.currentTarget,row=button&&button.closest('.v194T2Ayah'),p=pos(row);
  var r2=w.__BASAIR_TAFSIR_R2__;
  if(!p||!r2||typeof r2.openNote!=='function'){counts.failures++;return}
  try{r2.openNote(p.s,p.a);counts.opened++;w.setTimeout(function(){if(button.isConnected)updateButton(button,row)},120)}
  catch(_){counts.failures++}
 }
 function place(row){
  var actions=row.querySelector('.basairB231AyahActions');if(!actions)return;
  var button=row.querySelector('button[data-bq158-verse-note="1"]'),mic=row.querySelector('button.p144MicButton');
  var micStrip=mic&&mic.closest('.p146TopMic,.p145TopControls');
  // The real native mic strip is the first choice, matching the owner screenshot.
  // If APK uses a different structure, keep a small dedicated row ABOVE tools.
  var upper=micStrip;
  if(!upper){
   upper=row.querySelector('.bq158NoteUpperRow');
   if(!upper){upper=d.createElement('div');upper.className='bq158NoteUpperRow';upper.setAttribute('role','group');
    upper.setAttribute('aria-label','ملاحظة الآية');actions.insertAdjacentElement('beforebegin',upper)}
  }
  if(!button){
   button=d.createElement('button');button.type='button';button.className='bq158NoteChip';
   button.setAttribute('data-bq158-verse-note','1');
   button.innerHTML='<span aria-hidden="true">✎</span><b>ملاحظة</b>';
   button.addEventListener('click',onNote);counts.mounted++;
  }
  if(button.parentElement!==upper){
   if(micStrip&&mic&&mic.parentElement===upper)mic.insertAdjacentElement('beforebegin',button);
   else upper.appendChild(button);
   counts.restored++;
  }
  if(row.getAttribute('data-bq158-note-ready')!=='1')row.setAttribute('data-bq158-note-ready','1');
  updateButton(button,row);
 }
 function mount(){
  var host=d.getElementById('tafsirAyahs');if(!host)return false;
  var rows=host.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
  for(var i=0;i<rows.length;i++)place(rows[i]);
  if(watched!==host){
   if(observer)observer.disconnect();watched=host;
   if(w.MutationObserver){
    observer=new w.MutationObserver(function(mutations){
     // Only native row/action/mic insertions; NEVER react to our own note or text changes.
     for(var i=0;i<mutations.length;i++){
      var m=mutations[i];if(m.type!=='childList'||!m.addedNodes.length)continue;
      for(var j=0;j<m.addedNodes.length;j++){
       var n=m.addedNodes[j];if(n.nodeType!==1)continue;
       if(n.matches('.v194T2Ayah,.basairB231AyahActions,button.p144MicButton')||
         n.querySelector('.v194T2Ayah,.basairB231AyahActions,button.p144MicButton')){
        schedule();return;
       }
      }
     }
    });observer.observe(host,{childList:true,subtree:true});
   }
  }
  return true;
 }
 function schedule(){
  if(queued)return;queued=true;
  (w.requestAnimationFrame||function(f){return w.setTimeout(f,16)})(function(){queued=false;mount()});
 }
 function init(){if(mount())return;if(attempts++<35)w.setTimeout(init,180)}
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});
 w.addEventListener('pageshow',schedule);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_TAFSIR_P158_NOTE_PLACEMENT__={version:VERSION,refresh:schedule,
  status:function(){return {version:VERSION,visibleNotes:d.querySelectorAll('#tafsirAyahs .bq158NoteChip').length,
   rowsReady:d.querySelectorAll('#tafsirAyahs .v194T2Ayah[data-bq158-note-ready="1"]').length,
   counters:Object.assign({},counts)}}};
})(window,document);
