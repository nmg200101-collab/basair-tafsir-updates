/* BASAIR P155 — native-first Tafsir foundation. No P131/P134/P144/P152
 * OTA scripts or CSS are carried forward. The signed release contains
 * ONLY this enhancement and its small scoped stylesheet.
 * All Quran rendering, ayah pagination, notes/favorites storage, and
 * narrator engines remain owned by the original signed Android APK.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P155_FOUNDATION__)return;
 var VERSION='P155-NATIVE-FIRST-SEQ32',initAttempts=0,ready=false;
 var indexObserver=null,verseObserver=null,indexRoot=null,ayahRoot=null;
 var setupPending=false,counts={index:0,tools:0,notesOpened:0,follow:0,failures:0};
 function E(id){return d.getElementById(id)}
 function schedule(){
  if(setupPending)return;
  setupPending=true;
  (w.requestAnimationFrame||function(f){return w.setTimeout(f,16)})(function(){
   setupPending=false;setupIndex();setupTools();
  });
 }
 function openSavedNotes(){
  try{
   var b=w.__BASAIR_TAFSIR_FINAL_B233__,r=w.__BASAIR_TAFSIR_R3__;
   if(!b||!b.favorites||typeof b.favorites.open!=='function')return false;
   b.favorites.open();
   if(r&&typeof r.favoritesUpgrade==='function')r.favoritesUpgrade();
   var t=d.querySelector('#basairTafsirR3SavedTabs [data-r3-saved-tab="notes"]');
   if(!t)return false;
   t.click();counts.notesOpened++;return true;
  }catch(e){counts.failures++;return false}
 }
 function setupIndex(){
  var idx=E('tafsirIndex'),bar=E('basairTafsirB233TopBar');
  if(!idx||!bar||!idx.contains(bar))return false;
  var favorite=bar.querySelector('#basairTafsirB232FavoritesBtn');
  var mini=bar.querySelector('[data-bq155-notes="1"]')||bar.querySelector('button[data-b233-top="search"]');
  if(!favorite||!mini)return false;
  // Retain B233's REAL favorites button and its original event listener.
  // Reuse the compact search button in place, avoiding any column relocation.
  if(mini.getAttribute('data-bq155-notes')!=='1'){
   mini.removeAttribute('data-b233-top');
   mini.setAttribute('data-bq155-notes','1');
   mini.setAttribute('aria-label','فتح الملاحظات');
   mini.type='button';
   mini.innerHTML='<span aria-hidden="true">✎</span><b>الملاحظات</b>';
   mini.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    if(!openSavedNotes())showNotice('تعذر فتح الملاحظات؛ أعد فتح فهرس التفسير.');
   });
   counts.index++;
  }
  // Do not modify the full Surah/Ayah/Page search below the compact toolbar.
  idx.setAttribute('data-bq155-ready','1');
  if(indexRoot!==idx&&w.MutationObserver){
   if(indexObserver)indexObserver.disconnect();indexRoot=idx;
   indexObserver=new w.MutationObserver(function(m){
    if(m.some(function(x){return x.type==='childList'&&x.target===idx}))schedule();
   });
   indexObserver.observe(idx,{childList:true});
  }
  ready=true;return true;
 }
 function showNotice(message){
  try{
   var msg=E('bq155Status');
   if(!msg){msg=d.createElement('p');msg.id='bq155Status';msg.setAttribute('role','status');
    var target=E('tafsirIndex');if(target)target.appendChild(msg)}
   if(msg){msg.textContent=message;w.setTimeout(function(){if(msg.isConnected)msg.textContent=''},3500)}
  }catch(_){}
 }
 function nativeNote(s,a){
  try{
   var n=w.__BASAIR_TAFSIR_R2__;
   return !!(n&&n.notes&&typeof n.notes.get==='function'&&n.notes.get(s,a));
  }catch(_){return false}
 }
 function getPos(bar){
  return {s:Number(bar.getAttribute('data-s')||1)||1,a:Number(bar.getAttribute('data-a')||1)||1}
 }
 function updateBar(bar){
  if(!bar||!bar.isConnected||!bar.closest('#tafsirAyahs'))return;
  var note=bar.querySelector('button[data-r2-action="note"]');
  // Native B231/R2 owns notes, marking, comparison, copying and their handlers.
  if(!note)return;
  var p=getPos(bar);
  note.classList.toggle('bq155-note-saved',nativeNote(p.s,p.a));
  note.setAttribute('aria-label','ملاحظة الآية');
  var follow=bar.querySelector('button[data-bq155-follow="1"]');
  if(!follow){
   follow=d.createElement('button');follow.type='button';
   follow.setAttribute('data-bq155-follow','1');
   follow.setAttribute('aria-label','متابعة الآية');
   follow.innerHTML='<span aria-hidden="true">▶</span><b>متابعة</b>';
   follow.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    var r=w.__BASAIR_TAFSIR_R114__;
    if(!r||typeof r.toggle!=='function'){showNotice('المتابعة غير متاحة الآن');return}
    try{r.toggle();counts.follow++;updateFollow(follow)}catch(err){counts.failures++;showNotice('تعذر تشغيل المتابعة')}
   });
   bar.appendChild(follow);counts.tools++;
  }
  updateFollow(follow);
  bar.setAttribute('data-bq155-tools','1');
 }
 function updateFollow(button){
  if(!button)return;
  var run=false;
  try{var r=w.__BASAIR_TAFSIR_R114__;run=!!(r&&r.status&&r.status().running)}catch(_){}
  var old=button.getAttribute('aria-pressed');
  if(old!==(run?'true':'false')){
   button.setAttribute('aria-pressed',run?'true':'false');
   button.innerHTML=run?'<span aria-hidden="true">■</span><b>إيقاف</b>':
    '<span aria-hidden="true">▶</span><b>متابعة</b>';
  }
 }
 function setupTools(){
  var root=E('tafsirAyahs');if(!root)return false;
  var bars=root.querySelectorAll('.v194T2Ayah .basairB231AyahActions');
  for(var i=0;i<bars.length;i++)updateBar(bars[i]);
  if(ayahRoot!==root&&w.MutationObserver){
   if(verseObserver)verseObserver.disconnect();ayahRoot=root;
   verseObserver=new w.MutationObserver(function(m){
    // Ignore mere text, CSS or attribute changes: no render/mutation loop.
    if(m.some(function(x){return x.type==='childList'&&x.addedNodes.length}))schedule();
   });
   verseObserver.observe(root,{childList:true,subtree:true});
  }
  return true;
 }
 function init(){
  setupIndex();setupTools();
  if(!ready&&initAttempts++<32)w.setTimeout(init,150);
 }
 d.addEventListener('click',function(e){
  // The original B231 selection handler creates the toolbar synchronously.
  // A single deferred sync sees that toolbar without hijacking the tap.
  var t=e.target;
  if(t&&t.closest&&t.closest('#tafsirAyahs .v194T2Ayah'))schedule();
 },false);
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});
 w.addEventListener('pageshow',schedule);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
 w.__BASAIR_TAFSIR_P155_FOUNDATION__={
  version:VERSION,refresh:schedule,openNotes:openSavedNotes,
  status:function(){return {ready:ready,notesButton:!!d.querySelector('[data-bq155-notes="1"]'),
   favoriteButton:!!E('basairTafsirB232FavoritesBtn'),
   verseBars:d.querySelectorAll('#tafsirAyahs .basairB231AyahActions').length,
   nativeNotes:!!w.__BASAIR_TAFSIR_R2__,nativeSaved:!!w.__BASAIR_TAFSIR_R3__,
   counters:Object.assign({},counts)}}
 };
})(window,document);
