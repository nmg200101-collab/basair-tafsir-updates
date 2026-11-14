'use strict';
/* Runtime regression uses the actual P130 verse-tools and P166 adapter source.
 * The Android platform/audio are mocked, the original P130 follow and cursor are not.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const p130=read('p121/owner-qa/modules/tafsir/p168-tafsir-single-follow-runtime.js');
const p130css=read('p121/owner-qa/modules/tafsir/p130-verse-tools.css');
const p163=read('p121/owner-qa/modules/tafsir/p163-tafsir-note-fixed-bottom.js');
const p163css=read('p121/owner-qa/modules/tafsir/p163-tafsir-note-fixed-bottom.css');
const p166=read('p121/owner-qa/modules/tafsir/p168-tafsir-no-duplicate-follow-adapter.js');
const p166css=read('p121/owner-qa/modules/tafsir/p166-tafsir-single-control-owner.css');
const mkRow=(a)=>`<article class="v194T2Ayah v194T5Ayah" id="ta-2-${a}" data-t5-s="2" data-t5-a="${a}" data-t2ayah="${a}" data-t5-type="basair"><div class="v194T2Qrow">الآية ${a}</div><div class="v194T2Body"><section class="v194T2Field meaning"><div class="v194T2FieldTitle"><b>المعنى</b></div><p>تفسير الآية ${a}</p></section></div><div class="p146TopMic"><button class="p144MicButton" type="button" aria-pressed="false"><b>الناطق</b></button></div><button class="b263r3NoteChip" type="button" data-r3-note-pos="2:${a}" hidden>ملاحظة</button><div class="basairB231AyahActions" data-s="2" data-a="${a}" data-type="basair"><button type="button" data-r2-action="note"><span>✎</span><b>ملاحظة</b></button><button type="button" data-b231-action="copy"><span>⧉</span><b>نسخ</b></button><button type="button" data-b231-action="compare"><span>⇄</span><b>مقارنة</b></button><button type="button" data-b231-action="mark"><span>☆</span><b>مفضلة</b></button></div></article>`;
const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}#tafsirReader{height:760px;overflow:auto}#tafsirAyahs{padding:6px}.v194T2Ayah{margin:10px 5px;padding:14px;min-height:330px;border:1px solid #cad4c7}.v194T2Qrow{padding:9px;background:#eef3ec}.v194T2Body{padding:13px}.v194T2FieldTitle{display:flex;gap:8px}.basairB231AyahActions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.basairB231AyahActions button{min-height:44px;min-width:0}.p146TopMic{margin:20px}</style></head><body><section id="tafsirReader" class="active" data-basair-main-tab="tafsir"><div id="tafsirAyahs">${mkRow(1)}<div id="v194T5Sentinel"></div></div></section></body></html>`;
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [360,390]){
 const page=await browser.newPage({viewport:{width,height:780},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setContent(html,{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{
  window.TEST={running:false,narration:false,narrationClicks:0,starts:0,stops:0,next:0,notes:[]};
  window.__BASAIR_TAFSIR_CORE__={q:Array.from({length:114},()=>({count:286})),toast(){},isMark(){return false},toggleMark(){}};
  window.__BASAIR_TAFSIR_STEP2__={state(){return{s:2,a:1,type:'basair'}},open(){}};
  window.__BASAIR_TAFSIR_R114__={status(){return{running:TEST.running}},start(){TEST.running=true;TEST.starts++},stop(){TEST.running=false;TEST.stops++}};
  window.__BASAIR_TAFSIR_NATIQ_P132__={status(){return{running:TEST.narration}}};
  window.__BASAIR_TAFSIR_R2__={openNote(s,a){TEST.notes.push(s+':'+a)},notes:{get(){return false}}};
  window.__BASAIR_TAFSIR_STEP5__={loadNext(){TEST.next++;
   const host=document.getElementById('tafsirAyahs');const last=host.querySelector('.v194T2Ayah:last-of-type');
   const verse=Number(last.getAttribute('data-t5-a'))+1;const clone=last.cloneNode(true);
   clone.classList.add('v194T5Generated','v194T5Ayah');clone.id='ta-2-'+verse;
   clone.setAttribute('data-t5-s','2');clone.setAttribute('data-t5-a',String(verse));
   clone.setAttribute('data-t2ayah',String(verse));clone.setAttribute('data-t5-type','basair');
   clone.querySelector('.v194T2Qrow').textContent='الآية '+verse;
   clone.querySelector('.b263r3NoteChip').setAttribute('data-r3-note-pos','2:'+verse);
   host.insertBefore(clone,document.getElementById('v194T5Sentinel'));
   return clone;
  },compare(){}};
  document.querySelector('.p144MicButton').addEventListener('click',e=>{TEST.narration=!TEST.narration;TEST.narrationClicks++;e.currentTarget.setAttribute('aria-pressed',String(TEST.narration))});
 });
 await page.addStyleTag({content:p130css});await page.addStyleTag({content:p163css});await page.addStyleTag({content:p166css});
 await page.addScriptTag({content:p130});await page.addScriptTag({content:p163});await page.addScriptTag({content:p166});
 await page.waitForFunction(()=>!!window.__BASAIR_TAFSIR_P130__&&!!window.__BASAIR_TAFSIR_P166_SINGLE_OWNER__&&document.querySelectorAll('[data-p125-follow]').length===1);
 assert.equal(await page.locator('.basairB231AyahActions button:visible').count(),4);
 assert.equal(await page.locator('button.bq166Voice:visible').count(),1);
 assert.equal(await page.locator('.p146TopMic:visible').count(),0);
 assert.equal(await page.locator('.bq163NoteChip:visible').count(),1);
 await page.locator('.bq166Voice').click();assert.equal(await page.evaluate(()=>TEST.narrationClicks),1);
 // Must not mutate Tafsir body during active speech.
 await page.evaluate(()=>{const body=document.querySelector('.v194T2Body');TEST.mutations=0;new MutationObserver(m=>{TEST.mutations+=m.filter(x=>x.type==='childList'||x.type==='characterData').length}).observe(body,{childList:true,characterData:true,subtree:true})});
 for(let i=0;i<10;i++)await page.evaluate(()=>window.__BASAIR_TAFSIR_P166_SINGLE_OWNER__.refresh());
 await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>TEST.mutations),0);
 await page.locator('.bq166Voice').click();assert.equal(await page.evaluate(()=>TEST.narration),false);
 const follow=page.locator('button[data-p125-follow]');
 await follow.click();await page.waitForTimeout(120);
 assert.equal(await page.evaluate(()=>TEST.running),true,'P130 must start Follow');
 assert.equal(await page.locator('#tafsirReader').getAttribute('data-basair-main-tab'),'p128-follow');
 // A real touch gesture while Follow is still running must NEVER manually append verses.
 await page.evaluate(()=>{
  const el=document.querySelector('.v194T2Body'),t=new Touch({identifier:6,target:el,clientX:170,clientY:650});
  const end=new Touch({identifier:6,target:el,clientX:169,clientY:370});
  el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[t],targetTouches:[t],changedTouches:[t]}));
  el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[],targetTouches:[],changedTouches:[end]}));
 });
 await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>TEST.next),0,'Manual load during automatic Follow is forbidden');

 await follow.click();await page.waitForTimeout(120);
 assert.equal(await page.evaluate(()=>TEST.running),false,'P168/P130 must stop Follow');
 assert.equal(await page.locator('#tafsirReader').getAttribute('data-basair-main-tab'),'p129-manual');
 await page.locator('.bq163NoteChip').click();assert.deepEqual(await page.evaluate(()=>TEST.notes),['2:1']);
 // User-scroll after Follow stop: actual P130's manual gate decides if next verse is due.
 // Regression: Android may report a touchend without ANY scroll/wheel event at the bottom.
 const swipe=async(id,dy)=>page.evaluate(({id,dy})=>{
  const el=document.querySelector('.v194T2Body'),start=new Touch({identifier:id,target:el,clientX:165,clientY:650});
  const end=new Touch({identifier:id,target:el,clientX:165,clientY:650-dy});
  el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[start],targetTouches:[start],changedTouches:[start]}));
  el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[],targetTouches:[],changedTouches:[end]}));
 },{id,dy});
 await page.locator('#tafsirReader').evaluate(el=>{el.scrollTop=el.scrollHeight});
 await swipe(30,0); await page.waitForTimeout(220);
 assert.equal(await page.evaluate(()=>TEST.next),0,'Tapping must not append an ayah');
 await swipe(31,210);
 await page.waitForTimeout(850);
 const count=await page.evaluate(()=>TEST.next);
 assert.equal(count,1,'P168 MUST append exactly one verse after a genuine upward touchend with no scroll event');
 assert.equal(await page.locator('.v194T2Ayah').count(),2);
 // Repeated swipes before approaching the next verse tail cannot append a duplicate.
 await swipe(32,210);
 await page.waitForTimeout(250);
 const keys=await page.locator('.v194T2Ayah').evaluateAll(rows=>rows.map(r=>r.getAttribute('data-t5-a')));
 assert.equal(new Set(keys).size,keys.length,'No duplicated verse DOM nodes');
 assert.ok(await page.evaluate(()=>TEST.next)<=2,'No excessive next-verse requests for repeated swipe');
 assert.deepEqual(errors,[],'JavaScript errors');
 console.log(JSON.stringify({width,status:'PASS',originalP130Stop:true,manualMode:'p129-manual',singleNarrator:true,lowerNote:true,allFourActions:true,postStopFeedRequests:count,androidTouchEndWithoutScroll:true,errors:0}));
 await page.close();
 }
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
