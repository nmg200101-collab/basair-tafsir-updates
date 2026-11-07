// P96.1 QA021 — pure validation of the unsigned candidate, NEVER signs/publishes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
const read=x=>readFileSync(join(root,x));
const sha256=x=>createHash('sha256').update(x).digest('hex');
const manifest=JSON.parse(read('release.json').toString('utf8'));
const active=JSON.parse(Buffer.from(manifest.payload,'base64').toString('utf8'));
const draft=JSON.parse(read('P961-QA021-UNSIGNED-PAYLOAD-DRAFT.json').toString('utf8'));
assert.equal(typeof manifest.signature,'string','signed baseline envelope required');
assert.ok(manifest.signature.length>100,'baseline RSA signature required');
assert.equal(active.sequence,20,'QA020 remains the signed reference');
assert.equal(active.channel,'owner-qa');
assert.equal(active.minAppVersion,690);
assert.equal(active.assets.length,8);
assert.equal(draft.sequence,21);
assert.equal(draft.channel,'owner-qa');
assert.equal(draft.minAppVersion,690);
assert.equal(draft.assets.length,8);
assert.equal(new Set(draft.assets.map(a=>a.path)).size,8,'unique asset paths');
const replacement='p961-uthmani-hold-safe.js';
const legacy='p932-uthmani-hold.js';
const newAsset=draft.assets.find(a=>a.path===replacement);
assert.ok(newAsset,'QA021 replacement exists');
assert.equal(draft.assets.some(a=>a.path===legacy),false,'legacy handler must NOT load alongside QA021');
assert.equal(draft.assets.filter(a=>a.kind==='css').length,4);
assert.equal(draft.assets.filter(a=>a.kind==='js').length,4);
const untouched=active.assets.filter(a=>draft.assets.some(b=>b.path===a.path&&b.kind===a.kind&&b.size===a.size&&b.sha256===a.sha256));
assert.equal(untouched.length,7,'exactly seven prior QA020 assets preserved');
for(const a of draft.assets){
  assert.ok(/^[a-zA-Z0-9_-]+\.(?:css|js)$/.test(a.path),'local whitelisted asset path');
  const b=read(a.path);
  assert.equal(b.length,a.size,a.path+' byte size');
  assert.equal(sha256(b),a.sha256,a.path+' SHA256');
}
const fixed=read(replacement).toString('utf8');
assert.ok(fixed.includes("var live=body.getAttribute('data-v144-print')"),'live body print selection is authoritative');
assert.ok(!fixed.includes('font-size'),'no Quran face/layout mutation');
assert.ok(!fixed.includes('UnicodeLine'),'no Quran text mutation');
console.log('PASS QA021 — eight asset hashes match, seven QA020 assets unchanged, exactly one edition-state JS replaced.');
