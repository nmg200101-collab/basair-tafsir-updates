'use strict';
const fs=require('node:fs'),path=require('node:path'),
 crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p));
const js=read('p121/owner-qa/modules/tafsir/p148-reader-polish.js').toString('utf8');
const css=read('p121/owner-qa/modules/tafsir/p148-reader-polish.css').toString('utf8');
new vm.Script(js,{filename:'p148-reader-polish.js'});
assert.ok(js.includes('P148-LESSONS-NOTE-ANCHOR-OWNER-QA'));
assert.ok(js.includes('new w.MutationObserver')&&js.includes('rowNoteWatchers'));
assert.ok(js.includes('Promise.resolve().then(function()'),'must repair note on microtask before paint');
assert.ok(js.includes("actions.appendChild(canonical)"),'reuse original note');
assert.ok(!js.includes('cloneNode('),'must never clone note handlers');
assert.ok(js.includes("canonical.hasAttribute")||js.includes("candidate.hasAttribute('data-r3-note-pos')"));
assert.ok(js.includes('data-p148-notes')&&js.includes('repeat(5,minmax(0,1fr))'));
assert.ok(js.includes("style(buttons[j],'height','44px')"));
assert.ok(js.includes("w.setTimeout(function(){debounce=0;sweep();syncLoader()},36)"));
assert.ok(js.includes('p146TopMic')&&js.includes('fetchFull(s)')&&js.includes('p145SourceOverlay'));
assert.ok(css.includes('#v194T104HubBody .v194T104ThreadItem > span'),
 'must style REAL Surah Hub lesson body, not a guessed class');
assert.ok(css.includes('#v194T104HubBody .v194T104ThreadItem > b'),
 'must style REAL Surah Hub lesson headings');
assert.ok(css.includes('content:none!important;display:none!important'),
 'replace distracting bullet ornament');
assert.ok(css.includes('data-p148-notes="locked"'));
assert.ok(css.includes('.dark #v194T104HubBody .v194T104ThreadItem'));
assert.ok(css.includes('height:44px!important'));
const next=JSON.parse(read('p148/P148-SEQ25-UNSIGNED-CANDIDATE.json').toString('utf8'));
const rollback=JSON.parse(read('p121/owner-qa/release-p147-seq24-before-p148-20261114.json').toString('utf8'));
const active=JSON.parse(read('p121/owner-qa/release.json').toString('utf8'));
assert.deepEqual(rollback,active,'current signed P147 must remain active');
const p147=JSON.parse(Buffer.from(rollback.payload,'base64').toString('utf8'));
assert.equal(p147.sequence,24);assert.equal(p147.modules[0].version,22);
assert.equal(next.status,'UNSIGNED_OWNER_QA_CANDIDATE_DO_NOT_PUBLISH');
assert.equal(next.published,false);assert.equal(next.signing,null);
const p=next.proposedPayload;
assert.equal(p.sequence,25);assert.equal(p.modules[0].version,23);
assert.equal(p.channel,'owner-qa');assert.equal(p.deliveryMode,'notify');
assert.equal(p.minAppVersion,694);assert.equal(p.applicationId,p147.applicationId);
assert.equal(p.issuedAt,null);assert.equal(p.expiresAt,null);
assert.equal(p.modules[0].assets.length,8);
for(const [i,asset] of p.modules[0].assets.entries()){
 if(i<6)assert.deepEqual(asset,p147.modules[0].assets[i]);
 const b=read('p121/owner-qa/'+asset.path);
 assert.equal(b.length,asset.size,'asset size mismatch: '+asset.path);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),asset.sha256,
   'asset digest mismatch: '+asset.path);
}
assert.equal(p.modules[0].assets[6].path,'modules/tafsir/p148-reader-polish.css');
assert.equal(p.modules[0].assets[7].path,'modules/tafsir/p148-reader-polish.js');
console.log(JSON.stringify({status:'PASS',stage:'P148-DRAFT',sequence:25,
 notes:'original button retained; microtask correction',lessons:'actual v194T104 classes',
 baseline:24,rollback:'signed P147 identical',protectedQA050:'untouched',android:'NOT TESTED'}));
