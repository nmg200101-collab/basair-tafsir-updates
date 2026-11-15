'use strict';
// P177 static regression against the actual accumulated owner-QA source files.
// This test does not deploy, sign, or modify saved data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
function read(file){return fs.readFileSync(path.join(ROOT,file),'utf8')}
const DIR='p121/owner-qa/modules/tafsir/';
const js=read(DIR+'p177-tafsir-reader-final.js'),css=read(DIR+'p177-tafsir-reader-final.css');
const p144=read(DIR+'p144-natiq.js'),p169=read(DIR+'p169-tafsir-top-status-notes-back.js');
const p176=read(DIR+'p176-saved-return-context.js');
new vm.Script(js);
for(const key of ['p177VoiceDock','p144MicButton','data-p177-speaking','data-p177-voice-pending',
 'getSelection','contextmenu','selectionchange','__BASAIR_TAFSIR_P157_STABLE__',
 '__BASAIR_TAFSIR_R3__','installBack','openTafsirIndex'])assert.ok(js.includes(key),'Missing '+key);
for(const selector of ['.p177VoiceDock','#p144SpeechFrame','.v194T2Qrow','.v194T2Body',
 '[data-p177-speaking','textarea','button.p144MicButton'])assert.ok(css.includes(selector),'Missing CSS '+selector);
assert.ok(p144.includes('longTimer=w.setTimeout')&&p144.includes('settings()},570)')&&
          p144.includes('function settings()')&&p144.includes('p144MicButton'),
          'Must preserve original P144 long-press settings, without a replacement TTS engine');
assert.ok(p169.includes('--bq169-speech-top'),'Status must use existing P169 top offset');
assert.ok(p176.includes('enteredReader')&&p176.includes('openSaved(pending.tab)'),
          'P176 remains sole owner of restoring saved verse context');
for(const forbidden of ['localStorage','sessionStorage','indexedDB','document.body.innerHTML',
  'window.basairBack=','w.basairBack=','document.execCommand','navigator.clipboard.writeText',
  'speechSynthesis.speak(','window.history.back()'])assert.ok(!js.includes(forbidden),
  'P177 must not access storage, replace navigation, or start a new TTS: '+forbidden);
assert.ok(!css.includes('#tafsirIndex'),'Do not touch the stable Seq52 index');
assert.ok(!css.includes('#mushafReader'),'Do not touch QA-050 protected Tilawa');
console.log('P177 SOURCE CONTRACT PASS: original P144 + R3, scoped selection and status, no data/back engine replacement');
