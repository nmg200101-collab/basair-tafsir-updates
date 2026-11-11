'use strict';
/* P132 real V690 Tafsir STEP2 DOM-shaped regression.
 * Original renderer uses <section class="v194T2Field"><div class="v194T2FieldTitle">
 * <b>Title</b><small>Source</small></div><p>Actual explanation</p></section>.
 * Run: node p121/owner-qa/p132-evidence/test-p132-real-tafsir-dom.js
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../modules/tafsir/p132-natiq.js'),'utf8');
function text(x){return {nodeType:3,nodeValue:x,nextSibling:null}}
function el(tag,cls,children=[]){
 const node={nodeType:1,tagName:tag.toUpperCase(),className:cls||'',
  hasAttribute:()=>false,getAttribute:()=>null,
  matches:function(selector){return selector.split(',').some(s=>{
   s=s.trim();if(s==='[data-tafsir-section-title]')return false;
   return /^\.[\w-]+$/.test(s)&&(' '+this.className+' ').includes(' '+s.slice(1)+' ');
  });}
 };
 for(let i=0;i<children.length;i++)children[i].nextSibling=children[i+1]||null;
 node.firstChild=children[0]||null;
 node.querySelector=function(selector){
  if(selector==='b'&&this.tagName==='DIV')
   return children.find(c=>c.nodeType===1&&c.tagName==='B')||null;
  return null;
 };
 Object.defineProperty(node,'textContent',{get:()=>children.map(c=>c.nodeType===3?c.nodeValue:c.textContent).join('')});
 return node;
}
function field(cls,title,source,textValue){
 return el('section','v194T2Field '+cls,[
  el('div','v194T2FieldTitle',[
   el('b','',[text(title)]),el('small','',[text(source)])]),
  el('p','',[text(textValue)])
 ]);
}
function row(sections,classes=''){
 const body=el('div','v194T2Body',sections);
 return {className:'ayah v194T2Ayah '+classes,querySelector:selector=>selector==='.v194T2Body'?body:null};
}
function install(){
 const d={readyState:'loading',addEventListener(){},getElementById:()=>null};
 const w={localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout};
 new Function('window','document',src)(w,d);return w.__BASAIR_TAFSIR_NATIQ_P132__;
}
async function main(){
 const api=install();let count=0;
 function check(name,fn){fn();count++;console.log('PASS '+name)}
 check('Four real Basair section headings are separated correctly',()=>{
  const x=row([
   field('meaning','المعنى','بصائر القرآن · محلي','شرح المعنى الأول'),
   field('bayan','اللمسة البيانية','بيان لغوي وسياقي محرر','جمال الصورة البيانية'),
   field('tadabbur','التدبر والمعرفة','تدبر محرر','ثمرة التدبر في الآية'),
   field('summary','الخلاصة والفائدة','خلاصة محررة','الفائدة العملية الأخيرة')
  ]);
  const s=api.segments(x);
  assert.equal(s.length,4);
  assert.deepEqual(s.map(x=>x.title),['المعنى','اللمسة البيانية','التدبر والمعرفة','الخلاصة والفائدة']);
  assert.ok(s[1].text.includes('جمال الصورة'));
 });
 check('Source metadata is NOT narrated as a heading or paragraph',()=>{
  const s=api.segments(row([field('bayan','اللمسة البيانية','بيان لغوي وسياقي محرر','نص الشرح')]));
  assert.equal(s.length,1);assert.equal(s[0].title,'اللمسة البيانية');
  assert.ok(!JSON.stringify(s).includes('بيان لغوي وسياقي محرر'));
 });
 check('Long Ibn Kathir source is read fully from rendered content',()=>{
  const long='جاء في تفسير ابن كثير: '+('معنى الآية الكريمة. '.repeat(210));
  const s=api.segments(row([field('external','تفسير ابن كثير','Tafsir API / QUL',long)]));
  assert.equal(s.length,1);assert.ok(s[0].text.length>2000);
  assert.equal(api.splitSpeech(s[0].text).join(' '),s[0].text.replace(/\s+/g,' '));
 });
 check('Not-loaded Tafsir placeholder is not falsely read as explanation',()=>{
  const s=api.segments(row([field('pending','تفسير البغوي','','لم تُحمّل مادة هذه الآية بعد')]));
  assert.equal(s.length,0);
 });
 check('Official external-only tafsir card is not claimed as full content',()=>{
  const s=api.segments(row([field('external','التفسير المحرر','الدرر السنية','افتح المادة في الموقع الرسمي')],'v194T108Muharrar'));
  assert.equal(s.length,0);
 });
 check('Ligatures stay expanded inside the proper body section',()=>{
  const s=api.segments(row([field('meaning','المعنى','محلي','قال النبي ﷺ والله ﷻ أعلم.')]));
  assert.match(s[0].text,/صلى الله عليه وسلم/);
  assert.match(s[0].text,/جل جلاله/);
 });
 console.log(JSON.stringify({pass:count,total:6,fixture:'V690 original Tafsir STEP2 field structure'}));
}
if(typeof module!=='undefined'&&module.exports)module.exports=main;
if(typeof require!=='undefined'&&require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
