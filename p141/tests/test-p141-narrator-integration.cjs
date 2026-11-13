'use strict';
/* P135 mocked integration: exact recorded ayah BEFORE Tafsir native TTS. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../p121/owner-qa/modules/tafsir');
const load=p=>fs.readFileSync(path.join(root,p),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function txt(value){return {nodeType:3,nodeValue:value,nextSibling:null}}
function el(name,children=[]){
 const out={nodeType:1,tagName:name.toUpperCase(),className:'',
  hasAttribute:()=>false,getAttribute:()=>null,matches:()=>false};
 children.forEach((v,i)=>{v.nextSibling=children[i+1]||null});
 out.firstChild=children[0]||null;
 Object.defineProperty(out,'textContent',{get:()=>children.map(c=>c.nodeType===3?c.nodeValue:c.textContent).join('')});
 return out;
}
function setup({mode='both',reciterId='maher'}={}){
 const log=[],audios=[],nativeSpoken=[],toasts=[],store={v170Reciter:'husary'};
 const body=el('div',[el('h3',[txt('اللمسة البيانية')]),el('p',[txt('إن في هذه الآية بيانًا لمعنى عظيم في حياة المسلم.')])]);
 const row={isConnected:true,className:'',
  getAttribute:k=>k==='data-t2ayah'?'4':k==='data-t5-s'?'1':k==='data-t5-type'?'basair':null,
  querySelector:s=>s==='.v194T2Body'?body:null};
 const selector={value:'husary'},reader={classList:{contains:n=>n==='active'}};
 const d={readyState:'complete',hidden:false,
  body:{appendChild(){}},
  getElementById:id=>id==='sequenceReciterV17'?selector:id==='tafsirReader'?reader:
   id==='tafsirAyahs'?{querySelectorAll:()=>[]}:null,
  querySelectorAll:()=>[],addEventListener(){},
  createElement:tag=>{
   if(tag==='audio'){
    const a={paused:true,src:'',onended:null,onerror:null,preload:'',playsInline:true,
     pause(){this.paused=true},load(){},removeAttribute(name){if(name==='src')this.src=''},
     play(){log.push('recitation');this.paused=false;return Promise.resolve()}};
    audios.push(a);return a;
   }
   return {tagName:tag,hidden:false,addEventListener(){},setAttribute(){},querySelector:()=>null,appendChild(){}};
  }
 };
 const tts={
  capabilities:()=>JSON.stringify({ready:true,voices:[{name:'العربية',lang:'ar-SA',localService:true}]}),
  speak:(id,value)=>{nativeSpoken.push({id,value});log.push('tafsir');return true;},
  stop:()=>log.push('native-stop')
 };
 const w={localStorage:{getItem:k=>k==='basair:tafsir:natiq:p132:prefs'?JSON.stringify({mode,reciterId,preferLocal:true}):store[k]||null,
  setItem:(k,v)=>{if(k==='v170Reciter')throw Error('MUTATED TILAWA');store[k]=v}},
  location:{href:'file:///android_asset/www/index.html'},
  BasairNativeArabicTts:tts,setTimeout,clearTimeout,addEventListener(){},
  MutationObserver:function(){this.observe=function(){};this.disconnect=function(){}},
  __BASAIR_TAFSIR_CORE__:{toast:v=>toasts.push(v)}};
 new Function('window','document',load('p136-ayah-catalog.js'))(w,d);
 new Function('window','document',load('p136-reciter-bridge.js'))(w,d);
 new Function('window','document',load('p141-natiq.js'))(w,d);
 return {api:w.__BASAIR_TAFSIR_NATIQ_P132__,bridge:w.__BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__,
  w,row,audios,nativeSpoken,log,toasts,selector,store};
}
async function main(){
 let pass=0;async function check(n,fn){await fn();console.log('PASS '+n);pass++;}
 await check('both mode starts selected reciter MP3 before TTS',async()=>{
  const m=setup();assert.equal(m.api.start(m.row),true);
  assert.equal(m.audios.length,1);
  assert.match(m.audios[0].src,/Maher_AlMuaiqly_64kbps\/001004\.mp3$/);
  assert.equal(m.nativeSpoken.length,0);
  assert.equal(m.selector.value,'husary');
  m.audios[0].onended();await sleep(480);
  const spoken=m.nativeSpoken.length,firstRecording=m.log.indexOf('recitation'),firstTafsir=m.log.indexOf('tafsir');
  m.api.stop();
  assert.ok(spoken>=1);
  assert.ok(firstRecording>=0&&firstTafsir>firstRecording,'recording must precede Tafsir TTS');
 });
 await check('Quran-only mode creates no synthetic TTS',async()=>{
  const m=setup({mode:'recitation',reciterId:'alafasy'});
  assert.equal(m.api.start(m.row),true);
  assert.equal(m.nativeSpoken.length,0);
  assert.match(m.audios[0].src,/Alafasy_64kbps\/001004\.mp3$/);
  m.audios[0].onended();await sleep(30);
  assert.equal(m.nativeSpoken.length,0);m.api.stop();
 });
 await check('both mode with invalid reciter falls back to Tafsir only',()=>{
  const m=setup({mode:'both',reciterId:'invalid_reciter'});
  assert.equal(m.api.start(m.row),true);
  assert.equal(m.audios.length,0);assert.equal(m.nativeSpoken.length,1);
  assert.ok(m.toasts.some(v=>/غير متاح/.test(v)));
  m.api.stop();
 });
 await check('Follow selection is never overwritten by narrator custom selection',()=>{
  const m=setup({mode:'both',reciterId:'sudais'});
  assert.equal(m.api.start(m.row),true);
  assert.match(m.audios[0].src,/Abdurrahmaan_As-Sudais_64kbps\/001004\.mp3$/);
  assert.equal(m.selector.value,'husary');assert.equal(m.store.v170Reciter,'husary');m.api.stop();
 });
 await check('broken remote verse track degrades to Tafsir without synthetic Quran',async()=>{
  const m=setup({mode:'both',reciterId:'alafasy'});
  assert.equal(m.api.start(m.row),true);
  const a=m.audios[0];assert.ok(a&&typeof a.onerror==='function');
  a.onerror(); // first EveryAyah URL fails; attempt same-reader alternate
  assert.ok(typeof a.onerror==='function');
  a.onerror(); // second source also fails
  await sleep(600);
  const spoken=m.nativeSpoken.length;
  m.api.stop();
  assert.ok(spoken>0,'Tafsir voice must resume after verse source failure');
  assert.ok(m.toasts.some(msg=>/تعذر تشغيل تسجيل الآية/.test(msg)));
  assert.equal(m.selector.value,'husary');
 });
 console.log(JSON.stringify({pass,total:5,device:'NOT TESTED',remoteMP3:'NOT VERIFIED'}));
}
main().catch(e=>{console.error(e);process.exitCode=1});
