'use strict';
/* P138 UI hot-upgrade emulation, not a physical Android test. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../p121/owner-qa/modules/tafsir/p138-natiq.js'),'utf8');
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
  querySelector(s){return this.children.find(el=>matches(el,s))||null},
  querySelectorAll(s){return this.children.filter(el=>matches(el,s))},
  addEventListener(){}
 };
 return el;
}
const reader={classList:{contains:k=>k==='active'}};
const host=element('host'),row=element('v194T2Ayah');
host.appendChild(row);
const note=element('b263r3NoteChip','BUTTON'),oldP132=element('p132NatiqButton','BUTTON'),
 oldP137=element('p137NatiqButton','BUTTON'),oldGear=element('p137NatiqSettings','BUTTON'),
 oldNext=element('p137NatiqNext','BUTTON');
for(const el of [note,oldP132,oldP137,oldGear,oldNext])row.appendChild(el);
const panels=[],wEvents={};let oldApiStop=0,legacyInvoked=0;
function panel(){
 const p=element('', 'DIV');p.id='p138NatiqPanel';p.fields={};p.setAttribute('data-revision','');
 p.remove=()=>{p.removed=true};
 p.querySelector=function(selector){
  if(selector.startsWith('[data-p132-option="')){
   const m=selector.match(/^\[data-p132-option="([^"]+)"\]$/);if(!m)return null;
   if(!this.innerHTML.includes(selector.slice(1,-1)))return null;
   return this.fields[selector]??=( {type:m[1]==='autoNext'||m[1]==='religiousGuide'?'checkbox':'select',
      value:'',checked:false,textContent:'',appendChild(){}});
  }
  if(selector==='#p138NatiqStatus')return this.fields[selector]??={textContent:''};
  return null;
 };
 return p;
}
const d={readyState:'complete',hidden:false,
 body:{appendChild:p=>panels.push(p)},
 getElementById:id=>id==='tafsirReader'?reader:id==='tafsirAyahs'?host:
   id==='p138NatiqPanel'?panels.filter(p=>!p.removed).at(-1)||null:null,
 createElement:tag=>tag==='div'?panel():element('',tag.toUpperCase()),
 addEventListener(){},querySelectorAll(){return []}
};
host.querySelectorAll=s=>s.includes('.v194T2Ayah')?[row]:[];
const choices=['alafasy','husary','minshawy','abdulbasit','sudais','maher','shuraym'];
const stored={mode:'both',reciterId:'maher',autoNext:true,religiousGuide:true,preferLocal:false};
const writes=[];
const w={
 __BASAIR_TAFSIR_NATIQ_P132__:{version:'P137-STABLE-NATIQ-SETTINGS-NEXT-QA',stop(){oldApiStop++}},
 __BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__:{
  list:()=>choices.map(id=>({id,name:id})),
  selected:id=>({id:id==='follow'?'husary':id,name:id}),
  diagnostics:()=>({exactAyahCatalogAvailable:true}),
  playOne(){}
 },
 localStorage:{getItem:()=>JSON.stringify(stored),setItem:(k,v)=>writes.push(JSON.parse(v))},
 addEventListener:(kind,fn)=>(wEvents[kind]??=[]).push(fn),
 setTimeout,clearTimeout,MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{}}
};
wEvents.click=[e=>{if(e.target.closest('.p137NatiqButton'))legacyInvoked++}];
new Function('window','document',source)(w,d);
const api=w.__BASAIR_TAFSIR_NATIQ_P132__;
const btn=row.querySelector('.p138MicButton');
function event(btn){
 return {target:btn,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){this.stopped=true},pointerId:1,clientX:5,clientY:5};
}
function dispatch(name,target){
 const e=event(target);for(const fn of wEvents[name]||[]){if(e.stopped)break;fn(e)}
}
async function run(){
 let count=0;function check(name,fn){fn();count++;console.log('PASS '+name)}
 check('prior narrator stops exactly once and new narrator takes over',()=>{
  assert.equal(oldApiStop,1);assert.match(api.version,/P138/);
 });
 check('one compact mic, old narrator and gear/next hidden',()=>{
  assert.ok(btn);assert.equal(row.querySelectorAll('.p138MicButton').length,1);
  for(const legacy of [oldP132,oldP137,oldGear,oldNext]){
   assert.equal(legacy.hidden,true);assert.equal(legacy.disabled,true)
  }
  assert.ok(btn.innerHTML.includes('<svg'));
  assert.equal(row.querySelector('.p138NatiqSettings'),null);
 });
 check('P137 click capture does not recognize P138 mic',()=>{
  dispatch('click',btn);assert.equal(legacyInvoked,0);
 });
 check('cloud is explicitly disabled and no remote preference is inherited',()=>{
  assert.equal(api.status().options.voiceSource,'local');
  assert.equal(api.status().options.preferLocal,true);
  assert.equal(api.diagnostics().serverAvailable,false);
  assert.equal(api.status().options.religiousGuide,false);
 });
 dispatch('pointerdown',btn);
 await new Promise(r=>setTimeout(r,630));
 check('long press opens one full RTL settings sheet',()=>{
  const p=panels.at(-1);assert.equal(p.hidden,false);
  assert.ok(p.innerHTML.includes('data-p132-option="reciterId"'));
  assert.ok(p.innerHTML.includes('data-p132-option="autoNext"'));
  assert.ok(p.innerHTML.includes('value="server" disabled'));
  assert.equal(p.fields['[data-p132-option="reciterId"]'].value,'maher');
 });
 check('long press cannot accidentally start narration',()=>{
  assert.equal(api.status().running,false);
  dispatch('click',btn);
  assert.equal(api.status().running,false);
 });
 check('Quran recording is not generated by TTS',()=>{
  assert.ok(source.includes('function readQuran('));
  assert.ok(source.includes('verified!==true'));
  assert.ok(!source.includes('SpeechSynthesisUtterance(s.verse'));
 });
 console.log(JSON.stringify({pass:count,total:7,physicalDevice:'NOT TESTED',server:'NOT CONFIGURED'}));
}
run().catch(e=>{console.error(e);process.exitCode=1});
