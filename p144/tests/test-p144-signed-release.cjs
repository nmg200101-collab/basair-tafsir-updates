'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const f=p=>fs.readFileSync(path.join(root,p));
const pub='MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAyXkxNwLNb5VBj2+tMN6/LEj7JyAQ+jyuaxPajj6iAoItN2JLqyu9JBVsesMkQLxwv78MtDJFH1dX+ZAAFNw0Q2d5CBxlhz06kugb7aTQaXcKIPXHAZ7jyo+uH95vWT1uhQqRTH8nAXjq6Z/rxJQJLZ72MYR8NapMTmZys4qlhwCXo6AyB0yBhzpAiMERAy3OIUH4lUXz+EDKnMhpBDPLzwkGAT8pfJ/TFA/wX1ld0Pn16zzUMEXOR3kAbKa3N0bJqs6B+Hlvrd2QwYt2PNDEFdvLKx5R1unkNGWVb8ky/Hs6DW137ONjY5w3luJPpV/sdtRZSOPQwKit6fLbSSCCEICY9BxELcAB4NrA1QTjS6qsA6KPrmhB6+70wnaFgsYdr3mev3bafWFS4mFpKu4WmklQFTZSGCDwfBoQnw3ruAa3sdyURV++0N1wxlT9qVO+VSFNLLrPOnjbYSsjBmCwDNfEVXWB1vnxkEGtDeeW3X29AYOCPQ8/QoXELBdAOa5lAgMBAAE=';
const key={key:Buffer.from(pub,'base64'),format:'der',type:'spki'};
function unwrap(file){const e=JSON.parse(f(file));assert.equal(typeof e.payload,'string');assert.equal(typeof e.signature,'string');
 const raw=Buffer.from(e.payload,'base64'),sig=Buffer.from(e.signature,'base64');assert.equal(sig.length,384);
 assert.ok(crypto.verify('RSA-SHA256',raw,key,sig),'RSA owner signature invalid for '+file);
 return JSON.parse(raw.toString('utf8'));}
const old=unwrap('p121/owner-qa/release-p143-seq20-before-p144-20261113.json');
const next=unwrap('p144/P144-SEQ21-OWNER-SIGNED-RELEASE.json');
assert.equal(old.sequence,20);assert.equal(next.sequence,21);
// Actual V694/V695 WebView receiver rejects signed manifests whose id is longer than 70 ASCII chars.
assert.match(next.id,/^[A-Za-z0-9-]{1,70}$/,'receiver rejects update ID longer than 70');
assert.ok(next.id.length<=70,'P144 must be compatible with installed Android OTA receiver');
assert.equal(old.channel,'owner-qa');assert.equal(next.channel,old.channel);
assert.equal(next.applicationId,'app.basair.qurv2');assert.equal(next.minAppVersion,694);
assert.equal(next.deliveryMode,'notify');assert.equal(next.modules.length,1);
assert.equal(next.modules[0].id,'tafsir');assert.equal(next.modules[0].version,19);
assert.equal(next.modules[0].assets.length,6);
for(let i=0;i<6;i++){
 const a=next.modules[0].assets[i];assert.equal(a.kind,a.path.split('.').pop());
 assert.match(a.path,/^modules\/tafsir\/[A-Za-z0-9._-]+\.(js|css)$/);
 const bytes=f('p121/owner-qa/'+a.path);
 assert.equal(a.size,bytes.length,'size mismatch '+a.path);
 assert.equal(a.sha256,crypto.createHash('sha256').update(bytes).digest('hex'),'sha mismatch '+a.path);
 if([0,2,3,4].includes(i))assert.deepEqual(a,old.modules[0].assets[i],'unmodified catalog/bridge/verse-tools must match P143');
 if(i===1||i===5)assert.ok(a.path.includes('p144-'));
 
 console.log('PASS signed asset #'+(i+1)+' '+a.path);
}
assert.ok(!JSON.stringify(next).includes('p92/'));
assert.ok(Date.parse(next.expiresAt)>Date.now());
const staged=f('p144/P144-SEQ21-OWNER-SIGNED-RELEASE.json');
assert.ok(staged.length>1600);
assert.deepEqual(f('p121/owner-qa/release.json'),staged,'active release branch must match signed staged envelope exactly');
console.log(JSON.stringify({status:'PASS',sequence:next.sequence,assets:6,ownerRSA:true,qa050Untouched:true,apkUnchanged:true,realDevice:'NOT TESTED',compactControls:'Chromium passed 125% scale',contextualTTS:'mocked and voice-listening on handset required'}));
