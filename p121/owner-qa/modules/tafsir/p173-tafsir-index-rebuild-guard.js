/* BASAIR P173 — persistent Tafsir index toolbar after late native SPA render.
 * P171/Seq48 and all protected assets remain unchanged. This is a scoped
 * final-pass reconciler, not a second Notes/Favorites store or verse engine.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P173_REBUILD_GUARD__)return;
 var version='P173-INDEX-RENDER-GUARD';
 var observer=null,queued=false,boots=0,repairs=0,opens=0,failures=0,lastRoot=null;
 function all(q,root){return Array.prototype.slice.call((root||d).querySelectorAll(q))}
 function visible(e){
  if(!e||!e.isConnected||e.hidden)return false;
  try{if(e.getClientRects&&e.getClientRects().length===0)return false;
   var s=w.getComputedStyle&&w.getComputedStyle(e);
   if(s&&(s.display==='none'||s.visibility==='hidden'))return false;
  }catch(_){}return true;
 }
 function index(){
  var a=all('#tafsirIndex,[data-basair-tafsir-index="1"]');
  if(!a.length)a=all('.tafsir-index,.tafsirIndex');
  if(!a.length)return null;
  var chosen=null,score=-1;
  for(var j=0;j<a.length;j++){
   var n=a[j];if(n.closest('#tafsirReader'))continue;
   var s=(visible(n)?8:0)+(n.classList.contains('active')?6:0)+
     (n.querySelector('input[id*="SurahSearch"],input[placeholder*="سورة"]')?3:0);
   if(s>=score){score=s;chosen=n}
  }
  return chosen;
 }
 function favorite(root){
  var b=root.querySelector('#basairTafsirB232FavoritesBtn');
  if(b)return b;
  var candidates=all('button,[role="button"]',root);
  for(var j=0;j<candidates.length;j++){
   var x=candidates[j];if(x.closest('#bq157SavedGroup,#basairTafsirB232FavoritesPanel')||
      x.hasAttribute('data-bq171-saved')||x.hasAttribute('data-bq173-owner'))continue;
   var t=(x.textContent||'')+' '+(x.getAttribute('aria-label')||'');
   if(/المفضلة/.test(t)&&!/الملاحظات/.test(t))return x;
  }return null;
 }
 function type(root,fav){
  var a=all('button,label,span,small,b,strong,[role="combobox"]',root);
  for(var j=0;j<a.length;j++){
   var e=a[j],label=(e.textContent||'').replace(/\s+/g,' ').trim();
   if(!/نوع\s*التفسير/.test(label)||label.length>100||e===fav||e.contains(fav))continue;
   var n=e,depth=0;
   while(n&&n!==root&&depth++<4){
    if(n.contains(fav))break;
    if(n.querySelector('select,[role="combobox"]'))return n;
    if(n.tagName==='BUTTON')return n;
    n=n.parentElement;
   }
   if(e.tagName==='LABEL')return e;
  }
  return null;
 }
 function toolbar(root,fav,t){
  var known=root.querySelector('#basairTafsirB233TopBar');
  if(known&&known.contains(fav)&&known.contains(t))return known;
  var n=fav.parentElement;
  while(n&&n!==root){
   if(n.contains(t)&&all('button,[role="button"]',n).length>=3&&
       !n.querySelector('#v194T104SurahSearchInput'))return n;
   n=n.parentElement;
  }return null;
 }
 function mini(bar,old){
  var selectors='button[data-b233-top="search"],button[data-bq155-notes],'+
    'button[data-bq156-notes],#p153NotesIndex';
  var known=bar.querySelector(selectors);
  if(known&&known!==old)return known;
  var a=all('button',bar);
  for(var j=0;j<a.length;j++){
   var b=a[j];if(b===old||b.hasAttribute('data-bq171-saved')||b.hasAttribute('data-bq173-owner'))continue;
   var value=((b.getAttribute('aria-label')||'')+' '+(b.textContent||'')).trim();
   if(/^(بحث|البحث|فتح البحث|بحث مصغر|⌕|🔍|🔎)$/.test(value))return b;
   if(/بحث/.test(b.getAttribute('aria-label')||'')&&!b.querySelector('input'))return b;
   if(!b.textContent.trim()&&b.querySelector('svg')&&Math.abs(a.indexOf(old)-j)<=2)return b;
  }return null;
 }
 function openSaved(){
  try{
   var p=w.__BASAIR_TAFSIR_P157_STABLE__;
   if(p&&typeof p.openSaved==='function'&&p.openSaved('favorites')){opens++;return true}
   var b=w.__BASAIR_TAFSIR_FINAL_B233__,r=w.__BASAIR_TAFSIR_R3__;
   if(!b||!b.favorites||typeof b.favorites.open!=='function')throw Error('Saved API unavailable');
   b.favorites.open();if(r&&typeof r.favoritesUpgrade==='function')r.favoritesUpgrade();
   var tab=d.querySelector('#basairTafsirR3SavedTabs [data-r3-saved-tab="favorites"]');
   if(tab)tab.click();opens++;return true;
  }catch(_){failures++;return false}
 }
 function onClick(ev){
  var t=ev.target&&ev.target.closest&&ev.target.closest('button[data-bq173-owner="1"]');
  if(!t||!t.closest('#tafsirIndex,[data-basair-tafsir-index="1"]'))return;
  ev.preventDefault();ev.stopPropagation();
  if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
  if(!openSaved())t.setAttribute('title','تعذر فتح المحفوظات');
 }
 function install(){
  var i=index();if(!i)return false;
  var f=favorite(i),t=f&&type(i,f),bar=t&&toolbar(i,f,t);
  if(!bar)return false;
  var p=bar.querySelector('button[data-bq171-saved="1"],button[data-bq173-owner="1"]');
  if(!p){
   p=d.createElement('button');p.type='button';
   p.innerHTML='<span aria-hidden="true">☆</span><b>المفضلة والملاحظات</b>';
   f.insertAdjacentElement('afterend',p);
  }
  // P171 concurrently watches the same index. Mark our single proxy as its
  // existing proxy so its late refresh cannot create a second button.
  p.setAttribute('data-bq171-saved','1');
  if(p.getAttribute('aria-label')!=='فتح المفضلة والملاحظات')
    p.setAttribute('aria-label','فتح المفضلة والملاحظات');
  p.setAttribute('data-bq173-owner','1');
  f.setAttribute('data-bq173-old','1');
  f.setAttribute('data-bq171-native-anchor','1');
  t.setAttribute('data-bq173-type','1');
  t.setAttribute('data-bq171-type','1');
  var search=mini(bar,f);if(search){
   search.setAttribute('data-bq173-mini','1');
   search.setAttribute('data-bq171-mini','1');
  }
  if(!bar.classList.contains('bq173-bar'))bar.classList.add('bq173-bar');
  if(!bar.classList.contains('bq171-tools'))bar.classList.add('bq171-tools');
  i.setAttribute('data-bq173-ready','1');
  i.setAttribute('data-bq171-ready','1');
  if(i!==lastRoot){lastRoot=i;boots++}repairs++;
  return true;
 }
 function schedule(){
  if(queued)return;queued=true;
  Promise.resolve().then(function(){queued=false;install()});
 }
 function relates(m){
  var t=m.target;
  // Native navigation sometimes switches between two existing index roots
  // by changing .active/style only; no childList mutation is generated.
  if(m.type==='attributes'){
   if(!t||t.nodeType!==1)return false;
   // Ignore no-op classList.add calls made by pre-existing P171 helpers.
   if(m.oldValue===t.getAttribute(m.attributeName))return false;
   if(t.matches&&t.matches('#tafsirIndex,[data-basair-tafsir-index="1"],#basairTafsirB233TopBar'))return true;
   if(t.closest&&t.closest('.bq173-bar,.bq171-tools'))return true;
   if(t.querySelector&&t.querySelector('#tafsirIndex,[data-basair-tafsir-index="1"]'))return true;
   return false;
  }
  if(t&&t.nodeType===1){
   if(t.closest&&t.closest('[data-bq173-owner],#tafsirReader,#tafsirAyahs'))return false;
   if(t.matches&&t.matches('#tafsirIndex,[data-basair-tafsir-index="1"]'))return true;
   if(t.closest&&t.closest('#tafsirIndex,[data-basair-tafsir-index="1"]'))return true;
  }
  var lists=[m.addedNodes,m.removedNodes];
  for(var l=0;l<lists.length;l++)for(var j=0;j<lists[l].length;j++){
   var n=lists[l][j];if(!n||n.nodeType!==1)continue;
   if(n.matches&&n.matches('#tafsirIndex,#basairTafsirB233TopBar,[data-basair-tafsir-index="1"]'))return true;
   if(n.querySelector&&n.querySelector('#tafsirIndex,#basairTafsirB233TopBar,#basairTafsirB232FavoritesBtn'))return true;
  }
  return false;
 }
 function watch(){
  if(observer||!w.MutationObserver||!d.body)return;
  observer=new w.MutationObserver(function(ms){
   // Observe *every* index render, even when the old index remains connected.
   // The previous P171 body guard skipped precisely this scenario.
   for(var j=0;j<ms.length;j++)if(relates(ms[j])){schedule();return}
  });
  observer.observe(d.body,{childList:true,subtree:true,attributes:true,
   attributeFilter:['class','style','hidden','aria-hidden'],attributeOldValue:true});
 }
 function boot(){install();watch()}
 w.addEventListener('click',onClick,true);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 w.addEventListener('pageshow',schedule);
 w.addEventListener('hashchange',schedule);
 w.addEventListener('popstate',schedule);
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});
 w.__BASAIR_TAFSIR_P173_REBUILD_GUARD__={version:version,refresh:install,status:function(){
  var i=index(),bar=i&&i.querySelector('.bq173-bar');return {
   ready:!!(i&&bar&&bar.querySelector('button[data-bq173-owner="1"]')),
   visible:!!(i&&visible(i)),rootActive:!!(i&&i.classList.contains('active')),
   roots:all('#tafsirIndex').length,proxyCount:bar?all('button[data-bq173-owner="1"]',bar).length:0,
   typeFound:!!(bar&&bar.querySelector('[data-bq173-type="1"]')),
   miniFound:!!(bar&&bar.querySelector('[data-bq173-mini="1"]')),
   boots:boots,repairs:repairs,opens:opens,failures:failures};
 }};
})(window,document);
