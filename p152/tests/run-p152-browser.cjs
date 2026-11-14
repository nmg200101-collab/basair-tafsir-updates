#!/usr/bin/env node
'use strict';
// Execute after checkout: node p152/tests/run-p152-browser.cjs
// Tests the actual OTA JS/CSS on a 125%-scale headless Chromium viewport.
const cp=require('node:child_process'),os=require('node:os'),fs=require('node:fs'),
 path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
let bin;
for(const c of [process.env.CHROME_BIN,process.env.CHROMIUM_BIN,
 'chromium','chromium-browser','google-chrome'].filter(Boolean)){
 const x=cp.spawnSync(c,['--version'],{encoding:'utf8',timeout:6000});
 if(x.status===0&&!x.error){bin=c;break}
}
if(!bin){console.error('SKIP: Chromium not installed, not a PASS');process.exit(2)}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'basair-p152-test-'));
try{
 const uri=pathToFileURL(path.join(__dirname,'p152-main-saved-browser.html')).href;
 const proc=cp.spawnSync(bin,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--allow-file-access-from-files','--no-first-run','--disable-background-networking',
  '--window-size=412,915','--force-device-scale-factor=1.25',
  '--virtual-time-budget=5000','--user-data-dir='+path.join(tmp,'profile'),
  '--dump-dom',uri],{encoding:'utf8',timeout:26000,maxBuffer:6*1024*1024});
 assert.equal(proc.status,0,'Chromium error: '+String(proc.stderr).slice(-1000));
 const m=proc.stdout.match(/<pre[^>]*id="qa"[^>]*>([\s\S]*?)<\/pre>/i);
 assert.ok(m,'QA result missing');
 const raw=m[1].replace(/&quot;/g,'"').replace(/&lt;/g,'<')
  .replace(/&gt;/g,'>').replace(/&amp;/g,'&').trim();
 assert.ok(raw.startsWith('{'),'Browser error: '+raw.slice(0,1000));
 const data=JSON.parse(raw);
 assert.equal(data.pass,true,'P152 integration failed: '+JSON.stringify(data));
 console.log(JSON.stringify({status:'PASS',browser:bin,zoom:'125%',results:data},null,2));
}finally{fs.rmSync(tmp,{force:true,recursive:true})}
