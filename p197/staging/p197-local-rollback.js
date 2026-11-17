/* BASAIR P197 | safe one-step local rollback | V695 / QA-050.
 * Exposes existing signed BasairUniversalOTA.rollback(module) in Updates,
 * without replacing the OTA engine, manipulating active modules or bypassing signatures.
 * Do not let the user accidentally restore rejected P195/P196 visual/follow builds.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P197_ROLLBACK__)return;
 var DB='basair:p121:universal:db', activeUI=false, scheduled=false, current=null;
 var labels={tilawa:'التلاوة',tafsir:'التفسير',home:'الرئيسية',hifz:'الحفظ',library:'المكتبة',reciters:'القراء',navigation:'التنقل',shared:'المشتركة',updates:'إدارة التحديثات',settings:'الإعدادات',search:'البحث',downloads:'التنزيلات'};
 var badNames=['p195-digital-paper-turn.','p196-tajwid-follow-raster-owner.js'];
 var pending=null,processing=false;
 function el(id){return d.getElementById(id)}
 function text(parent,tag,value,cls){var v=d.createElement(tag);if(cls)v.className=cls;v.textContent=value;parent.appendChild(v);return v}
 function safeMessage(e){return e&&e.message?e.message:'تعذرت العملية'}
 function readState(){return new Promise(function(resolve,reject){
   if(!w.indexedDB)return reject(Error('التخزين المحلي غير متاح'));
   var q=w.indexedDB.open(DB,1);
   q.onerror=function(){reject(Error('تعذر فتح النسخ المحفوظة'))};
   q.onsuccess=function(){var db=q.result;try{
     if(!db.objectStoreNames.contains('meta')){db.close();return resolve(null)}
     var tx=db.transaction('meta','readonly'),req=tx.objectStore('meta').get('state');
     req.onsuccess=function(){resolve(req.result||null)};
     req.onerror=function(){reject(Error('تعذر قراءة حالة التحديث'))};
     tx.oncomplete=function(){db.close()};
     tx.onabort=function(){db.close()};
   }catch(e){db.close();reject(e)}};
   q.onupgradeneeded=function(){/* Never modify the signed update schema. */};
 })}
 function bundleValid(b){return !!(b&&Number.isSafeInteger(b.version)&&b.version>0&&Array.isArray(b.assets)&&b.files&&typeof b.files==='object'&&b.assets.every(function(a){return a&&typeof a.path==='string'&&b.files[a.path] instanceof ArrayBuffer&&a.size===b.files[a.path].byteLength&&/^[a-f0-9]{64}$/.test(a.sha256||'')}) )}
 function isRejected(b){return b&&Array.isArray(b.assets)&&b.assets.some(function(a){return badNames.some(function(s){return a.path&&a.path.indexOf(s)!==-1})})}
 function candidates(s){var a=s&&s.active||{},p=s&&s.previous||{};
   return Object.keys(a).filter(function(id){return p[id]&&bundleValid(p[id])&&Number(p[id].version)<Number(a[id].version)&&!isRejected(p[id])})
     .map(function(id){return{id:id,from:a[id].version,to:p[id].version,name:labels[id]||id}});
 }
 function selected(){if(!current||!current.choices.length)return null;var sel=el('p197ModuleChoice');var id=sel&&sel.value;return current.choices.find(function(x){return x.id===id})||current.choices[0]}
 function stateLabel(s){var a=s&&s.active||{},p=s&&s.previous||{},all=candidates(s);
   if(!s)return 'لا توجد تحديثات محفوظة على هذا الهاتف بعد.';
   if(all.length)return 'توجد نسخة سابقة محفوظة محليًا. الرجوع لا يحتاج الإنترنت.';
   if(p.tilawa&&isRejected(p.tilawa))return 'تمت استعادة التلاوة المستقرة P194؛ النسخة الأقدم المحفوظة P196 غير معتمدة، لذلك لا يمكن الرجوع إليها.';
   if(p.tilawa&&a.tilawa&&a.tilawa.version===p.tilawa.version)return 'التلاوة الحالية هي النسخة المعتمدة؛ لم يتغير قسم التلاوة في آخر تحديث.';
   return 'لا تتوفر نسخة سابقة مؤهلة للرجوع الآن. سيظهر الخيار بعد تثبيت تحديث لاحق مع الاحتفاظ بنسخته السابقة.';
 }
 function footer(root){var panel=el('p197RollbackPanel');if(panel)return panel;
   panel=d.createElement('section');panel.id='p197RollbackPanel';panel.dir='rtl';panel.setAttribute('aria-label','الرجوع إلى الإصدار السابق');
   text(panel,'h3','الرجوع إلى التحديث السابق');
   text(panel,'p','استعادة النسخة المحفوظة على الهاتف دون تنزيل أو حذف بيانات. يرجى التأكد من النسخة قبل الاستعادة.');
   var st=text(panel,'p','جارٍ فحص النسخة المحلية…','p197Status');st.id='p197Status';st.setAttribute('aria-live','polite');
   var row=d.createElement('div');row.className='p197Controls';
   var select=d.createElement('select');select.id='p197ModuleChoice';select.setAttribute('aria-label','القسم المراد إرجاعه');row.appendChild(select);
   var btn=d.createElement('button');btn.id='p197RollbackBtn';btn.type='button';btn.textContent='الرجوع للإصدار السابق';btn.disabled=true;btn.onclick=rollbackClick;row.appendChild(btn);
   var cancel=d.createElement('button');cancel.id='p197CancelBtn';cancel.type='button';cancel.textContent='إلغاء';cancel.hidden=true;cancel.onclick=function(){pending=null;syncPanel()};row.appendChild(cancel);panel.appendChild(row);
   root.appendChild(panel);return panel;
 }
 function style(){if(el('p197RollbackStyle'))return;var s=d.createElement('style');s.id='p197RollbackStyle';s.textContent=
 '#p197RollbackPanel{margin:12px 0;padding:13px;border:1px solid #b9d4c7;border-radius:14px;background:#f5faf7;color:#234e3e;font:14px system-ui,sans-serif;box-sizing:border-box}#p197RollbackPanel h3{margin:0 0 7px;font-size:15px}#p197RollbackPanel p{font-size:12px;line-height:1.6;margin:4px 0 8px}#p197RollbackPanel .p197Status{font-weight:700;color:#385e4e}#p197RollbackPanel .p197Controls{display:flex;flex-wrap:wrap;gap:7px}#p197RollbackPanel button,#p197RollbackPanel select{border:1px solid #b4c9bf;border-radius:9px;padding:9px;min-height:40px;font:inherit}#p197RollbackPanel button{background:#24694e;color:#fff;font-weight:700}#p197RollbackPanel button:disabled{opacity:.55}#p197RollbackPanel #p197CancelBtn{background:#ebefec;color:#284f40}#p197RollbackPanel button:focus-visible{outline:2px solid #b18e44;outline-offset:2px}body.dark #p197RollbackPanel{background:#19352b;color:#e9f6ee;border-color:#517467}body.dark #p197RollbackPanel .p197Status{color:#d5eadd}body.dark #p197RollbackPanel select{background:#214536;color:#fff}';d.head.appendChild(s)}
 async function syncPanel(){var p=el('p197RollbackPanel');if(!p)return;var st=el('p197Status'),btn=el('p197RollbackBtn'),select=el('p197ModuleChoice'),cancel=el('p197CancelBtn');
   if(!st||!btn||!select)return;
   if(processing){st.textContent='جارٍ التحقق من النسخة المحلية…';btn.disabled=true;return}
   try{var s=await readState(),choices=candidates(s);current={state:s,choices:choices};
     var prior=select.value;select.replaceChildren();choices.forEach(function(x){var o=d.createElement('option');o.value=x.id;o.textContent=x.name+' — من v'+x.from+' إلى v'+x.to;select.appendChild(o)});
     if(choices.some(function(x){return x.id===prior}))select.value=prior;
     else if(choices.some(function(x){return x.id==='tilawa'}))select.value='tilawa';
     select.hidden=!choices.length;btn.disabled=!choices.length||!w.BasairUniversalOTA||typeof w.BasairUniversalOTA.rollback!=='function';
     st.textContent=stateLabel(s);if(pending){var chosen=selected();if(!chosen||chosen.id!==pending.id||chosen.to!==pending.to)pending=null}
     btn.textContent=pending?'تأكيد الرجوع الآن':'الرجوع للإصدار السابق';cancel.hidden=!pending;
   }catch(e){current=null;pending=null;select.hidden=true;btn.disabled=true;cancel.hidden=true;btn.textContent='الرجوع للإصدار السابق';st.textContent='تعذر فحص النسخ: '+safeMessage(e)}
 }
 async function checksumOk(bundle){if(!w.crypto||!w.crypto.subtle)return false;
   for(var i=0;i<bundle.assets.length;i++){var a=bundle.assets[i],raw=bundle.files[a.path];if(!(raw instanceof ArrayBuffer)||raw.byteLength!==a.size)return false;
     var digest=await w.crypto.subtle.digest('SHA-256',raw),hex=Array.prototype.map.call(new Uint8Array(digest),function(x){return x.toString(16).padStart(2,'0')}).join('');if(hex!==a.sha256)return false;
   }return true;
 }
 async function rollbackClick(ev){if(ev){ev.preventDefault();ev.stopPropagation()}
   if(processing)return;
   var entry=selected(),p=el('p197Status');if(!entry)return;
   if(!pending||pending.id!==entry.id||pending.to!==entry.to){pending={id:entry.id,to:entry.to};if(p)p.textContent='تأكيد: ستعود '+entry.name+' من v'+entry.from+' إلى v'+entry.to+'، دون حذف بياناتك. اضغط «تأكيد الرجوع الآن».';var b=el('p197RollbackBtn');if(b)b.textContent='تأكيد الرجوع الآن';var c=el('p197CancelBtn');if(c)c.hidden=false;return;}
   processing=true;try{
     var s=await readState(),items=candidates(s),match=items.find(function(x){return x.id===entry.id&&x.to===entry.to&&x.from===entry.from});
     if(!match||!s.previous||!bundleValid(s.previous[entry.id]))throw Error('النسخة السابقة لم تعد متاحة');
     if(!(await checksumOk(s.previous[entry.id])))throw Error('فشل التحقق من سلامة ملفات النسخة السابقة');
     var ota=w.BasairUniversalOTA;if(!ota||typeof ota.rollback!=='function')throw Error('محرك التحديثات غير متاح');
     await ota.rollback(entry.id);pending=null;if(p)p.textContent='تمت الاستعادة محليًا. ستُفتح الواجهة من جديد لتفعيلها.';
     w.setTimeout(function(){w.location.reload()},600);
   }catch(e){pending=null;if(p)p.textContent='لم يحدث أي تغيير: '+safeMessage(e)}finally{processing=false;syncPanel()}
 }
 function ensureDialog(){var modal=el('basairUniversalP121Dialog');if(!modal)return;
   var native=el('buP121Rollback');if(native&&!native.dataset.p197Guard){native.dataset.p197Guard='1';native.textContent='الرجوع للإصدار السابق';native.onclick=function(e){e.preventDefault();e.stopPropagation();var p=el('p197RollbackPanel');if(p){p.scrollIntoView({block:'nearest'});syncPanel()}else{var api=w.BasairUniversalOTA;if(api&&api.open)api.open()}};}
   var body=modal.querySelector('.bu-p121-panel');if(body&&!el('p197RollbackPanel')){style();footer(body);syncPanel()}
 }
 function linkInto(root,id){if(!root||root.tagName==='BUTTON'||el(id))return;var b=d.createElement('button');b.id=id;b.type='button';b.textContent='↶ التحديثات والرجوع';b.setAttribute('aria-label','إدارة التحديثات واستعادة النسخة السابقة');b.onclick=function(e){e.preventDefault();e.stopPropagation();if(w.BasairUniversalOTA&&w.BasairUniversalOTA.open){w.BasairUniversalOTA.open();ensureDialog()}};root.appendChild(b)}
 function ensure(){ensureDialog();linkInto(el('bqP26Menu'),'p197NavUpdates');linkInto(el('bqMoreCenter'),'p197MoreUpdates');var hub=el('v194T107LibraryScroll');if(hub&&!el('p197LibraryUpdates')){var b=d.createElement('button');b.id='p197LibraryUpdates';b.type='button';b.textContent='↶ إدارة تحديثات التطبيق والرجوع';b.onclick=function(){if(w.BasairUniversalOTA&&w.BasairUniversalOTA.open){w.BasairUniversalOTA.open();ensureDialog()}};hub.insertBefore(b,hub.firstChild)} }
 function schedule(){if(scheduled)return;scheduled=true;w.requestAnimationFrame(function(){scheduled=false;ensure()})}
 function init(){if(!d.body)return;ensure();if(w.MutationObserver){var o=new MutationObserver(function(records){if(records.some(function(x){return Array.prototype.some.call(x.addedNodes,function(n){return n.nodeType===1&&!/^p197/.test(n.id||'')})}))schedule()});o.observe(d.body,{childList:true,subtree:true})}d.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#bqP26More,#v194T105TopLibrary,#v194T104LibrarySlotBtn,#v194T4Sheet'))w.setTimeout(function(){ensure();syncPanel()},80)},true)}
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P197_ROLLBACK__={version:197,open:function(){if(w.BasairUniversalOTA&&w.BasairUniversalOTA.open){w.BasairUniversalOTA.open();ensureDialog()}},refresh:syncPanel,status:readState};
})(window,document);
