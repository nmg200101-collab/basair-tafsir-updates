import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('.',import.meta.url);
const previous=readFileSync(new URL('p968-native-gesture-preview.js',root),'utf8').trimEnd();
const current=readFileSync(new URL('p970-audio-follow-visibility-guard.js',root),'utf8');
const marker='/* BASAIR P97.0 / QA030';
const index=current.indexOf(marker);
assert.ok(index>0,'QA030 guard exists after QA028 base');
assert.equal(current.slice(0,index).trimEnd(),previous,'QA028 unchanged as exact prefix');
assert.ok(!current.includes('transitionWrites>=3'),'QA029 destructive blanket limiter removed');
assert.ok(current.includes('function exitMeaning()'),'word-meaning cleanup retained');
assert.ok(current.includes('function p968ShowPreview(ayah)'),'ayah selection preview retained');
const guard=current.slice(index);
assert.doesNotThrow(()=>new vm.Script(guard),'new guard syntax');
const listeners=new Map(),docListeners=new Map(),timeouts=[];
const cl=(...words)=>({contains:(word)=>words.includes(word)});
let oldDisabled=false;
const audio={
 duration:10,currentTime:2,
 addEventListener(ev,fn){listeners.set(ev,fn)},
 removeEventListener(ev,fn){if(listeners.get(ev)===fn)listeners.delete(ev)},
 fire(ev){const fn=listeners.get(ev);if(fn)fn()}
};
const hit={rect:{top:170,bottom:204},getBoundingClientRect(){return this.rect}};
const shell={querySelector(sel){return sel==='.ayahHit.b441FollowHit'?hit:null}};
const host={querySelector(sel){return /data-r33-print-page="(4|5|6)"/.test(sel)?shell:null}};
const state={running:true,mode:'audio',surfaceBusy:false,scaleMode:'normal',page:4};
const writes=[];
class Reader{constructor(){this._top=40;this.classList=cl('active')}
 getBoundingClientRect(){return {top:20,bottom:680}}
}
Object.defineProperty(Reader.prototype,'scrollTop',{configurable:true,get(){return this._top},set(v){writes.push(v);this._top=v}});
const reader=new Reader();
const d={readyState:'complete',body:{classList:cl('reader-active')},
 getElementById(id){return ({mushafReader:reader,b345NormalStack:host,tilawaAudio:audio})[id]||null},
 addEventListener(ev,fn){docListeners.set(ev,fn)},
 removeEventListener(ev,fn){if(docListeners.get(ev)===fn)docListeners.delete(ev)}
};
const w={__BASAIR_B345_SEQUENCE__:{state},__BASAIR_P969_STILL_AYAH_PAGE__:{disable(){oldDisabled=true}},
 addEventListener(){},removeEventListener(){},setTimeout(fn){timeouts.push(fn);return timeouts.length},
 setInterval(){return 3},clearInterval(){}};
vm.runInNewContext(guard,{window:w,document:d,Date,Number,Object,String,isFinite},{timeout:1500});
const api=w.__BASAIR_P970_NATURAL_FOLLOW__;
assert.ok(oldDisabled,'prior QA029 bridge disabled');
assert.ok(api&&listeners.has('timeupdate'),'audio-origin event listener installed');
reader.scrollTop=100;assert.equal(reader.scrollTop,100,'outside audio pulse all scroll writes allowed');
audio.fire('timeupdate');
assert.ok(Object.getOwnPropertyDescriptor(reader,'scrollTop'),'bounded bridge armed');
reader.scrollTop=130;reader.scrollTop=140;
assert.equal(reader.scrollTop,100,'two redundant audio-page moves suppressed while ayah visible');
state.page=5;reader.scrollTop=330;
assert.equal(reader.scrollTop,330,'new page position allowed immediately (QA029 regression)');
state.page=4;hit.rect={top:900,bottom:920};reader.scrollTop=550;
assert.equal(reader.scrollTop,550,'offscreen ayah can be revealed even after pulse');
hit.rect={top:160,bottom:195};
docListeners.get('touchmove')();
assert.equal(Object.getOwnPropertyDescriptor(reader,'scrollTop'),undefined,'touch gesture restores native descriptor');
reader.scrollTop=570;assert.equal(reader.scrollTop,570,'manual gesture permitted');
state.scaleMode='zoom';reader.scrollTop=610;assert.equal(reader.scrollTop,610,'zoom preserved');
state.scaleMode='normal';audio.currentTime=9.8;audio.fire('timeupdate');
reader.scrollTop=0;assert.equal(reader.scrollTop,0,'near audio end/page handoff not frozen');
audio.currentTime=3;audio.fire('timeupdate');audio.fire('ended');
assert.equal(Object.getOwnPropertyDescriptor(reader,'scrollTop'),undefined,'natural end restores setter');
timeouts.forEach(fn=>fn());
assert.equal(Object.getOwnPropertyDescriptor(reader,'scrollTop'),undefined,'timeouts do not reinstate guard');
api.disable();
assert.ok(!w.__BASAIR_P970_NATURAL_FOLLOW__,'full runtime rollback');
assert.ok(!listeners.has('timeupdate'),'listeners removed');
console.log('PASS QA030: QA028 exact prefix; QA029 released; audio-only visible-ayah micro-guard; cross-page, offscreen, touch, zoom, ended and disable all preserve native scrolling.');
