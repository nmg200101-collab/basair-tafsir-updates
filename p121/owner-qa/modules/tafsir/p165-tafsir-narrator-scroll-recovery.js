/* BASAIR P165 — original narrator control, reliable compact entrance, safe manual continuation.
 * Only Tafsir. Keeps R114, STEP5, R2/R3 and P163 notes as exclusive owners.
 * No automatic follow, no duplicate content, no reader-mode changes.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P165_NARRATOR_RECOVERY__)return;
 var VERSION='P165-NARRATOR-HEADING-AND-POST-SPEECH-MANUAL-SCROLL';
 var host=null,observer=null,queued=false,initTry=0,voiceUsed=false;
 var touch=null,lastGesture=0,lastTail='',lastAttemptAt=0,attempted=Object.create(null);
 var stats={mounted:0,moved:0,micClicks:0,missingHeading:0,manualGestures:0,
  nextRequests:0,nextSkipped:0,nextFailed:0,nextObserved:0};
 function active(){var el=d.getElementById('tafsirReader');return !!(el&&el.classList.contains('active'))}
 function playing(){try{var api=w.__BASAIR_TAFSIR_NATIQ_P132__;
  return !!(api&&api.status&&api.status().running)}catch(_){return false}}
 function following(){try{var f=w.__BASAIR_TAFSIR_R114__;
  return !!(f&&f.status&&f.status().running)}catch(_){return false}}
 function findMic(row){return row&&(row.querySelector(':scope > .p146TopMic button.p144MicButton:not([data-bq162-duplicate-mic="1"])')||
  row.querySelector('button.p144MicButton:not([data-bq162-duplicate-mic="1"])')||
  row.querySelector('button.p144MicButton'))}
 function title(row){
  var body=row.querySelector('.v194T2Body,[data-tafsir-content]');
  if(body){
   var specific=body.querySelector('.v194T2Field.meaning > .v194T2FieldTitle');
   var any=specific||body.querySelector('.v194T2FieldTitle,.v194T2SectionTitle,.v194T2Heading,[data-tafsir-section-title],.tafsirSectionTitle');
   if(any)return any;
  }
  // When the tafsir field is not yet rendered, the existing ayah heading is
  // a temporary compact anchor. Never leave a second large narrator below.
  return row.querySelector(':scope > .v194T2Qrow')||null;
 }
 function sync(b,m){if(!b||!m)return;
  var on=m.getAttribute('aria-pressed')==='true'||m.classList.contains('p132-on')||m.getAttribute('data-p149-mic-state')==='on';
  var v=on?'true':'false';if(b.getAttribute('aria-pressed')!==v)b.setAttribute('aria-pressed',v);
  b.setAttribute('aria-label',on?'إيقاف الناطق':'تشغيل الناطق');
  b.title=on?'إيقاف الناطق':'تشغيل الناطق';if(b.disabled!==m.disabled)b.disabled=m.disabled;
 }
 function click(ev){ev.preventDefault();ev.stopPropagation();voiceUsed=true;
  var b=ev.currentTarget,row=b.closest('.v194T2Ayah'),m=findMic(row);
  if(!m||!m.isConnected){stats.nextSkipped++;return}
  try{m.click();stats.micClicks++;sync(b,m)}catch(_){stats.nextFailed++}
  w.setTimeout(function(){if(b.isConnected){var n=findMic(row);if(n)sync(b,n)}},240);
 }
 function decorate(row){if(row.classList.contains('b118CarryArticle'))return;
  var m=findMic(row),t=title(row),b=row.querySelector('button[data-bq165-narrator="1"]');
  if(!m||!t){row.removeAttribute('data-bq165-narrator-ready');stats.missingHeading++;return}
  // Never mutate the Tafsir body while native P144 speech is active: P144's
  // mutation observer would interpret this as changed exposition and stop audio.
  if(!b&&playing()){row.removeAttribute('data-bq165-narrator-ready');return;}
  if(!b){b=d.createElement('button');b.type='button';b.className='bq165InlineNarrator';
   b.setAttribute('data-bq165-narrator','1');b.setAttribute('aria-pressed','false');
   b.innerHTML='<span aria-hidden="true">◖</span><b>ناطق</b>';
   b.addEventListener('click',click);stats.mounted++}
  if(!playing()&&b.parentElement!==t){
   var label=t.querySelector(':scope > b, :scope > strong');
   if(label)label.insertAdjacentElement('afterend',b);else t.appendChild(b);
   stats.moved++;
  }
  // Expose a single entrance only after a connected proxy exists. Native mic
  // stays in the DOM so its original voice handler and settings remain intact.
  if(b.isConnected)row.setAttribute('data-bq165-narrator-ready','1');
  sync(b,m);
 }
 function scan(){var el=d.getElementById('tafsirAyahs');if(!el)return false;
  var rows=el.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
  for(var i=0;i<rows.length;i++)decorate(rows[i]);
  if(el!==host){if(observer)observer.disconnect();host=el;
   if(w.MutationObserver){observer=new w.MutationObserver(function(ms){
    for(var j=0;j<ms.length;j++){var z=ms[j];if(z.type!=='childList')continue;
     for(var k=0;k<z.addedNodes.length;k++){var n=z.addedNodes[k];
      if(n.nodeType!==1||n.hasAttribute('data-bq165-narrator'))continue;
      if(n.matches('.v194T2Ayah,.v194T2Body,.v194T2FieldTitle,.v194T2SectionTitle,.v194T2Heading,.p146TopMic,button.p144MicButton')||
       n.querySelector('.v194T2Ayah,.v194T2FieldTitle,.v194T2SectionTitle,button.p144MicButton')){schedule();return}
     }
    }
   });observer.observe(el,{childList:true,subtree:true})}
  }
  return true;
 }
 function schedule(){if(queued)return;queued=true;
  (w.requestAnimationFrame||function(f){return w.setTimeout(f,16)})(function(){queued=false;scan()})}
 function init(){if(scan())return;if(initTry++<35)w.setTimeout(init,170)}
 function tail(){var el=d.getElementById('tafsirAyahs');if(!el)return null;
  var rows=el.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
  for(var i=rows.length-1;i>=0;i--){var r=rows[i];if(r.getAttribute('aria-hidden')==='true')continue;
   var st;try{st=w.__BASAIR_TAFSIR_STEP2__&&w.__BASAIR_TAFSIR_STEP2__.state()}catch(_){}
   var s=Number(r.getAttribute('data-t5-s')||(r.getAttribute('data-t2s'))||(st&&st.s));
   var a=Number(r.getAttribute('data-t5-a')||r.getAttribute('data-t2ayah')||(st&&st.a));
   var type=r.getAttribute('data-t5-type')||(st&&st.type)||'basair';
   if(Number.isInteger(s)&&s>=1&&s<=114&&Number.isInteger(a)&&a>=1&&a<=286)
    return {row:r,key:s+':'+a+':'+type,s:s,a:a,type:type};
  }
  return null;
 }
 function nearEnd(t){if(!t)return false;
  var rect=t.row.getBoundingClientRect(),h=w.innerHeight||d.documentElement.clientHeight||720;
  if(rect.bottom<=h+Math.max(110,Math.round(h*.23)))return true;
  // Handles an inner scrolling container without relying on window.scrollY.
  var el=d.getElementById('tafsirReader');
  return !!(el&&el.scrollHeight>el.clientHeight&&
   el.scrollHeight-el.scrollTop-el.clientHeight<170);
 }
 function safeManualNext(epoch){if(epoch!==lastGesture||!active()||playing()||following()||!voiceUsed)return;
  var reader=d.getElementById('tafsirReader'),mode=reader&&reader.getAttribute('data-basair-main-tab')||'tafsir';
  if(['tafsir','p129-manual','p128-follow'].indexOf(mode)<0)return;
  var t=tail();if(!t||!nearEnd(t))return;
  if(lastTail!==t.key){lastTail=t.key;lastAttemptAt=0}
  var now=Date.now(),count=attempted[t.key]||0;
  if(count>=2||now-lastAttemptAt<5500){stats.nextSkipped++;return}
  var older=t.row;
  // Let native STEP5/P130 own ordinary scrolling. Only intervene after the
  // same tail remains unchanged 850ms after a REAL upward swipe.
  var q=w.__BASAIR_TAFSIR_CORE__&&w.__BASAIR_TAFSIR_CORE__.q||[],su=q[t.s-1];
  if(su&&t.a>=Number(su.count)&&t.s>=q.length)return;
  var p130=w.__BASAIR_TAFSIR_P130__,pstate=null;
  try{pstate=p130&&p130.status&&p130.status()}catch(_){}
  if(pstate&&(pstate.pending||pstate.feedBusy||pstate.mode==='auto'))return;
  var currentTail=tail();if(!currentTail||currentTail.row!==older||currentTail.key!==t.key)return;
  attempted[t.key]=count+1;lastAttemptAt=now;
  try{
   if(mode==='p129-manual'&&p130&&typeof p130.manualNext==='function'){
    if(p130.manualNext()!==false)stats.nextRequests++;else stats.nextFailed++;
   }else{
    var step=w.__BASAIR_TAFSIR_STEP5__;
    if(step&&typeof step.loadNext==='function'){step.loadNext();stats.nextRequests++}
    else stats.nextFailed++;
   }
  }catch(_){stats.nextFailed++}
  w.setTimeout(function(){var next=tail();if(next&&next.key!==t.key)stats.nextObserved++},1200);
 }
 function hasReaderTarget(el){return !!(el&&el.closest&&el.closest('#tafsirReader,#tafsirAyahs')&&
  !el.closest('button,input,textarea,select,.p144VoicePanel,.basairB231AyahActions'))}
 d.addEventListener('click',function(ev){if(ev.target&&ev.target.closest&&ev.target.closest('button.p144MicButton,button[data-bq165-narrator]'))voiceUsed=true},true);
 d.addEventListener('touchstart',function(e){if(!voiceUsed||!hasReaderTarget(e.target))return;
  var p=e.touches&&e.touches[0];if(p)touch={x:p.clientX,y:p.clientY,up:false}},{passive:true});
 d.addEventListener('touchmove',function(e){if(!touch)return;var p=e.touches&&e.touches[0];if(!p)return;
  if(touch.y-p.clientY>13)touch.up=true},{passive:true});
 d.addEventListener('touchend',function(){if(!touch)return;var moved=touch.up;touch=null;
  if(moved){stats.manualGestures++;var epoch=lastGesture=Date.now();w.setTimeout(function(){safeManualNext(epoch)},850)}},{passive:true});
 d.addEventListener('touchcancel',function(){touch=null},{passive:true});
 d.addEventListener('wheel',function(e){if(!voiceUsed||!hasReaderTarget(e.target)||e.deltaY<10)return;
  stats.manualGestures++;var epoch=lastGesture=Date.now();w.setTimeout(function(){safeManualNext(epoch)},850)},{passive:true});
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});
 w.addEventListener('pageshow',schedule);
 w.setInterval(function(){if(!d.hidden)scan()},1650);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_TAFSIR_P165_NARRATOR_RECOVERY__={version:VERSION,refresh:schedule,
  status:function(){var t=tail(),r=d.getElementById('tafsirReader');return{
   version:VERSION,narratorReady:d.querySelectorAll('#tafsirAyahs [data-bq165-narrator-ready="1"]').length,
   compactButtons:d.querySelectorAll('#tafsirAyahs .bq165InlineNarrator').length,
   nativeMode:r&&r.getAttribute('data-basair-main-tab'),nativeTail:t&&t.key,
   audioRunning:playing(),followRunning:following(),voiceUsed:voiceUsed,
   p130Available:!!w.__BASAIR_TAFSIR_P130__,stats:Object.assign({},stats)}}};
})(window,document);
