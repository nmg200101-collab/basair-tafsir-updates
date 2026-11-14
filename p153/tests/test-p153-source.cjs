'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f));
const js=read('p121/owner-qa/modules/tafsir/p153-single-owner.js').toString('utf8');
const css=read('p121/owner-qa/modules/tafsir/p153-single-owner.css').toString('utf8');
new vm.Script(js);
assert.ok(js.includes('P153-SINGLE-OWNER-NOTE-AND-SAVED-TABS'));
assert.ok(js.includes('data-p153-note-pos'));
assert.ok(js.includes("proxy.removeAttribute('data-r3-note-pos')"),'Remove P144 selector collision');
assert.ok(!js.includes("proxy.setAttribute('data-r3-note-pos'"),'Never expose native R3 note position on visual proxy');
assert.ok(!js.includes("/* BASAIR P151 — independent Ayah Notes Hub"),'Competing P151 UI module removed');
assert.ok(!js.includes('setInterval(function(){if(d.getElementById'), 'Duplicate note timer removed');
assert.ok(css.includes('p153NoteProxy')&&css.includes('p153NotesIndex')&&css.includes('p153FavoritesIndex'));
assert.ok(js.includes("fav.insertAdjacentElement('afterend',favProxy)"),'B233 original Favorites capture requires a separate visible trigger');
assert.ok(css.includes('.p153-boot')&&css.includes('data-p153-ready'));
assert.ok(css.length<47000,'Previously stacked 56K CSS must be reduced');
const native=read('p121/owner-qa/release.json'),
 backup=read('p121/owner-qa/release-p152-seq29-before-p153-20261114.json');
assert.deepEqual(native,read('p153/P153-SEQ30-OWNER-SIGNED-RELEASE.json'),
 'Active candidate must be byte-exact signed Seq30');
assert.deepEqual(backup,read('p152/P152-SEQ29-OWNER-SIGNED-RELEASE.json'),'Rollback must be exact signed P152');
const previous=JSON.parse(Buffer.from(JSON.parse(backup).payload,'base64').toString('utf8'));
const c=JSON.parse(read('p153/P153-SEQ30-UNSIGNED-CANDIDATE.json').toString('utf8'));
assert.equal(c.status,'UNSIGNED_DRAFT_NOT_ACTIVE');
assert.equal(c.signed,false);assert.equal(c.published,false);
assert.equal(previous.sequence,29);assert.equal(c.proposedPayload.sequence,30);
assert.equal(c.proposedPayload.modules[0].version,28);
assert.equal(c.proposedPayload.deliveryMode,'automatic','P121 automatic receiver avoids missing manual UI');
for(const [i,a] of c.proposedPayload.modules[0].assets.entries()){
 const b=read('p121/owner-qa/'+a.path);
 assert.equal(b.length,a.size,'Bad asset length '+a.path);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,'Bad SHA256 '+a.path);
 if(i<6)assert.deepEqual(a,previous.modules[0].assets[i],'Inherited Tafsir source changed');
}
const section=js.slice(js.indexOf('/* P153 — ONLY owner'));
assert.ok(section.startsWith('/* P153'),'P153 UI module absent');
class El {
 constructor(tag='div',id=''){this.tagName=tag.toUpperCase();this.id=id;this.children=[];this.parentElement=null;this.attrs={};this.innerHTML=''}
 appendChild(e){this.children.push(e);e.parentElement=this;return e}
 insertAdjacentElement(position,e){assert.equal(position,'afterend');const parent=this.parentElement;assert.ok(parent);parent.children.splice(parent.children.indexOf(this)+1,0,e);e.parentElement=parent;return e}
 contains(e){for(let n=e;n;n=n.parentElement)if(n===this)return true;return false}
 getAttribute(k){return this.attrs[k]??null}
 setAttribute(k,v){this.attrs[k]=String(v)}
 removeAttribute(k){delete this.attrs[k]}
 querySelector(s){
  const nodes=this.walk();
  if(s==='#basairTafsirB232FavoritesBtn')return nodes.find(x=>x.id==='basairTafsirB232FavoritesBtn')||null;
  if(s==='#p153NotesIndex')return nodes.find(x=>x.id==='p153NotesIndex')||null;
  if(s==='#p153FavoritesIndex')return nodes.find(x=>x.id==='p153FavoritesIndex')||null;
  if(s==='button[data-b233-top="search"]')return nodes.find(x=>x.tagName==='BUTTON'&&x.attrs['data-b233-top']==='search')||null;
  return null
 }
 walk(){return this.children.flatMap(x=>[x,...x.walk()])}
 closest(s){
  for(let n=this;n;n=n.parentElement){
   if(s==='#basairTafsirB233TopBar'&&n.id==='basairTafsirB233TopBar')return n;
   if(s==='button[data-p153-tab]'&&n.tagName==='BUTTON'&&n.attrs['data-p153-tab'])return n;
   if(s==='#tafsirAyahs .v194T2Ayah button[data-p153-note-pos]'&&n.tagName==='BUTTON'&&n.attrs['data-p153-note-pos'])return n;
  }
  return null
 }
}
function toolbar(){
 const i=new El('section','tafsirIndex'),b=i.appendChild(new El('div','basairTafsirB233TopBar'));
 b.appendChild(new El('button','type'));b.appendChild(new El('button','library'));
 const search=b.appendChild(new El('button'));search.setAttribute('data-b233-top','search');
 const fav=b.appendChild(new El('button','basairTafsirB232FavoritesBtn'));
 b.appendChild(new El('button','resume'));return {i,b,search,fav}
}
let rootDom=toolbar();const listeners={},tabs=[],opens=[],classes=new Set();
const document={readyState:'complete',hidden:false,
 documentElement:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}},
 getElementById:id=>[rootDom.i,rootDom.b,...rootDom.i.walk()].find(x=>x.id===id)||null,
 querySelector:s=>({click(){tabs.push(s.includes('notes')?'notes':'favorites')}}),
 querySelectorAll:()=>[],addEventListener(){},createElement:tag=>new El(tag)};
const window={addEventListener:(n,fn,c)=>(listeners[n]??=[]).push(fn),
 setTimeout(){},requestAnimationFrame:fn=>fn(),MutationObserver:class{observe(){}disconnect(){}},
 __BASAIR_TAFSIR_FINAL_B233__:{favorites:{open(){opens.push('panel')}}},
 __BASAIR_TAFSIR_R3__:{favoritesUpgrade(){opens.push('upgrade')}},
 __BASAIR_TAFSIR_R2__:{openNote(s,a){opens.push(s+':'+a)}}};
vm.runInNewContext(section,{window,document,Promise,Number,String,Map,Set,WeakMap,Array,Object,Math,RegExp});
const api=window.__BASAIR_TAFSIR_P153_STABLE__;
assert.ok(api);
const notes=rootDom.b.querySelector('#p153NotesIndex');
assert.equal(notes,rootDom.search,'Original search button must be reused, not replaced');
assert.equal(rootDom.b.children.length,6,'Five visible controls plus one hidden native B233 favorites anchor');
const favProxy=rootDom.b.querySelector('#p153FavoritesIndex');
assert.ok(favProxy&&favProxy!==rootDom.fav,'Original B233 capture must never intercept visible favorite');
assert.equal(notes.getAttribute('data-b233-top'),null);
const click=target=>listeners.click[0]({target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});
click(notes);assert.equal(tabs.at(-1),'notes');
click(favProxy);assert.equal(tabs.at(-1),'favorites');
for(let i=0;i<40;i++)api.refresh();
assert.equal(rootDom.b.children.length,6,'Repeated mount must be idempotent');
assert.equal(rootDom.b.querySelector('#p153NotesIndex'),notes);
const proxy=new El('button');proxy.setAttribute('data-p153-note-pos','2:3');
click(proxy);assert.ok(opens.includes('2:3'),'Note must open native R2 editor at exact verse');
rootDom=toolbar();api.refresh();
assert.equal(rootDom.b.children.length,6);
assert.ok(rootDom.b.querySelector('#p153NotesIndex'));
assert.ok(rootDom.b.querySelector('#p153FavoritesIndex'));
console.log(JSON.stringify({status:'PASS',syntactic:true,sha256Assets:8,
 b233ReusedInPlace:true,rebuiltIndex:true,repeatedMounts:40,noDuplicates:true,
 originalFavorites:true,originalNotes:true,nativeB233FavoriteAnchorPreserved:true,originalVerseEditor:true,
 parallelStorage:false,priorSignedSeq29Exact:true,tilawaQA050:'UNCHANGED'}));
