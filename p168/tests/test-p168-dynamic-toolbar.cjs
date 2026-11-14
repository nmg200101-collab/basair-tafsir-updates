'use strict';
/* P168: actual owner P130 and P166 code, dynamic SPA and native B231 repaint. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
const p130=read('p121/owner-qa/modules/tafsir/p168-tafsir-single-follow-runtime.js');
const p166=read('p121/owner-qa/modules/tafsir/p168-tafsir-no-duplicate-follow-adapter.js');
const css=read('p121/owner-qa/modules/tafsir/p166-tafsir-single-control-owner.css');
const p163=read('p121/owner-qa/modules/tafsir/p163-tafsir-note-fixed-bottom.js');
const p163css=read('p121/owner-qa/modules/tafsir/p163-tafsir-note-fixed-bottom.css');
const p130css=read('p121/owner-qa/modules/tafsir/p130-verse-tools.css');
const row=(n)=>'<article class="v194T2Ayah v194T5Ayah" id="ta-2-'+n+'" data-t5-s="2" data-t5-a="'+n+'" data-t2ayah="'+n+'" data-t5-type="basair"><div class="v194T2Qrow">الآية '+n+'</div><div class="v194T2Body"><div class="v194T2Field meaning"><div class="v194T2FieldTitle"><b>المعنى</b></div><p>تفسير</p></div></div><div class="p146TopMic"><button class="p144MicButton">ناطق</button></div><button class="b263r3NoteChip" data-r3-note-pos="2:'+n+'" hidden>ملاحظة</button><div class="basairB231AyahActions" data-s="2" data-a="'+n+'" data-type="basair"><button data-r2-action="note">ملاحظة</button><button data-b231-action="copy">نسخ</button><button data-b231-action="compare">مقارنة</button><button data-b231-action="mark">مفضلة</button></div></article>';
const reader='<section id="tafsirReader" class="active" data-basair-main-tab="tafsir"><div id="tafsirAyahs">'+row(1)+'<div id="v194T5Sentinel"></div></div></section>';
const style='body{margin:0}#tafsirReader{height:760px;overflow:auto}#tafsirAyahs{padding:6px}.v194T2Ayah{margin:8px;padding:12px;min-height:340px;border:1px solid #bac}.basairB231AyahActions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}.basairB231AyahActions button{min-height:44px;min-width:0}.p146TopMic{margin:8px}';
async function install(page,withReader){
 await page.setContent('<!doctype html><html lang="ar" dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+style+'</style></head><body>'+(withReader?reader:'<main id="SPA"></main>')+'</body></html>');
 await page.evaluate(()=>{
  window.TEST={running:false,starts:0,stops:0,notes:[],next:0,opens:0};
  window.__BASAIR_TAFSIR_CORE__={q:Array.from({length:114},()=>({count:286})),toast(){}};
  window.__BASAIR_TAFSIR_STEP2__={state(){return{s:2,a:1,type:'basair'}},open(){TEST.opens++}};
  window.__BASAIR_TAFSIR_R114__={status(){return{running:TEST.running}},start(){TEST.running=true;TEST.starts++},stop(){TEST.running=false;TEST.stops++}};
  window.__BASAIR_TAFSIR_NATIQ_P132__={status(){return{running:false}}};
  window.__BASAIR_TAFSIR_R2__={openNote(s,a){TEST.notes.push(s+':'+a)},notes:{get(){return false}}};
  window.__BASAIR_TAFSIR_STEP5__={loadNext(){TEST.next++}};
 });
 await page.addStyleTag({content:p130css});await page.addStyleTag({content:p163css});await page.addStyleTag({content:css});
 await page.addScriptTag({content:p130});await page.addScriptTag({content:p163});await page.addScriptTag({content:p166});
}
async function controls(page){
 return page.evaluate(()=>{
  const bar=document.querySelector('#tafsirAyahs .basairB231AyahActions');
  if(!bar)return null;
  return{
   all:bar.children.length,
   visible:Array.from(bar.querySelectorAll(':scope > button')).filter(b=>getComputedStyle(b).display!=='none'&&!b.hidden).length,
   follows:bar.querySelectorAll(':scope > button[data-p125-follow]').length,
   originalNote:bar.querySelectorAll(':scope > button[data-r2-action="note"]').length,
   expectedNote:document.querySelectorAll('.bq163NoteChip').length,
   topButton:!!bar.firstElementChild?.hasAttribute('data-p125-follow')
  };
 });
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [320,360,390,430]){
   const page=await browser.newPage({viewport:{width,height:780},hasTouch:true,isMobile:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await install(page,true);
   await page.waitForFunction(()=>document.querySelectorAll('.basairB231AyahActions [data-p125-follow]').length===1&&window.__BASAIR_TAFSIR_P166_SINGLE_OWNER__);
   let a=await controls(page);
   assert.equal(a.follows,1,'Initial follow must be unique');assert.equal(a.visible,4,'Toolbar initial 4 visible tools');
   await page.locator('.basairB231AyahActions [data-p125-follow]').click();
   assert.equal(await page.evaluate(()=>TEST.running),true,'Follow click MUST start R114');
   await page.locator('.basairB231AyahActions [data-p125-follow]').click();
   assert.equal(await page.evaluate(()=>TEST.running),false,'Follow click MUST stop R114');
   assert.equal(await page.locator('#tafsirReader').getAttribute('data-basair-main-tab'),'p129-manual');
   // Reproduce the owner screenshot: original B231 toolbar gets a second Follow
   // plus a native Note after the OTA-created Follow was already present.
   await page.evaluate(()=>{
    const bar=document.querySelector('.basairB231AyahActions');
    const extra=bar.querySelector('[data-p125-follow]').cloneNode(true);
    extra.classList.add('bq166Follow');bar.append(extra);
    const note=document.createElement('button');note.type='button';note.setAttribute('data-r2-action','note');note.textContent='ملاحظة';bar.append(note);
    window.__BASAIR_TAFSIR_P130__.init();
    window.__BASAIR_TAFSIR_P166_SINGLE_OWNER__.refresh();
   });
   await page.waitForTimeout(150);
   a=await controls(page);
   assert.equal(a.follows,1,'B231 repaint must NOT leave second Follow');
   assert.equal(a.visible,4,'Repaint must NOT leave a fifth cell');
   assert.equal(a.expectedNote,1,'P163 lower note stays');
   assert.ok(a.topButton,'Follow is the first RTL control');
   await page.locator('.basairB231AyahActions [data-p125-follow]').click();
   assert.equal(await page.evaluate(()=>TEST.running),true,'Follow remains clickable after B231 repaint');
   await page.locator('.basairB231AyahActions [data-p125-follow]').click();
   assert.equal(await page.evaluate(()=>TEST.running),false,'Follow still stops after repaint');
   assert.deepEqual(errors,[],'No runtime JS errors');
   console.log(JSON.stringify({width,mode:'B231-REBUILD',status:'PASS',follows:a.follows,visible:a.visible,lateInit:false}));
   await page.close();
  }
  // Regression: OTA runs before the SPA inserts the Tafsir reader element.
  const late=await browser.newPage({viewport:{width:390,height:780},hasTouch:true,isMobile:true});
  const errors=[];late.on('pageerror',e=>errors.push(e.message));
  await install(late,false);
  await late.waitForTimeout(250);
  await late.evaluate(markup=>{document.querySelector('#SPA').innerHTML=markup},reader);
  await late.waitForFunction(()=>document.querySelectorAll('#tafsirAyahs [data-p125-follow]').length===1,{timeout:6000});
  await late.waitForTimeout(350);
  let a=await controls(late);assert.equal(a.visible,4,'Late SPA toolbar must contain exactly four tools');
  await late.locator('.basairB231AyahActions [data-p125-follow]').click();
  assert.equal(await late.evaluate(()=>TEST.running),true,'Late-created SPA reader MUST register Follow click handler');
  await late.locator('.basairB231AyahActions [data-p125-follow]').click();
  assert.equal(await late.evaluate(()=>TEST.running),false,'Late SPA reader must stop');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({width:390,mode:'SPA-LATE-READER',status:'PASS',followFunctional:true,visible:a.visible}));
  await late.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
