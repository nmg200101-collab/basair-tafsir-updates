/* BASAIR P176 — preserve Saved/Notes return chain without altering native navigation.
 * R3 remains owner of close/back; R2 remains owner of note edit/save.
 * This module only remembers where a saved verse was opened and restores the
 * ORIGINAL saved panel if native navigation returns from reader to Tafsir index.
 * No storage access, no new note editor, no window.basairBack replacement.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P176_SAVED_RETURN__)return;
 var ctx=null,queued=false,restores=0,recorded=0,missed=0,errors=0;
 function byId(id){return d.getElementById(id);}
 function shown(id){var e=byId(id);return !!(e&&e.classList.contains('show'));}
 function readerActive(){var e=byId('tafsirReader');return !!(e&&e.classList.contains('active'));}
 function indexActive(){var e=byId('tafsirIndex');return !!(e&&e.classList.contains('active'));}
 function record(ev){
  var target=ev.target,hit=target&&target.closest&&target.closest('[data-b232-fav-open],[data-r3-note-open]');
  if(!hit||!hit.closest('#basairTafsirB232FavoritesPanel')||!shown('basairTafsirB232FavoritesPanel'))return;
  var attr=hit.hasAttribute('data-r3-note-open')?'data-r3-note-open':'data-b232-fav-open';
  var key=hit.getAttribute(attr)||'',tab=attr==='data-r3-note-open'?'notes':'favorites';
  if(ctx&&!ctx.enteredReader&&ctx.key===key&&ctx.tab===tab&&Date.now()-ctx.created<350)return;
  var list=byId(tab==='notes'?'basairTafsirR3NotesList':'basairTafsirB232FavoritesList');
  ctx={tab:tab,attr:attr,key:key,scroll:list?list.scrollTop:0,
    created:Date.now(),enteredReader:false,restoring:false};recorded++;
 }
 function clearOnExplicitClose(ev){
  var hit=ev.target&&ev.target.closest&&ev.target.closest('#basairTafsirB232FavoritesClose');
  if(hit&&!readerActive())ctx=null;
 }
 function expire(){if(ctx&&Date.now()-ctx.created>1800000)ctx=null;}
 function restore(){
  if(!ctx||ctx.restoring||!ctx.enteredReader||!indexActive()||readerActive())return false;
  expire();if(!ctx)return false;
  var pending=ctx;pending.restoring=true;
  try{
   // Reuse P157 which opens B233/R3 and selects the existing tab.
   var api=w.__BASAIR_TAFSIR_P157_STABLE__;
   var ok=!!(api&&typeof api.openSaved==='function'&&api.openSaved(pending.tab));
   if(!ok){
    var native=w.__BASAIR_TAFSIR_FINAL_B233__,r3=w.__BASAIR_TAFSIR_R3__;
    if(native&&native.favorites&&typeof native.favorites.open==='function'){
     native.favorites.open();if(r3&&typeof r3.favoritesUpgrade==='function')r3.favoritesUpgrade();
     var tab=d.querySelector('#basairTafsirR3SavedTabs [data-r3-saved-tab="'+pending.tab+'"]');
     if(tab){tab.click();ok=true;}
    }
   }
   if(!ok){pending.restoring=false;missed++;return false;}
   ctx=null;restores++;
   (w.requestAnimationFrame||function(f){f()})(function(){
    var list=byId(pending.tab==='notes'?'basairTafsirR3NotesList':'basairTafsirB232FavoritesList');
    if(list)list.scrollTop=pending.scroll;
    var item=d.querySelector('#basairTafsirB232FavoritesPanel ['+pending.attr+'="'+pending.key.replace(/[^0-9:]/g,'')+'"]');
    if(item){try{item.focus({preventScroll:true})}catch(_){}}
   });
   return true;
  }catch(_){pending.restoring=false;errors++;return false;}
 }
 function sync(){
  if(!ctx)return;
  expire();if(!ctx)return;
  if(readerActive())ctx.enteredReader=true;
  else if(ctx.enteredReader&&indexActive())restore();
 }
 function schedule(){if(queued)return;queued=true;Promise.resolve().then(function(){queued=false;sync();});}
 // pointerdown arrives before the native B233 window-capture click handler,
 // which stops propagation when opening a bookmarked verse.
 w.addEventListener('pointerdown',record,true);
 w.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' ')record(ev);},true);
 w.addEventListener('click',function(ev){record(ev);clearOnExplicitClose(ev);},true);
 function init(){
  if(!d.body||!w.MutationObserver)return;
  new w.MutationObserver(function(ms){
   if(!ctx)return;
   for(var i=0;i<ms.length;i++){
    var m=ms[i];if(m.type==='attributes'&&m.attributeName==='class'&&
       (m.target.id==='tafsirIndex'||m.target.id==='tafsirReader')){schedule();return;}
   }
  }).observe(d.body,{subtree:true,attributes:true,attributeFilter:['class']});
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.addEventListener('pageshow',schedule);w.addEventListener('hashchange',schedule);
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule();});
 w.__BASAIR_TAFSIR_P176_SAVED_RETURN__={refresh:sync,status:function(){return {
  pending:!!ctx,tab:ctx&&ctx.tab,enteredReader:!!(ctx&&ctx.enteredReader),
  recorded:recorded,restored:restores,missed:missed,errors:errors};}};
})(window,document);
