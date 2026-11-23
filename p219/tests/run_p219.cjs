#!/usr/bin/env node
'use strict';
/* P219 read-only owner QA regression — no OTA install/signing and no APK. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const src=read('p219/src/p219-native-single-shadow-owner.js');
const original=read('p121/owner-qa/modules/tilawa/p215-digital-follow-shadow.js');
const unit={window:{}},integration={window:{}};
vm.runInNewContext(read('p219/tests/native-single-owner-contract.js'),unit,{timeout:5000});
vm.runInNewContext(read('p219/tests/p215-real-source-arbitration-contract.js'),integration,{timeout:5000});
const a=unit.window.__BASAIR_P219_SINGLE_OWNER_TESTS__(src);
const b=integration.window.__BASAIR_P219_P215_INTEGRATION_TESTS__(original,src);
console.log(JSON.stringify({unit:a,integration:b,totalPassed:a.passed+b.passed,
 totalFailed:a.failed+b.failed,androidWebView:false},null,2));
if(a.passed!==24||b.passed!==15||a.failed||b.failed)process.exitCode=1;
