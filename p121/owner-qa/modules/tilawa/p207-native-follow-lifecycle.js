/* P207 — follow-mode compatibility repair for P206 V695.
 * Do not create another Mushaf renderer, change recitation clocks or touch frozen QA050 assets.
 * The native controller owns start/pause/resume. This module restores native static ownership
 * after a confirmed STOP and prewarms local printed pages before first play.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P207_FOLLOW_GUARD__)return;
 var track={running:false,paused:false,lastPage:0,lastEdition:'',action:'',actionAt:0,restores:0,prewarmed:0,errors:0,adapterChecks:0,adapterReady:false,buttonMatches:0,lastButton:'',visiblePrintPages:0,visibleNativeFrames:0};
 var timer=0,warmed=Object.create(null),restoreToken=0;
 function E(id){return d.getElementById(id)}
 function ctl(){return w.__BASAIR_B345_SEQUENCE__}
 function api(){return w.__BASAIR_PRINT_FOLLOW_100__}
 function pg(v){var n=Number(v);return Number.isInteger(n)&&n>=1&&n<=604?n:0}
 function mode(){
  var parity=w.__BASAIR_P205_ORIGINAL_PRINT_PARITY__,key='';
  try{if(parity&&typeof parity.status==='function'){var state=parity.status();if(state&&['original','tajwid','blue'].indexOf(state.edition)>=0)return state.edition}}catch(_){}
  try{key=w.localStorage&&w.localStorage.getItem('v129PrintMode')||''}catch(_){}
  if(key==='muallam')key='original';
  if(['original','tajwid','blue'].indexOf(key)>=0)return key;
  var fallback=d.body&&d.body.getAttribute('data-v144-print');
  return ['original','tajwid','blue'].indexOf(fallback)>=0?fallback:'original'
}
 function printed(){var b=d.body,p=api(),c=ctl();if(!b||!c||!c.state||!b.classList.contains('reader-active')||b.classList.contains('stableDigital')||b.classList.contains('h25-hifz')||b.classList.contains('h90-review')||b.classList.contains('h100-teacher'))return false;
  if(['tajwid','original','blue'].indexOf(mode())<0)return false;
  try{
    var font=w.localStorage&&w.localStorage.getItem('stableFont');
    if(font&&font!=='original')return false;
    var zoom=w.__BASAIR_B330_ZOOM__,scale=zoom&&typeof zoom.scale==='function'?Number(zoom.scale()):0;
    if(!(scale>0))scale=Number(w.localStorage&&w.localStorage.getItem('basair:tilawa-page-font-scale:v1'))||0;
    if(!(scale>0))scale=Number(b.getAttribute('data-b274-mushaf-scale')||b.getAttribute('data-b273-mushaf-scale'))||0;
    if(!(scale>0)&&p&&typeof p.scale==='function')scale=Number(p.scale())||0;
    if(scale>0&&scale!==100)return false;
  }catch(_){return false}
  return true}
 function prepareNativePrint(){
  if(track.adapterReady)return;
  // Install the already-approved P205 R33 adapter before the native start click bubbles.
  // This is not a second Follow request; B345 keeps sole ownership of play/audio timing.
  var p=w.__BASAIR_P205_ORIGINAL_PRINT_PARITY__;
  if(p&&typeof p.install==='function'){
   track.adapterChecks++;
   try{track.adapterReady=!!p.install()}catch(_){track.adapterReady=false;track.errors++}
  }
 }
 function warm(page,edition){
  if(!page||warmed[edition+':'+page]||!printed())return;
  warmed[edition+':'+page]=1;
  function load(src){if(!src)return;var im=new Image();im.onload=function(){track.prewarmed++};im.onerror=function(){delete warmed[edition+':'+page]};im.src=src}
  try{
   if(edition==='tajwid')load('assets/tajweed-pages/tajweed-'+String(page).padStart(3,'0')+'.webp');
   else{var bridge=w.__BASAIR_PRINT_BRIDGE__;if(bridge&&typeof bridge.resolvePage==='function')Promise.resolve(bridge.resolvePage(page)).then(load).catch(function(){delete warmed[edition+':'+page]})}
  }catch(_){delete warmed[edition+':'+page];track.errors++}
 }
 function findPage(){var c=ctl();if(c&&c.state&&pg(c.state.page))return pg(c.state.page);
  var im=d.querySelector('#mushafReader img[data-mushaf-page]');return pg(im&&im.getAttribute('data-mushaf-page'))}
 function frames(){
  // P205 creates the real Tajwid .stableFrame itself and the original
  // printed Mushaf already has its authentic border. Never append a
  // second decorative frame; doing so caused the extra frame reported
  // on the physical V695 phone in earlier QA rounds.
  var cards=d.querySelectorAll('#b345NormalStack>.r33PrintShell');
  track.visiblePrintPages=cards.length;
  var count=0;
  for(var i=0;i<cards.length;i++){
   if(cards[i].querySelector(':scope>.stableFrame'))count++;
  }
  track.visibleNativeFrames=count;
 }
 function isPaused(c){return !!(c&&c.state&&(c.state.paused===true||c.state.pause===true||c.state.status==='paused'||c.state.phase==='paused'))}
 function restore(page,serial){
  if(serial!==restoreToken||!printed())return;
  var c=ctl();if(!c||!c.state||c.state.running||isPaused(c))return;
  var p=pg(page)||findPage();if(!p)return;
  try{
   var pr=api(),held=!!c.state.printStaticHeld;
   try{held=held||!!(pr&&typeof pr.frozenActive==='function'&&pr.frozenActive())}catch(_){}
   if(held&&typeof c.releaseStaticPrint==='function')c.releaseStaticPrint();
   if(typeof w.renderLocalPage==='function')w.renderLocalPage(p,null);
   track.restores++;
  }catch(_){track.errors++}
 }
 function tick(){
  var c=ctl(),s=c&&c.state;
  if(!s||!printed()){track.running=false;track.paused=false;return}
  var nowRunning=!!s.running,nowPaused=isPaused(c),page=pg(s.page)||findPage(),edition=mode();
  if(!nowRunning&&!nowPaused){prepareNativePrint();warm(page,edition);warm(pg(page+1),edition)}
  if(nowRunning)frames();
  if(track.running&&!nowRunning&&!nowPaused){
   var action=track.action;
   if(action!=='pause' || Date.now()-track.actionAt>1800){
    var serial=++restoreToken,finalPage=page||track.lastPage;
    w.setTimeout(function(){restore(finalPage,serial)},80);
   }
  }
  if(nowRunning||nowPaused){track.lastPage=page||track.lastPage;track.lastEdition=edition}
  if(nowRunning)track.action='';
  track.running=nowRunning;track.paused=nowPaused;
 }
 function clicked(e){
  var node=e.target&&e.target.closest&&e.target.closest('button,[role="button"]');
  if(!node||!d.body||!d.body.classList.contains('reader-active'))return;
  var name=String(node.getAttribute('aria-label')||node.textContent||'').replace(/\s+/g,' ').trim();
  // Native Android controls prefix the follow labels with play/stop iconography.
  name=name.replace(/^[^\u0621-\u064aA-Za-z0-9]+/,'').replace(/[^\u0621-\u064aA-Za-z0-9]+$/,'').trim();
  if(/^(?:إيقاف\s*مؤقت(?:اً|ًا)?|توقيف\s*مؤقت|pause)$/i.test(name))track.action='pause';
  else if(/^(?:إيقاف(?:\s*(?:المتابعة|التلاوة))?|إنهاء\s*(?:المتابعة|التلاوة))$/i.test(name))track.action='stop';
  else if(/^(?:متابعة(?:\s*التلاوة)?|تشغيل\s*(?:المتابعة|متابعة(?:\s*التلاوة)?)|استئناف(?:\s*المتابعة)?|بدء\s*المتابعة)$/i.test(name))track.action='start';
  else return;
  track.lastButton=name;track.buttonMatches++;
  track.actionAt=Date.now();
  if(track.action==='start'){restoreToken++;prepareNativePrint();var page=findPage(),edition=mode();warm(page,edition);warm(pg(page+1),edition)}
  if(track.action==='stop'){
   var p=track.lastPage||findPage(),serial=++restoreToken;
   w.setTimeout(function(){restore(p,serial)},170);
  }
 }
 function boot(){if(timer||!d.body)return;d.addEventListener('click',clicked,true);timer=w.setInterval(tick,130);tick()}
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 w.__BASAIR_P207_FOLLOW_GUARD__={version:207,status:function(){return Object.assign({},track,{edition:mode(),eligible:printed()})},refresh:tick};
})(window,document);
