// QA025 tests actual page-meaning adapter and first-ayah visual handoff without custom scrolling.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const here=dirname(fileURLToPath(import.meta.url));
const old=readFileSync(join(here,'p964-ayah-meaning.js'),'utf8');
const revised=readFileSync(join(here,'p965-selected-ayah-no-scroll.js'),'utf8');
const oldCSS=readFileSync(join(here,'p964-ayah-meaning.css'),'utf8');
const css=readFileSync(join(here,'p965-selected-ayah-no-scroll.css'),'utf8');
const ack0="if(ok){pendingSelection=Date.now();stats.retarget++;ev.preventDefault();ev.stopImmediatePropagation();ev.stopPropagation()}";
const ack1="if(ok){pendingSelection=Date.now();stats.retarget++;try{var jump=w.__BASAIR_P964_AYAH_MEANING__;if(jump&&typeof jump.accept==='function')jump.accept(t,ev.target)}catch(_e){}ev.preventDefault();ev.stopImmediatePropagation();ev.stopPropagation()}";
const start=revised.indexOf('/* BASAIR P96.4 / QA024: life-cycle cleanup');
assert.ok(start>0);
const suffix=revised.slice(start);
assert.equal(revised.slice(0,revised.indexOf('  var natural=actualLineIndex(card);')),old.slice(0,old.indexOf('  var natural=actualLineIndex(card);')),'audio, owner retarget and original Quran engine prelude unchanged');
assert.ok(revised.includes(ack1),'owner retarget acknowledgement hook preserved');
assert.ok(revised.includes('selectedLine=choice.selectedLine(card,pg)'),'selected verse line promoted before conservative page approximation');
assert.ok(!suffix.includes('scrollTo(')&&!suffix.includes('scrollIntoView('),'no additional smooth scroll commands in adapter');
assert.equal(css.slice(0,oldCSS.length),oldCSS,'old Mushaf CSS byte-identical');
assert.ok(css.includes('body:not(.reader-active) #stableMeaning'));
assert.ok(css.includes('body:not(.reader-active) #b300WordMeaningOverlay'));
assert.ok(!suffix.includes('audio.play()')&&!suffix.includes('setPrint('),'does not control audio or print engine');
function classes(v=[]){const x=new Set(v);return{contains:k=>x.has(k),add:(...ks)=>ks.forEach(k=>x.add(k)),remove:(...ks)=>ks.forEach(k=>x.delete(k)),toggle:(k,v)=>v?x.add(k):x.delete(k)}}
function style(){const map=new Map();return{setProperty(k,v){map.set(k,v)},getPropertyValue:k=>map.get(k)||'',removeProperty:k=>map.delete(k)}}
function el(id,cl=[]){return{id,classList:classes(cl),style:style(),attrs:{},innerHTML:'<i>data</i>',isConnected:true,
 getAttribute(k){return this.attrs[k]||null},setAttribute(k,v){this.attrs[k]=String(v)},
 querySelector(){return null},querySelectorAll(){return []},closest(){return null},getBoundingClientRect(){return {top:0,height:24}},
 scrollHeight:0,clientHeight:0,scrollTop:0}}
function makeEnv(){
 const overlays={stableMeaning:el('stableMeaning',['show']),b300WordMeaningOverlay:el('b300WordMeaningOverlay',['show']),wordMeaningBox:el('wordMeaningBox')};
 overlays.stableMeaning.attrs['aria-hidden']='false';overlays.b300WordMeaningOverlay.attrs['aria-hidden']='false';
 const reader=el('mushafReader',['active']),body=el('body',['reader-active']),html=el('html');
 body.className='reader-active';
 const nodes={...overlays,mushafReader:reader};
 const observerNodes=[],timers=[],frames=[],intervals=[],events={};
 class MO{constructor(fn){this.fn=fn} observe(x,opts){observerNodes.push({node:x,fn:this.fn,opts})}}
 let closureCount=0;
 const s={running:true,page:3,paused:false,mode:'audio'};
 const w={
 __BASAIR_B345_SEQUENCE__:{state:s},currentPage:3,
 __BASAIR_WORD_MEANING_B227__:{close:()=>closureCount++},
 __BASAIR_B249_HIDE_LEGACY_MEANING__:()=>closureCount++,
 __BASAIR_B250_STABILITY__:{closeMeaning:()=>closureCount++},
 __BASAIR_P946_SHADE_SMOOTH__:{refresh:()=>{}},
 MutationObserver:MO,
 getComputedStyle:()=>({overflowY:'auto'}),
 requestAnimationFrame:fn=>{frames.push(fn);return frames.length},
 setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},
 setInterval:(fn,ms)=>{intervals.push({fn,ms});return intervals.length},
 addEventListener:(name,fn)=>{events['window:'+name]??=[];events['window:'+name].push(fn)}
 };
 const document={body,documentElement:html,readyState:'complete',
 getElementById:id=>nodes[id]||null,addEventListener:(name,fn)=>{events['document:'+name]??=[];events['document:'+name].push(fn)}
 };
 vm.runInNewContext(suffix,{window:w,document}, {timeout:5000});
 const api=w.__BASAIR_P964_AYAH_MEANING__;
 assert.ok(api);
 function flush(){let loops=0;while(frames.length){frames.shift()();if(++loops>50)throw Error('infinite RAF loop')}}
 function advance(n=30){for(let i=0;i<n&&timers.length;i++){timers.shift().fn();flush()}}
 return{api,w,document,body,reader,overlays,nodes,s,events,observerNodes,frames,timers,intervals,flush,advance,closureCount:()=>closureCount};
}
const x=makeEnv();x.flush();
assert.equal(x.overlays.stableMeaning.classList.contains('show'),true,'meaning stays when reader active');
assert.equal(x.overlays.b300WordMeaningOverlay.classList.contains('show'),true);
assert.equal(x.closureCount(),0,'no close while reading');
// Native navigation changed reader view and body active state: clean both official & legacy.
x.reader.classList.remove('active');x.body.classList.remove('reader-active');x.body.className='';
x.observerNodes[0].fn();x.flush();
assert.equal(x.overlays.stableMeaning.classList.contains('show'),false);
assert.equal(x.overlays.b300WordMeaningOverlay.classList.contains('show'),false);
assert.equal(x.overlays.stableMeaning.attrs['aria-hidden'],'true');
assert.equal(x.overlays.b300WordMeaningOverlay.attrs['aria-hidden'],'true');
assert.equal(x.overlays.stableMeaning.style.getPropertyValue('display'),'none');
assert.ok(x.closureCount()>0,'official close methods invoked');
// Late async response must not leave the meaning bar visible over home.
x.overlays.b300WordMeaningOverlay.classList.add('show');
x.overlays.b300WordMeaningOverlay.attrs['aria-hidden']='false';
x.api.sync();x.flush();
assert.equal(x.overlays.b300WordMeaningOverlay.classList.contains('show'),false);
assert.equal(x.overlays.b300WordMeaningOverlay.attrs['aria-hidden'],'true');
// Reenter reader: recover normal meaning cards, do not delete/disable them persistently.
x.reader.classList.add('active');x.body.classList.add('reader-active');x.body.className='reader-active';
x.api.sync();
assert.equal(x.overlays.stableMeaning.style.getPropertyValue('display'),'none','old meaning card stays suppressed by B249 while reading');
assert.equal(x.overlays.b300WordMeaningOverlay.style.getPropertyValue('display'),'');
const beforeHifz=x.closureCount();
x.reader.classList.remove('active');x.body.className='h25-hifz';x.body.classList.add('h25-hifz');
x.overlays.b300WordMeaningOverlay.classList.add('show');
x.api.sync();assert.equal(x.overlays.b300WordMeaningOverlay.classList.contains('show'),true,'hifz screens must remain untouched');
assert.equal(x.closureCount(),beforeHifz);
// Accepted native retarget previews the initial selected ayah without competing with native page movement.
const y=makeEnv();y.flush();
y.overlays.stableMeaning.classList.remove('show');
const word=el('word'),scrollBox=el('readerScroll');
scrollBox.clientHeight=180;scrollBox.scrollHeight=600;scrollBox.scrollTop=10;
scrollBox.getBoundingClientRect=()=>({top:0,height:180});
let scrollCalls=0;scrollBox.scrollTo=({top})=>{scrollCalls++;scrollBox.scrollTop=top};
word.parentElement=scrollBox;
word.getBoundingClientRect=()=>({top:275,height:20});
const line=el('ayahLine',['exactLine']);
word.closest=selector=>selector.includes('data-b345')?card:selector==='.exactLine'?line:null;
const card=el('pageCard');card.querySelector=sel=>sel.includes('pv-2-255')||sel.includes('data-selectayah="255"')?word:null;
card.isConnected=true;card.parentElement=scrollBox;
card.querySelectorAll=sel=>sel.includes('exactLine')?[line]:sel.includes('data-selectayah')?[word]:[];
const ref={page:3,s:2,a:255,g:300,progress:.7};
assert.equal(y.api.accept(ref,word),true,'native-acknowledged retarget is accepted');
y.flush();
assert.ok(word.classList.contains('bq964-ayah-focus'),'chosen ayah temporarily emphasized');
assert.equal(scrollBox.scrollTop,10,'native page motion is untouched by QA025');
assert.equal(scrollCalls,0,'no duplicate smooth scroll is issued on ayah tap');
assert.equal(y.api.diagnostics().scrollAligned,0);
assert.ok(word.classList.contains('bq965-ayah-selected'),'accepted first verse gets immediate provisional shade');
assert.equal(y.api.selectedLine(card,3),0,'selected ayah overrides stale per-page approximate line');
const nativeRef={getAttribute:k=>k==='data-s'?'2':k==='data-selectayah'?'255':k==='data-g'?'300':null};
const marked={closest:()=>nativeRef,getAttribute:()=>null};
card.querySelector=sel=>sel.includes('b441Follow')?marked:word;
assert.equal(y.api.selectedLine(card,3),-1,'native mark at selected ayah takes over');
assert.equal(word.classList.contains('bq965-ayah-selected'),false,'provisional shade disappears on native handoff');
assert.equal(y.api.diagnostics().nativeHandoff,1);
assert.equal(y.w.currentPage,3,'never changes page counter');
assert.equal(y.s.running,true,'never stops/restarts audio');
// The same selected ayah at 100% non-scrollable print: acknowledge visually, never jump whole window.
const z=makeEnv();z.flush();
const w2=el('fixedWord'), fixed=el('fixedPage');fixed.clientHeight=200;fixed.scrollHeight=200;
fixed.getBoundingClientRect=()=>({top:0,height:200});w2.parentElement=fixed;
w2.getBoundingClientRect=()=>({top:30,height:18});
const card2=el('card2');card2.isConnected=true;card2.querySelector=()=>w2;
w2.closest=()=>card2;
assert.equal(z.api.accept(ref,w2),true);z.flush();
assert.equal(z.api.diagnostics().scrollAligned,0,'100% fixed printed page must not be forced to scroll');
assert.equal(w2.classList.contains('bq964-ayah-focus'),true);
assert.equal(w2.classList.contains('bq965-ayah-selected'),true,'fixed page displays first-ayah shadow without scrolling');
// Selecting an earlier ayah must not be canceled by a stale native mark from the later verse.
const stale=makeEnv();stale.flush();
const older=el('oldAyah'),oldLine=el('oldLine',['exactLine']);
const oldCard=el('oldCard');oldCard.isConnected=true;older.isConnected=true;
older.closest=sel=>sel.includes('data-b345')?oldCard:sel==='.exactLine'?oldLine:null;
let currentNative={closest:()=>({getAttribute:k=>k==='data-s'?'2':k==='data-selectayah'?'260':k==='data-g'?'305':null})};
oldCard.querySelector=sel=>sel.includes('b441Follow')?currentNative:older;
oldCard.querySelectorAll=sel=>sel.includes('exactLine')?[oldLine]:[older];
const earlier={page:3,s:2,a:250,g:290,progress:.1};
assert.equal(stale.api.accept(earlier,older),true);
stale.flush();
assert.equal(stale.api.selectedLine(oldCard,3),0,'stale later-verse native mark cannot cancel newly selected earlier ayah');
assert.equal(older.classList.contains('bq965-ayah-selected'),true);
currentNative={closest:()=>({getAttribute:k=>k==='data-s'?'2':k==='data-selectayah'?'250':k==='data-g'?'290':null})};
assert.equal(stale.api.selectedLine(oldCard,3),-1,'fresh native mark at selected earlier ayah ends provisional highlight');
assert.equal(older.classList.contains('bq965-ayah-selected'),false);

// No retarget without running/paused native sequence.
const q=makeEnv();q.s.running=false;q.s.paused=false;q.flush();
assert.equal(q.api.accept(ref,word),false);
assert.equal(q.api.diagnostics().selectionAccepted,0);
console.log('PASS QA025: previous meaning cleanup intact, native-ack first ayah gets immediate shade, later native highlight takes over, zero duplicate scroll, fixed page untouched.');
