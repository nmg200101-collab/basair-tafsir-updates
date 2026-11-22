/* Basair P216 — a SINGLE updates surface on top of the original signed P121.
 * STAGING only. Never patches check/install/rollback, IndexedDB writes or APK.
 * P206 restore is callable ONLY after separate historical signature+asset checks.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P216_CENTER__)return;
 var ID='p216UpdatesCenter',ENTRY='p216UpdatesEntry',BANNER='p216UpdateNotice';
 var model=w.__BASAIR_P216_MODEL__,open=false,busy=false,lastCandidate=null,lastInstalled=null,
   history=[],pendingRestore=null,pendingApproval=null,error='',lastScan=0,scanPromise=null,noticeSeq=null;
 function el(tag,cls,content){
   var e=d.createElement(tag);if(cls)e.className=cls;
   if(content!==undefined)e.textContent=String(content);return e;
 }
 function add(p,tag,cls,content){var e=el(tag,cls,content);p.appendChild(e);return e;}
 function ota(){return w.BasairUniversalOTA;}
 function archive(){return w.__BASAIR_P206_SIGNED_ARCHIVE__;}
 function now(){return Date.now()}
 function err(e){return String(e&&e.message||e||'تعذرت العملية').slice(0,180)}
 function isReady(){return !!(model&&ota()&&typeof ota().check==='function'&&typeof ota().install==='function')}
 function installedStatus(){
   var x=w.__BASAIR_P207_ACTIVATION__;
   if(!x||typeof x.read!=='function')return Promise.resolve(null);
   return Promise.resolve().then(function(){return x.read()}).then(function(s){return model.installed(s)});
 }
 function label(t){return t||'غير معروف'}
 function action(p,text,fn,secondary){
   var b=add(p,'button',secondary?'p216-secondary':'p216-primary',text);b.type='button';
   b.disabled=busy;b.addEventListener('click',fn);return b;
 }
 function line(p,k,v){var r=add(p,'p','p216-line');add(r,'b','',k+' ');add(r,'span','',v);}
 function panel(){
   var o=d.getElementById(ID);if(o)return o;
   o=el('section');o.id=ID;o.hidden=true;o.dir='rtl';
   o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
   o.setAttribute('aria-label','مركز تحديثات بصائر القرآن');
   var wrap=add(o,'div','p216-panel');
   var top=add(wrap,'header','p216-header');
   add(top,'h2','','مركز تحديثات بصائر القرآن');
   action(top,'إغلاق',close,true).setAttribute('aria-label','إغلاق مركز التحديثات');
   var content=add(wrap,'div','p216-content');content.id='p216CenterContent';
   d.body.appendChild(o);return o;
 }
 function close(){var o=d.getElementById(ID);if(o)o.hidden=true;open=false;pendingRestore=null;pendingApproval=null;}
 function render(){
   if(!open)return;
   var root=d.getElementById('p216CenterContent');if(!root)return;
   root.replaceChildren();
   var installed=add(root,'section','p216-card');
   add(installed,'h3','','الإصدار المثبّت على هذا الهاتف');
   if(!lastInstalled)add(installed,'p','p216-muted','تعذر قراءة الإصدار الفعلي؛ لا نستخدم رقم الخادم بديلًا عنه.');
   else{
     line(installed,'التطبيق:','V695');
     line(installed,'أعلى تسلسل محلي:',lastInstalled.sequence===null?'غير معروف':'Seq '+lastInstalled.sequence);
     if(lastInstalled.trial)line(installed,'حالة التفعيل:','جاري التحقق بعد التحديث — '+lastInstalled.trial);
     lastInstalled.versions.forEach(function(v){line(installed,v.name+':',v.version===null?'غير معروف':'v'+v.version)});
   }
   var cur=add(root,'section','p216-card');
   add(cur,'h3','','التحديث الرسمي على الخادم');
   if(lastCandidate){
     line(cur,'التحديث:',(lastCandidate.title||lastCandidate.id||'تحديث موقّع')+' — Seq '+lastCandidate.sequence);
     line(cur,'تاريخ البيان:',lastCandidate.date.slice(0,10)||'غير محدد');
     line(cur,'نوع التنزيل:',lastCandidate.label);
     if(lastCandidate.modules.length)line(cur,'الأقسام:',lastCandidate.modules.map(x=>x.name+(x.version?' v'+x.version:'')).join('، '));
     lastCandidate.summary.forEach(function(s){add(cur,'p','p216-bullet','• '+s)});
     if(!lastCandidate.newer)add(cur,'p','p216-muted','لا يحتوي البيان الحالي على تحديث أحدث قابل للتثبيت لهذا الهاتف.');
     else if(lastCandidate.deliveryMode==='notify'){
       action(cur,'تحميل التحديث الموقّع',installCandidate,false);
       add(cur,'p','p216-muted','لا يبدأ التنزيل قبل ضغط الزر. تفعيل الملفات بعد إعادة فتح التطبيق.');
     }else add(cur,'p','p216-muted','هذا البيان يحدد التنزيل التلقائي؛ لا يمكن تغيير سياسة البيان الموقّع من الواجهة.');
   }else add(cur,'p','p216-muted','افحص الخادم لعرض الإصدار الموقّع وتفاصيله.');
   action(cur,'فحص التحديثات',refresh,true);
   var past=add(root,'section','p216-card');add(past,'h3','','الإصدارات المحفوظة والرجوع');
   if(!archive()||typeof archive().restore!=='function'){
     add(past,'p','p216-muted','الأرشيف الموقّع غير متاح على هذا الجهاز. يمكن استخدام خيار الرجوع الأصلي فقط عند توفر نسخة سابقة.');
     action(past,'فتح أدوات الاستعادة الأصلية',openNative,true);
   }else if(!history.length){
     add(past,'p','p216-muted','لا توجد نسخ تاريخية مُتحقَّق منها ومحفوظة محليًا للاستعادة الآن.');
     action(past,'فحص الإصدارات المحفوظة',loadHistory,true);
   }else{
     history.forEach(function(rec){
       var row=add(past,'div','p216-history');
       add(row,'b','',(rec.title||rec.id||'إصدار')+' — Seq '+rec.sequence);
       add(row,'p','p216-muted',(rec.approved?'معتمد':'لم يعتمد')+(rec.date?' • '+rec.date.slice(0,10):''));
       if(rec.moduleVersions.length)line(row,'الوحدات:',rec.moduleVersions.map(function(x){return x.name+(x.version?' v'+x.version:'')}).join('، '));
       if(rec.canRestore){
         action(row,pendingRestore===rec.sequence?'تأكيد الرجوع إلى هذا الإصدار':'الرجوع لهذا الإصدار',function(){restore(rec)},true);
       }else if(!rec.approved&&lastInstalled&&lastInstalled.ready&&lastInstalled.sequence===rec.sequence&&
         archive()&&typeof archive().approve==='function'){
         action(row,pendingApproval===rec.sequence?'تأكيد اعتماد هذا الإصدار':'اعتماد الإصدار الحالي بعد التجربة',function(){approveCurrent(rec)},true);
       }else add(row,'p','p216-muted','للعرض فقط — يتطلب الرجوع اعتمادًا ونسخةً سليمة ومحرك استعادة صالحًا');
     });
     action(past,'تحديث السجل',loadHistory,true);
   }
   if(pendingApproval!==null)add(root,'p','p216-warning','تأكيد اعتماد الإصدار الحالي كمستقر: لا تعتمد إصدارًا لم تختبره على الهاتف. ستتحقق خدمة P206 من ملفاته وتوقيعه وحالته قبل الاعتماد.');
   if(pendingRestore!==null){
     var rec=history.find(function(x){return x.sequence===pendingRestore});
     if(rec)add(root,'p','p216-warning',model.restoreMessage(lastInstalled,rec));
   }
   if(error)add(root,'p','p216-error',error);
   add(root,'p','p216-foot','التحميل والرجوع ينفذهما مستقبل V695 الأصلي بعد فحص التوقيع والبصمات. لا تُحذف الملاحظات أو المفضلة.');
 }
 function openCenter(){
   if(!isReady())return false;
   panel().hidden=false;open=true;render();refresh();loadHistory();return true;
 }
 function showBanner(rec){
   if(!rec||!rec.newer||rec.deliveryMode!=='notify')return;
   if(noticeSeq===rec.sequence)return;
   noticeSeq=rec.sequence;
   var b=d.getElementById(BANNER);
   if(!b){b=el('aside');b.id=BANNER;b.dir='rtl';b.setAttribute('role','status');d.body.appendChild(b)}
   b.replaceChildren();
   add(b,'b','','تحديث موثّق جديد — Seq '+rec.sequence);
   add(b,'p','',rec.title||rec.id||'تحديث جديد');
   var actions=add(b,'div','p216-actions');
   action(actions,'عرض التفاصيل والتحميل',function(){b.remove();d.body.classList.remove('p216-notice-ready');openCenter()});
   action(actions,'لاحقًا',function(){b.remove();d.body.classList.remove('p216-notice-ready')},true);
   d.body.classList.add('p216-notice-ready'); // hide ONLY duplicate native notice, never engine
 }
 async function refresh(){
   if(!isReady())return null;
   if(scanPromise)return scanPromise;
   scanPromise=(async function(){
     busy=true;error='';render();
     var notice=null;
     try{
       var candidate=await ota().check(); // P121 performs RSA+Ed25519 verification
       lastCandidate=model.candidate(candidate);
       if(!lastCandidate)throw Error('تعذر التحقق من بيانات بيان الإصدار');
       lastInstalled=await installedStatus().catch(function(){return null});
       if(lastCandidate.newer)notice=lastCandidate;
       lastScan=now();return lastCandidate;
     }catch(e){lastCandidate=null;error='فشل فحص التحديث الموقّع: '+err(e);return null}
     finally{
       busy=false;scanPromise=null;render();
       // Build notification controls only AFTER async check exits busy state.
       if(notice)showBanner(notice);
     }
   })();
   return scanPromise;
 }
 async function installCandidate(){
   if(busy||!lastCandidate||!lastCandidate.newer||lastCandidate.deliveryMode!=='notify')return false;
   busy=true;error='';render();
   try{
     var fresh=await ota().check();
     var summary=model.candidate(fresh);
     if(!summary||!summary.newer||summary.sequence!==lastCandidate.sequence||summary.deliveryMode!=='notify')
       throw Error('تغيّر الإصدار المتاح؛ أعد الفحص قبل التثبيت');
     await ota().install(fresh); // sole authorized V695 install path
     error='اكتمل تنزيل التحديث. أغلق التطبيق وافتحه لإتمام التفعيل بعد التحقق.';
     noticeSeq=null;
     var b=d.getElementById(BANNER);if(b)b.remove();
     d.body.classList.remove('p216-notice-ready');return true;
   }catch(e){error='لم يكتمل التحديث: '+err(e);return false}
   finally{busy=false;render()}
 }
 async function loadHistory(){
   var a=archive();if(!a||typeof a.list!=='function'||typeof a.verify!=='function'||typeof a.matches!=='function')return [];
   try{
     var rows=await a.list(),valid=[];
     var ready=rows.some(function(r){return r.approved&&r.active&&r.active.updates&&
       a.hasArchiveRuntime&&a.hasArchiveRuntime(r.active.updates)});
     for(var i=0;i<Math.min(rows.length,6);i++){
       var r=rows[i],m,match=false;
       if(!r||!r.envelope)continue;
       try{m=await a.verify(r.envelope);match=m.sequence===r.sequence&&await a.matches(r.active,m)}
       catch(_){continue}
       valid.push({sequence:r.sequence,id:r.id,title:r.title,date:r.date,approved:r.approved,
         verified:true,cachedAssetsVerified:match,restoreEngineReady:ready,
         moduleVersions:m.modules.map(function(x){return{id:x.id,version:x.version}})});
     }
     history=model.history(valid);render();return history;
   }catch(e){error='تعذر قراءة أرشيف الإصدارات: '+err(e);render();return []}
 }
 async function approveCurrent(rec){
   var a=archive();
   if(!a||typeof a.approve!=='function'||busy||rec.approved||
      !lastInstalled||!lastInstalled.ready||lastInstalled.sequence!==rec.sequence)return false;
   if(pendingApproval!==rec.sequence){pendingApproval=rec.sequence;pendingRestore=null;render();return false}
   busy=true;error='';render();
   try{await a.approve(rec.sequence);pendingApproval=null;await loadHistory();return true}
   catch(e){pendingApproval=null;error='لم يتم اعتماد هذا الإصدار: '+err(e);return false}
   finally{busy=false;render()}
 }
 async function restore(rec){
   if(!rec||!rec.canRestore||busy)return false;
   if(pendingRestore!==rec.sequence){pendingRestore=rec.sequence;pendingApproval=null;render();return false}
   busy=true;error='';render();
   try{
     // P206 re-verifies owner signatures + actual assets and refuses trial
     // or unapproved releases before any database state change.
     var changed=await archive().restore(rec.sequence);
     pendingRestore=null;
     if(changed){w.location.reload();return true}
     error='الإصدار المحدد مفعل بالفعل؛ لم يتغير شيء.';return false;
   }catch(e){pendingRestore=null;error='تعذر الرجوع بأمان: '+err(e);return false}
   finally{busy=false;render()}
 }
 function openNative(){var x=ota();if(x&&typeof x.open==='function')x.open()}
 function activeMore(){
   var root=d.getElementById('bqMoreCenter');
   return root&&!root.hidden&&root.querySelector('.bq-more-grid')?root:null;
 }
 function installEntry(){
   if(!isReady())return false;
   var root=activeMore();if(!root)return false;
   var grid=root.querySelector('.bq-more-grid'),entry=d.getElementById(ENTRY);
   if(!entry){entry=el('button');entry.id=ENTRY;entry.type='button';
     add(entry,'span','bq-opt-icon','↻');add(entry,'b','','مركز التحديثات');
     add(entry,'small','','الإصدارات والتنزيل والرجوع');entry.addEventListener('click',openCenter)}
   if(!grid.contains(entry))grid.appendChild(entry);
   d.body.classList.add('p216-center-ready');return true;
 }
 function boot(){
   if(!d.body)return;
   // Re-evaluate ONLY after native More opens: its nodes can be created late.
   d.addEventListener('click',function(e){var t=e.target&&e.target.closest&&
     e.target.closest('[data-bq="more"],#bqP26More,[data-bq-page="updates"]');
     if(t&&w.setTimeout)w.setTimeout(installEntry,80)},true);
   if(w.MutationObserver){
     var mo=new w.MutationObserver(function(){if(activeMore())installEntry()});
     mo.observe(d.body,{childList:true,subtree:true});
   }
   installEntry();
   // P121 itself checks on start/foreground. P216 checks only for displaying
   // verified details and never calls install without a user gesture.
   if(w.setTimeout)w.setTimeout(refresh,3000);
   d.addEventListener('visibilitychange',function(){if(!d.hidden&&now()-lastScan>60000)refresh()});
 }
 w.__BASAIR_P216_CENTER__=Object.freeze({version:216,open:openCenter,close:close,check:refresh,
   history:loadHistory,installEntry:installEntry,
   status:function(){return{ready:isReady(),open:open,busy:busy,lastScan:lastScan,
      pendingSequence:lastCandidate&&lastCandidate.sequence||null,
      localSequence:lastInstalled&&lastInstalled.sequence||null,
      historyCount:history.length,error:error}}});
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(typeof window!=='undefined'?window:globalThis,typeof document!=='undefined'?document:null);
