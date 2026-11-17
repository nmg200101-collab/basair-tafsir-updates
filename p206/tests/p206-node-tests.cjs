'use strict';
/* P206 non-device QA: real signed P205 envelope plus reversible R33/B345 mock lifecycle. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=process.cwd();
const load=x=>fs.readFileSync(root+'/'+x,'utf8');
const results=[];
function check(name,fn){return Promise.resolve().then(fn).then(()=>{results.push({name,ok:true});console.log('PASS '+name)})}
(async()=>{
 const src=load('p206/staging/p206-signed-six-rollback.js');
 const env=JSON.parse(load('p205/P205-SEQ109-OWNER-SIGNED-AUTOMATIC.json'));
 const w={crypto:crypto.webcrypto,indexedDB:{}},d={readyState:'loading',addEventListener(){}};
 const context={window:w,document:d,crypto:crypto.webcrypto,indexedDB:w.indexedDB,
  TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Promise,Number,Set,Date,JSON,Error,atob,console};
 vm.runInNewContext(src,context,{timeout:4000});
 const signer=w.__BASAIR_P206_SIGNED_ARCHIVE__;
 await check('pinned P205 RSA and Ed25519 signature verified',async()=>{
  const m=await signer.verify(env);assert.equal(m.sequence,109);
  assert.equal(m.applicationId,'app.basair.qurv2');assert.ok(m.modules.some(x=>x.id==='tilawa'));
 });
 await check('tampered signed release rejected',async()=>{
  const changed={...env},bytes=Buffer.from(env.payload,'base64');bytes[5]^=1;changed.payload=bytes.toString('base64');
  await assert.rejects(signer.verify(changed),/signature|Untrusted|Invalid/);
 });
 await check('six stable release policy exposed',()=>{assert.equal(signer.limit,6)});
 const signed=await signer.verify(env),active={};let verifiedAssets=0;
 for(const mod of signed.modules){let files={};for(const a of mod.assets){
  const buff=fs.readFileSync(root+'/p121/owner-qa/'+a.path);
  assert.equal(buff.byteLength,a.size,'signed size '+a.path);
  files[a.path]=buff.buffer.slice(buff.byteOffset,buff.byteOffset+buff.byteLength);verifiedAssets++;
 }active[mod.id]={version:mod.version,assets:mod.assets,files};}
 await check('all '+verifiedAssets+' P205 signed assets match their SHA-256',async()=>{
  assert.equal(await signer.matches(active,signed),true);
 });
 await check('tampered cached asset is rejected',async()=>{
  const m=signed.modules.find(x=>x.assets.length>0),a=m.assets[0],bytes=new Uint8Array(active[m.id].files[a.path]),old=bytes[0];
  bytes[0]^=1;try{assert.equal(await signer.matches(active,signed),false)}finally{bytes[0]=old}
 });
 const ctl={state:{running:false,paused:false,page:4,scaleMode:'normal',printStaticHeld:true},releaseStaticPrint(){this.state.printStaticHeld=false;released++}};
 let released=0,restored=[],buttons=[],timerFns=[],scheduled=[],frameCount=0,mode='tajwid',blocked=false,adapterInstalls=0;
 const classes={contains(name){return name==='reader-active'||(name==='stableDigital'&&blocked)}};
 const img={getAttribute(){return '4'}};
 const card={querySelector(s){return frameCount>0?{}:null},appendChild(e){if(e.className==='stableFrame')frameCount++}};
 const body={classList:classes,getAttribute(k){return k==='data-v144-print'?mode:null}};
 const doc={
  body,readyState:'complete',addEventListener(type,fn){if(type==='click')buttons.push(fn)},
  getElementById(){return null},
  querySelector(q){if(q.indexOf('.localPageStage .stableFrame')>=0)return {};if(q.indexOf('img[data-mushaf-page]')>=0)return img;return null},
  querySelectorAll(q){return q.includes('r33PrintShell')?[card]:[]},
  createElement(){return {className:'',setAttribute(){}}}
 };
 class MockImage{set src(x){this._src=x;this.naturalWidth=720;this.naturalHeight=1280;if(this.onload)this.onload()}get src(){return this._src}}
 const printer={edition:()=>mode,scale:()=>100,frozenActive:()=>ctl.state.printStaticHeld};
 const fw={
  __BASAIR_B345_SEQUENCE__:ctl,__BASAIR_PRINT_FOLLOW_100__:printer,
  __BASAIR_P205_ORIGINAL_PRINT_PARITY__:{install(){adapterInstalls++;return true}},
  Image:MockImage,setTimeout(fn){scheduled.push(fn)},setInterval(fn){timerFns.push(fn)},
  renderLocalPage(page){restored.push(page)}
 };
 const ctx={window:fw,document:doc,Image:MockImage,Date,Number,Promise,Array,Object,Set,Error};
 vm.runInNewContext(load('p206/staging/p206-native-follow-lifecycle.js'),ctx,{timeout:4000});
 const guard=fw.__BASAIR_P206_FOLLOW_GUARD__;
 const click=name=>buttons.forEach(fn=>fn({target:{closest(){return {getAttribute(){return name},textContent:name}}}}));
 const flush=()=>{let x=scheduled.splice(0);x.forEach(fn=>fn())};
 await check('existing signed P205 adapter primed before a first Follow tap',()=>{
  click('متابعة');assert.ok(adapterInstalls>=1);assert.equal(guard.status().adapterReady,true);
 });
 await check('prewarm printed pages before first start',()=>{
  assert.ok(guard.status().prewarmed>=2);
 });
 await check('single decorative frame, no duplicate renderer',()=>{
  ctl.state.running=true;guard.refresh();guard.refresh();assert.equal(frameCount,1);
 });
 await check('pause does not return to static page',()=>{
  click('إيقاف مؤقت');ctl.state.running=false;ctl.state.paused=true;guard.refresh();flush();assert.equal(restored.length,0);
 });
 await check('stop releases frozen static and renders native page once',()=>{
  ctl.state.paused=false;ctl.state.running=true;guard.refresh();
  click('إيقاف');ctl.state.running=false;guard.refresh();flush();
  assert.equal(restored.length,1);assert.equal(restored[0],4);assert.equal(released,1);
 });
 await check('digital reader excluded',()=>{
  blocked=true;ctl.state.running=true;guard.refresh();assert.equal(guard.status().eligible,false);
 });
 console.log(JSON.stringify({result:'PASS',count:results.length}));
})().catch(err=>{console.error(err.stack);process.exitCode=1});
