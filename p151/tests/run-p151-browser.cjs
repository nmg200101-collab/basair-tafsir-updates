#!/usr/bin/env node
'use strict';
// Run after checking out PR's branch: node p151/tests/run-p151-browser.cjs
// Executes the actual P151 Javascript + CSS in a real Chromium browser.
const cp=require('node:child_process'),path=require('node:path'),os=require('node:os'),
 fs=require('node:fs'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
let browser;
for(const executable of [process.env.CHROME_BIN,process.env.CHROMIUM_BIN,
 'chromium','chromium-browser','google-chrome'].filter(Boolean)){
 const test=cp.spawnSync(executable,['--version'],{encoding:'utf8',timeout:6000});
 if(test.status===0&&!test.error){browser=executable;break}
}
if(!browser){console.error('SKIP — Chromium unavailable; not a PASS');process.exit(2)}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'basair-p151-browser-'));
try{
 const fixture=path.join(__dirname,'p151-notes-index-browser.html');
 const argv=['--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-gpu','--allow-file-access-from-files','--no-first-run',
  '--disable-background-networking','--window-size=412,900',
  '--force-device-scale-factor=1.25','--virtual-time-budget=6000',
  '--user-data-dir='+path.join(tmp,'chrome'), '--dump-dom',pathToFileURL(fixture).href];
 const run=cp.spawnSync(browser,argv,{encoding:'utf8',timeout:30000,maxBuffer:6*1024*1024});
 assert.equal(run.status,0,'Chromium failed: '+String(run.stderr).slice(-800));
 const res=run.stdout.match(/<pre[^>]*id="qa"[^>]*>([\s\S]*?)<\/pre>/i);
 assert.ok(res,'P151 QA result missing from browser DOM');
 const escaped=res[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&')
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
 assert.ok(escaped.startsWith('{'),'P151 fixture failed: '+escaped.slice(0,1000));
 const data=JSON.parse(escaped);
 assert.equal(data.pass,true,'P151 index/editor regression: '+JSON.stringify(data));
 console.log(JSON.stringify({status:'PASS',browser,zoom:'125%',checks:data},null,2));
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
