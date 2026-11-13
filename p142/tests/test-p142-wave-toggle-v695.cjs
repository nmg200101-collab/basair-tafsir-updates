'use strict';
/* P140 wave hot-upgrade emulation, not a physical Android test. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../p121/owner-qa/modules/tafsir/p142-natiq.js'),'utf8');
function matches(el,selector){
 return selector.split(',').some(s=>{
  s=s.trim();
  if(s.startsWith('.'))return el.className===s.slice(1);
  return s==='[data-r3-note-pos]'&&el.className==='b263r3NoteChip';
 });
}
function element(cls='',tag='DIV'){
 const el={nodeType:1,tagName:tag,className:cls,hidden:false,disabled:false,attrs:{},children:[],parentElement:null,innerHTML:'',
  classList:{contains:k=>cls===k,remove(){},add(){}},
  setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]||null},
  appendChild(c){c.parentElement=this;this.children.push(c);return c},
  insertAdjacentElement(k,c){assert.equal(k,'afterend');let p=this.parentElement;
   assert.ok(p,'anchor must be attached');let i=p.children.indexOf(this);
   p.children.splice(i+1,0,c);c.parentElement=p;return c},
  closest(s){for(let el=this;el;el=el.parentElement)if(matches(el,s))return el;return null},
  querySelector(s){return this.querySelectorAll(s)[0]||null},
  querySelectorAll(s){
   const found=[];const walk=n=>{for(const c of n.children){
    if(matches(c,s))found.push(c);walk(c);
   }};walk(this);return found;
  },
  events:{},addEventListener(kind,fn){this.events[kind]=fn}
 };
 return el;
}
const reader={classList:{contains:k=>k==='active'}};
const host=element('host'),row=element('v194T2Ayah');
host.appendChild(row);
const note=element('b263r3NoteChip','BUTTON'),oldP132=element('p132NatiqButton','BUTTON'),
 oldP137=element('p137NatiqButton','BUTTON'),oldGear=element('p137NatiqSettings','BUTTON'),
 oldNext=element('p137NatiqNext','BUTTON'),oldMic=element('p138MicButton','BUTTON'),oldWave=element('p139WaveButton','BUTTON'),olderWave=element('p140WaveButton','BUTTON'),prior141=element('p141WaveButton','BUTTON'),
 nativeV695=element('v695NatiqButton','BUTTON'),nativeLive=element('v695NatiqLive','SMALL'),nativeBar=element('v695NatiqBar');
nativeBar.appendChild(nativeV695);nativeBar.appendChild(nativeLive);
for(const el of [note,nativeBar,oldP132,oldP137,oldGear,oldNext,oldMic,oldWave,olderWave,prior141])row.appendChild(el);
const panels=[],wEvents={};let oldApiStop=0,baseV695Stop=0,legacyInvoked=0;
function panel(){
 const p=element('', 'DIV');p.id='p142VoicePanel';p.fields={};p.setAttribute('data-revision','');
 p.remove=()=>{p.removed=true};
 p.querySelector=function(selector){
  if(selector.startsWith('[data-p132-option="')){
   const m=selector.match(/^\[data-p132-option="([^"]+)"\]$/);if(!m)return null;
   if(!this.innerHTML.includes(selector.slice(1,-1)))return null;
   return this.fields[selector]??=( {type:m[1]==='autoNext'||m[1]==='religiousGuide'?'checkbox':'select',
      value:'',checked:false,textContent:'',appendChild(){}});
  }
  if(selector==='#p142VoiceStatus')return this.fields[selector]??={textContent:''};
  if(selector==='[data-p142-next-switch]'){
   return this.fields[selector]??={
    attrs:{},setAttribute(k,v){this.attrs[k]=v},
    state:{textContent:'متوقفة'},
    querySelector(k){return k==='[data-p142-next-state]'?this.state:null}
   };
  }
  return null;
 };
 return p;
}
const d={readyState:'complete',hidden:false,
 body:{appendChild:p=>panels.push(p)},
 getElementById:id=>id==='tafsirReader'?reader:id==='tafsirAyahs'?host:
   id==='p142VoicePanel'?panels.filter(p=>!p.removed).at(-1)||null:null,
 createElement:tag=>tag==='div'?panel():element('',tag.toUpperCase()),
 addEventListener(){},querySelectorAll(){return []}
};
host.querySelectorAll=s=>s.includes('.v194T2Ayah')?[row]:row.querySelectorAll(s);
const choices=['alafasy','husary','minshawy','abdulbasit','sudais','maher','shuraym'];
let stored={mode:'both',reciterId:'maher',autoNext:true,religiousGuide:true,preferLocal:false};
const writes=[];
const w={
 __BASAIR_TAFSIR_NATIQ_P132__:{version:'P141-DUAL-ROOT-SINGLE-WAVE-QA',stop(){oldApiStop++}},
 __BASAIR_TAFSIR_NATIQ_V695__:{version:'V695',stop(){baseV695Stop++}},
 __BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__:{
  list:()=>choices.map(id=>({id,name:id})),
  selected:id=>({id:id==='follow'?'husary':id,name:id}),
  diagnostics:()=>({exactAyahCatalogAvailable:true}),
  playOne(){}
 },
 localStorage:{getItem:()=>JSON.stringify(stored),setItem:(k,v)=>{stored=JSON.parse(v);writes.push(stored)}},
 addEventListener:(kind,fn)=>(wEvents[kind]??=[]).push(fn),
 setTimeout,clearTimeout,MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{}}
};
wEvents.click=[e=>{if(e.target.closest('.p137NatiqButton')||e.target.closest('.p138MicButton')||e.target.closest('.p139WaveButton'))legacyInvoked++}];
new Function('window','document',source)(w,d);
const api=w.__BASAIR_TAFSIR_NATIQ_P132__;
const btn=row.querySelector('.p142WaveButton');
function event(btn){
 return {target:btn,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){this.stopped=true},pointerId:1,clientX:5,clientY:5};
}
function dispatch(name,target){
 const e=event(target);for(const fn of wEvents[name]||[]){if(e.stopped)break;fn(e)}
}
async function run(){
 let count=0;function check(name,fn){fn();count++;console.log('PASS '+name)}
 check('prior narrator stops exactly once and new narrator takes over',()=>{
  assert.equal(oldApiStop,1);assert.equal(baseV695Stop,1);
  assert.match(api.version,/P142/);
 });
 check('one original-style wave narrator, old mic/gear/next hidden',()=>{
  assert.ok(btn);assert.equal(row.querySelectorAll('.p142WaveButton').length,1);
  for(const legacy of [oldP132,oldP137,oldGear,oldNext,oldMic,oldWave,olderWave,prior141,nativeV695,nativeBar]){
   assert.equal(legacy.hidden,true);if(legacy.tagName==='BUTTON')assert.equal(legacy.disabled,true)
  }
  assert.ok(btn.innerHTML.includes('◖))'));
  assert.equal(nativeLive.hidden,true);
  assert.equal(row.querySelector('.p138NatiqSettings'),null);
  assert.equal(btn.parentElement,row,'new wave must NOT be mounted inside hidden native V695 bar');
  assert.equal(nativeV695.getAttribute('aria-hidden'),'true');
  assert.equal(nativeBar.getAttribute('aria-hidden'),'true');
  assert.equal(api.diagnostics().originalV695Cleanup,true);
 });
 check('old P137/P138/P139 click handlers do not intercept P140 wave',()=>{
  dispatch('click',btn);assert.equal(legacyInvoked,0);
 });
 check('cloud is explicitly disabled and no remote preference is inherited',()=>{
  assert.equal(api.status().options.voiceSource,'local');
  assert.equal(api.status().options.preferLocal,true);
  assert.equal(api.diagnostics().serverAvailable,false);
  assert.equal(api.status().options.religiousGuide,true);
 });
 dispatch('pointerdown',btn);
 await new Promise(r=>setTimeout(r,630));
 check('long press opens one full RTL settings sheet',()=>{
  const p=panels.at(-1);assert.equal(p.hidden,false);
  assert.ok(p.innerHTML.includes('data-p132-option="reciterId"'));
  assert.ok(p.innerHTML.includes('data-p142-next-switch'));
  assert.ok(p.innerHTML.includes('value="server" disabled'));
  assert.equal(p.fields['[data-p132-option="reciterId"]'].value,'maher');
 });
 check('long press cannot accidentally start narration',()=>{
  assert.equal(api.status().running,false);
  dispatch('click',btn);
  assert.equal(api.status().running,false);
 });
 const p=panels.at(-1),sw=p.querySelector('[data-p142-next-switch]');
 const makeClick=()=>({target:{closest:s=>s==='[data-p142-next-switch]'?sw:null},preventDefault(){},stopPropagation(){}});
 check('Next switch restores previously enabled state',()=>{
  assert.equal(api.status().options.autoNext,true);
  assert.equal(sw.attrs['aria-checked'],'true');
  assert.equal(sw.state.textContent,'مفعّلة');
 });
 p.events.click(makeClick());
 check('one press disables Next and saves immediately',()=>{
  assert.equal(api.status().options.autoNext,false);
  assert.equal(sw.attrs['aria-checked'],'false');
  assert.equal(sw.state.textContent,'متوقفة');
  assert.equal(writes.at(-1).autoNext,false);
 });
 api.settings();
 check('reopening settings keeps Next switched off',()=>{
  assert.equal(sw.attrs['aria-checked'],'false');
  assert.equal(writes.at(-1).autoNext,false);
 });
 p.events.click(makeClick());
 check('second press re-enables Next and persists',()=>{
  assert.equal(api.status().options.autoNext,true);
  assert.equal(sw.attrs['aria-checked'],'true');
  assert.equal(writes.at(-1).autoNext,true);
 });
 check('Quran recording is not generated by TTS',()=>{
  assert.ok(source.includes('function readQuran('));
  assert.ok(source.includes('verified!==true'));
  assert.ok(!source.includes('SpeechSynthesisUtterance(s.verse'));
 });
 console.log(JSON.stringify({pass:count,total:11,physicalDevice:'NOT TESTED',server:'NOT CONFIGURED',nativeV695Hidden:true}));
}
run().catch(e=>{console.error(e);process.exitCode=1});
