'use strict';
/* P135 QA: simulated WebView/native voice and Tafsir prose. NOT a device test. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../p121/owner-qa/modules/tafsir/p137-natiq.js'),'utf8');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function text(s){return {nodeType:3,nodeValue:s,nextSibling:null}}
function el(tag,children=[]){
 const a={nodeType:1,tagName:tag.toUpperCase(),className:'',hasAttribute:()=>false,getAttribute:()=>null,matches:()=>false};
 children.forEach((c,i)=>c.nextSibling=children[i+1]||null);
 a.firstChild=children[0]||null;
 Object.defineProperty(a,'textContent',{get:()=>children.map(c=>c.nodeType===3?c.nodeValue:c.textContent).join('')});
 return a;
}
function setup({native=true,ready=true,mode='tafsir',local=true}={}){
 let readerActive=true,panel=null;
 const callbacks={},pending=[],toasts=[],events=[],observers=[];
 const body=el('div',[el('h3',[text('اللمسة البيانية')]),el('p',[text('في هذه الآية بيان عظيم.')])]);
 body.contains=n=>n===body||n.parentElement===body||!!(n.parentElement&&n.parentElement.parentElement===body);
 const row={isConnected:true,getAttribute:k=>k==='data-t2ayah'?'4':k==='data-t5-s'?'1':k==='data-t5-type'?'basair':null,
  querySelector:s=>s==='.v194T2Body'?body:null};
 const rdr={classList:{contains:k=>k==='active'&&readerActive}};
 const doc={readyState:'complete',hidden:false,body:{appendChild:p=>panel=p},
  getElementById:k=>k==='tafsirReader'?rdr:k==='tafsirAyahs'?{querySelectorAll:()=>[]}:k==='p132Panel'?panel:null,
  createElement:tag=>({tagName:tag,hidden:false,addEventListener(){},setAttribute(){},querySelector:()=>null}),
  querySelectorAll:()=>[],addEventListener:(k,fn)=>callbacks[k]=fn};
 const tts={capabilities:()=>JSON.stringify({ready,reason:ready?'READY_LOCAL_ARABIC':'ARABIC_OFFLINE_VOICE_UNAVAILABLE',
  voices:[{name:'العربية المحلية',lang:'ar-SA',localService:local}]}),
  speak:(id,value,rate,voice)=>{pending.push({id,value,rate,voice});events.push('native-speak');return true},
  stop:()=>events.push('native-stop')};
 const win={localStorage:{getItem:()=>JSON.stringify({mode,preferLocal:true}),setItem(){}},
  BasairNativeArabicTts:native?tts:undefined,
  setTimeout,clearTimeout,addEventListener(){},MutationObserver:function(cb){observers.push(cb);this.observe=function(){};this.disconnect=function(){}},
  __BASAIR_TAFSIR_CORE__:{toast:v=>toasts.push(v)}};
 new Function('window','document',src)(win,doc);
 return {api:win.__BASAIR_TAFSIR_NATIQ_P132__,win,row,pending,toasts,events,
  emit:(index,event)=>win.__BASAIR_P133_NATIVE_TTS_EVENT__(pending[index].id,event),
  mutate:ms=>observers[0](ms)};
}
async function main(){
 let count=0;async function check(name,fn){await fn();count++;console.log('PASS '+name)}
 await check('No native and no Web Speech accurately reports unavailable',()=>{
  const m=setup({native:false});assert.equal(m.api.capabilities().arabicTTS,false);
  assert.equal(m.api.start(m.row),false);assert.ok(m.toasts.some(x=>/Android|WebView|داخل التطبيق/.test(x)));
 });
 await check('Native local Arabic voice used without browser speechSynthesis',()=>{
  const m=setup();assert.equal(m.api.capabilities().arabicTTS,true);
  assert.equal(m.api.start(m.row),true);assert.equal(m.pending.length,1);
  assert.match(m.pending[0].value,/اللمسة البيانية/);m.api.stop();
 });
 await check('Tafsir follows only native completion, not a fixed timeout',async()=>{
  const m=setup();m.api.start(m.row);await delay(15);
  assert.equal(m.pending.length,1);m.emit(0,'end');await delay(410);
  assert.ok(m.pending.length>=2);assert.match(m.pending[1].value,/بيان عظيم/);m.api.stop();
 });
 await check('Native error triggers one safe retry rather than silencing Tafsir',async()=>{
  const m=setup();m.api.start(m.row);m.emit(0,'error');await delay(350);
  assert.equal(m.api.status().running,true);
  assert.equal(m.pending.length,2);
  assert.equal(m.api.status().stats.nativeRetries,1);
  assert.equal(m.api.status().stats.nativeErrors,1);m.api.stop();
 });
 await check('Explicit stop silences native and discards late callback',async()=>{
  const m=setup();m.api.start(m.row);m.api.stop();m.emit(0,'end');
  await delay(260);assert.equal(m.api.status().running,false);
  assert.equal(m.pending.length,1);assert.ok(m.events.includes('native-stop'));
 });
 await check('Native preview uses Android voice and no speechSynthesis',()=>{
  const m=setup();assert.equal(m.api.preview(),true);
  assert.equal(m.pending.length,1);assert.match(m.pending[0].value,/اللّٰه/);assert.match(m.pending[0].value,/الْقُرْآن/);
 });
 await check('Not-ready native bridge cannot falsely report success',()=>{
  const m=setup({ready:false});assert.equal(m.api.capabilities().arabicTTS,false);
  assert.equal(m.api.start(m.row),false);
 });
 await check('Remote-only Arabic is excluded under default local-only policy',()=>{
  const m=setup({local:false});assert.equal(m.api.capabilities().arabicTTS,false);
 });
 await check('P135 defaults to both but gracefully falls back to Tafsir without reciter',()=>{
  const m=setup({mode:null});
  assert.equal(m.api.status().options.mode,'both');
  assert.equal(m.api.start(m.row),true);
  assert.ok(m.pending.length>0);m.api.stop();
 });
 await check('P134 both-mode gracefully narrates Tafsir when no verified reciter track',()=>{
  const m=setup({mode:'both'});
  assert.equal(m.api.start(m.row),true);
  assert.ok(m.toasts.some(t=>/التفسير فقط/.test(t)));
  assert.ok(m.pending.length>0);m.api.stop();
 });
 await check('P134 TTS UI mutation does not cancel active session',()=>{
  const m=setup();m.api.start(m.row);
  const live={nodeType:1,closest:()=>true,parentElement:null};
  const t={nodeType:3,parentElement:live};
  const body=m.row.querySelector('.v194T2Body');
  body.contains=()=>true;
  m.mutate([{type:'characterData',target:t}]);
  assert.equal(m.api.status().running,true);m.api.stop();
 });
 await check('P134 never includes narrator status or error in Tafsir source text',()=>{
  const m=setup(),body=m.row.querySelector('.v194T2Body');
  const status=el('small',[text('رسالة حالة الناطق ليست جزءًا من التفسير')]);
  status.className='p132NatiqLive';
  let tail=body.firstChild;while(tail.nextSibling)tail=tail.nextSibling;tail.nextSibling=status;
  const result=m.api.segments(m.row).map(x=>x.text).join(' ');
  assert.ok(!result.includes('رسالة حالة الناطق'));
  assert.ok(result.includes('في هذه الآية'));
 });
 await check('P135 punctuation-aware Arabic clauses preserve source words',()=>{
  const m=setup(),input='أولًا، معنى الآية يبين حقيقة مهمة. ثم يذكر فائدة عملية في الحياة اليومية، وهذه الفائدة ينبغي الانتباه إليها؛ ولذلك نتدبر الآية.';
  const pieces=m.api.splitSpeech(input,145);
  assert.ok(pieces.length>=2);
  assert.ok(pieces.every(s=>s.length<=165));
  assert.ok(pieces.some(s=>s.endsWith('.')));
  assert.ok(pieces.some(s=>s.endsWith('؛')||s.endsWith('،')||s.endsWith('.')));
  assert.ok(pieces.join(' ').includes('الحياة اليومية'));
 });
 await check('P135 read Quran-only mode never attempts synthesized recitation',()=>{
  const m=setup({mode:'recitation'});
  assert.equal(m.api.start(m.row),false);assert.equal(m.pending.length,0);
 });
 await check('P135 new reciter option remains independent of Tilawa controls',()=>{
  const m=setup({mode:'tafsir'});
  assert.equal(m.api.status().options.reciterId,'follow');
  assert.equal(m.api.diagnostics().supportedReciters,0);
 });
 await check('P137 start/end acknowledgements do not double-count completion',async()=>{
  const m=setup();m.api.start(m.row);
  m.emit(0,'start');m.emit(0,'end');await delay(350);
  assert.equal(m.api.status().stats.nativeStarts,1);
  assert.equal(m.pending.length,2);m.api.stop();
 });
 await check('P137 cancellation event is handled as real error not 60s stall',async()=>{
  const m=setup();m.api.start(m.row);m.emit(0,'cancel');await delay(350);
  assert.equal(m.pending.length,2);m.api.stop();
 });
 console.log(JSON.stringify({pass:count,total:17,native:'mock only',androidDevice:'not tested'}));
}
if(typeof module!=='undefined'&&module.exports)module.exports=main;
if(typeof require!=='undefined'&&require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
