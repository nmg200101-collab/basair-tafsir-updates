'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const read=x=>fs.readFileSync(path.join(root,x));
const js=read('p121/owner-qa/modules/tafsir/p149-reader-polish.js').toString('utf8');
const css=read('p121/owner-qa/modules/tafsir/p149-reader-polish.css').toString('utf8');
new vm.Script(js,{filename:'p149-reader-polish.js'});
assert.ok(js.includes('P149-NATIVE-SLOT-MIC-STATUS-OWNER-QA'));
assert.ok(js.includes('p149NoteSlot')&&js.includes('grid-auto-columns'));
assert.ok(!js.includes("style(actions,'grid-template-columns','repeat(5"),'P149 must not fight P144 native four columns');
assert.ok(js.includes("actions.appendChild(slot)")&&js.includes("slot.appendChild(original)"));
assert.ok(!js.includes('cloneNode('),'original note click/long press handlers must be preserved');
assert.ok(js.includes("data-p149-preserved-r2-action"),'do not let P134 convert R3 note into follow');
assert.ok(js.includes('rowWatch(row)'), 'handle rerenders by restoring the original note');
assert.ok(js.includes('watchMic(mic)')&&js.includes("aria-pressed")&&js.includes('p149MicState'),
 'mic status must reflect actual P144 start/stop, not clicks');
assert.ok(js.includes('p146TopMic')&&js.includes('p145SourceOverlay'));
assert.ok(js.includes('fetchFull(s)'), 'keep bounded Tafsir network loading');
assert.ok(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),
 'four legacy tools must retain their grid');
assert.ok(css.includes('grid-auto-columns:minmax(0,1fr)'),
 'implicit fifth equal-width note slot missing');
assert.ok(css.includes('grid-column:5 / span 1'));
assert.ok(css.includes('data-p149-mic-state="on"')&&css.includes('data-p149-mic-state="off"'));
assert.ok(css.includes('font-size:clamp(20px,5.1vw,23px)'),
 'lesson body font should visibly grow');
assert.ok(css.includes('font-size:clamp(22px,5.6vw,25px)'),
 'lesson title font should visibly grow');
const current=read('p121/owner-qa/release.json');
const backup=read('p121/owner-qa/release-p148-seq25-before-p149-20261114.json');
const signed=read('p148/P148-SEQ25-OWNER-SIGNED-RELEASE.json');
assert.deepEqual(current,backup,'live signed Seq25 must remain untouched');
assert.deepEqual(signed,backup,'rollback must be the exact signed owner release');
const old=JSON.parse(Buffer.from(JSON.parse(current).payload,'base64').toString('utf8'));
assert.equal(old.sequence,25);
const candidate=JSON.parse(read('p149/P149-SEQ26-UNSIGNED-CANDIDATE.json'));
assert.equal(candidate.status,'UNSIGNED_CANDIDATE_NOT_PUBLISHED');
assert.equal(candidate.published,false);
assert.equal(candidate.signing,null);
const next=candidate.proposedPayload;
assert.equal(next.sequence,26);assert.equal(next.modules[0].version,24);
assert.equal(next.modules[0].id,'tafsir');
assert.equal(next.channel,'owner-qa');assert.equal(next.deliveryMode,'notify');
assert.equal(next.issuedAt,null);assert.equal(next.expiresAt,null);
assert.equal(next.modules[0].assets.length,8);
for(const [i,asset] of next.modules[0].assets.entries()){
 if(i<6)assert.deepEqual(asset,old.modules[0].assets[i]);
 const data=read('p121/owner-qa/'+asset.path);
 assert.equal(data.length,asset.size,'size mismatch: '+asset.path);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),asset.sha256,
  'SHA256 mismatch: '+asset.path);
}
assert.equal(next.modules[0].assets[6].path,'modules/tafsir/p149-reader-polish.css');
assert.equal(next.modules[0].assets[7].path,'modules/tafsir/p149-reader-polish.js');
console.log(JSON.stringify({status:'PASS',sequence:26,mode:'UNSIGNED_DRAFT',
 originalNoteHandlers:'preserved',nativeColumns:4,visualSlots:5,micStatus:'aria-pressed on/off',
 lessonBody:'20-23px',qa050:'no protected files modified',device:'NOT TESTED'}));
