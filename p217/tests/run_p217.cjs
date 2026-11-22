#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
(async()=>{
 const win={};vm.runInNewContext(read('p217/tests/verified-history-contract.js'),{window:win},{timeout:5000});
 const result=await win.__BASAIR_P217_HISTORY_TESTS__(read('p217/src/p217-verified-history.js'));
 console.log(JSON.stringify(result,null,2));
 if(result.failed!==0||result.passed!==27)process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1});
