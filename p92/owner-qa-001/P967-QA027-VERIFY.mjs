/**
 * P96.7 QA027 — owner-QA restore integrity gate.
 * Read-only checks. Never signs or publishes. It deliberately reuses
 * the exact eight SHA256 assets from archived owner-signed QA024.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const directory = dirname(fileURLToPath(import.meta.url));
const file = name => readFileSync(join(directory,name));
const parseEnvelope = name => JSON.parse(file(name).toString('utf8'));
const decode = envelope => JSON.parse(Buffer.from(envelope.payload,'base64').toString('utf8'));
const sha256 = b => createHash('sha256').update(b).digest('hex');
const active = decode(parseEnvelope('release.json'));
const previous = decode(parseEnvelope('release-qa-024-before-qa025-20261108.json'));
const candidate = JSON.parse(file('P967-QA027-UNSIGNED-RESTORE-DRAFT.json').toString('utf8'));
assert.equal(active.id,'P96-NATIVE-SINGLE-RETARGET-026','active published manifest is still QA026');
assert.equal(active.sequence,26,'do not change the published update during staging');
assert.equal(previous.id,'P96-AYAH-JUMP-MEANING-CLEANUP-024','restore only archived QA024');
assert.equal(previous.sequence,24);
assert.equal(candidate.schema,previous.schema);
assert.equal(candidate.id,'P96-RESTORE-QA024-OWNER-027');
assert.equal(candidate.sequence,27,'monotonic recovery; never force sequence downgrade');
assert.equal(candidate.channel,'owner-qa');
assert.equal(candidate.minAppVersion,690);
assert.equal(candidate.assets.length,8);
assert.equal(new Set(candidate.assets.map(a=>a.path)).size,8);
assert.equal(candidate.assets.filter(a=>a.kind==='js').length,4);
assert.equal(candidate.assets.filter(a=>a.kind==='css').length,4);
assert.deepEqual(candidate.assets,previous.assets,'100% of QA027 source assets must match owner-signed QA024');
assert.notDeepEqual(candidate.assets,active.assets,'restore must actually replace QA025/QA026 patch');
for(const item of candidate.assets){
 assert.match(item.path,/^[a-z0-9][a-z0-9._-]*\.(js|css)$/,'safe local relative path');
 const contents=file(item.path);
 assert.equal(contents.byteLength,item.size,'exact bytes for '+item.path);
 assert.equal(sha256(contents),item.sha256,'SHA256 for '+item.path);
}
const js=file('p964-ayah-meaning.js').toString('utf8');
const css=file('p964-ayah-meaning.css').toString('utf8');
assert.ok(js.includes('function exitMeaning()')&&js.includes('b300WordMeaningOverlay'),'word meaning cleanup must remain');
assert.ok(css.includes('body:not(.reader-active) #b300WordMeaningOverlay'),'hide stale meaning outside reader');
assert.ok(!candidate.assets.some(a=>/p96[56]-(native|selected)/.test(a.path)),'exclude QA025/QA026 failed patches');
console.log('PASS P96.7 QA027: signed QA024 source exactly preserved, 8/8 assets SHA256, owner-only monotonic seq27, no live OTA publication.');
