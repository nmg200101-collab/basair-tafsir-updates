/* P207: real V695 More modal entry. The More dialog exists HIDDEN before opening.
 * Reference: V695 APK assets/www/home-v1-clean.js, #bqMoreCenter .bq-more-grid.
 * No replacement OTA engine and no changes to notes/favorites/installed APK.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P207_MORE_ENTRY__)return;
 var ENTRY='p207OwnerUpdatesInMore',STYLE='p207MoreEntryStyle',scheduled=false;
 var observed=null,moreObserver=null,rootObserver=null;
 function byId(id){return d.getElementById(id)}
 function dialog(){return byId('bqMoreCenter')}
 function activeMore(){
  var root=dialog(),heading=root&&root.querySelector('#bqMoreTitle');
  return root&&!root.hidden&&heading&&String(heading.textContent||'').trim()==='المزيد'?root:null;
 }
 function hideGhosts(){
  if(byId(STYLE))return;
  var style=d.createElement('style');style.id=STYLE;
  style.textContent=
   '#bqP26Menu>[data-basair-p121-button],#bqMoreCenter>[data-basair-p121-button],'+
   '#bqP26Menu>#p197NavUpdates,#bqMoreCenter>#p197MoreUpdates{display:none!important}';
  (d.head||d.documentElement).appendChild(style);
 }
 function open(e){
  if(e){e.preventDefault();e.stopPropagation()}
  var ota=w.BasairUniversalOTA;
  if(!ota||typeof ota.open!=='function')return;
  ota.open();
  w.setTimeout(function(){
   try{var p=w.__BASAIR_P197_ROLLBACK__;if(p&&typeof p.open==='function')p.open()}catch(_){}
   try{var n=w.__BASAIR_P206_NOTICES__;if(n&&typeof n.render==='function')n.render()}catch(_){}
   try{var a=w.__BASAIR_P207_ACTIVATION__;if(a&&typeof a.refresh==='function')a.refresh()}catch(_){}
  },70);
 }
 function install(){
  hideGhosts();
  if(!w.BasairUniversalOTA||typeof w.BasairUniversalOTA.open!=='function')return false;
  var root=activeMore();
  if(!root)return false;
  var grid=root.querySelector('.bq-more-grid'),
      peer=grid&&grid.querySelector('button[data-bq-page="updates"]');
  if(!grid||!peer)return false;
  var current=byId(ENTRY);
  if(current&&grid.contains(current))return true;
  if(current&&current.parentNode)current.parentNode.removeChild(current);
  var item=d.createElement('button');item.id=ENTRY;item.type='button';item.dir='rtl';
  item.setAttribute('data-basair-p121-button','1');
  item.setAttribute('aria-label','التحديثات الشاملة الموقعة');
  // The existing .bq-more-grid button CSS styles this like the real cards.
  var icon=d.createElement('span');icon.className='bq-opt-icon';icon.textContent='↻';
  var title=d.createElement('b');title.textContent='التحديثات الشاملة';
  var note=d.createElement('small');note.textContent='الفحص الموقّع والرجوع';
  item.appendChild(icon);item.appendChild(title);item.appendChild(note);
  item.addEventListener('click',open);
  grid.insertBefore(item,peer.nextSibling);
  return true;
 }
 function schedule(){
  if(scheduled)return;scheduled=true;
  w.setTimeout(function(){scheduled=false;install()},50);
 }
 function watchRealMore(){
  var root=dialog();
  if(!root||root===observed)return;
  if(moreObserver)moreObserver.disconnect();
  observed=root;
  if(w.MutationObserver){
   moreObserver=new w.MutationObserver(function(records){
    for(var i=0;i<records.length;i++){
     if(records[i].type==='attributes'&&records[i].attributeName==='hidden'){
      if(!root.hidden)schedule();return;
     }
    }
   });
   moreObserver.observe(root,{attributes:true,attributeFilter:['hidden']});
  }
  if(!root.hidden)schedule();
 }
 function boot(){
  if(!d.body)return;
  hideGhosts();watchRealMore();
  // Home-v1-clean creates #bqMoreCenter dynamically, potentially after OTA boot.
  if(w.MutationObserver){
   rootObserver=new w.MutationObserver(function(records){
    for(var i=0;i<records.length;i++){
     if(records[i].type!=='childList')continue;
     var nodes=records[i].addedNodes||[];
     for(var j=0;j<nodes.length;j++){
      var n=nodes[j];
      if(n.nodeType===1&&(n.id==='bqMoreCenter'||
         (n.querySelector&&n.querySelector('#bqMoreCenter')))){
       watchRealMore();return;
      }
     }
    }
   });
   rootObserver.observe(d.body,{childList:true,subtree:true});
  }
  // The native V695 homepage More action has data-bq="more", not a label
  // exactly equal to "المزيد". Schedule AFTER the original action callback.
  d.addEventListener('click',function(ev){
   var t=ev.target&&ev.target.closest&&ev.target.closest('[data-bq="more"],#bqP26More,[data-bq-page="updates"],.bq-more-back');
   if(t)schedule();
  },true);
  schedule();
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
 w.__BASAIR_P207_MORE_ENTRY__={version:207,install:install,open:open,activeMore:activeMore};
})(window,document);
