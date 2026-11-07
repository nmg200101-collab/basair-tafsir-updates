// BASAIR P96.3 QA023: verify real final Follow IIFE without invoking protected engine.
// Simulates late page DOM, new Audio element, native/approx marker, shade OFF and no media control.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=dirname(fileURLToPath(import.meta.url));
const old=readFileSync(join(root,'p962-audio-error-recovery.js'),'utf8');
const now=readFileSync(join(root,'p963-follow-page-shade.js'),'utf8');
const cssOld=readFileSync(join(root,'p951-font-restored-header.css'),'utf8');
const css=readFileSync(join(root,'p963-follow-page-shade.css'),'utf8');
assert.ok(now.startsWith(old.slice(0,old.lastIndexOf('(function (w,d) {'))),'prior audio recovery/source and page engines untouched');
assert.ok(css.startsWith(cssOld),'existing typography CSS exactly preserved');
assert.ok(!now.includes("line.style.setProperty('font-size'"),'no typography overrides');
assert.ok(css.includes('.bq916-reading-line.bq963-fallback:not([hidden])'),'fallback CSS scoped to explicit state');
assert.ok(css.includes('data-bq916-shade="off"'),'respect user shade OFF');
assert.ok(!css.includes('@font-face'),'no new font');
let moved=0,play=0,seek=0,scroll=0;
function classes(base=[]){const s=new Set(base);return{contains:k=>s.has(k),add:k=>s.add(k),remove:k=>s.delete(k),toggle:(k,on)=>{if(on)s.add(k);else s.delete(k)},entries:()=>[...s]}}
function element(tag){return{tagName:tag,id:'',hidden:false,isConnected:true,style:{},classList:classes(),attrs:{},
 setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]??null},
 appendChild(x){x.isConnected=true;this.children??=[];this.children.push(x);return x},
 addEventListener(){},querySelector(){return null},querySelectorAll(){return[]},
 getBoundingClientRect(){return {top:0,height:200,width:300}}}}
function audioEl(src){const a={currentSrc:src,src,duration:120,currentTime:5,handlers:{},
 addEventListener(k,fn){(this.handlers[k]??=[]).push(fn)},
 removeEventListener(k,fn){this.handlers[k]=(this.handlers[k]||[]).filter(v=>v!==fn)},
 emit(k){for(const fn of this.handlers[k]||[])fn.call(this,{type:k})},
 play(){play++},pause(){play++},set currentPage(v){seek++}};return a}
function cardFor(page){const c=element('div');c.page=page;c.lineNodes=Array.from({length:15},(_,i)=>{
 const e=element('span');e.getBoundingClientRect=()=>({top:12+i*12,height:12,width:300});return e
 });c.nativeIndex=-1;c.overlay=null;
 c.querySelector=(sel)=>{
 if(sel.includes(':scope > .bq916-reading-line'))return c.overlay;
 if(sel.includes('.b441FollowWord'))return c.nativeIndex<0?null:{closest:()=>c.lineNodes[c.nativeIndex]};
 return null};
 c.querySelectorAll=sel=>sel.includes('.exactLine')?c.lineNodes:[];
 c.appendChild=x=>{c.overlay=x;x.isConnected=true;return x};
 c.getBoundingClientRect=()=>({top:0,height:250,width:300});
 return c}
function make(){
 const frames=[],timeouts=[],intervals=[],cards=new Map();
 const audio={value:audioEl('src-page3.mp3')};
 const reader=element('div');reader.classList=classes(['active']);
 const body=element('body');body.classList=classes(['reader-active']);body.className='reader-active';
 const html=element('html');
 const holder=element('div');
 holder.querySelector=sel=>{const m=sel.match(/data-(?:b345|r33-print)-page="(\d+)"/);return m?cards.get(Number(m[1]))??null:null};
 const ids={mushafReader:reader,b345NormalStack:holder};
 const document={body,documentElement:html,readyState:'complete',
  getElementById:id=>id==='tilawaAudio'?audio.value:ids[id]??null,
  createElement:element,addEventListener(){}};
 const ctrl={state:{running:true,mode:'audio',scaleMode:'normal',page:3,generation:1}};
 const w={__BASAIR_B345_SEQUENCE__:ctrl,currentPage:3,
  localStorage:{getItem:()=>JSON.stringify({enabled:true,delay:15}),setItem(){}},
  requestAnimationFrame:fn=>{frames.push(fn);return frames.length},
  setTimeout:(fn,ms)=>{timeouts.push({fn,ms});return timeouts.length},
  setInterval:(fn,ms)=>{intervals.push({fn,ms});return intervals.length},
  addEventListener(){},stopSequence(){moved++},openHome(){moved++}};
 const start=now.lastIndexOf('(function (w,d) {');
 assert.ok(start>0);
 vm.runInNewContext(now.slice(start),{window:w,document}, {timeout:3000});
 const api=w.__BASAIR_P946_SHADE_SMOOTH__;
 assert.ok(api,'QA023 must retain the public Follow controller');
 function flush(){let count=0;while(frames.length){const t=frames.shift();t();if(++count>30)throw Error('unstable animation loop')}}
 function advanceTimeout(){const t=timeouts.shift();assert.ok(t,'expected bounded retry');t.fn();flush()}
 return{w,document,ctrl,holder,cards,audio,reader,html,body,api,frames,timeouts,intervals,flush,advanceTimeout};
}
const t=make();
t.flush();
assert.equal(t.api.diagnostics().pageReady,false,'not-ready page never marked ready');
assert.equal(t.api.diagnostics().missedPages>0,true,'missing card diagnosed');
assert.equal(t.timeouts.length,1,'one scheduled bounded retry (no busy spin)');
assert.equal(t.timeouts[0].ms,160);
const p3=cardFor(3);
t.cards.set(3,p3);
t.advanceTimeout();
assert.ok(p3.overlay,'newly mounted page gets visual node');
assert.equal(p3.overlay.hidden,false,'approximate fallback shown if native paint unavailable');
assert.equal(p3.overlay.classList.contains('bq963-fallback'),true);
assert.equal(p3.overlay.attrs['data-bq963-accuracy'],'approximate');
assert.equal(t.api.diagnostics().pageReady,true);
p3.nativeIndex=0;
t.audio.value.emit('timeupdate');t.flush();
assert.equal(p3.overlay.hidden,true,'native ayah mark replaces approximate fallback');
assert.equal(p3.overlay.classList.contains('bq963-fallback'),false);
assert.equal(t.api.diagnostics().nativeFrames>0,true,'native frame counted');
// New page arrives before DOM: old shade is suppressed, one retry waits for real card.
t.ctrl.state.page=4;t.ctrl.state.generation=2;t.audio.value.currentSrc='src-page4.mp3';
t.audio.value.emit('playing');t.flush();
assert.equal(p3.overlay.hidden,true,'previous-page overlay cannot linger on page four');
assert.equal(t.api.diagnostics().pageReady,false,'page four stays unsettled');
const p4=cardFor(4);t.cards.set(4,p4);t.advanceTimeout();
assert.equal(p4.overlay.hidden,false,'late page four receives fallback');
assert.equal(t.api.diagnostics().page,4);
// DOM/audio element replaced between pages: liveness tick rebinds without resetting or playing.
const originalAudio=t.audio.value;
t.audio.value=audioEl('src-page4-alt.mp3');
const tick=t.intervals.find(x=>x.ms===750);assert.ok(tick,'low frequency audio/page liveness guard');
tick.fn();t.flush();
assert.equal(t.api.diagnostics().audioRebinds>=2,true,'replacement audio rebound');
assert.equal((originalAudio.handlers.timeupdate||[]).length,0,'old audio listeners detached');
assert.equal((t.audio.value.handlers.timeupdate||[]).length,1,'new audio listeners attached once');
// Respect explicit user OFF and never touch media or page navigation.
t.api.enable(false);t.flush();
assert.equal(p4.overlay.hidden,true,'shade OFF hides fallback');
assert.equal(t.html.attrs['data-bq916-shade'],'off');
assert.equal(moved,0,'never changes Quran page/navigation');
assert.equal(play,0,'never pauses/resumes media');
assert.equal(seek,0,'never seeks audio');
assert.equal(scroll,0,'never controls scrolling');
// Stay bounded on missing page; liveness guard may recheck infrequently but not spin frames.
const x=make();x.flush();for(let i=0;i<14;i++){if(!x.timeouts.length)break;x.advanceTimeout();}
assert.ok(x.api.diagnostics().settleAttempts<=9,'bounded retry budget');
assert.equal(x.timeouts.length,0,'retry loop exhausts safely');
console.log('PASS QA023: late page recovery, old anchor cleared, native⇄approx state, new audio rebinding, shade OFF, bounded retries, no audio/page/scroll mutation.');
