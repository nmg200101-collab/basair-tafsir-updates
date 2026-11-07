// BASAIR P96.2 QA022 owner-QA static manifest gate (NO signing/deploy).
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const home=dirname(fileURLToPath(import.meta.url));
const read=n=>readFileSync(join(home,n));
const sha=b=>createHash('sha256').update(b).digest('hex');
const live=JSON.parse(read('release.json').toString('utf8'));
const previous=JSON.parse(Buffer.from(live.payload,'base64').toString('utf8'));
const proposed=JSON.parse(read('P962-QA022-UNSIGNED-PAYLOAD-DRAFT.json').toString('utf8'));
assert.equal(previous.id,'P96-PRINT-EDITION-STATE-021','owner QA021 must remain active');
assert.equal(previous.sequence,21);
assert.equal(proposed.sequence,22);
assert.equal(proposed.id,'P96-FOLLOW-AUDIO-RECOVERY-022');
assert.equal(proposed.channel,'owner-qa');
assert.equal(proposed.minAppVersion,690);
assert.equal(proposed.assets.length,8);
assert.equal(new Set(proposed.assets.map(a=>a.path)).size,8);
assert.equal(proposed.assets.filter(a=>a.kind==='css').length,4);
assert.equal(proposed.assets.filter(a=>a.kind==='js').length,4);
const unchanged=previous.assets.filter(a=>proposed.assets.some(b=>
 a.path===b.path&&a.kind===b.kind&&a.size===b.size&&a.sha256===b.sha256));
assert.equal(unchanged.length,7,'seven assets match the current signed QA021 manifest');
assert.equal(proposed.assets.some(a=>a.path==='p951-font-restored-follow.js'),false,
 'new Follow runtime must replace previous JS, not double-load');
assert.ok(proposed.assets.some(a=>a.path==='p962-audio-error-recovery.js'),'one new recovery asset required');
for(const a of proposed.assets){
 const bytes=read(a.path);
 assert.equal(bytes.length,a.size,a.path+' byte count');
 assert.equal(sha(bytes),a.sha256,a.path+' sha256');
}
assert.equal(read('p962-audio-error-recovery.js').includes(Buffer.from('qa020-font-bad')),false);
console.log('PASS P96.2 QA022 — 8/8 byte hashes, exactly 7 unchanged QA021 assets; no signature, publication or APK changes.');
