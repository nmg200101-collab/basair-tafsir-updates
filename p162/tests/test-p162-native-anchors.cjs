'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p));
const rollback=read('p121/owner-qa/release-p161-seq38-before-p162-20261114.json');
const previous=read('p161/P161-SEQ38-OWNER-SIGNED-RELEASE.json');
const signed=read('p162/P162-SEQ39-OWNER-SIGNED-RELEASE.json');
const active=read('p121/owner-qa/release.json');
assert.deepEqual(rollback,previous,'Exact signed P161 Seq38 rollback required');
assert.deepEqual(active,signed,'Active branch must use signed Seq39 exactly');
const pub=(read('p146/tests/test-p146-signed-release.cjs').toString().match(/const pub='([^']+)'/)||[])[1];
assert.ok(pub);
const key={key:Buffer.from(pub,'base64'),format:'der',type:'spki'};
function unwrap(blob){const env=JSON.parse(blob.toString()),bytes=Buffer.from(env.payload,'base64'),sig=Buffer.from(env.signature,'base64');
 assert.equal(sig.length,384);assert.ok(crypto.verify('RSA-SHA256',bytes,key,sig));return JSON.parse(bytes.toString())}
const old=unwrap(previous),now=unwrap(signed);
assert.equal(old.sequence,38);assert.equal(old.modules[0].version,36);
assert.equal(now.sequence,39);assert.equal(now.modules[0].version,37);
assert.equal(now.schema,'basair-universal-ota-v1');assert.equal(now.channel,'owner-qa');
assert.equal(now.applicationId,'app.basair.qurv2');assert.equal(now.minAppVersion,694);
assert.equal(now.deliveryMode,'automatic');assert.equal(now.modules.length,1);
assert.equal(now.modules[0].id,'tafsir');assert.ok(Date.parse(now.expiresAt)>Date.now());
const assets=now.modules[0].assets;
assert.deepEqual(assets.map(a=>a.path),[
 'modules/tafsir/p157-native-saved-stability.css',
 'modules/tafsir/p162-tafsir-stable-anchors.css',
 'modules/tafsir/p157-native-saved-stability.js',
 'modules/tafsir/p162-tafsir-stable-anchors.js']);
assert.deepEqual(assets[0],old.modules[0].assets[0]);assert.deepEqual(assets[2],old.modules[0].assets[2]);
for(const asset of assets){let data=read('p121/owner-qa/'+asset.path);
 assert.equal(data.length,asset.size,asset.path);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),asset.sha256,asset.path);
 if(asset.kind==='js')new vm.Script(data.toString(),{filename:asset.path});}
const js=read('p121/owner-qa/modules/tafsir/p162-tafsir-stable-anchors.js').toString();
const css=read('p121/owner-qa/modules/tafsir/p162-tafsir-stable-anchors.css').toString();
for(const term of ['p146TopMic','bq162NativeNarratorHost','__BASAIR_TAFSIR_R114__','r.toggle()',
 'data-bq162-note-owner','p153NoteProxy','b263r3NoteChip'])assert.ok(js.includes(term),term);
assert.ok(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'));
for(const term of ['loadNext()','localStorage.setItem','indexedDB.deleteDatabase',
 'stopImmediatePropagation','setAttribute(\'data-basair-main-tab','cloneNode'])assert.ok(!js.includes(term),term);
assert.ok(!JSON.stringify(now).includes('p161-tafsir-single-narrator-bottom-note'));
console.log('PASS P162 original RSA3072 signed Seq39, V694/V695 compatible, byte-checked Tafsir only, stable native controls');
