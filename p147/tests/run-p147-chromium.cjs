#!/usr/bin/env node
'use strict';
// Run: node p147/tests/run-p147-chromium.cjs
// Requires local Chromium/Chrome; no network, no Android, no signed OTA.
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const fixture=path.join(__dirname,'p147-notes-reading-browser.html');
const executables=[process.env.CHROMIUM_BIN,process.env.CHROME_BIN,
 'chromium','chromium-browser','google-chrome','google-chrome-stable'].filter(Boolean);
let chrome=null;
for(const name of executables){
 const x=cp.spawnSync(name,['--version'],{encoding:'utf8',timeout:7000});
 if(!x.error&&x.status===0){chrome=name;break}
}
if(!chrome){console.error('SKIP: Chromium or Chrome not found. Install headless Chrome before browser acceptance.');process.exit(2)}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'basair-p147-qa-'));
try{
 const args=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--allow-file-access-from-files','--no-first-run','--no-default-browser-check',
  '--disable-background-networking','--window-size=412,915',
  '--force-device-scale-factor=1.25','--virtual-time-budget=7000',
  '--user-data-dir='+path.join(tmp,'profile'),'--dump-dom',
  pathToFileURL(fixture).toString()];
 const child=cp.spawnSync(chrome,args,{encoding:'utf8',timeout:25000,
  maxBuffer:6*1024*1024});
 assert.equal(child.status,0,'Chromium failed: '+(child.stderr||'').slice(-1300));
 const match=child.stdout.match(/<pre[^>]*id="result"[^>]*>([\s\S]*?)<\/pre>/i);
 assert.ok(match,'No browser result from P147 fixture');
 const unescape=x=>x.replace(/&quot;/g,'"').replace(/&amp;/g,'&')
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 const raw=unescape(match[1]).trim();
 assert.ok(raw.startsWith('{'),'Browser fixture failed: '+raw.slice(0,900));
 const data=JSON.parse(raw);
 assert.equal(data.pass,true,'Chrome UI assertions failed: '+JSON.stringify(data));
 assert.equal(data.gridRestoredAfterLegacyStyle,true,'Legacy style collision not repaired');
 assert.equal(data.noteStillActiveAfterMutation,true,'Original note not clickable after style reset');
 assert.equal(data.duplicateStillInert,true,'Stale duplicate returned');
 assert.equal(data.htmlNight,true,'Night mode not recognized on <html>');
 assert.equal(data.restoresDay,true,'Switch back to day failed');
 assert.equal(data.highContrast,true,'Night header contrast missing');
 assert.equal(data.prose,true,'Intro/Thread text size not corrected');
 assert.equal(data.listenerPreserved,true,'Original note click handler lost');
 const output={status:'PASS',browser:chrome,fixture:path.relative(root,fixture),
  noteStable:data.noteStillActiveAfterMutation,
  fiveColumns:data.gridRestoredAfterLegacyStyle,
  nightRecognized:data.htmlNight,dayRestored:data.restoresDay,
  readingTypography:data.prose,realAndroid:'NOT TESTED'};
 console.log(JSON.stringify(output,null,2));
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
