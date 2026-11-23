#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const w={};
vm.runInNewContext(read('p216/tests/signed-scope-archive-contract.js'),{window:w},{timeout:5000});
w.__BASAIR_P216_SIGNED_SCOPE_TESTS__(
 read('p121/owner-qa/modules/updates/p206-signed-six-rollback.js'),
 read('p216/src/p216-signed-six-rollback-v2.js')
).then(r=>{console.log(JSON.stringify(r,null,2));if(r.failed||r.passed!==17)process.exitCode=1}).catch(e=>{console.error(e);process.exitCode=1});
