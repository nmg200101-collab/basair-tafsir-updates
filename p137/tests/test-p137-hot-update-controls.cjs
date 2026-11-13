'use strict';
/* Simulates real OTA takeover: P136 document and window capture handlers remain.
 * No native Android claim. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../p121/owner-qa/modules/tafsir/p137-natiq.js'),'utf8');
const match=(node,sel)=>sel.split(',').some(p=>p.trim().slice(1)===node.className);
function node(cls=''){
 return {nodeType:1,className:cls,hidden:false,children:[],parentElement:null,attrs:{},
  setAttribute(k,v){this.attrs[k]=String(v)},
  getAttribute(k){return this.attrs[k]||null},
  appendChild(v){v.parentElement=this;this.children.push(v);return v},
  insertAdjacentElement(pos,v){
   assert.equal(pos,'afterend');let p=this.parentElement;assert.ok(p);
   const at=p.children.indexOf(this);assert.ok(at>=0);
   v.parentElement=p;p.children.splice(at+1,0,v);return v;
  },
  closest(sel){for(let x=this;x;x=x.parentElement)if(match(x,sel))return x;return null},
  querySelector(sel){
   if(sel==='.v194T2Body')return this.body||null;
   const c=sel.slice(1);return this.children.find(v=>v.className===c)||null;
  },
  querySelectorAll(sel){return this.children.filter(v=>v.className===sel.slice(1))},
  addEventListener(){}
 };
}
const host=node('host'),row=node('v194T2Ayah'),old=node('p132NatiqButton');
host.appendChild(row);row.appendChild(old);
const reader={classList:{contains:s=>s==='active'}};
const panels=[],wEvents={};
let legacyConsumed=0,oldStops=0,stored={autoNext:false};
const oldApi={version:'P136-RECITER-SETTINGS-ARABIC-PRONUNCIATION-QA',stop(){oldStops++}};
function makePanel(){
 const p=node('panel');p.id='p132Panel';p.attrs={};p.innerHTML='';p.options={};p.remove=function(){this.removed=true};
 p.querySelector=function(sel){
  if(sel==='[data-p132-option="reciterId"]'&&!this.innerHTML.includes('data-p132-option="reciterId"'))return null;
  if(sel==='[data-p132-option="voiceURI"]'&&!this.innerHTML.includes('data-p132-option="voiceURI"'))return null;
  if(!this.options[sel]){
   this.options[sel]={value:'',checked:false,type:sel.includes('autoNext')?'checkbox':'select',textContent:'',appendChild(){}};
  }
  return this.options[sel];
 };
 return p;
}
const stale=makePanel();stale.innerHTML='P136';panels.push(stale);
const d={
 readyState:'complete',hidden:false,body:{appendChild(v){panels.push(v)}},
 getElementById(id){
  if(id==='tafsirReader')return reader;
  if(id==='tafsirAyahs')return host;
  if(id==='p132Panel')return panels.filter(p=>!p.removed).at(-1)||null;
  return null;
 },
 createElement(t){return t==='div'?makePanel():node('')},
 addEventListener(){},querySelectorAll(){}
};
host.querySelectorAll=function(sel){
 if(sel.includes('v194T2Ayah'))return [row];
 if(sel==='.p137NatiqNext')return row.querySelectorAll(sel);
 return [];
};
const writes=[];
const w={
 __BASAIR_TAFSIR_NATIQ_P132__:oldApi,
 __BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__:{
  selected(id){return {id:id==='follow'?'alafasy':id,name:'قارئ'}},
  list(){return ['alafasy','husary','minshawy','abdulbasit','sudais','maher','shuraym'].map(id=>({id,name:id}))},
  playOne(){},diagnostics(){return {exactAyahCatalogAvailable:true}}
 },
 localStorage:{
  getItem(){return JSON.stringify({mode:'both',reciterId:'maher',autoNext:false,preferLocal:true})},
  setItem(k,v){stored=JSON.parse(v);writes.push(stored)}
 },
 addEventListener(k,f){(wEvents[k]??=[]).push(f)},
 setTimeout,clearTimeout,
 MutationObserver:function(){this.observe=function(){};this.disconnect=function(){}}
};
wEvents.click=[e=>{if(e.target.closest('.p132NatiqButton')){legacyConsumed++;e.stopImmediatePropagation()}}];
new Function('window','document',src)(w,d);
const api=w.__BASAIR_TAFSIR_NATIQ_P132__;
function dispatch(target){
 const ev={target,stopped:false,stopImmediatePropagation(){this.stopped=true},
  preventDefault(){},stopPropagation(){}};
 for(const fn of (wEvents.click||[])){if(ev.stopped)break;fn(ev)}
}
let count=0;
function check(title,fn){fn();count++;console.log('PASS '+title)}
check('P137 stops previous narrator and installs fresh API',()=>{
 assert.equal(oldStops,1);assert.notEqual(api,oldApi);assert.match(api.version,/P137/);
});
check('P137 hides but preserves legacy button so old observer cannot recreate it',()=>{
 assert.equal(old.hidden,true);assert.equal(old.disabled,true);assert.equal(row.querySelector('.p132NatiqButton'),old);
});
check('P137 creates a distinct visible narrator button not caught by P136 capture',()=>{
 const b=row.querySelector('.p137NatiqButton');assert.ok(b);
 assert.equal(b.closest('.p132NatiqButton'),null);
 assert.equal(b.hidden,false);
});
check('P137 creates explicit settings and next buttons in Tafsir',()=>{
 assert.ok(row.querySelector('.p137NatiqSettings'));assert.ok(row.querySelector('.p137NatiqNext'));
});
check('Settings gear opens a fresh panel with seven-reader selector',()=>{
 dispatch(row.querySelector('.p137NatiqSettings'));
 assert.equal(legacyConsumed,0);
 const p=panels.at(-1);
 assert.ok(stale.removed);assert.equal(p.hidden,false);
 assert.match(p.innerHTML,/data-p132-option="reciterId"/);
 assert.match(p.innerHTML,/data-p132-option="autoNext"/);
 assert.equal(p.querySelector('[data-p132-option="reciterId"]').value,'maher');
});
check('Quick Next toggle persists and UI updates without Tilawa write',()=>{
 const next=row.querySelector('.p137NatiqNext');
 dispatch(next);assert.equal(api.status().options.autoNext,true);
 assert.equal(stored.autoNext,true);
 assert.equal(next.attrs['aria-pressed'],'true');
 assert.equal(writes.length,1);
 assert.ok(!Object.keys(stored).includes('v170Reciter'));
});
check('Quick Next toggle can be disabled again',()=>{
 const next=row.querySelector('.p137NatiqNext');dispatch(next);
 assert.equal(api.status().options.autoNext,false);assert.equal(stored.autoNext,false);
 assert.equal(next.attrs['aria-pressed'],'false');
});
check('New narrator button never enters the old window capture handler',()=>{
 const btn=row.querySelector('.p137NatiqButton');
 dispatch(btn);assert.equal(legacyConsumed,0);
 // Start may reject here because no real Tafsir body or native TTS.
 assert.equal(api.status().options.reciterId,'maher');
});
console.log(JSON.stringify({pass:count,total:8,device:'NOT TESTED',legacyListenerCaptured:legacyConsumed}));
