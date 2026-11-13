'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.resolve(__dirname,'../../p121/owner-qa/modules/tafsir/p145-reader-polish.js'),'utf8');
async function run(){
 let onReady=null,fetches=0,source='ok';
 const core={getMuyassarSurah:()=>new Promise(()=>{})};
 const step={state:()=>({s:1,a:1,type:'muyassar'})};
 const tabs={setAttribute(){}},host={querySelectorAll:()=>[],querySelector:()=>null};
 const doc={
  readyState:'loading',
  getElementById(id){return id==='tafsirReader'?{classList:{contains:x=>x==='active'}}:id==='tafsirAyahs'?host:id==='basairTafsirPrimaryTabs'?tabs:null},
  addEventListener(type,fn){if(type==='DOMContentLoaded')onReady=fn}
 };
 const win={
  __BASAIR_TAFSIR_CORE__:core,__BASAIR_TAFSIR_STEP2__:step,
  navigator:{onLine:true},location:{href:'file:///android_asset/www/index.html'},
  addEventListener(){},setTimeout,clearTimeout,setInterval:()=>1,
  AbortController,fetch:async url=>{
   fetches++;
   if(source==='error')throw new Error('network-down');
   assert.match(url,/^https:\/\/raw\.githubusercontent\.com\/nmg200101-collab\/basair-tafsir-updates\/main\/public-assets\/tafsir-muyassar\/v1\/surahs\/001\.json$/);
   return {ok:true,json:async()=>({schema:'basair-muyassar-surah-v1',s:1,ayah_count:2,
    ayahs:['موثوق: تفسير الآية الأولى','موثوق: تفسير الآية الثانية']})};
  }
 };
 const global={window:win,document:doc,URL,Map,Promise,AbortController,setTimeout,clearTimeout,console};
 vm.runInNewContext(code,global,{timeout:1000});
 assert.ok(onReady);
 onReady();
 assert.equal(core.getMuyassarSurah.__p145,true);
 const result=await Promise.race([
  core.getMuyassarSurah(1,true),
  new Promise((_,bad)=>setTimeout(()=>bad(Error('fallback remained stuck')),4500))
 ]);
 assert.equal(result.ayahs[0],'موثوق: تفسير الآية الأولى');
 assert.equal(win.__BASAIR_TAFSIR_P145__.status().stats.fetchFallback,1);
 assert.equal(fetches,1);
 source='error';
 await assert.rejects(core.getMuyassarSurah(1,true),/مصدر التفسير غير متاح/);
 assert.equal(fetches,3,'retry bound to two attempts per failed surah');
 assert.equal(core.getMuyassarSurah.__p145,true);
 console.log(JSON.stringify({status:'PASS',scenario:'original QuranEnc never responds',fallback:'verified public full-surah GitHub',boundedRetries:2,errorsFailClosed:true,networkRequests:fetches,protectedTilawa:'untouched',physicalDevice:'NOT TESTED'}));
}
run().catch(e=>{console.error(e);process.exitCode=1});