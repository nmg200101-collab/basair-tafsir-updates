/* BASAIR P157 — Tafsir native-owner stability.
 * One index saved control group; no duplicate Search/Favorites buttons.
 * NEVER change data-basair-main-tab, STEP5, reader articles, or native action listeners.
 * The signed Android B231/STEP5/R114/R2/R3 remains sole reader owner.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P157_STABLE__)return;
 var VERSION='P157-NATIVE-STABLE-SAVED-GROUP',idxWatch=null,watched=null,queued=false,attempt=0;
 var stats={indexMounts:0,indexRepairs:0,notesOpened:0,favoritesOpened:0,failures:0};
 function byId(id){return d.getElementById(id)}
 function mount(){
  var idx=byId('tafsirIndex'),bar=byId('basairTafsirB233TopBar');
  if(!idx||!bar||!idx.contains(bar))return false;
  var nativeFav=bar.querySelector('#basairTafsirB232FavoritesBtn'),
      nativeSearch=bar.querySelector('button[data-b233-top="search"]')||
        bar.querySelector('button[data-bq156-notes],button[data-bq155-notes]');
  if(!nativeFav||!nativeSearch)return false;
  var group=idx.querySelector('#bq157SavedGroup');
  if(!group){
   group=d.createElement('div');group.id='bq157SavedGroup';
   group.setAttribute('role','group');group.setAttribute('aria-label','المفضلة والملاحظات');
   group.innerHTML='<button type="button" data-bq157-saved="favorites" aria-label="فتح المفضلة"><span aria-hidden="true">☆</span><b>المفضلة</b></button>'+
     '<button type="button" data-bq157-saved="notes" aria-label="فتح الملاحظات"><span aria-hidden="true">✎</span><b>الملاحظات</b></button>';
   group.addEventListener('click',function(ev){
    var target=ev.target&&ev.target.closest&&ev.target.closest('button[data-bq157-saved]');
    if(!target||!group.contains(target))return;
    ev.preventDefault();ev.stopPropagation();
    openSaved(target.getAttribute('data-bq157-saved'));
   });
   bar.insertAdjacentElement('afterend',group);
   stats.indexMounts++;
  }else if(group.previousElementSibling!==bar){
   bar.insertAdjacentElement('afterend',group);stats.indexRepairs++;
  }
  // CSS hides ONLY the two original triggers after a usable replacement exists.
  // Keep their native DOM and event listeners intact as B233 internal anchors.
  idx.setAttribute('data-bq157-saved-ready','1');
  if(idx!==watched){
   if(idxWatch)idxWatch.disconnect();watched=idx;
   if(w.MutationObserver){
    idxWatch=new w.MutationObserver(function(mutations){
     for(var i=0;i<mutations.length;i++){
      var m=mutations[i];if(m.type!=='childList')continue;
      if(m.target===idx||m.target===bar){queue();return}
      var n=m.target;
      if(n&&n.closest&&n.closest('#bq157SavedGroup'))continue;
      for(var k=0;k<m.addedNodes.length;k++){
       var a=m.addedNodes[k];if(a.nodeType===1&&
        (a.id==='basairTafsirB233TopBar'||a.id==='basairTafsirB232FavoritesBtn')){queue();return}
      }
     }
    });
    idxWatch.observe(idx,{childList:true,subtree:true});
   }
  }
  return true;
 }
 function queue(){
  if(queued)return;queued=true;
  (w.requestAnimationFrame||function(f){return w.setTimeout(f,16)})(function(){queued=false;mount()});
 }
 function openSaved(kind){
  if(kind!=='notes'&&kind!=='favorites')return false;
  var b=w.__BASAIR_TAFSIR_FINAL_B233__,r=w.__BASAIR_TAFSIR_R3__;
  if(!b||!b.favorites||typeof b.favorites.open!=='function'){stats.failures++;return false}
  try{
   b.favorites.open();
   if(r&&typeof r.favoritesUpgrade==='function')r.favoritesUpgrade();
   var tab=d.querySelector('#basairTafsirR3SavedTabs [data-r3-saved-tab="'+kind+'"]');
   if(!tab){stats.failures++;return false}
   tab.click();
   var group=byId('bq157SavedGroup');
   if(group){
    var buttons=group.querySelectorAll('button[data-bq157-saved]');
    for(var i=0;i<buttons.length;i++)buttons[i].setAttribute('aria-pressed',
      buttons[i].getAttribute('data-bq157-saved')===kind?'true':'false');
   }
   stats[kind==='notes'?'notesOpened':'favoritesOpened']++;return true;
  }catch(_){stats.failures++;return false}
 }
 function init(){
  if(mount())return;
  if(attempt++<40)w.setTimeout(init,150);
 }
 d.addEventListener('visibilitychange',function(){if(!d.hidden)queue()});
 w.addEventListener('pageshow',queue);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
 w.__BASAIR_TAFSIR_P157_STABLE__={version:VERSION,refresh:queue,openSaved:openSaved,
  status:function(){
   var reader=byId('tafsirReader'),ayahs=byId('tafsirAyahs'),group=byId('bq157SavedGroup');
   return {version:VERSION,indexReady:!!(group&&group.isConnected),
    savedButtons:group?group.querySelectorAll('button').length:0,
    readerMode:reader&&reader.getAttribute('data-basair-main-tab'),
    nativeVerseTools:ayahs?ayahs.querySelectorAll('.basairB231AyahActions button').length:0,
    nativeStep5:!!(w.__BASAIR_TAFSIR_STEP5__&&w.__BASAIR_TAFSIR_STEP5__.loadNext),
    oldP156Present:!!w.__BASAIR_TAFSIR_P156_RECOVERY__,
    counters:Object.assign({},stats)};
  }};
})(window,document);
