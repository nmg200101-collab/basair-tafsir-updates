'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),
 crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const js=read('p121/owner-qa/modules/tafsir/p152-reader-saved.js').toString('utf8'),
 css=read('p121/owner-qa/modules/tafsir/p152-reader-saved.css').toString('utf8');
new vm.Script(js,{filename:'p152-reader-saved.js'});
for(const marker of [
 'P152-MAIN-SAVED-TABS-AND-STABLE-AYAH-NOTE-OWNER-QA',
 "data-p152-saved","w.addEventListener('click',function(e)",
 "original.favorites.open()","r3.favoritesUpgrade()","tab.click()",
 "search.replaceWith(notes)","favorite.insertAdjacentElement('afterend',notes)",
 "label='ملاحظة'","marker='✎'","p152StableNoteAction",
 "r2.openNote(p.s,p.a)","data-p150-note-proxy",
 "NATIVE_KEY='basair:tafsir-notes:v1'"
])assert.ok(js.includes(marker),'Missing native B233/B263 saved panel integration: '+marker);
assert.ok(!js.includes("var label=hasNote?'تعديل الملاحظة':'ملاحظة'"),
 'The original visual label switch is explicitly forbidden');
assert.ok(!js.includes('cloneNode('),'One original R3 note, one visual proxy; never clone listeners');
for(const selector of ['#basairTafsirB233TopBar','button.p152SavedTrigger',
 '.p152StableNoteAction',':not([data-p149-note-layout])::after',
 'grid-column:5 / span 1','data-p151-saved="1"'])
 assert.ok(css.includes(selector),'Missing stable note/saved-tab CSS: '+selector);
const before=read('p121/owner-qa/release-p151-seq28-before-p152-20261114.json'),
 live=read('p121/owner-qa/release.json'),
 signed=read('p151/P151-SEQ28-OWNER-SIGNED-RELEASE.json');
assert.deepEqual(before,signed,'P151 Seq28 rollback must be byte-exact');
assert.deepEqual(live,read('p152/P152-SEQ29-OWNER-SIGNED-RELEASE.json'),'Active release must be signed P152 Seq29');
const previous=JSON.parse(Buffer.from(JSON.parse(before).payload,'base64').toString('utf8'));
const cand=JSON.parse(read('p152/P152-SEQ29-UNSIGNED-CANDIDATE.json').toString('utf8'));
assert.equal(previous.sequence,28);assert.equal(previous.modules[0].version,26);
assert.equal(cand.published,false);assert.equal(cand.signed,false);
const next=cand.proposedPayload;
assert.equal(next.sequence,29);assert.equal(next.modules[0].version,27);
assert.equal(next.channel,'owner-qa');assert.equal(next.deliveryMode,'notify');
assert.equal(next.applicationId,previous.applicationId);assert.equal(next.minAppVersion,previous.minAppVersion);
assert.equal(next.modules[0].assets.length,8);
for(const [i,a] of next.modules[0].assets.entries()){
 const b=read('p121/owner-qa/'+a.path);
 assert.equal(b.length,a.size,'Size mismatch: '+a.path);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,'SHA256 mismatch: '+a.path);
 if(i<6)assert.deepEqual(a,previous.modules[0].assets[i],'Inherited Tafsir asset changed unexpectedly');
}
assert.equal(next.modules[0].assets[6].path,'modules/tafsir/p152-reader-saved.css');
assert.equal(next.modules[0].assets[7].path,'modules/tafsir/p152-reader-saved.js');
console.log(JSON.stringify({status:'PASS',stage:'SIGNED_OWNER_QA',sequence:29,tafsir:27,
 nativeSavedPanel:true,topFavoritesAndNotes:true,originalNativeNotes:true,
 noteButtonVisualStable:true,rollbackSeq28:true,tilawaQA050:'UNCHANGED',android:'NOT TESTED'}));
