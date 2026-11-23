#!/usr/bin/env node
'use strict';
/* Offline read-only acceptance guard. NO OTA write, signing, CI workflow changes or APK rebuild.
 * Run: node p217/tests/verify_signed_baseline_and_plans.cjs
 * Node 20+ with RSA3072 and Ed25519 crypto support.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const read=p=>{
  const file=path.resolve(root,p);
  if(!file.startsWith(root+path.sep))throw Error('unsafe path '+p);
  return fs.readFileSync(file);
};
const json=p=>JSON.parse(read(p).toString('utf8'));
const digest=(kind,bytes)=>crypto.createHash(kind).update(bytes).digest('hex');
const ok=(cond,msg)=>{if(!cond)throw Error(msg)};
const equal=(a,b)=>a.path===b.path&&a.kind===b.kind&&a.size===b.size&&a.sha256===b.sha256;
const baseline=json('p215/qa/P215_DIGITAL_STABILITY_LOCK.json');
const p216=json('p216/report/P216_UNSIGNED_MODULE_PLAN.json');
const p217=json('p217/report/P217_UNSIGNED_MODULE_PLAN.json');
const envelope=json('p121/owner-qa/release.json');
ok(p216.status==='UNSIGNED_NOT_PUBLISHED'&&p217.status==='UNSIGNED_NOT_PUBLISHED','staging markers changed');
const signed=JSON.parse(Buffer.from(envelope.payload,'base64').toString('utf8'));
ok(signed.schema==='basair-universal-ota-v1'&&signed.applicationId==='app.basair.qurv2'&&signed.channel==='owner-qa','live release identity mismatch');
ok(signed.sequence===126 && signed.modules.length===1 && signed.modules[0].id==='tilawa' &&
 signed.modules[0].version===243,'live baseline moved; re-plan unsigned sequences, do not publish');
const cryptoScript=read('p121/owner-qa/modules/updates/p206-signed-six-rollback.js').toString('utf8');
const keys=cryptoScript.match(/var RSA_PUBLIC='([^']+)', OWNER_PUBLIC='([^']+)'/);
ok(!!keys,'original P206 public keys unavailable; fail closed');
const rsaKey=crypto.createPublicKey({key:Buffer.from(keys[1],'base64'),format:'der',type:'spki'});
ok(crypto.verify('sha256',Buffer.from(envelope.payload,'base64'),rsaKey,Buffer.from(envelope.signature,'base64')),
 'live RSA3072 envelope verification failed');
const approval=signed.ownerApproval,mods=signed.modules.filter(m=>['tilawa','shared','navigation','reciters'].includes(m.id));
ok(!!approval&&approval.sequence===signed.sequence&&approval.algorithm==='Ed25519'&&
 approval.schema===1,'live protected module approval absent');
const modHash=digest('sha256',Buffer.from(JSON.stringify(mods)));
ok(approval.modulesSha256===modHash,'approval module content mismatch');
const pubEd=crypto.createPublicKey({key:Buffer.concat([
 Buffer.from('302a300506032b6570032100','hex'),Buffer.from(keys[2],'base64')]),format:'der',type:'spki'});
const proof='basair-universal-protected-v1\n'+signed.applicationId+'\n'+signed.sequence+'\n'+
 approval.modulesSha256+'\n'+approval.expiresAt;
ok(crypto.verify(null,Buffer.from(proof),pubEd,Buffer.from(approval.signature,'base64')),
 'live owner Ed25519 signature failed');
let pinned=0;
for(const rec of baseline.immutable){
  const content=read(rec.path);
  const blob=Buffer.concat([Buffer.from('blob '+content.length+'\0'),content]);
  ok(digest('sha1',blob)===rec.gitBlobSha1,'QA050 pinned Tilawa asset changed: '+rec.path);
  pinned++;
}
let current=0;
const tilawa=signed.modules[0],paths=new Set();
for(const asset of tilawa.assets){
  ok(!paths.has(asset.path),'duplicated current signed asset');paths.add(asset.path);
  const bytes=read('p121/owner-qa/'+asset.path);
  ok(bytes.length===asset.size&&digest('sha256',bytes)===asset.sha256,
     'live signed asset SHA or size mismatch: '+asset.path);current++;
}
ok(current===19&&pinned===8,'live baseline asset count changed');
ok(paths.has('modules/tilawa/p214-follow-route-adapters.js') &&
 !paths.has('modules/tilawa/p213-follow-route-adapters.js') &&
 [...paths].indexOf('modules/tilawa/p214-follow-route-adapters.js')<
 [...paths].indexOf('modules/tilawa/p215-digital-follow-shadow.js'),
 'P214/P215 load ordering changed');
function verifyAssets(assets){
 const paths=new Set();let bytes=0;
 for(const a of assets){
  ok(!paths.has(a.path),'duplicated proposed asset '+a.path);paths.add(a.path);
  ok(a.path.startsWith('modules/updates/'),'non-updates file in proposed module '+a.path);
  const buf=read('p121/owner-qa/'+a.path);
  ok(buf.length===a.size&&digest('sha256',buf)===a.sha256,'unfrozen asset '+a.path);
  bytes+=buf.length;
 }
 return bytes;
}
const aa=p216.forward.modules[0].assets,bb=p217.proposedForward.assets;
ok(aa.length===7&&bb.length===8,'wrong proposed module asset count');
ok(p216.forward.modules[0].id==='updates','P216 targets wrong module');
ok(aa.every((a,i)=>equal(a,bb[i])),'P217 silently changed P216 assets or ordering');
ok(p216.rollback.modules[0].assets.length===5&&
 p216.rollback.modules[0].assets.every((a,i)=>equal(a,aa[i])),'P216 legacy rollback not exact');
ok(p217.proposedRollback.assets.length===7&&
 p217.proposedRollback.assets.every((a,i)=>equal(a,aa[i])),'P217 rollback not exact P216');
ok(bb[7].path==='modules/updates/p217-verified-history.js'&&
 aa[5].path==='modules/updates/p216-unified-update-center.css'&&
 aa[6].path==='modules/updates/p216-unified-update-center.js','unapproved module load sequence');
const bytes216=verifyAssets(aa),bytes217=verifyAssets(bb);
ok(bytes216===p216.forward.totalBytes&&bytes217===p217.proposedForward.totalBytes,
 'proposed total-byte mismatch');
ok(p216.forward.proposedSequence===128&&p216.rollback.proposedSequence===129&&
 p217.proposedForward.sequence===130&&p217.proposedRollback.sequence===131,
 'proposed sequence needs fresh review');
ok(read('p216/src/p216-unified-update-center.js').equals(read('p121/owner-qa/modules/updates/p216-unified-update-center.js')),
 'P216 source/stage mismatch');
ok(read('p216/src/p216-unified-update-center.css').equals(read('p121/owner-qa/modules/updates/p216-unified-update-center.css')),
 'P216 CSS source/stage mismatch');
ok(read('p217/src/p217-verified-history.js').equals(read('p121/owner-qa/modules/updates/p217-verified-history.js')),
 'P217 source/stage mismatch');
console.log(JSON.stringify({
 status:'PASS_READ_ONLY_BASELINE_AND_STAGING',liveSeq:signed.sequence,
 rsa3072:true,ed25519:true,immutableTilawa:pinned,liveSignedTilawaAssets:current,
 stagedP216:{assets:aa.length,bytes:bytes216},stagedP217:{assets:bb.length,bytes:bytes217},
 scope:'No Android/WebView acceptance, no private-key signing, no OTA promotion.'
},null,2));
