/* P206 staging — six-release verified history UI. No writes to OTA DB, no unsafe rollback.
   Only a signed OTA engine may activate an archived release. */
(function(w,d){
'use strict';
if(w.__BASAIR_P206_HISTORY__)return;
var KEY='basair:p121:universal:db', LIMIT=6;
function openState(){return new Promise(function(resolve,reject){
 if(!w.indexedDB)return reject(Error('indexedDB unavailable'));
 var req=w.indexedDB.open(KEY);
 req.onerror=function(){reject(Error('database unavailable'))};
 req.onsuccess=function(){var db=req.result;if(!db.objectStoreNames.contains('meta')){db.close();return resolve(null)}
 var tx=db.transaction('meta','readonly'),get=tx.objectStore('meta').get('state');
 get.onsuccess=function(){resolve(get.result||null)};get.onerror=function(){reject(Error('state unreadable'))};
 tx.oncomplete=function(){db.close()};};
});}
function valid(b){return !!(b&&Number.isSafeInteger(b.version)&&b.version>0&&Array.isArray(b.assets)&&b.files&&typeof b.files==='object'&&b.assets.every(function(a){return a&&typeof a.path==='string'&&a.files!==null&&b.files[a.path] instanceof ArrayBuffer&&a.size===b.files[a.path].byteLength&&/^[a-f0-9]{64}$/i.test(a.sha256||'')}) );}
function history(s,module){var seen=new Set(),out=[];function add(b,source){if(!valid(b)||seen.has(b.version))return;seen.add(b.version);out.push({version:b.version,source:source,available:true})}
 if(s){add(s.active&&s.active[module],'active');add(s.previous&&s.previous[module],'previous');
 // Future six-slot storage is intentionally read-only until signed OTA engine supports it.
 var h=s.history&&s.history[module];if(Array.isArray(h))h.forEach(function(x){add(x,'history')});}
 return out.sort(function(a,b){return b.version-a.version}).slice(0,LIMIT);
}
async function digest(bundle){if(!valid(bundle)||!w.crypto||!w.crypto.subtle)return false;for(var i=0;i<bundle.assets.length;i++){var a=bundle.assets[i],b=bundle.files[a.path],sum=await w.crypto.subtle.digest('SHA-256',b),hex=Array.from(new Uint8Array(sum)).map(function(x){return x.toString(16).padStart(2,'0')}).join('');if(hex.toLowerCase()!==a.sha256.toLowerCase())return false}return true}
function show(container){if(!container||d.getElementById('p206HistoryPanel'))return;var panel=d.createElement('section');panel.id='p206HistoryPanel';panel.dir='rtl';panel.style.cssText='margin:12px 0;padding:12px;border:1px solid #aac5b7;border-radius:12px;font:14px system-ui;line-height:1.7';
 var h=d.createElement('h3');h.textContent='سجل الإصدارات المحفوظة (حتى 6)';panel.appendChild(h);
 var status=d.createElement('p');status.textContent='جارٍ قراءة النسخ المحلية…';panel.appendChild(status);container.appendChild(panel);
 openState().then(function(s){var items=history(s,'tilawa');status.textContent=items.length?'إصدارات التلاوة المحفوظة: '+items.map(function(x){return 'v'+x.version}).join('، '):'لا توجد نسخ محلية مؤهلة لعرضها.';
 var note=d.createElement('p');note.textContent='الرجوع المتعدد غير مفعل حتى يدعم محرك التحديثات أرشيف ست حزم موقعة والتحقق من توافقها. الرجوع الحالي عبر النظام الأصلي فقط.';panel.appendChild(note);
 }).catch(function(){status.textContent='تعذر قراءة سجل الإصدارات؛ لم تتغير بيانات التطبيق.'});}
function mount(){var root=d.querySelector('#basairUniversalP121Dialog .bu-p121-panel');if(root)show(root)}
function boot(){mount();if(w.MutationObserver){var observer=new MutationObserver(function(){mount()});observer.observe(d.body,{childList:true,subtree:true})}}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
w.__BASAIR_P206_HISTORY__={version:206,limit:LIMIT,readState:openState,history:history,verifyBundle:digest};
})(window,document);
