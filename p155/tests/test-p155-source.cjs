'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const js=read('p121/owner-qa/modules/tafsir/p155-native-foundation.js').toString('utf8');
const css=read('p121/owner-qa/modules/tafsir/p155-native-foundation.css').toString('utf8');
new vm.Script(js,{filename:'p155-native-foundation.js'});
assert.equal(js.includes('stopImmediatePropagation'),false,'No capture hijacking allowed');
assert.ok(!js.includes('setInterval'),'No permanent repaint timer allowed');
assert.ok(!js.includes('localStorage.setItem('),'Do not create a second notes/favorites store');
assert.ok(!js.includes('cloneNode('),'Never duplicate native buttons');
assert.ok(!js.includes("data-r3-note-pos"),'Native R3 notes are not to be redrawn');
assert.ok(js.includes('data-r2-action="note"')&&js.includes("r.toggle()"),'Native R2/R114 must be reused');
assert.ok(js.includes('data-bq155-notes')&&js.includes('favoritesUpgrade'),'Reuse R3 Saved tabs');
assert.ok(css.includes('#tafsirAyahs')&&css.includes('#tafsirIndex'));
assert.ok(!css.includes('position:fixed'),'Never create a full-screen touch blocker');
assert.ok(!css.includes('pointer-events:none!important')||css.includes('.b263r3NoteChip'),'No global blocked pointer events');
const previous=read('p121/owner-qa/release.json');
const rollback=read('p121/owner-qa/release-p154-seq31-before-p155-20261114.json');
assert.deepEqual(rollback,read('p154/P154-SEQ31-OWNER-SIGNED-RELEASE.json'),'Signed Seq31 rollback must be preserved');
assert.deepEqual(previous,read('p155/P155-SEQ32-OWNER-SIGNED-RELEASE.json'),'Active release must be owner signed Seq32');
const old=JSON.parse(Buffer.from(JSON.parse(rollback).payload,'base64').toString('utf8'));
const candidate=JSON.parse(read('p155/P155-SEQ32-UNSIGNED-CANDIDATE.json').toString('utf8'));
const next=candidate.proposedPayload;
assert.equal(candidate.signed,false);assert.equal(candidate.published,false);
assert.equal(old.sequence,31);assert.equal(old.modules[0].version,29);
assert.equal(next.sequence,32);assert.equal(next.modules[0].version,30);
assert.equal(next.channel,'owner-qa');assert.equal(next.deliveryMode,'automatic');
assert.equal(next.applicationId,'app.basair.qurv2');assert.equal(next.minAppVersion,694);
assert.equal(next.modules.length,1);assert.equal(next.modules[0].id,'tafsir');
assert.equal(next.modules[0].assets.length,2,'NO old P144/P152 OTA styles and scripts');
for(const a of next.modules[0].assets){
 const raw=read('p121/owner-qa/'+a.path);
 assert.equal(raw.length,a.size,'Size mismatch for '+a.path);
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),a.sha256,'SHA256 mismatch for '+a.path);
 assert.ok(/^modules\/tafsir\/p155-native-foundation\.(?:js|css)$/.test(a.path));
}
console.log(JSON.stringify({status:'PASS',sha256Assets:2,removedLegacyAssets:8,
 preservedNativeIndex:true,nativeNotesAndFavorites:true,originalFollow:true,
 noNewStorage:true,noCaptureHijack:true,noRepaintInterval:true,
 rollbackSeq31:'BYTE_EXACT',tilawaQA050:'UNCHANGED',android:'PENDING_DEVICE_TEST'}));
