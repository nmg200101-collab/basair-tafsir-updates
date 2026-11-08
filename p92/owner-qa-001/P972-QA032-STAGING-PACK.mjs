import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=dirname(fileURLToPath(import.meta.url));
const draft=JSON.parse(readFileSync(join(dir,'P972-QA032-UNSIGNED-PAYLOAD-DRAFT.json'),'utf8'));
assert.equal(draft.sequence,32);assert.equal(draft.assets.length,8);
const out=join(dir,'QA032-STAGING-ASSETS-NO-PUBLISH');
mkdirSync(out,{recursive:true});
for(const item of draft.assets){
 const v=readFileSync(join(dir,item.path));
 assert.equal(v.length,item.size,item.path+' size');
 assert.equal(createHash('sha256').update(v).digest('hex'),item.sha256,item.path+' SHA256');
 copyFileSync(join(dir,item.path),join(out,item.path));
}
copyFileSync(join(dir,'P972-QA032-UNSIGNED-PAYLOAD-DRAFT.json'),join(out,'QA032-UNSIGNED-MANIFEST.json'));
writeFileSync(join(out,'README.txt'),[
 'BASAIR P97.2 QA032 — 8 verified CSS/JS assets.',
 'UNSIGNED STAGING ONLY: the user-owned RSA signature is NOT included here.',
 'Never replace main release.json or publish without owner approval.',
 'No APK, signing key, passwords, personal data or native source.',
 'Owner must test the actual device before final acceptance.'
].join('\n')+'\n','utf8');
console.log('PASS: eight QA032 SHA256-verified assets packaged without signing secrets or publishing');
