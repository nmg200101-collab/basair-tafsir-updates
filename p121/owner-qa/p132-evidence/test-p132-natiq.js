'use strict';
/* P132 isolated Node regression; no Android WebView or native TTS.
   Run from repo root: node p121/owner-qa/p132-evidence/test-p132-natiq.js */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const js=fs.readFileSync(path.resolve(__dirname,'../modules/tafsir/p132-natiq.js'),'utf8');
function createNode(tag,children=[],classes=''){
 const o={nodeType:1,tagName:tag.toUpperCase(),className:classes,childNodes:children,
  hasAttribute:()=>false,getAttribute:()=>null,matches:()=>false,
  querySelectorAll:()=>[],querySelector:()=>null};
 for(let i=0;i<children.length;i++)children[i].nextSibling=children[i+1]||null;
 o.firstChild=children[0]||null;
 Object.defineProperty(o,'textContent',{get:()=>children.map(c=>c.nodeType===3?c.nodeValue:c.textContent).join('')});
 return o;
}
function t(x){return {nodeType:3,nodeValue:x,nextSibling:null}}
function body(sections){
 const nodes=[];
 for(const [title,paragraphs] of sections){
  if(title)nodes.push(createNode('h3',[t(title)]));
  paragraphs.forEach(p=>nodes.push(createNode('p',[t(p)])));
 }
 return createNode('div',nodes,'v194T2Body');
}
function install(){
 const root={querySelector:()=>null},mockDoc={
  readyState:'loading',addEventListener(){},getElementById(){return null}};
 const mockWin={localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout};
 new Function('window','document',js)(mockWin,mockDoc);
 return mockWin.__BASAIR_TAFSIR_NATIQ_P132__;
}
const api=install();let pass=0;
function check(title,run){run();pass++;console.log('PASS '+title)}
check('API initialized and versioned',()=>assert.match(api.version,/P132/));
check('Prophetic blessing ligature expanded',()=>assert.equal(api.normalize('قال رسول الله ﷺ'),'قال رسول الله صلى الله عليه وسلم'));
check('Divine honorific expanded',()=>assert.equal(api.normalize('الله ﷻ'),'الله جل جلاله'));
check('Basmala expands correctly',()=>assert.equal(api.normalize('﷽'),'بسم الله الرحمن الرحيم'));
check('Allah ligature expands correctly',()=>assert.equal(api.normalize('ﷲ'),'الله'));
check('Quran ornamentals suppressed but words retained',()=>assert.equal(api.normalize('﴿ الحمد ۞ لله ﴾'),'الحمد لله'));
check('Arabic spelling preserved',()=>assert.equal(api.normalize('إِنَّ اللَّهَ غَفُورٌ'),'إِنَّ اللَّهَ غَفُورٌ'));
check('Punctuation yields pauses not spoken symbols',()=>assert.equal(api.normalize('أولاً: ثم؛ التالي؟'),'أولاً، ثم، التالي؟'));
check('Basair rhetorical heading becomes lecturer transition',()=>assert.match(api.sayHeading('اللمسة البيانية'),/اللمسة البيانية/));
check('Tadabbur heading becomes transition',()=>assert.match(api.sayHeading('التدبر'),/لطائف التدبر/));
check('Unknown source heading read faithfully',()=>assert.equal(api.sayHeading('الناسخ والمنسوخ'),'الناسخ والمنسوخ'));
check('Tafsir sections read in original order',()=>{
 const b=body([['البيان',['شرح أول.','شرح ثانٍ.']],['اللمسة البيانية',['نكتة بلاغية.']],['الفوائد',['ثمرة عملية.']]]);
 const rows={querySelector:selector=>selector==='.v194T2Body'?b:null},arr=api.segments(rows);
 assert.equal(arr.length,3);assert.deepEqual(arr.map(x=>x.title),['البيان','اللمسة البيانية','الفوائد']);
 assert.match(arr[0].text,/شرح أول/);assert.match(arr[0].text,/شرح ثان/);
});
check('Works independently of Tafsir source title',()=>{
 for(const name of ['ابن كثير','التفسير الميسر','تفسير بصائر']){
  const content=body([[name,['نص تفسيري من هذا المصدر.']]]);
  const result=api.segments({querySelector:selector=>selector==='.v194T2Body'?content:null});
  assert.equal(result[0].title,name);assert.match(result[0].text,/نص تفسيري/);
 }
});
check('Buttons and Quran row are excluded from Tafsir speech',()=>{
 const x=createNode('div',[t('نص التفسير'),createNode('button',[t('انسخ الآية')])]);
 const row={querySelector:selector=>selector==='.v194T2Body'?x:null};
 assert.equal(api.segments(row)[0].text,'نص التفسير');
});
check('No Tafsir body: do not recite Quran text as Tafsir',()=>assert.equal(api.segments({querySelector:()=>null}).length,0));
check('Long Tafsir is never truncated or dropped',()=>{
 const input=Array.from({length:900},(_,i)=>'كلمة'+i).join(' ');
 const chunks=api.splitSpeech(input,175);
 assert.ok(chunks.length>25);assert.equal(chunks.join(' '),api.normalize(input));
});
check('A long single word is not discarded',()=>assert.equal(api.splitSpeech('ا'.repeat(300))[0],'ا'.repeat(300)));
check('No native or Tilawa modifications in P132 module',()=>{
 assert.equal(js.includes('setInterval('),false);
 assert.equal(js.includes('tilawaAudio'),false);
 assert.equal(js.includes('speechSynthesis.speak('),true);
 assert.equal(js.includes('handle.verified!==true'),true);
});
check('Both mode defaults to no automatic next without field QA',()=>{
 const s=api.status();assert.equal(s.options.mode,'both');assert.equal(s.options.autoNext,false);
});
check('Source bridge required for exact Quran recording',()=>assert.equal(api.capabilities().verifiedAyahAudioBridge,false));
console.log(JSON.stringify({pass,total:20,scope:'isolated Node tests; not Android sound proof',live:'NO RELEASE'}));
