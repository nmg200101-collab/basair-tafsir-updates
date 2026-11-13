'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
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

assert.ok(js.includes('syncVisualMode()')&&js.includes('isNight()'),
 'P147 must identify actual Android night mode');
assert.ok(js.includes("data-p147-field-tone"),
 'Tafsir section heading category colors must be annotated');
assert.ok(css.includes('data-p147-night="1"'),
 'force high contrast night colors even when .dark belongs to HTML');
assert.ok(css.includes('.v194T2FieldTitle'),
 'target genuine Tafsir per-ayah title field');
assert.ok(css.includes('data-basair-main-tab="thread"'),
 'thread tab needs matching night selection palette');
assert.ok(css.includes('data-basair-main-tab="intro"'),
 'intro tab needs matching night selection palette');
function luminance(h){
 const x=h.replace('#','').match(/../g).map(p=>parseInt(p,16)/255).map(v=>v<=0.04045?v/12.92:((v+.055)/1.055)**2.4);
 return x[0]*.2126+x[1]*.7152+x[2]*.0722;
}
function contrast(a,b){const l=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (l[0]+.05)/(l[1]+.05)}
for(const [name,fg,bg] of [
 ['field meaning','#f0d7a4','#152b21'],
 ['field rhetoric','#b5eed5','#152b21'],
 ['source metadata','#bfd5c8','#152b21'],
 ['reading heading','#bfe8cd','#1c3429'],
 ['reading prose','#f0f8f0','#1c3429'],
 ['inactive tab','#d1e2d6','#1d382d']]){
 assert.ok(contrast(fg,bg)>=4.5,'night contrast too low: '+name);
}

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

assert.ok(js.includes("stableNoteByRow.set(row,canonical)"),
 'original note must remain stable across legacy rerenders');
assert.ok(js.includes("candidate.hasAttribute('data-r3-note-pos')"),
 'real R3 note must take priority over an earlier stale duplicate');
assert.ok(!js.includes('if(!canonical&&notes.length)canonical=notes[0]'),
 'disabled stale note must never become active just because it is first');

const candidate=JSON.parse(read('p147/P147-SEQ24-UNSIGNED-CANDIDATE.json'));
assert.equal(candidate.status,'UNSIGNED_CANDIDATE_DO_NOT_PUBLISH');
assert.equal(candidate.ownerApprovalRequired,true);
assert.equal(candidate.productionPublished,false);
assert.equal(candidate.signing,null);
const next=candidate.proposedPayload;
assert.equal(next.sequence,24);
assert.equal(next.modules[0].version,22);
assert.equal(next.applicationId,'app.basair.qurv2');
assert.equal(next.minAppVersion,694);
assert.equal(next.deliveryMode,'notify');
assert.equal(next.channel,'owner-qa');
assert.equal(next.issuedAt,null);
assert.equal(next.expiresAt,null);
assert.match(next.id,/^[a-zA-Z0-9-]{1,70}$/);
assert.equal(next.modules[0].assets.length,8);
for(const [i,a] of next.modules[0].assets.entries()){
 const location='p121/owner-qa/'+a.path;
 const contents=fs.readFileSync(path.join(root,location));
 assert.equal(contents.length,a.size,'asset byte size changed: '+a.path);
 assert.equal(crypto.createHash('sha256').update(contents).digest('hex'),a.sha256,
  'candidate SHA256 differs from file: '+a.path);
 if(i<6)assert.deepEqual(a,payload.modules[0].assets[i],
   'P146 inherited original six assets must remain identical');
}

console.log(JSON.stringify({
 status:'PASS',mode:'source-and-immutable-release',sequence:23,stage:'P147-DRAFT',
 notes:'one original node among five',fallback:'preserved',sourceBack:'preserved',
 tilawaQA050:'no protected files changed',physicalDevice:'NOT TESTED'
}));