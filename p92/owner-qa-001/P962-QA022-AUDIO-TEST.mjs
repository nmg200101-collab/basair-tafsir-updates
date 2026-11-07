// BASAIR P96.2 QA022: exercise the *actual* audioError() extracted from the shipped JS.
// No app audio API, Quran page DOM, private key, or OTA channel is touched.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=dirname(fileURLToPath(import.meta.url));
const baseline=readFileSync(join(root,'p951-font-restored-follow.js'),'utf8');
const candidate=readFileSync(join(root,'p962-audio-error-recovery.js'),'utf8');
const beforeDecl="var token=++pendingErrorToken,failedPage=page();waitingSourceFail=true;";
const afterDecl="var token=++pendingErrorToken,failedPage=page(),failedSrc=String(this.currentSrc||this.src||'');waitingSourceFail=true;";
const beforeGate="if(!w.playing&&mode()!=='audioPage')showRecover('لم يتمكن القارئ من تحميل صوت الصفحة');";
const afterGate="if(mode()==='audioPage'&&w.playing!==true&&aud&&aud.error&&String(aud.currentSrc||aud.src||'')===failedSrc)showRecover('لم يتمكن القارئ من تحميل صوت الصفحة');";
assert.equal(candidate.replace(afterDecl,beforeDecl).replace(afterGate,beforeGate),baseline,'only two audio-error guard lines changed');
assert.equal((baseline.split(beforeGate).length-1),1,'the old bug is unique');
assert.equal((candidate.split(afterGate).length-1),1,'new guard is unique');
assert.ok(!candidate.includes("line.style.setProperty('font-size'"),'QA020 font restoration stays intact');
assert.ok(candidate.includes("__BASAIR_P946_SHADE_SMOOTH__"),'QA016 follow controls are preserved');

function fragment(code){
  const start=code.indexOf('function audioError(){');
  const end=code.indexOf('function naturalEndRecovery(t){',start);
  assert.ok(start>0&&end>start,'expected audio error handler boundaries');
  return code.slice(start,end);
}

function caseRun(code,options={}){
  const queue=[],recover=[],logs=[];
  const audio={src:'page-3-source-1.mp3',currentSrc:'page-3-source-1.mp3',error:{code:2}};
  const context={
    pendingErrorToken:0,waitingSourceFail:false,aud:audio,
    w:{playing:options.playing??false,setTimeout:(cb,ms)=>{assert.equal(ms,2200);queue.push(cb)}},
    reader:()=>options.reader??true,mode:()=>options.mode??'audioPage',
    page:()=>options.page??3,
    log:(reason)=>logs.push(reason),
    showRecover:(message)=>recover.push(message)
  };
  context.audioError=vm.runInNewContext('('+fragment(code).trim()+')',context,{timeout:3000});
  context.audioError.call(audio);
  assert.equal(queue.length,1,'one delayed native-source-fallback window');
  return {context,audio,queue,recover,logs,flush:()=>queue.shift()()};
}

assert.equal(caseRun(baseline).recover.length,0,'prior handler is not triggered until timer');
// Reproduce QA016 bug: failure persists, but no action because mode is still audioPage.
{const a=caseRun(baseline);a.flush();assert.equal(a.recover.length,0,'reproduced previous unreachable retry UI');}
{const a=caseRun(candidate);a.flush();assert.equal(a.recover.length,1,'persistent actual error shows user-controlled retry');}
{const a=caseRun(candidate,{playing:true});a.flush();assert.equal(a.recover.length,0,'successful fallback playback suppresses retry');}
{const a=caseRun(candidate);a.audio.error=null;a.flush();assert.equal(a.recover.length,0,'cleared error suppresses retry');}
{const a=caseRun(candidate);a.audio.currentSrc='page-3-source-2.mp3';a.flush();assert.equal(a.recover.length,0,'fallback source switch suppresses stale retry');}
{const a=caseRun(candidate);a.context.w.playing=true;a.flush();assert.equal(a.recover.length,0,'playback started during delay suppresses retry');}
{const a=caseRun(candidate);a.context.mode=()=> 'silent';a.flush();assert.equal(a.recover.length,0,'mode switched away suppresses retry');}
{const a=caseRun(candidate);a.context.reader=()=>false;a.flush();assert.equal(a.recover.length,0,'leaving Mushaf suppresses retry');}
{const a=caseRun(candidate);a.context.page=()=>4;a.flush();assert.equal(a.recover.length,0,'changed page suppresses stale retry');}
{const a=caseRun(candidate);a.context.pendingErrorToken++;a.flush();assert.equal(a.recover.length,0,'later audio attempt supersedes retry');}
{const a=caseRun(candidate);a.flush();assert.equal(a.context.waitingSourceFail,false,'pending fallback state cleared');}
console.log('PASS QA022: 11 audio-error fallback scenarios; original bug reproduced; no automatic page skip, no Quran font or engine changes.');
