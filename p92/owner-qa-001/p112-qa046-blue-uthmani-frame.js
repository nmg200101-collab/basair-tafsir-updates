/* BASAIR P112 / QA-046: remove the temporary P93.2 Uthmani-mode lock.
 * No click interception, mode coercion, forced reload, or mutation of Quran data.
 * The original reader owns print switching and persistence. */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P112_QA046_BLUE_ENABLED__)return;
 var updates=0;
 function adjust(){
   if(!d.body||!d.body.classList.contains('reader-active'))return;
   if(d.body.classList.contains('h25-hifz')||d.body.classList.contains('h90-review')||d.body.classList.contains('h100-teacher'))return;
   d.querySelectorAll('.v144PrintNote').forEach(function(node){
     var old=node.textContent||'';
     if(old.indexOf('العثمانية موقوفة مؤقتًا')<0)return;
     node.textContent='الطبعات: الأصلية، التجويد الملوّن، والعثمانية بإطارها الأزرق الجديد.';
     updates++;
   });
 }
 var ob=null;
 function init(){
   if(!d.body)return;
   if(w.MutationObserver){
     ob=new MutationObserver(function(){adjust()});
     ob.observe(d.body,{attributes:true,attributeFilter:['class','data-v144-print']});
   }
   w.addEventListener('pageshow',adjust,false);
   adjust();
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P112_QA046_BLUE_ENABLED__={version:'QA-046',refresh:adjust,diagnostics:function(){return {unlocked:true,notesCorrected:updates,blueSelected:!!(d.body&&d.body.getAttribute('data-v144-print')==='blue')}}};
})(window,document);

/* BASAIR P112 / OWNER QA-046 — Blue Ottoman print visual replacement.
 * Draws only UI decoration; Quran content comes exclusively from the app's
 * existing LOCAL_QURAN / V143 engine. No generated-image Quran lettering.
 * The original raster stays as an automatic fallback when validation fails.
 * Scope: body[data-v144-print="blue"] in the main recitation reader ONLY.
 * Page 1 is Fatiha (7 verses); page 2 is Baqarah opening (5 verses).
 * No change to the Original or Tajweed editions, saved data, audio, Hifz etc.
 */
(function(window, document){
'use strict';
var API='__BASAIR_P112_QA046_BLUE_FRAME__';
if(window[API])return;
var report={validated:0,first:0,second:0,other:0,fallback:0,scan:0,errors:[]};
function frame(opening){
 var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1280" preserveAspectRatio="none">';
 s+='<defs><linearGradient id="paper" x1="0" y1="0" x2="0.3" y2="1"><stop stop-color="#fffefb"/><stop offset="1" stop-color="#fffaf1"/></linearGradient>';
 s+='<pattern id="b" width="38" height="44" patternUnits="userSpaceOnUse"><rect width="38" height="44" fill="#e8f6ff"/>';
 s+='<path d="M19 2 C24 12 33 12 36 22 C33 32 24 32 19 42 C14 32 5 32 2 22 C5 12 14 12 19 2Z" fill="#1567bb" stroke="#06478d" stroke-width="1.8"/>';
 s+='<path d="M19 8C22 17 30 17 30 22C30 27 22 27 19 36C16 27 8 27 8 22C8 17 16 17 19 8Z" fill="#48b9db" stroke="#eaf9fa" stroke-width="1.4"/>';
 s+='<path d="M19 14Q11 22 19 30Q27 22 19 14Z" fill="#f0d57b"/><circle cx="19" cy="22" r="2.6" fill="#fff9dc"/>';
 s+='<path d="M2 0L36 44M36 0L2 44" stroke="#b8cf83" stroke-width="1.3" opacity=".65"/></pattern>';
 s+='<g id="flower"><circle r="15" fill="#1d78b5" stroke="#f1d67e" stroke-width="2"/>';
 s+='<g fill="#e6f7fb" stroke="#0464ae" stroke-width="1.3"><ellipse cy="-10" rx="6" ry="12"/><ellipse cy="10" rx="6" ry="12"/><ellipse cx="-10" rx="12" ry="6"/><ellipse cx="10" rx="12" ry="6"/></g>';
 s+='<circle r="5.5" fill="#d3b05b" stroke="#eafbff" stroke-width="1"/></g></defs>';
 s+='<rect width="720" height="1280" fill="url(#paper)"/>';
 s+='<rect x="12" y="12" width="696" height="1256" fill="none" stroke="#044a98" stroke-width="6"/>';
 s+='<rect x="20" y="20" width="680" height="1240" fill="none" stroke="#1f91c8" stroke-width="3"/>';
 s+='<rect x="24" y="24" width="672" height="1232" fill="none" stroke="#e1ba58" stroke-width="2"/>';
 s+='<rect x="33" y="33" width="654" height="1214" fill="none" stroke="#087aba" stroke-width="2"/>';
 s+='<rect x="36" y="37" width="38" height="1206" fill="url(#b)" stroke="#0475b6" stroke-width="2"/>';
 s+='<rect x="646" y="37" width="38" height="1206" fill="url(#b)" stroke="#0475b6" stroke-width="2"/>';
 s+='<rect x="74" y="37" width="572" height="36" fill="url(#b)" stroke="#0475b6" stroke-width="2"/>';
 s+='<rect x="74" y="1207" width="572" height="36" fill="url(#b)" stroke="#0475b6" stroke-width="2"/>';
 s+='<rect x="78" y="78" width="564" height="1124" fill="none" stroke="#9dd3e5" stroke-width="2"/>';
 s+='<rect x="82" y="82" width="556" height="1116" fill="none" stroke="#d6b660" stroke-width="1"/>';
 s+='<use href="#flower" transform="translate(54 55)"/><use href="#flower" transform="translate(666 55)"/>';
 s+='<use href="#flower" transform="translate(54 1225)"/><use href="#flower" transform="translate(666 1225)"/>';
 s+='<path d="M270 38Q289 38 303 50Q313 65 333 65H387Q407 65 417 50Q431 38 450 38" fill="#fffdf7" stroke="#0e79b7" stroke-width="3"/>';
 s+='<path d="M280 1220Q304 1218 320 1234H400Q416 1218 440 1220" fill="#fffdf7" stroke="#0e79b7" stroke-width="2"/>';
 if(opening){
  s+='<path d="M86 95Q360 80 634 95" fill="none" stroke="#58b9d5" stroke-width="1.5" opacity=".9"/>';
  s+='<path d="M86 1185Q360 1201 634 1185" fill="none" stroke="#58b9d5" stroke-width="1.5" opacity=".9"/>';
  s+='<g fill="#bca25b" opacity=".9"><circle cx="128" cy="96" r="2"/><circle cx="592" cy="96" r="2"/><circle cx="128" cy="1183" r="2"/><circle cx="592" cy="1183" r="2"/></g>';
 }
 s+='</svg>';return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
}
var common=frame(false),opening=frame(true);
var selector='body.reader-active[data-v144-print="blue"]:not(.stableDigital):not(.h25-hifz):not(.h90-review):not(.h100-teacher) #mushafReader ';
var css='';
css+=selector+'.localPageStage.bq046-verified>.v143MuallamPage,'+selector+'.continuousImagePage.bq046-verified>.v143MuallamPage{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:none!important;z-index:16!important;background:#fffdf7!important;transition:none!important;animation:none!important}';
css+=selector+'.localPageStage.bq046-verified>img[data-mushaf-page],'+selector+'.continuousImagePage.bq046-verified>img[data-mushaf-page]{visibility:hidden!important;opacity:0!important;pointer-events:none!important}';
css+=selector+'.localPageStage.bq046-verified>.ayahHitLayer,'+selector+'.continuousImagePage.bq046-verified>.ayahHitLayer{display:none!important;pointer-events:none!important}';
css+=selector+'.bq046-verified .v143MuallamOuter{padding:12.8% 8.35% 10.8%!important;grid-template-rows:4.8% minmax(0,1fr) 3.5%!important;background-color:#fffdf8!important;background-image:url("'+common+'")!important;background-position:center!important;background-repeat:no-repeat!important;background-size:100% 100%!important;box-shadow:none!important;border:0!important}';
css+=selector+'.bq046-verified .v143MuallamOuter:before,'+selector+'.bq046-verified .v143MuallamOuter:after,'+selector+'.bq046-verified .v143Corner{display:none!important;content:none!important}';
css+=selector+'.bq046-verified .v143MuallamHead{border:0!important;display:grid!important;grid-template-columns:1fr 1.4fr 1fr!important;align-items:center!important;color:#145c84!important;font-size:clamp(8px,1.9vw,12px)!important;z-index:3!important}';
css+=selector+'.bq046-verified .v143MuallamHead b{color:#063e6a!important;-webkit-text-fill-color:#063e6a!important;font-family:"Amiri Quran","Traditional Arabic",serif!important;font-size:clamp(13px,3.8vw,23px)!important;line-height:1.4!important;font-weight:900!important;text-align:center!important;white-space:nowrap!important;padding:0 8px!important;background:#fffdf4!important;border:2px solid #1275ae!important;border-radius:60% / 42%!important;box-shadow:0 0 0 2px #e8c980!important}';
css+=selector+'.bq046-verified .v143MuallamHead span{text-align:center!important;overflow:hidden!important;color:#0d527c!important;-webkit-text-fill-color:#0d527c!important;font-size:clamp(8px,1.8vw,12px)!important;white-space:nowrap!important}';
css+=selector+'.bq046-verified .v143MuallamLines{padding:1.4% .8% 1.2%!important;overflow:hidden!important;grid-template-rows:repeat(15,minmax(0,1fr))!important}';
css+=selector+'.bq046-verified .v143Line{font-family:"Amiri Quran","Traditional Arabic","Noto Naskh Arabic",serif!important;color:#111c23!important;-webkit-text-fill-color:#111c23!important;line-height:1.06!important}';
css+=selector+'.bq046-verified .v143LineText{font-size:clamp(14.7px,4vw,21px)!important;line-height:1.05!important;color:#101619!important;-webkit-text-fill-color:#101619!important}';
css+=selector+'.bq046-verified .v143Line .quranWord{pointer-events:auto!important;cursor:pointer!important;color:#111c23!important;-webkit-text-fill-color:#111c23!important}';
css+=selector+'.bq046-verified .v143AyahNo{border:1.5px solid #137dbb!important;border-radius:43% 57% 43% 57%!important;background:radial-gradient(circle,#fffdeb 0 50%,#bce8f7 52% 73%,#0872ad 74% 80%,#f0d58e 81%)!important;box-shadow:0 0 0 1px #086baa!important;color:#16496f!important;-webkit-text-fill-color:#16496f!important;min-width:1.5em!important;width:1.5em!important;height:1.5em!important;pointer-events:auto!important}';
css+=selector+'.bq046-verified .v143SurahLine span{color:#155b81!important;-webkit-text-fill-color:#155b81!important;background:#f3fbff!important;border:1.5px solid #067bb7!important;box-shadow:inset 0 0 0 2px #d2ecf7!important;border-radius:42% / 60%!important}';
css+=selector+'.bq046-verified .v143BasmalaLine span{color:#18262c!important;-webkit-text-fill-color:#18262c!important;font-size:clamp(13px,3.7vw,22px)!important}';
css+=selector+'.bq046-verified .v143MuallamFoot{border:0!important;color:#155b7e!important;grid-template-columns:1fr auto 1fr!important;font-size:clamp(8px,1.8vw,11px)!important}';
css+=selector+'.bq046-verified .v143MuallamFoot b{color:#06477c!important;-webkit-text-fill-color:#06477c!important;font-size:clamp(11px,2.6vw,17px)!important;border:1px solid #077ab6!important;border-radius:35% 35% 45% 45%!important;background:#fffdf6!important;padding:1px 15px!important}';
css+=selector+'.bq046-verified[data-bq046-opening] .v143MuallamOuter{padding:12.8% 8.4% 10.8%!important;grid-template-rows:5% minmax(0,1fr) 3.5%!important;background-image:url("'+opening+'")!important}';
css+=selector+'.bq046-verified[data-bq046-opening="1"] .v143MuallamLines{padding:4% 1.4% 3%!important}';
css+=selector+'.bq046-verified[data-bq046-opening="1"] .v143LineText{font-size:clamp(18.3px,5.1vw,37px)!important}';
css+=selector+'.bq046-verified[data-bq046-opening="1"] .v143SurahLine span{min-width:60%!important;max-width:85%!important}';
css+=selector+'.bq046-verified[data-bq046-opening] .v143SurahLine{visibility:hidden!important}';
css+=selector+'.bq046-verified[data-bq046-opening="2"] .v143MuallamLines{padding:1.8% .7% 1.1%!important}';
css+=selector+'.bq046-verified[data-bq046-opening="2"] .v143LineText{font-size:clamp(18px,5.1vw,37px)!important}';

css+=selector+'.bq046-verified[data-bq046-opening="2"] .v143MuallamLines{display:none!important}';
css+=selector+'.bq046-verified[data-bq046-opening="2"] .bq046BaqarahFlow{grid-row:2!important;position:relative!important;z-index:4!important;min-height:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;padding:2% 1.4% 4%!important;gap:3%!important;overflow:hidden!important;direction:rtl!important;pointer-events:none!important}';
css+=selector+'.bq046-verified[data-bq046-opening="2"] .bq046BaqarahBasmala{display:block!important;font-family:"Amiri Quran","Traditional Arabic",serif!important;text-align:center!important;white-space:nowrap!important;font-size:clamp(18px,4.4vw,32px)!important;font-weight:700!important;color:#111c23!important;-webkit-text-fill-color:#111c23!important;margin-bottom:5%!important}';
css+=selector+'.bq046-verified[data-bq046-opening="2"] .bq046BaqarahWords{width:calc(100% - 50px)!important;box-sizing:border-box!important;min-height:0!important;max-height:95%!important;overflow:hidden!important;display:block!important;direction:rtl!important;text-align:justify!important;text-align-last:center!important;white-space:normal!important;line-height:2.05!important;font-family:"Amiri Quran","Traditional Arabic",serif!important;font-size:clamp(20px,5.6vw,35px)!important;color:#111c23!important;-webkit-text-fill-color:#111c23!important;pointer-events:none!important}';
css+=selector+'.bq046-verified[data-bq046-opening="2"] .bq046BaqarahWords .quranWord{display:inline!important;white-space:normal!important;color:#111c23!important;-webkit-text-fill-color:#111c23!important;cursor:pointer!important;pointer-events:auto!important;line-height:inherit!important;font-family:inherit!important;font-size:inherit!important}';
css+=selector+'.bq046-verified[data-bq046-opening="2"] .bq046BaqarahWords .v143Space{display:inline!important;white-space:pre!important}';

// P93's older raster guard uses FOUR repeated IDs and !important.
// Match that specificity only after canonical page verification, never globally.
var strong='html body.reader-active[data-v144-print="blue"]:not(.stableDigital):not(.h25-hifz):not(.h90-review):not(.h100-teacher) #mushafReader#mushafReader#mushafReader#mushafReader ';
css+=strong+'.localPageStage.bq046-verified>img[data-mushaf-page],'+strong+'.continuousImagePage.bq046-verified>img[data-mushaf-page]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}';
css+=strong+'.localPageStage.bq046-verified>.v143MuallamPage,'+strong+'.continuousImagePage.bq046-verified>.v143MuallamPage{display:block!important;visibility:visible!important;opacity:1!important}';
css+=selector+'.bq046-verified .v143MuallamPage{contain:layout paint style!important}';
var style=document.createElement('style');style.id='p112Qa046BlueUthmaniStyle';style.textContent=css;(document.head||document.documentElement).appendChild(style);
function pageOf(stage){
 var img=stage.querySelector('img[data-mushaf-page]');
 return Number((img&&img.getAttribute('data-mushaf-page'))||stage.getAttribute('data-contpage')||'0');
}
function verified(stage,p){
 if(!Number.isInteger(p)||p<1||p>604)return false;
 var pg=stage.querySelector('.v143MuallamPage');if(!pg)return false;
 var ranges=window.BASAIR_PAGE_RANGES,range=ranges&&ranges[p-1];if(!range||range.length<2)return false;
 var start=Number(range[0]),end=Number(range[1]);if(!(start>=1&&end>=start))return false;
 var numbers=pg.querySelectorAll('.v143AyahNo[data-g]');
 if(numbers.length!==end-start+1)return false;
 for(var k=0;k<numbers.length;k++)if(Number(numbers[k].getAttribute('data-g'))!==start+k)return false;
 if(!pg.querySelector('.quranWord[data-g]'))return false;
 if(p===1&&(numbers.length!==7||!pg.querySelector('.v143SurahLine')))return false;
 if(p===2&&(numbers.length!==5||!pg.querySelector('.v143BasmalaLine')))return false;
 return true;
}
function arrangeSecondPage(pg){
 var outer=pg&&pg.querySelector('.v143MuallamOuter'),lines=pg&&pg.querySelector('.v143MuallamLines');
 if(!outer||!lines||outer.querySelector('.bq046BaqarahFlow'))return;
 var rows=lines.querySelectorAll('.v143LineText'),numbers=lines.querySelectorAll('.v143AyahNo[data-g]');
 if(numbers.length!==5||!rows.length)return;
 var b=lines.querySelector('.v143BasmalaLine span');if(!b||!b.textContent)return;
 var wrap=document.createElement('div');wrap.className='bq046BaqarahFlow';
 var bas=document.createElement('div');bas.className='bq046BaqarahBasmala';bas.textContent=b.textContent;
 var words=document.createElement('div');words.className='bq046BaqarahWords';
 // MOVE existing bound Quran-word nodes; no new or generated Quran text.
 rows.forEach(function(row){while(row.firstChild)words.appendChild(row.firstChild);});
 wrap.appendChild(bas);wrap.appendChild(words);outer.insertBefore(wrap,outer.querySelector('.v143MuallamFoot'));
}
function titleFor(p){
 var range=window.BASAIR_PAGE_RANGES&&window.BASAIR_PAGE_RANGES[p-1],g=range&&Number(range[0]);
 if(!(g>=1))return '';
 var Q=window.LOCAL_QURAN||[];
 for(var i=0;i<Q.length;i++){
  var a=Q[i]&&Q[i].ayahs;if(!a||!a.length)continue;
  if(g>=Number(a[0].g)&&g<=Number(a[a.length-1].g))return 'سورة '+String(Q[i].name||'');
 }return '';
}
function mark(stage){
 var p=pageOf(stage);if(!(p>0))return;
 if(stage.classList.contains('bq046-verified')){
  if(!verified(stage,p)){stage.classList.remove('bq046-verified');report.fallback++;return;}
  var existing=stage.querySelector('.v143MuallamHead b'),name=titleFor(p);
  if(existing&&name&&existing.textContent!==name)existing.textContent=name;
  if(p===2)arrangeSecondPage(stage.querySelector('.v143MuallamPage'));
  return;
 }
 if(!verified(stage,p)){report.fallback++;return;}
 var pg=stage.querySelector('.v143MuallamPage'),h=pg.querySelector('.v143MuallamHead');
 var title=h&&h.querySelector('b'),correct=titleFor(p);
 if(title&&correct)title.textContent=correct;
 if(p===1||p===2){
  stage.setAttribute('data-bq046-opening',String(p));
  if(p===2)arrangeSecondPage(pg);
  if(h&&h.children.length>=3){h.children[0].textContent='الجزء الأول';h.children[2].textContent='الحزب الأول';}
  if(p===1)report.first++;else report.second++;
 }else{report.other++;}
 stage.classList.add('bq046-verified');report.validated++;
}
var armed=false,observer=null,raf=0;
function sync(){raf=0;report.scan++;
 var reader=document.getElementById('mushafReader');if(!reader)return;
 reader.querySelectorAll('.localPageStage,.continuousImagePage').forEach(mark);
}
function queue(){if(raf)return;raf=(window.requestAnimationFrame||window.setTimeout)(sync,0);}
function install(){
 if(armed)return;var reader=document.getElementById('mushafReader');if(!reader)return;
 armed=true;
 if(window.MutationObserver){observer=new MutationObserver(queue);observer.observe(reader,{childList:true,subtree:true});}
 window.addEventListener('pageshow',queue,false);
 document.addEventListener('basair-reader-open',queue,false);
 queue();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
if(!armed&&window.MutationObserver){var wait=new MutationObserver(function(){if(document.getElementById('mushafReader')){wait.disconnect();install();}});wait.observe(document.documentElement||document,{childList:true,subtree:true});}
window[API]={version:'P112-QA046-CANDIDATE',sync:sync,diagnostics:function(){return Object.assign({},report,{styles:!!document.getElementById('p112Qa046BlueUthmaniStyle'),readerOnly:true})}};
})(window,document);