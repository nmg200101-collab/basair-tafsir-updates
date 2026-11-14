'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p));
const signedFile='p148/P148-SEQ25-OWNER-SIGNED-RELEASE.json';
const rollback='p121/owner-qa/release-p147-seq24-before-p148-20261114.json';
const original=read('p146/tests/test-p146-signed-release.cjs').toString('utf8');
const pubB64=original.match(/const pub='([^']+)'/);
assert.ok(pubB64,'original trusted RSA public key not found');
const rsa={key:Buffer.from(pubB64[1],'base64'),format:'der',type:'spki'};
function unpack(file) {
 const env=JSON.parse(read(file));
 assert.deepEqual(Object.keys(env),['payload','signature']);
 const raw=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.equal(sig.length,384,'expected RSA-3072 signature');
 assert.ok(crypto.verify('RSA-SHA256',raw,rsa,sig),'invalid owner RSA signature');
 return JSON.parse(raw.toString('utf8'));
}
const prev=unpack(rollback),m=unpack(signedFile);
assert.equal(prev.sequence,24);
assert.equal(prev.modules[0].version,22);
assert.equal(m.sequence,25);
assert.equal(m.modules[0].version,23);
assert.equal(m.schema,'basair-universal-ota-v1');
assert.equal(m.channel,'owner-qa');assert.equal(m.applicationId,'app.basair.qurv2');
assert.equal(m.minAppVersion,694);assert.equal(m.deliveryMode,'notify');
assert.match(m.id,/^[A-Za-z0-9-]{1,70}$/);
assert.equal(m.modules.length,1);assert.equal(m.modules[0].id,'tafsir');
assert.equal(m.modules[0].assets.length,8);
assert.ok(Date.parse(m.issuedAt)<Date.now()+5*60*1000,'issuedAt beyond receiver limit');
assert.ok(Date.parse(m.expiresAt)>Date.now());
for (const [i,a] of m.modules[0].assets.entries()){
 assert.match(a.path,/^modules\/tafsir\/[a-z0-9-]+\.(js|css)$/i);
 assert.equal(path.extname(a.path).slice(1),a.kind);
 const b=read('p121/owner-qa/'+a.path);
 assert.equal(b.length,a.size,'size mismatch for '+a.path);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,'SHA256 mismatch for '+a.path);
 if(i<6)assert.deepEqual(a,prev.modules[0].assets[i],'inherited Tafsir asset changed');
}
assert.equal(m.modules[0].assets[6].path,'modules/tafsir/p148-reader-polish.css');
assert.equal(m.modules[0].assets[7].path,'modules/tafsir/p148-reader-polish.js');
const active=read('p121/owner-qa/release.json');
if (process.argv.includes('--published'))assert.deepEqual(active,read(signedFile),'published manifest differs');
else assert.deepEqual(active,read(rollback),'active manifest changed before publishing');
console.log(JSON.stringify({status:'PASS',ownerRSA:true,sequence:25,tafsir:23,assets:8,unchangedInherited:6,rollbackSequence:24,mode:process.argv.includes('--published')?'published':'staged',qa050:'untouched'}));
