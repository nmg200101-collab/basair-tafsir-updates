/* BASAIR P164 — Narrator presentation only.
 * Never move native P144/P153 microphone or audio listeners. The compact inline
 * control forwards an ordinary click to the ORIGINAL microphone. Only when the
 * inline control is ready is the oversized original row visually concealed.
 * P157 index, P162 R114/scroll, P163 saved notes remain byte-for-byte intact.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P164_INLINE_NARRATOR__)return;
 var VERSION='P164-INLINE-NARRATOR-IN-TAFSIR-HEADING';
 var root=null,observer=null,queued=false,retries=0;
 var counters={created:0,moved:0,activated:0,missingNative:0,missingHeading:0,errors:0};
 function nativeMic(row){
  if(!row)return null;
  return row.querySelector(':scope > .p146TopMic button.p144MicButton:not([data-bq162-duplicate-mic="1"])')||
   row.querySelector('button.p144MicButton:not([data-bq162-duplicate-mic="1"])')||
   row.querySelector('button.p144MicButton');
 }
 function targetHeading(row){
  if(!row)return null;
  return row.querySelector(':scope > .v194T2Body > .v194T2Field.meaning > .v194T2FieldTitle')||
   row.querySelector(':scope > .v194T2Body > .v194T2Field > .v194T2FieldTitle')||
   row.querySelector('.v194T2Body .v194T2FieldTitle');
 }
 function sync(button,original){
  if(!button||!original)return;
  var playing=original.getAttribute('aria-pressed')==='true'||original.classList.contains('p132-on')||
   original.getAttribute('data-p149-mic-state')==='on';
  var p=playing?'true':'false';if(button.getAttribute('aria-pressed')!==p)button.setAttribute('aria-pressed',p);
  button.setAttribute('aria-label',playing?'إيقاف الناطق':'تشغيل الناطق');
  button.title=playing?'إيقاف الناطق':'تشغيل الناطق';
  if(button.disabled!==original.disabled)button.disabled=original.disabled;
 }
 function clickProxy(event){
  event.preventDefault();event.stopPropagation();
  var button=event.currentTarget,row=button.closest('.v194T2Ayah'),original=nativeMic(row);
  if(!original||!original.isConnected){counters.missingNative++;return}
  try{original.click();counters.activated++;sync(button,original);w.setTimeout(function(){
   if(button.isConnected){var newer=nativeMic(row);if(newer)sync(button,newer)}
  },160)}catch(_){counters.errors++}
 }
 function decorate(row){
  if(!row||row.classList.contains('b118CarryArticle'))return;
  var original=nativeMic(row),title=targetHeading(row);
  // No fallback to a floating overlay or Quran text; do not hide the native
  // microphone before its real single inline entrance exists.
  if(!original||!title){
   if(!original)counters.missingNative++;else counters.missingHeading++;
   row.removeAttribute('data-bq164-narrator-ready');return;
  }
  var button=row.querySelector('button[data-bq164-narrator="1"]');
  if(!button){
   button=d.createElement('button');button.type='button';
   button.className='bq164InlineNarrator';button.setAttribute('data-bq164-narrator','1');
   button.setAttribute('aria-pressed','false');
   button.innerHTML='<span aria-hidden="true">◖</span><b>الناطق</b>';
   button.addEventListener('click',clickProxy);counters.created++;
  }
  var label=title.querySelector(':scope > b');
  if(button.parentElement!==title||label&&button.previousElementSibling!==label){
   if(label)label.insertAdjacentElement('afterend',button);
   else title.insertBefore(button,title.firstChild);
   counters.moved++;
  }
  // Very narrow title: icon-only, preserving full accessible button name.
  var source=title.querySelector(':scope > small');
  var available=title.clientWidth-(label?label.scrollWidth:0)-(source?source.scrollWidth:0)-24;
  var compact=available<70;
  if(button.hasAttribute('data-bq164-icon-only')!==compact){
   if(compact)button.setAttribute('data-bq164-icon-only','1');
   else button.removeAttribute('data-bq164-icon-only');
  }
  sync(button,original);
  if(row.getAttribute('data-bq164-narrator-ready')!=='1')row.setAttribute('data-bq164-narrator-ready','1');
 }
 function scan(){var host=d.getElementById('tafsirAyahs');if(!host)return false;
  var all=host.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
  for(var i=0;i<all.length;i++)decorate(all[i]);
  if(root!==host){if(observer)observer.disconnect();root=host;
   if(w.MutationObserver){observer=new w.MutationObserver(function(changes){
    for(var i=0;i<changes.length;i++){
     var m=changes[i];if(m.type!=='childList')continue;
     // Ignore our own button insertions and its small text updates.
     for(var j=0;j<m.addedNodes.length;j++){
      var n=m.addedNodes[j];if(n.nodeType!==1||n.hasAttribute('data-bq164-narrator'))continue;
      if(n.matches('.v194T2Ayah,.v194T2Body,.v194T2FieldTitle,.p146TopMic,button.p144MicButton')||
       n.querySelector('.v194T2Ayah,.v194T2FieldTitle,button.p144MicButton')){schedule();return}
     }
    }
   });observer.observe(host,{childList:true,subtree:true})}
  }
  return true;
 }
 function schedule(){if(queued)return;queued=true;
  (w.requestAnimationFrame||function(f){return w.setTimeout(f,16)})(function(){queued=false;scan()})}
 function init(){if(scan())return;if(retries++<40)w.setTimeout(init,170)}
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});
 w.addEventListener('pageshow',schedule);
 // Native P153 can update aria-pressed after speech starts/stops, so refresh
 // the small label/status without moving any native microphone or other tools.
 w.setInterval(function(){if(!d.hidden)scan()},1600);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_TAFSIR_P164_INLINE_NARRATOR__={version:VERSION,refresh:schedule,
  status:function(){return{version:VERSION,
   entrances:d.querySelectorAll('#tafsirAyahs .bq164InlineNarrator').length,
   ready:d.querySelectorAll('#tafsirAyahs .v194T2Ayah[data-bq164-narrator-ready="1"]').length,
   counters:Object.assign({},counters)}}};
})(window,document);
