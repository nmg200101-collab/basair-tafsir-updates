/* BASAIR P174 — final approved index appearance. Uses P153's existing
 * Favorites trigger to open the same native R3 Favorites & Notes panel.
 * No new button, store, note editor or follow/reciter hooks. */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P174_NATIVE_INDEX__)return;
 var VERSION='P174-P153-SAVED-ORIGINAL-FULL-TYPE',observer=null,queued=false;
 var applied=0,failures=0;
 function set(el,k,v){if(el&&el.getAttribute(k)!==v)el.setAttribute(k,v)}
 function style(el,k,v){if(el&&(el.style.getPropertyValue(k)!==v||el.style.getPropertyPriority(k)!=='important'))
   el.style.setProperty(k,v,'important');}
 function roots(){return Array.prototype.slice.call(d.querySelectorAll('#tafsirIndex,[data-basair-tafsir-index="1"]'))}
 function typeOf(bar){var a=Array.prototype.slice.call(bar.children);
   for(var i=0;i<a.length;i++)if(/نوع\s*التفسير/.test(a[i].textContent||''))return a[i];
   return a[0]||null;
 }
 function fullName(type){var select=type&&type.querySelector('select');
   if(!select)return '';
   var o=select.selectedOptions&&select.selectedOptions[0];
   return (o&&(o.textContent||o.label)||'').trim();
 }
 function syncOne(root){
   var bar=root.querySelector('#basairTafsirB233TopBar');if(!bar)return false;
   var anchor=bar.querySelector('#basairTafsirB232FavoritesBtn');if(!anchor)return false;
   // P153 was already designed to survive B233's window capture interceptor.
   var saved=bar.querySelector('#p153FavoritesIndex');
   if(!saved&&w.__BASAIR_TAFSIR_P153_STABLE__){
     try{w.__BASAIR_TAFSIR_P153_STABLE__.refresh();}catch(_){}
     saved=bar.querySelector('#p153FavoritesIndex');
   }
   if(!saved)return false;
   var type=typeOf(bar);if(!type)return false;
   set(saved,'data-bq174-saved','1');
   set(saved,'data-p153-tab','favorites');
   set(saved,'aria-label','المفضلة والملاحظات');
   var title=saved.querySelector('b');if(title&&title.textContent!=='المفضلة والملاحظات')
     title.textContent='المفضلة والملاحظات';
   style(saved,'display','flex');style(saved,'visibility','visible');
   style(saved,'pointer-events','auto');
   // Keep B233's old internal Favorites anchor intact but never visible.
   style(anchor,'display','none');style(anchor,'visibility','hidden');
   var stale=bar.querySelectorAll('button[data-bq171-saved="1"],button[data-bq173-owner="1"]');
   for(var i=0;i<stale.length;i++){if(stale[i]===saved)continue;
     style(stale[i],'display','none');style(stale[i],'visibility','hidden');
   }
   var mini=bar.querySelectorAll('button[data-b233-top="search"],#p153NotesIndex,button[data-bq155-notes],button[data-bq156-notes]');
   for(var j=0;j<mini.length;j++){
     style(mini[j],'display','none');style(mini[j],'visibility','hidden');
   }
   set(type,'data-bq174-type','1');
   // Mirror the entire native SELECT value while keeping SELECT usable.
   var select=type.querySelector('select');
   if(select){
     set(type,'data-bq174-has-select','1');
     var mirror=type.querySelector('[data-bq174-value="1"]');
     if(!mirror){mirror=d.createElement('span');mirror.setAttribute('data-bq174-value','1');
       mirror.setAttribute('aria-hidden','true');type.appendChild(mirror);}
     var name=fullName(type);if(mirror.textContent!==name)mirror.textContent=name;
   }
   if(!bar.classList.contains('bq174-native-bar'))bar.classList.add('bq174-native-bar');
   set(root,'data-bq174-ready','1');applied++;return true;
 }
 function sync(){try{var a=roots(),ok=false;
   for(var i=0;i<a.length;i++)ok=syncOne(a[i])||ok;return ok;
   }catch(_){failures++;return false;}}
 function schedule(){if(queued)return;queued=true;
   Promise.resolve().then(function(){queued=false;sync()});}
 function observe(){if(observer||!d.body||!w.MutationObserver)return;
   observer=new w.MutationObserver(function(ms){
     for(var i=0;i<ms.length;i++){
       var m=ms[i];if(m.type==='attributes'){
         if(m.oldValue===m.target.getAttribute(m.attributeName))continue;
         if(m.target.matches&&m.target.matches('#tafsirIndex,#basairTafsirB233TopBar,[data-basair-tafsir-index="1"]')){schedule();return;}
         continue;
       }
       if(m.target&&m.target.closest&&m.target.closest('#tafsirIndex,[data-basair-tafsir-index="1"]')){schedule();return;}
       for(var j=0;j<m.addedNodes.length;j++){
         var n=m.addedNodes[j];if(n.nodeType===1&&n.matches&&n.matches('#tafsirIndex,#basairTafsirB233TopBar')){schedule();return;}
       }
     }
   });
   observer.observe(d.body,{childList:true,subtree:true,attributes:true,
     attributeFilter:['class','hidden','aria-hidden'],attributeOldValue:true});
 }
 function start(){sync();observe()}
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();
 d.addEventListener('change',function(e){
   if(e.target&&e.target.matches&&e.target.matches('#tafsirIndex select'))schedule();
 },true);
 w.addEventListener('pageshow',schedule);w.addEventListener('popstate',schedule);
 w.addEventListener('hashchange',schedule);
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});
 w.__BASAIR_TAFSIR_P174_NATIVE_INDEX__={version:VERSION,refresh:sync,status:function(){
   var r=roots()[0],b=r&&r.querySelector('#basairTafsirB233TopBar');
   return {version:VERSION,ready:!!(r&&r.getAttribute('data-bq174-ready')==='1'),
     nativeP153Saved:!!(b&&b.querySelector('#p153FavoritesIndex')),
     typeValue:b?fullName(typeOf(b)):'',applied:applied,failures:failures};
 }};
})(window,document);
