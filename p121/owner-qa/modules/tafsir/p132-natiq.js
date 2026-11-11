/* BASAIR P132 — standalone Tafsir Natiq QA module.
 * Not loaded by live release.json. NEVER uses synthetic voice for Quran recitation.
 * Voice recording requires a verified read-only selected-reciter/one-ayah bridge.
 * Does not modify Tilawa engine, P120/R114, Quran text, signing, or navigation.
 */
(function(w,d){
'use strict';
if(w.__BASAIR_TAFSIR_NATIQ_P132__)return;
var VERSION='P132.1-NATIQ-QA-NOT-LIVE', KEY='basair:tafsir:natiq:p132:prefs';
var opts={mode:'both',sections:'all',rate:0.95,autoNext:false,preferLocal:true};
var active=null,token=0,mountTimer=0,observer=null,longTimer=0,longPressUntil=0,press=null;
var lastDrawnButton=null,lastLiveLabel=null;
var stats={starts:0,stops:0,spokenChunks:0,skippedSymbols:0,sourceUnavailable:0,staleCancelled:0,errors:0};
function E(id){return d.getElementById(id)}
function tafsirOpen(){var x=E('tafsirReader');return !!(x&&x.classList.contains('active'))}
function q(s){return String(s==null?'':s)}
function clamp(n,min,max,defaultValue){n=Number(n);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):defaultValue}
function toast(msg){var c=w.__BASAIR_TAFSIR_CORE__;try{if(c&&typeof c.toast==='function')c.toast(msg);else if(typeof w.toast==='function')w.toast(msg)}catch(_){}}
function normalize(raw){
 var x=q(raw);
 x=x.replace(/\uFDFA/g,' صلى الله عليه وسلم ').replace(/\uFDFB/g,' جل جلاله ');
 x=x.replace(/\uFDFD/g,' بسم الله الرحمن الرحيم ').replace(/\uFDF2/g,' الله ');
 x=x.replace(/[\u06DD\u06DE\u06E9\u06E6\u06E7\u06E8\u06E5\u06E0\u06D6-\u06DC\uFDFE\uFD3E\uFD3F]/g,' ');
 x=x.replace(/[﴿﴾۞۩۝«»]/g,' ').replace(/\u0640/g,'');
 x=x.replace(/[\u200B-\u200F\uFEFF]/g,' ').replace(/[ \t]+/g,' ');
 x=x.replace(/\s*([،؛:،؟.!?])\s*/g,'$1 ');
 x=x.replace(/\?/g,'؟').replace(/!/g,'،').replace(/[.;:؛]/g,'،');
 x=x.replace(/[ \t]*\n[ \t]*/g,'\n').replace(/\n{3,}/g,'\n\n');
 return x.trim();
}
function ineligible(el){
 if(!el||el.nodeType!==1)return false;
 if(/^(SCRIPT|STYLE|NOSCRIPT|BUTTON|INPUT|SELECT|TEXTAREA|AUDIO|VIDEO|SVG|CANVAS|NAV|FOOTER)$/i.test(el.tagName||''))return true;
 var cls=String(el.className||'');
 if(/(^|\s)(v194T2Qrow|basairB231AyahActions|b118CarryArticle|p124ExportDialog|p132NatiqBar|p132Panel|p132NatiqStatus|v194T5Sentinel)(\s|$)/.test(cls))return true;
 if(el.hasAttribute('hidden')||el.getAttribute('aria-hidden')==='true')return true;
 return false;
}
function heading(el){
 if(!el||el.nodeType!==1)return false;
 if(/^H[1-6]$/.test(el.tagName||''))return true;
 return el.matches&&el.matches('[data-tafsir-section-title],.v194T2SectionTitle,.v194T2Heading,.tafsirSectionTitle');
}
function segments(row){
 if(!row||!row.querySelector)return [];
 // This is the actual rendered Tafsir body. NEVER fall back to entire verse
 // article: otherwise Quran text and toolbar labels would be spoken as Tafsir.
 var root=row.querySelector('.v194T2Body')||row.querySelector('[data-tafsir-content]');
 if(!root)return [];
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
   flush();title=node.textContent||'';return;
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
 max=max||185;var val=normalize(text);
 if(!val)return [];
 var words=val.split(/\s+/),result=[],buff='';
 for(var i=0;i<words.length;i++){
  var word=words[i];
  // Very long unbroken source words are preserved whole; never drop text.
  if(buff&&(buff.length+1+word.length)>max){result.push(buff);buff=''}
  buff+=(buff?' ':'')+word;
  if(buff.length>55&&/[،؟.!؛]$/.test(word)){result.push(buff);buff=''}
 }
 if(buff)result.push(buff);
 return result;
}
function sayHeading(title){
 title=normalize(title);if(!title)return '';
 if(/لمس[ةه]\s+بياني[ةه]|اللمس[ةه]\s+البياني[ةه]/.test(title))return 'والآن، اللمسة البيانية.';
 if(/تدب[رّ]|لطائف التدبر/.test(title))return 'ومن لطائف التدبر في الآية.';
 if(/فوائد|تطبيقات|العمل بالآية/.test(title))return 'ومن الفوائد العملية.';
 if(/الخلاص[ةه]|خلاصة المعنى/.test(title))return 'وخلاصة المعنى.';
 if(/البيان|الشرح|معنى الآية/.test(title))return 'ننتقل إلى البيان والشرح.';
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
  opts.rate=clamp(o.rate,.7,1.3,.95);opts.autoNext=o.autoNext===true;opts.preferLocal=o.preferLocal!==false;
 }catch(_){}
}
function saveOpts(){try{w.localStorage.setItem(KEY,JSON.stringify(opts))}catch(_){}}
function voices(){
 var synth=w.speechSynthesis;if(!synth||typeof synth.getVoices!=='function')return [];
 try{return synth.getVoices().filter(function(v){return /^ar(?:-|$)/i.test(v.lang||'')})}catch(_){return []}
}
function voice(){var vs=voices();if(opts.preferLocal){var local=vs.filter(function(v){return v.localService});if(local.length)return local[0]}return vs[0]||null}
function ttsReady(){return !!(w.speechSynthesis&&typeof w.SpeechSynthesisUtterance==='function'&&voice())}
function bridge(){
 // Only a dedicated, audited one-ayah adapter is acceptable. The ordinary
 // Tilawa audio element is page/surah audio, not a proven one-ayah track.
 var b=w.__BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__;
 return b&&typeof b.selected==='function'&&typeof b.playOne==='function'?b:null;
}
function stage(label){if(!active)return;active.stage=label;drawStatus(label)}
function drawStatus(value){
 var el=E('p132NatiqStatus');if(el)el.textContent=value||'';
 // P132.1 performance: touch only the active/previous button, not every
 // rendered verse on every TTS chunk.
 var current=active&&active.row&&active.row.querySelector('.p132NatiqButton');
 if(lastDrawnButton&&lastDrawnButton!==current){
  lastDrawnButton.classList.remove('p132-on');
  lastDrawnButton.setAttribute('aria-pressed','false');
  var oldText=lastDrawnButton.querySelector('b');if(oldText)oldText.textContent='الناطق';
 }
 if(lastLiveLabel&&(!active||lastLiveLabel!==active.row.querySelector('.p132NatiqLive'))){
  lastLiveLabel.textContent='';lastLiveLabel.hidden=true;lastLiveLabel=null;
 }
 lastDrawnButton=current||null;
 if(current){
  current.setAttribute('aria-pressed','true');current.classList.add('p132-on');
  var title=current.querySelector('b');if(title)title.textContent='إيقاف الناطق';
  var live=active.row.querySelector('.p132NatiqLive');
  if(live){live.hidden=false;if(live.textContent!==value)live.textContent=value||'';lastLiveLabel=live}
 }
}
function stop(reason,quiet){
 token++;
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
function readChunk(s,content){
 return new Promise(function(resolve,reject){
  if(token!==s.token||!active){resolve(false);return}
  var v=voice();if(!v){reject(new Error('لا يوجد صوت عربي متاح في الجهاز'));return}
  var u=new w.SpeechSynthesisUtterance(content);
  u.lang='ar-SA';u.voice=v;u.rate=opts.rate;u.pitch=1;u.volume=1;
  var done=false;
  function finish(ok,error){if(done)return;done=true;u.onend=null;u.onerror=null;if(error)reject(error);else resolve(ok)}
  u.onend=function(){finish(true)};
  u.onerror=function(e){if(token!==s.token){finish(false);return}finish(false,new Error('فشل محرك النطق العربي'))};
  try{w.speechSynthesis.speak(u)}catch(e){finish(false,e)}
 });
}
async function readTafsir(s){
 if(!ttsReady())throw new Error('لا يتوفر ناطق عربي مناسب في WebView؛ يلزم محرك صوت عربي على الهاتف');
 var ss=filterSections(segments(s.row));
 if(!ss.length)throw new Error('لم يُعثر على نص التفسير المعروض للقسم المحدد');
 for(var i=0;i<ss.length;i++){
  if(token!==s.token)return false;
  var item=ss[i],all=[];
  var h=sayHeading(item.title);
  if(h)all.push(h);
  all=all.concat(splitSpeech(item.text,190));
  for(var j=0;j<all.length;j++){
   if(token!==s.token)return false;
   stage('قراءة التفسير: '+(item.title||'المعنى')+' • '+(i+1)+'/'+ss.length);
   var ok=await readChunk(s,all[j]);if(!ok)return false;
   stats.spokenChunks++;
  }
 }
 return true;
}
async function readQuran(s){
 var b=bridge();
 if(!b){stats.sourceUnavailable++;throw new Error('لم يكتمل ربط تسجيل الآية بصوت القارئ المحدد؛ اختر وضع التفسير فقط')}
 var selected=b.selected();
 if(!selected||!selected.id)throw new Error('لم يتم اختيار قارئ صالح في قسم التلاوة');
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
 await handle.ended;
 s.audioSession=null;
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
   if(opts.mode==='both'||opts.mode==='recitation'){
    var heard=await readQuran(s);if(!heard)return;
   }
   if(opts.mode==='both'||opts.mode==='tafsir'){
    var spoken=await readTafsir(s);if(!spoken)return;
   }
   if(!opts.autoNext){stop('اكتملت قراءة الآية');return}
   var next=nextVerse(s.verse);
   if(!next){stop('اكتملت القراءة حتى نهاية السورة أو المصحف');return}
   stage('الانتقال إلى الآية التالية');
   s.row=await readyNext(next,s);s.verse=next;
  }
 }catch(e){
  if(token===s.token){stats.errors++;stop(q(e&&e.message||'تعذر تشغيل الناطق'));toast(q(e&&e.message||'تعذر تشغيل الناطق'))}
 }
}
function start(row){
 if(!tafsirOpen()){toast('افتح التفسير أولًا');return false}
 row=row||visibleRow();var v=record(row);
 if(!row||!valid(v)){toast('اختر آية صحيحة أولًا');return false}
 var follow=w.__BASAIR_TAFSIR_R114__;
 if(follow&&follow.status&&follow.status().running){
  var guard=w.__BASAIR_TAFSIR_P130__;
  if(!guard||typeof guard.stop!=='function'){toast('أوقف متابعة الآيات أولًا');return false}
  guard.stop();if(follow.status().running){toast('أوقف متابعة الآيات أولًا');return false}
 }
 if((opts.mode==='both'||opts.mode==='recitation')&&!bridge()){
  toast('لا توجد واجهة موثقة لتسجيل الآية؛ يمكنك اختيار تفسير فقط من إعدادات الناطق');
  stats.sourceUnavailable++;return false;
 }
 if((opts.mode==='both'||opts.mode==='tafsir')&&!ttsReady()){
  toast('لم يُعثر على محرك نطق عربي صالح على الهاتف');return false;
 }
 if((opts.mode==='both'||opts.mode==='tafsir')&&!filterSections(segments(row)).length){
  toast('لا يوجد نص تفسير قابل للقراءة في الآية المحددة');return false;
 }
 stop('',true);
 var s={token:token,verse:v,row:row,audioSession:null,stage:'start'};
 active=s;stats.starts++;stage('جارٍ تجهيز الناطق');
 sequence(s);return true;
}
function control(row){
 var anchor=row.querySelector('.b263r3NoteChip,[data-r3-note-pos],.p124FollowAboveTools');
 var btn=row.querySelector('.p132NatiqButton');
 if(btn)return;
 btn=d.createElement('button');btn.type='button';btn.className='p132NatiqButton';
 btn.setAttribute('aria-label','الناطق التفسيري — اضغط مطولًا للإعدادات');
 btn.innerHTML='<span aria-hidden="true">◖))</span><b>الناطق</b>';
 var live=d.createElement('small');live.className='p132NatiqLive';live.hidden=true;
 live.setAttribute('aria-live','polite');
 if(anchor&&anchor.parentElement){anchor.insertAdjacentElement('afterend',btn);btn.insertAdjacentElement('afterend',live)}
 else{
  var head=row.querySelector('.v194T2Body');
  if(!head)return;
  var bar=d.createElement('div');bar.className='p132NatiqBar';
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
 var box=E('p132Panel');if(box)return box;
 box=d.createElement('div');box.id='p132Panel';box.hidden=true;box.setAttribute('role','dialog');
 box.setAttribute('aria-label','إعدادات الناطق');box.dir='rtl';
 box.innerHTML='<div class="p132Sheet"><header><strong>الناطق التفسيري</strong><button type="button" data-p132-close="1" aria-label="إغلاق">×</button></header>'+
 '<label>نمط التشغيل<select data-p132-option="mode"><option value="both">الآية ثم التفسير</option><option value="tafsir">التفسير فقط</option><option value="recitation">تلاوة الآية فقط</option></select></label>'+
 '<label>أقسام التفسير<select data-p132-option="sections"><option value="all">جميع أقسام التفسير</option><option value="explanation">البيان والشرح</option><option value="reflection">التدبر والفوائد</option><option value="summary">الخلاصة</option></select></label>'+
 '<label>سرعة النطق<select data-p132-option="rate"><option value="0.8">بطيء</option><option value="0.95">هادئ</option><option value="1">طبيعي</option><option value="1.15">أسرع</option></select></label>'+
 '<label class="p132Check"><input type="checkbox" data-p132-option="autoNext">متابعة الآية التالية تلقائيًا</label>'+
 '<label class="p132Check"><input type="checkbox" data-p132-option="preferLocal">تفضيل صوت عربي محلي عند توفره</label>'+
 '<small>التلاوة الأصلية للقارئ لا تُستبدل بنطق اصطناعي. يعمل الصوت العربي فقط إذا كان المحرك متاحًا بالجهاز.</small>'+
 '<p id="p132NatiqStatus" aria-live="polite"></p></div>';
 d.body.appendChild(box);
 box.addEventListener('click',function(e){if(e.target&&e.target.closest('[data-p132-close]'))box.hidden=true});
 box.addEventListener('change',function(e){var target=e.target,key=target&&target.getAttribute('data-p132-option');
  if(!key)return;opts[key]=key==='autoNext'||key==='preferLocal'?target.checked:key==='rate'?clamp(target.value,.7,1.3,.95):target.value;saveOpts();
 });
 return box;
}
function settings(){
 var p=panel();['mode','sections','rate','autoNext','preferLocal'].forEach(function(key){
  var x=p.querySelector('[data-p132-option="'+key+'"]');if(!x)return;
  if(x.type==='checkbox')x.checked=!!opts[key];else x.value=q(opts[key]);
 });p.hidden=false;
}
function pointerDown(e){
 var b=e.target&&e.target.closest&&e.target.closest('.p132NatiqButton');
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
 var b=e.target&&e.target.closest&&e.target.closest('.p132NatiqButton');
 if(!b||!tafsirOpen())return;
 e.preventDefault();e.stopPropagation();
 if(Date.now()<longPressUntil)return;
 if(active){stop('تم إيقاف الناطق');return}
 var row=b.closest('.v194T2Ayah');start(row);
}
function onTafsirChanged(mutations){
 if(!active)return;
 if(!tafsirOpen()){stop('خرجت من التفسير');return}
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
function init(){
 if(!E('tafsirReader'))return;
 loadOpts();attach();panel();observe();
 d.addEventListener('click',onClick,true);
 d.addEventListener('pointerdown',pointerDown,true);
 d.addEventListener('pointerup',pointerEnd,true);
 d.addEventListener('pointercancel',pointerEnd,true);
 d.addEventListener('pointermove',function(e){
  if(press&&(Math.abs(e.clientX-press.x)>12||Math.abs(e.clientY-press.y)>12))pointerEnd(e)
 },true);
 w.addEventListener('pagehide',function(){stop('تم إيقاف الصوت عند الخروج',true)});
 d.addEventListener('visibilitychange',function(){if(d.hidden&&active)stop('توقف الصوت عند إخفاء التطبيق')});
}
var API={version:VERSION,normalize:normalize,segments:segments,splitSpeech:splitSpeech,
 sayHeading:sayHeading,record:record,capabilities:function(){return {arabicTTS:ttsReady(),arabicVoices:voices().length,verifiedAyahAudioBridge:!!bridge()}},
 status:function(){return {running:!!active,stage:active&&active.stage||'',options:Object.assign({},opts),stats:Object.assign({},stats)}},
 start:start,stop:stop,settings:settings,refresh:mountSoon};
w.__BASAIR_TAFSIR_NATIQ_P132__=API;
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
