#!/usr/bin/env node
/* P214: 100% digital exact renderer tests. Run: node p214/tests/run_p214.cjs
 * Read-only: loads production V695/P213 bridge and P214 digital-only replacement
 * in an isolated JS sandbox, no APK creation, signing, or publishing.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
function load(win,file){
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window:win},
    {filename:file,timeout:5000});
}
function run(adapter){
  const win={};
  load(win,'p121/owner-qa/modules/tilawa/p213-unified-follow-core.js');
  load(win,adapter);
  load(win,'p214/tests/adapter-routing-digital-regression.js');
  return win.__BASAIR_P213_ROUTING_TESTS__();
}
const baseline=run('p121/owner-qa/modules/tilawa/p213-follow-route-adapters.js');
const corrected=run('p214/src/p214-follow-route-adapters.js');
const reproducible=baseline.errors.some(s=>s.includes('100% accepts V695 exact-line font digital')) &&
                   baseline.errors.some(s=>s.includes('digital runs B345'));
const ok=reproducible && corrected.failed===0 && corrected.passed>=61;
console.log(JSON.stringify({
  source:'V695 renderExactUnicodePage contract',
  priorP213:{passed:baseline.passed,failed:baseline.failed},
  p214:{passed:corrected.passed,failed:corrected.failed,errors:corrected.errors},
  priorFailureReproduced:reproducible,
  result:ok?'PASS':'FAIL',
  scope:'Isolated regression; does not prove Android WebView or real audio'
},null,2));
if(!ok)process.exitCode=1;
