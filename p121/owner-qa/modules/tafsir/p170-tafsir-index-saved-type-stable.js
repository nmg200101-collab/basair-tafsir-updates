/* BASAIR P170 — index-only: native Saved hub, type chooser, stable repaint.
 * No changes to B233 listeners, R2/R3 storage, narrator, Follow or reader.
 * The original Favorites trigger opens the existing Favorites/Notes panel.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P170_INDEX__)return;
 var VERSION='P170-UNIFIED-SAVED-INDEX-STABILITY';
 var applied=0,repairs=0,pending=false,observed=false;
 function E(id){return d.getElementById(id)}
 function isSearch(el){
  return !!(el&&el.matches&&el.matches(
   'button[data-b233-top="search"],button[data-bq155-notes],button[data-bq156-notes],#p153NotesIndex'));
 }
 function chooseType(bar,fav){
  var children=bar.children;
  for(var i=0;i<children.length;i++){
   var el=children[i];
   if(el!==fav&&!isSearch(el)&&/نوع\s*التفسير/.test(el.textContent||''))return el;
  }
  // B233 native index order: tafsir type is the first control (RTL).
  var first=bar.firstElementChild;
  return first&&first!==fav&&!isSearch(first)?first:null;
 }
 function sync(){
  var idx=E('tafsirIndex'),bar=E('basairTafsirB233TopBar');
  if(!idx||!bar||!idx.contains(bar))return false;
  var fav=bar.querySelector('#basairTafsirB232FavoritesBtn');
  if(!fav)return false;
  var type=chooseType(bar,fav);
  if(!type)return false;
  var fresh=idx.getAttribute('data-bq170-index-ready')!=='1'||
   fav.getAttribute('data-bq170-saved')!=='1'||
   type.getAttribute('data-bq170-type')!=='1';
  // Retain the native button, ID, event handler and Favorites/Notes data.
  // Only its visual label and accessible name change via scoped styling.
  fav.setAttribute('data-bq170-saved','1');
  if(fav.getAttribute('aria-label')!=='المفضلة والملاحظات')
   fav.setAttribute('aria-label','المفضلة والملاحظات');
  fav.setAttribute('title','فتح المفضلة والملاحظات');
  type.setAttribute('data-bq170-type','1');
  bar.setAttribute('data-bq170-bar','1');
  idx.setAttribute('data-bq170-index-ready','1');
  if(fresh)applied++;else repairs++;
  return true;
 }
 function schedule(){
  if(pending)return;
  pending=true;
  Promise.resolve().then(function(){pending=false;sync()});
 }
 function relevant(m){
  var t=m.target;
  if(t&&t.nodeType===1&&(t.id==='tafsirIndex'||t.id==='basairTafsirB233TopBar'))return true;
  for(var i=0;i<m.addedNodes.length;i++){
   var n=m.addedNodes[i];
   if(n.nodeType!==1)continue;
   if(n.id==='tafsirIndex'||n.id==='basairTafsirB233TopBar'||
     n.id==='basairTafsirB232FavoritesBtn')return true;
   if(n.querySelector&&n.querySelector('#tafsirIndex,#basairTafsirB233TopBar,#basairTafsirB232FavoritesBtn'))return true;
  }
  return false;
 }
 function observe(){
  if(observed||!d.body||!w.MutationObserver)return;
  observed=true;
  var watch=new w.MutationObserver(function(ms){
   for(var i=0;i<ms.length;i++)if(relevant(ms[i])){schedule();return}
  });
  watch.observe(d.body,{childList:true,subtree:true});
 }
 function start(){sync();observe()}
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
 w.addEventListener('pageshow',schedule);
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});
 w.__BASAIR_TAFSIR_P170_INDEX__={version:VERSION,refresh:sync,status:function(){
  var idx=E('tafsirIndex'),bar=E('basairTafsirB233TopBar');
  return {version:VERSION,ready:!!(idx&&idx.getAttribute('data-bq170-index-ready')==='1'),
   nativeFavorite:!!(bar&&bar.querySelector('#basairTafsirB232FavoritesBtn')),
   hiddenMiniSearch:!!(bar&&bar.querySelector('button[data-b233-top="search"]')),
   savedHubExisting:!!E('basairTafsirB232FavoritesPanel'),
   applied:applied,repairs:repairs};
 }};
})(window,document);
