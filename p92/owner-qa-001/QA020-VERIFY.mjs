#!/usr/bin/env node
/**
 * BASAIR P95 / QA020 - read-only candidate verification.
 * Run from a checkout of fix/p95-qa020-restore-printed-font-20261107:
 *   node p92/owner-qa-001/QA020-VERIFY.mjs
 *
 * This script NEVER signs, uploads, publishes, modifies release.json or reads keys.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = name => readFileSync(resolve(root,name));
const text = name => read(name).toString('utf8');
const sha = buf => createHash('sha256').update(buf).digest('hex');
const eq = (condition, detail) => {if(!condition) throw Error('QA020 GATE FAIL: '+detail)};
const src = JSON.parse(text('QA020-UNSIGNED-PAYLOAD-DRAFT.json'));
const signed = JSON.parse(text('release.json'));
const prior = JSON.parse(Buffer.from(signed.payload,'base64').toString('utf8'));

eq(signed.signature && typeof signed.signature==='string','QA019 signed envelope absent');
eq(prior.sequence===19 && prior.channel==='owner-qa' && prior.minAppVersion===690,'active QA019 baseline changed');
eq(src.sequence===20 && src.channel==='owner-qa' && src.minAppVersion===690,'candidate release target');
eq(src.assets.length===8 && new Set(src.assets.map(x=>x.path)).size===8,'exactly eight unique assets');
eq(src.assets.filter(x=>x.kind==='css').length===4,'four CSS assets');
eq(src.assets.filter(x=>x.kind==='js').length===4,'four JS assets');
for(const a of src.assets){
  const bytes = read(a.path);
  eq(bytes.length===a.size,a.path+' byte size');
  eq(sha(bytes)===a.sha256,a.path+' sha256');
}
const expectedCSS='p951-font-restored-header.css', expectedJS='p951-font-restored-follow.js';
const unchanged=prior.assets.filter(a=>src.assets.some(b=>b.path===a.path&&b.kind===a.kind&&b.sha256===a.sha256&&b.size===a.size));
eq(unchanged.length===6,'six unaffected assets byte-hash-identical');
eq(src.assets.some(a=>a.path===expectedCSS)&&src.assets.some(a=>a.path===expectedJS),'exact two replacement assets');
eq(!src.assets.some(a=>['p950-reader-header.css','p947-follow-parity.js'].includes(a.path)),'no old CSS/JS runtime double-loading');
const oldCSS=text('p950-reader-header.css');
const css=text(expectedCSS);
const section='/* Continuation-page typography:';
const header='/* BASAIR P95 / owner QA019';
const begin=oldCSS.indexOf(section),end=oldCSS.indexOf(header,begin);
eq(begin>0&&end>begin,'recognize existing QA017 typography block');
const reconstructed=oldCSS.slice(0,begin).trimEnd()+'\\n\\n'+oldCSS.slice(end);
eq(css===reconstructed,'only QA017 typography block removed; QA019 header unchanged');
eq(!css.includes('.b345ExactPage.bq947-font-parity .b327UnicodeLine'),'no QA017 font-weight override');
eq(css.includes('body #b345NormalStack .b441FollowAyah')&&css.includes('body #b345NormalStack .b441FollowWord'),'Follow ayah/word highlights intact');
eq(read(expectedJS).equals(read('p946-follow-smooth-shade.js')),'candidate JS byte-identical to QA016');
const js=text(expectedJS);
eq(!js.includes('line.style.setProperty(\'font-size\'')&&!js.includes('__BASAIR_P947_FOLLOW_PARITY__'),'no QA017 inline font mutation');
new Function(js); // parse only; never runs application logic
console.log('PASS: QA020 verified; 8/8 assets SHA256 & byte size; six unchanged, no Qur\'an font override; no signing or publishing.');
