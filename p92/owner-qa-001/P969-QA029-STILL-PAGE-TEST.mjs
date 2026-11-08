import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./p969-no-ayah-page-motion.js',import.meta.url),'utf8');
const idx=source.indexOf('/* BASAIR P96.9 / QA029');
assert.ok(idx>0&&source.includes('function exitMeaning()'),'successful word meaning code preserved');
assert.ok(!source.includes('if(!scrollSelected(node))'),'QA028 no extra overlay scroll');
const code=source.slice(idx);
const writes=[];
class ElementMock{constructor(){this._top=40}}
Object.defineProperty(ElementMock.prototype,'scrollTop',{
 get(){return this._top},
 set(n){writes.push(n);this._top=n},configurable:true
});
const reader=new ElementMock();
const state={running:true,surfaceBusy:false,scaleMode:'normal',page:4};
const body={classList:{contains:s=>s==='reader-active'}};
const d={readyState:'complete',body,getElementById:id=>id==='mushafReader'?reader:null};
const events={};const w={
 __BASAIR_B345_SEQUENCE__:{state},
 addEventListener:(name,cb)=>events[name]=cb,
 setInterval:()=>5,clearInterval:()=>{}
};
const context={window:w,document:d,Date,Object,Number,String};
vm.runInNewContext(code,context,{timeout:1500});
const api=w.__BASAIR_P969_STILL_AYAH_PAGE__;
assert.ok(api?.status().installed,'accessor installed');
reader.scrollTop=100;
reader.scrollTop=140;
assert.equal(reader.scrollTop,40,'same-page page motion blocked');
assert.equal(api.status().suppressed,2,'two programmatic writes filtered');
// A real touch/drag bypasses JS setter (web engine updates internal scrollTop).
reader._top=87;
assert.equal(reader.scrollTop,87,'manual native scroll remains intact');
// An actual page transition may align the next page.
state.page=5;
reader.scrollTop=750;
reader.scrollTop=752;
reader.scrollTop=755;
reader.scrollTop=759;
assert.equal(reader.scrollTop,755,'allow only bounded page positioning writes');
assert.equal(api.status().pageTransitions,1);
state.running=false;
reader.scrollTop=0;
assert.equal(reader.scrollTop,0,'normal out-of-Follow navigation may scroll');
state.running=true;state.scaleMode='zoom';
reader.scrollTop=333;
assert.equal(reader.scrollTop,333,'zoom remains scrollable');
state.scaleMode='normal';state.page=6;reader.scrollTop=700;
assert.equal(reader.scrollTop,700,'new page allowed again');
api.disable();
assert.equal(Object.getOwnPropertyDescriptor(reader,'scrollTop'),undefined,'own bridge safely uninstalled');
reader.scrollTop=1000;
assert.equal(reader.scrollTop,1000,'original descriptor restored');
assert.ok(!w.__BASAIR_P969_STILL_AYAH_PAGE__);
console.log('PASS P96.9 QA029: no within-page programmatic moves, actual page transitions allowed, finger scroll unaffected, outside-Follow/zoom unaffected, disable restores native scroll');
console.log({nativeWrites:writes.length,lastPage:state.page});