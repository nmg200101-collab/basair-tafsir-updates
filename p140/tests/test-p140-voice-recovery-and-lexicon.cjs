'use strict';
/* P140 self-healing voices, conservative phonetic input & global UI cleanup.
 * Simulated JavaScript/Android callbacks only, NOT tested on handset. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../p121/owner-qa/modules/tafsir/p140-natiq.js'),'utf8');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function text(s){return {nodeType:3,nodeValue:s,nextSibling:null}}
function el(tag,children=[]){
 const a={nodeType:1,tagName:tag.toUpperCase(),className:'',hasAttribute:()=>false,
 getAttribute:()=>null,matches:()=>false};
 children.forEach((v,i)=>v.nextSibling=children[i+1]||null);a.firstChild=children[0]||null;
 Object.defineProperty(a,'textContent',{get:()=>children.map(c=>c.nodeType===3?c.nodeValue:c.textContent).join('')});
 return a;
}
function setup({chosen='native:bad',lastGood='',guide=true,sourceOnly=false}={}){
 const initial={mode:'tafsir',voiceURI:chosen,p140ReligiousGuide:guide,preferLocal:true};
 const store={'basair:tafsir:natiq:p132:prefs':JSON.stringify(initial)};
 if(lastGood)store['basair:tafsir:natiq:p132:prefs:verified-voice']=lastGood;
 const pending=[],toasts=[],legacy=[
  {tagName:'BUTTON',hidden:false,disabled:false,attrs:{},getAttribute(k){return this.attrs[k]||null},setAttribute(k,v){this.attrs[k]=v}},
  {tagName:'BUTTON',hidden:false,disabled:false,attrs:{},getAttribute(k){return this.attrs[k]||null},setAttribute(k,v){this.attrs[k]=v}}
 ];
 const body=el('div',[el('h3',[text('المعنى')]),el('p',[text('الله تعالى رحيم. محمد عليه الصلاة والسلام.')])]);
 body.contains=()=>false;
 const row={isConnected:true,getAttribute:k=>k==='data-t2ayah'?'1':k==='data-t5-s'?'1':k==='data-t5-type'?'basair':null,
 querySelector:k=>k==='.v194T2Body'?body:null};
 const rdr={classList:{contains:k=>k==='active'},querySelectorAll:()=>legacy};
 const host={querySelectorAll:()=>[]};
 const doc={readyState:'complete',hidden:false,body:{appendChild(){}},
  getElementById:k=>k==='tafsirReader'?rdr:k==='tafsirAyahs'?host:null,
  createElement:k=>({tagName:k,hidden:false,setAttribute(){},querySelector(){return null},addEventListener(){}}),
  addEventListener(){},querySelectorAll:()=>[]};
 const native={capabilities:()=>JSON.stringify({ready:true,voices:[
  {name:'bad',lang:'ar-SA',localService:true},{name:'good',lang:'ar-SA',localService:true}]}),
  speak:(id,value,rate,voice)=>{pending.push({id,value,voice});return true},
  stop(){}};
 const win={localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}},
  BasairNativeArabicTts:native,setTimeout,clearTimeout,addEventListener(){},
  MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{}},
  __BASAIR_TAFSIR_CORE__:{toast:s=>toasts.push(s)}
 };
 if(sourceOnly){delete win.BasairNativeArabicTts}
 new Function('window','document',source)(win,doc);
 return {win,api:win.__BASAIR_TAFSIR_NATIQ_P132__,pending,toasts,store,legacy,row,
  emit:(i,type)=>win.__BASAIR_P133_NATIVE_TTS_EVENT__(pending[i].id,type)};
}
async function main(){
 let n=0;async function check(name,fn){await fn();n++;console.log('PASS '+name)}
 await check('legacy narrator buttons anywhere inside Tafsir reader are disabled',()=>{
  const m=setup();assert.ok(m.legacy.every(el=>el.hidden&&el.disabled));
  assert.equal(m.api.diagnostics().legacyCleanup,true);
  assert.ok(m.api.status().stats.legacyHidden>=2);m.api.stop();
 });
 await check('guided Allah, Lillah, Allahumma and proper names have no speculative case ending',()=>{
  const m=setup();
  const v=m.api.prepareSpeech('الله، والله، بالله، لله، اللهم، محمد، إبراهيم، موسى، عيسى.');
  for(const word of ['اللَّه','وَاللَّه','بِاللَّه','لِلَّهِ','اللَّهُمَّ','مُحَمَّد','إِبْرَاهِيم','مُوسَى','عِيسَى'])assert.ok(v.includes(word),word+' missing in '+v);
  assert.equal(m.api.prepareSpeech('وَاللَّهُ وَمُحَمَّدٌ'), 'وَاللَّهُ وَمُحَمَّدٌ');
  assert.equal(m.api.prepareSpeech('الله',false),'الله');m.api.stop();
 });
 await check('voice changes use chosen local voice for first native utterance',()=>{
  const m=setup();assert.equal(m.api.start(m.row),true);
  assert.equal(m.pending.length,1);assert.equal(m.pending[0].voice,'bad');m.api.stop();
 });
 await check('failed selected native voice falls back to other local voice, restores setting',async()=>{
  const m=setup();
  m.api.start(m.row);m.emit(0,'error');await wait(370);
  assert.equal(m.pending.length,2);
  assert.equal(m.pending[1].voice,'good');
  m.emit(1,'start');m.emit(1,'end');await wait(30);
  assert.equal(m.api.status().options.voiceURI,'native:good');
  assert.equal(m.api.status().stats.voiceReverted,1);
  assert.equal(m.store['basair:tafsir:natiq:p132:prefs:verified-voice'],'native:good');
  m.api.stop();
 });
 await check('failed preview returns to previously verified local voice',()=>{
  const m=setup({lastGood:'native:good'});assert.equal(m.api.preview(),true);
  assert.equal(m.pending[0].voice,'bad');
  m.emit(0,'error');
  assert.equal(m.api.status().options.voiceURI,'native:good');
  assert.ok(m.toasts.some(x=>/الصوت/.test(x)));m.api.stop();
 });
 await check('audio switch never creates network voice provider or Quran TTS',()=>{
  assert.ok(!source.includes('SpeechSynthesisUtterance(s.verse'));
  const m=setup();assert.equal(m.api.status().options.voiceSource,'local');
  assert.equal(m.api.diagnostics().serverAvailable,false);m.api.stop();
 });
 console.log(JSON.stringify({pass:n,total:6,device:'NOT TESTED',privacy:'local only'}));
}
main().catch(e=>{console.error(e);process.exitCode=1});
