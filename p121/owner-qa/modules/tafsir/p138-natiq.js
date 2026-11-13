/* BASAIR P138 — compact single microphone and owner-controlled speech settings.
 * Staged only; do not publish without signed manifest and device testing. NEVER uses synthetic voice for Quran recitation.
 * Voice recording requires a verified read-only selected-reciter/one-ayah bridge.
 * Does not modify Tilawa engine, P120/R114, Quran text, signing, or navigation.
 */
(function(w,d){
'use strict';
var VERSION='P138-COMPACT-MICROPHONE-VOICE-QA', KEY='basair:tafsir:natiq:p132:prefs';
var previousNarrator=w.__BASAIR_TAFSIR_NATIQ_P132__||null;
if(previousNarrator&&previousNarrator.version===VERSION)return;
var takeover=!!previousNarrator;
if(takeover&&typeof previousNarrator.stop==='function'){
 try{previousNarrator.stop('',true)}catch(_){}
}
var opts={mode:'both',sections:'all',rate:0.9,autoNext:false,preferLocal:true,voiceURI:'',reciterId:'follow',religiousGuide:false,voiceSource:'local'};
var active=null,token=0,mountTimer=0,observer=null,viewObserver=null,longTimer=0,longPressUntil=0,press=null;
var lastDrawnButton=null,lastLiveLabel=null,lastTappedButton=null;
var nativeReq=0,nativePending=Object.create(null);
var stats={starts:0,stops:0,spokenChunks:0,skippedSymbols:0,sourceUnavailable:0,staleCancelled:0,errors:0,nativeStarts:0,nativeErrors:0,nativeNoStart:0,nativeRetries:0,browserFallbacks:0,nextTransitions:0};
function E(id){return d.getElementById(id)}
function tafsirOpen(){var x=E('tafsirReader');return !!(x&&x.classList.contains('active'))}
function q(s){return String(s==null?'':s)}
function clamp(n,min,max,defaultValue){n=Number(n);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):defaultValue}
function toast(msg){
 var b=lastTappedButton,row=b&&b.isConnected&&b.closest('.v194T2Ayah');
 var live=row&&row.querySelector('.p138MicLive');
 if(live){live.hidden=false;live.textContent=q(msg);live.setAttribute('role','status')}
 var panelStatus=E('p138NatiqStatus');if(panelStatus)panelStatus.textContent=q(msg);
 try{var c=w.__BASAIR_TAFSIR_CORE__;if(c&&typeof c.toast==='function')c.toast(msg);else if(typeof w.toast==='function')w.toast(msg)}catch(_){}
}
function normalize(raw){
 var x=q(raw);
 x=x.replace(/\uFDFA/g,' صلى الله عليه وسلم ').replace(/\uFDFB/g,' جل جلاله ');
 x=x.replace(/\uFDFD/g,' بسم الله الرحمن الرحيم ').replace(/\uFDF2/g,' الله ');
 x=x.replace(/[\u06DD\u06DE\u06E9\u06E6\u06E7\u06E8\u06E5\u06E0\u06D6-\u06DC\uFDFE\uFD3E\uFD3F]/g,' ');
 x=x.replace(/[﴿﴾۞۩۝«»]/g,' ').replace(/\u0640/g,'');
 x=x.replace(/[\u200B-\u200F\uFEFF]/g,' ').replace(/[ \t]+/g,' ');
 x=x.replace(/\s*([،؛:،؟.!?])\s*/g,'$1 ');
 x=x.replace(/\?/g,'؟').replace(/!/g,'.').replace(/;/g,'؛').replace(/:/g,'،');
 x=x.replace(/[ \t]*\n[ \t]*/g,'\n').replace(/\n{3,}/g,'\n\n');
 return x.trim();
}
function ineligible(el){
 if(!el||el.nodeType!==1)return false;
 if(/^(SCRIPT|STYLE|NOSCRIPT|BUTTON|INPUT|SELECT|TEXTAREA|AUDIO|VIDEO|SVG|CANVAS|NAV|FOOTER)$/i.test(el.tagName||''))return true;
 var cls=String(el.className||'');
 if(/(^|\s)(v194T2Qrow|basairB231AyahActions|b118CarryArticle|p124ExportDialog|p132NatiqBar|p132NatiqLive|p132NatiqButton|p138MicLive|p137NatiqButton|p137NatiqSettings|p137NatiqNext|p138NatiqPanel|p138NatiqStatus|v194T5Sentinel)(\s|$)/.test(cls))return true;
 // Placeholder text is not exegesis; do not pretend it is a valid tafsir.
 if(/(^|\s)v194T2Field(\s|$)/.test(cls)&&/(^|\s)pending(\s|$)/.test(cls))return true;
 if(el.hasAttribute('hidden')||el.getAttribute('aria-hidden')==='true')return true;
 return false;
}
function heading(el){
 if(!el||el.nodeType!==1)return false;
 if(/^H[1-6]$/.test(el.tagName||''))return true;
 return el.matches&&el.matches('[data-tafsir-section-title],.v194T2SectionTitle,.v194T2Heading,.tafsirSectionTitle,.v194T2FieldTitle');
}
function headingText(node){
 if(node.matches&&node.matches('.v194T2FieldTitle')){
  // V690/P117 renders <b>section title</b><small>source metadata</small>;
  // speak the section heading, not its small attribution on every paragraph.
  var label=node.querySelector&&node.querySelector('b');
  if(label)return label.textContent||'';
 }
 return node.textContent||'';
}
function segments(row){
 if(!row||!row.querySelector)return [];
 // This is the actual rendered Tafsir body. NEVER fall back to entire verse
 // article: otherwise Quran text and toolbar labels would be spoken as Tafsir.
 var root=row.querySelector('.v194T2Body')||row.querySelector('[data-tafsir-content]');
 if(!root)return [];
 // 'التفسير المحرر' is an external source card in the original renderer,
 // not the content of the tafsir. Never read that introduction as full tafsir.
 if(/(^|\s)v194T108Muharrar(\s|$)/.test(String(row.className||'')))return [];
 if(row.querySelector('.v194T108OfficialOpen'))return [];
 var out=[],parts=[],title='';
 function flush(){
  var body=normalize(parts.join(''));parts=[];
  if(body||normalize(title))out.push({title:normalize(title),text:body});
  title='';
 }
 function walk(node){
  if(!node)return;
  if(node.nodeType===3){parts.push(node.nodeValue||'');return}
  if(node.nodeType!==1||ineligible(node))return;
  if(heading(node)){
   flush();title=headingText(node);return;
  }
  var tag=String(node.tagName||'').toUpperCase();
  if(tag==='BR'){parts.push('\n');return}
  var block=/^(P|DIV|SECTION|ARTICLE|LI|UL|OL|BLOCKQUOTE|DD|DT|TABLE|TR|TD)$/i.test(tag);
  if(block&&parts.length)parts.push('\n');
  for(var child=node.firstChild;child;child=child.nextSibling)walk(child);
  if(block)parts.push('\n');
 }
 walk(root);flush();
 return out;
}
function splitSpeech(text,max){
 // Short punctuation-aware prose clauses only; Quran stays recorded MP3.
 max=clamp(max,85,165,145);
 var val=normalize(text).replace(/\s*\n+\s*/g,'، ').replace(/\s+/g,' ').trim();
 if(!val)return [];
 var words=val.split(/\s+/),out=[],part='';
 for(var i=0;i<words.length;i++){
  var word=words[i];
  if(part&&part.length+1+word.length>max){out.push(part);part=''}
  part+=(part?' ':'')+word;
  if(part.length>=35&&/[.؟!؛]$/.test(word)){out.push(part);part=''}
  else if(part.length>=75&&/[،]$/.test(word)){out.push(part);part=''}
 }
 if(part)out.push(part);
 return out;
}
// P136 optional, narrowly scoped spoken-text substitutions. NEVER used for
// Quran recordings, displayed Tafsir, search text or author/editor content.
// Do not attach case endings: the grammatical reading depends on context.
var RELIGIOUS_READING={
 'الله':'اللّٰه',
 'القرآن':'الْقُرْآن',
 'الرحمن':'الرَّحْمَٰن',
 'الرحيم':'الرَّحِيم',
 'الإيمان':'الْإِيمَان',
 'الصلاة':'الصَّلَاة',
 'الزكاة':'الزَّكَاة',
 'التقوى':'التَّقْوَى',
 'الآخرة':'الْآخِرَة',
 'العبادة':'الْعِبَادَة',
 'الملائكة':'الْمَلَائِكَة',
 'النبوة':'النُّبُوَّة'
};
function prepareSpeech(source,forceGuide){
 var raw=q(source);
 if(forceGuide===false||(forceGuide===undefined&&!opts.religiousGuide))return raw;
 // Whole, unvowelled words only. Avoid changing mixed/vowelled Arabic terms,
 // suffixes, place names and homographs for which fixed tashkeel is unsafe.
 return raw.replace(/(^|[^\u0621-\u064A\u064B-\u065F\u0670\u0671-\u06D3])([وفب]?)(الله|القرآن|الرحمن|الرحيم|الإيمان|الصلاة|الزكاة|التقوى|الآخرة|العبادة|الملائكة|النبوة)(?=$|[^\u0621-\u064A\u064B-\u065F\u0670\u0671-\u06D3])/g,
  function(full,boundary,prefix,term){
   var p=prefix?({و:'وَ',ف:'فَ',ب:'بِ'}[prefix]||prefix):'';
   return boundary+p+(RELIGIOUS_READING[term]||term);
  });
}
function sayHeading(title){
 title=normalize(title);if(!title)return '';
 if(/لمس[ةه]\s+بياني[ةه]|اللمس[ةه]\s+البياني[ةه]/.test(title))return 'والآن، اللمسة البيانية.';
 if(/تدب[رّ]|لطائف التدبر/.test(title))return 'ومن لطائف التدبر في الآية.';
 if(/فوائد|تطبيقات|العمل بالآية/.test(title))return 'ومن الفوائد العملية.';
 if(/الخلاص[ةه]|خلاصة المعنى/.test(title))return 'وخلاصة المعنى.';
 if(/^المعنى$|معنى الآية/.test(title))return 'نبدأ الآن ببيان معنى الآية.';
 if(/البيان|الشرح/.test(title))return 'ننتقل إلى البيان والشرح.';
 return title;
}
function getState(){try{var t=w.__BASAIR_TAFSIR_STEP2__;return t&&typeof t.state==='function'?t.state():null}catch(_){return null}}
function record(row){
 var st=getState()||{},bar=row&&row.querySelector&&row.querySelector('.basairB231AyahActions');
 var a=Number(row&&row.getAttribute('data-t2ayah')||row&&row.getAttribute('data-t5-a')||bar&&bar.getAttribute('data-a')||st.a);
 var s=Number(row&&row.getAttribute('data-t5-s')||bar&&bar.getAttribute('data-s')||st.s);
 var type=q(row&&row.getAttribute('data-t5-type')||bar&&bar.getAttribute('data-type')||st.type||'basair');
 return {s:s,a:a,type:type};
}
function valid(x){return !!(x&&Number.isInteger(x.s)&&x.s>=1&&x.s<=114&&Number.isInteger(x.a)&&x.a>=1&&x.a<=286&&x.type)}
function visibleRow(){
 var host=E('tafsirAyahs');if(!host)return null;
 var rows=host.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
 var line=Math.min((w.innerHeight||700)-100,Math.max(135,(w.innerHeight||700)*.52)),best=null,dist=Infinity;
 for(var i=0;i<rows.length;i++){
  var r=rows[i].getBoundingClientRect();if(r.height<=0)continue;
  var dd=r.top<=line&&r.bottom>=line?0:Math.min(Math.abs(r.top-line),Math.abs(r.bottom-line));
  if(dd<dist){best=rows[i];dist=dd}
 }
 return best;
}
function loadOpts(){
 try{var o=JSON.parse(w.localStorage.getItem(KEY)||'{}');
  if(['both','recitation','tafsir'].indexOf(o.mode)>=0)opts.mode=o.mode;
  if(['all','explanation','reflection','summary'].indexOf(o.sections)>=0)opts.sections=o.sections;
  if(o.rate!==undefined)opts.rate=clamp(o.rate,.7,1.3,.9);opts.autoNext=o.autoNext===true;opts.preferLocal=o.preferLocal!==false;
  opts.reciterId=typeof o.reciterId==='string'&&/^(follow|[a-z][a-z0-9_-]{1,40})$/.test(o.reciterId)?o.reciterId:'follow';
  opts.religiousGuide=o.p138ReligiousGuide===true;
  opts.voiceSource='local'; // no trusted server adapter is connected
  opts.voiceURI=typeof o.voiceURI==='string'?o.voiceURI.slice(0,160):'';
 }catch(_){}
}
function saveOpts(){try{w.localStorage.setItem(KEY,JSON.stringify(Object.assign({},opts,{p138ReligiousGuide:opts.religiousGuide})))}catch(_){}}
function nativeBridge(){var b=w.BasairNativeArabicTts;return b&&typeof b.capabilities==='function'&&typeof b.speak==='function'?b:null}
function nativeStatus(){
 var n=nativeBridge();if(!n)return {ready:false,reason:'NATIVE_TTS_BRIDGE_NOT_INSTALLED',voices:[]};
 try{var v=JSON.parse(n.capabilities());return v&&v.ready===true?v:Object.assign({ready:false,voices:[]},v||{})}
 catch(_){return {ready:false,reason:'NATIVE_TTS_CAPABILITIES_ERROR',voices:[]}}
}
function voices(){
 var list=[],n=nativeStatus();
 if(n.ready&&Array.isArray(n.voices)){
  list=list.concat(n.voices.filter(function(v){return v&&/^ar(?:-|$)/i.test(v.lang||'')&&v.localService===true}).map(function(v){
   return {name:v.name,lang:v.lang,localService:true,voiceURI:'native:'+v.name,_basairNative:true};
  }));
 }
 var synth=w.speechSynthesis;
 if(synth&&typeof synth.getVoices==='function'){
  try{list=list.concat(synth.getVoices().filter(function(v){return /^ar(?:-|$)/i.test(v.lang||'')}))}catch(_){}
 }
 return list;
}
function eligibleVoices(){var vs=voices();return opts.preferLocal?vs.filter(function(v){return v.localService}):vs}
function voice(){
 var list=eligibleVoices(),wanted=opts.voiceURI;
 if(wanted){var found=list.filter(function(v){return (v.voiceURI||v.name)===wanted})[0];if(found)return found}
 return list[0]||null;
}
function ttsReady(){var v=voice();return !!(v&&(v._basairNative?nativeStatus().ready:(w.speechSynthesis&&typeof w.SpeechSynthesisUtterance==='function')))}
function bridge(){
 // Only a dedicated, audited one-ayah adapter is acceptable. The ordinary
 // Tilawa audio element is page/surah audio, not a proven one-ayah track.
 var b=w.__BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__;
 return b&&typeof b.selected==='function'&&typeof b.playOne==='function'?b:null;
}
function stage(label){if(!active)return;active.stage=label;drawStatus(label)}
function drawStatus(value){
 var el=E('p138NatiqStatus');if(el)el.textContent=value||'';
 // P132.1 performance: touch only the active/previous button, not every
 // rendered verse on every TTS chunk.
 var current=active&&active.row&&active.row.querySelector('.p137NatiqButton');
 if(lastDrawnButton&&lastDrawnButton!==current){
  lastDrawnButton.classList.remove('p132-on');
  lastDrawnButton.setAttribute('aria-pressed','false');
  var oldText=lastDrawnButton.querySelector('b');if(oldText)oldText.textContent='الناطق';
 }
 if(lastLiveLabel&&(!active||lastLiveLabel!==active.row.querySelector('.p138MicLive'))){
  lastLiveLabel.textContent='';lastLiveLabel.hidden=true;lastLiveLabel=null;
 }
 lastDrawnButton=current||null;
 if(current){
  current.setAttribute('aria-pressed','true');current.classList.add('p132-on');
  var title=current.querySelector('b');if(title)title.textContent='إيقاف الناطق';
  var live=active.row.querySelector('.p138MicLive');
  if(live){live.hidden=false;if(live.textContent!==value)live.textContent=value||'';lastLiveLabel=live}
 }
}
function stop(reason,quiet){
 token++;
 var n=nativeBridge();if(n&&typeof n.stop==='function'){try{n.stop()}catch(_){}}
 Object.keys(nativePending).forEach(function(id){var finish=nativePending[id];delete nativePending[id];finish(false)});

 var old=active;active=null;
 if(old&&old.audioSession&&typeof old.audioSession.stop==='function'){
  try{old.audioSession.stop()}catch(_){}
 }
 if(w.speechSynthesis&&typeof w.speechSynthesis.cancel==='function'){
  try{w.speechSynthesis.cancel()}catch(_){}
 }
 if(old)stats.stops++;
 if(!quiet)drawStatus(reason||'تم إيقاف الناطق');
 else drawStatus('');
}
function filterSections(all){
 if(opts.sections==='all')return all;
 var re=opts.sections==='summary'?/خلاص[ةه]|ملخ[صّ]/
   :opts.sections==='reflection'?/تدبر|فوائد|تطبيقات|لطائف/
   :/الشرح|البيان|المعنى|تفسير/;
 return all.filter(function(x){return re.test(x.title||'')});
}
// Native JS transport acknowledges requests immediately, not audio playback.
// Android P133 emits start/end/error/cancel asynchronously. Enforce an explicit
// start acknowledgement and bounded end deadline; never wait 60s silently.
var lastNativeIssue='';
function readNativeChunk(s,content,isHeading,v,plain){
 return new Promise(function(resolve,reject){
  if(token!==s.token||!active){resolve(false);return}
  var n=nativeBridge(),id='p137_'+(++nativeReq);
  if(!n||!nativeStatus().ready){reject(new Error('محرك النطق المحلي غير جاهز'));return}
  var done=false,started=false,ackTimer=0,watchdog=0;
  function finish(ok,error){
   if(done)return;
   done=true;clearTimeout(ackTimer);clearTimeout(watchdog);
   delete nativePending[id];
   if(error){lastNativeIssue=q(error.message);reject(error)}
   else resolve(ok);
  }
  nativePending[id]=function(ok,error,event){
   if(done)return;
   if(event==='start'){
    started=true;clearTimeout(ackTimer);stats.nativeStarts++;return;
   }
   finish(ok,error);
  };
  ackTimer=setTimeout(function(){
   if(!done&&!started){
    stats.nativeNoStart++;
    finish(false,new Error('لم يبدأ محرك Android نطق العبارة خلال المهلة؛ قد يكون الاتصال بالجسر الصوتي متوقفًا'));
   }
  },9500);
  watchdog=setTimeout(function(){
   if(!done)finish(false,new Error('تأخر محرك Android في إكمال العبارة الصوتية'));
  },Math.min(45000,Math.max(25000,content.length*250)));
  try{
   var text=plain?content:prepareSpeech(content);
   var accepted=n.speak(id,text,isHeading?Math.max(.7,opts.rate-.08):opts.rate,v.name);
   if(!accepted)finish(false,new Error('رفض الجسر الصوتي بدء العبارة'));
  }catch(e){finish(false,new Error('تعذر إرسال العبارة إلى محرك Android'))}
 });
}
w.__BASAIR_P133_NATIVE_TTS_EVENT__=function(id,event){
 var cb=nativePending[id];if(!cb)return;
 if(event==='start')cb(null,null,'start');
 else if(event==='end')cb(true);
 else if(event==='cancel')cb(false,new Error('أوقف Android العبارة الصوتية قبل اكتمالها'));
 else if(event==='error')cb(false,new Error('رفض محرك Android نطق العبارة الحالية'));
};
function readBrowserChunk(s,content,isHeading,v,plain){
 return new Promise(function(resolve,reject){
  if(token!==s.token||!active){resolve(false);return}
  var synth=w.speechSynthesis;
  if(!synth||typeof w.SpeechSynthesisUtterance!=='function'){
   reject(new Error('لا يوجد محرك Web Speech عربي بديل على الهاتف'));return;
  }
  var u=new w.SpeechSynthesisUtterance(plain?content:prepareSpeech(content));
  u.lang=v.lang||'ar-SA';u.voice=v;u.rate=isHeading?Math.max(.7,opts.rate-.08):opts.rate;
  u.pitch=1;u.volume=1;var done=false,watchdog=0;
  function finish(ok,error){
   if(done)return;done=true;clearTimeout(watchdog);
   u.onend=null;u.onerror=null;if(error)reject(error);else resolve(ok);
  }
  u.onend=function(){finish(true)};
  u.onerror=function(){
   if(token!==s.token){finish(false);return}
   finish(false,new Error('فشل محرك Web Speech في نطق العبارة'));
  };
  watchdog=setTimeout(function(){
   finish(false,new Error('لم يكتمل نطق Web Speech ضمن المهلة'));
  },45000);
  try{synth.speak(u)}catch(e){finish(false,new Error('تعذر بدء Web Speech'))}
 });
}
async function readChunk(s,content,isHeading){
 if(token!==s.token||!active)return false;
 var v=voice();
 if(!v)throw new Error('لا يتوفر صوت عربي، افتح الإعدادات واختر صوتًا متاحًا');
 if(!v._basairNative)return readBrowserChunk(s,content,isHeading,v,false);
 try{return await readNativeChunk(s,content,isHeading,v,false)}
 catch(firstError){
  if(token!==s.token||!active)return false;
  stats.nativeErrors++;
  // The vocalized form can break some phone TTS engines. Retry once with
  // original undecorated Tafsir text, then try a locally available browser
  // Arabic voice (never synthesize Quran recordings).
  var n=nativeBridge();
  if(n&&typeof n.stop==='function')try{n.stop()}catch(_){}
  if(!await sectionPause(s,260))return false;
  stats.nativeRetries++;
  try{return await readNativeChunk(s,content,isHeading,v,true)}
  catch(secondError){
   if(token!==s.token||!active)return false;
   stats.nativeErrors++;
   var available=eligibleVoices().filter(function(item){
    return !item._basairNative&&/^ar(?:-|$)/i.test(item.lang||'');
   });
   if(available.length){
    stats.browserFallbacks++;
    try{return await readBrowserChunk(s,content,isHeading,available[0],true)}
    catch(browserError){lastNativeIssue=q(browserError.message)}
   }
   throw new Error('تعذر استمرار صوت التفسير. '+q(lastNativeIssue||secondError.message)+'. جرّب صوتًا عربيًا آخر من إعدادات الناطق.');
  }
 }
}
function sectionPause(s,ms){return new Promise(function(resolve){
  setTimeout(function(){resolve(token===s.token&&!!active)},ms);
 });
}
async function readTafsir(s){
 if(!ttsReady())throw new Error('WebView لا يوفر صوتًا عربيًا قابلًا للتشغيل؛ يحتاج التطبيق جسر Android TextToSpeech أصليًا');
 var ss=filterSections(segments(s.row));
 if(!ss.length)throw new Error('لم يُعثر على نص التفسير المعروض للقسم المحدد');
 for(var i=0;i<ss.length;i++){
  if(token!==s.token)return false;
  var item=ss[i],all=[];
  var h=sayHeading(item.title);
  if(h)all.push(h);
  all=all.concat(splitSpeech(item.text,96));
  for(var j=0;j<all.length;j++){
   if(token!==s.token)return false;
   stage('قراءة التفسير: '+(item.title||'المعنى')+' • '+(i+1)+'/'+ss.length);
   var isHeading=!!(h&&j===0),ok=await readChunk(s,all[j],isHeading);if(!ok)return false;
   stats.spokenChunks++;
   if(j<all.length-1){
    var pause=isHeading?300:/[.؟!؛]$/.test(all[j])?240:90;
    if(!await sectionPause(s,pause))return false;
   }
  }
  if(i<ss.length-1&&!(await sectionPause(s,420)))return false;
 }
 return true;
}
async function readQuran(s){
 var b=bridge();
 if(!b){stats.sourceUnavailable++;throw new Error('لم يكتمل ربط تسجيل الآية بصوت القارئ المحدد؛ اختر وضع التفسير فقط')}
 var selected=s.reciter;
 if(!selected||!selected.id)throw new Error('لم يتم اختيار قارئ للآية في إعدادات الناطق');
 stage('تلاوة الآية بصوت '+q(selected.name||'القارئ المختار'));
 var handle=await b.playOne({surah:s.verse.s,ayah:s.verse.a,reciterId:selected.id});
 if(token!==s.token){if(handle&&handle.stop)handle.stop();return false}
 if(!handle||Number(handle.surah)!==s.verse.s||Number(handle.ayah)!==s.verse.a||
     q(handle.reciterId)!==q(selected.id)||handle.verified!==true||
     !handle.ended||typeof handle.ended.then!=='function'||typeof handle.stop!=='function'){
  if(handle&&typeof handle.stop==='function')handle.stop();
  throw new Error('مصدر التلاوة لم يؤكد مطابقة القارئ والآية');
 }
 s.audioSession=handle;
 try{await handle.ended}finally{s.audioSession=null}
 return token===s.token;
}
function nextVerse(v){
 var core=w.__BASAIR_TAFSIR_CORE__,quran=core&&core.q;
 if(!Array.isArray(quran)||!quran[v.s-1])return null;
 var cur=quran[v.s-1],count=Number(cur.count||cur.ayahs&&cur.ayahs.length);
 if(!Number.isInteger(count)||count<1)return null;
 if(v.a<count)return {s:v.s,a:v.a+1,type:v.type};
 if(v.s<quran.length)return {s:v.s+1,a:1,type:v.type};
 return null;
}
function readyNext(target,s){
 return new Promise(function(resolve,reject){
  var step=w.__BASAIR_TAFSIR_STEP2__,host=E('tafsirAyahs');
  if(!step||typeof step.open!=='function'||!host){reject(new Error('انتقال الآية غير جاهز'));return}
  var finished=false,obs=null,limit=0;
  function finish(row,error){if(finished)return;finished=true;if(obs)obs.disconnect();w.clearTimeout(limit);if(error)reject(error);else resolve(row)}
  function inspect(){
   if(token!==s.token){finish(null,new Error('cancelled'));return}
   var st=getState();if(!st||Number(st.s)!==target.s||Number(st.a)!==target.a||q(st.type)!==target.type)return;
   var row=host.querySelector('.v194T2Ayah:not(.b118CarryArticle):not(.v194T5Generated)');
   if(row&&row.isConnected&&Number(row.getAttribute('data-t2ayah'))===target.a&&segments(row).length)finish(row);
  }
  if(w.MutationObserver){obs=new w.MutationObserver(inspect);obs.observe(host,{childList:true,subtree:true})}
  limit=w.setTimeout(function(){finish(null,new Error('انتهت مهلة تحميل الآية التالية'))},8000);
  try{step.open(target.s,target.a,target.type);inspect()}catch(e){finish(null,e)}
 });
}
async function sequence(s){
 try{
  while(token===s.token){
   if(!tafsirOpen()||!s.row.isConnected)throw new Error('تم إغلاق التفسير أو تغيير الآية');
   if(s.mode==='both'||s.mode==='recitation'){
    try{
     var heard=await readQuran(s);if(!heard)return;
    }catch(ayahError){
     if(token!==s.token||!active)return;
     if(s.mode==='recitation')throw ayahError;
     // A failed network recording must not silence otherwise working Tafsir.
     stats.sourceUnavailable++;
     toast('تعذر تشغيل تسجيل الآية لهذا القارئ؛ سنُكمل نطق التفسير فقط. يمكنك تجربة قارئ آخر.');
    }
    if(s.mode==='both'&&!(await sectionPause(s,420)))return;
   }
   if(s.mode==='both'||s.mode==='tafsir'){
    var spoken=await readTafsir(s);if(!spoken)return;
   }
   if(!opts.autoNext){stop('اكتملت قراءة الآية');return}
   var next=nextVerse(s.verse);
   if(!next){stop('اكتملت القراءة حتى نهاية السورة أو المصحف');return}
   stage('الانتقال إلى الآية التالية');
   // Page replacement during automatic Next is expected, not a stale
   // manual navigation; do not let the Tafsir MutationObserver stop us.
   s.transitioning=true;
   try{
    var nextRow=await readyNext(next,s);
    if(token!==s.token)return;
    s.row=nextRow;s.verse=next;stats.nextTransitions++;
   }finally{s.transitioning=false}
  }
 }catch(e){
  if(token===s.token){stats.errors++;stop(q(e&&e.message||'تعذر تشغيل الناطق'));toast(q(e&&e.message||'تعذر تشغيل الناطق'))}
 }
}
function conflictingTilawaAudio(){
 var a=E('tilawaAudio');
 if(a&&!a.paused&&(a.currentSrc||a.src))return true;
 var r=w.__BASAIR_R109_SELECTED__,st=r&&r._test&&r._test.state||null;
 var other=st&&st.audio;
 return !!(other&&other!==a&&!other.paused&&(other.currentSrc||other.src));
}
function start(row){
 if(conflictingTilawaAudio()){
  toast('أوقف صوت التلاوة الجاري أولًا، ثم شغّل الناطق لمنع تداخل الصوتين');
  return false;
 }
 if(!tafsirOpen()){toast('افتح التفسير أولًا');return false}
 row=row||visibleRow();var v=record(row);
 if(!row||!valid(v)){toast('اختر آية صحيحة أولًا');return false}
 var follow=w.__BASAIR_TAFSIR_R114__;
 if(follow&&follow.status&&follow.status().running){
  var guard=w.__BASAIR_TAFSIR_P130__;
  if(!guard||typeof guard.stop!=='function'){toast('أوقف متابعة الآيات أولًا');return false}
  guard.stop();if(follow.status().running){toast('أوقف متابعة الآيات أولًا');return false}
 }
 var mode=opts.mode,selectedReciter=null;
 if(mode==='both'||mode==='recitation'){
  var reciter=bridge(),canRecite=false,reason='';
  selectedReciter=reciter&&typeof reciter.selected==='function'?reciter.selected(opts.reciterId):null;
  if(reciter&&selectedReciter&&typeof reciter.availability==='function'){
   var av;try{av=reciter.availability({surah:v.s,ayah:v.a,reciterId:selectedReciter.id})}catch(_){av=null}
   canRecite=!!(av&&av.available);reason=av&&av.reason||'';
  }else{reason='القارئ غير متاح في فهرس الآيات المنفردة'}
  if(!canRecite){
   stats.sourceUnavailable++;
   if(mode==='recitation'){
    toast(reason||'لا يتوفر تسجيل مستقل لهذه الآية؛ اختر قارئًا آخر');return false;
   }
   selectedReciter=null;mode='tafsir';
   toast('تسجيل هذه الآية غير متاح لهذا القارئ؛ سيُقرأ التفسير فقط، دون توليد صوت اصطناعي للقرآن');
  }
 }
 if((mode==='both'||mode==='tafsir')&&!ttsReady()){
  toast('محرك الصوت العربي غير متاح في WebView؛ افتح إعدادات الناطق لتجربة الصوت. قد يتطلب الأمر تحديثًا أصليًا للتطبيق');return false;
 }
 if((mode==='both'||mode==='tafsir')&&!filterSections(segments(row)).length){
  var external=/(^|\s)v194T108Muharrar(\s|$)/.test(String(row.className||''))||
    !!row.querySelector('.v194T108OfficialOpen');
  toast(external?'هذه الصفحة تحتوي رابطًا رسميًا فقط ولا تعرض نص التفسير للنطق':'لم يكتمل تحميل التفسير؛ اختر مصدرًا محمّلًا');return false;
 }
 stop('',true);
 var s={token:token,verse:v,row:row,audioSession:null,stage:'start',mode:mode,reciter:selectedReciter,transitioning:false};
 active=s;stats.starts++;stage('جارٍ تجهيز الناطق');
 sequence(s);return true;
}
function syncNextButtons(){
 var host=E('tafsirAyahs');if(!host||!host.querySelectorAll)return;
 var buttons=host.querySelectorAll('.p137NatiqNext');
 for(var i=0;i<buttons.length;i++){
  var btn=buttons[i];btn.setAttribute('aria-pressed',opts.autoNext?'true':'false');
  btn.textContent=opts.autoNext?'التالي: مفعّل':'التالي: متوقف';
 }
}
function control(row){
 // Keep old nodes in place so P132/P137 MutationObservers do not recreate
 // them. Make old controls inert and invisible instead of touching Tilawa.
 var prior=row.querySelectorAll('.p132NatiqButton,.p132NatiqLive,.p137NatiqButton,.p137NatiqSettings,.p137NatiqNext,.p138MicLive');
 for(var i=0;i<prior.length;i++){
  var old=prior[i];if(old.classList&&old.classList.contains('p138MicLive'))continue;
  old.hidden=true;old.setAttribute('aria-hidden','true');
  if(old.tagName==='BUTTON'){old.disabled=true;old.tabIndex=-1}
 }
 if(row.querySelector('.p138MicButton'))return;
 var btn=d.createElement('button');btn.type='button';btn.className='p138MicButton';
 btn.setAttribute('aria-label','الناطق: نقرة للتشغيل أو الإيقاف، الضغط المطول للإعدادات');
 btn.setAttribute('aria-haspopup','dialog');
 btn.setAttribute('title','الناطق: اضغط مطولًا للإعدادات');
 btn.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"></path></svg>';
 var live=d.createElement('small');live.className='p138MicLive';live.hidden=true;
 live.setAttribute('role','status');
 var anchor=row.querySelector('.b263r3NoteChip,[data-r3-note-pos],.p124FollowAboveTools')||
 row.querySelector('.p137NatiqButton,.p132NatiqButton');
 if(anchor&&anchor.parentElement){
  anchor.insertAdjacentElement('afterend',btn);
  btn.insertAdjacentElement('afterend',live);
 }else{
  var head=row.querySelector('.v194T2Body');if(!head||!head.parentElement)return;
  var bar=d.createElement('span');bar.className='p138MicBar';
  bar.appendChild(btn);bar.appendChild(live);head.parentElement.insertBefore(bar,head);
 }
}
function attach(){
 if(!tafsirOpen())return;
 var host=E('tafsirAyahs');if(!host)return;
 var rows=host.querySelectorAll('.v194T2Ayah:not(.b118CarryArticle)');
 for(var i=0;i<rows.length;i++)control(rows[i]);
}
function mountSoon(){if(mountTimer)return;mountTimer=w.setTimeout(function(){mountTimer=0;attach()},95)}
function panel(){
 var box=E('p138NatiqPanel');
 // P134 settings were already inserted in the DOM before the signed P135
 // module ran. Never reuse a panel missing the reciter selector.
 if(box&&!box.querySelector('[data-p132-option="reciterId"]')){
  if(box.parentNode&&typeof box.parentNode.removeChild==='function')box.parentNode.removeChild(box);
  else if(typeof box.remove==='function')box.remove();
  box=E('p138NatiqPanel');
 }
 if(box&&box.getAttribute&&box.getAttribute('data-basair-natiq-revision')===VERSION)return box;
 if(box&&typeof box.remove==='function')box.remove();
 else if(box&&box.parentNode)box.parentNode.removeChild(box);
 box=d.createElement('div');box.id='p138NatiqPanel';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('data-basair-natiq-revision',VERSION);
 box.setAttribute('aria-label','إعدادات الناطق');box.dir='rtl';
 box.innerHTML='<div class="p132Sheet"><header><strong>الناطق التفسيري</strong><button type="button" data-p132-close="1" aria-label="إغلاق">×</button></header>'+
 '<label>نمط التشغيل<select data-p132-option="mode"><option value="both">الآية ثم التفسير</option><option value="tafsir">التفسير فقط</option><option value="recitation">تلاوة الآية فقط</option></select></label>'+
 '<label>قارئ الآية<select data-p132-option="reciterId" aria-label="اختيار قارئ تلاوة الآية"></select></label>'+
 '<label>أقسام التفسير<select data-p132-option="sections"><option value="all">جميع أقسام التفسير</option><option value="explanation">البيان والشرح</option><option value="reflection">التدبر والفوائد</option><option value="summary">الخلاصة</option></select></label>'+
 '<label>سرعة النطق<select data-p132-option="rate"><option value="0.78">بطيء جدًا</option><option value="0.9">واضح وهادئ</option><option value="0.95">هادئ</option><option value="1">طبيعي</option><option value="1.15">أسرع</option></select></label>'+ 
 '<label>مصدر الصوت<select data-p132-option="voiceSource" aria-label="مصدر صوت التفسير"><option value="local">محلي — على الهاتف</option><option value="server" disabled>الخادم — غير مهيأ</option></select></label>'+
 '<label>الصوت العربي<select data-p132-option="voiceURI" aria-label="اختيار الصوت العربي"></select></label>'+ 
 '<button type="button" data-p132-preview="1" aria-label="تجربة صوت التفسير">▶ تجربة صوت التفسير</button>'+ 
 '<label class="p132Check"><input type="checkbox" data-p132-option="autoNext">متابعة الآية التالية تلقائيًا</label>'+
 '<small class="p138CloudNote">النطق المحلي يعمل دون إرسال النص. صوت الخادم غير متاح حتى تفعيل خدمة HTTPS موثوقة ومصرّح بها؛ لا يُرسل التطبيق النص تلقائيًا.</small>'+
 '<label class="p132Check"><input type="checkbox" data-p132-option="religiousGuide">تحسين ألفاظ التفسير الدينية (تشكيل مخصص للنطق فقط)</label>'+
 '<button type="button" data-p136-preview-plain="1" aria-label="مقارنة النطق دون تحسين الألفاظ">▶ مقارنة الصوت الأصلي</button>'+
 '<small>الآية بتسجيل القارئ الأصلي والتفسير بمحرك الهاتف. لا نضيف حركات إعراب تخمينية قد تغيّر المعنى، والمعجم الصوتي اختياري. الضغط المطوّل على الميكروفون لفتح جميع الإعدادات.</small>'+
 '<p id="p138NatiqStatus" aria-live="polite"></p></div>';
 d.body.appendChild(box);
 box.addEventListener('click',function(e){
  if(e.target&&e.target.closest('[data-p132-close]')){box.hidden=true;return}
  if(e.target&&e.target.closest('[data-p132-preview]'))previewVoice();
  if(e.target&&e.target.closest('[data-p136-preview-plain]'))previewVoice(false);
 });
 box.addEventListener('change',function(e){var target=e.target,key=target&&target.getAttribute('data-p132-option');
  if(!key)return;
  if(key==='voiceSource'){opts.voiceSource='local';target.value='local';return}
  opts[key]=key==='autoNext'||key==='religiousGuide'?target.checked:key==='rate'?clamp(target.value,.7,1.3,.95):target.value;
  if(key==='preferLocal'){opts.voiceURI='';populateVoices(box)}
  if(key==='reciterId'){var b=bridge();if(opts.reciterId!=='follow'&&(!b||!b.selected(opts.reciterId)))opts.reciterId='follow'}
  saveOpts();if(key==='autoNext')syncNextButtons();
 });
 return box;
}
function populateReciters(panel){
 var select=panel&&panel.querySelector&&panel.querySelector('[data-p132-option="reciterId"]');
 if(!select)return;
 select.textContent='';
 var b=bridge(),current=b&&b.selected&&b.selected('follow'),list=b&&b.list&&b.list()||[];
 var fallback=d.createElement('option');fallback.value='follow';
 fallback.textContent='قارئ متابعة التلاوة'+(current?' — '+current.name:' (الحالي)');
 select.appendChild(fallback);
 list.forEach(function(reader){
  var option=d.createElement('option');option.value=reader.id;
  option.textContent=reader.name;select.appendChild(option);
 });
 select.value=opts.reciterId;
 if(select.value!==opts.reciterId)select.value='follow';
}
function populateVoices(p){
 var box=p&&p.querySelector&&p.querySelector('[data-p132-option="voiceURI"]');
 if(!box||typeof box.appendChild!=='function')return;
 box.textContent='';
 var list=eligibleVoices();
 if(!list.length){
  var empty=d.createElement('option');empty.value='';empty.textContent='لا يوجد صوت عربي متاح';box.appendChild(empty);box.value='';return;
 }
 for(var i=0;i<list.length;i++){
  var v=list[i],opt=d.createElement('option');
  opt.value=v.voiceURI||v.name||'';opt.textContent=(v.name||'صوت عربي')+
   ' — '+(v.lang||'ar')+(v.localService?' · محلي':' · قد يستخدم اتصالًا');
  box.appendChild(opt);
 }
 var selected=voice();box.value=selected?(selected.voiceURI||selected.name||''):'';
}
function previewVoice(forceGuide){
 if(!ttsReady()){toast('لا يمكن الوصول إلى صوت عربي داخل WebView. يلزم جسر Android TextToSpeech أو صوت متوافق');return false}
 if(active)stop('تم إيقاف التشغيل لتجربة الصوت',true);
 var v=voice(),sample='الله سبحانه وتعالى، أنزل القرآن رحمة وهدى، وأمر بالصلاة والزكاة والتقوى.';
 sample=prepareSpeech(sample,forceGuide);
 if(v&&v._basairNative){
  var n=nativeBridge(),id='p133_preview_'+(++nativeReq);
  try{return !!n.speak(id,sample,opts.rate,v.name)}catch(_){toast('تعذر تشغيل تجربة الصوت العربي الأصلي');return false}
 }
 var u=new w.SpeechSynthesisUtterance(sample);
 u.lang=v.lang||'ar-SA';u.voice=v;u.rate=opts.rate;u.pitch=1;u.volume=1;
 u.onerror=function(){toast('تعذر اختبار الصوت العربي على هذا الهاتف')};
 try{w.speechSynthesis.cancel();w.speechSynthesis.speak(u);return true}
 catch(_){toast('تعذر بدء تجربة الصوت');return false}
}
function settings(){
 var p=panel();populateVoices(p);populateReciters(p);['mode','sections','rate','autoNext','voiceSource','voiceURI','reciterId','religiousGuide'].forEach(function(key){
  var x=p.querySelector('[data-p132-option="'+key+'"]');if(!x)return;
  if(x.type==='checkbox')x.checked=!!opts[key];
  else if(key!=='voiceURI'||opts.voiceURI)x.value=q(opts[key]);
 });
 var status=p.querySelector('#p138NatiqStatus'),b=bridge(),sel=b&&typeof b.selected==='function'&&b.selected(opts.reciterId);
 if(status)status.textContent=(ttsReady()?'الصوت العربي: متاح':
    (nativeBridge()?'الصوت الأصلي: '+nativeStatus().reason:
      'يتطلب الناطق جسر Android TextToSpeech؛ إعدادات الهاتف وحدها قد لا تكفي'))
   +' • '+(sel?'القارئ المحدد: '+q(sel.name):'لم يتم العثور على قارئ محدد')
   +' • '+(b&&typeof b.diagnostics==='function'&&b.diagnostics().exactAyahCatalogAvailable?'تسجيلات الآيات: فهرس متاح':'تسجيلات الآيات: يلزم مصدر آيات منفردة');
 p.hidden=false;
}
function pointerDown(e){
 var b=e.target&&e.target.closest&&e.target.closest('.p138MicButton');
 if(!b||!tafsirOpen())return;
 press={btn:b,pid:e.pointerId,x:e.clientX,y:e.clientY};
 w.clearTimeout(longTimer);
 longTimer=w.setTimeout(function(){if(!press)return;press=null;longPressUntil=Date.now()+900;settings()},570);
}
function pointerEnd(e){
 if(!press)return;
 if(e.pointerId!==undefined&&press.pid!==undefined&&press.pid!==e.pointerId)return;
 press=null;w.clearTimeout(longTimer);
}
function onClick(e){
 var btn=e.target&&e.target.closest&&e.target.closest('.p138MicButton');
 if(!btn||!tafsirOpen())return;
 e.preventDefault();e.stopPropagation();
 if(Date.now()<longPressUntil)return;
 if(active){stop('تم إيقاف الناطق');return}
 lastTappedButton=btn;start(btn.closest('.v194T2Ayah'));
}
function natiqUiNode(node){
 var el=node&&node.nodeType===1?node:node&&node.parentElement;
 return !!(el&&el.closest&&el.closest('.p132NatiqBar,.p132NatiqButton,.p132NatiqLive,.p137NatiqButton,.p137NatiqSettings,.p137NatiqNext,.p138MicButton,.p138MicLive,#p138NatiqStatus'));
}
function onTafsirChanged(mutations){
 if(!active)return;
 if(!tafsirOpen()){stop('خرجت من التفسير');return}
 if(active.transitioning)return
 if(!active.row.isConnected){stats.staleCancelled++;stop('تغيرت الآية؛ أعد تشغيل الناطق');return}
 var now=record(active.row);
 if(now.s!==active.verse.s||now.a!==active.verse.a||now.type!==active.verse.type){
  stats.staleCancelled++;stop('تغير التفسير؛ أعد تشغيل الناطق');return;
 }
 for(var i=0;i<mutations.length;i++){
  var m=mutations[i];
  if(m.type!=='childList'&&m.type!=='characterData')continue;
  var body=active.row.querySelector('.v194T2Body');
  if(body&&(m.target===body||body.contains(m.target))){
   if(natiqUiNode(m.target))continue;
   if(m.type==='childList'&&m.target===body){
    var changed=Array.prototype.slice.call(m.addedNodes).concat(Array.prototype.slice.call(m.removedNodes));
    if(changed.length&&changed.every(natiqUiNode))continue;
   }
   stats.staleCancelled++;stop('تحدث نص التفسير؛ أعد تشغيل الناطق');return;
  }
 }
}
function observe(){
 var host=E('tafsirAyahs');if(!host||!w.MutationObserver)return;
 observer=new w.MutationObserver(function(mutations){
  onTafsirChanged(mutations);
  if(mutations.some(function(m){if(m.type!=='childList')return false;
    for(var i=0;i<m.addedNodes.length;i++){var n=m.addedNodes[i];
     if(n.nodeType===1&&(n.matches('.v194T2Ayah')||n.querySelector&&n.querySelector('.v194T2Ayah')))return true;
    }return false;
  }))mountSoon();
 });
 observer.observe(host,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-t5-type','data-type','data-t2ayah']});
}
function observeReaderExit(){
 var rdr=E('tafsirReader');
 if(!rdr||!w.MutationObserver)return;
 viewObserver=new w.MutationObserver(function(){
  if(active&&!tafsirOpen())stop('توقف الناطق بعد الخروج من التفسير');
  if(tafsirOpen())mountSoon();
 });
 viewObserver.observe(rdr,{attributes:true,attributeFilter:['class','hidden','style']});
}
function init(){
 if(!E('tafsirReader'))return;
 loadOpts();attach();panel();observe();observeReaderExit();
 // An older narrator attached capture listeners to document and cannot remove
 // them. In a hot upgrade intercept ONLY narrator button events at window
 // capture (earlier in the path), preventing simultaneous old/new players.
 function narratorButton(e){return e.target&&e.target.closest&&e.target.closest('.p138MicButton')}
 function captureButton(e,fn){
  if(!narratorButton(e)||!tafsirOpen())return;
  if(e.stopImmediatePropagation)e.stopImmediatePropagation();
  else e.stopPropagation();
  fn(e);
 }
 var events=takeover?w:d;
 events.addEventListener('click',takeover?function(e){captureButton(e,onClick)}:onClick,true);
 events.addEventListener('pointerdown',takeover?function(e){captureButton(e,pointerDown)}:pointerDown,true);
 events.addEventListener('pointerup',takeover?function(e){captureButton(e,pointerEnd)}:pointerEnd,true);
 events.addEventListener('pointercancel',takeover?function(e){captureButton(e,pointerEnd)}:pointerEnd,true);
 events.addEventListener('pointermove',function(e){
  if(press&&(Math.abs(e.clientX-press.x)>12||Math.abs(e.clientY-press.y)>12))pointerEnd(e)
 },true);
 w.addEventListener('pagehide',function(){stop('تم إيقاف الصوت عند الخروج',true)});
  var synth=w.speechSynthesis;
  if(synth&&typeof synth.addEventListener==='function')synth.addEventListener('voiceschanged',function(){
   var p=E('p138NatiqPanel');if(p&&!p.hidden)populateVoices(p);
  });
 d.addEventListener('visibilitychange',function(){if(d.hidden&&active)stop('توقف الصوت عند إخفاء التطبيق')});
}
var API={version:VERSION,normalize:normalize,segments:segments,splitSpeech:splitSpeech,prepareSpeech:prepareSpeech,
 sayHeading:sayHeading,record:record,capabilities:function(){return {arabicTTS:ttsReady(),arabicVoices:voices().length,verifiedAyahAudioBridge:!!bridge()}},
 status:function(){return {running:!!active,stage:active&&active.stage||'',options:Object.assign({},opts),stats:Object.assign({},stats)}},
 diagnostics:function(){
  var b=bridge();return {nativeTTS:nativeStatus(),arabicTTS:ttsReady(),localArabicVoices:voices().filter(function(x){return x.localService}).length,
   reciterSelected:!!(b&&b.selected&&b.selected(opts.reciterId)),reciterChoice:opts.reciterId,
   supportedReciters:b&&b.list?b.list().length:0,
   nextEnabled:opts.autoNext,visibleSettings:true,compactMic:true,voiceSource:'local',serverAvailable:false,
   lastNativeIssue:lastNativeIssue,
   narratorTakeover:takeover,religiousGuideEnabled:opts.religiousGuide,
   hasReciterSelector:!!(E('p138NatiqPanel')&&E('p138NatiqPanel').querySelector('[data-p132-option="reciterId"]')),
   exactAyahSource:!!(b&&b.diagnostics&&b.diagnostics().exactAyahCatalogAvailable),
   mounted:!!E('tafsirReader'),currentVersion:VERSION};
 },
 start:start,stop:stop,settings:settings,preview:previewVoice,refresh:mountSoon};
w.__BASAIR_TAFSIR_NATIQ_P132__=API;
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
