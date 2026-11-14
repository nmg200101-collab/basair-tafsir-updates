'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const js=read('p121/owner-qa/modules/tafsir/p150-reader-polish.js').toString('utf8'),
css=read('p121/owner-qa/modules/tafsir/p150-reader-polish.css').toString('utf8');
new vm.Script(js,{filename:'p150-reader-polish.js'});
assert.ok(js.includes('P150-NOTE-VISIBILITY-R3-OWNER-QA'));
assert.ok(js.includes("data-p150-note-proxy"));
assert.ok(js.includes("slot.appendChild(proxy)"));
assert.ok(js.includes("row.appendChild(native)"),
 'actual R3 syncAyahNotes requires the native note as a direct article child');
assert.ok(js.includes("if(!native.hidden)native.hidden=true"));
assert.ok(js.includes("data-r3-note-pos',versePos"),
 'native R3 delegated click expects surah:ayah, never the old literal 1');
assert.ok(js.includes("row.getAttribute('data-t5-s')")&&
 js.includes("row.getAttribute('data-t5-a')"),
 'correct s:a must be derived from each ayah, not page state alone');
assert.ok(js.includes("proxy.classList.toggle('has-note',hasNote)"),
 'proxy must reflect original saved note status');
assert.ok(!js.includes("original.setAttribute('data-r3-note-pos','1')"),
 'the previous proxy incorrectly opened first-surah notes');
assert.ok(!js.includes('cloneNode('));
assert.ok(js.includes('watchMic(mic)'));
assert.ok(css.includes('.p149NoteSlot > button.p150ProvisionalNote'));
assert.ok(css.includes('button.p144MicButton::after'));
assert.ok(css.includes('content:"متوقف"'));
assert.ok(css.includes('content:"يعمل"'));
assert.ok(css.includes('grid-column:5'));
const old=read('p121/owner-qa/release-p149-seq26-before-p150-20261114.json');
assert.deepEqual(old,read('p121/owner-qa/release.json'),'active owner-signed Seq26 must not be modified');
assert.deepEqual(old,read('p149/P149-SEQ26-OWNER-SIGNED-RELEASE.json'),'rollback must be genuine');
const previous=JSON.parse(Buffer.from(JSON.parse(old).payload,'base64').toString('utf8'));
assert.equal(previous.sequence,26);
const c=JSON.parse(read('p150/P150-SEQ27-UNSIGNED-CANDIDATE.json').toString('utf8'));
assert.equal(c.status,'UNSIGNED_DRAFT_NOT_PUBLISHED');
assert.equal(c.deviceClickVerified,false);
assert.equal(c.approved,false);
assert.equal(c.proposedPayload.sequence,27);
assert.equal(c.proposedPayload.modules[0].version,25);
assert.equal(c.proposedPayload.modules[0].assets.length,8);
assert.equal(c.proposedPayload.issuedAt,null);
assert.equal(c.proposedPayload.expiresAt,null);
for(const [i,a] of c.proposedPayload.modules[0].assets.entries()){
 const b=read('p121/owner-qa/'+a.path);
 assert.equal(b.length,a.size,'asset size mismatch: '+a.path);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,'SHA256 mismatch: '+a.path);
 if(i<6)assert.deepEqual(a,previous.modules[0].assets[i]);
}
console.log(JSON.stringify({status:'PASS',sequence:27,stage:'UNSIGNED',noteFallback:'delegated R3 control',nativeClick:'NOT YET VERIFIED ON DEVICE',qa050:'UNMODIFIED'}));
