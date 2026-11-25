#!/usr/bin/env node
'use strict';
/* Reproducible single focused P220 test. Offline, does not sign or publish. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(dir,'p220/src/p220-original-print-audio-follow.js'),'utf8');
const contract=fs.readFileSync(path.join(dir,'p220/tests/original-audio-surface-contract.js'),'utf8');
const ctx={window:{}};
vm.runInNewContext(contract,ctx,{timeout:8000,filename:'p220/tests/original-audio-surface-contract.js'});
const result=ctx.window.__BASAIR_P220_TESTS__(source);
console.log(JSON.stringify(result,null,2));
if(result.failed||result.passed!==43)process.exitCode=1;
