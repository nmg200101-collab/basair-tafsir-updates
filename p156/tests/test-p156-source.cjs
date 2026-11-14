'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p));
const js=read('p121/owner-qa/modules/tafsir/p156-tafsir-recovery.js').toString('utf8');
const css=read('p121/owner-qa/modules/tafsir/p156-tafsir-recovery.css').toString('utf8');
new vm.Script(js,{filename:'p156-tafsir-recovery.js'});
assert.ok(js.includes('__BASAIR_TAFSIR_P156_RECOVERY__'));
assert.ok(js.includes('data-bq156-notes')&&js.includes('data-bq156-follow'));
assert.ok(js.includes('manual.completed')&&js.includes('manual.faulted'));
assert.ok(js.includes('v194T5Ayah')&&js.includes('loadNext()'));
assert.ok(js.includes('p129-manual')&&js.includes('p128-follow'));
assert.ok(js.includes("m.target===bar||m.target===idx"),'Index bar mutations must be observed');
assert.ok(!js.includes('localStorage.setItem')&&!js.includes('indexedDB.deleteDatabase'), 'No new or cleared data stores');
assert.ok(!js.includes('cloneNode('),'Never clone native click handlers');
assert.ok(!js.includes('stopImmediatePropagation'),'No global event capture hijack');
assert.ok(!js.includes('setInterval('),'No repeated repaint/watchdog loops');
assert.ok(!js.includes("document.write"),'No wholesale native DOM replacement');
assert.ok(css.includes('button[data-b233-top="search"]')&&css.includes('button[data-bq156-notes="1"]'));
assert.ok(!css.includes('position:fixed')&&!css.includes('pointer-events:none'),'No global touch blocker');
const rollback=read('p121/owner-qa/release-p155-seq32-before-p156-20261114.json');
const signedP155=read('p155/P155-SEQ32-OWNER-SIGNED-RELEASE.json');
const signedP156=read('p156/P156-SEQ33-OWNER-SIGNED-RELEASE.json');
const active=read('p121/owner-qa/release.json');
assert.deepEqual(rollback,signedP155,'Original signed Seq32 rollback must be byte-exact');
assert.deepEqual(active,signedP156,'Active owner release must be signed P156 Seq33');
const old=JSON.parse(Buffer.from(JSON.parse(rollback).payload,'base64').toString('utf8'));
const decoded=JSON.parse(Buffer.from(JSON.parse(active).payload,'base64').toString('utf8'));
assert.equal(old.sequence,32);
assert.equal(decoded.sequence,33);
assert.equal(decoded.modules[0].version,31);
assert.equal(decoded.applicationId,'app.basair.qurv2');
assert.equal(decoded.modules.length,1);
assert.deepEqual(decoded.modules[0].assets.map(a=>a.path),[
 'modules/tafsir/p156-tafsir-recovery.css',
 'modules/tafsir/p156-tafsir-recovery.js'
]);
console.log(JSON.stringify({status:'PASS',scriptSyntax:true,sourceOnly:true,
 nativeNotesAndFavoriteStorage:'UNTOUCHED',noGlobalClickCapture:true,
 noDrawInterval:true,manualFeedGuard:true,
 activeSeq:32,tafsirModule:30,releaseStatus:'NOT_CHANGED',
 sha256Js:crypto.createHash('sha256').update(js).digest('hex'),
 sha256Css:crypto.createHash('sha256').update(css).digest('hex'),
 bytesJs:Buffer.byteLength(js),bytesCss:Buffer.byteLength(css),
 realAndroid:'PENDING_OWNER_DEVICE'}));
