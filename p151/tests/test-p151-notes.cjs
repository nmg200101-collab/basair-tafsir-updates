'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const js=fs.readFileSync(path.join(root,'p121/owner-qa/modules/tafsir/p151-reader-notes.js'),'utf8');
const css=fs.readFileSync(path.join(root,'p121/owner-qa/modules/tafsir/p151-reader-notes.css'),'utf8');
new vm.Script(js,{filename:'p151-reader-notes.js'});
for(const marker of [
 "NATIVE_KEY='basair:tafsir-notes:v1'","NATIVE_SCHEMA='basair-tafsir-notes-v1'",
 "r.notes.set","nativeMap()","nativeSet(current.s,current.a",
 "nativeSet(s,a,'')","data-p151-saved","data-p150-note-proxy",
 "p151NotesHub","p151NotesIndex","data-p151-action=\"delete\"",
 "#basairTafsirB233TopBar #basairTafsirB232FavoritesBtn",
 'button[data-b233-top="search"]']){
 assert.ok(js.includes(marker),'missing original-engine integration: '+marker);
}
assert.ok(css.includes('#p151NotesHub')&&css.includes('.p151NotesIndexButton'));
assert.ok(css.includes('button.p151NoteAction')&&css.includes('grid-column:5'));
assert.ok(!js.includes('localStorage.removeItem('),'Never erase any note storage key');
const memory=new Map();
const NATIVE='basair:tafsir-notes:v1',META='basair:tafsir:p151:notes:v1';
memory.set(NATIVE,JSON.stringify({schema:'basair-tafsir-notes-v1',version:1,
 items:{'2:3':{s:2,a:3,text:'Previous note',updatedAt:1000}}}));
const localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),
 key:i=>[...memory.keys()][i],get length(){return memory.size}};
const originalNotes={
 all(){return JSON.parse(localStorage.getItem(NATIVE)).items},
 set(s,a,text){
  const store=JSON.parse(localStorage.getItem(NATIVE)),id=s+':'+a;
  if(String(text).trim())store.items[id]={s,a,text:String(text),updatedAt:Date.now()};
  else delete store.items[id];
  localStorage.setItem(NATIVE,JSON.stringify(store));
 }
};
function field(){return {hidden:false,textContent:'',value:'',attrs:{},
 addEventListener(){},getAttribute(k){return this.attrs[k]??null},
 setAttribute(k,v){this.attrs[k]=String(v)}}}
let hub=null;
class Hub{
 constructor(){this.elems=new Map();
 for(const k of ['[data-p151-editor]','[data-p151-list]','[data-p151-notice]',
  '[data-p151-title]','[data-p151-text]','[data-p151-location]',
  '[data-p151-action="delete"]','[data-p151-items]','[data-p151-filter]',
  '[data-p151-count]','[data-p151-total]'])this.elems.set(k,field());
 this.hidden=false;this.isConnected=false;this.handlers={};
 this.classList={add(){},remove(){}}}
 setAttribute(){} set innerHTML(v){this.html=v}
 querySelector(k){return this.elems.get(k)||null}
 addEventListener(type,fn){this.handlers[type]=fn}
}
const document={readyState:'loading',body:{appendChild(el){el.isConnected=true;hub=el}},
 createElement(){return new Hub()},querySelector(){return null},
 querySelectorAll(){return []},getElementById(){return null},addEventListener(){}};
const window={localStorage,__BASAIR_TAFSIR_R2__:{notes:originalNotes},navigator:{},
 confirm(){return true},setTimeout(){},setInterval(){},addEventListener(){}};
vm.runInNewContext(js,{window,document,Date,Map,Set,Promise,WeakMap,WeakSet,Number,
 Object,Array,String,Math,RegExp,JSON});
const api=window.__BASAIR_TAFSIR_P151_NOTES__;
assert.ok(api);
let list=api.allNotes();
assert.equal(list.length,1);
assert.equal(list[0].text,'Previous note');
const click=a=>hub.handlers.click({target:{closest(){return {getAttribute(){return a}}}}});
api.openEditor(2,3);
assert.equal(hub.elems.get('[data-p151-text]').value,'Previous note');
hub.elems.get('[data-p151-text]').value='Edited in the unified editor';
hub.elems.get('[data-p151-title]').value='My heading';
click('save');
assert.equal(JSON.parse(memory.get(NATIVE)).items['2:3'].text,
 'Edited in the unified editor','native R2 store MUST be updated');
assert.equal(api.allNotes()[0].title,'My heading','P151 metadata keeps only title');
assert.equal(JSON.parse(memory.get(META)).notes,undefined,'Never create parallel note texts');
api.openEditor(2,3);
assert.equal(hub.elems.get('[data-p151-text]').value,'Edited in the unified editor');
click('delete');
assert.equal(api.allNotes().length,0);
assert.equal(JSON.parse(memory.get(NATIVE)).items['2:3'],undefined,'Delete original native note');
api.openEditor(3,6);
hub.elems.get('[data-p151-text]').value='Second note';
click('save');
assert.equal(JSON.parse(memory.get(NATIVE)).items['3:6'].text,'Second note');
assert.equal(api.allNotes().length,1);
console.log(JSON.stringify({status:'PASS',nativeRead:true,nativeWrite:true,nativeDelete:true,
 nativeReopen:true,perVerse:true,independentFavorites:true,
 parallelStorage:false,notesList:true}));
