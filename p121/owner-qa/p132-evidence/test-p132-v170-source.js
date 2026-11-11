'use strict';
/* P132.2 canonical v170 Follow reciter source tests (V690 baseline parity).
 * Run: node p121/owner-qa/p132-evidence/test-p132-v170-source.js
 * All streams are mocked, no remote MP3 is assumed downloaded. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../modules/tafsir');
const csrc=fs.readFileSync(path.join(base,'p132-ayah-catalog.js'),'utf8');
const bsrc=fs.readFileSync(path.join(base,'p132-reciter-bridge.js'),'utf8');
function env(key='alafasy',{saved=null,noControl=false,failFirst=false}={}){
 const logs=[],els=[],settings={v170Reciter:saved||key};
 const d={
  getElementById(id){return id==='sequenceReciterV17'&&!noControl?{value:key}:null},
  createElement(tag){
   assert.equal(tag,'audio');
   const a={src:'',onended:null,onerror:null,paused:true,
     pause(){this.paused=true},removeAttribute(){},load(){},
     play(){logs.push(this.src);this.paused=false;
      return failFirst&&logs.length===1?Promise.reject(new Error('unavailable')):Promise.resolve()}};
   els.push(a);return a;
  }
 };
 const w={
  localStorage:{getItem:k=>settings[k]||null,setItem(){throw Error('MUST NOT WRITE tilawa selection')}},
  location:{href:'https://app.basair.quran/'},
  __BASAIR_R109_SELECTED__:{_test:{state:{reader:{id:'masad',name:'عبد الرحمن مسعد'}}}}
 };
 new Function('window','document',csrc)(w,d);
 new Function('window','document',bsrc)(w,d);
 return {catalog:w.__BASAIR_TAFSIR_EXACT_AYAH_AUDIO_CATALOG__,
  bridge:w.__BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__,logs,els,settings};
}
async function main(){
 let count=0;async function check(name,fn){await fn();count++;console.log('PASS '+name)}
 const names={alafasy:'Alafasy_64kbps',husary:'Husary_64kbps',
  minshawy:'Minshawy_Murattal_128kbps',abdulbasit:'Abdul_Basit_Murattal_64kbps',
  sudais:'Abdurrahmaan_As-Sudais_64kbps',maher:'Maher_AlMuaiqly_64kbps',
  shuraym:'Saood_ash-Shuraym_64kbps'};
 for(const [k,folder] of Object.entries(names)){
  await check('Canonical exact-ayah path for '+k,()=>{
   const m=env(k),selected=m.bridge.selected();
   assert.equal(selected.id,k);
   const r=m.catalog.getExact({surah:1,ayah:4,reciterId:k});
   assert.equal(r.url,'https://everyayah.com/data/'+folder+'/001004.mp3');
   assert.equal(r.kind,'single-ayah');assert.equal(r.ayah,4);
  });
 }
 await check('V170 follow selection takes priority over unrelated R109 reader',()=>{
  const m=env('husary');assert.equal(m.bridge.selected().id,'husary');
  assert.equal(m.bridge.availability({surah:1,ayah:4}).available,true);
 });
 await check('Saved V170 reader used when follow selector not mounted',()=>{
  const m=env('alafasy',{saved:'maher',noControl:true});
  assert.equal(m.bridge.selected().id,'maher');
 });
 await check('Unrecognized reciter never silently substitutes Alafasy',()=>{
  const m=env('unlisted-reader');
  assert.equal(m.bridge.selected(),null);
  assert.equal(m.bridge.availability({surah:1,ayah:4}).available,false);
 });
 await check('Incorrect selected reciter rejected',()=>{
  const m=env('shuraym');
  assert.equal(m.catalog.getExact({surah:1,ayah:4,reciterId:'alafasy'}),null);
 });
 await check('Two same-reciter audio sources are tried on first failure',async()=>{
  const m=env('maher',{failFirst:true});
  const handle=m.bridge.playOne({surah:1,ayah:4,reciterId:'maher'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(m.logs.length,2);
  assert.match(m.logs[0],/Maher_AlMuaiqly_64kbps/);
  assert.match(m.logs[1],/MaherAlMuaiqly128kbps/);
  m.els[0].onended();assert.equal(await handle.ended,true);
 });
 await check('Playback stop never edits Tilawa preference',async()=>{
  const m=env('husary'),original=JSON.stringify(m.settings);
  const h=m.bridge.playOne({surah:1,ayah:4,reciterId:'husary'});
  h.stop();assert.equal(await h.ended,false);
  assert.equal(JSON.stringify(m.settings),original);
 });
 await check('Exact Ayah filename for Baqarah 286 is 002286.mp3',()=>{
  const m=env('alafasy');
  assert.match(m.catalog.getExact({surah:2,ayah:286,reciterId:'alafasy'}).url,/002286\.mp3$/);
 });
 console.log(JSON.stringify({pass:count,total:14,scope:'V170-compatible exact-ayah URL and simulated playback; real device untested'}));
}
if(typeof module!=='undefined'&&module.exports)module.exports=main;
if(typeof require!=='undefined'&&require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
