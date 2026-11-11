'use strict';
/* P132.2 R109 read-only / exact-ayah recording tests.
 * Run: node p121/owner-qa/p132-evidence/test-p132-reciter-bridge.js
 * No real MP3 sources, speaker or Android WebView involved. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../modules/tafsir/p132-reciter-bridge.js'),'utf8');
function setup(o={}){
 const events=[],state={reader:o.reader===undefined?{id:'masad',name:'عبد الرحمن مسعد'}:o.reader};
 if(o.playing)state.playing=o.playing;
 const expected={kind:'single-ayah',verified:true,surah:1,ayah:4,
  reciterId:'masad',url:'https://approved.example/masad/1/4.mp3',durationScope:'single-ayah'};
 const catalog=o.catalog===false?null:{getExact:function(q){
  events.push('lookup:'+q.reciterId+':'+q.surah+':'+q.ayah);
  return Object.assign({},expected,o.record||{});
 }};
 const audios=[],win={
  __BASAIR_R109_SELECTED__:o.stateMissing?null:{_test:{state:state}},
  __BASAIR_TAFSIR_EXACT_AYAH_AUDIO_CATALOG__:catalog,
  location:{href:'https://app.basair.quran/'}};
 const doc={createElement:function(tag){
  assert.equal(tag,'audio');
  const a={onended:null,onerror:null,paused:true,src:'',
   removeAttribute(k){if(k==='src')this.src=''},
   load(){},pause(){events.push('pause');this.paused=true},
   play(){events.push('play:'+this.src);this.paused=false;
    return o.failPlay?Promise.reject(new Error('blocked')):Promise.resolve();}
  };
  audios.push(a);return a;
 }};
 new Function('window','document',src)(win,doc);
 return {api:win.__BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__,events,audios,state};
}
const req={surah:1,ayah:4,reciterId:'masad'};
async function main(){
 let count=0;
 async function test(label,fn){await fn();count++;console.log('PASS '+label)}
 await test('R109 selected reader is read only',async()=>{
  const m=setup(),original=JSON.stringify(m.state);const s=m.api.selected();
  assert.equal(s.id,'masad');assert.equal(s.name,'عبد الرحمن مسعد');
  assert.equal(JSON.stringify(m.state),original);
 });
 await test('String reader is accepted without changing its id',async()=>{
  const m=setup({reader:'masad'});assert.equal(m.api.selected().id,'masad');
 });
 await test('Unselected reader is not guessed from the catalog',async()=>{
  const m=setup({stateMissing:true});assert.equal(m.api.selected(),null);
  assert.equal(m.api.availability(req).available,false);
 });
 await test('Other currently playing reader causes fail closed',async()=>{
  const m=setup({playing:{reader:'ghamdi'}});assert.equal(m.api.selected(),null);
 });
 await test('No exact ayah catalog means no available source',async()=>{
  const m=setup({catalog:false});assert.equal(m.api.availability(req).available,false);
  assert.throws(()=>m.api.playOne(req));assert.equal(m.audios.length,0);
 });
 await test('Whole surah MP3 must not be mistaken for one ayah',async()=>{
  const m=setup({record:{kind:'whole-surah'}});assert.equal(m.api.availability(req).available,false);
 });
 await test('Wrong verse number rejected',async()=>{
  const m=setup({record:{ayah:5}});assert.equal(m.api.availability(req).available,false);
 });
 await test('Wrong reciter rejected',async()=>{
  const m=setup({record:{reciterId:'ghamdi'}});assert.equal(m.api.availability(req).available,false);
 });
 await test('Unverified metadata rejected',async()=>{
  const m=setup({record:{verified:false}});assert.equal(m.api.availability(req).available,false);
 });
 await test('HTTP and javascript audio URLs rejected',async()=>{
  for(const url of ['http://example.org/1.mp3','javascript:alert(1)']){
   const m=setup({record:{url}});assert.equal(m.api.availability(req).available,false);
  }
 });
 await test('Exact single ayah recording begins and confirms identity',async()=>{
  const m=setup();assert.equal(m.api.availability(req).available,true);
  const h=m.api.playOne(req);assert.equal(h.verified,true);assert.equal(h.ayah,4);
  assert.equal(h.reciterId,'masad');
  assert.ok(m.events.some(x=>x.startsWith('play:https://')));
  m.audios[0].onended();assert.equal(await h.ended,true);
 });
 await test('Stopping a current recording resolves ended false',async()=>{
  const m=setup(),h=m.api.playOne(req);h.stop();assert.equal(await h.ended,false);
  assert.equal(m.api.diagnostics().stats.stops,1);
 });
 await test('Blocked Android audio play propagates rejection',async()=>{
  const m=setup({failPlay:true}),h=m.api.playOne(req);
  await assert.rejects(h.ended,/تعذر تشغيل/);
 });
 await test('Separate recording auto-stops prior recording',async()=>{
  const m=setup(),h1=m.api.playOne(req),h2=m.api.playOne(req);
  assert.equal(await h1.ended,false);
  m.audios[1].onended();assert.equal(await h2.ended,true);
 });
 await test('Catalog descriptor cannot be promise from gesture',async()=>{
  const m=setup({catalog:false});
  m.api.diagnostics();assert.equal(m.api.diagnostics().canInferAyahFromR109SurahMP3,false);
 });
 console.log(JSON.stringify({passed:count,total:15,scope:'mock R109 + fake exact-ayah catalog, not real audio'}));
}
if(typeof module!=='undefined'&&module.exports)module.exports=main;
if(typeof require!=='undefined'&&require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
