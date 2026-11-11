'use strict';
/* P132 runtime tests (mocked Android WebView/TTS/one-ayah adapter).
 * Run: node p121/owner-qa/p132-evidence/test-p132-runtime.js
 * Not proof of actual device Arabic TTS or real reciter source.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../modules/tafsir/p132-natiq.js'),'utf8');
function el(tag,children=[]){
 const node={nodeType:1,tagName:tag.toUpperCase(),className:'',hasAttribute:()=>false,
  getAttribute:()=>null,matches:()=>false};
 for(let i=0;i<children.length;i++)children[i].nextSibling=children[i+1]||null;
 node.firstChild=children[0]||null;
 node.textContent=children.map(c=>c.nodeType===3?c.nodeValue:c.textContent).join('');
 return node;
}
function t(s){return {nodeType:3,nodeValue:s,nextSibling:null}}
function mock(prefs={},bridge=null,{neverEnd=false,remoteOnly=false}={}){
 const utter=[],events=[],toast=[],callbacks={};
 let panel=null,cancelCount=0;
 const body=el('div',[el('h3',[t('اللمسة البيانية')]),el('p',[t('في اللغة العربية بلاغة وبيان كامل.')])]);
 const row={isConnected:true,getAttribute:(s)=>s==='data-t2ayah'?'4':s==='data-t5-s'?'1':s==='data-t5-type'?'basair':null,
  querySelector:(s)=>s==='.v194T2Body'?body:null};
 const doc={readyState:'complete',hidden:false,
  body:{appendChild:v=>panel=v},
  getElementById:id=>id==='tafsirReader'?{classList:{contains:x=>x==='active'}}:
    id==='tafsirAyahs'?{querySelectorAll:()=>[]}:id==='p132Panel'?panel:null,
  querySelectorAll:()=>[],createElement:tag=>({tagName:tag,hidden:false,addEventListener(){},
   setAttribute(){},querySelector:()=>null}),
  addEventListener:(name,fn)=>callbacks[name]=fn};
 const synth={
  getVoices:()=>[{lang:'ar-SA',localService:!remoteOnly,name:'Arabic'}],
  cancel:()=>{cancelCount++;events.push('cancel')},
  speak:u=>{utter.push(u.text);events.push('speak:'+u.text);if(!neverEnd)Promise.resolve().then(()=>u.onend&&u.onend())}
 };
 const win={speechSynthesis:synth,SpeechSynthesisUtterance:function(s){this.text=s},
  setTimeout,clearTimeout,localStorage:{getItem:()=>JSON.stringify(prefs),setItem(){}},
  addEventListener:(name,fn)=>callbacks[name]=fn,
  __BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__:bridge,
  __BASAIR_TAFSIR_CORE__:{toast:msg=>toast.push(msg)}};
 new Function('window','document',src)(win,doc);
 return {api:win.__BASAIR_TAFSIR_NATIQ_P132__,row,utter,events,toast,
  callbacks,cancelCount:()=>cancelCount};
}
async function settle(){await new Promise(r=>setTimeout(r,250));await new Promise(r=>setTimeout(r,0))}
async function main(){
 let count=0;
 async function check(name,test){await test();count++;console.log('PASS '+name)}
 await check('Tafsir-only speaks heading and full body',async()=>{
  const m=mock({mode:'tafsir'});assert.equal(m.api.start(m.row),true);await settle();
  assert.ok(m.utter.length>=2);assert.match(m.utter.join(' '),/بلاغة/);
  assert.equal(m.api.status().running,false);
 });
 await check('Both mode refuses fabricated Quran recitation',async()=>{
  const m=mock({mode:'both'});assert.equal(m.api.start(m.row),false);
  assert.equal(m.utter.length,0);
 });
 await check('Verified selected-reciter track precedes Arabic explanation',async()=>{
  let m;const bridge={selected:()=>({id:'real1',name:'القارئ'}),
   playOne:async()=>{m.events.push('real-ayah');return{
    surah:1,ayah:4,reciterId:'real1',verified:true,ended:Promise.resolve(),stop(){}}}};
  m=mock({mode:'both'},bridge);assert.equal(m.api.start(m.row),true);
  await settle();
  assert.ok(m.events.indexOf('real-ayah')<m.events.findIndex(x=>x.startsWith('speak:')));
 });
 await check('Unverified track rejected before Arabic explanation',async()=>{
  let stopped=false;const bridge={selected:()=>({id:'real1',name:'القارئ'}),
   playOne:async()=>({surah:1,ayah:4,reciterId:'real1',verified:false,
    ended:Promise.resolve(),stop(){stopped=true}})};
  const m=mock({mode:'both'},bridge);m.api.start(m.row);await settle();
  assert.equal(stopped,true);assert.equal(m.api.status().stats.errors,1);
  assert.equal(m.utter.length,0);
 });
 await check('Wrong reciter ID is rejected',async()=>{
  const bridge={selected:()=>({id:'correct',name:'القارئ'}),
   playOne:async()=>({surah:1,ayah:4,reciterId:'other',verified:true,
    ended:Promise.resolve(),stop(){}})};
  const m=mock({mode:'both'},bridge);m.api.start(m.row);await settle();
  assert.equal(m.api.status().stats.errors,1);assert.equal(m.utter.length,0);
 });
 await check('Stop cancels TTS still speaking',async()=>{
  const m=mock({mode:'tafsir'},null,{neverEnd:true});
  m.api.start(m.row);await settle();m.api.stop('stop');
  assert.equal(m.api.status().running,false);assert.ok(m.cancelCount()>0);
 });
 await check('Recitation-only never feeds Quran into TTS',async()=>{
  const bridge={selected:()=>({id:'real1',name:'القارئ'}),
   playOne:async()=>({surah:1,ayah:4,reciterId:'real1',verified:true,
    ended:Promise.resolve(),stop(){}})};
  const m=mock({mode:'recitation'},bridge);m.api.start(m.row);await settle();
  assert.equal(m.utter.length,0);
 });
 await check('Auto-next disabled until device acceptance',async()=>{
  const m=mock({mode:'tafsir'});assert.equal(m.api.status().options.autoNext,false);
 });
 await check('Page-hide cancels voice session',async()=>{
  const m=mock({mode:'tafsir'},null,{neverEnd:true});
  m.api.start(m.row);await settle();m.callbacks.pagehide();
  assert.equal(m.api.status().running,false);
 });
 await check('Explicit stop cannot auto-restart after late TTS event',async()=>{
  const m=mock({mode:'tafsir'},null,{neverEnd:true});
  m.api.start(m.row);await settle();m.api.stop('stop');await settle();
  assert.equal(m.api.status().running,false);assert.equal(m.api.status().stats.starts,1);
 });
 await check('Local-only privacy setting refuses remote-only Arabic TTS',async()=>{
  const m=mock({mode:'tafsir'},null,{remoteOnly:true});
  assert.equal(m.api.start(m.row),false);assert.equal(m.utter.length,0);
 });
 await check('Cloud fallback requires explicit user opt-in',async()=>{
  const m=mock({mode:'tafsir',preferLocal:false},null,{remoteOnly:true});
  assert.equal(m.api.start(m.row),true);await settle();
  assert.ok(m.utter.length>0);
 });
 console.log(JSON.stringify({pass:count,total:12,environment:'mocked DOM and browser TTS, not Android'}));
}
if(typeof module!=='undefined'&&module.exports)module.exports=main;
if(typeof require!=='undefined'&&require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
