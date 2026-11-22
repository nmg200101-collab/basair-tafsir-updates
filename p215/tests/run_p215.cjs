#!/usr/bin/env node
/* P215 automated visual-contract regression, no OTA activation. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=(x)=>fs.readFileSync(path.join(root,x),'utf8');
const context={window:{}};
vm.runInNewContext(read('p215/tests/shadow-contract.js'),context,{timeout:8000});
const result=context.window.__BASAIR_P215_SHADOW_TESTS__(
  read('p215/src/p215-digital-follow-shadow.js'),
  read('p215/src/p215-digital-follow-shadow.css'));
console.log(JSON.stringify({P215:'digital-shadow-only',...result,
  limit:'DOM-contract mock; not Android audio/WebView acceptance'},null,2));
if(result.failed||result.passed<24)process.exit(1);
