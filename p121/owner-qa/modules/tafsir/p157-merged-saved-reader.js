/* P157 — merged saved index and first-render Tafsir stability; native B231/B233/R2/R3/R114/STEP5.
 * This replaces P156 on a fresh OTA WebView. No new storage or reader re-render.
 * Owner device diagnosis: no dual-stage index tools; restrict manual-feed ownership to user gestures.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P157_RECOVERY__)return;
 var VERSION='P157-MERGED-SAVED-STABLE-READER', frame=false, liveIndex=null, liveBar=null, liveAyahs=null;
 var indexObserver=null, toolsObserver=null, initAttempts=0, lastBase=null;
 var counters={indexMounts:0,notesOpened:0,toolsMounted:0,followStarts:0,followStops:0,
   manualLoads:0,manualFailures:0,duplicateRejected:0,errors:0};
 var manual={pending:null,epoch:0,gesture:0,gate:0,completed:new Set(),faulted:new Set(),
   lastMode:'',autoToken:0};
 function E(id){return d.getElementById(id)}
 function reader(){return E('tafsirReader')}
 function host(){return E('tafsirAyahs')}
 function active(){var el=reader();return !!(el&&el.classList.contains('active'))}
 function r114(){return w.__BASAIR_TAFSIR_R114__}
 function running(){try{var r=r114();return !!(r&&r.status&&r.status().running)}catch(_){return false}}
 function step2(){return w.__BASAIR_TAFSIR_STEP2__}
 function step5(){return w.__BASAIR_TAFSIR_STEP5__}
 function core(){return w.__BASAIR_TAFSIR_CORE__}
 function locKey(p){return p?String(p.s)+':'+String(p.a)+':'+String(p.type):''}
 function position(row){
  if(!row)return null;
  var bar=row.querySelector('.basairB231AyahActions'),st=null;
  try{var s=step2();st=s&&s.state&&s.state()}catch(_){}
  var p={
   s:Number(row.getAttribute('data-t5-s')||(bar&&bar.getAttribute('data-s'))||(st&&st.s)),
   a:Number((row.classList.contains('v194T5Generated')&&row.getAttribute('data-t5-a'))||row.getAttribute('data-t2ayah')||row.getAttribute('data-t5-a')||(bar&&bar.getAttribute('data-a'))||(st&&st.a)),
   type:String(row.getAttribute('data-t5-type')||(bar&&bar.getAttribute('data-type'))||(st&&st.type)||'basair')
  };
  return Number.isInteger(p.s)&&p.s>=1&&p.s<=114&&Number.isInteger(p.a)&&p.a>=1?p:null;
 }
 function numberOfAyahs(s){
  var c=core(),q=c&&c.q,su=q&&q[s-1];
  return su?Number(su.count||(su.ayahs&&su.ayahs.length)||0):0;
 }
 function next(p){
  if(!p)return null;
  var count=numberOfAyahs(p.s);
  if(!count||p.a>count)return null;
  if(p.a<count)return {s:p.s,a:p.a+1,type:p.type};
  if(numberOfAyahs(p.s+1))return {s:p.s+1,a:1,type:p.type};
  return null;
 }
 function allRows(){
  var h=host();if(!h)return [];
  var base=h.querySelector('.v194T2Ayah:not(.v194T5Generated):not(.b118CarryArticle)');
  if(base&&base!==lastBase){
   lastBase=base;manual.completed.clear();manual.faulted.clear();manual.gate=0;
   cancelPending('new-reader');
  }
  return Array.prototype.filter.call(h.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)'),function(row){
   return row.getAttribute('aria-hidden')!=='true'&&row.getBoundingClientRect().height>0;
  });
 }
 function tail(){
  var rows=allRows(),seen=new Set(),t=null;
  for(var i=0;i<rows.length;i++){
   var p=position(rows[i]),k=locKey(p);
   if(!p||!numberOfAyahs(p.s)||p.a>numberOfAyahs(p.s))continue;
   if(seen.has(k))continue;
   if(t&&locKey(next(t.p))!==k)break;
   t={node:rows[i],p:p};seen.add(k);
  }
  return t;
 }
 function readingRow(){
  var rows=allRows(),target=Math.max(130,Math.min(w.innerHeight*.56,w.innerHeight-145));
  var best=null,dist=Infinity;
  rows.forEach(function(row){
   var r=row.getBoundingClientRect(),v=r.top<=target&&r.bottom>=target?0:
    Math.min(Math.abs(r.top-target),Math.abs(r.bottom-target));
   if(v<dist){best=row;dist=v}
  });
  return best;
 }
 function schedule(){
  if(frame)return;frame=true;
  (w.requestAnimationFrame||function(fn){return w.setTimeout(fn,16)})(function(){
   frame=false;mountIndex();mountTools();syncMode();syncSentinel();
  });
 }
 function selectSaved(kind,tries){
  var tab=d.querySelector('#basairTafsirR3SavedTabs [data-r3-saved-tab="'+kind+'"]');
  if(tab){tab.click();if(kind==='notes')counters.notesOpened++;return}
  if(tries>0)w.setTimeout(function(){selectSaved(kind,tries-1)},100);
  else counters.errors++;
 }
 function openNotes(){
  try{
   var b=w.__BASAIR_TAFSIR_FINAL_B233__,r=w.__BASAIR_TAFSIR_R3__;
   if(!b||!b.favorites||typeof b.favorites.open!=='function')return false;
   b.favorites.open();if(r&&typeof r.favoritesUpgrade==='function')r.favoritesUpgrade();
   selectSaved('notes',3);return true;
  }catch(_){counters.errors++;return false}
 }
 function mountIndex(){
  var idx=E('tafsirIndex'),bar=E('basairTafsirB233TopBar');
  if(!idx||!bar||!idx.contains(bar))return false;
  var favorite=bar.querySelector('#basairTafsirB232FavoritesBtn');
  var note=bar.querySelector('button[data-bq157-notes="1"]');
  var oldSearch=bar.querySelector('button[data-b233-top="search"]');
  if(!favorite||(!note&&!oldSearch))return false;
  if(!note){
   // Replace rather than retask the native search node: old direct search
   // handlers must never execute when opening notes.
   note=d.createElement('button');note.type='button';
   note.setAttribute('data-bq157-notes','1');
   note.setAttribute('aria-label','فتح الملاحظات المحفوظة');
   note.innerHTML='<span aria-hidden="true">✎</span><b>الملاحظات</b>';
   oldSearch.replaceWith(note);
   note.addEventListener('click',function(ev){
    ev.preventDefault();ev.stopPropagation();
    if(!openNotes())counters.errors++;
   });
   counters.indexMounts++;
  }
  var pair=bar.querySelector('.bq157SavedPair');
  if(!pair){
   pair=d.createElement('div');pair.className='bq157SavedPair';
   pair.setAttribute('role','group');
   pair.setAttribute('aria-label','المفضلة والملاحظات');
   bar.insertBefore(pair,note);
  }
  if(note.parentElement!==pair)pair.appendChild(note);
  if(favorite.parentElement!==pair)pair.appendChild(favorite);
  if(favorite.getAttribute('data-bq157-favorite-hook')!=='1'){
   favorite.setAttribute('data-bq157-favorite-hook','1');
   // Preserve B233's original favorite event handler and Saved store.
   favorite.addEventListener('pointerdown',function(){
    w.setTimeout(function(){
     var panel=E('basairTafsirB232FavoritesPanel');
     if(panel&&panel.classList.contains('show'))selectSaved('favorites',1);
    },70);
   },{passive:true});
  }
  bar.setAttribute('data-bq157-ready','1');
  if(idx!==liveIndex||bar!==liveBar){
   if(indexObserver)indexObserver.disconnect();
   liveIndex=idx;liveBar=bar;
   if(w.MutationObserver){
    indexObserver=new w.MutationObserver(function(ms){
     for(var i=0;i<ms.length;i++){
      var m=ms[i];if(m.type!=='childList')continue;
      if(m.target===bar||m.target===idx){schedule();return}
      for(var k=0;k<m.addedNodes.length;k++){
       var n=m.addedNodes[k];if(n.nodeType===1&&n.id==='basairTafsirB233TopBar'){schedule();return}
      }
     }
    });
    indexObserver.observe(idx,{childList:true,subtree:true});
   }
  }
  return true;
 }
 function updateFollow(button){
  if(!button)return;
  var isOn=running(),value=isOn?'true':'false';
  if(button.getAttribute('aria-pressed')===value)return;
  button.setAttribute('aria-pressed',value);
  var label=button.querySelector('b'),glyph=button.querySelector('span');
  if(label)label.textContent=isOn?'إيقاف':'متابعة';
  if(glyph)glyph.textContent=isOn?'■':'▶';
 }
 function cancelPending(reason){
  var task=manual.pending;if(!task)return;
  manual.pending=null;manual.epoch++;
  if(task.observer)task.observer.disconnect();
  w.clearTimeout(task.timer);
  if(task.cleanup)task.cleanup();
  task.reason=reason;
 }
 function syncMode(fromUser){
  var el=reader();if(!active()||!el)return;
  if(!step5()||typeof step5().loadNext!=='function'||!core()||!core().q)return;
  var old=el.getAttribute('data-basair-main-tab')||'tafsir';
  if(old!=='tafsir'&&old!=='p129-manual'&&old!=='p128-follow')return;
  var mode=running()?'p128-follow':'p129-manual';
  // Do not modify the native reader/tab during its initial rendering phase.
  // Ownership of manual pagination starts only after an actual user gesture.
  if(mode==='p129-manual'&&old==='tafsir'&&!fromUser)return;
  if(old!==mode)el.setAttribute('data-basair-main-tab',mode);
  manual.lastMode=mode;
  if(mode==='p128-follow')cancelPending('follow-active');
 }
 function mountTools(){
  var h=host();if(!h)return;
  var bars=h.querySelectorAll('.v194T2Ayah .basairB231AyahActions');
  for(var i=0;i<bars.length;i++){
   var bar=bars[i];if(!bar.querySelector('button[data-r2-action="note"]'))continue;
   var b=bar.querySelector('[data-bq157-follow="1"]');
   if(!b){
    b=d.createElement('button');b.type='button';b.setAttribute('data-bq157-follow','1');
    b.setAttribute('aria-label','متابعة الآية');b.setAttribute('aria-pressed','false');
    b.innerHTML='<span aria-hidden="true">▶</span><b>متابعة</b>';
    b.addEventListener('click',function(ev){
     ev.preventDefault();ev.stopPropagation();toggleFollow(ev.currentTarget||ev.target.closest('[data-bq157-follow]'));
    });
    bar.appendChild(b);counters.toolsMounted++;
   }
   bar.setAttribute('data-bq157-tools','1');
   updateFollow(b);
  }
  if(liveAyahs!==h){
   if(toolsObserver)toolsObserver.disconnect();liveAyahs=h;
   if(w.MutationObserver){
    toolsObserver=new w.MutationObserver(function(ms){
     // Native B231 sometimes mounts its toolbar asynchronously inside an
     // existing article. Detect those specific nodes without reacting to our
     // own Follow button or to text/attribute changes.
     if(ms.some(function(m){
      if(m.type!=='childList')return false;
      return Array.prototype.some.call(m.addedNodes,function(n){return n.nodeType===1&&(
       n.matches&&n.matches('.v194T2Ayah,.basairB231AyahActions,[data-r2-action="note"]')||
       n.querySelector&&n.querySelector('.basairB231AyahActions,[data-r2-action="note"]'));});
     }))schedule();
    });
    toolsObserver.observe(h,{childList:true,subtree:true});
   }
  }
 }
 function visibleTarget(button){
  var row=button&&button.closest('.v194T2Ayah');
  return position(row||readingRow());
 }
 function toggleFollow(button){
  var r=r114(),s=step2();if(!r)return;
  if(running()){
   manual.autoToken++;try{if(typeof r.stop==='function')r.stop();else if(r.toggle)r.toggle()}catch(_){counters.errors++}
   counters.followStops++;syncMode();schedule();return;
  }
  var target=visibleTarget(button),t=++manual.autoToken;
  if(!target){counters.errors++;return}
  cancelPending('follow-request');
  var rows=allRows(),current=null;try{current=s&&s.state&&s.state()}catch(_){}
  var reset=rows.length>1||!current||locKey({s:current.s,a:current.a,type:current.type||'basair'})!==locKey(target);
  function start(){
   if(t!==manual.autoToken||!active())return;
   try{
    if(typeof r.start==='function')r.start();else if(typeof r.toggle==='function')r.toggle();
    counters.followStarts++;syncMode();schedule();
   }catch(_){counters.errors++}
  }
  if(reset&&s&&typeof s.open==='function'){
   try{s.open(target.s,target.a,target.type)}catch(_){counters.errors++;return}
   var passes=0,previous=null,n=0;
   (function wait(){
    if(t!==manual.autoToken||!active())return;
    var h=host(),base=h&&h.querySelector('.v194T2Ayah[data-t2ayah]:not(.v194T5Generated):not(.b118CarryArticle)');
    var match=base&&locKey(position(base))===locKey(target)&&base.getBoundingClientRect().height>0;
    passes=match&&base===previous?passes+1:match?1:0;previous=base;
    if(passes>=2){start();return}
    if(++n<90)w.setTimeout(wait,70);else counters.errors++;
   })();
  }else start();
 }
 function manualAllowed(){
  if(!active()||running()||!step5()||typeof step5().loadNext!=='function')return false;
  var el=reader(),m=el&&el.getAttribute('data-basair-main-tab');
  return m==='p129-manual';
 }
 function nearTail(last){
  if(!last)return false;
  var rect=last.node.getBoundingClientRect();
  var el=reader(),bottom=w.innerHeight||720;
  // Respect a nested WebView scroller when present.
  for(var p=last.node.parentElement;p&&p!==d.body;p=p.parentElement){
   try{var cs=w.getComputedStyle(p);
    if(/auto|scroll/.test(cs.overflowY)&&p.scrollHeight>p.clientHeight+4){
     bottom=Math.min(bottom,p.getBoundingClientRect().bottom);break;
    }
   }catch(_){}
   if(p===el)break;
  }
  return rect.bottom<=bottom+Math.max(120,bottom*.22);
 }
 function syncSentinel(){
  // Keep the unmodified native sentinel during the first verse paint.
  if(!manual.gesture)return;
  var el=E('v194T5Sentinel');if(!el)return;
  el.classList.toggle('p157-manual-sentinel',manualAllowed());
  var button=el.querySelector('[data-bq157-next]');
  if(!button){
   button=d.createElement('button');button.type='button';button.setAttribute('data-bq157-next','1');
   button.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();manual.gesture++;manualNext(true)});
   el.appendChild(button);
  }
  var t=tail(),p=t&&next(t.p);
  button.textContent=manual.pending?'جارٍ تحميل الآية التالية…':p?'عرض الآية التالية ↓':'نهاية السورة أو تعذر تحديد الآية';
  button.disabled=!!manual.pending||!p||!manualAllowed();
 }
 function manualNext(force){
  if(!manualAllowed()||manual.pending)return false;
  if(!force&&(!manual.gesture||Date.now()-manual.gesture>2200))return false;
  var t=tail(),p=t&&next(t.p);if(!t||!p)return false;
  if(!force&&!nearTail(t))return false;
  var transition=locKey(t.p)+'>'+locKey(p);
  if(manual.completed.has(transition)||manual.faulted.has(transition))return false;
  var h=host(),rows=allRows();
  if(rows.some(function(x){return locKey(position(x))===locKey(p)})){
   counters.duplicateRejected++;manual.faulted.add(transition);return false;
  }
  var all=Array.prototype.slice.call(h.querySelectorAll('.v194T5Ayah')),flags=[];
  t.node.setAttribute('data-t5-s',String(t.p.s));
  t.node.setAttribute('data-t5-a',String(t.p.a));
  t.node.setAttribute('data-t5-type',t.p.type);
  all.forEach(function(x){if(x!==t.node){x.classList.remove('v194T5Ayah');flags.push([x,true])}});
  if(!t.node.classList.contains('v194T5Ayah')){
   t.node.classList.add('v194T5Ayah');flags.push([t.node,false]);
  }
  var done=false;
  function restore(){
   if(done)return;done=true;
   flags.forEach(function(item){if(!item[0].isConnected)return;
    if(item[1])item[0].classList.add('v194T5Ayah');else item[0].classList.remove('v194T5Ayah');
   });
  }
  var before=new Set(rows),token=++manual.epoch,begin=Date.now();
  var job={token:token,observer:null,timer:0,cleanup:restore};
  manual.pending=job;
  try{step5().loadNext()}catch(_){
   restore();manual.pending=null;manual.faulted.add(transition);counters.manualFailures++;return false;
  }finally{restore()}
  function finish(success){
   if(manual.pending!==job)return;
   if(job.observer)job.observer.disconnect();w.clearTimeout(job.timer);
   manual.pending=null;
   if(success){manual.completed.add(transition);counters.manualLoads++}
   else {manual.faulted.add(transition);counters.manualFailures++}
   syncSentinel();schedule();
  }
  function inspect(){
   if(manual.pending!==job)return;
   if(!manualAllowed()){cancelPending('reader-changed');return}
   var added=allRows().filter(function(x){return !before.has(x)}),
       good=added.filter(function(x){return locKey(position(x))===locKey(p)});
   if(good.length){
    good.slice(1).forEach(function(x){if(x.classList.contains('v194T5Generated'))x.remove()});
    finish(true);return;
   }
   if(Date.now()-begin>700){
    var wrong=added.filter(function(x){
     return x.classList.contains('v194T5Generated')&&position(x)&&locKey(position(x))!==locKey(p);
    });
    if(wrong.length){wrong.forEach(function(x){x.remove()});finish(false);return}
   }
   if(Date.now()-begin>9200)finish(false);
  }
  if(w.MutationObserver){
   job.observer=new w.MutationObserver(function(ms){
    if(ms.some(function(m){return m.target===h&&m.type==='childList'}))inspect();
   });
   job.observer.observe(h,{childList:true});
  }
  job.timer=w.setTimeout(function(){inspect();if(manual.pending===job)finish(false)},9400);
  w.setTimeout(inspect,40);
  syncSentinel();return true;
 }
 function manualGesture(){
  if(!manualAllowed())return;
  manual.gesture=Date.now();syncMode(true);scheduleManual();
 }
 var feedFrame=false;
 function scheduleManual(){
  if(feedFrame)return;feedFrame=true;
  (w.requestAnimationFrame||function(fn){return w.setTimeout(fn,16)})(function(){
   feedFrame=false;if(manualAllowed()){syncSentinel();manualNext(false)}
  });
 }
 function attachReaderListeners(){
  var el=reader();if(!el||el.getAttribute('data-bq157-feed-listeners')==='1')return;
  el.setAttribute('data-bq157-feed-listeners','1');
  var startY=null;
  el.addEventListener('touchstart',function(ev){
   var a=ev.target&&ev.target.closest&&ev.target.closest('button,input,textarea,select');
   var t=ev.touches&&ev.touches[0];startY=!a&&t?t.clientY:null;
  },{passive:true});
  el.addEventListener('touchmove',function(ev){
   var t=ev.touches&&ev.touches[0];
   if(t&&startY!==null&&Math.abs(t.clientY-startY)>10){startY=null;manualGesture()}
  },{passive:true});
  el.addEventListener('wheel',manualGesture,{passive:true});
  el.addEventListener('scroll',scheduleManual,{passive:true});
  w.addEventListener('scroll',scheduleManual,{passive:true});
 }
 function init(){
  var el=reader();if(!el){
   if(initAttempts++<40)w.setTimeout(init,150);return;
  }
  attachReaderListeners();mountIndex();mountTools();syncMode();syncSentinel();
  if(!liveBar&&initAttempts++<40)w.setTimeout(init,150);
 }
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});
 w.addEventListener('pageshow',schedule);
 w.addEventListener('pagehide',function(){manual.autoToken++;cancelPending('pagehide')});
 d.addEventListener('click',function(ev){
  if(ev.target&&ev.target.closest&&ev.target.closest('#tafsirAyahs .v194T2Ayah'))schedule();
 });
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
 w.__BASAIR_TAFSIR_P157_RECOVERY__={version:VERSION,refresh:schedule,openNotes:openNotes,
  manualNext:function(){manual.gesture=Date.now();return manualNext(true)},
  status:function(){return {version:VERSION,active:active(),indexMounted:!!liveBar,mode:manual.lastMode,
   follow:running(),cursor:locKey(tail()&&tail().p),pending:!!manual.pending,
   completed:manual.completed.size,faulted:manual.faulted.size,counters:Object.assign({},counters)}}};
})(window,document);
