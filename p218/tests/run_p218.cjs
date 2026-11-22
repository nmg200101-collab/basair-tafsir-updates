#!/usr/bin/env node
/* P218 isolated integration/contract test.
 * Run from repo root: node p218/tests/run_p218.cjs
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
(async()=>{
  const w={window:{}};
  vm.runInNewContext(read('p218/tests/unified-comprehensive-update-contract.js'),w,{timeout:8000});
  const r=await w.window.__BASAIR_P218_CENTER_TESTS__(
    read('p218/src/p218-unified-comprehensive-updates.js'),
    read('p218/src/p218-unified-comprehensive-updates.css'));
  console.log(JSON.stringify(r,null,2));
  if(r.failed||r.passed<39)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
