/* P207 UI repair — place the P121 signed-update entry IN the visible "المزيد" modal.
 * Old P121/P197 controls were appended to #bqP26Menu/#bqMoreCenter underneath
 * the newer modal. This is UI-only: do not change the OTA engine, state, or keys.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P207_MORE_ENTRY__)return;
 var ENTRY='p207OwnerUpdatesInMore', STYLE='p207MoreEntryStyle',scheduled=false,observer=null;
 function norm(v){return String(v||'').replace(/\s+/g,' ').trim()}
 function visible(node){
  if(!node||!node.getBoundingClientRect)return false;
  var rect=node.getBoundingClientRect(),css=w.getComputedStyle?w.getComputedStyle(node):{};
  return rect.width>120&&rect.height>80&&css.display!=='none'&&css.visibility!=='hidden';
 }
 function hasLabels(node){
  if(!node)return false;
  var s=norm(node.textContent);
  return s.indexOf('إعدادات التطبيق')!==-1&&s.indexOf('معلومات التطبيق')!==-1&&
    s.indexOf('المساعدة والخصوصية')!==-1&&s.indexOf('تحديثات التطبيق')!==-1;
 }
 function findActualMore(){
  var headings=d.querySelectorAll('h1,h2,h3,h4,h5,strong,b,span,p,[role="heading"]');
  for(var i=0;i<headings.length;i++){
   var title=headings[i];
   if(norm(title.textContent)!=='المزيد')continue;
   for(var parent=title.parentElement,depth=0;parent&&parent!==d.body&&depth<9;parent=parent.parentElement,depth++){
    if(hasLabels(parent)&&visible(parent)){
     var labels=parent.querySelectorAll('h2,h3,h4,h5,strong,b,span,p,div,button,[role="button"]'),old=null;
     for(var j=0;j<labels.length;j++){
      var el=labels[j];
      if(norm(el.textContent)==='تحديثات التطبيق'){old=el;break}
     }
     if(!old)continue;
     var card=old;
     for(var k=0;k<7&&card.parentElement&&card.parentElement!==parent;k++){
      var next=card.parentElement,txt=norm(next.textContent);
      if(txt.indexOf('تحديثات التطبيق')===-1||txt.indexOf('المساعدة والخصوصية')!==-1||
        txt.indexOf('معلومات التطبيق')!==-1||txt.indexOf('إعدادات التطبيق')!==-1)break;
      card=next;
     }
     return {modal:parent,card:card};
    }
   }
  }
  return null;
 }
 function hideStaleControls(){
  if(d.getElementById(STYLE))return;
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
  // Existing signed modules own their respective panels. Do not create another
  // updater/rollback engine or invent local install status.
  w.setTimeout(function(){
   try{var p197=w.__BASAIR_P197_ROLLBACK__;if(p197&&typeof p197.open==='function')p197.open()}catch(_){}
   try{var notice=w.__BASAIR_P206_NOTICES__;if(notice&&typeof notice.render==='function')notice.render()}catch(_){}
   try{var diagnostic=w.__BASAIR_P207_ACTIVATION__;if(diagnostic&&typeof diagnostic.refresh==='function')diagnostic.refresh()}catch(_){}
  },70);
 }
 function install(){
  hideStaleControls();
  var data=findActualMore();
  if(!data||!data.card||!data.card.parentElement)return false;
  var old=d.getElementById(ENTRY);
  if(old&&data.modal.contains(old))return true;
  if(old&&old.parentElement)old.parentElement.removeChild(old);
  var item=d.createElement('button');item.id=ENTRY;item.type='button';item.dir='rtl';
  if(typeof data.card.className==='string')item.className=data.card.className;
  item.setAttribute('data-basair-p121-button','1');
  item.setAttribute('aria-label','التحديثات الشاملة الموقعة');
  item.style.cssText='box-sizing:border-box;display:flex;flex-direction:column;align-items:center;'+
   'justify-content:center;gap:5px;width:100%;min-height:112px;padding:12px 8px;'+
   'border:1px solid #d6cba9;border-radius:18px;background:#faf7ef;color:#1e5c4a;'+
   'text-align:center;font:inherit;cursor:pointer';
  var ico=d.createElement('span');ico.textContent='↻';ico.style.cssText='font-size:25px;font-weight:bold';item.appendChild(ico);
  var strong=d.createElement('strong');strong.textContent='التحديثات الشاملة';item.appendChild(strong);
  var note=d.createElement('small');note.textContent='الإصدار الموقّع والرجوع';note.style.cssText='font-size:12px';item.appendChild(note);
  item.addEventListener('click',open);
  data.card.parentElement.insertBefore(item,data.card.nextSibling);
  return true;
 }
 function schedule(){
  if(scheduled)return;scheduled=true;
  w.setTimeout(function(){scheduled=false;install()},70);
 }
 function boot(){
  if(!d.body)return;
  hideStaleControls();
  // The newer More modal is often created/rebuilt after P121 initialization.
  // Respond only to structural changes; do not run a polling interval.
  if(w.MutationObserver){
   observer=new w.MutationObserver(function(records){
    for(var i=0;i<records.length;i++){
     var items=records[i].addedNodes||[];
     for(var j=0;j<items.length;j++){
      var node=items[j];
      if(node.nodeType===1&&node.id!==ENTRY&&node.id!==STYLE){schedule();return}
     }
    }
   });
   observer.observe(d.body,{childList:true,subtree:true});
  }
  d.addEventListener('click',function(e){
   var n=e.target&&e.target.closest&&e.target.closest('#bqP26More,#bqMoreCenter,[data-basair-more],#bqMoreCenter');
   if(n)schedule();
  },true);
  schedule();
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 w.__BASAIR_P207_MORE_ENTRY__={version:207,install:install,find:findActualMore,open:open};
})(window,document);
