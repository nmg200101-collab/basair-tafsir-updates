/* BASAIR P118 / QA051 — strict tafsir-only layout correction for P117.
 * Preserves every P117 listener and the existing 114 original surah buttons.
 * Does not rewrite reader, Tilawa, audio, Quran, navigation, or remote updater. */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P118_TAFSIR_INDEX_MATCH__)return;
 var stats={arranged:0,updates:0,errors:0};
 var css=String.raw`/* BASAIR P118 / QA051 — Tafsir screenshot parity, November 2026.
 * Strictly scoped to the existing Tafsir index. Not Quran, Tilawa or audio. */
html body.bq-tf117-index #tafsirIndex #bqTf117Dashboard {
  display:block!important; margin:5px 9px 3px!important; padding:0!important;
  direction:rtl!important; color:var(--ink,#224c3b);
}
html body.bq-tf117-index #bqTf118Topbar {
  box-sizing:border-box; min-width:0; display:flex; align-items:stretch;
  gap:5px; width:100%; padding:0; margin:0 0 6px;
  direction:rtl;
}
html body.bq-tf117-index #bqTf118Topbar .bq-tf117-type {
  flex:1 1 127px; min-width:97px; max-width:33%;
  box-sizing:border-box; position:relative; min-height:44px;
  display:flex!important; flex-flow:column nowrap!important; align-items:stretch!important;
  justify-content:center!important; gap:1px!important;
  padding:3px 20px 3px 7px!important; margin:0!important;
  border:1px solid #afc8b6!important; border-radius:13px!important;
  background:#eef5f0!important; box-shadow:none!important;
}
html body.bq-tf117-index #bqTf118Topbar .bq-tf117-type label {
  display:block!important; width:100%; text-align:right!important; white-space:nowrap;
  font:700 9.5px/1.1 system-ui,sans-serif!important; color:#5b7167!important;
}
html body.bq-tf117-index #bqTf118Topbar #bqTf117Type {
  display:block!important; box-sizing:border-box; border:0!important;
  width:100%!important; min-width:0!important; min-height:20px!important;
  height:23px!important; padding:0!important; margin:0!important;
  font:750 11.2px/1.25 inherit!important; color:var(--green,#14553d)!important;
  background:transparent!important; text-overflow:ellipsis; white-space:nowrap;
  outline-offset:2px;
}
html body.bq-tf117-index #bqTf118SearchAction {
  flex:0 0 36px; width:36px; min-height:44px; border:1px solid #d7c8af;
  border-radius:12px; background:var(--paper,#fffefa); color:#145b43;
  display:flex; align-items:center; justify-content:center; padding:0;
  font:600 21px/1 Arial,sans-serif;
}
html body.bq-tf117-index #bqTf118Topbar .bq-tf117-actions {
  display:flex!important; flex:1.8 1 151px; width:auto!important; min-width:0;
  align-items:stretch!important; flex-direction:row-reverse!important;
  gap:5px!important; direction:rtl!important; margin:0!important; padding:0!important;
}
html body.bq-tf117-index #bqTf118Topbar .bq-tf117-actions button,
html body.bq-tf117-index #bqTf118Last {
  display:flex!important; align-items:center!important; justify-content:center!important;
  min-height:44px!important; height:auto!important; box-sizing:border-box!important;
  border-radius:12px!important; padding:3px 5px!important;
  border:1px solid #d8cbb2!important; background:var(--paper,#fffefa)!important;
  color:var(--green,#18533c)!important; font:750 10.1px/1.2 inherit!important;
  white-space:nowrap!important; overflow:hidden!important;
}
html body.bq-tf117-index #bqTf118Topbar .bq-tf117-actions button {
  flex:1 1 0; min-width:0;
}
html body.bq-tf117-index #bqTf118Topbar .bq-tf117-actions .bq-tf117-resume {
  flex:1.35 1 0!important; background:#edf7ef!important;
  border-color:#c0d5c4!important;
}
html body.bq-tf117-index #bqTf118Topbar .bq-tf117-count {
  display:none!important;
}
html body.bq-tf117-index #bqTf118Last {
  flex:0.8 1 72px; min-width:50px!important; margin:0!important;
}
html body.bq-tf117-index #tafsirIndex #bqTf117Dashboard .bq-tf117-search-panel {
  box-sizing:border-box!important; margin:0!important; padding:6px 7px!important;
  border:1px solid #c3d6c8!important; border-radius:15px!important;
  background:var(--paper,#fffefa)!important; box-shadow:none!important;
}
html body.bq-tf117-index #bqTf117Dashboard .bq-tf117-search-line {
  display:flex!important; flex-flow:row nowrap!important; align-items:center!important;
  min-height:42px!important; gap:5px!important; direction:rtl!important;
}
html body.bq-tf117-index #bqTf117Dashboard .bq-tf117-search-field {
  flex:1.22 1 0!important; min-width:0!important; height:40px!important;
  padding:0 5px!important; border:0!important; border-radius:26px!important;
  background:#eaf3ed!important; gap:2px!important;
}
html body.bq-tf117-index #bqTf117Dashboard #bqTf117Search {
  width:100%!important; height:38px!important; min-width:0!important;
  font:500 11.2px/1.2 inherit!important; text-align:right!important; padding:2px 3px!important;
}
html body.bq-tf117-index #bqTf117Dashboard #bqTf117GlobalSearch {
  display:flex!important; width:25px!important; height:38px!important; flex:0 0 25px!important;
  font-size:22px!important; align-items:center; justify-content:center;
}
html body.bq-tf117-index #bqTf117Dashboard .bq-tf117-jumps {
  display:flex!important; flex:1 1 0!important; min-width:0!important; gap:0!important;
  align-items:stretch!important; min-height:40px!important; direction:rtl!important;
  border:1px solid #c7cbb7!important; border-radius:11px!important; overflow:hidden!important;
}
html body.bq-tf117-index #bqTf117Dashboard .bq-tf117-jumps button {
  flex:1 1 0!important; min-width:0!important; min-height:40px!important;
  border:0!important; border-radius:0!important;
  border-left:1px solid #d6d3c4!important;
  background:var(--paper,#fffefa)!important;
  color:var(--green,#14533d)!important; padding:2px 3px!important;
  font:760 10px/1.14 inherit!important; white-space:nowrap!important;
}
html body.bq-tf117-index #bqTf117Dashboard .bq-tf117-jumps button:last-child{border-left:0!important}
html body.bq-tf117-index #tafsirIndex #v194T104SurahBrowser {
  box-sizing:border-box; margin:8px 9px 68px!important; padding:0!important;
  border:0!important; border-radius:0!important; background:transparent!important;
  box-shadow:none!important; overflow:visible!important;
}
html body.bq-tf117-index #tafsirIndex #v194T104SurahBrowser .v194T104SurahHead {
  display:flex!important; align-items:center!important; justify-content:space-between!important;
  box-sizing:border-box!important; min-height:44px!important; padding:5px 5px 7px!important;
  margin:0 1px 7px!important; border:0!important;
  border-bottom:1px solid #bb9c50!important; background:transparent!important;
}
html body.bq-tf117-index #v194T104SurahBrowser .v194T104SurahHead>div:first-child {
  display:flex!important; align-items:center!important; justify-content:space-between!important;
  width:100%!important; flex-wrap:nowrap!important; gap:10px!important;
}
html body.bq-tf117-index #v194T104SurahBrowser .v194T104SurahHead b {
  font:850 17px/1.2 inherit!important; color:var(--green,#114c37)!important;
  white-space:nowrap!important;
}
html body.bq-tf117-index #v194T104SurahBrowser .v194T104SurahHead b::before {
  content:'✧'; display:inline; font:650 21px/1 Arial,sans-serif;
  color:#b89b54; margin-left:5px;
}
html body.bq-tf117-index #v194T104SurahBrowser .v194T104SurahHead small {
  font:500 10px/1.3 inherit!important; color:#79857b!important;
  white-space:nowrap!important; margin:0!important;
}
html body.bq-tf117-index #tafsirIndex #v194T104SurahBrowser #v194T104SurahGrid {
  display:grid!important; grid-template-columns:1fr!important; gap:4px!important;
  padding:5px 0 7px!important; margin:0!important;
}
html body.bq-tf117-index #tafsirIndex #v194T104SurahBrowser #v194T104SurahGrid .v194T104SurahCard {
  box-sizing:border-box!important; width:100%!important; min-width:0!important;
  min-height:46px!important; height:46px!important; max-height:46px!important;
  display:grid!important; grid-template-columns:30px minmax(0,1fr) 14px!important;
  align-items:center!important; column-gap:7px!important; padding:4px 9px!important;
  border:1px solid #dbd1bb!important; border-radius:11px!important;
  box-shadow:0 1px 2px #5b4b2307!important; background:var(--paper,#fffdfa)!important;
  direction:rtl!important; text-align:right!important;
}
html body.bq-tf117-index #tafsirIndex #v194T104SurahBrowser #v194T104SurahGrid .v194T104SurahNo {
  grid-column:1!important; display:grid!important; place-items:center!important;
  width:29px!important; height:29px!important; min-width:29px!important;
  border:1.4px solid #ac903f!important; border-radius:50%!important;
  margin:0!important; color:#846c27!important; background:transparent!important;
  font:750 13px/1 inherit!important;
}
html body.bq-tf117-index #tafsirIndex #v194T104SurahBrowser #v194T104SurahGrid .v194T104SurahCard > div {
  grid-column:2!important; text-align:right!important; min-width:0!important;
  line-height:1.13!important;
}
html body.bq-tf117-index #tafsirIndex #v194T104SurahBrowser #v194T104SurahGrid .v194T104SurahCard b {
  display:block!important; font:800 13.4px/1.16 inherit!important;
  margin:0!important; color:var(--green,#15543e)!important;
  overflow:hidden!important; text-overflow:ellipsis!important; white-space:nowrap!important;
}
html body.bq-tf117-index #tafsirIndex #v194T104SurahBrowser #v194T104SurahGrid .v194T104SurahCard small {
  display:block!important; font:500 10px/1.25 inherit!important;
  margin:2px 0 0!important; color:var(--muted,#66756c)!important;
  overflow:hidden!important; text-overflow:ellipsis!important; white-space:nowrap!important;
}
html body.bq-tf117-index #tafsirIndex #v194T104SurahBrowser #v194T104SurahGrid .v194T104SurahCard em {
  display:none!important;
}
html body.bq-tf117-index #tafsirIndex #v194T104SurahBrowser #v194T104SurahGrid .v194T104SurahCard::after {
  content:'‹'!important; grid-column:3!important; justify-self:end!important;
  font:400 22px/1 Arial,sans-serif!important; color:#7b867a!important;
}
/* All changes are limited to Tafsir index; dark scheme uses native app variables. */
.dark body.bq-tf117-index #bqTf118Topbar .bq-tf117-type,
.dark body.bq-tf117-index #bqTf117Dashboard .bq-tf117-search-field {background:var(--soft,#203c33)!important}
.dark body.bq-tf117-index #bqTf117Dashboard .bq-tf117-search-panel {background:var(--paper,#182e28)!important}
@media (max-width:380px){
 html body.bq-tf117-index #bqTf118Topbar {gap:3px!important}
 html body.bq-tf117-index #bqTf118Topbar .bq-tf117-type {flex-basis:102px;min-width:85px;max-width:35%;padding:3px 4px!important}
 html body.bq-tf117-index #bqTf118SearchAction {flex:0 0 29px;width:29px}
 html body.bq-tf117-index #bqTf118Topbar .bq-tf117-actions {gap:3px!important;flex-basis:115px}
 html body.bq-tf117-index #bqTf118Topbar .bq-tf117-actions button,
 html body.bq-tf117-index #bqTf118Last {font-size:9.2px!important;padding:2px 3px!important}
 html body.bq-tf117-index #bqTf118Last {min-width:45px!important;flex-basis:47px}
 html body.bq-tf117-index #bqTf117Dashboard .bq-tf117-jumps button {font-size:9px!important;padding:2px!important}
 html body.bq-tf117-index #bqTf117Dashboard #bqTf117Search {font-size:10px!important}
 html body.bq-tf117-index #v194T104SurahBrowser .v194T104SurahHead b {font-size:16px!important}
 html body.bq-tf117-index #v194T104SurahBrowser .v194T104SurahHead small {font-size:9px!important}
}
`;
 function el(id){return d.getElementById(id)}
 function installStyle(){
  if(el('bqTf118Style'))return;
  var st=d.createElement('style');st.id='bqTf118Style';st.textContent=css;
  d.head.appendChild(st);
 }
 function tafsirReady(){
  var screen=el('tafsirIndex');return !!(screen&&screen.classList.contains('active')&&w.__BASAIR_TAFSIR_INDEX_P117__);
 }
 function ensureTopbar(){
  var dash=el('bqTf117Dashboard');if(!dash)return false;
  var typ=dash.querySelector('.bq-tf117-type');
  var panel=dash.querySelector('.bq-tf117-search-panel');
  var actions=dash.querySelector('.bq-tf117-actions');
  if(!typ||!panel||!actions)return false;
  var bar=el('bqTf118Topbar');
  if(!bar){bar=d.createElement('div');bar.id='bqTf118Topbar';bar.setAttribute('aria-label','أدوات التفسير المختصرة');dash.insertBefore(bar,panel)}
  if(typ.parentElement!==bar)bar.appendChild(typ);
  var magnify=el('bqTf118SearchAction');
  if(!magnify){
   magnify=d.createElement('button');magnify.type='button';magnify.id='bqTf118SearchAction';
   magnify.textContent='⌕';magnify.setAttribute('aria-label','البحث في التفسير');
   magnify.addEventListener('click',function(){
    var input=el('bqTf117Search');if(input){input.focus();input.scrollIntoView({block:'nearest',behavior:'instant'})}
   });
  }
  if(magnify.parentElement!==bar)bar.appendChild(magnify);
  if(actions.parentElement!==bar)bar.appendChild(actions);
  var last=el('bqTf118Last');if(!last){
   last=d.createElement('button');last.id='bqTf118Last';last.type='button';last.textContent='↶ آخر موضع';
   last.addEventListener('click',function(){
    var API=w.__BASAIR_TAFSIR_STEP2__;if(!API||typeof API.state!=='function'||typeof API.open!=='function')return;
    var p=API.state();if(!p||!(Number(p.s)>0))return;
    API.open(Number(p.s),Math.max(1,Number(p.a)||1),p.type||'basair');
   });
  }
  if(last.parentElement!==bar)bar.appendChild(last);
  var fav=el('bqTf117Favorites'),resume=el('bqTf117Resume');
  if(fav)fav.setAttribute('aria-label','عرض الآيات المفضلة');
  if(resume)resume.setAttribute('aria-label','متابعة التفسير من آخر موضع');
  stats.arranged++;return true;
 }
 function fitHeading(){
  var browser=el('v194T104SurahBrowser');if(!browser)return;
  var head=browser.querySelector('.v194T104SurahHead');
  if(head){var heading=head.querySelector('b');if(heading&&heading.textContent.trim()!=='فهرس السور')heading.textContent='فهرس السور';
   var sm=head.querySelector('small');if(sm&&sm.textContent.trim()!=='اختر السورة للبدء')sm.textContent='اختر السورة للبدء';}
 }
 function arrange(){
  if(!tafsirReady())return;
  try{installStyle();ensureTopbar();fitHeading();stats.updates++}
  catch(_e){stats.errors++}
 }
 function begin(){
  installStyle();
  var idx=el('tafsirIndex');
  if(idx&&w.MutationObserver){
   new MutationObserver(function(){if(tafsirReady())arrange()}).observe(idx,{attributes:true,attributeFilter:['class']});
  }
  arrange();w.setInterval(function(){if(tafsirReady())arrange()},2300);
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',function(){w.setTimeout(begin,1000)},{once:true});
 else w.setTimeout(begin,450);
 w.__BASAIR_P118_TAFSIR_INDEX_MATCH__={version:'P118-QA051-TAFSIR-VISUAL-MATCH',refresh:arrange,diagnostics:function(){return Object.assign({},stats,{active:tafsirReady()})}};
})(window,document);