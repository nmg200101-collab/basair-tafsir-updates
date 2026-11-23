/* P216 archive-v2 — scope-aware P206-compatible six signed OTA snapshots, STAGING ONLY.
 * Integrates with V695 P121 state schema WITHOUT replacing P121 install/verify/clock.
 * Never archives an unverified/failed trial; user explicitly approves stable releases.
 * Restore uses P121's own trial-based recovery and keeps highestSequence monotonic.
 */
(function(w,d){
'use strict';
if(w.__BASAIR_P206_SIGNED_ARCHIVE__)return;
var OTA_DB='basair:p121:universal:db', ARCH_DB='basair:p206:signed-six-archive', LIMIT=6, APP='app.basair.qurv2';
var RSA_PUBLIC='MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAyXkxNwLNb5VBj2+tMN6/LEj7JyAQ+jyuaxPajj6iAoItN2JLqyu9JBVsesMkQLxwv78MtDJFH1dX+ZAAFNw0Q2d5CBxlhz06kugb7aTQaXcKIPXHAZ7jyo+uH95vWT1uhQqRTH8nAXjq6Z/rxJQJLZ72MYR8NapMTmZys4qlhwCXo6AyB0yBhzpAiMERAy3OIUH4lUXz+EDKnMhpBDPLzwkGAT8pfJ/TFA/wX1ld0Pn16zzUMEXOR3kAbKa3N0bJqs6B+Hlvrd2QwYt2PNDEFdvLKx5R1unkNGWVb8ky/Hs6DW137ONjY5w3luJPpV/sdtRZSOPQwKit6fLbSSCCEICY9BxELcAB4NrA1QTjS6qsA6KPrmhB6+70wnaFgsYdr3mev3bafWFS4mFpKu4WmklQFTZSGCDwfBoQnw3ruAa3sdyURV++0N1wxlT9qVO+VSFNLLrPOnjbYSsjBmCwDNfEVXWB1vnxkEGtDeeW3X29AYOCPQ8/QoXELBdAOa5lAgMBAAE=', OWNER_PUBLIC='E5w/6ZiOP+TAolg6STpmeDl0Yo2A/NPHhcqhCo5pitk=';
var PROTECTED=['tilawa','shared','navigation','reciters'],busy=false,chosen=null,legacyClick=null;
var encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
function decode64(s){if(typeof s!=='string'||s.length>64000)throw Error('Invalid base64');var raw=atob(s),a=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return a}
async function hash(b){var dig=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(dig)).map(function(v){return v.toString(16).padStart(2,'0')}).join('')}
function db(name,version,upgrade){return new Promise(function(resolve,reject){var req=indexedDB.open(name,version);req.onupgradeneeded=function(){if(upgrade)upgrade(req.result)};req.onsuccess=function(){resolve(req.result)};req.onerror=function(){reject(req.error||Error('DB failed'))}})}
async function stateRead(){var database=await db(OTA_DB,1),value=await new Promise(function(resolve,reject){var tx=database.transaction('meta','readonly'),r=tx.objectStore('meta').get('state');r.onsuccess=function(){resolve(r.result||null)};r.onerror=function(){reject(r.error)}});database.close();return value}
function sameVersions(a,b){var ax=Object.keys(a||{}).sort(),bx=Object.keys(b||{}).sort();return ax.length===bx.length&&ax.every(function(k,i){return bx[i]===k&&a[k]&&b[k]&&a[k].version===b[k].version})}
async function stateSwap(expected,next){var database=await db(OTA_DB,1);try{return await new Promise(function(resolve,reject){
 var error=null,tx=database.transaction('meta','readwrite'),os=tx.objectStore('meta'),req=os.get('state');
 req.onsuccess=function(){var live=req.result;
  if(!live||live.trial||live.highestSequence!==expected.highestSequence||!sameVersions(live.active,expected.active)){
   error=Error('تغيّرت حالة التحديثات أثناء التحقق؛ لم يتم الرجوع');tx.abort();return;
  }
  os.put(next,'state');
 };
 req.onerror=function(){error=req.error||Error('تعذر قراءة حالة التحديثات');tx.abort()};
 tx.oncomplete=function(){resolve(true)};tx.onerror=function(){reject(error||tx.error||Error('فشل حفظ النسخة'))};
 tx.onabort=function(){reject(error||tx.error||Error('أُلغي الرجوع الآمن'))};
 })}finally{database.close()}}
async function store(){return db(ARCH_DB,1,function(database){if(!database.objectStoreNames.contains('releases'))database.createObjectStore('releases',{keyPath:'sequence'})})}
async function list(){var database=await store();try{return await new Promise(function(resolve,reject){var tx=database.transaction('releases','readonly'),r=tx.objectStore('releases').getAll();r.onsuccess=function(){resolve((r.result||[]).sort(function(a,b){return b.sequence-a.sequence}))};r.onerror=function(){reject(r.error)}})}finally{database.close()}}
async function save(rec){
 var rows=await list(),all=rows.filter(function(r){return r.sequence!==rec.sequence}).concat(rec);
 var approved=all.filter(function(r){return r.approved}).sort(function(a,b){return b.sequence-a.sequence}).slice(0,LIMIT);
 var pending=all.filter(function(r){return !r.approved}).sort(function(a,b){return b.sequence-a.sequence}).slice(0,1);
 var keep=new Set(approved.concat(pending).map(function(r){return r.sequence}));
 var del=all.filter(function(r){return !keep.has(r.sequence)});
 var database=await store();try{return await new Promise(function(resolve,reject){
  var tx=database.transaction('releases','readwrite'),os=tx.objectStore('releases');os.put(rec);del.forEach(function(r){os.delete(r.sequence)});
  tx.oncomplete=function(){resolve(true)};tx.onerror=function(){reject(tx.error)};tx.onabort=function(){reject(tx.error)};
 })}finally{database.close()}
}
async function get(sequence){var database=await store();try{return await new Promise(function(resolve,reject){var tx=database.transaction('releases','readonly'),r=tx.objectStore('releases').get(sequence);r.onsuccess=function(){resolve(r.result||null)};r.onerror=function(){reject(r.error)}})}finally{database.close()}}
async function manifestVerified(envelope){
 if(!w.crypto||!crypto.subtle||!w.indexedDB||!envelope||typeof envelope.payload!=='string'||typeof envelope.signature!=='string')throw Error('No signed envelope');
 var payload=decode64(envelope.payload),sig=decode64(envelope.signature);
 if(payload.length>48000||sig.length!==384)throw Error('Invalid signature length');
 var rsa=await crypto.subtle.importKey('spki',decode64(RSA_PUBLIC),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5',rsa,sig,payload)))throw Error('Untrusted RSA signature');
 var m=JSON.parse(decoder.decode(payload));
 if(!m||m.schema!=='basair-universal-ota-v1'||m.channel!=='owner-qa'||m.applicationId!==APP||!Number.isSafeInteger(m.sequence)||m.sequence<1||
 !Number.isSafeInteger(m.minAppVersion)||m.minAppVersion>695||m.minAppVersion<693||!Array.isArray(m.modules)||!m.modules.length)throw Error('Incompatible release');
 var ids=new Set(),paths=new Set(),total=0;
 for(var mod of m.modules){
  if(!mod||typeof mod.id!=='string'||ids.has(mod.id)||!Number.isSafeInteger(mod.version)||mod.version<1||!Array.isArray(mod.assets))throw Error('Invalid module');
  ids.add(mod.id);
  for(var a of mod.assets){if(!a||typeof a.path!=='string'||!a.path.startsWith('modules/'+mod.id+'/')||a.path.indexOf('..')!==-1||paths.has(a.path)||
  !Number.isSafeInteger(a.size)||a.size<0||a.size>8388608||!/^[a-f0-9]{64}$/.test(a.sha256||''))throw Error('Invalid signed asset');
  paths.add(a.path);total+=a.size}
 }
 if(total>33554432||paths.size>100)throw Error('Oversized release');
 var locked=m.modules.filter(function(x){return PROTECTED.indexOf(x.id)!==-1});
 if(locked.length){
  var a=m.ownerApproval;if(!a||a.schema!==1||a.algorithm!=='Ed25519'||a.sequence!==m.sequence||typeof a.signature!=='string'||typeof a.expiresAt!=='string')throw Error('Owner approval missing');
  var sum=await hash(encoder.encode(JSON.stringify(locked)));if(sum!==a.modulesSha256)throw Error('Owner hash mismatch');
  var proof='basair-universal-protected-v1\n'+APP+'\n'+m.sequence+'\n'+a.modulesSha256+'\n'+a.expiresAt;
  var key=await crypto.subtle.importKey('raw',decode64(OWNER_PUBLIC),{name:'Ed25519'},false,['verify']);
  if(!(await crypto.subtle.verify('Ed25519',key,decode64(a.signature),encoder.encode(proof))))throw Error('Owner approval signature rejected');
 }
 return m;
}
async function matches(active,m){
 if(!active||!m||!Array.isArray(m.modules)||!m.modules.length)return false;
 for(var mod of m.modules){
  var b=active[mod.id];if(!b||b.version!==mod.version||!Array.isArray(b.assets)||b.assets.length!==mod.assets.length||!b.files)return false;
  for(var a of mod.assets){
   var entry=b.assets.find(function(x){return x.path===a.path&&x.sha256===a.sha256&&x.size===a.size&&x.kind===a.kind});
   var bytes=b.files[a.path];
   if(!entry||!(bytes instanceof ArrayBuffer)||bytes.byteLength!==a.size||(await hash(bytes))!==a.sha256)return false;
  }
 }
 return true;
}
async function capture(){
 if(busy||!w.BasairUniversalOTA||typeof w.BasairUniversalOTA.check!=='function')return null;
 busy=true;try{
  var s=await stateRead();if(!s||s.trial||!Number.isSafeInteger(s.highestSequence))return null;
  // check() independently verifies latest signed RSA and owner approval before returning.
  var c=await w.BasairUniversalOTA.check(),m=await manifestVerified(c.envelope);
  if(m.sequence!==s.highestSequence||!(await matches(s.active,m)))return null;
  var existing=await get(m.sequence);if(existing)return existing.sequence;
  // Store ONLY modules covered by this particular RSA-signed envelope.
  // A signed updates-only manifest cannot authorize restoration of an
  // unrelated, independently signed Tilawa module.
  var snapshot={};
  m.modules.forEach(function(mod){snapshot[mod.id]=s.active[mod.id]});
  var record={sequence:m.sequence,id:m.id,title:m.title||m.id,date:m.issuedAt||'',approved:false,
    envelope:c.envelope,active:snapshot,verifiedAt:new Date().toISOString()};
  await save(record);return m.sequence;
 }catch(_){return null}finally{busy=false;render()}
}
async function approve(sequence){
 var rec=await get(sequence),s=await stateRead();if(!rec||!s||s.trial||s.highestSequence!==sequence)throw Error('لا يمكن اعتماد إصدار غير نشط');
 var m=await manifestVerified(rec.envelope);if(m.sequence!==sequence||!(await matches(s.active,m))||!(await matches(rec.active,m)))throw Error('فشل التحقق من سلامة الإصدار');
 rec.approved=true;await save(rec);render();return true;
}
function hasArchiveRuntime(bundle){return !!(bundle&&Array.isArray(bundle.assets)&&bundle.assets.some(function(a){
 return (a.path==='modules/updates/p206-signed-six-rollback.js'||a.path==='modules/updates/p216-signed-six-rollback-v2.js')&&a.kind==='js';
}))}
/* A full rollback of "updates" would erase P206's own UI: later rollback steps and
 * forward restore would become impossible. Keep ONLY a verified, owner-approved,
 * P206-capable updates module pinned across older application-module snapshots. */
async function trustedUpdateRuntime(){
 var rows=await list();
 for(var i=0;i<rows.length;i++){
  var r=rows[i];if(!r.approved||!hasArchiveRuntime(r.active&&r.active.updates))continue;
  try{
   var m=await manifestVerified(r.envelope);
   if(m.sequence===r.sequence&&m.modules.some(function(mod){return mod.id==='updates'})&&await matches(r.active,m))return r.active.updates;
  }catch(_){}
 }
 return null;
}
async function restore(sequence){
 if(busy)throw Error('عملية أخرى قيد التنفيذ');
 busy=true;try{
  var rec=await get(sequence),s=await stateRead();
  if(!rec||!rec.approved||!s||s.trial)throw Error('الإصدار غير معتمد أو توجد عملية تحديث جارية');
  var m=await manifestVerified(rec.envelope);
  if(m.sequence!==rec.sequence||!(await matches(rec.active,m)))throw Error('فشل فحص توقيع الإصدار أو ملفاته');
  if(m.minAppVersion>695||m.sequence>s.highestSequence)throw Error('إصدار غير متوافق');
  var runtime=await trustedUpdateRuntime();
  if(!runtime)throw Error('الرجوع المتعدد غير آمن: يلزم اعتماد محرك تحديثات P206 موقّع ليظل متاحًا بعد الاستعادة');
  // Preserve unrelated current modules: only replay signed historical scope.
  var nextActive=Object.assign({},s.active);
  m.modules.forEach(function(mod){nextActive[mod.id]=rec.active[mod.id]});
  nextActive.updates=runtime;
  if(sameVersions(nextActive,s.active))return false;
  // P121's pending trial ensures a failed older version restores the current signed set.
  var next=Object.assign({},s,{active:nextActive,previous:s.active,
   trial:{status:'pending',seq:m.sequence},highestSequence:s.highestSequence});
  await stateSwap(s,next);return true;
 }finally{busy=false;render()}
}
function panel(){var e=d.getElementById('basairUniversalP121Dialog');return e&&e.querySelector('.bu-p121-panel')}
function elem(tag,label){var x=d.createElement(tag);if(label!=null)x.textContent=label;return x}
function displayStatus(root,msg){var note=elem('p',msg);note.style.margin='6px 0';root.appendChild(note)}
async function render(){
 var root=panel();if(!root)return;
 var el=d.getElementById('p206SignedArchivePanel');if(!el){
  el=elem('section');el.id='p206SignedArchivePanel';el.dir='rtl';el.style.cssText='margin:12px 0;padding:12px;border:1px solid #aec7bb;border-radius:12px;font:14px system-ui;line-height:1.7';
  root.appendChild(el);
 }
 el.replaceChildren();el.appendChild(elem('strong','الإصدارات المستقرة المحفوظة — آخر 6'));
 var refreshBtn=elem('button','فحص وحفظ الإصدار الموقّع الحالي');refreshBtn.type='button';refreshBtn.disabled=busy;
 refreshBtn.onclick=function(){capture().then(function(){render()})};el.appendChild(refreshBtn);
 try{
  var rows=await list();if(!rows.length){displayStatus(el,'لا توجد نسخ موقعة ومكتملة محفوظة بعد.');return}
  var s=await stateRead(),runtime=await trustedUpdateRuntime();
  var legacy=d.getElementById('p197RollbackPanel'),nativeBtn=d.getElementById('buP121Rollback');
  if(runtime){
   if(legacy)legacy.hidden=true;
   if(nativeBtn){if(!nativeBtn.dataset.p206HistoryAttached){legacyClick=nativeBtn.onclick;nativeBtn.dataset.p206HistoryAttached='1'}
    nativeBtn.textContent='الإصدارات السابقة';
    nativeBtn.onclick=function(e){if(e){e.preventDefault();e.stopPropagation()}if(el.scrollIntoView)el.scrollIntoView({block:'nearest'})};
   }
  }else{
   if(legacy)legacy.hidden=false;
   if(nativeBtn&&nativeBtn.dataset.p206HistoryAttached){nativeBtn.onclick=legacyClick;nativeBtn.textContent='الرجوع للإصدار السابق';delete nativeBtn.dataset.p206HistoryAttached}
   displayStatus(el,'الرجوع المتعدد غير مفعّل حتى يتوفر محرك P206 موقّع ومحفوظ؛ يمكنك متابعة قراءة سجل الإصدارات فقط.');
  }
  rows.forEach(function(r){
   var row=elem('div');row.style.cssText='padding:5px 0;border-bottom:1px solid #d8e4dd';
   var label=elem('span','تحديث '+r.sequence+' — '+String(r.title||r.id||'').slice(0,80)+(r.approved?' (مستقر معتمد)':' (بانتظار اعتماد المالك)'));
   row.appendChild(label);
   if(!r.approved&&s&&!s.trial&&s.highestSequence===r.sequence){
    var approveBtn=elem('button','اعتماد الإصدار المستقر');approveBtn.type='button';approveBtn.onclick=function(){approve(r.sequence).catch(function(e){displayStatus(el,e.message)})};row.appendChild(approveBtn);
   }
   if(r.approved){
    var b=elem('button',chosen===r.sequence?'تأكيد الرجوع وإعادة فتح التطبيق':'الرجوع إلى هذا الإصدار');
    b.type='button';b.disabled=busy||!runtime;b.onclick=function(){
     if(chosen!==r.sequence){chosen=r.sequence;render();return}
     restore(r.sequence).then(function(changed){chosen=null;if(changed)w.location.reload();else render()}).catch(function(e){chosen=null;displayStatus(el,e.message)});
    };row.appendChild(b);
   }
   el.appendChild(row);
  });
  displayStatus(el,'تُستعاد ملفات التحديث فقط؛ لا تُحذف الملاحظات أو المفضلة. يجب اختبار الإصدار على الهاتف قبل اعتماده مستقراً.');
 }catch(_){displayStatus(el,'تعذر قراءة الأرشيف؛ لم تتغير بيانات التطبيق.')}
}
function boot(){
 if(!d.body)return;
 // Archive only after P121's 10s trial-validation window.
 w.setTimeout(capture,13000);
 d.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('[data-basair-p121-button],#p197NavUpdates,#p197MoreUpdates'))w.setTimeout(render,60)},true);
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
w.__BASAIR_P206_SIGNED_ARCHIVE__={version:206,limit:LIMIT,capture:capture,list:list,approve:approve,restore:restore,verify:manifestVerified,matches:matches,hasArchiveRuntime:hasArchiveRuntime,refresh:render};
})(window,document);
