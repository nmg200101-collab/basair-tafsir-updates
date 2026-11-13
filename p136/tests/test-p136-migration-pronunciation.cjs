'use strict';
/* P136: simulated migration of a legacy P134/P135 narrator; never a phone test. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../p121/owner-qa/modules/tafsir/p136-natiq.js'),'utf8');
function makePanel(attrs={}){
 const options={},listeners={},children=[];
 return {
  id:'p132Panel',hidden:true,innerHTML:'',attrs,
  setAttribute(k,v){this.attrs[k]=v},
  getAttribute(k){return this.attrs[k]||null},
  addEventListener(k,f){listeners[k]=f},
  appendChild(c){children.push(c)},
  querySelector(k){
   if(k==='[data-p132-option="reciterId"]')return this.innerHTML.includes('data-p132-option="reciterId"')?(options[k]??={value:'follow',textContent:'',appendChild(){}}):null;
   if(k==='[data-p132-option="voiceURI"]')return this.innerHTML.includes('data-p132-option="voiceURI"')?(options[k]??={value:'',textContent:'',appendChild(){}}):null;
   if(k.startsWith('[data-p132-option="'))return {value:'',type:'select',checked:false,appendChild(){}};
   if(k==='#p132NatiqStatus')return {textContent:''};
   return null;
  },
  remove(){this.removed=true},
  listeners
 };
}
const checks=[];
function assertCheck(title,fn){fn();checks.push(title);console.log('PASS '+title)}
let stale=makePanel();stale.innerHTML='P134 settings without the reciter list';
let oldStops=0,oldAPI={version:'P134-VOICE-RECOVERY-QA-NOT-LIVE',stop(){oldStops++}};
let panels=[stale],winEvents={},docEvents={};
const mockReader={classList:{contains:k=>k==='active'}};
const doc={
 readyState:'complete',hidden:false,
 body:{appendChild(p){panels.push(p)}},
 getElementById(id){
  if(id==='tafsirReader')return mockReader;
  if(id==='tafsirAyahs')return {querySelectorAll:()=>[]};
  if(id==='p132Panel')return panels.filter(p=>p.id===id&&!p.removed).slice(-1)[0]||null;
  return null;
 },
 createElement(tag){
  if(tag==='div')return makePanel();
  return {tagName:tag,hidden:false,value:'',setAttribute(){},appendChild(){},addEventListener(){}};
 },
 addEventListener(k,f){docEvents[k]=f},querySelectorAll:()=>[]
};
const win={
 __BASAIR_TAFSIR_NATIQ_P132__:oldAPI,
 localStorage:{getItem(){return JSON.stringify({mode:'both',reciterId:'maher',preferLocal:true,rate:0.9})},setItem(){}},
 addEventListener(k,f){winEvents[k]=f},setTimeout,clearTimeout,
 MutationObserver:function(){this.observe=function(){};this.disconnect=function(){}}
};
new Function('window','document',source)(win,doc);
const api=win.__BASAIR_TAFSIR_NATIQ_P132__;
assertCheck('previous narrator stopped before API takeover',()=>{assert.equal(oldStops,1);assert.ok(api!==oldAPI)});
assertCheck('P136 replaces legacy cached settings window',()=>{
 assert.equal(stale.removed,true);
 assert.equal(panels.length,2);assert.equal(doc.getElementById('p132Panel'),panels[1]);
 assert.match(panels[1].innerHTML,/data-p132-option="reciterId"/);
});
assertCheck('preserves owner’s independent reciter setting',()=>{
 assert.equal(api.status().options.reciterId,'maher');assert.equal(api.status().options.mode,'both');
});
assertCheck('P136 installs window capture to avoid old document click handler',()=>{
 assert.equal(typeof winEvents.click,'function');assert.equal(typeof winEvents.pointerdown,'function');
 assert.equal(docEvents.click,undefined);
});
assertCheck('religious pronunciation only modifies known bare words',()=>{
 const input='الله سبحانه وتعالى أنزل القرآن، وأمر بالصلاة والزكاة. والمؤمن يذكر الله.';
 const out=api.prepareSpeech(input);
 assert.ok(out.includes('اللّٰه'));assert.ok(out.includes('الْقُرْآن'));
 assert.ok(out.includes('بِالصَّلَاة'));assert.ok(out.includes('وَالزَّكَاة'));
 assert.ok(!out.includes('<'));assert.ok(!out.includes('undefined'));
});
assertCheck('existing vocalized words and prefix forms remain unchanged',()=>{
 const original='وَاللَّهُ له فضل، والمُلْك للهِ';
 const out=api.prepareSpeech(original);
 assert.equal(out,original);
});
assertCheck('guide can be disabled per utterance, keeping original prose unchanged',()=>{
 const phrase='الله تعالى رحيم';
 assert.equal(api.prepareSpeech(phrase,false),phrase);
 assert.equal(api.prepareSpeech(phrase,true).includes('اللّٰه'),true);
});
assertCheck('panel exposes comparison preview and local-only privacy toggle',()=>{
 const html=panels[1].innerHTML;
 assert.match(html,/data-p136-preview-plain/);
 assert.match(html,/data-p132-option="religiousGuide"/);
 assert.match(html,/data-p132-option="preferLocal"/);
});
assertCheck('migration retains original Quran MP3-only recitation guard',()=>{
 assert.ok(source.includes('var heard=await readQuran(s)'));
 assert.ok(source.includes('function readQuran(s)'));
 assert.ok(!source.includes('SpeechSynthesisUtterance(s.verse'));
});
console.log(JSON.stringify({pass:checks.length,total:9,androidDevice:'NOT TESTED',ttsQuality:'USER ACCEPTANCE REQUIRED'}));
