/* P216 model + native-API integration mock: staged only, not Android E2E.
 * Call __BASAIR_P216_TESTS__(modelSource,centerSource).
 */
(function(root){
'use strict';
root.__BASAIR_P216_TESTS__=async function(modelSource,centerSource){
 var passed=0,failed=[],events={},timers=[],checks=0,installs=0,restores=0,reloads=0;
 function ck(name,ok){if(ok)passed++;else failed.push(name)}
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.parentNode=null;
   this.id='';this._classes=new Set();this.hidden=false;this._text='';this.handlers={};this.attributes={};
   this.classList={add:(v)=>this._classes.add(v),remove:(v)=>this._classes.delete(v),contains:(v)=>this._classes.has(v)};}
  set className(v){this._classes=new Set(String(v).split(/\s+/).filter(Boolean))}
  get className(){return [...this._classes].join(' ')}
  set textContent(x){this._text=String(x);this.children=[]}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('')}
  setAttribute(k,v){this.attributes[k]=String(v)}
  getAttribute(k){return this.attributes[k]??null}
  appendChild(ch){this.children.push(ch);ch.parentNode=this;return ch}
  replaceChildren(...xs){this.children=[];xs.forEach(x=>this.appendChild(x))}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null}
  contains(x){return this===x||this.children.some(c=>c.contains(x))}
  addEventListener(k,fn){(this.handlers[k]??=[]).push(fn)}
  click(){for(const h of(this.handlers.click||[]))h({target:this,preventDefault(){},stopPropagation(){}})}
  querySelector(q){const c=q.startsWith('#')?(x)=>x.id===q.slice(1):
    q.startsWith('.')?(x)=>x.classList.contains(q.slice(1)):null;
   if(!c)return null;const seek=(x)=>{for(const kid of x.children){if(c(kid))return kid;const y=seek(kid);if(y)return y;}return null};return seek(this)}
  closest(q){return null}
 }
 const body=new Element('body'),doc={body,hidden:false,readyState:'loading',listeners:{},
   createElement:(tag)=>new Element(tag),
   addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)},
   getElementById(id){const seek=(x)=>{if(x.id===id)return x;for(const c of x.children){let y=seek(c);if(y)return y}return null};return seek(body)}};
 const more=new Element('section');more.id='bqMoreCenter';more.hidden=true;
 const grid=new Element('div');grid.className='bq-more-grid';
 const old=new Element('button');old.id='p207OwnerUpdatesInMore';grid.appendChild(old);
 more.appendChild(grid);body.appendChild(more);
 const signed={envelope:{payload:'signed-payload',signature:'signed-signature'},manifest:{
   schema:'basair-universal-ota-v1',channel:'owner-qa',applicationId:'app.basair.qurv2',
   sequence:128,id:'P216-SEQ128',title:'واجهة موحدة',issuedAt:'2026-11-22T12:00:00Z',
   deliveryMode:'notify',restartRequired:true,changeSummary:['إشعار موقّع'],
   modules:[{id:'updates',version:208}]},changes:[{id:'updates',version:208}],newer:true};
 const archiveRecord={sequence:124,id:'P214',title:'P214',date:'2026-11-21',approved:true,
   envelope:{payload:'x',signature:'y'},active:{updates:{assets:[{path:'modules/updates/p206-signed-six-rollback.js'}]}}};
 const win={setTimeout(fn){timers.push(fn);return timers.length},location:{reload(){reloads++}},
   MutationObserver:class{observe(){} disconnect(){}},
   BasairUniversalOTA:{check:async()=>{checks++;return signed},install:async(c)=>{installs++;return true},
     open(){},rollback(){throw Error('Native rollback must not be called from P216')}},
   __BASAIR_P207_ACTIVATION__:{read:async()=>({highestSequence:126,active:{tilawa:{version:243}},trial:null})},
   __BASAIR_P206_SIGNED_ARCHIVE__:{list:async()=>[archiveRecord],
     verify:async()=>({sequence:124,modules:[{id:'updates',version:207}]}),
     matches:async()=>true,hasArchiveRuntime:()=>true,
     restore:async(seq)=>{restores++;return seq===124}}};
 new Function('window',modelSource)(win);
 new Function('window','document',centerSource)(win,doc);
 const api=win.__BASAIR_P216_CENTER__;
 ck('registered',!!api&&api.version===216);
 ck('staged boot does not update or restore',installs===0&&restores===0);
 more.hidden=false;
 ck('single entry installed',api.installEntry()===true&&grid.children.filter(x=>x.id==='p216UpdatesEntry').length===1);
 api.installEntry();
 ck('no duplicate entry',grid.children.filter(x=>x.id==='p216UpdatesEntry').length===1);
 ck('native existing menu remains in DOM',grid.contains(old));
 ck('one entry CSS scope ready',body.classList.contains('p216-center-ready'));
 const checked=await api.check();
 ck('signed P121 candidate read',checked?.sequence===128&&checks>=1);
 const banner=doc.getElementById('p216UpdateNotice');
 ck('verified notification shown',!!banner&&banner.textContent.includes('Seq 128'));
 const buttons=()=>{let out=[];const scan=(x)=>{if(x.tagName==='BUTTON')out.push(x);x.children.forEach(scan)};scan(body);return out};
 ck('notification controls enabled AFTER verification',buttons().filter(x=>banner.contains(x)).every(x=>!x.disabled));
 ck('no automatic install from check',installs===0);
 ck('center opens',api.open()===true&&doc.getElementById('p216UpdatesCenter').hidden===false);
 await api.check();await api.history();
 ck('shows local installed not remote as active',doc.getElementById('p216UpdatesCenter').textContent.includes('Seq 126'));
 ck('shows signed remote update separately',doc.getElementById('p216UpdatesCenter').textContent.includes('Seq 128'));
 ck('has history row',doc.getElementById('p216UpdatesCenter').textContent.includes('Seq 124'));
 const download=buttons().find(x=>x.textContent==='تحميل التحديث الموقّع');
 ck('download is an explicit button',!!download&&installs===0);
 if(download){download.click();for(let i=0;i<8;i++)await Promise.resolve()}
 ck('download invokes native signed install only after click',installs===1);
 await api.history();
 const history=buttons().find(x=>x.textContent==='الرجوع لهذا الإصدار');
 ck('archive restore choice is visible',!!history);
 if(history){history.click();for(let i=0;i<3;i++)await Promise.resolve()}
 ck('first restore click only asks confirmation',restores===0&&doc.getElementById('p216UpdatesCenter').textContent.includes('سيتم الرجوع'));
 const confirm=buttons().find(x=>x.textContent==='تأكيد الرجوع إلى هذا الإصدار');
 if(confirm){confirm.click();for(let i=0;i<8;i++)await Promise.resolve()}
 ck('second restore click invokes verified P206',restores===1&&reloads===1);
 ck('never calls native restore implicitly',restores===1);
 return{passed,failed:failed.length,errors:failed,checkCalls:checks,installs,restores};
};
})(typeof window!=='undefined'?window:globalThis);