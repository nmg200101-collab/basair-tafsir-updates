'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const js=read('p121/owner-qa/modules/tafsir/p147-reader-polish.js');
const css=read('p121/owner-qa/modules/tafsir/p147-reader-polish.css');
const base=read('p121/owner-qa/modules/tafsir/p146-reader-polish.js');
new vm.Script(js,{filename:'p147-reader-polish.js'});
assert.ok(js.includes('P147-STABLE-NOTE-INTRO-THREAD'));
assert.ok(js.includes("canonical.classList.add('p147NoteTool','p144NoteChip')"));
assert.ok(js.includes("actions.appendChild(canonical)"),'must MOVE existing note node, not clone it');
assert.ok(!js.includes("cloneNode("),'no cloned note or event listeners');
assert.ok(js.includes('repeat(5,minmax(0,1fr))'),'five tools share one row');
assert.ok(js.includes("notes[z].disabled=true"),'duplicate note must be inert');
assert.ok(js.includes("noteBarObserver.observe"),'legacy style mutations must be repaired');
assert.ok(js.includes('decorateReading()'), 'intro and thread typography must rerender');
assert.ok(css.includes('[data-p147-reading-tab]'),'reading changes must be scoped to intro/thread');
assert.ok(css.includes('body.dark[data-p147-reading-tab]'),'dark-mode prose styles');
assert.ok(css.includes('min-height:44px'),'mobile tap target minimum 44px');
assert.ok(js.includes('p145SourceOverlay'),'P146 in-app source back must remain');
assert.ok(js.includes('fetchFull(s)'),'P146 bounded fallback must remain');
assert.ok(js.includes('p146TopMic'),'P146 mic by Quran ayah must remain');
assert.ok(base.includes('p146BottomNote'),'P146 reference baseline retained');
assert.ok(!read('p121/owner-qa/release.json').includes('p147-reader-polish'),
 'main signed receiver manifest must NOT be changed until owner approval');
const sig=JSON.parse(read('p121/owner-qa/release.json'));
const payload=JSON.parse(Buffer.from(sig.payload,'base64').toString('utf8'));
assert.equal(payload.sequence,23,'no OTA sequence advance');
assert.equal(payload.modules[0].version,21,'active Tafsir module unchanged');
assert.equal(payload.modules[0].assets.length,8);
console.log(JSON.stringify({
 status:'PASS',mode:'source-and-immutable-release',sequence:23,stage:'P147-DRAFT',
 notes:'one original node among five',fallback:'preserved',sourceBack:'preserved',
 tilawaQA050:'no protected files changed',physicalDevice:'NOT TESTED'
}));