/* BASAIR P171 — real-index recovery after P170 reached V695 without visual change.
 * Does not change B233/R3 storage, R114, STEP5, speech or per-ayah tools.
 * Keep P170 stability. Find the real toolbar; use a distinct Favorites proxy:
 * B233's old capture handler can swallow native Favorites clicks.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P171_INDEX__)return;
 var VERSION='P171-NATIVE-SAVED-INDEX-RECOVERY';
 var rootWatch=null,bodyWatch=null,rootSeen=null,queued=false,mounts=0,opens=0,failures=0;
 var listener=null;
 function byId(x){return d.getElementById(x)}
 function index(){
   var i=byId('tafsirIndex');if(i)return i;
   var all=d.querySelectorAll('[id*="tafsir"],[class*="tafsir"]');
   for(var j=0;j<all.length&&j<80;j++){
    var x=all[j];if(x.id==='tafsirReader'||x.closest('#tafsirReader'))continue;
    if(x.querySelector('input[id*="SurahSearch"],input[placeholder*="سورة"]')&&
       /فهرس\s*السور/.test(x.textContent||''))return x;
   }
   return null;
 }
 function buttons(i){return Array.prototype.slice.call(i.querySelectorAll('button,[role="button"]'),0,50)}
 function nativeFavorite(i){
   var b=byId('basairTafsirB232FavoritesBtn');
   if(b&&i.contains(b))return b;
   var a=buttons(i);
   for(var j=0;j<a.length;j++){
    var x=a[j],text=((x.textContent||'')+' '+(x.getAttribute('aria-label')||'')).trim();
    if(x.closest('#bq157SavedGroup')||x.closest('#basairTafsirB232FavoritesPanel'))continue;
    if(/المفضلة/.test(text)&&!/الملاحظات/.test(text))return x;
   }
   return null;
 }
 function typeOption(i,fav){
   var nodes=i.querySelectorAll('button,label,[role="combobox"],select');
   for(var k=0;k<nodes.length;k++){
    var x=nodes[k];if(x===fav||x.contains(fav))continue;
    var s=(x.textContent||'')+' '+(x.getAttribute('aria-label')||'');
    if(!/نوع\s*التفسير/.test(s))continue;
    if(x.tagName==='LABEL'&&x.parentElement&&x.parentElement.querySelector('select'))return x.parentElement;
    return x.closest('button')||x;
   }
   // Some V695 index variants use a span/small title with a sibling SELECT.
   // Target the smallest label wrapper, not the entire Index layout.
   var leaf=i.querySelectorAll('span,small,b,strong,label');
   for(var n=0;n<leaf.length;n++){
    var label=leaf[n],name=(label.textContent||'').trim();
    if(name.length>45||!/نوع\\s*التفسير/.test(name))continue;
    var parent=label.parentElement;
    if(!parent||parent.contains(fav))continue;
    if(parent.querySelector('select,[role="combobox"]'))return parent;
    if(parent.parentElement&&parent.parentElement.querySelector('select,[role="combobox"]')&&
       !parent.parentElement.contains(fav))return parent.parentElement;
   }
   return null;
 }
 function toolbar(i,fav,typ){
   var existing=byId('basairTafsirB233TopBar');
   if(existing&&i.contains(existing)&&existing.contains(fav))return existing;
   var a=fav&&fav.parentElement;
   while(a&&a!==i){
    if(a.contains(typ)){
     var n=a.querySelectorAll('button,[role="button"]').length;
     if(n>=3&&n<=12&&!a.querySelector('#v194T104SurahSearchInput'))return a;
    }
    a=a.parentElement;
   }
   return null;
 }
 function findMini(bar,fav){
   var q=bar.querySelector('button[data-b233-top="search"],button[data-bq155-notes],button[data-bq156-notes],#p153NotesIndex');
   if(q&&q!==fav)return q;
   var items=Array.prototype.slice.call(bar.querySelectorAll('button'));
   for(var j=0;j<items.length;j++){
    var b=items[j];if(b===fav||b.hasAttribute('data-bq171-saved'))continue;
    if(b.closest('#bq157SavedGroup'))continue;
    var name=((b.getAttribute('aria-label')||'')+' '+(b.textContent||'')).trim();
    if(/^(بحث|البحث|بحث مصغر|فتح البحث|⌕|🔍|🔎)$/.test(name))return b;
    if(/بحث/.test(b.getAttribute('aria-label')||'')&&!b.querySelector('input'))return b;
    if(!b.textContent.trim()&&b.querySelector('svg')&&Math.abs(items.indexOf(fav)-j)<=2)return b;
   }
   return null;
 }
 function openSaved(){
  try{
   var p=w.__BASAIR_TAFSIR_P157_STABLE__;
   if(p&&typeof p.openSaved==='function'&&p.openSaved('favorites')){opens++;return true}
   var b=w.__BASAIR_TAFSIR_FINAL_B233__,r=w.__BASAIR_TAFSIR_R3__;
   if(!b||!b.favorites||typeof b.favorites.open!=='function')throw Error('B233 saved API missing');
   b.favorites.open();if(r&&typeof r.favoritesUpgrade==='function')r.favoritesUpgrade();
   var t=d.querySelector('#basairTafsirR3SavedTabs [data-r3-saved-tab="favorites"]');
   if(t)t.click();
   opens++;return true;
  }catch(_){failures++;return false}
 }
 function install(){
   var i=index();if(!i)return false;
   var fav=nativeFavorite(i),typ=typeOption(i,fav);
   if(!fav||!typ)return false;
   var bar=toolbar(i,fav,typ);if(!bar)return false;
   var proxy=bar.querySelector('button[data-bq171-saved="1"]');
   if(!proxy){
    proxy=d.createElement('button');proxy.type='button';
    proxy.setAttribute('data-bq171-saved','1');
    proxy.setAttribute('aria-label','فتح المفضلة والملاحظات');
    proxy.innerHTML='<span aria-hidden="true">☆</span><b>المفضلة والملاحظات</b>';
    proxy.addEventListener('click',function(ev){
     ev.preventDefault();ev.stopPropagation();
     if(!openSaved())proxy.setAttribute('title','تعذر فتح المحفوظات');
    });
    fav.insertAdjacentElement('afterend',proxy);mounts++;
   }
   var search=findMini(bar,fav);
   fav.setAttribute('data-bq171-native-anchor','1');
   typ.setAttribute('data-bq171-type','1');
   bar.classList.add('bq171-tools');
   i.setAttribute('data-bq171-ready','1');
   if(search)search.setAttribute('data-bq171-mini','1');
   // Keep P157's native two-tab panel and cached notes/favorites unchanged.
   if(rootSeen!==i){
    if(rootWatch)rootWatch.disconnect();rootSeen=i;
    if(w.MutationObserver){
     rootWatch=new w.MutationObserver(function(ms){
       for(var n=0;n<ms.length;n++){
        var m=ms[n];if(m.type!=='childList')continue;
        if(m.target===bar||m.target===i){queue();return}
        for(var j=0;j<m.addedNodes.length;j++){
         var x=m.addedNodes[j];
         if(x.nodeType===1&&(x.id==='basairTafsirB233TopBar'||x.id==='basairTafsirB232FavoritesBtn')){queue();return}
        }
       }
     });
     rootWatch.observe(i,{childList:true,subtree:true});
    }
   }
   return true;
 }
 function queue(){
  if(queued)return;queued=true;
  (w.requestAnimationFrame||function(f){w.setTimeout(f,16)})(function(){queued=false;install()});
 }
 function watchBody(){
  if(!w.MutationObserver||!d.body)return;
  if(bodyWatch)return;
  bodyWatch=new w.MutationObserver(function(ms){
   if(rootSeen&&rootSeen.isConnected)return;
   for(var j=0;j<ms.length;j++){
    if(ms[j].addedNodes.length){queue();return}
   }
  });
  bodyWatch.observe(d.body,{childList:true,subtree:true});
 }
 function start(){install();watchBody()}
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();
 w.addEventListener('pageshow',queue);
 d.addEventListener('visibilitychange',function(){if(!d.hidden)queue()});
 w.__BASAIR_TAFSIR_P171_INDEX__={version:VERSION,refresh:install,status:function(){
  var i=index(),bar=i&&i.querySelector('.bq171-tools');
  return {version:VERSION,ready:!!(i&&i.getAttribute('data-bq171-ready')==='1'),
   hasNativeFavorites:!!(i&&nativeFavorite(i)),hasToolbar:!!bar,
   hasType:!!(bar&&bar.querySelector('[data-bq171-type]')),
   miniFound:!!(bar&&bar.querySelector('[data-bq171-mini]')),
   proxyCount:bar?bar.querySelectorAll('[data-bq171-saved="1"]').length:0,
   mounts:mounts,opens:opens,failures:failures};
 }};
})(window,document);
