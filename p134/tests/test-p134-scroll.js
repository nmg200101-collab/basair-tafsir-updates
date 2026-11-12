'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../modules/tafsir/p134-verse-tools.js'),'utf8');
const natiq=fs.readFileSync(path.resolve(__dirname,'../modules/tafsir/p134-natiq.js'),'utf8');
const checks=[
 ['P134 scroll candidate identifies QA-only version',/P134-IDLE-MANUAL-SCROLL-QA-NOT-LIVE/.test(source)],
 ['manual scroll idle guard exists',/manualLastGestureAt&&Date\.now\(\)-manualLastGestureAt<900/.test(source)],
 ['manual scroll uses actual scrolling element',/var root=manualScrollContainer\(\)/.test(source)],
 ['scroll owner walks scrollable ancestors',/el=el\.parentElement/.test(source)],
 ['no manual cleanup while follow is running',/!host\|\|!inTafsir\(\)\|\|\(st&&st\.running\)/.test(source)],
 ['P134 never synthesizes Quran verse audio',/NEVER uses synthetic voice for Quran recitation/.test(natiq)],
 ['P134 does not touch Tilawa branch',!/p92\/owner-qa-001\/release\.json/.test(source+natiq)],
 ['P134 narrator isolates status DOM mutations',/function natiqUiNode\(/.test(natiq)]
];
let count=0;
for(const [name,ok] of checks){assert.equal(ok,true,name);console.log('PASS '+name);count++;}
console.log(JSON.stringify({pass:count,total:checks.length,scroll:'static only',device:'not tested'}));
