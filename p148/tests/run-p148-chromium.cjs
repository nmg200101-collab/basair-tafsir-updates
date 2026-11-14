#!/usr/bin/env node
'use strict';
// Run on a checked-out repository: node p148/tests/run-p148-chromium.cjs
// Headless Chrome checks real V695 classes, RTL card typography, night/day,
// note relocation, old four-column collision, and click-handler retention.
const cp=require('node:child_process'),fs=require('node:fs'),
 os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const sources=[process.env.CHROME_BIN,process.env.CHROMIUM_BIN,
 'chromium','chromium-browser','google-chrome','google-chrome-stable'].filter(Boolean);
let chrome;
for(const exe of sources){
 const v=cp.spawnSync(exe,['--version'],{encoding:'utf8',timeout:6000});
 if(v.status===0&&!v.error){chrome=exe;break}
}
if(!chrome){console.error('SKIP: Chromium is not installed; browser verification is NOT a PASS.');process.exit(2)}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'basair-p148-'));
try{
 const file=path.join(__dirname,'p148-lesson-note-browser.html');
 const args=['--headless=new','--no-sandbox','--disable-gpu',
 '--disable-dev-shm-usage','--allow-file-access-from-files','--no-first-run',
 '--disable-background-networking','--window-size=412,915',
 '--force-device-scale-factor=1.25','--virtual-time-budget=5000',
 '--user-data-dir='+path.join(tmp,'user'), '--dump-dom',pathToFileURL(file).href];
 const p=cp.spawnSync(chrome,args,{encoding:'utf8',timeout:28000,maxBuffer:6*1024*1024});
 assert.equal(p.status,0,'browser failed: '+String(p.stderr||'').slice(-1200));
 const m=p.stdout.match(/<pre[^>]*id="p148qa"[^>]*>([\s\S]*?)<\/pre>/i);
 assert.ok(m,'P148 result element missing');
 const raw=m[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&')
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
 assert.ok(raw.startsWith('{'),'P148 browser script failed: '+raw.slice(0,900));
 const data=JSON.parse(raw);
 assert.equal(data.pass,true,'P148 visual/behavior regression: '+JSON.stringify(data));
 assert.equal(data.gridRestored,true);
 assert.equal(data.movedBack,true);
 assert.equal(data.nightTextReadable,true);
 assert.equal(data.dayRestored,true);
 assert.equal(data.noteCount,1);
 console.log(JSON.stringify({status:'PASS',browser:chrome,scale:'125%',qa:data},null,2));
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
