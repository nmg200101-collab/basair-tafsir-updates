/* BASAIR P135 — Tafsir-only, read-only Follow reciter + exact-ayah recording adapter.
 * Candidate: independent narrator choice, no modification of Tilawa selection.
 * The existing R109 Selected Recitations catalog uses whole-surah/clip MP3.
 * It is NOT by itself a certified single-ayah playback source.
 * This adapter NEVER updates R109/Tilawa state, users' selections or audio URLs.
 */
(function(w,d){
'use strict';
var API='__BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__';
if(w[API]&&w[API].version==='P136-RECITER-BRIDGE-V1')return;
var CATALOG='__BASAIR_TAFSIR_EXACT_AYAH_AUDIO_CATALOG__';
var stats={attempts:0,starts:0,completed:0,stops:0,rejected:0,errors:0};
var playing=null;
var previous=w[API];if(previous&&typeof previous.stop==='function')try{previous.stop()}catch(_){}
function clean(s){return String(s==null?'':s).trim()}
function finite(n){return Number.isInteger(Number(n))?Number(n):NaN}
function source(){var p=w[CATALOG];return p&&typeof p.getExact==='function'?p:null}
function reciters(){
 var p=source(),raw=p&&typeof p.list==='function'&&p.list();
 if(!Array.isArray(raw))return [];
 var seen=Object.create(null);
 return raw.filter(function(c){
  var id=clean(c&&c.id);
  if(!/^[a-z][a-z0-9_-]{1,40}$/.test(id)||seen[id]||!clean(c.name))return false;
  seen[id]=true;return true;
 }).map(function(c){return {id:clean(c.id),name:clean(c.name),source:'v170Reciter'}});
}
function selected(requestedId){
 var p=source(),id=clean(requestedId);
 if(id&&id!=='follow'){
  return reciters().filter(function(r){return r.id===id})[0]||null;
 }
 // Read-only view of the Follow selection: never write localStorage or DOM.
 if(!p||typeof p.selected!=='function')return null;
 var current=p.selected();if(!current)return null;
 return reciters().filter(function(r){return r.id===clean(current.id)})[0]||null;
}
function safeURL(src){
 if(typeof src!=='string')return '';
 try{
  var url=new URL(src);
  // Only canonical EveryAyah single-verse recordings, not whole-surah URLs.
  if(url.protocol==='https:'&&(url.hostname==='everyayah.com'||url.hostname==='www.everyayah.com')&&
     !url.username&&!url.password&&!url.port&&!url.search&&!url.hash&&
     /^\/data\/[a-zA-Z0-9_-]+\/[0-9]{6}\.mp3$/.test(url.pathname))return url.href;
 }catch(_){}
 return '';
}
function validate(record,request){
 if(!record||typeof record!=='object')return false;
 if(record.kind!=='single-ayah'||record.verified!==true)return false;
 if(finite(record.surah)!==request.surah||finite(record.ayah)!==request.ayah||
   clean(record.reciterId)!==request.reciterId)return false;
 if(!safeURL(record.url))return false;
 // A whole-surah track is NOT acceptable without audited verse boundary data.
 if(record.durationScope&&record.durationScope!=='single-ayah')return false;
 return true;
}
function availability(request){
 var s=selected(request&&request.reciterId),p=source();
 var result={selected:!!s,reciterId:s&&s.id||'',catalog:!!p,available:false,reason:''};
 if(!s){result.reason='لم يتم تحديد قارئ من التلاوات المختارة';return result}
 if(!p){result.reason='لا توجد مكتبة تسجيلات آيات منفردة موثقة لهذا القارئ';return result}
 var q={surah:finite(request&&request.surah),ayah:finite(request&&request.ayah),reciterId:clean(request&&request.reciterId)||s.id};
 if(!Number.isInteger(q.surah)||q.surah<1||q.surah>114||
   !Number.isInteger(q.ayah)||q.ayah<1||q.ayah>286||
   q.reciterId!==s.id){result.reason='الآية أو القارئ المختار غير مطابق';return result}
 try{
  var r=p.getExact(q);
  // Must be a *synchronous* trusted index, allowing audio.play() to run
  // inside the user's tap for Android WebView gesture authorization.
  if(r&&typeof r.then==='function'){result.reason='يتطلب مصدر التسجيل فهرسًا محليًا فوريًا';return result}
  if(!validate(r,q)){result.reason='المصدر لا يثبت تسجيل الآية منفردة';return result}
  result.available=true;return result;
 }catch(_){result.reason='تعذر قراءة فهرس تسجيلات الآيات';return result}
}
function playOne(request){
 stats.attempts++;
 var a=availability(request);
 if(!a.available){stats.rejected++;throw new Error(a.reason||'مصدر الآية غير جاهز')}
 var s=selected(request.reciterId),catalog=source();
 var q={surah:finite(request.surah),ayah:finite(request.ayah),reciterId:s.id};
 // Resolve again immediately to reject mid-tap reciter changes.
 var record=catalog.getExact(q);
 if(!validate(record,q)){stats.rejected++;throw new Error('مصدر الآية تغيّر أثناء التشغيل')}
 if(playing)playing.stop();
 var urls=[record.url].concat(Array.isArray(record.alternates)?record.alternates:[])
  .map(safeURL).filter(Boolean);
 if(!urls.length){stats.rejected++;throw new Error('لا توجد روابط صالحة لتسجيل الآية')}
 // Every alternate belongs to the SAME chosen reciter and ayah catalog.
 // No fallback to Alafasy, a whole-surah file, or synthetic Quran audio.
 var audio=d.createElement('audio'),done=false,doneResolve,doneReject;
 var ended=new Promise(function(resolve,reject){doneResolve=resolve;doneReject=reject});
 // Some browser runtimes reject the audio.play() promise asynchronously.
 // Bubble the error through "ended" so the TTS explanation never starts.
 function release(){audio.onended=null;audio.onerror=null;
  try{audio.pause();audio.removeAttribute('src');audio.load()}catch(_){}
 }
 function finish(ok,error){
  if(done)return;done=true;
  if(playing===handle)playing=null;
  release();
  if(ok){stats.completed++;doneResolve(true)}
  else if(error){stats.errors++;doneReject(error)}
  else doneResolve(false);
 }
 var handle={
  surah:q.surah,ayah:q.ayah,reciterId:q.reciterId,verified:true,ended:ended,
  stop:function(){stats.stops++;finish(false,null)}
 };
 audio.preload='auto';audio.playsInline=true;
 audio.onended=function(){finish(true)};
 playing=handle;stats.starts++;
 var nextURL=0,attemptID=0;
 function trySource(){
  if(done)return;
  if(nextURL>=urls.length){
   finish(false,new Error('تعذر تشغيل تسجيل الآية بصوت القارئ المحدد؛ تحقق من الاتصال'));
   return;
  }
  var run=++attemptID,url=urls[nextURL++];
  try{
   audio.pause();audio.src=url;audio.load();
   audio.onerror=function(){if(!done&&run===attemptID)trySource()};
   // First attempt is executed synchronously inside the user tap, retaining
   // audio gesture permission; fallback uses the same unlocked audio element.
   var promise=audio.play();
   if(promise&&typeof promise.catch==='function')
    promise.catch(function(){if(!done&&run===attemptID)trySource()});
  }catch(_){if(!done&&run===attemptID)trySource()}
 }
 trySource();return handle;
}
function stop(){if(playing)playing.stop()}
function diagnostics(){
 var s=selected(),p=source();
 return {version:'P135-VERIFIED-RECITER-READONLY-QA',
  selectionFound:!!s,selectedReciter:s?s.id:null,supportedReciters:reciters(),
  exactAyahCatalogAvailable:!!p,scope:p?'individually indexed ayah':'none',
  canInferAyahFromR109SurahMP3:false,
  stats:Object.assign({},stats)};
}
w[API]={selected:selected,list:reciters,availability:availability,playOne:playOne,stop:stop,
 diagnostics:diagnostics,version:'P136-RECITER-BRIDGE-V1'};
})(window,document);
