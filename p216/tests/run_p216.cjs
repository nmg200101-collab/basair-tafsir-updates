#!/usr/bin/env node
/* P216 offline regressions. Does not activate OTA or invoke private keys. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
(async()=>{
 const ctx={window:{}};
 vm.runInNewContext(read('p216/tests/unified-center-regression.js'),ctx,{timeout:10000});
 const r=await ctx.window.__BASAIR_P216_TESTS__(
  read('p216/src/p216-unified-center-model.js'),
  read('p216/src/p216-unified-updates-center.js'));
 console.log(JSON.stringify({...r,scope:'Fake DOM signed-check and P206 mock; not V695 Android WebView acceptance'},null,2));
 if(r.failed||r.passed<20)process.exitCode=1;
})().catch(e=>{console.error(String(e));process.exitCode=1});
