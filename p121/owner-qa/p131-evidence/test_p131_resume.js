'use strict';
// P131 coordinator regression test. Run: node p121/owner-qa/p131-evidence/test_p131_resume.js
// Full source files are read from THIS repository; simulated DOM/clock, not Android WebView.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.resolve(__dirname,'../modules/tafsir');
const before=fs.readFileSync(path.join(dir,'p130-verse-tools.js'),'utf8');
const after=fs.readFileSync(path.join(dir,'p131-verse-tools.js'),'utf8');
function extract(src,name){
  const i=src.indexOf('  function '+name+'(');
  if(i<0)throw Error('Missing '+name);
  let d=0;const b=src.indexOf('{',i);
  for(let j=b;j<src.length;j++){
    if(src[j]==='{')d++;
    else if(src[j]==='}'&&!--d)return src.slice(i,j+1);
  }
  throw Error('Unbalanced '+name);
}
function simulate(source,opt={}){
  const {renderDelay=500,stateDelay=0,stopAt=null,wrongTarget=false,monitorAt=250}=opt;
  let now=0,started=0,running=false,verseState={s:1,a:4,type:'basair'};
  const timers=[],times=[],toasts=[];
  const oldRow={isConnected:true,getAttribute:()=> '4',getBoundingClientRect:()=>({height:200})};
  const newRow={isConnected:true,getAttribute:()=> wrongTarget?'5':'6',getBoundingClientRect:()=>({height:200})};
  let mounted=oldRow;
  const schedule=(fn,delay=0)=>timers.push({at:now+delay,fn});
  const host={querySelectorAll:()=>[oldRow,newRow],querySelector:()=>mounted};
  const follow={start:()=>{started++;times.push(now);running=true},status:()=>({running})};
  const step={open:()=>{
    schedule(()=>verseState={s:1,a:6,type:'basair'},stateDelay);
    schedule(()=>mounted=newRow,renderDelay);
  }};
  const env={api:()=>follow,step:()=>step,E:()=>host,valid:()=>true,
    verseRecord:()=>({s:1,a:6,type:'basair'}),currentRecord:()=>({s:1,a:6,type:'basair'}),
    state:()=>verseState,same:(a,b)=>a.s===b.s&&a.a===b.a&&a.type===b.type,
    inTafsir:()=>true,markExistingManualArticles:()=>{},synchronizeReaderMode:()=>{},
    renderButtons:()=>{},cancelPendingManual:()=>{},toast:s=>toasts.push(s),
    requestAnimationFrame:fn=>schedule(fn,16),setTimeout:schedule,position:()=>0,remember:()=>{}
  };
  vm.createContext(env);
  vm.runInContext('var intended=false,resetInFlight=false,manualStopAt=0,autoStartToken=0,lastObserved="";'+
    extract(source,'startFromVisible')+'\n'+extract(source,'monitor'),env);
  assert.equal(env.startFromVisible({}),true);
  if(stopAt!==null)schedule(()=>{env.intended=false;env.manualStopAt=now;env.autoStartToken++},stopAt);
  if(monitorAt!==null)schedule(()=>env.monitor(),monitorAt);
  let guard=1500;
  while(timers.length&&--guard>0){
    timers.sort((a,b)=>a.at-b.at);
    const next=timers.shift();now=next.at;next.fn();
    if(now>8000)break;
  }
  assert.ok(guard>0,'bounded asynchronous scheduling');
  return {started,times,toasts};
}
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name)}
check('P130 starts prematurely on stale mounted article',()=>{
  const r=simulate(before);assert.equal(r.started,1);assert.ok(r.times[0]<500)});
check('P131 waits for requested verse DOM',()=>{
  const r=simulate(after);assert.equal(r.started,1);assert.ok(r.times[0]>=500)});
check('P130 loses delayed STEP2 intent',()=>assert.equal(simulate(before,{stateDelay:400}).started,0));
check('P131 keeps delayed STEP2 intent',()=>assert.equal(simulate(after,{stateDelay:400}).started,1));
check('Stop cancels pending follow',()=>assert.equal(simulate(after,{stopAt:100}).started,0));
check('Stop cancels start just before animation frame',()=>assert.equal(simulate(after,{stopAt:602}).started,0));
check('Wrong verse cannot activate follow',()=>{
  const r=simulate(after,{wrongTarget:true});assert.equal(r.started,0);
  assert.ok(r.toasts.some(x=>x.includes('تعذر تجهيز')))});
check('Fast ready verse starts exactly once',()=>assert.equal(simulate(after,{renderDelay:0}).started,1));
check('Ready verse starts without monitor',()=>assert.equal(simulate(after,{monitorAt:null}).started,1));
check('Late verse state starts exactly once',()=>assert.equal(simulate(after,{stateDelay:650,renderDelay:450}).started,1));
console.log(JSON.stringify({passed,total:10,scope:'isolated Node VM coordination only; Android field acceptance required'}));