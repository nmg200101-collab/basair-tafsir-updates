'use strict';
/* Prepares UNSIGNED P206 candidate and emergency rollback descriptors only.
 * No private keys, owner approval, or active release modification.
 * An offline owner Ed25519 approval + original RSA3072 signature are REQUIRED later.
 */
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=process.cwd(),basePath='p205/P205-SEQ109-OWNER-SIGNED-AUTOMATIC.json';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const pub='MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAyXkxNwLNb5VBj2+tMN6/LEj7JyAQ+jyuaxPajj6iAoItN2JLqyu9JBVsesMkQLxwv78MtDJFH1dX+ZAAFNw0Q2d5CBxlhz06kugb7aTQaXcKIPXHAZ7jyo+uH95vWT1uhQqRTH8nAXjq6Z/rxJQJLZ72MYR8NapMTmZys4qlhwCXo6AyB0yBhzpAiMERAy3OIUH4lUXz+EDKnMhpBDPLzwkGAT8pfJ/TFA/wX1ld0Pn16zzUMEXOR3kAbKa3N0bJqs6B+Hlvrd2QwYt2PNDEFdvLKx5R1unkNGWVb8ky/Hs6DW137ONjY5w3luJPpV/sdtRZSOPQwKit6fLbSSCCEICY9BxELcAB4NrA1QTjS6qsA6KPrmhB6+70wnaFgsYdr3mev3bafWFS4mFpKu4WmklQFTZSGCDwfBoQnw3ruAa3sdyURV++0N1wxlT9qVO+VSFNLLrPOnjbYSsjBmCwDNfEVXWB1vnxkEGtDeeW3X29AYOCPQ8/QoXELBdAOa5lAgMBAAE=';
const ownerRaw='E5w/6ZiOP+TAolg6STpmeDl0Yo2A/NPHhcqhCo5pitk=';
const key=crypto.createPublicKey({key:Buffer.from(pub,'base64'),format:'der',type:'spki'});
const owner=crypto.createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),Buffer.from(ownerRaw,'base64')]),format:'der',type:'spki'});
const env=JSON.parse(fs.readFileSync(basePath,'utf8')),payload=Buffer.from(env.payload,'base64'),signature=Buffer.from(env.signature,'base64');
assert.ok(crypto.verify('RSA-SHA256',payload,key,signature),'P205 original RSA signature invalid');
const base=JSON.parse(payload.toString('utf8'));
assert.equal(base.sequence,109);assert.equal(base.applicationId,'app.basair.qurv2');
const locked=base.modules.filter(m=>['tilawa','shared','navigation','reciters'].includes(m.id));
const a=base.ownerApproval,lockedSum=sha(Buffer.from(JSON.stringify(locked),'utf8'));
assert.equal(a.modulesSha256,lockedSum,'P205 owner module signature hash mismatch');
const proof=Buffer.from('basair-universal-protected-v1\n'+base.applicationId+'\n'+base.sequence+'\n'+a.modulesSha256+'\n'+a.expiresAt);
assert.ok(crypto.verify(null,proof,owner,Buffer.from(a.signature,'base64')),'P205 owner Ed25519 signature invalid');
function verifyAsset(asset){
 const file=path.join(ROOT,'p121/owner-qa',asset.path);
 const bytes=fs.readFileSync(file);
 assert.equal(bytes.length,asset.size,'size '+asset.path);
 assert.equal(sha(bytes),asset.sha256,'SHA256 '+asset.path);
}
base.modules.forEach(m=>m.assets.forEach(verifyAsset));
const asset=(module,file)=>{
 const name='modules/'+module+'/'+file,buf=fs.readFileSync('p121/owner-qa/'+name);
 return {path:name,kind:'js',size:buf.length,sha256:sha(buf)};
};
const p206T=asset('tilawa','p206-native-follow-lifecycle.js');
const p206U1=asset('updates','p206-signed-six-rollback.js');
const p206U2=asset('updates','p206-unified-update-notice.js');
const copy=()=>structuredClone(base);
const release=copy();
Object.assign(release,{sequence:111,id:'P206-SEQ111-FOLLOW-SIX-SIGNED-HISTORY-20261117',
 title:'بصائر القرآن P206 — متابعة التلاوة ومركز التحديثات',
 changeType:'إصلاح التلاوة وتحديثات التطبيق',
 changeSummary:['تهيئة متابعة التلاوة في الطبعتين','استعادة الصفحة الثابتة بعد الإيقاف','عرض تفاصيل التحديث الشامل الموقّع','إدارة أرشيف آخر ستة إصدارات مستقرة'],
 restartRequired:true,
 issuedAt:new Date().toISOString()});
release.modules.find(m=>m.id==='tilawa').version=229;
release.modules.find(m=>m.id==='tilawa').assets.push(p206T);
release.modules.find(m=>m.id==='updates').version=198;
release.modules.find(m=>m.id==='updates').assets.push(p206U1,p206U2);
delete release.ownerApproval;
const rollback=copy();
Object.assign(rollback,{sequence:112,id:'P206-SEQ112-EMERGENCY-RESTORE-P205-20261117',
 title:'استعادة بصائر القرآن إلى التلاوة المستقرة P205',
 changeType:'استعادة الطوارئ',
 changeSummary:['إزالة وظائف P206 في حالة فشل الاعتماد','استعادة ملفات التلاوة والتحديثات المعتمدة قبل P206'],
 restartRequired:true,
 issuedAt:new Date().toISOString()});
rollback.modules.find(m=>m.id==='tilawa').version=230;
rollback.modules.find(m=>m.id==='updates').version=199;
delete rollback.ownerApproval;
function checkManifest(m){
 assert.equal(m.modules.reduce((n,v)=>n+v.assets.length,0),m.sequence===111?41:38);
 assert.equal(new Set(m.modules.flatMap(v=>v.assets.map(a=>a.path))).size,m.modules.flatMap(v=>v.assets).length);
 assert.ok(!('ownerApproval'in m),'unsigned staging input must need owner approval');
 m.modules.forEach(v=>v.assets.forEach(verifyAsset));
}
checkManifest(release);checkManifest(rollback);
const summary={status:'UNSIGNED_NOT_FOR_DEPLOYMENT',baseline:'P205 Seq109',candidate:{sequence:111,tilawa:229,updates:198,assets:41},emergencyRollback:{sequence:112,tilawa:230,updates:199,assets:38},originalSignaturesVerified:true,allAssetsHashed:true,requires:['new owner Ed25519 approval for each protected module set','pinned original RSA3072 envelope signature','QA-050 final and merged commit','V695 device acceptance'],p206Assets:[p206T,p206U1,p206U2]};
if(process.argv.includes('--write')){
 fs.mkdirSync('p206/generated',{recursive:true});
 fs.writeFileSync('p206/generated/P206-SEQ111-UNSIGNED-INPUT.json',JSON.stringify(release,null,2)+'\n');
 fs.writeFileSync('p206/generated/P206-SEQ112-EMERGENCY-UNSIGNED-INPUT.json',JSON.stringify(rollback,null,2)+'\n');
 fs.writeFileSync('p206/generated/P206-SHA256-CANDIDATE-SUMMARY.json',JSON.stringify(summary,null,2)+'\n');
}
console.log(JSON.stringify(summary,null,2));
