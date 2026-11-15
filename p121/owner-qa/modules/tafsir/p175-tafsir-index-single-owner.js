/* BASAIR P175 — One authoritative view owner for the INDEX toolbar only.
 * All existing B233/P153/R3 buttons and click handlers stay intact.
 * The 114-surah index, verse reader, follow, narrator, note data, and QA-050
 * are out of scope. No new button, store, or note editor is created.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P175_SINGLE_INDEX_OWNER__)return;
 var VERSION='P175-TAFSIR-INDEX-SINGLE-OWNER',obs=null,scheduled=false,working=false;
 var ticks=0,success=0,missing=0,changes=0,lastReason='initial',opens=0,openErrors=0;
 var INDEX='#tafsirIndex,[data-basair-tafsir-index="1"]';
 var BAR='#basairTafsirB233TopBar';
 function all(q,r){return Array.prototype.slice.call((r||d).querySelectorAll(q));}
 // Normalize CSSOM values once, otherwise e.g. minmax(0,1fr) becomes
 // minmax(0px, 1fr) and a MutationObserver can repaint forever.
 var normalizer=d.createElement('div').style,normalCache={};
 function normalized(name,value){var key=name+'|'+value;
   if(Object.prototype.hasOwnProperty.call(normalCache,key))return normalCache[key];
   normalizer.setProperty(name,value,'important');
   var n=normalizer.getPropertyValue(name);normalizer.removeProperty(name);
   normalCache[key]=n||value;return normalCache[key];
 }
 function put(e,name,value){if(!e)return;
   if(e.style.getPropertyValue(name)!==normalized(name,value)||
      e.style.getPropertyPriority(name)!=='important'){
     e.style.setProperty(name,value,'important');changes++;
   }
 }
 function attr(e,k,v){if(e&&e.getAttribute(k)!==v)e.setAttribute(k,v);}
 function isVisible(e){
   if(!e||!e.isConnected||e.hidden||e.getAttribute('aria-hidden')==='true')return false;
   if(e.getClientRects&&e.getClientRects().length===0)return false;
   try{var s=w.getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden')return false;}catch(_){}
   return true;
 }
 function roots(){return all(INDEX).filter(function(e){return !e.closest('#tafsirReader');});}
 function bars(root){return all(BAR,root);}
 function first(q,r){return r.querySelector(q);}
 function resolveType(bar){
   var nodes=Array.prototype.slice.call(bar.children);
   for(var i=0;i<nodes.length;i++){
     var e=nodes[i];if(/نوع\s*التفسير/.test(e.textContent||'')||e.matches('[data-bq174-type="1"],[data-bq173-type="1"]'))return e;
   }
   // Original B233 puts the type selector in its FIRST slot.
   var one=nodes[0];if(one&&one.querySelector('select,[role="combobox"]'))return one;
   return null;
 }
 function findNamed(bar,pattern){
   var children=Array.prototype.slice.call(bar.children);
   for(var i=0;i<children.length;i++){
     var x=children[i],v=(x.textContent||'')+' '+(x.getAttribute('aria-label')||'');
     if(pattern.test(v))return x;
   }
   return null;
 }
 function sourceValue(type){
   var select=type.querySelector('select');
   if(select){var option=select.selectedOptions&&select.selectedOptions[0];
     return option?(option.textContent||option.label||'').trim():'';
   }
   var named=type.querySelector('[data-bq174-value="1"]');if(named)return (named.textContent||'').trim();
   var raw=(type.textContent||'').replace(/نوع\s*التفسير/g,'').trim();return raw;
 }
 function show(e){put(e,'display','flex');put(e,'visibility','visible');put(e,'opacity','1');put(e,'pointer-events','auto');}
 function hide(e){put(e,'display','none');put(e,'visibility','hidden');put(e,'pointer-events','none');}
 function sourceMirror(type){
   var select=type.querySelector('select');
   // A button already renders its own full text. Adding a text mirror there
   // would recursively duplicate its label during each native rerender.
   if(!select)return;
   var name=sourceValue(type);if(!name)return;
   var mirror=first('[data-bq175-full-value="1"],[data-bq174-value="1"]',type);
   if(!mirror){mirror=d.createElement('span');mirror.setAttribute('data-bq175-full-value','1');
     mirror.setAttribute('aria-hidden','true');type.appendChild(mirror);
   }else attr(mirror,'data-bq175-full-value','1');
   if(mirror.textContent!==name)mirror.textContent=name;
   if(select){
     put(type,'position','relative');
     // Keep the native select at full size for touch and accessibility.
     put(select,'position','absolute');put(select,'inset','0');
     put(select,'width','100%');put(select,'height','100%');
     put(select,'z-index','5');put(select,'opacity','0');
     put(select,'pointer-events','auto');
   }else{
     // Non-select B233 source control must remain directly clickable.
     put(mirror,'display','none');
   }
 }
 // V695's OTA manifest does not ship P153.js by itself. It may be
 // bundled in the signed APK, or entirely absent. Never assume availability.
 // A fallback VIEW button is created only when the original P153 entry does
 // not exist; both variants invoke the SAME native B233/R3 saved panel.
 function openNativeSaved(){
   try{
     var v=w.__BASAIR_TAFSIR_P157_STABLE__;
     if(v&&typeof v.openSaved==='function'&&v.openSaved('favorites')){opens++;return true;}
     var b=w.__BASAIR_TAFSIR_FINAL_B233__,r=w.__BASAIR_TAFSIR_R3__;
     if(!b||!b.favorites||typeof b.favorites.open!=='function')throw Error('Native saved API unavailable');
     b.favorites.open();
     if(r&&typeof r.favoritesUpgrade==='function')r.favoritesUpgrade();
     var tab=first('#basairTafsirR3SavedTabs [data-r3-saved-tab="favorites"]',d);
     if(tab)tab.click();
     opens++;return true;
   }catch(_){openErrors++;return false;}
 }
 function savedButton(bar){
   var original=first('#p153FavoritesIndex',bar);
   if(!original&&w.__BASAIR_TAFSIR_P153_STABLE__&&
      typeof w.__BASAIR_TAFSIR_P153_STABLE__.refresh==='function'){
     try{w.__BASAIR_TAFSIR_P153_STABLE__.refresh();}catch(_){}
     original=first('#p153FavoritesIndex',bar);
   }
   if(original)return original;
   var fallback=first('#bq175SavedEntry',bar);
   if(fallback)return fallback;
   fallback=d.createElement('button');
   fallback.id='bq175SavedEntry';fallback.type='button';
   fallback.setAttribute('aria-label','فتح المفضلة والملاحظات');
   fallback.innerHTML='<span aria-hidden="true">☆</span><b>المفضلة والملاحظات</b>';
   fallback.addEventListener('click',function(e){
     e.preventDefault();e.stopPropagation();
     if(!openNativeSaved())fallback.setAttribute('title','تعذر فتح المحفوظات');
   });
   bar.appendChild(fallback);
   return fallback;
 }
 // V695 VERIFIED: P117 and P118 are identical to the user-supplied V694 APK.
 // B233's toolbar has NO Follow button. P117/P118 render the actually visible
 // Follow / Favorites / Type / Mini-search toolbar and revive it every 2.2/2.3s.
 // Own THAT native toolbar when present, rather than mounting a second one.
 function reconcileP118(root,topbar){
   var type=topbar.querySelector('.bq-tf117-type'),
       select=type&&type.querySelector('#bqTf117Type'),
       actions=topbar.querySelector('.bq-tf117-actions'),
       follow=topbar.querySelector('#bqTf117Resume'),
       last=topbar.querySelector('#bqTf118Last');
   if(!type||!select||!actions||!follow||!last){missing++;return false;}
   attr(root,'data-bq175-native-p118','1');
   attr(root,'data-bq175-owned','1');
   attr(topbar,'data-bq175-native-p118','1');
   var saved=topbar.querySelector('#bq175P118Saved');
   if(!saved){
     saved=d.createElement('button');saved.id='bq175P118Saved';saved.type='button';
     saved.innerHTML='<span aria-hidden="true">☆</span><b>المفضلة والملاحظات</b>';
     saved.setAttribute('aria-label','فتح المفضلة والملاحظات');
     saved.addEventListener('click',function(e){
       e.preventDefault();e.stopPropagation();
       if(!openNativeSaved())saved.setAttribute('title','تعذر فتح المحفوظات');
     });
     // P118 moves its own controls, but doesn't remove unknown siblings.
     topbar.insertBefore(saved,actions);
   }
   var val=sourceValue(type);
   var mirror=type.querySelector('#bq175P118FullType');
   if(!mirror){
     mirror=d.createElement('span');mirror.id='bq175P118FullType';
     mirror.setAttribute('aria-hidden','true');
     type.appendChild(mirror);
   }
   if(mirror.textContent!==val)mirror.textContent=val;
   attr(type,'data-bq175-type-enhanced','1');
   // P117's own Favorites only expands its old bookmark list (no notes).
   // Keep data/handlers mounted, but present one genuine Saved+Notes entry.
   var oldFav=topbar.querySelector('#bqTf117Favorites');
   if(oldFav)hide(oldFav);
   var mini=topbar.querySelector('#bqTf118SearchAction');
   if(mini)hide(mini);
   // B233/P170-P174 may add a second bar later. Never expose it alongside P118.
   var obsolete=all('#basairTafsirB233TopBar,#bq157SavedGroup',root);
   for(var q=0;q<obsolete.length;q++)hide(obsolete[q]);
   success++;return true;
 }
 function apply(root,bar){
   var type=resolveType(bar);
   var follow=findNamed(bar,/متابعة\s*التفسير/);
   var last=findNamed(bar,/آخر\s*موضع/);
   if(!type||!follow||!last){missing++;return false;}
   var saved=savedButton(bar);
   if(!saved){missing++;return false;}
   // Original B233/P153 nodes are never moved or replaced; when P153 is
   // absent, only ONE presentation button is added, with no data store.
   attr(root,'data-bq175-owned','1');attr(bar,'data-bq175-owned','1');
   attr(saved,'data-bq175-saved','1');
   attr(type,'data-bq175-type','1');
   attr(follow,'data-bq175-follow','1');
   attr(last,'data-bq175-last','1');
   attr(saved,'aria-label','فتح المفضلة والملاحظات');
   var title=saved.querySelector('b');if(title&&title.textContent!=='المفضلة والملاحظات')
     title.textContent='المفضلة والملاحظات';
   // Inline-important resolves ALL previous P170..P174 selector collisions.
   put(bar,'display','grid');put(bar,'grid-template-columns','minmax(0,1.15fr) minmax(0,1fr) minmax(0,1fr)');
   put(bar,'grid-template-rows','auto auto');put(bar,'gap','7px');put(bar,'align-items','stretch');
   put(bar,'width','100%');put(bar,'min-width','0');put(bar,'direction','rtl');
   put(bar,'animation','none');put(bar,'transition','none');
   var cards=[type,saved,follow,last];
   for(var j=0;j<cards.length;j++){
     var e=cards[j];show(e);put(e,'box-sizing','border-box');put(e,'min-width','0');
     put(e,'width','100%');put(e,'max-width','none');put(e,'height','auto');
     put(e,'min-height',j===0?'66px':'56px');put(e,'padding','7px 6px');
     put(e,'margin','0');put(e,'border-radius','15px');
     put(e,'animation','none');put(e,'transition','none');
     put(e,'overflow','visible');put(e,'white-space','normal');
   }
   put(type,'grid-column','1 / -1');put(type,'grid-row','1');
   put(type,'order','0');put(type,'display','flex');put(type,'flex-direction','column');
   put(type,'align-items','stretch');put(type,'justify-content','center');
   put(type,'text-align','right');put(type,'padding','9px 14px');
   put(saved,'grid-column','1');put(saved,'grid-row','2');
   put(saved,'flex-direction','column');put(saved,'justify-content','center');
   put(saved,'align-items','center');put(saved,'text-align','center');
   put(follow,'grid-column','2');put(follow,'grid-row','2');
   put(last,'grid-column','3');put(last,'grid-row','2');
   put(saved,'font-size','12px');
   if(title){put(title,'font-size','12px');put(title,'white-space','normal');
     put(title,'text-overflow','clip');put(title,'overflow','visible');}
   // Internal anchor + legacy P157/P170/P171/P173 duplicates remain mounted,
   // but never become visible even when an earlier stylesheet says !important.
   var old=all('#basairTafsirB232FavoritesBtn,#p153NotesIndex,#bq175SavedEntry,'+
     'button[data-b233-top="search"],button[data-bq155-notes],button[data-bq156-notes],'+
     'button[data-bq171-saved="1"],button[data-bq173-owner="1"],#bq157SavedGroup',root);
   for(var k=0;k<old.length;k++)if(old[k]!==saved)hide(old[k]);
   sourceMirror(type);
   success++;return true;
 }
 function reconcile(){if(working)return false;working=true;ticks++;
   try{
     var any=false,list=roots();
     for(var i=0;i<list.length;i++){
       var root=list[i],primary=root.querySelector('#bqTf118Topbar');
       if(primary){any=reconcileP118(root,primary)||any;continue;}
       var bs=bars(root);
       for(var j=0;j<bs.length;j++)any=apply(root,bs[j])||any;
     }
     return any;
   }catch(_){missing++;return false;}finally{working=false;}
 }
 function schedule(reason){lastReason=reason||'unknown';if(scheduled)return;
   scheduled=true;Promise.resolve().then(function(){scheduled=false;reconcile();});
 }
 function related(m){
   if(m.type==='attributes'){
     if(m.oldValue===m.target.getAttribute(m.attributeName))return false;
     // Do not monitor every child style mutation: old P170-P174 runtimes
     // modify these styles and can create a self-sustaining microtask loop.
     if(m.attributeName==='style'){
       if(m.target.matches&&m.target.matches(BAR)){
         var parent=m.target.closest(INDEX);
         var native=parent&&parent.querySelector('#bqTf118Topbar');
         return w.getComputedStyle(m.target).display!==(native?'none':'grid');
       }
       return false;
     }
     if(m.target.matches&&m.target.matches(INDEX+','+BAR))return true;
     return false;
   }
   var t=m.target;
   if(t&&t.nodeType===1&&t.closest&&t.closest(INDEX))return true;
   var sets=[m.addedNodes,m.removedNodes];
   for(var j=0;j<sets.length;j++)for(var k=0;k<sets[j].length;k++){
     var n=sets[j][k];
     if(n.nodeType===1&&((n.matches&&n.matches(INDEX+','+BAR))||
       (n.querySelector&&n.querySelector(INDEX+','+BAR))))return true;
   }
   return false;
 }
 function start(){reconcile();if(!w.MutationObserver||!d.body)return;
   obs=new w.MutationObserver(function(ms){
     for(var i=0;i<ms.length;i++)if(related(ms[i])){schedule('native-rerender');return;}
   });
   obs.observe(d.body,{childList:true,subtree:true,attributes:true,
     attributeFilter:['class','style','hidden','aria-hidden'],attributeOldValue:true});
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();
 d.addEventListener('change',function(e){if(e.target&&e.target.closest&&e.target.closest(INDEX))schedule('type-change');},true);
 w.addEventListener('pageshow',function(){schedule('pageshow');});
 w.addEventListener('popstate',function(){schedule('popstate');});
 w.addEventListener('hashchange',function(){schedule('hashchange');});
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule('visibilitychange');});
 w.__BASAIR_TAFSIR_P175_SINGLE_INDEX_OWNER__={version:VERSION,refresh:reconcile,
   status:function(){return {version:VERSION,roots:roots().length,
     owned:all('#tafsirIndex[data-bq175-owned="1"],[data-basair-tafsir-index="1"][data-bq175-owned="1"]').length,
     ticks:ticks,success:success,missing:missing,changes:changes,opens:opens,openErrors:openErrors,lastReason:lastReason};}
 };
})(window,document);
