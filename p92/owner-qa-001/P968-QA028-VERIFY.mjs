// BASAIR P96.8 QA028 — candidate integrity verification (NO publishing).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';
const d=dirname(fileURLToPath(import.meta.url));
const load=p=>readFileSync(join(d,p));
const hash=x=>createHash('sha256').update(x).digest('hex');
const live=JSON.parse(load('release.json').toString('utf8'));
const base=JSON.parse(Buffer.from(live.payload,'base64').toString('utf8'));
const draft=JSON.parse(load('P968-QA028-UNSIGNED-PAYLOAD-DRAFT.json').toString('utf8'));
assert.equal(base.sequence,27,'do not overwrite active QA027');
assert.equal(base.channel,'owner-qa');
assert.equal(draft.sequence,28);
assert.equal(draft.channel,'owner-qa');
assert.equal(draft.minAppVersion,690);
assert.equal(draft.id,'P96-NATIVE-AYAH-PREVIEW-ONE-TAP-028');
assert.equal(draft.assets.length,8);
assert.equal(new Set(draft.assets.map(x=>x.path)).size,8);
assert.equal(draft.assets.filter(x=>x.kind==='js').length,4);
assert.equal(draft.assets.filter(x=>x.kind==='css').length,4);
assert.equal(draft.assets.filter(x=>base.assets.some(y=>x.path===y.path&&x.sha256===y.sha256&&x.size===y.size)).length,6,'only 2 assets replaced');
assert.ok(!draft.assets.some(x=>x.path==='p964-ayah-meaning.js'||x.path==='p964-ayah-meaning.css'),'old overlay not loaded twice');
for(const asset of draft.assets){
 assert.match(asset.path,/^[a-z0-9][a-z0-9._-]*\.(js|css)$/);
 const bytes=load(asset.path);
 assert.equal(bytes.length,asset.size,'byte count '+asset.path);
 assert.equal(hash(bytes),asset.sha256,'SHA256 '+asset.path);
}
const js=load('p968-native-gesture-preview.js').toString('utf8');
const css=load('p968-native-gesture-preview.css').toString('utf8');
assert.ok(js.includes('function exitMeaning()')&&js.includes('b300WordMeaningOverlay'),'successful QA024 meaning behavior retained');
assert.ok(js.includes('function p968End(ev)'),'original native print acknowledgement required');
assert.ok(js.includes('function p968ShowPreview(ayah)'),'actual image hit preview required');
assert.ok(js.includes('counts.p968OverlayScrollPrevented'),'no extra overlay scroll');
assert.ok(!js.includes('if(!scrollSelected(node))'),'remove previous smooth scroll call');
assert.ok(!css.includes('@font-face'),'font change disallowed');
console.log('PASS P96.8 QA028: 8/8 SHA256, 6/8 QA027 unchanged; sequence28 owner QA, original word meaning retained, QA027 live untouched. NO PUBLISH.');
