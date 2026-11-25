#!/usr/bin/env node
/* Focused P221 regression only; no rebuild, signing or publishing. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const src=fs.readFileSync(path.join(root,'p221/src/p221-original-audio-visible-progress.js'),'utf8');
const test=fs.readFileSync(path.join(root,'p221/tests/p221-native-visible-progress-contract.js'),'utf8');
const ctx={window:{}};
vm.runInNewContext(test,ctx,{timeout:8000});
const r=ctx.window.__BASAIR_P221_VISUAL_TESTS__(src);
console.log(JSON.stringify(r,null,2));
if(r.failed||r.passed!==40)process.exitCode=1;
