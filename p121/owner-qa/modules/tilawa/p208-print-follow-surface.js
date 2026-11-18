/* P208 / V695 native B345 printed Follow surface reconciliation.
 * Keeps R33/P205 images, page frames, audio clock and scroll positions untouched.
 * Moves the EXISTING pause/stop controls into the native reader dock so they
 * never cover either paper page. No clone of page or control is created.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P208_PRINT_SURFACE__)return;
 var ROOT='p208-print-follow',STYLE='p208PrintFollowSurfaceStyle';
 var originalParent=null,originalNext=null,trackedMini=null,active=false,timer=0;
 var count={enters:0,exits:0,moves:0,restores:0,pages:0,framed:0,errors:0,resizeRequests:0};
 function el(id){return d.getElementById(id)}
 function ctl(){return w.__BASAIR_B345_SEQUENCE__}
 function printed(){
  var s=ctl()&&ctl().state,b=d.body,p=w.__BASAIR_PRINT_FOLLOW_100__;
  if(!s||!b||!s.running||s.scaleMode!=='normal'||!b.classList.contains('reader-active'))return false;
  if(b.classList.contains('stableDigital')||b.classList.contains('h25-hifz')||b.classList.contains('h90-review')||b.classList.contains('h100-teacher'))return false;
  try{
   if(!p||typeof p.active!=='function'||!p.active())return false;
   var edition=typeof p.edition==='function'?p.edition():'';
   if(['original','tajwid','blue'].indexOf(edition)<0)return false;
   if(typeof p.scale==='function'&&Number(p.scale())!==100)return false;
  }catch(_){return false}
  return true;
 }
 function ensureCss(){
  if(el(STYLE))return;
  var style=d.createElement('style');style.id=STYLE;
  style.textContent=
    'body.'+ROOT+' #mushafDock{height:calc(96px + env(safe-area-inset-bottom))!important;min-height:96px!important;padding:43px 5px env(safe-area-inset-bottom)!important;box-sizing:border-box!important;overflow:visible!important}' +
    'body.'+ROOT+' #mushafDock>#sequenceMiniControl{display:flex!important;position:absolute!important;top:2px!important;bottom:auto!important;left:4px!important;right:4px!important;transform:none!important;width:auto!important;height:38px!important;min-height:38px!important;box-sizing:border-box!important;justify-content:center!important;align-items:center!important;z-index:1!important;margin:0!important;padding:3px!important;background:rgba(9,67,54,.97)!important;box-shadow:none!important;backdrop-filter:none!important;pointer-events:auto!important}' +
    'body.'+ROOT+' #mushafDock>#sequenceMiniControl:not(.show){display:none!important}' +
    'body.'+ROOT+' #mushafDock>#sequenceMiniControl #sequenceMiniText{display:none!important}' +
    'body.'+ROOT+' #mushafDock>#sequenceMiniControl button{position:static!important;min-height:30px!important;padding:5px 14px!important;margin:0 2px!important;flex:0 1 auto!important;font-size:12px!important;line-height:1.15!important;white-space:nowrap!important;color:#fff!important}' +
    'body.'+ROOT+' #mushafDock>#sequenceMiniControl #sequenceMiniStop{background:#842c24!important}' +
    'body.'+ROOT+' #mushafDock>#sequenceMiniControl #sequenceMiniPause{background:#285e52!important}' +
    // Never add a second frame: R33/P205 already creates exactly one.
    'body.'+ROOT+' #b345NormalStack>.r33PrintShell{margin-top:0!important;margin-bottom:2px!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:hidden!important}' +
    'body.'+ROOT+' #b345NormalStack>.r33PrintShell>.stableFrame{pointer-events:none!important}' +
    'body.'+ROOT+' #b345NormalStack>.r33PrintShell>.r33PrintImage{object-fit:fill!important}';
  (d.head||d.documentElement).appendChild(style);
 }
 function resizeOnce(){
  try{if(typeof w.Event==='function'&&typeof w.dispatchEvent==='function'){
   count.resizeRequests++;w.dispatchEvent(new w.Event('resize'));
  }}catch(_){count.errors++}
 }
 function move(){
  var dock=el('mushafDock'),mini=el('sequenceMiniControl');
  if(!dock||!mini||!d.body||!d.body.classList)return false;
  if(trackedMini!==mini || !originalParent || !originalParent.isConnected){
   trackedMini=mini;originalParent=mini.parentNode;originalNext=mini.nextSibling;
  }
  if(mini.parentNode!==dock){dock.insertBefore(mini,dock.firstChild);count.moves++;}
  return mini.parentNode===dock;
 }
 function restore(){
  var mini=el('sequenceMiniControl');
  if(!mini||!originalParent||!originalParent.isConnected||mini.parentNode===originalParent)return;
  var sibling=originalNext&&originalNext.parentNode===originalParent?originalNext:null;
  originalParent.insertBefore(mini,sibling);count.restores++;
 }
 function measure(){
  try{
   var cards=d.querySelectorAll('#b345NormalStack>.r33PrintShell'),framed=0;
   for(var i=0;i<cards.length;i++)if(cards[i].querySelector(':scope>.stableFrame'))framed++;
   count.pages=cards.length;count.framed=framed;
  }catch(_){count.errors++}
 }
 function sync(){
  var should=printed();
  if(should){
   ensureCss();
   if(!move())return;
   if(!active){active=true;d.body.classList.add(ROOT);count.enters++;resizeOnce();}
   measure();
  }else if(active){
   active=false;d.body.classList.remove(ROOT);restore();count.exits++;resizeOnce();
  }
 }
 function init(){
  if(!d.body||timer)return;
  timer=w.setInterval(sync,160);
  d.addEventListener('click',function(e){
   if(e.target&&e.target.closest&&e.target.closest('#dockSequence,#sequenceSilent,#sequenceAudio,#playSeq,#sequenceMiniStop,#sequenceMiniPause'))w.setTimeout(sync,0);
  },true);
  sync();
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P208_PRINT_SURFACE__={version:208,status:function(){return Object.assign({active:active},count)},refresh:sync};
})(window,document);
