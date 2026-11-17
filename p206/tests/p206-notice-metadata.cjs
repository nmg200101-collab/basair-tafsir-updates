'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('p206/staging/p206-unified-update-notice.js','utf8');
const doc={readyState:'loading',addEventListener(){}},w={};
vm.runInNewContext(source,{window:w,document:doc,Number,Array,String},{timeout:3000});
const api=w.__BASAIR_P206_NOTICES__;
const candidate={envelope:{payload:'signed-by-P121'},newer:true,
 manifest:{sequence:111,id:'P206-SEQ111',title:'إصلاح متابعة التلاوة',issuedAt:'2026-11-17T18:40:00Z',changeType:'إصلاح التلاوة والتحديثات',restartRequired:true,
  changeSummary:['العودة للوضع الثابت','إدارة ستة إصدارات'],modules:[{id:'tafsir'},{id:'tilawa'},{id:'updates'}]},
 changes:[{id:'tilawa'},{id:'updates'}]};
const release=api.extract(candidate);
assert.equal(release.sequence,111);assert.equal(release.changeType,'إصلاح التلاوة والتحديثات');
assert.deepEqual(Array.from(release.modules),['التلاوة','التحديثات']);
assert.equal(release.summary.length,2);assert.equal(release.restartRequired,true);
console.log('PASS verified OTA metadata renders release number, type, changes, restart and affected modules');
assert.equal(api.extract({...candidate,envelope:null}),null);
assert.equal(api.extract({...candidate,manifest:{...candidate.manifest,sequence:0}}),null);
console.log('PASS notice refuses incomplete or invalid release records');
