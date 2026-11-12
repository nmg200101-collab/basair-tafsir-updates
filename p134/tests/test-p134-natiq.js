'use strict';
/* P134 QA: simulated WebView and native TTS. NOT a device test. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../modules/tafsir/p134-natiq.js'),'utf8');
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
  assert.equal(m.pending.length,1);m.emit(0,'end');await delay(260);
  assert.ok(m.pending.length>=2);assert.match(m.pending[1].value,/بيان عظيم/);m.api.stop();
 });
 await check('Native error cancels the current reading session',async()=>{
  const m=setup();m.api.start(m.row);m.emit(0,'error');await delay(10);
  assert.equal(m.api.status().running,false);assert.ok(m.api.status().stats.errors>0);
 });
 await check('Explicit stop silences native and discards late callback',async()=>{
  const m=setup();m.api.start(m.row);m.api.stop();m.emit(0,'end');
  await delay(260);assert.equal(m.api.status().running,false);
  assert.equal(m.pending.length,1);assert.ok(m.events.includes('native-stop'));
 });
 await check('Native preview uses Android voice and no speechSynthesis',()=>{
  const m=setup();assert.equal(m.api.preview(),true);
  assert.equal(m.pending.length,1);assert.match(m.pending[0].value,/نبدأ الآن/);
 });
 await check('Not-ready native bridge cannot falsely report success',()=>{
  const m=setup({ready:false});assert.equal(m.api.capabilities().arabicTTS,false);
  assert.equal(m.api.start(m.row),false);
 });
 await check('Remote-only Arabic is excluded under default local-only policy',()=>{
  const m=setup({local:false});assert.equal(m.api.capabilities().arabicTTS,false);
 });
 await check('P134 default mode is Tafsir-only without reciter dependency',()=>{
  const m=setup({mode:null});
  assert.equal(m.api.status().options.mode,'tafsir');
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
 console.log(JSON.stringify({pass:count,total:11,native:'mock only',androidDevice:'not tested'}));
}
if(typeof module!=='undefined'&&module.exports)module.exports=main;
if(typeof require!=='undefined'&&require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
