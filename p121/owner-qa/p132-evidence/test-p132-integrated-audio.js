'use strict';
/* Full P132.2 adapter→Natiq integration (simulated browser, no real audio).
 * Run: node p121/owner-qa/p132-evidence/test-p132-integrated-audio.js */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../modules/tafsir');
const bridgeSrc=fs.readFileSync(path.join(dir,'p132-reciter-bridge.js'),'utf8');
const natiqSrc=fs.readFileSync(path.join(dir,'p132-natiq.js'),'utf8');
function node(tag,children=[]){
 const n={nodeType:1,tagName:tag.toUpperCase(),className:'',hasAttribute:()=>false,getAttribute:()=>null,matches:()=>false};
 for(let i=0;i<children.length;i++)children[i].nextSibling=children[i+1]||null;
 n.firstChild=children[0]||null;
 n.textContent=children.map(x=>x.nodeType===3?x.nodeValue:x.textContent).join('');
 return n;
}
function txt(s){return {nodeType:3,nodeValue:s,nextSibling:null}}
function mock({mode='both',catalog=true,record={},reader='masad',localVoice=true,blocked=false,autoFinishTTS=true}={}){
 const events=[],audio=[],spoken=[],toasts=[],settings={mode,autoNext:false};
 const rbody=node('div',[node('h3',[txt('اللمسة البيانية')]),node('p',[txt('شرح كامل للآية.')])]);
 const row={isConnected:true,getAttribute:attr=>attr==='data-t2ayah'?'4':attr==='data-t5-s'?'1':attr==='data-t5-type'?'basair':null,
  querySelector:s=>s==='.v194T2Body'?rbody:null};
 let panel=null;
 const document={
  readyState:'complete',hidden:false,body:{appendChild:p=>panel=p},
  getElementById:id=>id==='tafsirReader'?{classList:{contains:k=>k==='active'}}:
    id==='tafsirAyahs'?{querySelectorAll:()=>[]}:id==='p132Panel'?panel:null,
  querySelectorAll:()=>[],addEventListener(){},
  createElement:tag=>{
   if(tag==='audio'){let a={onended:null,onerror:null,src:'',pause(){events.push('quran-pause')},
      removeAttribute(){},load(){},play(){events.push('quran-play');return blocked?Promise.reject(new Error('rejected')):Promise.resolve()}};audio.push(a);return a}
   return {tagName:tag,hidden:false,addEventListener(){},setAttribute(){},querySelector:()=>null};
  }
 };
 const win={location:{href:'https://app.basair.quran/'},
  localStorage:{getItem:()=>JSON.stringify(settings),setItem(){}},
  __BASAIR_R109_SELECTED__:{_test:{state:{reader:{id:reader,name:'القارئ المختار'}}}},
  __BASAIR_TAFSIR_EXACT_AYAH_AUDIO_CATALOG__:catalog?{
   getExact:()=>Object.assign({kind:'single-ayah',verified:true,surah:1,ayah:4,reciterId:reader,url:'https://trusted.example/one.mp3',durationScope:'single-ayah'},record)
  }:null,
  __BASAIR_TAFSIR_CORE__:{toast:x=>toasts.push(x)},
  speechSynthesis:{getVoices:()=>localVoice?[{lang:'ar-SA',localService:true,name:'Arabic'}]:[],
   cancel(){events.push('tts-cancel')},
   speak:u=>{events.push('tts-start');spoken.push(u.text);if(autoFinishTTS)Promise.resolve().then(()=>u.onend&&u.onend())}},
  SpeechSynthesisUtterance:function(value){this.text=value},
  setTimeout,clearTimeout,addEventListener(){}
 };
 new Function('window','document',bridgeSrc)(win,document);
 new Function('window','document',natiqSrc)(win,document);
 return {win,doc:document,row,events,audio,spoken,toasts,
  natiq:win.__BASAIR_TAFSIR_NATIQ_P132__,bridge:win.__BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__};
}
const settle=async()=>{await new Promise(r=>setTimeout(r,250));await new Promise(r=>setTimeout(r,0))};
async function main(){
 let passed=0;
 async function test(name,fn){await fn();passed++;console.log('PASS '+name)}
 await test('Both mode: exact Quran starts before any Arabic TTS',async()=>{
  const m=mock();assert.equal(m.natiq.start(m.row),true);
  assert.equal(m.events.includes('quran-play'),true);assert.equal(m.spoken.length,0);
  m.audio[0].onended();await settle();
  assert.ok(m.events.indexOf('tts-start')>m.events.indexOf('quran-play'));
  assert.match(m.spoken.join(' '),/شرح كامل/);
 });
 await test('No catalog: prevent misleading playback/active button',async()=>{
  const m=mock({catalog:false});assert.equal(m.natiq.start(m.row),false);
  assert.equal(m.audio.length,0);assert.equal(m.spoken.length,0);assert.equal(m.natiq.status().running,false);
 });
 await test('Wrong verse exact recording blocks entire combined sequence',async()=>{
  const m=mock({record:{ayah:5}});assert.equal(m.natiq.start(m.row),false);
  assert.equal(m.audio.length,0);assert.equal(m.spoken.length,0);
 });
 await test('Tafsir-only still works without any reciter catalog',async()=>{
  const m=mock({mode:'tafsir',catalog:false});
  assert.equal(m.natiq.start(m.row),true);await settle();
  assert.ok(m.spoken.some(x=>/شرح/.test(x)));
 });
 await test('Lack of local Arabic voice prevents sending Tafsir to cloud',async()=>{
  const m=mock({mode:'tafsir',localVoice:false});
  assert.equal(m.natiq.start(m.row),false);assert.equal(m.spoken.length,0);
 });
 await test('Stop during reciter playback never starts Tafsir TTS',async()=>{
  const m=mock();m.natiq.start(m.row);m.natiq.stop('إيقاف');
  await settle();assert.equal(m.spoken.length,0);assert.equal(m.natiq.status().running,false);
 });
 await test('Audio play rejection never triggers TTS fallback',async()=>{
  const m=mock({blocked:true});m.natiq.start(m.row);await settle();
  assert.equal(m.spoken.length,0);assert.equal(m.natiq.status().running,false);
  assert.ok(m.natiq.status().stats.errors>=1);
 });
 await test('Wrong reciter from current R109 selection blocks launch',async()=>{
  const m=mock({record:{reciterId:'other'}});assert.equal(m.natiq.start(m.row),false);
  assert.equal(m.audio.length,0);
 });
 console.log(JSON.stringify({pass:passed,total:8,scope:'Node simulated WebView, no actual Android playback'}));
}
if(typeof module!=='undefined'&&module.exports)module.exports=main;
if(typeof require!=='undefined'&&require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
