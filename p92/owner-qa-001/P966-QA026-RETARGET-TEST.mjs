// BASAIR P96.6 QA026: exercise original retarget callbacks, not reimplemented business logic.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const here=dirname(fileURLToPath(import.meta.url));
const old=readFileSync(join(here,'p965-selected-ayah-no-scroll.js'),'utf8');
const now=readFileSync(join(here,'p966-native-retarget-dedupe.js'),'utf8');
const oldCSS=readFileSync(join(here,'p965-selected-ayah-no-scroll.css'),'utf8');
const css=readFileSync(join(here,'p966-native-retarget-dedupe.css'),'utf8');
assert.ok(css.startsWith(oldCSS),'QA025 Quran font/CSS must remain identical');
assert.ok(css.includes('.r33PrintShell .ayahHit.bq965-ayah-selected'),'image-based selected-ayah CSS must exist');
assert.ok(now.includes('function exitMeaning()'),'QA024 successful meaning cleanup preserved');
assert.ok(!now.slice(now.indexOf('/* BASAIR P96.4 / QA024')).includes('scrollTo('),'no competing scroll');
function extract(source,name){
 const token='function '+name+'(';const p=source.indexOf(token);
 assert.ok(p>=0,'missing function '+name);
 const start=source.indexOf('{',p);
 let depth=0,end=-1,quote='',escaped=false;
 for(let i=start;i<source.length;i++){
  const c=source[i];
  if(quote){
   if(escaped){escaped=false;continue}
   if(c==='\\'){escaped=true;continue}
   if(c===quote){quote=''}continue;
  }
  if(c==='"'||c==="'"||c.charCodeAt(0)===96){quote=c;continue}
  if(c==='{')depth++;
  if(c==='}'){depth--;if(depth===0){end=i+1;break}}
 }
 assert.ok(end>start,'unterminated callback '+name);
 return source.slice(p,end);
}
function classes(){const s=new Set();return{add:x=>s.add(x),remove:x=>s.delete(x),contains:x=>s.has(x)}}
function simulate(code,nativeHandled){
 const event={clientX:44,clientY:110,target:{closest:()=>({})},preventDefault(){},stopImmediatePropagation(){},stopPropagation(){}};
 const target={page:3,s:2,a:255,g:292,progress:.5};
 const stateObj={running:true,paused:false,mode:'audio',page:3,scaleMode:'normal',printRetargets:0},stats={};
 const hit={classList:classes(),isConnected:true};
 const card={querySelector:q=>q.includes('.ayahHit')?hit:null};
 const w={
  selectedSurah:2,selectedTilawaAyah:1,selectedGlobal:270,
  __BASAIR_PRINT_FOLLOW_100__:{active:()=>true},
  __BASAIR_P964_AYAH_MEANING__:{accept:(ayah,node)=>{accepted.push({ayah,node});return true}}
 };
 const accepted=[];
 const engine={retargetPrintAyah(t){stateObj.printRetargets++;w.selectedSurah=t.s;w.selectedTilawaAyah=t.a;w.selectedGlobal=t.g;return true}};
 const env={w,stats,lastNativeGesture:null,activeAudio:()=>true,state:()=>stateObj,c:()=>engine,targetAt:()=>target,isPrinted:()=>true,page:()=>stateObj.page,E:()=>({querySelector:()=>card}),Date,Number};
 const names=code===old?['retargetClick']:['nativePrintAvailable','gestureStartObserve','nativeHitFor','gestureEndObserve','retargetClick'];
 const parts=names.map(name=>extract(code,name)).join('\n')+'\nreturn { '+names.join(',')+' };';
 const methods=vm.runInNewContext('(function(){'+parts+'})',env,{timeout:3000})();
 if(code!==old)methods.gestureStartObserve(event);
 if(nativeHandled){engine.retargetPrintAyah(target);if(code!==old)methods.gestureEndObserve(event)}
 methods.retargetClick(event);
 return {count:stateObj.printRetargets,stats,accepted};
}
assert.equal(simulate(old,true).count,2,'QA025 makes two retarget calls for one pointerup+click');
const safe=simulate(now,true);
assert.equal(safe.count,1,'QA026 makes exactly one retarget for one tap');
assert.equal(safe.stats.nativeClickDeduplicated,1,'duplicate click was guarded');
assert.equal(safe.accepted.length,1,'native accepted selection is passed to visual preview');
assert.equal(safe.accepted[0].ayah.a,255);
assert.equal(simulate(now,false).count,1,'fallback click works when native gesture did not retarget');
assert.equal(simulate(old,false).count,1,'fallback baseline');
{
 const hit={classList:classes(),isConnected:true},card={isConnected:true,querySelector:()=>null,querySelectorAll:q=>q.includes('.ayahHit')?[hit]:[]};
 hit.closest=()=>card;
 const host={querySelector:()=>card},counts={};
 const ctx={selectedNodes:[],selected:null,counts,E:id=>id==='b345NormalStack'?host:card,Array,Date,Number};
 ctx.clearSelection=vm.runInNewContext('('+extract(now,'clearSelection')+')',ctx);
 const mark=vm.runInNewContext('('+extract(now,'markSelectedAyah')+')',ctx);
 assert.equal(mark({page:3,s:2,a:255,g:292},hit),true);
 assert.equal(ctx.selectedNodes.length,1,'real printed-image ayahHit selected');
 assert.equal(hit.classList.contains('bq965-ayah-selected'),true,'native image verse visibly shaded');
}
const added=now.slice(now.indexOf('// P96.6 QA026: native R33'));
assert.ok(!added.includes('scrollTo(')&&!added.includes('.currentTime=')&&!added.includes('.play()'),'no new audio/scroll mutation');
console.log('PASS QA026: QA025 duplicate retarget reproduced (2); QA026 single retarget (1); native hit highlighted; click fallback preserved; no engine or scrolling changes.');
