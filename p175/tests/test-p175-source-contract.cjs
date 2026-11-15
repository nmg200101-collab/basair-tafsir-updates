'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const mod=path.join(root,'p121/owner-qa/modules/tafsir');
const js=fs.readFileSync(path.join(mod,'p175-tafsir-index-single-owner.js'),'utf8');
const css=fs.readFileSync(path.join(mod,'p175-tafsir-index-single-owner.css'),'utf8');
new vm.Script(js,{filename:'p175-tafsir-index-single-owner.js'});
assert.match(js, /#p153FavoritesIndex/);
assert.match(js, /data-bq175-owned/);
assert.match(js,/sourceMirror/);
assert.match(js,/attributeFilter:\['class','style','hidden','aria-hidden'\]/);
assert.ok(!/d\.createElement\(['"]button['"]\)/.test(js),'Must not create a new Favorites button');
for(const forbidden of ['localStorage','sessionStorage','indexedDB','loadNext','openNote(','.removeChild(','.replaceWith(']) {
 assert.ok(!js.includes(forbidden),'Forbidden data/reader operation: '+forbidden);
}
assert.ok(css.includes('#tafsirIndex #basairTafsirB233TopBar'));
assert.ok(!css.includes('html body #tafsirReader'),'Never style the reader');
assert.ok(!css.includes('html body #tafsirAyahs'),'Never style verses');
console.log('P175 source contract PASS: no duplicate Favorites button, no saved-store or reader changes, scoped styles.');
