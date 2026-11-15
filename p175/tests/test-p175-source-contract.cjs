'use strict';
// P175 source contract for actual V695 P117/P118 toolbar, not superseded B233-only draft.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const dir=path.join(root,'p121/owner-qa/modules/tafsir');
const js=fs.readFileSync(path.join(dir,'p175-tafsir-index-single-owner.js'),'utf8');
const css=fs.readFileSync(path.join(dir,'p175-tafsir-index-single-owner.css'),'utf8');
new vm.Script(js,{filename:'p175-tafsir-index-single-owner.js'});
for(const s of ['#bqTf118Topbar','#bqTf118SearchAction','#bqTf117Favorites',
 '__BASAIR_TAFSIR_P157_STABLE__','#basairTafsirB233TopBar',
 'bq175P118Saved','bq175P118FullType']) assert.ok(js.includes(s),'Missing native V695 target: '+s);
for(const s of ['#bqTf118Topbar','#bqTf118SearchAction','#bqTf117Favorites',
 '#bq175P118Saved','#bq175P118FullType']) assert.ok(css.includes(s),'Missing selector '+s);
for(const s of ['localStorage','sessionStorage','indexedDB','loadNext','openNote(']) {
 assert.ok(!js.includes(s),'Must not modify notes, follow, or stored data: '+s);
}
assert.ok(!css.includes('html body #tafsirAyahs'),'Must not restyle verse-reader');
assert.ok(!css.includes('html body #tafsirReader'),'Must not restyle tafsir-reader');
console.log('P175 V695 source contract PASS: original P117/P118 toolbar, original saved hub, no data or reader edits');
