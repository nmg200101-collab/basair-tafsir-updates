/* BASAIR P175 — One authoritative view owner for the INDEX toolbar only.
 * All existing B233/P153/R3 buttons and click handlers stay intact.
 * The 114-surah index, verse reader, follow, narrator, note data, and QA-050
 * are out of scope. No new button, store, or note editor is created.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P175_SINGLE_INDEX_OWNER__)return;
 var VERSION='P175-TAFSIR-INDEX-SINGLE-OWNER',obs=null,scheduled=false,working=false;
 var ticks=0,success=0,missing=0,changes=0,lastReason='initial';
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
 function apply(root,bar){
   var saved=first('#p153FavoritesIndex',bar);
   if(!saved&&w.__BASAIR_TAFSIR_P153_STABLE__&&typeof w.__BASAIR_TAFSIR_P153_STABLE__.refresh==='function'){
     try{w.__BASAIR_TAFSIR_P153_STABLE__.refresh();}catch(_){ }
     saved=first('#p153FavoritesIndex',bar);
   }
   var type=resolveType(bar);
   var follow=findNamed(bar,/متابعة\s*التفسير/);
   var last=findNamed(bar,/آخر\s*موضع/);
   if(!saved||!type||!follow||!last){missing++;return false;}
   // Do not move, clone, replace, or remove native nodes. Their ORIGINAL
   // B233/P153 event registrations still own all actions and saved state.
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
   var old=all('#basairTafsirB232FavoritesBtn,#p153NotesIndex,'+
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
       var root=list[i],bs=bars(root);
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
       return !!(m.target.matches&&m.target.matches(BAR)&&
         w.getComputedStyle(m.target).display!=='grid');
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
     owned:all(INDEX+'[data-bq175-owned="1"]').length,
     ticks:ticks,success:success,missing:missing,changes:changes,lastReason:lastReason};}
 };
})(window,document);
