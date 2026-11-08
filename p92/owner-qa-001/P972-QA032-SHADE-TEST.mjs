import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const dir=new URL('.',import.meta.url);
const prior=fs.readFileSync(new URL('p971-audio-pace-settings.js',dir),'utf8').trimEnd();
const source=fs.readFileSync(new URL('p972-ayah-shade-stability.js',dir),'utf8');
const marker='/* BASAIR P97.2 / QA032';
const at=source.indexOf(marker);
assert.ok(at>0,'QA032 suffix found');
assert.equal(source.slice(0,at).trimEnd(),prior,'QA031 preserved byte-identically');
const suffix=source.slice(at);
assert.doesNotThrow(()=>new vm.Script(suffix));
assert.doesNotMatch(suffix,/scrollTop|scrollTo|scrollIntoView|playbackRate/,'shade layer never touches scroll/audio');
let time=100000,rafCounter=0,intervalId=0;
const frames=new Map(),intervals=new Map(),evt=new Map(),wv=new Map();
const classList=(...start)=>{const s=new Set(start);return{
 contains:v=>s.has(v),add:v=>s.add(v),remove:v=>s.delete(v),toggle(v,b){if(b)s.add(v);else s.delete(v)}
}};
class Hit{
 constructor(s,a){this.s=s;this.a=a;this.classList=classList('ayahHit');this.isConnected=true;}
 getAttribute(k){return k==='data-s'?String(this.s):k==='data-selectayah'?String(this.a):null;}
 closest(q){return q.startsWith('.ayahHit')?this:null}
}
const hit4=new Hit(2,5),hit5=new Hit(2,6);
class Shell{
 constructor(page,nodes){this.page=page;this.items=nodes;this.isConnected=true}
 querySelectorAll(q){
  if(q.startsWith('.ayahHit[data-s=')){
   const m=q.match(/data-s="(\d+)"\]\[data-selectayah="(\d+)"/);
   if(!m)return [];
   return this.items.filter(x=>x.s===Number(m[1])&&x.a===Number(m[2]));
  }
  if(q==='.b441FollowHit,.b441FollowAyah,.b441FollowWord'){
   return this.items.filter(x=>x.classList.contains('b441FollowHit'));
  }
  return [];
 }
}
const shell4=new Shell(4,[hit4]),shell5=new Shell(5,[hit5]);
let hasShell5=false;
const stack={querySelector(q){if(q.includes('data-r33-print-page="4"'))return shell4;
 if(q.includes('data-r33-print-page="5"'))return hasShell5?shell5:null;return null;}};
const reader={classList:classList('active'),scrollTop:40};
const shadeAttrs={'data-bq916-shade':'on','data-bq945-shade':'on'};
const root={getAttribute:k=>shadeAttrs[k]};
let settings=true,originalCalls=0;
const localStorage={getItem(k){assert.equal(k,'basair:p942:follow-guide:v1');return JSON.stringify({enabled:settings})}};
const state={page:4,running:true,paused:false,scaleMode:'normal'};
const api={accept(){originalCalls++;return true}};
const audio={currentSrc:'track1',addEventListener(){},removeEventListener(){}};
const doc={readyState:'complete',body:{classList:classList('reader-active')},documentElement:root,
 getElementById(k){return ({mushafReader:reader,b345NormalStack:stack,tilawaAudio:audio})[k]||null},
 addEventListener(k,fn){evt.set(k,fn)},removeEventListener(k){evt.delete(k)}};
const w={localStorage,__BASAIR_B345_SEQUENCE__:{state},__BASAIR_P964_AYAH_MEANING__:api,
 addEventListener(k,f){wv.set(k,f)},removeEventListener(k){wv.delete(k)},
 setInterval(f){const i=++intervalId;intervals.set(i,f);return i},clearInterval(i){intervals.delete(i)},
 requestAnimationFrame(f){const i=++rafCounter;frames.set(i,f);return i},cancelAnimationFrame(i){frames.delete(i)}};
const d={now:()=>time};
vm.runInNewContext(suffix,{window:w,document:doc,Date:d,Number,Object,JSON,String,Array,Math,isFinite},{timeout:1500});
function flush(){const x=[...frames];frames.clear();for(const [,f] of x)f()}
const bridge=w.__BASAIR_P972_AYAH_SHADE__;
assert.ok(bridge);
flush();
assert.equal(bridge.status().fallbackNodes,0,'no fabricated ayah without evidence');
assert.equal(api.accept({page:4,s:2,a:5},hit4),true);
assert.equal(originalCalls,1,'native retarget acknowledged before overlay');
flush();assert.ok(hit4.classList.contains('bq972-shade-hold'),'first choice receives immediate fallback');
hit4.classList.add('b441FollowHit');
bridge.refresh();flush();
assert.ok(!hit4.classList.contains('bq972-shade-hold'),'native highlight takes over without double shadow');
assert.equal(bridge.status().stats.nativeHandoffs,1);
time+=1000;
hit4.classList.remove('b441FollowHit');
bridge.refresh();flush();
assert.ok(hit4.classList.contains('bq972-shade-hold'),'short native repaint gap covered');
time+=2501;
bridge.refresh();flush();
assert.ok(!hit4.classList.contains('bq972-shade-hold'),'never retain unverified native verse indefinitely');
// Existing shell absent during page change, accepted retarget must survive.
assert.equal(api.accept({page:5,s:2,a:6},hit5),true);
state.page=5;bridge.refresh();flush();
assert.equal(bridge.status().fallbackNodes,0,'not painted on a missing page');
hasShell5=true;bridge.refresh();flush();
assert.ok(hit5.classList.contains('bq972-shade-hold'),'accepted selection appears when deferred page renders');
hit5.classList.add('b441FollowHit');bridge.refresh();flush();
assert.ok(!hit5.classList.contains('bq972-shade-hold'),'new page native handoff success');
hit5.classList.remove('b441FollowHit');bridge.refresh();flush();
assert.ok(hit5.classList.contains('bq972-shade-hold'),'new page native repaint continuity');
settings=false;bridge.refresh();flush();
assert.ok(!hit5.classList.contains('bq972-shade-hold'),'user OFF switch respected');
settings=true;state.scaleMode='zoom';bridge.refresh();flush();
assert.ok(!hit5.classList.contains('bq972-shade-hold'),'zoomed text/scroll untouched');
state.scaleMode='normal';state.running=false;state.paused=false;
bridge.refresh();flush();
assert.equal(bridge.status().fallbackNodes,0,'follow stopped cleans up');
bridge.disable();
assert.equal(api.accept({page:5,s:2,a:6},hit5),true);
assert.equal(originalCalls,3,'disable restores original retarget API');
assert.ok(!w.__BASAIR_P972_AYAH_SHADE__,'API removed after disable');
assert.equal(intervals.size,0,'no recurring timers retained');
console.log('PASS QA032: instant first-ayah mark, native handoff, repaint continuity, delayed page, OFF switch, zoom, stop, full disable and exact QA031 prefix.');
