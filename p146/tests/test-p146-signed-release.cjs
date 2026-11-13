'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const pub='MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAyXkxNwLNb5VBj2+tMN6/LEj7JyAQ+jyuaxPajj6iAoItN2JLqyu9JBVsesMkQLxwv78MtDJFH1dX+ZAAFNw0Q2d5CBxlhz06kugb7aTQaXcKIPXHAZ7jyo+uH95vWT1uhQqRTH8nAXjq6Z/rxJQJLZ72MYR8NapMTmZys4qlhwCXo6AyB0yBhzpAiMERAy3OIUH4lUXz+EDKnMhpBDPLzwkGAT8pfJ/TFA/wX1ld0Pn16zzUMEXOR3kAbKa3N0bJqs6B+Hlvrd2QwYt2PNDEFdvLKx5R1unkNGWVb8ky/Hs6DW137ONjY5w3luJPpV/sdtRZSOPQwKit6fLbSSCCEICY9BxELcAB4NrA1QTjS6qsA6KPrmhB6+70wnaFgsYdr3mev3bafWFS4mFpKu4WmklQFTZSGCDwfBoQnw3ruAa3sdyURV++0N1wxlT9qVO+VSFNLLrPOnjbYSsjBmCwDNfEVXWB1vnxkEGtDeeW3X29AYOCPQ8/QoXELBdAOa5lAgMBAAE=';
const key={key:Buffer.from(pub,'base64'),format:'der',type:'spki'};
function verify(p){
 const env=JSON.parse(read(p)),pbytes=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.equal(sig.length,384);
 assert.ok(crypto.verify('RSA-SHA256',pbytes,key,sig),'owner signature invalid: '+p);
 return JSON.parse(pbytes.toString('utf8'));
}
const prev=verify('p121/owner-qa/release-p145-seq22-before-p146-20261113.json');
const m=verify('p146/P146-SEQ23-OWNER-SIGNED-RELEASE.json');
assert.equal(prev.sequence,22);assert.equal(m.sequence,23);
assert.match(m.id,/^[a-zA-Z0-9-]{1,70}$/);
assert.equal(m.channel,'owner-qa');assert.equal(m.applicationId,'app.basair.qurv2');
assert.equal(m.minAppVersion,694);assert.equal(m.deliveryMode,'notify');
assert.equal(m.modules.length,1);
assert.equal(m.modules[0].id,'tafsir');assert.equal(m.modules[0].version,21);
assert.equal(m.modules[0].assets.length,8);
for(const [i,a] of m.modules[0].assets.entries()){
 assert.match(a.path,/^modules\/tafsir\/[a-z0-9-]+\.(js|css)$/i);
 assert.equal(a.kind,path.extname(a.path).slice(1));
 const b=read('p121/owner-qa/'+a.path);
 assert.equal(b.length,a.size,'Asset length mismatched: '+a.path);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,'Digest mismatched: '+a.path);
 if(i<6)assert.deepEqual(a,prev.modules[0].assets[i],'P144 six inherited files must remain unchanged');
 console.log('PASS asset '+(i+1)+' '+a.path);
}
assert.notEqual(m.modules[0].assets[6].sha256,prev.modules[0].assets[6].sha256,'P146 CSS must differ from P145');
assert.notEqual(m.modules[0].assets[7].sha256,prev.modules[0].assets[7].sha256,'P146 JS must differ from P145');
assert.equal(m.modules[0].assets[6].path,'modules/tafsir/p146-reader-polish.css');
assert.equal(m.modules[0].assets[7].path,'modules/tafsir/p146-reader-polish.js');
assert.deepEqual(read('p121/owner-qa/release.json'),read('p146/P146-SEQ23-OWNER-SIGNED-RELEASE.json'));
assert.ok(Date.parse(m.expiresAt)>Date.now());
assert.ok(Date.parse(m.issuedAt)<Date.now()+300000,'future date beyond Android receiver ceiling');
console.log(JSON.stringify({status:'PASS',sequence:23,ownerRSA:true,assets:8,matchedPrevious:6,tilawaQA050:'untouched',originalReceiverID:m.id.length,realPhone:'NOT TESTED'}));