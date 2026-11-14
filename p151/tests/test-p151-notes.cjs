'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),
 crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=x=>fs.readFileSync(path.join(root,x));
const js=read('p121/owner-qa/modules/tafsir/p151-reader-notes.js').toString('utf8');
const css=read('p121/owner-qa/modules/tafsir/p151-reader-notes.css').toString('utf8');
new vm.Script(js);
for(const marker of ['__BASAIR_TAFSIR_P151_NOTES__','basair:tafsir:p151:notes:v1',
 'p151NotesHub','p151NotesIndex','p151NoteAction','data-p150-note-proxy',
 "e.stopImmediatePropagation()","step.open(p.s,p.a,'basair')",
 'hiddenLegacy','updateIndicators','data-p151-action="save"','data-p151-action="delete"',
 'data-p151-action="copy"','data-p151-action="goto"']){
 assert.ok(js.includes(marker),'P151 required feature missing: '+marker);
}
assert.ok(css.includes('#p151NotesHub')&&css.includes('p151NotesIndexButton'));
assert.ok(css.includes('button.p151NoteAction')&&css.includes('grid-column:5'));
assert.ok(css.includes('html.dark body #p151NotesHub'));
assert.ok(!js.includes("localStorage.removeItem("),'Never delete existing note stores');
const storage=new Map();
storage.set('basair:tafsir:p151:notes:v1',JSON.stringify({version:1,
 notes:[{s:2,a:3,text:'New note',updated:200},{s:3,a:6,text:'Other note',updated:240}],
 hiddenLegacy:[]}));
storage.set('b263:tafsir:notes',JSON.stringify({'2:3':'Old duplicate','5:4':{text:'Old kept',updated:111}}));
const store={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),
 key:i=>Array.from(storage.keys())[i],get length(){return storage.size}};
const document={readyState:'loading',body:{},addEventListener(){},
 querySelector(){return null},querySelectorAll(){return []}};
const window={localStorage:store,document,navigator:{},addEventListener(){},
 setInterval(){},setTimeout(){},MutationObserver:null};
vm.runInNewContext(js,{window,document,Promise,Map,Set,WeakMap,WeakSet,Date,
 String,Array,Number,JSON,Object,RegExp,Math,console});
const api=window.__BASAIR_TAFSIR_P151_NOTES__;
assert.ok(api,'P151 notes API must install independently of ready DOM');
const items=api.allNotes();
assert.equal(items.length,3,'two new and one legacy notes, without duplicate');
assert.equal(items.find(x=>x.s===2&&x.a===3).text,'New note');
assert.equal(items.find(x=>x.s===5&&x.a===4).text,'Old kept');
assert.equal(JSON.parse(storage.get('b263:tafsir:notes'))['5:4'].text,'Old kept',
 'Reading legacy notes must not modify original data');
storage.set('basair:tafsir:p151:notes:v1',JSON.stringify({
 version:1,notes:[{s:2,a:3,text:'New note'}],hiddenLegacy:['5:4']}));
assert.equal(api.allNotes().length,1,'hidden legacy note must stay hidden after delete');
console.log(JSON.stringify({status:'PASS',newStore:true,legacyReadOnly:true,perVerseDeduplicated:true,
 legacyDeleteTombstones:true,hasFullEditor:true,release:'NOT PUBLISHED'}));
