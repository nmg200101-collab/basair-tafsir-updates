#!/usr/bin/env node
'use strict';
/* P216/P217 owner-qa candidate audit runner; read-only, no OTA publication.
 * Tests mocked UI + signed archive scope + simulated P121 IndexedDB + history.
 * All tests are isolated and do not substitute Android/WebView acceptance.
 */
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const cwd=path.resolve(__dirname,'../..');
const jobs=[
 {name:'P216 center',file:'p216/tests/run_p216.cjs',expected:44},
 {name:'P216 signed scope',file:'p216/tests/run_signed_scope_archive.cjs',expected:17},
 {name:'P121 IndexedDB integration',file:'p216/tests/run_p121_state_integration.cjs',expected:17},
 {name:'P217 verified history',file:'p217/tests/run_p217.cjs',expected:29}
];
let all=true;
for(const x of jobs){
 const p=spawnSync(process.execPath,[x.file],{cwd,encoding:'utf8',timeout:15000,
   env:{...process.env,NODE_OPTIONS:''}});
 let obj=null;try{obj=JSON.parse(p.stdout||'{}')}catch(_){}
 const ok=p.status===0&&obj&&obj.failed===0&&obj.passed===x.expected;
 console.log(JSON.stringify({suite:x.name,expected:x.expected,passed:obj&&obj.passed,
   failed:obj&&obj.failed,ok},null,2));
 if(!ok){all=false;
   if(p.stderr)console.error(p.stderr.slice(0,1500));
   if(p.error)console.error(String(p.error));
 }
}
console.log(all?'PASS 107/107 isolated cases; Android/WebView NOT TESTED':
                'FAIL: do not publish owner-qa candidate');
if(!all)process.exitCode=1;
