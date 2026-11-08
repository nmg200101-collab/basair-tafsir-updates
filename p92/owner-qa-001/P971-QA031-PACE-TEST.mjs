import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const dir=new URL('.',import.meta.url);
const source=fs.readFileSync(new URL('p971-audio-pace-settings.js',dir),'utf8');
const previous=fs.readFileSync(new URL('p970-audio-follow-visibility-guard.js',dir),'utf8');
const marker='/* BASAIR P97.1 / QA031';
const index=source.indexOf(marker);
assert.ok(index>0,'new QA031 overlay present');
assert.equal(source.slice(0,index).trimEnd(),previous.trimEnd(),'prior QA030 behavior unchanged byte-for-byte');
assert.ok(!source.slice(index).includes('audio.playbackRate='),'audio speed untouched');
const suffix=source.slice(index);
assert.doesNotThrow(()=>new vm.Script(suffix),'QA031 parse');
let wall=100000,clock=0,rafNext=0,timerNext=0;
const rAF=new Map(),timeouts=new Map(),events=new Map(),docEvents=new Map();
const MockDate={now:()=>wall};
function runFrame(step=20){
 clock+=step;wall+=step;
 const todo=[...rAF.entries()];rAF.clear();
 for(const [,cb] of todo)cb(clock);
}
function advance(n,step=20){for(let i=0;i<n;i++)runFrame(step)}
function drainTimers(){const pending=[...timeouts.entries()];timeouts.clear();pending.forEach(([,f])=>f())}
const cl=(...v)=>({contains:(x)=>v.includes(x)});
const state={running:true,mode:'audio',scaleMode:'normal',surfaceBusy:false,page:4};
const writes=[];
class Reader{constructor(){this._scroll=0;this.classList=cl('active');this.clientHeight=600;this.scrollHeight=2200}
 getBoundingClientRect(){return {top:0,bottom:600}}
}
Object.defineProperty(Reader.prototype,'scrollTop',{configurable:true,get(){return this._scroll},
 set(v){this._scroll=v;writes.push(v)}});
const reader=new Reader();
let hitRect={top:900,bottom:950};
const hit={getBoundingClientRect:()=>hitRect};
const shell={querySelector:()=>hit};
const stack={querySelector(sel){return /r33-print-page="4"/.test(sel)?shell:null}};
let setting='.25',saveCount=0,stored='.25';
const speedSelect={get value(){return setting}};
const storage={getItem(key){assert.equal(key,'v170Speed');return stored},setItem(){saveCount++}};
const audio={paused:false,ended:false,playbackRate:1.1,
 addEventListener(ev,fn){events.set(ev,fn)},removeEventListener(ev,fn){if(events.get(ev)===fn)events.delete(ev)},
 fire(ev){const fn=events.get(ev);if(fn)fn()}};
const doc={readyState:'complete',body:{classList:cl('reader-active')},
 getElementById(id){return ({mushafReader:reader,b345NormalStack:stack,tilawaAudio:audio,sequenceSpeedV10:speedSelect})[id]||null},
 addEventListener(ev,fn){docEvents.set(ev,fn)},removeEventListener(ev,fn){if(docEvents.get(ev)===fn)docEvents.delete(ev)}};
const win={__BASAIR_B345_SEQUENCE__:{state},localStorage:storage,performance:{now:()=>clock},
 setInterval:()=>999,clearInterval(){},setTimeout(fn){const i=++timerNext;timeouts.set(i,fn);return i},
 clearTimeout(id){timeouts.delete(id)},requestAnimationFrame(fn){const id=++rafNext;rAF.set(id,fn);return id},
 cancelAnimationFrame(id){rAF.delete(id)},addEventListener(){},removeEventListener(){}};
vm.runInNewContext(suffix,{window:win,document:doc,Date:MockDate,Number,Object,String,Math,isFinite},{timeout:1500});
const api=win.__BASAIR_P971_AUDIO_PACE__;
assert.ok(api && events.has('timeupdate'));
reader.scrollTop=350;audio.fire('timeupdate');
assert.equal(Object.getOwnPropertyDescriptor(reader,'scrollTop'),undefined,'100% stays native — QA030 handles it');
reader.scrollTop=0;state.scaleMode='zoom';
audio.fire('timeupdate');
assert.ok(Object.getOwnPropertyDescriptor(reader,'scrollTop'),'zoom audio pulse briefly armed');
reader.scrollTop=400;
assert.equal(reader.scrollTop,0,'first zoom audio movement not a sudden jump');
advance(10,20);const slow=reader.scrollTop;
assert.ok(slow>0&&slow<400,'zoom moves gradually');
advance(65,20);assert.ok(Math.abs(reader.scrollTop-400)<1,'target eventually reached without permanent freeze');
drainTimers();assert.equal(Object.getOwnPropertyDescriptor(reader,'scrollTop'),undefined,'micro interception must release on time');
reader.scrollTop=0;setting='1';audio.fire('timeupdate');reader.scrollTop=400;
advance(10,20);const fast=reader.scrollTop;
assert.ok(fast>slow+80,'existing fast setting makes movement visibly faster than slow setting');
audio.fire('pause');assert.equal(Object.getOwnPropertyDescriptor(reader,'scrollTop'),undefined,'pause restores descriptor');
assert.equal(rAF.size,0,'pause cancels animation');
reader.scrollTop=25;setting='.5';
hitRect={top:100,bottom:130};audio.fire('timeupdate');reader.scrollTop=150;
assert.equal(reader.scrollTop,25,'visible ayah is not needlessly recentered');
hitRect={top:1000,bottom:1030};
reader.scrollTop=210;assert.equal(reader.scrollTop,25,'offscreen movement is paced');
state.page=5;reader.scrollTop=300;
assert.equal(reader.scrollTop,300,'changing page always passes native movement');
audio.fire('pause');reader.scrollTop=40;state.page=4;
audio.fire('timeupdate');reader.scrollTop=320;
docEvents.get('touchmove')();
assert.equal(Object.getOwnPropertyDescriptor(reader,'scrollTop'),undefined,'manual movement releases bridge');
assert.equal(rAF.size,0,'manual movement cancels animation');
reader.scrollTop=230;assert.equal(reader.scrollTop,230);
wall+=1100;setting='5';audio.fire('timeupdate');reader.scrollTop=370;
assert.equal(reader.scrollTop,370,'unsupported settings fail open');
assert.equal(Object.getOwnPropertyDescriptor(reader,'scrollTop'),undefined,'unsupported settings do not intercept');
setting='.5';audio.paused=true;audio.fire('timeupdate');reader.scrollTop=390;
assert.equal(reader.scrollTop,390,'paused audio leaves native scroll alone');
audio.paused=false;state.scaleMode='normal';audio.fire('timeupdate');
assert.equal(Object.getOwnPropertyDescriptor(reader,'scrollTop'),undefined,'normal size never intercepted');
state.scaleMode='zoom';audio.fire('timeupdate');reader.scrollTop=530;
api.disable();assert.equal(Object.getOwnPropertyDescriptor(reader,'scrollTop'),undefined,'disable restores native scroll');
assert.equal(rAF.size,0,'disable cancels remaining work');
assert.equal(win.__BASAIR_P971_AUDIO_PACE__,undefined);
assert.equal(audio.playbackRate,1.1,'do not alter audio pace');
assert.equal(saveCount,0,"do not override user's settings");
console.log('PASS QA031: QA030 exact prefix; settings-driven gradual zoom, no jump, natural page transitions, printed 100%, manual, pause, invalid setting, disable and audio rate all preserved.');
