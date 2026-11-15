'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const base=path.join(root,'p121/owner-qa/modules/tafsir');
const css=fs.readFileSync(path.join(base,'p176-tafsir-two-row-index.css'),'utf8');
const js=fs.readFileSync(path.join(base,'p176-saved-return-context.js'),'utf8');
new vm.Script(js,{filename:'p176-saved-return-context.js'});
for(const selector of ['#bqTf118Topbar','#bqTf117Resume','#bqTf118Last','#bq175P118Saved','#bq175P118FullType','.bq-tf117-search-panel'])
 assert.ok(css.includes(selector),'Missing original V695/P175 control '+selector);
for(const selector of ['data-r3-note-open','data-b232-fav-open','basairTafsirB232FavoritesPanel','__BASAIR_TAFSIR_P157_STABLE__','data-r3-saved-tab'])
 assert.ok(js.includes(selector),'Missing native return context '+selector);
for(const file of [css,js])for(const forbidden of ['localStorage','indexedDB','__BASAIR_TAFSIR_STEP5__.loadNext','__BASAIR_TAFSIR_R114__.toggle','window.basairBack='])
 assert.ok(!file.includes(forbidden),'Protected subsystem reference '+forbidden);
assert.ok(!css.includes('#tafsirReader')&&!css.includes('#tafsirAyahs'),'CSS must not style reader or verse tools');
console.log(JSON.stringify({result:'PASS',scopedIndex:true,followProtected:true,noteStorageUntouched:true,nativeNavigationNotOverridden:true}));
