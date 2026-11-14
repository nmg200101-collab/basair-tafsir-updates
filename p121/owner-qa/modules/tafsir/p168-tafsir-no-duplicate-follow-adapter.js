/* BASAIR P166 — single control owner for Tafsir mic and reading follow.
 * Original P144 owns TTS; P130 owns R114 follow and manual verse feed;
 * P163 owns independent lower notes. No P162 or P165 lifecycle scripts.
 * Never move original P144 microphone or mutate Tafsir body during speech.
 */
(function(w,d){'use strict';
 if(w.__BASAIR_TAFSIR_P166_SINGLE_OWNER__)return;
 var VERSION='P168-SOLE-P130-FOLLOW-KEEP-P166-VOICE';
 var root=null,observer=null,queued=false,tries=0;
 var counts={narrators:0,followCreated:0,followAdopted:0,voiceClicks:0,missingVoice:0,notReady:0,errors:0};
 function byId(id){return d.getElementById(id)}
 function getRows(){var host=byId('tafsirAyahs');return host?host.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)'):[]}
 function voiceApi(){return w.__BASAIR_TAFSIR_NATIQ_P132__}
 function talking(){try{var api=voiceApi();return !!(api&&api.status&&api.status().running)}catch(_){return false}}
 function r114(){return w.__BASAIR_TAFSIR_R114__}
 function following(){try{var api=r114();return !!(api&&api.status&&api.status().running)}catch(_){return false}}
 function p130(){return w.__BASAIR_TAFSIR_P130__}
 function originalMic(row){if(!row)return null;
  return row.querySelector('.p146TopMic button.p144MicButton:not([data-bq162-duplicate-mic="1"])')||
   row.querySelector('button.p144MicButton:not([data-bq162-duplicate-mic="1"])')||
   row.querySelector('button.p144MicButton');
 }
 function title(row){
  var body=row.querySelector(':scope > .v194T2Body');
  if(body){var node=body.querySelector('.v194T2Field.meaning > .v194T2FieldTitle')||
    body.querySelector('.v194T2FieldTitle,.v194T2SectionTitle,.v194T2Heading,[data-tafsir-section-title]');
   if(node)return node;
  }
  // Non-floating fallback is the verse header. Once mounted, never relocate
  // into the text later, especially while P144 is speaking.
  return row.querySelector(':scope > .v194T2Qrow');
 }
 function currentVoice(button,mic){if(!button||!mic)return;
  var state=mic.getAttribute('aria-pressed')==='true'||mic.classList.contains('p132-on')||
   mic.getAttribute('data-p149-mic-state')==='on';
  button.setAttribute('aria-pressed',state?'true':'false');
  button.setAttribute('aria-label',state?'إيقاف الناطق':'تشغيل الناطق');
  button.disabled=!!mic.disabled;
  // IMPORTANT no changing textContent or innerHTML here: P144 watches body
  // childList / characterData and cancels audio if unrelated content mutates.
 }
 function clickVoice(ev){ev.preventDefault();ev.stopPropagation();
  var button=ev.currentTarget,row=button.closest('.v194T2Ayah'),mic=originalMic(row);
  if(!mic||!mic.isConnected){counts.missingVoice++;return}
  try{mic.click();counts.voiceClicks++;currentVoice(button,mic);
   w.setTimeout(function(){if(button.isConnected)currentVoice(button,originalMic(row))},180);
  }catch(_){counts.errors++}
 }
 function ensureNarrator(row){
  var mic=originalMic(row),head=title(row),button=row.querySelector('button[data-bq166-voice="1"]');
  // Keep old microphone exposed until a connected compact replacement exists.
  if(!mic||!head){
   if(button&&button.isConnected){
    // A transient P153 repaint must not reveal a second old microphone row.
    if(!mic)button.disabled=true;
    row.setAttribute('data-bq166-voice-ready','1');
   }else row.removeAttribute('data-bq166-voice-ready');
   counts.notReady++;return;
  }
  if(!button){
   if(talking())return; // no mutation in Tafsir body while native speech runs
   button=d.createElement('button');button.type='button';button.className='bq166Voice';
   button.setAttribute('data-bq166-voice','1');button.setAttribute('aria-pressed','false');
   button.innerHTML='<span aria-hidden="true">◖</span><b>ناطق</b>';
   button.addEventListener('click',clickVoice);counts.narrators++;
   // Establish one stable anchor. P153 may move the ORIGINAL mic; our proxy
   // is never moved and the P144 speech body is never changed during playback.
   head.appendChild(button);
  } else if(!button.isConnected){
   if(talking())return;
   head.appendChild(button);
  }
  if(button.isConnected){
   if(row.getAttribute('data-bq166-voice-ready')!=='1')row.setAttribute('data-bq166-voice-ready','1');
   currentVoice(button,mic);
  }
 }
 function syncFollow(button){if(!button)return;
  var on=following(),txt=on?'إيقاف':'متابعة';
  button.setAttribute('aria-pressed',on?'true':'false');button.setAttribute('aria-label',txt+' متابعة التفسير');
  var label=button.querySelector('b');if(label&&label.textContent!==txt)label.textContent=txt;
  var glyph=button.querySelector('span'),icon=on?'Ⅱ':'▶';if(glyph&&glyph.textContent!==icon)glyph.textContent=icon;
 }
 function ensureFollow(row){
  var bar=row.querySelector(':scope > .basairB231AyahActions');if(!bar)return;
  // P168: P130 is the ONLY owner that may convert/create the Follow button.
  // Older P166 independently appended another Follow before P130 had decorated
  // the native B231 Note, creating a fifth cell and a non-working ghost.
  var owner=p130(),button=bar.querySelector(':scope > button[data-p125-follow]');
  if(!button&&owner&&typeof owner.init==='function'){
   owner.init(); // P130.decorate(), not another click listener
   button=bar.querySelector(':scope > button[data-p125-follow]');
  }
  if(!button){counts.notReady++;return}
  // Never allow residual P166/P130 duplication to survive a B231 repaint.
  var all=bar.querySelectorAll(':scope > button[data-p125-follow]');
  for(var i=0;i<all.length;i++)if(all[i]!==button)all[i].remove();
  var nativeNote=bar.querySelector(':scope > button[data-r2-action="note"]');
  if(nativeNote){
   nativeNote.hidden=true;
   nativeNote.setAttribute('data-bq168-hidden-tool','1');
  }
  if(!button.classList.contains('bq166Follow')){
   button.classList.add('bq166Follow');counts.followAdopted++;
  }
  if(bar.firstElementChild!==button)bar.insertBefore(button,bar.firstChild);
  bar.setAttribute('data-bq166-four-actions','1');
  bar.setAttribute('data-bq168-sole-follow','1');
  syncFollow(button);
 }
 function repair(row){if(!row||row.classList.contains('b118CarryArticle'))return;
  ensureNarrator(row);ensureFollow(row);
 }
 function scan(){var host=byId('tafsirAyahs');if(!host)return false;
  var rows=getRows();for(var i=0;i<rows.length;i++)repair(rows[i]);
  if(root!==host){if(observer)observer.disconnect();root=host;
   if(w.MutationObserver){observer=new w.MutationObserver(function(ms){
    for(var i=0;i<ms.length;i++){
     var m=ms[i];if(m.type!=='childList')continue;
     var nodes=m.addedNodes;for(var j=0;j<nodes.length;j++){
      var n=nodes[j];if(n.nodeType!==1||n.hasAttribute('data-bq166-voice')||n.hasAttribute('data-p125-follow'))continue;
      if(n.matches('.v194T2Ayah,.v194T2Qrow,.v194T2Body,.basairB231AyahActions,.p146TopMic,button.p144MicButton')||
       n.querySelector('.v194T2Ayah,.v194T2Body,.basairB231AyahActions,button.p144MicButton')){schedule();return}
     }
    }
   });observer.observe(host,{childList:true,subtree:true})}
  }
  return true;
 }
 function schedule(){if(queued)return;queued=true;
  (w.requestAnimationFrame||function(f){return w.setTimeout(f,16)})(function(){queued=false;scan()})}
 function init(){if(scan())return;if(tries++<40)w.setTimeout(init,160)}
 d.addEventListener('visibilitychange',function(){if(!d.hidden)schedule()});w.addEventListener('pageshow',schedule);
 // Read-only reconciliation when the original P153/P144 changes state.
 // No scroll listener, no STEP5 calls, no synthetic gestures, no reparented mic.
 w.setInterval(function(){if(!d.hidden)scan()},1900);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_TAFSIR_P166_SINGLE_OWNER__={version:VERSION,refresh:schedule,
  status:function(){var r=byId('tafsirReader'),rows=getRows();return{
   version:VERSION,p130Ready:!!p130(),mode:r&&r.getAttribute('data-basair-main-tab'),
   originalVoiceReady:rows.length&&!!originalMic(rows[0]),
   voiceButtons:d.querySelectorAll('#tafsirAyahs button[data-bq166-voice]').length,
   followButtons:d.querySelectorAll('#tafsirAyahs button[data-p125-follow]').length,
   voiceRunning:talking(),followRunning:following(),
   p130Status:p130()&&p130().status?p130().status():null,counts:Object.assign({},counts)
  }}
 };
})(window,document);
