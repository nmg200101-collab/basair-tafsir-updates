import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const dir=dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(readFileSync(join(dir,'P970-QA030-UNSIGNED-PAYLOAD-DRAFT.json'),'utf8'));
assert.equal(manifest.sequence,30);
assert.equal(manifest.assets.length,8);
const target=join(dir,'QA030-STAGING-ASSETS-NO-PUBLISH');
mkdirSync(target,{recursive:true});
for(const asset of manifest.assets){
 const data=readFileSync(join(dir,asset.path));
 assert.equal(data.byteLength,asset.size,asset.path+' size');
 assert.equal(createHash('sha256').update(data).digest('hex'),asset.sha256,asset.path+' SHA256');
 copyFileSync(join(dir,asset.path),join(target,asset.path));
}
copyFileSync(join(dir,'P970-QA030-UNSIGNED-PAYLOAD-DRAFT.json'),join(target,'QA030-UNSIGNED-MANIFEST.json'));
writeFileSync(join(target,'STAGING-ONLY-README.txt'),[
 'BASAIR QURAN QA030 / P97.0 — staging assets only.',
 'Not an installed or published update. Contains 8 checked CSS/JS assets.',
 'The owner-signed release.json is stored separately with the owner.',
 'Never deploy these assets or change release.json without explicit owner approval.',
 'Signed QA028 remains available for rollback; application V690 unchanged.',
 'GitHub Actions tests are not a substitute for real device acceptance.'
].join('\n')+'\n','utf8');
console.log('PASS: 8 original assets + unsigned manifest assembled; no signing material or live release modification.');
