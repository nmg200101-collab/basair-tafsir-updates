/* Basair Quran P216 — ONE presentation over V695 signed P121/P206 updaters.
 * No second downloader, no raw unsigned manifest, no native app updates.
 * Staged only: launch after P215 visual acceptance; no auto-activation.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P216_UPDATE_CENTER__)return;
 var VER=216, ID='p216UpdateCenter', ACTIVE='p216CenterActive',
     busy=false, disabled=false, candidate=null, local=null, archive=[],
     lastError='',status='', tab='updates', selected=null, loadSeq=0,
     checking=null, installing=null, confirmed=false, menuNode=null,
     progressObserver=null;
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
   var b=add(parent,'button',label,cls||'p216Btn');b.type='button';
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
     el=node('section',null,'p216Panel');el.id=ID;el.dir='rtl';
     el.setAttribute('aria-label','مركز تحديثات بصائر القرآن');
     el.setAttribute('data-p216-version',String(VER));
     p.insertBefore(el,p.querySelector('.bu-p121-actions')||null);
   }
   dlg.classList.add(ACTIVE);
   hookProgress();
   return el;
 }
 function render(){
   if(disabled)return;
   var el=build();if(!el)return;
   el.replaceChildren();
   var top=add(el,'div',null,'p216Header');
   add(top,'h3','مركز تحديثات بصائر القرآن');
   add(top,'small','إصدار التطبيق الأساسي V695 — التحديثات موقّعة');
   var tabs=add(el,'div',null,'p216Tabs');
   [['updates','التحديثات'],['versions','الإصدارات'],['restore','الرجوع']].forEach(function(v){
     var t=button(tabs,v[1],function(){tab=v[0];selected=null;confirmed=false;render();
       if(tab!=='updates')loadArchive();},false,'p216Tab');
     t.setAttribute('aria-pressed',String(tab===v[0]));
   });
   var info=add(el,'div',null,'p216Local');
   if(local){
     var active=local.active||{},vers=Object.keys(active).sort().map(function(k){
       return (MOD[k]||k)+' v'+(active[k]&&active[k].version||'?');
     });
     add(info,'b','النسخة المثبّتة فعليًا — آخر تسلسل '+String(local.highestSequence||0));
     add(info,'p',vers.join(' • ')||'لا توجد وحدات مثبتة مسجلة');
     if(local.trial)add(info,'small','تفعيل قيد التحقق؛ لا تنفذ رجوعًا حتى يكتمل.');
   }else add(info,'p','جارٍ قراءة حالة الإصدار من الهاتف، وليس من الخادم.');
   if(lastError)add(el,'p','تعذر إكمال العملية: '+safe(lastError),'p216Error');
   if(status)add(el,'p',safe(status,350),'p216Status');
   var percentage=add(el,'p','','p216NativeProgress');percentage.id='p216RealProgress';
   percentage.setAttribute('role','status');percentage.setAttribute('aria-live','polite');
   syncProgress();
   if(tab==='updates')drawUpdates(el);
   else if(tab==='versions')drawVersions(el);
   else drawRestore(el);
   add(el,'small','بيانات الخادم تأتي من check() المتحقق من RSA وEd25519؛ لا يتم تثبيت شيء من هذه الواجهة دون محرك P121 الأصلي.');
 }
 function drawUpdates(el){
   var d0=signedDetails(candidate);
   if(!d0){add(el,'p','لم تُقرأ تفاصيل تحديث موقّع بعد.');}
   else{
     var card=add(el,'article',null,'p216Release');
     add(card,'b',(d0.newer?'تحديث جديد متاح — ':'آخر بيان معتمد — ')+'Seq'+d0.sequence);
     add(card,'p',d0.title);
     if(d0.issuedAt)add(card,'small','تاريخ الإصدار: '+d0.issuedAt.slice(0,10));
     if(d0.modules.length)add(card,'p','الأقسام: '+d0.modules.join('، '));
     d0.summary.forEach(function(s){if(s)add(card,'p','• '+s);});
     if(d0.restartRequired)add(card,'small','يُفعّل التحديث بعد إعادة فتح التطبيق.');
     if(d0.newer){
       if(d0.deliveryMode==='notify'){
         button(card,busy?'جارٍ التنزيل والتحقق…':'تحميل التحديث',install, busy||!engine());
       }else add(card,'p','هذا الإصدار موقّع للتنزيل التلقائي؛ يعالجه محرك P121، ولا ننشئ تنزيلًا ثانيًا.');
     }else add(card,'p','لا يوجد تحديث أحدث متاح لهذا الهاتف حاليًا.');
   }
   var controls=add(el,'div',null,'p216Actions');
   button(controls,busy?'جارٍ الفحص…':'فحص التحديثات',refresh,busy||!engine());
   if(status.indexOf('اكتمل تنزيل')===0){
     button(controls,'إعادة فتح التطبيق لتفعيل التحديث',function(){
       if(w.location&&typeof w.location.reload==='function')w.location.reload();
     },false);
   }
 }
 function syncProgress(){
   var native=d.getElementById('buP121Progress'),
       display=d.getElementById('p216RealProgress');
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
   var row=add(parent,'div',null,'p216VersionRow');
   add(row,'b',label);add(row,'span',value);return row;
 }
 function drawVersions(el){
   add(el,'h4','سجل الإصدارات المحفوظة على هذا الهاتف');
   if(!historyApi())add(el,'p','أرشيف P206 الموقّع غير متاح؛ لا يمكن الادعاء بوجود إصدارات قابلة للاستعادة.');
   else if(!archive.length)add(el,'p','لم تُحفظ إصدارات معتمدة محليًا بعد. يمكنك فحصها عبر أدوات النسخ الأصلية.');
   archive.forEach(function(r){
     compactRow(el,'Seq'+r.sequence+' — '+safe(r.title||r.id,90),
       r.approved?'محفوظ ومعتمد':'سجل غير معتمد للاستعادة');
   });
   add(el,'small','الإصدارات التاريخية غير المحفوظة لا يمكن استعادتها بمجرد معرفة رقمها.');
   button(el,'تحديث قائمة الإصدارات',loadArchive,busy||!historyApi());
 }
 function canRestore(r){
   return !!(r&&r.approved===true&&local&&!local.trial&&historyApi()&&
     Number.isSafeInteger(r.sequence)&&r.sequence<=local.highestSequence);
 }
 function drawRestore(el){
   add(el,'h4','الرجوع إلى إصدار محفوظ');
   if(!historyApi()){
     add(el,'p','لم يُحمّل نظام الإصدارات المحفوظة P206. لا يمكن إجراء رجوع متعدد من هنا.');
     button(el,'فتح أداة الرجوع السابقة',function(){
       var p=dialog();if(!p)return;
       p.classList.remove(ACTIVE);
       var a=w.__BASAIR_P197_ROLLBACK__;
       if(a&&typeof a.refresh==='function')a.refresh();
       var older=d.getElementById('p197RollbackPanel');
       if(older&&older.scrollIntoView)older.scrollIntoView({block:'nearest'});
     },!w.__BASAIR_P197_ROLLBACK__);
     return;
   }
   if(!archive.length)add(el,'p','لا توجد نسخة معتمدة ومحفوظة يمكن الرجوع إليها.');
   archive.forEach(function(r){
     var row=compactRow(el,'Seq'+r.sequence,' '+safe(r.title||r.id,90));
     if(!canRestore(r))return;
     button(row,selected===r.sequence?'إلغاء الاختيار':'اختيار الإصدار',function(){
       selected=selected===r.sequence?null:r.sequence;confirmed=false;render();
     },busy);
   });
   if(selected!==null){
     var r=archive.find(function(x){return x.sequence===selected;});
     if(r&&canRestore(r)){
       var confirmBox=add(el,'div',null,'p216Confirm');
       add(confirmBox,'b','تنبيه الرجوع إلى الإصدار Seq'+r.sequence);
       add(confirmBox,'p','سيتم استعادة محتوى هذا الإصدار المحفوظ بدل تحديثات الوحدات الحالية. يبقى إصدار التطبيق V695 وبياناتك. يمكن الرجوع إلى الأحدث المحفوظ إن كان معتمدًا وصالحًا.');
       button(confirmBox,confirmed?'تأكيد الرجوع الآن':'متابعة إلى التأكيد',function(){
         if(!confirmed){confirmed=true;render();return;}restore(r.sequence);
       },busy);
       button(confirmBox,'إلغاء',function(){selected=null;confirmed=false;render();},busy,'p216Secondary');
     }
   }
 }
 async function loadLocal(){
   try{local=await readLocal();lastError='';}
   catch(err){local=null;lastError=safe(String(err&&err.message||err));}
   render();return local;
 }
 async function loadArchive(){
   var api=historyApi();
   if(!api){archive=[];render();return [];}
   try{var rows=await api.list();
     archive=(Array.isArray(rows)?rows:[]).filter(function(r){
       return r&&Number.isSafeInteger(r.sequence)&&r.sequence>0;
     }).sort(function(a,b){return b.sequence-a.sequence}).slice(0,6);
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
       await loadLocal();return c;
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
     if(!again||!again.newer||!again.manifest||again.manifest.sequence!==wanted||
        again.manifest.deliveryMode!=='notify')throw Error('تغير إصدار الخادم، أعد فحص التحديث');
     installing=engine().install(again);
     var changed=await installing;
     status=changed?'اكتمل تنزيل التحديث والتحقق منه. أعد فتح التطبيق.':'لا توجد ملفات جديدة للتثبيت.';
     await loadLocal();return !!changed;
   }catch(err){status='';lastError=safe(String(err&&err.message||err));return false;}
   finally{busy=false;installing=null;render();}
 }
 async function restore(seq){
   var rec=archive.find(function(r){return r.sequence===seq;});
   if(!confirmed||!canRestore(rec)||busy)return false;
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
   // Own exactly one P216 entry and leave all older entries in the DOM,
   // hidden only by reversible scoped CSS. P207 may be inserted later.
   var item=d.getElementById('p216MoreUpdates');
   if(!item||!grid.contains(item)){
     if(item&&item.parentNode)item.parentNode.removeChild(item);
     item=node('button',null,'p216MoreButton');item.id='p216MoreUpdates';
     item.type='button';
     item.appendChild(node('span','↻','bq-opt-icon'));
     item.appendChild(node('b','مركز التحديثات'));
     item.appendChild(node('small','التحديثات والإصدارات والرجوع'));
     grid.appendChild(item);
   }
   menuNode=item;
   m.setAttribute('data-p216-menu','1');return true;
 }
 function open(){
   if(disabled||!engine())return false;
   engine().open();
   if(!build())return false;
   status='';lastError='';tab='updates';selected=null;confirmed=false;render();
   loadLocal();refresh();return true;
 }
 function clicked(ev){
   if(disabled)return;
   var target=ev.target&&ev.target.closest&&ev.target.closest(
     '#p216MoreUpdates,#p207OwnerUpdatesInMore,#bqMoreCenter button[data-bq-page="updates"]');
   if(!target||!contains(target,'#bqMoreCenter'))return;
   if(!engine())return;
   if(ev.preventDefault)ev.preventDefault();
   if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
   if(ev.stopPropagation)ev.stopPropagation();
   open();
 }
 function disable(){
   disabled=true;loadSeq++;candidate=null;archive=[];selected=null;confirmed=false;
   if(progressObserver){progressObserver.disconnect();progressObserver=null;}
   var dlg=dialog();if(dlg)dlg.classList.remove(ACTIVE);
   var m=d.getElementById('bqMoreCenter');if(m)m.removeAttribute('data-p216-menu');
   if(menuNode&&menuNode.id==='p216MoreUpdates'&&menuNode.parentNode)menuNode.parentNode.removeChild(menuNode);
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
   // Do NOT check or install on boot; P121 alone owns background update policy.
   menu();
 }
 w.__BASAIR_P216_UPDATE_CENTER__=Object.freeze({
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
