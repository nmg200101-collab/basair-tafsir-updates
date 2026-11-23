#!/usr/bin/env node
'use strict';
/* P216 P121 IndexedDB integration: mocks signatures and state database only.
 * No original signing credentials, APK or live OTA changes.
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sandbox={window:{}};
vm.runInNewContext(read('p216/tests/p121-state-integration-contract.js'),sandbox,{timeout:5000});
sandbox.window.__BASAIR_P216_STATE_INTEGRATION_TESTS__(
 read('p121/owner-qa/modules/updates/p206-signed-six-rollback.js'),
 read('p216/src/p216-signed-six-rollback-v2.js')
).then(result=>{
 console.log(JSON.stringify(result,null,2));
 if(result.failed!==0||result.passed!==17)process.exitCode=1;
}).catch(e=>{console.error(e);process.exitCode=1});
