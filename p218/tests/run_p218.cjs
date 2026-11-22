#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{}};
vm.runInNewContext(read('p218/tests/shadow-compat-contract.js'),ctx,{timeout:5000});
const result=ctx.window.__BASAIR_P218_TESTS__(
  read('p218/src/p218-digital-shadow-compat.js'),
  read('p218/src/p218-digital-shadow-compat.css'),
  read('p121/owner-qa/modules/tilawa/p215-digital-follow-shadow.js'));
console.log(JSON.stringify(result,null,2));
if(result.failed!==0||result.passed!==24)process.exitCode=1;
