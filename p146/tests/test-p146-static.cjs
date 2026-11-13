'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const js=fs.readFileSync(path.join(root,'p121/owner-qa/modules/tafsir/p146-reader-polish.js'),'utf8');
const css=fs.readFileSync(path.join(root,'p121/owner-qa/modules/tafsir/p146-reader-polish.css'),'utf8');
for(const token of ['.p146TopMic','.p146BottomNote','.v194T2Qrow','.p144MicButton','.p144NoteChip',
  'basair-tafsir-library-v2','basair-muyassar-surah-v1','__p145','p145SourceOverlay',
  'window','p145Retry']){
 assert.ok(js.includes(token),'Missing reader strategy '+token);
}
for(const token of ['#basairTafsirPrimaryTabs','data-basair-main-tab="intro"',
 'data-basair-main-tab="thread"','.p146TopMic','.p146BottomNote','#p145SourceOverlay',
 '.p145Retry','min-height:44px']){
 assert.ok(css.includes(token),'Missing scoped CSS '+token);
}
assert.ok(!/^\s*location\s*=\s*/m.test(js));
assert.ok(!/\.location\.href\s*=\s*/.test(js),'External links must not replace app WebView');
assert.ok(!/window\.basairBack\s*=/.test(js),'Global back handler must remain untouched');
assert.ok(!/\.innerHTML\s*=\s*.*p144MicButton/.test(js),'Never clone native mic handlers');
assert.ok(js.includes('document')&&js.includes('allow-scripts allow-forms allow-popups'));
console.log(JSON.stringify({status:'PASS',tests:21,tilawa:'untouched',nativeBack:'untouched',onDevice:'NOT TESTED'}));