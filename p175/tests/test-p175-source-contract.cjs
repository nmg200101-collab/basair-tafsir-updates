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
assert.equal((js.match(/d\.createElement\(['"]button['"]\)/g)||[]).length,1,'One visual-only fallback button at most');
assert.ok(js.includes("#bq175SavedEntry")&&js.includes("#p153FavoritesIndex"),'Native P153 must take priority over fallback');
assert.ok(js.includes("__BASAIR_TAFSIR_P157_STABLE__"),'Fallback must use existing P157 saved panel API');
for(const forbidden of ['localStorage','sessionStorage','indexedDB','loadNext','openNote(','.removeChild(','.replaceWith(']) {
 assert.ok(!js.includes(forbidden),'Forbidden data/reader operation: '+forbidden);
}
assert.ok(css.includes('#tafsirIndex #basairTafsirB233TopBar'));
assert.ok(!css.includes('html body #tafsirReader'),'Never style the reader');
assert.ok(!css.includes('html body #tafsirAyahs'),'Never style verses');
console.log('P175 source contract PASS: native P153 priority; one P157-backed fallback display when absent; no data-store or reader changes.');
