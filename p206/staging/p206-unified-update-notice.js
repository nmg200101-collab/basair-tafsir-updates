/* P206: unified signed-update notice presenter; read-only, no forged update events.
 * Reads only the active OTA status and displays information when it exposes a release.
 * Does not replace or bypass the signed OTA engine. */
(function(w,d){
'use strict';
if(w.__BASAIR_P206_NOTICES__)return;
var ID='p206UnifiedNotice',last='',seen=new Set();
function api(){return w.BasairUniversalOTA}
function safe(x){return typeof x==='string'?x.trim().slice(0,300):''}
function snapshot(){var a=api();if(!a||typeof a.status!=='function')return null;try{return a.status()}catch(_){return null}}
function extract(s){if(!s||typeof s!=='object')return null;
 var release=s.release||s.currentRelease||s.manifest||null;
 if(!release||typeof release!=='object')return null;
 var seq=Number(release.sequence),title=safe(release.title),type=safe(release.type||release.category),date=safe(release.issuedAt||release.date);
 if(!Number.isSafeInteger(seq)||seq<1||!title)return null;
 return{sequence:seq,title:title,type:type,date:date,restart:!!release.restartRequired};
}
function render(){var s=snapshot(),r=extract(s),old=d.getElementById(ID);if(!r){if(old)old.remove();return}
 var key=String(r.sequence);if(last===key&&old)return;last=key;
 var host=d.getElementById('basairUniversalP121Dialog');if(!host)return;
 var parent=host.querySelector('.bu-p121-panel');if(!parent)return;
 if(!old){old=d.createElement('section');old.id=ID;old.dir='rtl';old.setAttribute('role','status');old.style.cssText='margin:10px 0;padding:12px;border:1px solid #9ebcae;border-radius:12px;font:14px system-ui;line-height:1.6';parent.prepend(old)}
 old.replaceChildren();
 var h=d.createElement('strong');h.textContent='التحديث الشامل رقم '+r.sequence;old.appendChild(h);
 [r.title,r.type&&'نوع الإصلاح: '+r.type,r.date&&'التاريخ: '+r.date,r.restart&&'يتطلب إعادة فتح التطبيق'].filter(Boolean).forEach(function(x){var p=d.createElement('p');p.textContent=x;p.style.margin='4px 0';old.appendChild(p)});
}
function boot(){render();if(w.MutationObserver){var observer=new MutationObserver(function(){render()});observer.observe(d.body,{childList:true,subtree:true})}}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
w.__BASAIR_P206_NOTICES__={version:206,extract:extract,refresh:render};
})(window,document);
