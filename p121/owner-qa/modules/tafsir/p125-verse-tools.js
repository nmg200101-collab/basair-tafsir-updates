/* BASAIR P125 — Tafsir per-ayah tools: local follow stop/settings, note and copy/image.
   Signed modular OTA: module "tafsir" only; no Quran text, Tilawa, audio or native code changes.
   Runs after the existing B231/P120 reader. Keep P120's seamless DOM and no-flash transition. */
(function () {
  'use strict';
  if (window.__BASAIR_TAFSIR_P125__) return;
  var VERSION = 'P125.1-INLINE-FOLLOW-STOP-SPEED-IMAGE';
  var KEY = 'basair:tafsir:p124:resume';
  var held = null, holdTimer = 0, blockClickUntil = 0, intended = false;
  var followHold = null, followHoldTimer = 0, followLongUntil = 0, manualStopAt = 0;
  var resumeAttempts = 0, lastObserved = '';
  var observer = null, scheduled = false, exportBusy = false;
  var exportURL = null;
  var E = function (id) { return document.getElementById(id); };
  function inTafsir() { var r = E('tafsirReader'); return !!(r && r.classList.contains('active')); }
  function api() { return window.__BASAIR_TAFSIR_R114__; }
  function step() { return window.__BASAIR_TAFSIR_STEP2__; }
  function toast(s) { try { var c = window.__BASAIR_TAFSIR_CORE__; if (c && c.toast) {c.toast(s); return;} if (typeof window.toast === 'function') window.toast(s); } catch (_) {} }
  function state() { try { return step() && step().state && step().state(); } catch (_) { return null; } }
  function art() { return E('tafsirAyahs') && E('tafsirAyahs').querySelector('.v194T2Ayah[data-t2ayah]:not(.b118CarryArticle)'); }
  function clean(x) { return String(x || '').replace(/\s+/g, ' ').trim(); }
  function verseRecord(node) {
    var st = state() || {}, row = node && node.closest && node.closest('.v194T2Ayah'),
      bar = row && row.querySelector('.basairB231AyahActions');
    var a = Number(row && (row.getAttribute('data-t2ayah') || row.getAttribute('data-t5-a'))) || Number(bar && bar.getAttribute('data-a')) || Number(st.a) || 1;
    var s = Number(row && row.getAttribute('data-t5-s')) || Number(bar && bar.getAttribute('data-s')) || Number(st.s) || 1;
    var type = String(row && row.getAttribute('data-t5-type') || bar && bar.getAttribute('data-type') || st.type || 'basair');
    return {s:s, a:a, type:type};
  }
  function valid(r) { return r && r.s>=1 && r.s<=114 && r.a>=1 && r.a<=286; }
  function same(a,b) { return a && b && Number(a.s)===Number(b.s) && Number(a.a)===Number(b.a) && String(a.type)===String(b.type); }
  function remember(r, scroll) {
    if (!valid(r)) return;
    try {localStorage.setItem(KEY,JSON.stringify({s:r.s,a:r.a,type:r.type,at:Date.now(),scroll:Number(scroll)||0}));} catch (_) {}
    lastObserved = r.s+':'+r.a+':'+r.type;
  }
  function saved() { try { var o = JSON.parse(localStorage.getItem(KEY)||'null'); return valid(o)?o:null; } catch (_) {return null;} }
  function position() {
    var host = E('tafsirAyahs'); if (!host) return 0;
    var el = host; while(el && el!==document.body) {
      try { if (/(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight>el.clientHeight+4) return el.scrollTop||0; } catch (_) {}
      el = el.parentElement;
    }
    return (document.scrollingElement||document.documentElement).scrollTop||0;
  }
  function currentRecord() {
    var active = art();
    if (active) return verseRecord(active);
    var st = state(); return st?{s:Number(st.s),a:Number(st.a),type:String(st.type||'basair')}:saved();
  }
  function stopFromUser() {
    // Always invoke the original reader's stop, including during handoff.
    // The former P124 retry watchdog could restart a deliberate stop.
    intended=false;resumeAttempts=0;manualStopAt=Date.now();
    var p=currentRecord();if(valid(p))remember(p,position());
    var f=api();if(f&&typeof f.stop==='function')f.stop();
    renderButtons();
    return true;
  }
  function startFrom(r) {
    if (!inTafsir()) return false;
    var f=api(),t=step(),current=currentRecord();
    if(!f||!f.start) {toast('متابعة التفسير غير جاهزة');return false;}
    r=valid(r)?r:current||saved();
    if(!valid(r)) {toast('اختر آية أولًا');return false;}
    intended=true;manualStopAt=0;
    var status=f.status&&f.status();
    if(status&&status.running){remember(current||r,position());renderButtons();return true;}
    // Preserve verse and scroll coordinates on resume; avoid re-opening it.
    if(same(current,r)&&art()){
      remember(r,position());f.start();renderButtons();return true;
    }
    if(!t||!t.open){intended=false;toast('تعذر تحديد الآية المطلوبة');return false;}
    try{t.open(r.s,r.a,r.type);}catch(_){intended=false;toast('تعذر فتح الآية');return false;}
    var trials=0;
    (function wait(){
      if(!intended||manualStopAt||!inTafsir())return;
      var now=currentRecord();
      if(same(now,r)&&art()){remember(r,position());f.start();renderButtons();return;}
      if(++trials<100)setTimeout(wait,80);
      else {intended=false;toast('لم يكتمل تحميل الآية؛ أعد المحاولة');renderButtons();}
    })();
    return true;
  }
  function toggleFrom(button) {
    var f=api(),st=f&&f.status&&f.status();
    if((st&&st.running)||intended){stopFromUser();return;}
    var row=button&&button.closest('.v194T2Ayah'),target=row?verseRecord(row):currentRecord();
    if(!row){var s=saved(),cur=currentRecord();if(s&&cur&&same(s,cur))target=s;}
    startFrom(target);
  }
  function settings(){
    var f=api();
    if(f&&typeof f.settings==='function'){f.settings();return true;}
    toast('إعدادات سرعة المتابعة غير متاحة');return false;
  }
  function renderButtons(){
    var f=api(),on=!!(f&&f.status&&f.status().running);
    document.querySelectorAll('#tafsirAyahs .basairB231AyahActions [data-p125-follow]').forEach(function(b){
      b.setAttribute('aria-pressed',on?'true':'false');b.classList.toggle('p125-on',on);
      var label=b.querySelector('b'),labelText=on?'إيقاف':'متابعة';
      if(label&&label.textContent!==labelText)label.textContent=labelText;
      var icon=b.querySelector('span'),iconText=on?'Ⅱ':'▶';
      if(icon&&icon.textContent!==iconText)icon.textContent=iconText;
      b.title=on?'إيقاف المتابعة — اضغط مطولًا لضبط السرعة':'متابعة من هذه الآية — اضغط مطولًا لضبط السرعة';
    });
  }
  function restoreTopNote(row){
    // P124 formerly transformed this small note chip into a follow button.
    // Restore the original small note and its original R3 click handler.
    row.querySelectorAll('.p124FollowAboveTools').forEach(function(w){w.remove();});
    row.querySelectorAll('button[data-p124-follow]').forEach(function(b){
      if(b.closest('.basairB231AyahActions'))return;
      b.removeAttribute('data-p124-follow');b.classList.remove('p124Follow','p124-on');
      if(b.hasAttribute('data-r3-note-pos')||b.classList.contains('b263r3NoteChip')){
        b.classList.add('b263r3NoteChip');
        b.innerHTML='<span>✎</span><b>ملاحظة</b>';
        b.setAttribute('aria-label','ملاحظة الآية');
      }else if(b.hasAttribute('data-r2-action')){
        b.setAttribute('data-r2-action','note');b.innerHTML='<span>✎</span><b>ملاحظة</b>';
      }
    });
  }
  function decorate(){
    if(!inTafsir())return;
    var items=E('tafsirAyahs');if(!items)return;
    items.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)').forEach(function(row){
      var tool=row.querySelector('.basairB231AyahActions');if(!tool)return;
      restoreTopNote(row);
      var b=tool.querySelector('[data-p125-follow]');
      if(!b){
        b=tool.querySelector('[data-r2-action="note"]');
        if(!b)return;
        ['data-r2-action','data-b231-action','data-t107-tool','data-t4-action','data-p124-follow'].forEach(function(a){b.removeAttribute(a);});
        b.classList.add('p125Follow');b.setAttribute('data-p125-follow','1');
        b.innerHTML='<span aria-hidden="true">▶</span><b>متابعة</b>';
        b.setAttribute('aria-label','متابعة الآيات — اضغط مطولًا لتحديد السرعة');
      }
      var copy=tool.querySelector('[data-b231-action="copy"]');
      if(copy){
        copy.setAttribute('data-p125-copy','1');copy.removeAttribute('data-p124-copy');
        copy.classList.add('p125Copy');
        copy.setAttribute('aria-label','ضغطة قصيرة لنسخ نص الآية، ضغطة مطولة لتصدير صورة الآية');
        copy.title='نسخ نص الآية • اضغط مطولًا لتصدير صورتها';
        if(!copy.querySelector('.p125CopyHint')){
          copy.innerHTML='<span aria-hidden="true" class="p125CopyIcon">⧉</span><b>نسخ نص</b><small class="p125CopyHint">مطولًا: صورة</small>';
        }
      }
    });
    renderButtons();
  }
  function scheduleDecorate(){if(scheduled)return;scheduled=true;setTimeout(function(){scheduled=false;decorate();},65);}
  function onClick(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest('button');
    if(!b||!inTafsir())return;
    // STOP via either control cancels any pending per-ayah start attempts.
    if(b.id==='b114Stop'||(b.id==='basairTafsirR114Follow'&&api()&&api().status&&api().status().running)){
      intended=false;manualStopAt=Date.now();resumeAttempts=0;return;
    }
    if(!b.hasAttribute('data-p125-follow')&&!b.hasAttribute('data-p125-copy'))return;
    ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
    if(b.hasAttribute('data-p125-follow')){
      if(Date.now()<followLongUntil)return;
      toggleFrom(b);return;
    }
    if(Date.now()<blockClickUntil)return;
    var row=b.closest('.v194T2Ayah');if(row)copyVerse(row);
  }
  function followDown(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest('[data-p125-follow]');
    if(!b||!inTafsir())return;
    clearTimeout(followHoldTimer);
    followHold={id:ev.pointerId,x:ev.clientX,y:ev.clientY};
    followHoldTimer=setTimeout(function(){
      if(!followHold)return;
      followHold=null;followLongUntil=Date.now()+1100;settings();
    },580);
  }
  function followEnd(ev){
    if(!followHold)return;
    if(ev.pointerId!==undefined&&followHold.id!==undefined&&ev.pointerId!==followHold.id)return;
    followHold=null;clearTimeout(followHoldTimer);
  }
  function followMove(ev){
    if(followHold&&(Math.abs((ev.clientX||0)-followHold.x)>12||Math.abs((ev.clientY||0)-followHold.y)>12))followEnd(ev);
  }
  function fallbackCopy(text){
    var input=document.createElement('textarea');input.value=text;input.setAttribute('readonly','');
    input.style.cssText='position:fixed;top:-5000px;opacity:0;pointer-events:none';
    document.body.appendChild(input);input.focus();input.select();
    var ok=false;try{ok=document.execCommand('copy');}catch(_){}input.remove();
    toast(ok?'تم نسخ الآية':'تعذر النسخ');
  }
  function copyVerse(row){
    var q=row.querySelector('.v194T2Qrow .qtext,.qtext'),p=verseRecord(row);
    if(!q||!clean(q.textContent)){toast('نص الآية غير متاح');return;}
    var s=clean(q.textContent),Q=window.__BASAIR_TAFSIR_CORE__&&window.__BASAIR_TAFSIR_CORE__.q||[],su=Q[p.s-1];
    var text='﴿'+s+'﴾\nسورة '+String(su&&su.name||p.s)+'، الآية '+p.a;
    if(navigator.clipboard && navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast('تم نسخ الآية')},function(){fallbackCopy(text)});}else fallbackCopy(text);
  }
  function gestureStart(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest('[data-p125-copy]');
    if(!b||!inTafsir())return;
    clearTimeout(holdTimer);held={button:b,row:b.closest('.v194T2Ayah'),startX:ev.clientX,startY:ev.clientY,id:ev.pointerId};
    holdTimer=setTimeout(function(){
      var h=held;if(!h||!h.row||!inTafsir())return;
      held=null;blockClickUntil=Date.now()+1250;
      exportVerseImage(h.row);
    },620);
  }
  function gestureEnd(ev){
    if(!held)return;
    if(ev.pointerId!==undefined&&held.id!==undefined&&ev.pointerId!==held.id)return;
    held=null;clearTimeout(holdTimer);
  }
  function gestureMove(ev){if(!held)return;if(Math.abs((ev.clientX||0)-held.startX)>12||Math.abs((ev.clientY||0)-held.startY)>12)gestureEnd(ev);}
  function canvasSize(row){
    var b=row.querySelector('.v194T2Qrow');return b?b.getBoundingClientRect():null;
  }
  function styleCopy(source,dest){
    var st=getComputedStyle(source),style=dest.style;
    for(var i=0;i<st.length;i++){var name=st[i];try{style.setProperty(name,st.getPropertyValue(name),st.getPropertyPriority(name))}catch(_){}}
    for(var x=0;x<source.children.length&&x<dest.children.length;x++)styleCopy(source.children[x],dest.children[x]);
  }
  function foreignObjectBlob(row){
    return new Promise(function(resolve,reject){
      var original=row.querySelector('.v194T2Qrow');if(!original)return reject(new Error('verse-not-found'));
      var computed=original.getBoundingClientRect(),width=Math.max(280,Math.ceil(computed.width)),height=Math.max(80,Math.ceil(computed.height));
      var clone=original.cloneNode(true);styleCopy(original,clone);
      clone.style.boxSizing='border-box';clone.style.width=width+'px';clone.style.height='auto';clone.style.minHeight=height+'px';clone.style.margin='0';
      clone.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
      var safe=new XMLSerializer().serializeToString(clone);
      var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><foreignObject width="100%" height="100%">'+safe+'</foreignObject></svg>';
      var blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),uri=URL.createObjectURL(blob),image=new Image();
      var timeout=setTimeout(function(){URL.revokeObjectURL(uri);reject(new Error('snapshot-timeout'));},3000);
      image.onload=function(){clearTimeout(timeout);URL.revokeObjectURL(uri);try{
        var ratio=Math.min(3,Math.max(2,devicePixelRatio||2)),canvas=document.createElement('canvas');
        canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
        var ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.drawImage(image,0,0,width,height);
        canvas.toBlob(function(res){res?resolve(res):reject(new Error('snapshot-empty'))},'image/png');
      }catch(e){reject(e)}};
      image.onerror=function(){clearTimeout(timeout);URL.revokeObjectURL(uri);reject(new Error('snapshot-unsupported'))};
      image.src=uri;
    });
  }
  // Fallback when Android WebView prohibits SVG foreignObject rasterization.
  // Reproduce ONLY the Quran verse card; never capture adjacent verses or controls.
  function canvasFallback(row){return new Promise(function(resolve,reject){
    try{
      var q=row.querySelector('.v194T2Qrow .qtext,.qtext');if(!q||!clean(q.textContent))throw Error('missing-text');
      var verse=clean(q.textContent),num=row.querySelector('.v194T2Qrow .anum'),box=row.querySelector('.v194T2Qrow');
      var font=getComputedStyle(q),padding=32,W=980,ratio=2,canvas=document.createElement('canvas');
      var measure=document.createElement('canvas').getContext('2d');
      var fontPx=Math.max(30,Math.min(57,(parseFloat(font.fontSize)||24)*W/Math.max(350,(box&&box.getBoundingClientRect().width)||380)));
      var fam=font.fontFamily||'serif';measure.font=fontPx+'px '+fam;
      var tokens=verse.split(/\s+/),lines=[],line='';
      tokens.forEach(function(word){var cand=line?line+' '+word:word;if(line && measure.measureText(cand).width>W-2*padding){lines.push(line);line=word}else line=cand});if(line)lines.push(line);
      var lh=Math.max(fontPx*2.05,65),H=Math.ceil(padding*2+lines.length*lh+52);canvas.width=W*ratio;canvas.height=H*ratio;
      var ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
      ctx.fillStyle='#f8f5e8';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#d5c7a6';ctx.lineWidth=3;ctx.strokeRect(3,3,W-6,H-6);
      ctx.direction='rtl';ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillStyle='#57401c';ctx.font=fontPx+'px '+fam;
      lines.forEach(function(l,i){ctx.fillText(l,W-padding,padding+lh*i+lh/2,W-2*padding)});
      ctx.fillStyle='#937b4a';ctx.font='26px '+fam;ctx.textAlign='left';
      ctx.fillText('﴿'+clean(num&&num.textContent||'')+'﴾',padding,H-26);
      canvas.toBlob(function(b){b?resolve(b):reject(new Error('png-empty'))},'image/png');
    }catch(e){reject(e)}
  });}
  function sharePreview(blob,row){
    if(exportURL)try{URL.revokeObjectURL(exportURL)}catch(_){};
    exportURL=URL.createObjectURL(blob);
    var p=verseRecord(row),name='Basair-Ayah-'+p.s+'-'+p.a+'.png';
    var dlg=E('basairP124ExportDialog');
    if(!dlg){dlg=document.createElement('section');dlg.id='basairP124ExportDialog';dlg.className='p124ExportDialog';
      dlg.innerHTML='<div class="p124Shade"></div><div class="p124ExportPanel" dir="rtl" role="dialog" aria-modal="true" aria-label="صورة الآية"><header><b>صورة الآية</b><button type="button" data-p124-close aria-label="إغلاق">×</button></header><img id="p124Image" alt="صورة الآية المحددة"><p>صورة الآية فقط دون الأدوات أو الآيات الأخرى.</p><footer><button type="button" data-p124-save>حفظ الصورة</button><button type="button" data-p124-share>مشاركة الصورة</button></footer></div>';
      document.body.appendChild(dlg);
      dlg.addEventListener('click',function(e){
        if(e.target.closest('[data-p124-close],.p124Shade')){dlg.classList.remove('open');return;}
        if(e.target.closest('[data-p124-save]')){
          var a=document.createElement('a');a.href=exportURL;a.download=name;document.body.appendChild(a);a.click();a.remove();return;
        }
        if(e.target.closest('[data-p124-share]')){
          if(navigator.share&&navigator.canShare){try{var f=new File([blob],name,{type:'image/png'});if(navigator.canShare({files:[f]})){
            navigator.share({files:[f],title:'بصائر القرآن — صورة الآية'}).catch(function(){});return;
          }}catch(_){}}
          toast('احفظ الصورة ثم شاركها من معرض الصور');
        }
      });
    }
    E('p124Image').src=exportURL;dlg.classList.add('open');
  }
  function exportVerseImage(row){
    if(exportBusy||!row||!row.isConnected)return;
    exportBusy=true;toast('جارٍ تجهيز صورة الآية…');
    foreignObjectBlob(row).catch(function(){return canvasFallback(row)}).then(function(blob){sharePreview(blob,row)},function(){toast('تعذر إنشاء صورة الآية على هذا الهاتف')}).finally(function(){exportBusy=false});
  }
  // Deliberate Stop must stay stopped. No automatic restart watchdog:
  // on a transient stop the user can tap Follow on the current verse.
  function monitor(){
    if(!inTafsir()){intended=false;return;}
    var f=api(),st=f&&f.status&&f.status(),now=currentRecord();
    if(st&&st.running){
      if(valid(now)){var key=now.s+':'+now.a+':'+now.type;
        if(key!==lastObserved)remember(now,position());}
    }else if(intended){
      // The original reader stopped (timer, content end or temporary failure).
      intended=false;renderButtons();
    }
  }
  function init(){
    if(!E('tafsirReader'))return;
    decorate();
    var host=E('tafsirAyahs');if(host&&!observer&&window.MutationObserver){
      observer=new MutationObserver(scheduleDecorate);observer.observe(host,{childList:true,subtree:true});
    }
    document.addEventListener('click',onClick,true);
    document.addEventListener('pointerdown',gestureStart,true);
    document.addEventListener('pointerdown',followDown,true);
    document.addEventListener('pointerup',followEnd,true);
    document.addEventListener('pointercancel',followEnd,true);
    document.addEventListener('pointermove',followMove,true);
    document.addEventListener('contextmenu',function(e){if(e.target&&e.target.closest&&e.target.closest('[data-p125-follow],[data-p125-copy]'))e.preventDefault();},true);
    document.addEventListener('pointerup',gestureEnd,true);
    document.addEventListener('pointercancel',gestureEnd,true);
    document.addEventListener('pointermove',gestureMove,true);
    window.addEventListener('pagehide',function(){intended=false;});
    setInterval(function(){monitor();var host=E('tafsirAyahs');if(inTafsir()&&host&&!host.querySelector('.basairB231AyahActions [data-p125-follow]'))decorate();},650);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.__BASAIR_TAFSIR_P125__={version:VERSION,init:decorate,start:startFrom,stop:stopFromUser,settings:settings,exportVerse:exportVerseImage,
    status:function(){return {intended:intended,tries:resumeAttempts,saved:saved(),lastObserved:lastObserved,manualStopAt:manualStopAt,exportBusy:exportBusy}}};
})();
