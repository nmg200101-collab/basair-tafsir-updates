'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p));
const baseline=JSON.parse(read('p121/owner-qa/release.json').toString('utf8'));
const old=JSON.parse(Buffer.from(baseline.payload,'base64').toString('utf8'));
const staged=JSON.parse(read('p134/P134-SEQ10-UNSIGNED-NOT-FOR-RELEASE.json').toString('utf8'));
const next=staged.candidate;
assert.equal(staged.status,'UNSIGNED_QA_CANDIDATE_NOT_PUBLISHABLE');
assert.equal(staged.signature,null);assert.equal(staged.signingRequired,true);
assert.equal(old.sequence,9);assert.equal(next.sequence,10);
assert.equal(next.applicationId,old.applicationId);assert.equal(next.channel,'owner-qa');
assert.equal(next.minAppVersion,695);assert.equal(next.deliveryMode,'notify');
assert.equal(next.modules.length,1);assert.equal(next.modules[0].id,'tafsir');
assert.equal(next.modules[0].assets.length,6);assert.equal(next.modules[0].version,9);
assert.ok(baseline.signature&&baseline.signature.length>100);
const oldPaths=new Set(old.modules[0].assets.map(a=>a.path)),nextPaths=new Set();
for(const asset of next.modules[0].assets){
 assert.ok(/^modules\/tafsir\/[a-z0-9-]+\.(js|css)$/.test(asset.path),'invalid or unsafe asset path '+asset.path);
 assert.ok(!nextPaths.has(asset.path),'duplicate path '+asset.path);nextPaths.add(asset.path);
 const data=read('p121/owner-qa/'+asset.path);
 const sha=crypto.createHash('sha256').update(data).digest('hex');
 assert.equal(asset.size,data.length,'size mismatch '+asset.path);
 assert.equal(asset.sha256,sha,'sha256 mismatch '+asset.path);
 console.log('PASS verified asset '+asset.path+' '+sha.slice(0,12));
}
for(const oldAsset of old.modules[0].assets.filter(a=>!a.path.endsWith('p132-natiq.js')&&!a.path.endsWith('p132-verse-tools.js'))){
 assert.ok(nextPaths.has(oldAsset.path),'other asset must remain unchanged');
 assert.deepEqual(next.modules[0].assets.find(a=>a.path===oldAsset.path),oldAsset,'unchanged asset metadata');
}
assert.ok(nextPaths.has('modules/tafsir/p134-natiq.js'));
assert.ok(nextPaths.has('modules/tafsir/p134-verse-tools.js'));
assert.equal(nextPaths.has('modules/tafsir/p132-natiq.js'),false);
assert.equal(nextPaths.has('modules/tafsir/p132-verse-tools.js'),false);
assert.ok(staged.protectedTilawaChannel.startsWith('p92/'));
console.log(JSON.stringify({pass:6,totalAssets:6,sequence:10,signature:'NOT PRESENT',publishable:false,realDevice:'NOT TESTED'}));
