/* Basair Quran P218 — ONE comprehensive updates entry on V695's signed P121/P206.
 * No second downloader, no raw unsigned manifest, no native app updates.
 * P215 visual duplicate is removed by signed Tilawa asset-set swap, never by modifying B345.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P218_UPDATE_CENTER__)return;
 var VER=218, ID='p218UpdateCenter', ACTIVE='p218CenterActive',
     busy=false, disabled=false, candidate=null, local=null, archive=[],
     lastError='',status='', tab='updates', selected=null, loadSeq=0,
     checking=null, installing=null, confirmed=false, menuNode=null,
     progressObserver=null, downloadFailed=false;
 var MOD={tilawa:'التلاوة',tafsir:'التفسير',updates:'التحديثات',
   home:'الرئيسية',hifz:'الحفظ',library:'المكتبة',reciters:'القراء',
   search:'البحث',settings:'الإعدادات',shared:'المكونات المشتركة',
   navigation:'التنقل',downloads:'التنزيلات'};
 function safe(x,n){return typeof x==='string'?x.slice(0,n||220):'';}
 function ota(){return w.BasairUniversalOTA;}
 function engine(){var a=ota();return a&&typeof a.check==='function'&&typeof a.install==='function'&&typeof a.open==='function'?a:null;}
 function historyApi(){var a=w.__BASAIR_P206_SIGNED_ARCHIVE__;return a&&typeof a.list==='function'&&typeof a.restore==='function'?a:null;}
 function node(tag,txt,cls){
   var x=d.createElement(tag);if(txt!==undefined&&txt!==null)x.textContent=String(txt);
   if(cls)x.className=cls;return x;
 }
 function add(parent,tag,txt,cls){var n=node(tag,txt,cls);parent.appendChild(n);return n;}
 function button(parent,label,fn,disabledState,cls){
   var b=add(parent,'button',label,cls||'p218Btn');b.type='button';
   b.disabled=!!disabledState;if(fn)b.addEventListener('click',fn);return b;
 }
 function dialog(){return d.getElementById('basairUniversalP121Dialog');}
 function panel(){var a=dialog();return a&&a.querySelector&&a.querySelector('.bu-p121-panel');}
 function contains(el,id){return !!(el&&typeof el.closest==='function'&&el.closest(id));}
 function readLocal(){
   var a=w.__BASAIR_P207_ACTIVATION__;
   if(a&&typeof a.read==='function')return a.read();
   return new Promise(function(resolve,reject){
     if(!w.indexedDB)return reject(Error('التخزين المحلي غير متاح'));
     var open=w.indexedDB.open('basair:p121:universal:db',1);
     open.onerror=function(){reject(Error('تعذر قراءة إصدار الهاتف'))};
     open.onsuccess=function(){
       var db=open.result;
       if(!db.objectStoreNames.contains('meta')){db.close();resolve(null);return;}
       var tx=db.transaction('meta','readonly'),r=tx.objectStore('meta').get('state');
       r.onsuccess=function(){resolve(r.result||null)};
       r.onerror=function(){reject(Error('تعذر قراءة حالة التحديث'))};
       tx.oncomplete=function(){db.close()};tx.onabort=function(){db.close()};
     };
   });
 }
 function signedDetails(c){
   if(!c||!c.envelope||!c.manifest)return null;
   var m=c.manifest;
   if(!Number.isSafeInteger(m.sequence)||m.sequence<1||m.channel!=='owner-qa'||
      m.applicationId!=='app.basair.qurv2'||!Array.isArray(m.modules))return null;
   return{sequence:m.sequence,id:safe(m.id),title:safe(m.title)||safe(m.id),
     issuedAt:safe(m.issuedAt),deliveryMode:m.deliveryMode,
     newer:c.newer===true,
     modules:(Array.isArray(c.changes)&&c.changes.length?c.changes:m.modules).
       map(function(x){return MOD[x.id]||safe(x.id,50)}),
     summary:Array.isArray(m.changeSummary)?m.changeSummary.slice(0,8).map(function(s){return safe(s)}):[],
     restartRequired:m.restartRequired===true};
 }
 function build(){
   var p=panel(),dlg=dialog();if(!p||!dlg)return null;
   var el=d.getElementById(ID);
   if(!el||!p.contains(el)){
     if(el&&el.parentNode)el.parentNode.removeChild(el);
     el=node('section',null,'p218Panel');el.id=ID;el.dir='rtl';
     el.setAttribute('aria-label','مركز تحديثات بصائر القرآن');
     el.setAttribute('data-p218-version',String(VER));
     p.insertBefore(el,p.querySelector('.bu-p121-actions')||null);
   }
   el.hidden=false;
   dlg.classList.add(ACTIVE);
   hookProgress();
   return el;
 }
 function render(){
   if(disabled)return;
   var el=build();if(!el)return;
   el.replaceChildren();
   var top=add(el,'div',null,'p218Header');
   add(top,'h3','التحديث الشامل');
   add(top,'small','إصدار التطبيق الأساسي V695 — التحديثات موقّعة');
   var tabs=add(el,'div',null,'p218Tabs');
   [['updates','التحديث الجديد'],['versions','الإصدارات المتاحة']].forEach(function(v){
     var t=button(tabs,v[1],function(){tab=v[0];selected=null;confirmed=false;render();
       if(tab!=='updates')loadArchive();},false,'p218Tab');
     t.setAttribute('aria-pressed',String(tab===v[0]));
   });
   var info=add(el,'div',null,'p218Local');
   if(local){
     var active=local.active||{},vers=Object.keys(active).sort().map(function(k){
       return (MOD[k]||k)+' v'+(active[k]&&active[k].version||'?');
     });
     add(info,'b','الوحدات المثبّتة فعليًا — أعلى تسلسل تم استلامه '+String(local.highestSequence||0));
     add(info,'p',vers.join(' • ')||'لا توجد وحدات مثبتة مسجلة');
     if(local.trial)add(info,'small','تفعيل قيد التحقق؛ لا تنفذ رجوعًا حتى يكتمل.');
   }else add(info,'p','جارٍ قراءة حالة الإصدار من الهاتف، وليس من الخادم.');
   if(lastError)add(el,'p','تعذر إكمال العملية: '+safe(lastError),'p218Error');
   if(status)add(el,'p',safe(status,350),'p218Status');
   var percentage=add(el,'p','','p218NativeProgress');percentage.id='p218RealProgress';
   percentage.setAttribute('role','status');percentage.setAttribute('aria-live','polite');
   syncProgress();
   if(tab==='updates')drawUpdates(el);
   else drawVersions(el);
   add(el,'small','بيانات الخادم تأتي من check() المتحقق من RSA وEd25519؛ لا يتم تثبيت شيء من هذه الواجهة دون محرك P121 الأصلي.');
 }
 function drawUpdates(el){
   var d0=signedDetails(candidate);
   if(!d0){add(el,'p','لم تُقرأ تفاصيل تحديث موقّع بعد.');}
   else{
     var card=add(el,'article',null,'p218Release');
     add(card,'b',(d0.newer?'تحديث جديد متاح — ':'آخر بيان معتمد — ')+'Seq'+d0.sequence);
     add(card,'p',d0.title);
     if(d0.issuedAt)add(card,'small','تاريخ الإصدار: '+d0.issuedAt.slice(0,10));
     if(d0.modules.length)add(card,'p','الأقسام: '+d0.modules.join('، '));
     d0.summary.forEach(function(s){if(s)add(card,'p','• '+s);});
     if(d0.restartRequired)add(card,'small','يُفعّل التحديث بعد إعادة فتح التطبيق.');
     if(d0.newer){
       if(d0.deliveryMode==='notify'){
         button(card,busy?'جارٍ التنزيل والتحقق…':downloadFailed?'استئناف محاولة التحميل':'تحميل التحديث',install, busy||!engine());
         if(downloadFailed)add(card,'small','إعادة محاولة موثّقة من البداية؛ محرك V695 لا يدعم استكمال أجزاء الملفات.');
       }else add(card,'p','هذا الإصدار موقّع للتنزيل التلقائي؛ يعالجه محرك P121، ولا ننشئ تنزيلًا ثانيًا.');
     }else add(card,'p','لا يوجد تحديث أحدث متاح لهذا الهاتف حاليًا.');
   }
   var controls=add(el,'div',null,'p218Actions');
   button(controls,busy?'جارٍ الفحص…':'فحص التحديثات',refresh,busy||!engine());
   if(status.indexOf('اكتمل تنزيل')===0){
     button(controls,'إعادة فتح التطبيق لتفعيل التحديث',function(){
       if(w.location&&typeof w.location.reload==='function')w.location.reload();
     },false);
   }
 }
 function syncProgress(){
   var native=d.getElementById('buP121Progress'),
       display=d.getElementById('p218RealProgress');
   if(!display)return;
   var value=native&&String(native.textContent||'').trim();
   // Read ONLY genuine native P121 percent; never manufacture a progress bar.
   display.textContent=busy&&/^(?:100|[1-9]?\d)%$/.test(value||'')?
     'التنزيل الفعلي: '+value:'';
 }
 function hookProgress(){
   if(!w.MutationObserver||progressObserver)return false;
   var native=d.getElementById('buP121Progress');if(!native)return false;
   progressObserver=new w.MutationObserver(syncProgress);
   progressObserver.observe(native,{childList:true,characterData:true,subtree:true});
   return true;
 }
 function compactRow(parent,label,value){
   var row=add(parent,'div',null,'p218VersionRow');
   add(row,'b',label);add(row,'span',value);return row;
 }
 function relativeVersion(record){
   // Monotonic highestSequence is NOT the active version after rollback.
   // Compare actual module versions inside locally verified snapshots.
   var candidate=record&&record.active||{},active=local&&local.active||{};
   var newer=0,older=0;
   Object.keys(candidate).forEach(function(id){
     var a=Number(active[id]&&active[id].version),
         b=Number(candidate[id]&&candidate[id].version);
     if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b))return;
     if(b>a)newer++;else if(b<a)older++;
   });
   if(newer&&older)return 'محتوى مختلف بين الأقسام';
   if(newer)return 'محتوى محفوظ أحدث من النشط';
   if(older)return 'محتوى محفوظ أقدم من النشط';
   return 'محتوى مطابق أو لم تتوفر مقارنة';
 }
 function canRestore(r){
   return !!(r&&r.approved===true&&r._signatureVerified===true&&local&&!local.trial&&historyApi()&&
     Number.isSafeInteger(r.sequence)&&r.sequence<=local.highestSequence);
 }
 function versionName(record){
   var r=record||{},base=safe(r.id||'',70),found=/P\d+/.exec(base);
   return (found?found[0]:('Seq'+r.sequence))+' / Seq'+r.sequence;
 }
 function compactRecord(el,r){
   var item=add(el,'article',null,'p218VersionRecord');
   add(item,'b',versionName(r)+' — '+safe(r._verifiedTitle||r.title||r.id,'120'));
   if(r.date)add(item,'small','التاريخ: '+safe(r.date,10));
   if(r._releaseType)add(item,'small','نوع التحديث: '+safe(r._releaseType,90));
   if(r._changeSummary&&r._changeSummary.length)add(item,'p','تفاصيل: '+r._changeSummary.slice(0,3).join(' • '));
   if(!r._signatureVerified)add(item,'small','لم يُتحقق من توقيع البيان المحفوظ؛ غير متاح للتفعيل.');
   var mods=Object.keys(r.active||{}).sort().map(function(id){
     return (MOD[id]||safe(id,40))+' v'+String(r.active[id]&&r.active[id].version||'?');
   });
   if(mods.length)add(item,'small','محتوى الإصدار: '+mods.join('، '));
   add(item,'small',r.approved===true?'نسخة معتمدة محفوظة — '+relativeVersion(r):
      'غير معتمد للاستعادة؛ للعرض فقط');
   return item;
 }
 function selectedRecord(){return archive.find(function(x){return x.sequence===selected;})||null;}
 function drawVersions(el){
   add(el,'h4','الإصدارات المتاحة');
   if(status.indexOf('تمت استعادة بيانات')===0){
     button(el,'إعادة فتح التطبيق لإتمام الانتقال',function(){
       if(w.location&&typeof w.location.reload==='function')w.location.reload();
     },false);
   }
   if(!historyApi())add(el,'p','قائمة الإصدارات الموقّعة غير متاحة الآن؛ لن يظهر خيار رجوع غير مؤمّن.');
   else if(!archive.length)add(el,'p','لا توجد إصدارات معتمدة ومحفوظة على هذا الهاتف بعد. لا يمكن استعادة إصدار لم تُحفظ ملفاته.');
   archive.forEach(function(r){
     var card=compactRecord(el,r);
     if(!canRestore(r))return;
     button(card,selected===r.sequence?'تم تحديد هذا الإصدار':'تحديد الإصدار',function(){
       selected=r.sequence;confirmed=false;render();
     },busy,'p218Choose');
   });
   var sel=selectedRecord();
   if(sel&&canRestore(sel)){
     var detail=add(el,'div',null,'p218Confirm');
     var type=relativeVersion(sel),
         isNewer=type==='محتوى محفوظ أحدث من النشط',
         verb=isNewer?'الانتقال إلى الإصدار المحدد':'الرجوع إلى الإصدار المحدد';
     add(detail,'b','الإصدار المحدد: '+versionName(sel));
     add(detail,'p','المحتوى: '+safe(sel.title||sel.id,'120')+' — '+type);
     if(!confirmed)button(detail,verb,function(){
       confirmed=true;render();
     },busy);
     else{
       add(detail,'p','تأكيد: سيتم استعادة وحدات الإصدار '+versionName(sel)+
         ' بدلاً من الوحدات النشطة، مع بقاء APK ‏V695 وبيانات الملاحظات والمفضلة. هل تريد تنفيذ الانتقال؟');
       button(detail,'تأكيد الانتقال إلى الإصدار المحدد',function(){
         restore(sel.sequence);
       },busy);
     }
     button(detail,'إلغاء الاختيار',function(){selected=null;confirmed=false;render();},busy,'p218Secondary');
   }else add(el,'p','حدد أولًا إصدارًا معتمدًا من القائمة لتظهر خيارات الرجوع أو الانتقال إليه.');
   add(el,'small','النسخ غير المحفوظة أو التي فشل توقيعها لا يمكن تفعيلها. تُفحص الملفات مجددًا عبر P206 وقت الاستعادة.');
   button(el,'تحديث قائمة الإصدارات',loadArchive,busy||!historyApi());
 }
 async function loadLocal(){
   try{local=await readLocal();lastError='';}
   catch(err){local=null;lastError=safe(String(err&&err.message||err));}
   render();return local;
 }
 async function loadArchive(){
   var api=historyApi();
   if(!api||typeof api.verify!=='function'){archive=[];render();return [];}
   try{
     var rows=await api.list();
     rows=(Array.isArray(rows)?rows:[]).filter(function(r){
       return r&&Number.isSafeInteger(r.sequence)&&r.sequence>0;
     }).sort(function(a,b){return b.sequence-a.sequence}).slice(0,6);
     archive=await Promise.all(rows.map(async function(r){
       var record=Object.assign({},r,{_signatureVerified:false});
       try{
         if(!r.envelope) return record;
         var manifest=await api.verify(r.envelope);
         if(!manifest||manifest.sequence!==r.sequence||manifest.channel!=='owner-qa')return record;
         record._signatureVerified=true;
         record._verifiedTitle=safe(manifest.title||manifest.id,130);
         record._releaseType=safe(manifest.changeType||'غير محدد',60);
         record._changeSummary=Array.isArray(manifest.changeSummary)?
           manifest.changeSummary.map(function(s){return safe(s,170)}).slice(0,5):[];
       }catch(_){}
       return record;
     }));
     lastError='';
   }catch(err){archive=[];lastError=safe(String(err&&err.message||err));}
   render();return archive;
 }
 async function refresh(){
   if(disabled||busy||!engine())return null;
   if(checking)return checking;
   busy=true;lastError='';status='جارٍ التحقق من البيان الموقّع…';render();
   var nonce=++loadSeq;
   checking=(async function(){
     try{
       var c=await engine().check();
       if(nonce!==loadSeq||disabled)return null;
       if(!signedDetails(c))throw Error('البيان الموثّق لا يحتوي بيانات إصدار قابلة للعرض');
       candidate=c;status=c.newer?'تم التحقق من تحديث موقّع جديد.':'لا يوجد تحديث أحدث لهذا الهاتف.';
       downloadFailed=false;await loadLocal();return c;
     }catch(err){candidate=null;status='';lastError=safe(String(err&&err.message||err));return null;}
     finally{busy=false;checking=null;render();}
   })();
   return checking;
 }
 async function install(){
   if(disabled||busy||!engine()||!candidate||!candidate.newer||
      !candidate.manifest||candidate.manifest.deliveryMode!=='notify')return false;
   busy=true;status='جارٍ تنزيل ملفات التحديث والتحقق منها بواسطة P121…';lastError='';render();
   var wanted=candidate.manifest.sequence;
   try{
     // Re-read the authoritative signed envelope to avoid installing stale UI
     // candidates. P121 re-verifies it AGAIN before any asset write.
     var again=await engine().check();
     if(disabled)return false;
     if(!again||!again.newer||!again.manifest||again.manifest.sequence!==wanted||
        again.manifest.deliveryMode!=='notify')throw Error('تغير إصدار الخادم، أعد فحص التحديث');
     installing=engine().install(again);
     var changed=await installing;
     downloadFailed=false;
     status=changed?'اكتمل تنزيل التحديث والتحقق منه. أعد فتح التطبيق.':'لا توجد ملفات جديدة للتثبيت.';
     await loadLocal();return !!changed;
   }catch(err){downloadFailed=true;status='';lastError=safe(String(err&&err.message||err));return false;}
   finally{busy=false;installing=null;render();}
 }
 async function restore(seq){
   var rec=archive.find(function(r){return r.sequence===seq;});
   if(selected!==seq||!confirmed||!canRestore(rec)||busy)return false;
   busy=true;lastError='';status='جارٍ التحقق من النسخة المحفوظة…';render();
   try{
     var changed=await historyApi().restore(seq);
     if(!changed){status='الإصدار المختار مفعل بالفعل؛ لم تتغير الملفات.';return false;}
     status='تمت استعادة بيانات الإصدار المحفوظ؛ يُرجى إعادة فتح التطبيق.';
     selected=null;confirmed=false;
     await loadLocal();return true;
   }catch(err){lastError=safe(String(err&&err.message||err));status='';return false;}
   finally{busy=false;render();}
 }
 function menu(){
   var m=d.getElementById('bqMoreCenter');if(!m||m.hidden)return false;
   var grid=m.querySelector&&m.querySelector('.bq-more-grid');
   if(!grid)return false;
   // Own exactly one P218 entry and leave all older entries in the DOM,
   // hidden only by reversible scoped CSS. P207 may be inserted later.
   var item=d.getElementById('p218MoreUpdates');
   if(!item||!grid.contains(item)){
     if(item&&item.parentNode)item.parentNode.removeChild(item);
     item=node('button',null,'p218MoreButton');item.id='p218MoreUpdates';
     item.type='button';
     item.appendChild(node('span','↻','bq-opt-icon'));
     item.appendChild(node('b','مركز التحديثات'));
     item.appendChild(node('small','التحديثات والإصدارات والرجوع'));
     grid.appendChild(item);
   }
   menuNode=item;
   m.setAttribute('data-p218-menu','1');
   if(d.body&&engine())d.body.classList.add('p218UnifiedReady');return true;
 }
 function open(){
   if(disabled||!engine())return false;
   engine().open();
   if(!build())return false;
   if(d.body&&d.body.classList)d.body.classList.add('p218UnifiedReady');
   status='';lastError='';tab='updates';selected=null;confirmed=false;downloadFailed=false;render();
   loadLocal();refresh();return true;
 }
 function clicked(ev){
   if(disabled)return;
   var target=ev.target&&ev.target.closest&&ev.target.closest(
     '#p218MoreUpdates,#p207OwnerUpdatesInMore,#bqMoreCenter button[data-bq-page="updates"],'+
     '#p197LibraryUpdates,#p197NavUpdates,#basairUniversalP122Notice button');
   if(!target)return;
   var nativeBanner=!!contains(target,'#basairUniversalP122Notice');
   if(nativeBanner&&!/^(?:تحديث الآن|إعادة المحاولة)/.test(String(target.textContent||'').trim()))return;
   if(!nativeBanner&&!contains(target,'#bqMoreCenter')&&!contains(target,'#bqP26Menu')&&
      target.id!=='p197LibraryUpdates'&&target.id!=='p197NavUpdates')return;
   if(!engine())return;
   if(ev.preventDefault)ev.preventDefault();
   if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
   if(ev.stopPropagation)ev.stopPropagation();
   open();
 }
 function disable(){
   disabled=true;loadSeq++;candidate=null;archive=[];selected=null;confirmed=false;downloadFailed=false;
   if(progressObserver){progressObserver.disconnect();progressObserver=null;}
   var dlg=dialog();if(dlg)dlg.classList.remove(ACTIVE);
   var center=d.getElementById(ID);if(center)center.hidden=true;
   var m=d.getElementById('bqMoreCenter');if(m)m.removeAttribute('data-p218-menu');
   if(d.body&&d.body.classList)d.body.classList.remove('p218UnifiedReady');
   if(menuNode&&menuNode.id==='p218MoreUpdates'&&menuNode.parentNode)menuNode.parentNode.removeChild(menuNode);
   return true;
 }
 function enable(){disabled=false;menu();render();return true;}
 function boot(){
   if(!d.body)return;
   d.addEventListener('click',clicked,true);
   d.addEventListener('click',function(ev){
     if(ev.target&&ev.target.closest&&ev.target.closest('[data-bq="more"],#bqP26More'))
       w.setTimeout(menu,80);
   },true);
   if(w.MutationObserver){
     var observer=new w.MutationObserver(function(){if(!disabled)menu();});
     var m=d.getElementById('bqMoreCenter');
     if(m)observer.observe(m,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:false});
   }
   // Do NOT check or install on boot; V695 P121 owns signed notices and background policy.
   menu();
 }
 w.__BASAIR_P218_UPDATE_CENTER__=Object.freeze({
   version:VER,open:open,enable:enable,disable:disable,refresh:refresh,install:install,
   loadLocal:loadLocal,loadArchive:loadArchive,restore:restore,render:render,
   status:function(){return{version:VER,disabled:disabled,tab:tab,busy:busy,
     remoteSequence:candidate&&candidate.manifest&&candidate.manifest.sequence||0,
     localSequence:local&&local.highestSequence||0,
     archiveCount:archive.length,selectedRestore:selected,error:lastError,
     ready:!!engine()};}
 });
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
})(typeof window!=='undefined'?window:globalThis,
   typeof document!=='undefined'?document:null);
