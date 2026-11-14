#!/usr/bin/env node
'use strict';
const path=require('node:path'), assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright-core');
(async()=>{
 const bin=process.env.CHROME_BIN||'/usr/bin/google-chrome';
 const browser=await chromium.launch({executablePath:bin,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-background-networking']});
 let page;
 try{
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1.25});
  page=await context.newPage();
  const warnings=[];
  page.on('pageerror',e=>warnings.push(e.message));
  const file=pathToFileURL(path.join(__dirname,'p148-lesson-note-browser.html')).href;
  await page.goto(file,{waitUntil:'domcontentloaded',timeout:18000});
  await page.waitForFunction(()=>{
    const el=document.getElementById('p148qa');
    return el&& (el.textContent.trim().startsWith('{')||el.textContent.startsWith('ERROR'));
  },null,{timeout:12000});
  const raw=await page.locator('#p148qa').textContent();
  assert.ok(raw.startsWith('{'),'browser returned error: '+raw.slice(0,1300));
  const data=JSON.parse(raw);
  assert.equal(data.pass,true,'P148 browser visual+behavior regression: '+JSON.stringify(data));
  assert.equal(data.gridRestored,true);
  assert.equal(data.movedBack,true);
  assert.equal(data.dayRestored,true);
  assert.equal(data.nightTextReadable,true);
  assert.equal(data.noteCount,1);
  const screenshot=path.join(process.cwd(),'p148-playwright-screen.png');
  await page.screenshot({path:screenshot,fullPage:true});
  console.log(JSON.stringify({status:'PASS',engine:'Chrome/Playwright',scale:'125%',qa:data,warnings,screenshot},null,2));
 }catch(error){
  if(page){console.error('P148 diagnostic',JSON.stringify({htmlHead:(await page.content().catch(()=>'' )).slice(0,900),result:await page.locator('#p148qa').textContent().catch(()=>null)}));}
  throw error;
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exit(1)});
