'use strict';
/* P137 Mocked auto-next acceptance. Real Android scrolling/voice requires owner QA. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../p121/owner-qa/modules/tafsir/p142-natiq.js'),'utf8');
const text=s=>({nodeType:3,nodeValue:s,nextSibling:null});
function body(value){
 const child=text(value);return {
  nodeType:1,tagName:'DIV',className:'',firstChild:child,
  hasAttribute:()=>false,getAttribute:()=>null,matches:()=>false,
  contains:()=>false
 };
}
function row(ayah){
 const b=body('شرح هذه الآية مع فوائدها للمسلم.');
 return {nodeType:1,isConnected:true,className:'v194T2Ayah',
  getAttribute:k=>k==='data-t2ayah'?String(ayah):k==='data-t5-s'?'1':k==='data-t5-type'?'basair':null,
  querySelector:q=>q==='.v194T2Body'?b:null,body:b};
}
const rows=[row(1),row(2)],state={s:1,a:1,type:'basair'};
let activeRow=rows[0],played=[],pending=[],mutations=[],stopCalls=0;
const host={
 querySelectorAll:()=>[],
 querySelector:q=>q.includes('.v194T2Ayah')?activeRow:null
};
const step={state:()=>({...state}),open:(s,a,type)=>{
 assert.equal(s,1);assert.equal(a,2);assert.equal(type,'basair');
 state.a=a;rows[0].isConnected=false;activeRow=rows[1];
 // Emulate the real DOM mutation which previously aborted narrator auto-next.
 for(const callback of mutations)callback([{type:'childList',target:rows[0].body,addedNodes:[],removedNodes:[]}]);
}};
const rdr={classList:{contains:k=>k==='active'}};
const d={readyState:'complete',hidden:false,
 body:{appendChild(){}},
 getElementById:k=>k==='tafsirReader'?rdr:k==='tafsirAyahs'?host:null,
 createElement:k=>({id:'',hidden:false,setAttribute(){},getAttribute(){return null},querySelector(){return null},addEventListener(){},appendChild(){}}),
 addEventListener(){},querySelectorAll(){return []}
};
const w={
 __BASAIR_TAFSIR_CORE__:{q:[{count:2,ayahs:[{},{}]}],toast(){}},
 __BASAIR_TAFSIR_STEP2__:step,
 __BASAIR_TAFSIR_AYAH_RECITER_BRIDGE__:{
  selected:id=>({id:id==='follow'?'husary':id,name:'القارئ'}),
  availability:()=>({available:true}),
  playOne:request=>{
   let resolve;const ended=new Promise(r=>resolve=r),handle={...request,verified:true,ended,
    stop(){stopCalls++;resolve(false)},complete(){resolve(true)}};
   played.push(handle);return handle;
  },
  list:()=>[{id:'husary',name:'الحصري'}],
  diagnostics:()=>({exactAyahCatalogAvailable:true})
 },
 localStorage:{getItem:()=>JSON.stringify({mode:'recitation',reciterId:'husary',autoNext:true}),setItem(){}},
 setTimeout,clearTimeout,addEventListener(){},
 MutationObserver:function(cb){mutations.push(cb);this.observe=function(){};this.disconnect=function(){}}
};
new Function('window','document',src)(w,d);
const api=w.__BASAIR_TAFSIR_NATIQ_P132__;
async function check(){
 assert.equal(api.status().options.autoNext,true);
 assert.equal(api.start(rows[0]),true);
 assert.equal(played.length,1);
 played[0].complete();
 await new Promise(r=>setTimeout(r,40));
 assert.equal(played.length,2,'auto next must play second ayah after first');
 assert.equal(played[1].ayah,2);
 assert.equal(api.status().stats.nextTransitions,1);
 assert.equal(api.status().running,true,'expected DOM mutation cannot stop narrator transition');
 api.stop();
 assert.ok(stopCalls>=1);
 console.log(JSON.stringify({pass:5,total:5,ayahsPlayed:2,tilawaMutations:0,handset:'NOT TESTED'}));
}
check().catch(e=>{console.error(e);process.exitCode=1});
