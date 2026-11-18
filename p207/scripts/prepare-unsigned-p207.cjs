#!/usr/bin/env node
/* P207 owner-only local unsigned release preparation; never modifies live release.json. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),c=require('node:crypto'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(f),json=f=>JSON.parse(read(f).toString('utf8'));
const hash=b=>c.createHash('sha256').update(b).digest('hex');
const pins=read('p206/staging/p206-signed-six-rollback.js').toString('utf8');
const rsaPin=pins.match(/var RSA_PUBLIC='([^']+)'/),edPin=pins.match(/OWNER_PUBLIC='([^']+)'/);
assert.ok(rsaPin&&edPin,'P121 public keys unavailable');
const rsa=c.createPublicKey({key:Buffer.from(rsaPin[1],'base64'),format:'der',type:'spki'});
const ed=c.createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),Buffer.from(edPin[1],'base64')]),format:'der',type:'spki'});
function signed(file,seq){
 const env=json(file),bytes=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.ok(c.verify('RSA-SHA256',bytes,rsa,sig),'Original RSA signature rejected: '+file);
 const m=JSON.parse(bytes.toString('utf8'));assert.equal(m.sequence,seq);
 const a=m.ownerApproval,modules=m.modules.filter(x=>['tilawa','shared','navigation','reciters'].includes(x.id));
 assert.ok(a&&a.sequence===seq);
 assert.equal(a.modulesSha256,hash(Buffer.from(JSON.stringify(modules))));
 const proof=Buffer.from(['basair-universal-protected-v1',m.applicationId,seq,a.modulesSha256,a.expiresAt].join('\n'));
 assert.ok(c.verify(null,proof,ed,Buffer.from(a.signature,'base64')),'Original Ed25519 invalid');
 return m;
}
function item(mod,file){
 const p='modules/'+mod+'/'+file,buf=read('p121/owner-qa/'+p);
 return{path:p,kind:path.extname(file).slice(1),size:buf.length,sha256:hash(buf)};
}
function prepare(m,seq,id,title){
 Object.assign(m,{sequence:seq,id,title,issuedAt:new Date().toISOString()});
 delete m.ownerApproval;return m;
}
function validate(m,expected){
 assert.equal(m.applicationId,'app.basair.qurv2');assert.equal(m.channel,'owner-qa');
 assert.equal(m.minAppVersion,694,'Never weaken device minimum automatically');
 assert.ok(!m.ownerApproval,'Untrusted inherited owner approval');
 let count=0,bytes=0,seen=new Set();
 for(const mod of m.modules)for(const asset of mod.assets){
  assert.ok(asset.path.startsWith('modules/'+mod.id+'/')&&!seen.has(asset.path));
  seen.add(asset.path);
  const raw=read('p121/owner-qa/'+asset.path);
  assert.equal(raw.length,asset.size,'Size '+asset.path);
  assert.equal(hash(raw),asset.sha256,'Hash '+asset.path);
  bytes+=raw.length;count++;
 }
 assert.equal(count,expected);assert.ok(bytes<32*1024*1024);
 return{sequence:m.sequence,assetCount:count,bytes,tilawa:m.modules.find(x=>x.id==='tilawa').version,updates:m.modules.find(x=>x.id==='updates').version};
}
const b206=signed('p121/owner-qa/release.json',111),b205=signed('p205/P205-SEQ109-OWNER-SIGNED-AUTOMATIC.json',109);
const m=prepare(structuredClone(b206),113,'P207-SEQ113-OWNER-MORE-AND-FOLLOW-20261118','P207 إصلاح متابعة التلاوة والتحديثات');
const t=m.modules.find(x=>x.id==='tilawa'),u=m.modules.find(x=>x.id==='updates');
assert.equal(t.version,229);assert.equal(u.version,198);
const ix=t.assets.findIndex(a=>a.path==='modules/tilawa/p206-native-follow-lifecycle.js');
assert.ok(ix>=0);
t.assets.splice(ix,1,item('tilawa','p207-native-follow-lifecycle.js'));t.version=231;
u.assets.push(item('updates','p207-local-activation-status.js'),item('updates','p207-more-modal-entry.js'));u.version=200;
m.changeType='إصلاح التلاوة والتحديثات';
m.changeSummary=['تحديد طبعة المصحف من محرك P205','دعم أزرار المتابعة والإيقاف برموزها','عدم إضافة برواز ثان','إدراج التحديثات داخل قائمة المزيد','فحص التفعيل المحلي وتوافق P121'];
m.restartRequired=true;
const rollback=prepare(structuredClone(b205),114,'P207-SEQ114-EMERGENCY-RESTORE-20261118','رجوع الطوارئ إلى ملفات P205 المرجعية');
rollback.modules.find(x=>x.id==='tilawa').version=232;
rollback.modules.find(x=>x.id==='updates').version=201;
rollback.changeType='استعادة الطوارئ';rollback.restartRequired=true;
const result={status:'UNSIGNED_HOLD',p207:validate(m,43),emergency:validate(rollback,38),
 blockers:['installed V695 P121 baseVersion unverified; original source baseVersion=693 but signed minAppVersion=694','real Android WebView acceptance not complete','fresh RSA3072 and Ed25519 signatures required'],
 published:false};
if(process.argv.includes('--write')){
 fs.mkdirSync('p207/generated',{recursive:true});
 fs.writeFileSync('p207/generated/P207-SEQ113-UNSIGNED.json',JSON.stringify(m,null,2)+'\n');
 fs.writeFileSync('p207/generated/P207-SEQ114-EMERGENCY-UNSIGNED.json',JSON.stringify(rollback,null,2)+'\n');
 fs.writeFileSync('p207/generated/P207-UNSIGNED-SUMMARY.json',JSON.stringify(result,null,2)+'\n');
}
console.log(JSON.stringify(result,null,2));
