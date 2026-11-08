// P96.8 QA028: exercise actual proposed callbacks in a safe synthetic WebView model.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const dir=dirname(fileURLToPath(import.meta.url));
const read=n=>readFileSync(join(dir,n));
const old=read('p964-ayah-meaning.js').toString('utf8');
const next=read('p968-native-gesture-preview.js').toString('utf8');
const oldCSS=read('p964-ayah-meaning.css').toString('utf8');
const css=read('p968-native-gesture-preview.css').toString('utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
const live=JSON.parse(read('release.json').toString('utf8'));
const p27=JSON.parse(Buffer.from(live.payload,'base64').toString('utf8'));
assert.equal(p27.sequence,27,'QA027 must stay live during QA028 prep');
assert.equal(p27.id,'P96-RESTORE-QA024-OWNER-027');
assert.equal(p27.assets.length,8);
assert.ok(next.startsWith(old.slice(0,400)),'QA024 core retained');
assert.ok(css.startsWith(oldCSS),'QA024 font/page/style base unchanged');
assert.ok(next.includes('function exitMeaning()'),'QA024 word-meaning cleanup must stay intact');
assert.ok(next.includes('function p968ShowPreview(ayah)'),'QA028 exact image-ayah preview');
assert.ok(next.includes('p968NativeConfirmed')&&next.includes('p968DuplicateSkipped'));
assert.ok(next.includes('counts.p968OverlayScrollPrevented'),'no double overlay scroll');
assert.ok(!next.includes('if(!scrollSelected(node))'),'the competing QA024 smooth scroll must be removed');
assert.ok(!css.includes('@font-face'),'no introduced font');
assert.ok(!css.slice(oldCSS.length).includes('transform:'),'preview must not change page geometry');
assert.ok(!css.slice(oldCSS.length).includes('position:'),'preview must not change positioning');
assert.match(css, /\.ayahHit\.bq968-selected-ayah/);
const replacements=['p968-native-gesture-preview.js','p968-native-gesture-preview.css'];
for(const name of replacements)console.log('ASSET',name,read(name).length,sha(read(name)));
for(const a of p27.assets){
 const content=read(a.path);
 assert.equal(content.length,a.size,'QA027 baseline byte size '+a.path);
 assert.equal(sha(content),a.sha256,'QA027 baseline SHA256 '+a.path);
}
function extract(source,name){
 const token='function '+name+'(';const p=source.indexOf(token);
 assert.ok(p>=0,'missing '+name);
 const begin=source.indexOf('{',p);let depth=0,end=-1,quote='',escaped=false;
 for(let i=begin;i<source.length;i++){
  const c=source[i];
  if(quote){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote)quote='';continue}
  if(c==="'"||c==='"'||c.charCodeAt(0)===96){quote=c;continue}
  if(c==='{')depth++;else if(c==='}'){depth--;if(depth===0){end=i+1;break}}
 }
 assert.ok(end>begin,'unterminated function '+name);
 return source.slice(p,end);
}
function classes(){const set=new Set();return{add:n=>set.add(n),remove:n=>set.delete(n),contains:n=>set.has(n)}}
function mockGesture(native){
 const accepted=[],stats={},w={selectedSurah:2,selectedTilawaAyah:1};
 const hit={isConnected:true,classList:classes(),getAttribute:name=>({'data-s':'2','data-selectayah':'255','data-g':'290'})[name],
  getBoundingClientRect:()=>({left:20,right:90,top:105,bottom:138})};
 const shell={getAttribute:name=>name==='data-r33-print-page'?'3':'',
  getBoundingClientRect:()=>({left:0,right:360,top:70,bottom:900}),querySelectorAll:q=>q==='.ayahHit'?[hit]:[]};
 const st={running:true,mode:'audio',paused:false,printRetargets:0,page:3,scaleMode:'normal'};
 const engine={retargetPrintAyah(t){st.printRetargets++;w.selectedSurah=t.s;w.selectedTilawaAyah=t.a;return true}};
 const host={querySelectorAll:q=>q==='.r33PrintShell'?[shell]:[]};
 w.__BASAIR_P964_AYAH_MEANING__={accept:(ayah,node)=>{accepted.push({ayah,node});return true}};
 const env={w,stats,Date,Number,Math,isFinite,E:()=>host,activeAudio:()=>true,isPrinted:()=>true,
   state:()=>st,page:()=>3,c:()=>engine,targetAt:()=>({page:3,s:2,a:255,g:290,progress:.44}),
   showResume:()=>{throw Error('Unexpected resume warning')},p968Gesture:null};
 const names=['p968Point','p968HitAt','p968Start','p968End','retargetClick'];
 const funcs=names.map(n=>extract(next,n)).join('\n');
 const methods=vm.runInNewContext('(function(){'+funcs+';return {p968Start,p968End,retargetClick};})()',env,{timeout:1000});
 const ev={clientX:50,clientY:120,detail:1,preventDefault(){},stopImmediatePropagation(){},stopPropagation(){}};
 methods.p968Start(ev);
 if(native)engine.retargetPrintAyah({page:3,s:2,a:255});
 methods.p968End(ev);
 methods.retargetClick(ev);
 return {st,stats,accepted};
}
const handled=mockGesture(true);
assert.equal(handled.st.printRetargets,1,'native pointerup followed by synthetic click must retarget ONCE');
assert.equal(handled.stats.p968NativeConfirmed,1,'native acknowledgement observed');
assert.equal(handled.stats.p968DuplicateSkipped,1,'suppress only duplicate click');
assert.equal(handled.accepted.length,1,'accepted original ayah once');
const fallback=mockGesture(false);
assert.equal(fallback.st.printRetargets,1,'click-only fallback still selects once');
assert.equal(fallback.accepted.length,1,'click-only selection callback');
const previewCounts={},previewHit={classList:classes()},previewCard={
 querySelectorAll:()=>[previewHit],querySelector:()=>null
};
const previewHost={querySelector:q=>q.includes('.r33PrintShell')?previewCard:null};
const previewEnv={w:{},d:{},reader:()=>true,E:()=>previewHost,counts:previewCounts,Date,Number,
 p968Preview:null,p968Marks:[],Array};
const previewFuncs=['p968ClearPreview','p968ShowPreview'].map(x=>extract(next,x)).join('\n');
const preview=vm.runInNewContext('(function(){'+previewFuncs+';return {show:p968ShowPreview,clear:p968ClearPreview};})()',previewEnv,{timeout:1000});
assert.equal(preview.show({page:3,s:2,a:255}),true,'printed ayah preview starts');
assert.equal(previewHit.classList.contains('bq968-selected-ayah'),true,'real hit marker is added');
preview.clear();
assert.equal(previewHit.classList.contains('bq968-selected-ayah'),false,'preview cleanup removes marker');
assert.ok(!extract(next,'accept').includes('scrollTo('),'no direct overlay scroll in accept');
assert.ok(!extract(next,'p968End').includes('retargetPrintAyah'),'owner native engine only');
console.log('PASS P96.8 QA028: QA027 baseline SHA256 8/8, preserved meaning, native single retarget, click fallback, real image ayah preview, no overlay scroll or font modification.');
