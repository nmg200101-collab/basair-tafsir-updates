'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),
 crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const live=read('p121/owner-qa/release.json');
const backup=read('p121/owner-qa/release-p150-seq27-before-p151-20261114.json');
const signed=read('p150/P150-SEQ27-OWNER-SIGNED-RELEASE.json');
assert.deepEqual(live,backup,'P151 draft must not change signed Seq27');
assert.deepEqual(live,signed,'P150 owner signature exact bytes must be preserved');
const env=JSON.parse(live);
const old=JSON.parse(Buffer.from(env.payload,'base64').toString('utf8'));
assert.equal(old.sequence,27);
assert.equal(old.modules[0].version,25);
const c=JSON.parse(read('p151/P151-SEQ28-UNSIGNED-CANDIDATE.json').toString('utf8'));
assert.equal(c.status,'UNSIGNED_OWNER_QA_DRAFT_DO_NOT_PUBLISH');
assert.equal(c.signed,false);assert.equal(c.published,false);
assert.equal(c.legacyNotesPreserved,true);
const p=c.proposedPayload;
assert.equal(p.sequence,28);
assert.equal(p.modules[0].id,'tafsir');
assert.equal(p.modules[0].version,26);
assert.equal(p.applicationId,'app.basair.qurv2');
assert.equal(p.channel,'owner-qa');assert.equal(p.deliveryMode,'notify');
assert.equal(p.minAppVersion,694);
assert.equal(p.issuedAt,null);assert.equal(p.expiresAt,null);
assert.equal(p.modules[0].assets.length,8);
for(const [i,a] of p.modules[0].assets.entries()){
 const file=read('p121/owner-qa/'+a.path);
 assert.equal(file.length,a.size,'Asset length mismatch: '+a.path);
 assert.equal(crypto.createHash('sha256').update(file).digest('hex'),a.sha256,
   'SHA256 mismatch: '+a.path);
 if(i<6)assert.deepEqual(a,old.modules[0].assets[i],'Inherited tafsir file mutated');
}
assert.equal(p.modules[0].assets[6].path,'modules/tafsir/p151-reader-notes.css');
assert.equal(p.modules[0].assets[7].path,'modules/tafsir/p151-reader-notes.js');
console.log(JSON.stringify({status:'PASS',currentSequence:27,proposedSequence:28,notesHub:true,
 assets:8,untouchedInherited:6,oldUserNotesProtected:true,tilawaQA050:'NOT MODIFIED',published:false}));
