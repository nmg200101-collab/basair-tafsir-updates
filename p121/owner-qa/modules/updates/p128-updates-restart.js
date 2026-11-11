/* P128: Add a one-tap WebView restart after verified universal update is staged.
   Module 'updates' only, installs after next app start; no native process kill.
   Never alters signature checks or database state. */
(function(){
  'use strict';
  if(window.__BASAIR_P128_RESTART__)return;
  var WATCH=/اكتمل تنزيل التحديث|ستظهر التغييرات عند إعادة فتح التطبيق|سيُفعّل عند فتح التطبيق/;
  var busy=false,observer=null,modalObserver=null;
  function restart(){
    if(busy)return;busy=true;
    var api=window.BasairUniversalOTA;
    var state=api&&api.status&&api.status();
    // A WebView reload reloads the signed active modules from IndexedDB.
    try{window.location.reload();}catch(_){busy=false;}
  }
  function makeButton(parent,id){
    if(!parent)return null;
    var b=parent.querySelector('#'+id);
    if(b)return b;
    b=document.createElement('button');b.type='button';b.id=id;
    b.className='b128-restart';b.textContent='↻ إعادة فتح التطبيق';
    b.setAttribute('aria-label','إعادة فتح واجهة بصائر القرآن لتفعيل التحديث');
    b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();restart();});
    parent.appendChild(b);return b;
  }
  function update(){
    var banner=document.getElementById('basairUniversalP122Notice');
    if(banner&&WATCH.test(banner.textContent||''))makeButton(banner,'b128RestartNotice');
    var dlg=document.getElementById('basairUniversalP121Dialog');
    if(dlg){
      var status=dlg.querySelector('#buP121Status'),actions=dlg.querySelector('.bu-p121-actions');
      if(status&&WATCH.test(status.textContent||''))makeButton(actions,'b128RestartDialog');
      if(status&&!modalObserver&&window.MutationObserver){
        modalObserver=new MutationObserver(update);
        modalObserver.observe(status,{characterData:true,subtree:true,childList:true});
      }
    }else if(modalObserver){modalObserver.disconnect();modalObserver=null;}
  }
  function init(){
    if(!window.BasairUniversalOTA)return;
    var st=document.createElement('style');st.textContent=
      '.b128-restart{border:0;border-radius:10px;padding:10px 13px;background:#0c6147;color:white;font-weight:700;min-height:42px;touch-action:manipulation;cursor:pointer}'+
      '.b128-restart:focus-visible{outline:3px solid #e7ba4b;outline-offset:2px}'+
      '.b128-restart:disabled{opacity:.5}';document.head.appendChild(st);
    update();
    if(window.MutationObserver){
      observer=new MutationObserver(function(ms){
        if(ms.some(function(m){return m.addedNodes.length||m.removedNodes.length}))update();
      });observer.observe(document.body,{childList:true,subtree:false});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.__BASAIR_P128_RESTART__={version:'1.0',restart:restart,refresh:update};
})();
