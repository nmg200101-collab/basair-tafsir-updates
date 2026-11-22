#!/usr/bin/env node
/* Run safely in a local repo checkout: node p216/tests/run_p216.cjs */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
(async()=>{
  const ctx={window:{}};
  vm.runInNewContext(read('p216/tests/unified-center-contract.js'),ctx,
                     {timeout:5000,filename:'p216-unified-contract.js'});
  const result=await ctx.window.__BASAIR_P216_CENTER_TESTS__(
    read('p216/src/p216-unified-update-center.js'),
    read('p216/src/p216-unified-update-center.css'));
  console.log(JSON.stringify(result,null,2));
  if(result.failed!==0||result.passed<26)process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1});
