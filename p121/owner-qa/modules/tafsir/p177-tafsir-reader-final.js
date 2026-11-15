/* BASAIR P177 — final Tafsir reader controls. Presentation and navigation only.
 * P144 owns speech, its settings and its original microphone; R3/R2 own saved
 * and notes; P176 owns return-to-saved context. Never replace basairBack.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P177_FINAL__)return;
 var counter={mounted:0,moved:0,duplicates:0,voiceOn:0,settingsIntact:0,selectionCleared:0,
              backRestored:0,indexRecovered:0,backReinstalled:0,errors:0};
 var observer=null,readerObs=null,sheetsWatched=[],scheduled=false,lastVoice=null,fromSavedNote=false,
     pendingHome=false,explicitHome=false,fromSavedAt=0;
 function byId(id){return d.getElementById(id)}
 function isShown(el){return !!(el&&el.classList&&el.classList.contains('show'))}
 function indexActive(){var e=byId('tafsirIndex');return !!(e&&e.classList.contains('active'))}
 function readerActive(){var e=byId('tafsirReader');return !!(e&&e.classList.contains('active'))}
 function tafsirActive(){return indexActive()||readerActive()}
 function narrator(){return w.__BASAIR_TAFSIR_NATIQ_P132__}
 function speaking(){try{var a=narrator();return !!(a&&a.status&&a.status().running)}catch(_){return false}}
 function nativeVoice(row){
  if(!row)return null;
  var all=row.querySelectorAll('button.p144MicButton');
  var best=null;for(var i=0;i<all.length;i++){
   var b=all[i];if(b.hasAttribute('data-bq162-duplicate-mic'))continue;
   if(!best||best.disabled&& !b.disabled)best=b;
  }
  return best;
 }
 function dockVoice(row){
  if(!row||row.classList.contains('b118CarryArticle'))return;
  var mic=nativeVoice(row);if(!mic)return;
  var dock=row.querySelector(':scope > .p177VoiceDock');
  if(!dock){
   if(speaking()){row.setAttribute('data-p177-voice-pending','1');return;} // Never move P144 controls mid-speech.
   var head=row.querySelector(':scope > .v194T2Qrow');
   if(!head)return;
   dock=d.createElement('div');dock.className='p177VoiceDock';
   dock.setAttribute('role','group');dock.setAttribute('aria-label','الناطق الخاص بهذه الآية');
   head.insertAdjacentElement('afterend',dock);counter.mounted++;
  }
  if(mic.parentElement!==dock&&!speaking()){
   dock.appendChild(mic);counter.moved++;
  }
  if(mic.parentElement===dock&&row.hasAttribute('data-p177-voice-pending'))
   row.removeAttribute('data-p177-voice-pending');
  // Keep the ORIGINAL P144 click/pointerdown listeners (570ms settings gesture).
  mic.setAttribute('title','الناطق — اضغط مطولاً لفتح إعداداته');
  mic.setAttribute('aria-haspopup','dialog');
  if(mic.getAttribute('data-p177-voice-original')!=='1')mic.setAttribute('data-p177-voice-original','1');
  var all=row.querySelectorAll('button.p144MicButton');
  for(var i=0;i<all.length;i++)if(all[i]!==mic){
   if(!all[i].hidden){all[i].hidden=true;counter.duplicates++}
   if(all[i].getAttribute('aria-hidden')!=='true')all[i].setAttribute('aria-hidden','true');
  }
  if(mic.parentElement===dock){row.setAttribute('data-p177-voice-ready','1');}
 }
 function updateSpeech(){
  var host=byId('tafsirAyahs');if(!host||!readerActive())return;
  var run=speaking(),list=host.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
  for(var i=0;i<list.length;i++){
   var mic=nativeVoice(list[i]);if(!mic)continue;
   var on=run&&(mic.getAttribute('aria-pressed')==='true'||mic.classList.contains('p132-on'));
   if(on&&!list[i].hasAttribute('data-p177-speaking'))counter.voiceOn++;
   if(list[i].hasAttribute('data-p177-speaking')!==on){
    if(on)list[i].setAttribute('data-p177-speaking','1');else list[i].removeAttribute('data-p177-speaking');
   }
   if(mic.getAttribute('data-p177-audio')!==(on?'on':'off'))mic.setAttribute('data-p177-audio',on?'on':'off');
   if(on)lastVoice=mic;
  }
 }
 function mount(){if(!readerActive())return;
  var h=byId('tafsirAyahs');if(!h)return;
  var rows=h.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
  for(var i=0;i<rows.length;i++)dockVoice(rows[i]);
  updateSpeech();
 }
 function schedule(){if(scheduled)return;scheduled=true;
  (w.requestAnimationFrame||function(f){return w.setTimeout(f,20)})(function(){scheduled=false;mount();syncReturn()});
 }
 function isTextDisplay(node){
  var el=node&&node.nodeType===1?node:node&&node.parentElement;
  if(!el||!el.closest)return false;
  if(el.closest('input,textarea,select,[contenteditable],[role="textbox"],button,a,[role="button"],#p144VoicePanel,#basairTafsirR2NoteSheet,#basairTafsirB232FavoritesPanel'))return false;
  return !!el.closest('#tafsirAyahs .v194T2Qrow, #tafsirAyahs .v194T2Body');
 }
 function stopContextMenu(e){if(readerActive()&&isTextDisplay(e.target))e.preventDefault();}
 function stopSelection(){
  if(!readerActive()||!w.getSelection)return;
  var s=w.getSelection();if(!s||s.isCollapsed||!s.rangeCount||!isTextDisplay(s.anchorNode))return;
  try{s.removeAllRanges();counter.selectionCleared++}catch(_){counter.errors++}
 }
 function savedPanel(){return byId('basairTafsirB232FavoritesPanel')}
 function notesPanel(){return byId('basairTafsirR2NoteSheet')}
 function observeLateSheets(){
  if(!readerObs)return;
  var a=[savedPanel(),notesPanel()];
  for(var i=0;i<a.length;i++)if(a[i]&&sheetsWatched.indexOf(a[i])<0){
   readerObs.observe(a[i],{attributes:true,attributeFilter:['class']});
   sheetsWatched.push(a[i]);
  }
 }
 function r3BackOwner(){
  if(!isShown(savedPanel())&&!isShown(notesPanel()))return;
  var r=w.__BASAIR_TAFSIR_R3__;
  if(r&&typeof r.installBack==='function'){
   try{
    if(r.status&&r.status().back)return; // Native R3 already owns Back; never rewrite it repeatedly.
    r.installBack();counter.backReinstalled++;
   }catch(_){counter.errors++}
  }
 }
 function noteFromSaved(ev){
  var hit=ev.target&&ev.target.closest&&ev.target.closest('#basairTafsirB232FavoritesPanel [data-r3-note-edit]');
  if(hit&&isShown(savedPanel())){fromSavedNote=true;fromSavedAt=Date.now();r3BackOwner()}
 }
 function fromSavedVerse(ev){
  var hit=ev.target&&ev.target.closest&&ev.target.closest('#basairTafsirB232FavoritesPanel [data-r3-note-open],#basairTafsirB232FavoritesPanel [data-b232-fav-open]');
  if(hit&&isShown(savedPanel())){pendingHome=true;explicitHome=false;fromSavedAt=Date.now();r3BackOwner()}
 }
 function isRecent(){return Date.now()-fromSavedAt<1800000;}
 function syncReturn(){
  observeLateSheets();
  if(!isRecent()){fromSavedNote=false;pendingHome=false;return}
  r3BackOwner();
  if(fromSavedNote&&!isShown(notesPanel())&&isShown(savedPanel()))fromSavedNote=false;
  if(fromSavedNote&&!isShown(notesPanel())&&!isShown(savedPanel())&&tafsirActive()){
   var api=w.__BASAIR_TAFSIR_P157_STABLE__;
   if(api&&typeof api.openSaved==='function'&&api.openSaved('notes'))counter.backRestored++;
   fromSavedNote=false;
  }
  // Fallback only for an unexpected direct Home jump after opening a saved verse.
  // Never override an explicit Home click or navigation outside a Saved journey.
  var home=byId('home');
  if(pendingHome&&!explicitHome&&home&&home.classList.contains('active')&&!readerActive()&&!indexActive()){
   pendingHome=false;
   if(typeof w.openTafsirIndex==='function'){
    try{w.openTafsirIndex();counter.indexRecovered++}catch(_){counter.errors++}
   }
  }
  if(indexActive()&&!isShown(savedPanel())&&!isShown(notesPanel())&&!readerActive()){
   // P176's own observer will restore Saved on reader->index. Stop the Home fallback.
   pendingHome=false;
  }
 }
 function navCapture(e){
  var node=e.target&&e.target.closest&&e.target.closest('[data-nav="home"], [data-module="home"], #v110BottomHome, #dockHome');
  if(node){explicitHome=true;pendingHome=false;fromSavedNote=false;}
  var back=e.target&&e.target.closest&&e.target.closest('#basairTafsirB232FavoritesClose,[data-r2-note-close]');
  if(back){w.setTimeout(syncReturn,40)}
 }
 function init(){
  var root=byId('tafsirAyahs'),reader=byId('tafsirReader');
  if(!root||!reader)return;
  mount();
  if(w.MutationObserver){
   observer=new w.MutationObserver(function(ms){
    for(var i=0;i<ms.length;i++){
     var m=ms[i];if(m.type!=='childList')continue;
     var nodes=Array.prototype.slice.call(m.addedNodes);
     if(nodes.some(function(n){return n.nodeType===1&&(
      n.matches&&n.matches('.v194T2Ayah, .p144MicButton, .v194T2Qrow')||
      n.querySelector&&n.querySelector('.v194T2Ayah,.p144MicButton'))})) {schedule();return}
    }
   });observer.observe(root,{childList:true,subtree:true});
   readerObs=new w.MutationObserver(schedule);
   readerObs.observe(reader,{attributes:true,attributeFilter:['class']});
   var index=byId('tafsirIndex'),home=byId('home');
   if(index)readerObs.observe(index,{attributes:true,attributeFilter:['class']});
   if(home)readerObs.observe(home,{attributes:true,attributeFilter:['class']});
   observeLateSheets();
  }
  w.addEventListener('pointerdown',function(e){noteFromSaved(e);fromSavedVerse(e)},true);
  w.addEventListener('click',navCapture,true);
  d.addEventListener('contextmenu',stopContextMenu,true);
  d.addEventListener('selectionchange',stopSelection);
  d.addEventListener('keydown',function(e){if(e.key==='Escape'||e.key==='BrowserBack')r3BackOwner()},true);
  w.addEventListener('pageshow',schedule);
  d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});
  // Poll only UI status; no DOM repaint on idle. Original P144 owns speech state.
  w.setInterval(function(){
   observeLateSheets();
   if(readerActive()){
    updateSpeech();
    if(!speaking()&&d.querySelector('#tafsirAyahs .v194T2Ayah[data-p177-voice-pending]'))schedule();
   }
   if(isShown(savedPanel())||isShown(notesPanel()))r3BackOwner();
   if(fromSavedNote&&!isShown(notesPanel()))syncReturn();
  },650);
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_TAFSIR_P177_FINAL__={refresh:schedule,status:function(){return Object.assign({},counter,{
  narratorActive:speaking(),activeReader:readerActive(),savedOpen:isShown(savedPanel()),
  notesOpen:isShown(notesPanel()),nativeSettings:!!(narrator()&&typeof narrator().settings==='function'),
  backOwnerInstalled:!!(w.__BASAIR_TAFSIR_R3__&&w.__BASAIR_TAFSIR_R3__.status&&w.__BASAIR_TAFSIR_R3__.status().back)
 })}};
})(window,document);
