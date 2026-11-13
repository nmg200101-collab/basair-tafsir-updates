'use strict';
/* Only simulated DOM/audio playback. Upstream MP3 coverage and handset acceptance NOT tested. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../p121/owner-qa/modules/tafsir/');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const c=read('p136-ayah-catalog.js'),b=read('p136-reciter-bridge.js');
function setup(initial='husary'){
 const store={v170Reciter:initial},writes=[],audio=[],selector={value:initial};
 const d={
  getElementById:id=>id==='sequenceReciterV17'?selector:null,
  createElement:tag=>{
   assert.equal(tag,'audio');
   const node={src:'',paused:true,preload:'',playsInline:false,onended:null,onerror:null,
    pause(){this.paused=true},load(){},removeAttribute(k){if(k==='src')this.src=''},
    play(){this.paused=false;this.playCalls=(this.playCalls||0)+1;return Promise.resolve()}};
   audio.push(node);return node;
  }
 };
 const w={location:{href:'file:///android_asset/www/index.html'},
  localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{writes.push([k,v]);store[k]=v}}};
 new Function('window','document',c)(w,d);
 new Function('window','document',b)(w,d);
 return {w,d,selector,store,writes,audio,cat:w.__BASAIR_TAFSIR_EXACT_AYAH_AUDIO_CATALOG__,
  bridge:w.__BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__};
}
async function main(){
 let pass=0;const check=async(label,fn)=>{await fn();console.log('PASS '+label);pass++};
 await check('exact seven Follow reciters are exposed',()=>{
  const m=setup();const v=m.cat.list();assert.equal(v.length,7);
  assert.deepEqual(v.map(r=>r.id),['alafasy','husary','minshawy','abdulbasit','sudais','maher','shuraym']);
  assert.equal(m.bridge.list().length,7);
 });
 await check('Follow reciter is read only and separate choice does not change it',()=>{
  const m=setup('husary');assert.equal(m.bridge.selected('follow').id,'husary');
  assert.equal(m.bridge.selected('maher').id,'maher');
  assert.equal(m.bridge.selected('follow').id,'husary');
  assert.equal(m.selector.value,'husary');assert.deepEqual(m.writes,[]);
 });
 await check('every separate reciter returns correct verse-specific recording URLs',()=>{
  const m=setup('husary');
  for(const r of m.cat.list()){
   const v=m.cat.getExact({surah:2,ayah:255,reciterId:r.id});
   assert.equal(v.kind,'single-ayah');
   assert.equal(v.verified,true);assert.equal(v.durationScope,'single-ayah');
   assert.equal(v.reciterId,r.id);assert.equal(v.surah,2);assert.equal(v.ayah,255);
   assert.match(v.url,/^https:\/\/everyayah\.com\/data\/[\w-]+\/002255\.mp3$/);
   assert.ok(v.alternates.every(s=>/002255\.mp3$/.test(s)));
  }
 });
 await check('never substitute unsupported or unknown readers',()=>{
  const m=setup();assert.equal(m.bridge.selected('untrusted'),null);
  assert.equal(m.cat.getExact({surah:1,ayah:1,reciterId:'other'}),null);
  assert.equal(m.bridge.availability({surah:1,ayah:1,reciterId:'other'}).available,false);
 });
 await check('invalid verse numbers are rejected',()=>{
  const m=setup();for(const v of [0,287,-1,1.1,NaN]){
   assert.equal(m.cat.getExact({surah:1,ayah:v,reciterId:'alafasy'}),null);
  }
 });
 await check('independent selected reciter is playable without touching Follow selection',async()=>{
  const m=setup('husary');
  assert.equal(m.bridge.availability({surah:1,ayah:4,reciterId:'maher'}).available,true);
  const h=m.bridge.playOne({surah:1,ayah:4,reciterId:'maher'});
  assert.equal(h.reciterId,'maher');assert.equal(h.surah,1);assert.equal(h.ayah,4);
  assert.equal(h.verified,true);
  assert.match(m.audio[0].src,/Maher_AlMuaiqly_64kbps\/001004\.mp3$/);
  assert.equal(m.selector.value,'husary');assert.deepEqual(m.writes,[]);
  m.audio[0].onended();assert.equal(await h.ended,true);
 });
 await check('explicit Stop cancels only the narrator audio session',async()=>{
  const m=setup();const h=m.bridge.playOne({surah:1,ayah:2,reciterId:'alafasy'});
  h.stop();assert.equal(await h.ended,false);assert.equal(m.audio[0].paused,true);
  assert.equal(m.selector.value,'husary');assert.deepEqual(m.writes,[]);
 });
 await check('unknown/unsafe audio path cannot appear for any supported reciter',()=>{
  const m=setup();
  for(const r of m.bridge.list()){
   for(const a of [1,7,130]){
    const rec=m.cat.getExact({surah:2,ayah:a,reciterId:r.id});
    assert.ok(rec&&rec.url.includes('everyayah.com/data/'));
    assert.ok(!/[?#]/.test(rec.url));
   }
  }
 });
 await check('bridge keeps a fixed allowlisted recording host',()=>{
  assert.match(b,/everyayah\.com/);
  assert.match(b,/data.*mp3/);
  assert.ok(!b.includes('localStorage.setItem'));
 });
 await check('empty or unrecognized live Follow ID cannot silently choose another',()=>{
  const m=setup('unknown');m.selector.value='unknown';
  assert.equal(m.bridge.selected('follow'),null);
  assert.equal(m.bridge.selected('alafasy').id,'alafasy');
  assert.equal(m.bridge.availability({surah:1,ayah:1,reciterId:'unknown'}).available,false);
 });
 await check('P136 overrides legacy cached catalog without modifying Tilawa',()=>{
  const m=setup('husary');
  m.w.__BASAIR_TAFSIR_EXACT_AYAH_AUDIO_CATALOG__={selected:()=>({id:'husary'}),getExact:()=>null,version:'P132'};
  new Function('window','document',c)(m.w,m.d);
  assert.equal(m.w.__BASAIR_TAFSIR_EXACT_AYAH_AUDIO_CATALOG__.version,'P136-RECITER-CATALOG-V1');
  assert.equal(m.w.__BASAIR_TAFSIR_EXACT_AYAH_AUDIO_CATALOG__.list().length,7);
  assert.equal(m.selector.value,'husary');assert.deepEqual(m.writes,[]);
 });
 await check('P136 replaces older cached bridge, stopping its narrator audio only',()=>{
  const m=setup('husary');
  let stopped=0;
  m.w.__BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__={version:'P132',stop(){stopped++},selected(){return null},playOne(){}};
  new Function('window','document',b)(m.w,m.d);
  assert.equal(stopped,1);
  assert.equal(m.w.__BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__.version,'P136-RECITER-BRIDGE-V1');
  assert.equal(m.w.__BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__.list().length,7);
  assert.equal(m.selector.value,'husary');assert.deepEqual(m.writes,[]);
 });
 console.log(JSON.stringify({pass,total:12,device:'NOT TESTED',remoteMP3:'NOT VERIFIED',tilawaMutations:0}));
}
main().catch(e=>{console.error(e);process.exitCode=1});
