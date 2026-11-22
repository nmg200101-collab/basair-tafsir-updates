/* P216 contract tests — no WebView/Android claims. */
(function(root){
'use strict';
root.__BASAIR_P216_CENTER_TESTS__=async function(source,style){
 var pass=0,fail=[],events={},installs=0,checks=0,restores=0,reloads=0,
     accepted=true,automatic=false,restoreResult=true;
 function ck(label,value){if(value)pass++;else fail.push(label);}
 function N(tag){
   this.tagName=tag.toUpperCase();this.children=[];this.parentNode=null;
   this.id='';this.className='';this.attrs={};this.listeners={};this._text='';
   this.hidden=false;this.disabled=false;this.classes=new Set();
   this.classList={add:(x)=>this.classes.add(x),remove:(x)=>this.classes.delete(x),
     contains:(x)=>this.classes.has(x)};
 }
 Object.defineProperty(N.prototype,'textContent',{get:function(){
   return this._text+this.children.map(x=>x.textContent).join('');
 },set:function(v){this._text=String(v);this.children=[]}});
 N.prototype.appendChild=function(n){n.parentNode=this;this.children.push(n);return n};
 N.prototype.removeChild=function(n){this.children=this.children.filter(x=>x!==n);n.parentNode=null};
 N.prototype.insertBefore=function(n,before){n.parentNode=this;var i=this.children.indexOf(before);
   if(i<0)this.children.push(n);else this.children.splice(i,0,n);return n};
 N.prototype.replaceChildren=function(){this.children.forEach(x=>x.parentNode=null);this.children=[];this._text=''};
 N.prototype.contains=function(n){for(var p=n;p;p=p.parentNode)if(p===this)return true;return false};
 N.prototype.setAttribute=function(k,v){this.attrs[k]=String(v)};
 N.prototype.getAttribute=function(k){return this.attrs[k]||null};
 N.prototype.removeAttribute=function(k){delete this.attrs[k]};
 N.prototype.addEventListener=function(k,f){(this.listeners[k]||(this.listeners[k]=[])).push(f)};
 N.prototype.find=function(match){if(match(this))return this;for(var n of this.children){var x=n.find(match);if(x)return x}return null};
 N.prototype.findAll=function(match){return (match(this)?[this]:[]).concat(...this.children.map(n=>n.findAll(match)))};
 N.prototype.querySelector=function(s){
   var className=s.startsWith('.')?s.slice(1):null, tag=!className?s.toUpperCase():null;
   return this.find(n=>n!==this&&(className?n.className.split(/\s+/).includes(className):n.tagName===tag));
 };
 N.prototype.closest=function(s){return null};
 N.prototype.click=function(){if(this.disabled)return;
   (this.listeners.click||[]).forEach(f=>f({preventDefault:()=>{},stopPropagation:()=>{},stopImmediatePropagation:()=>{}}))};
 var body=new N('body'),dialog=new N('section'),p=new N('div'),actions=new N('div');
 dialog.id='basairUniversalP121Dialog';p.className='bu-p121-panel';actions.className='bu-p121-actions';
 dialog.appendChild(p);p.appendChild(actions);body.appendChild(dialog);
 // The old P207 card may exist before P216 or be inserted later.
 var more=new N('div'),grid=new N('div'),legacy=new N('button');
 more.id='bqMoreCenter';grid.className='bq-more-grid';legacy.id='p207OwnerUpdatesInMore';
 grid.appendChild(legacy);more.appendChild(grid);body.appendChild(more);
 var doc={body,readyState:'loading',hidden:false,events,
   createElement:function(t){return new N(t)},
   getElementById:function(id){return body.find(n=>n.id===id)},
   addEventListener:function(event,fn){events[event]=fn}};
 var manifest=(seq,mode)=>({schema:'basair-universal-ota-v1',channel:'owner-qa',
   applicationId:'app.basair.qurv2',sequence:seq,id:'P216-SEQ'+seq,
   title:'تحديث موقّع',issuedAt:'2026-11-22T12:00:00Z',changeSummary:['إصلاح التحديثات'],
   deliveryMode:mode,modules:[{id:'updates',version:208}]});
 var release=manifest(130,'notify');
 var state={active:{tilawa:{version:243},updates:{version:207}},highestSequence:126,trial:null};
 var archives=[{sequence:124,id:'P214',title:'متابعة الخطوط الآلية',approved:true},
   {sequence:122,id:'P213',title:'تجربة سابقة',approved:false}];
 var ota={open:function(){dialog.hidden=false},
   check:async function(){checks++;return accepted?{
     envelope:{payload:'signed',signature:'cryptographic-verifier-only'},
     manifest:release,changes:release.modules,newer:true}:{
     envelope:null,manifest:release,newer:true};},
   install:async function(c){installs++;if(c.manifest.sequence!==release.sequence)throw Error('invalid payload');
     state.highestSequence=c.manifest.sequence;state.active.updates.version=208;return true}};
 var hist={list:async()=>archives,restore:async function(seq){restores++;if(seq!==124)throw Error('bad seq');return restoreResult;}};
 var w={BasairUniversalOTA:ota,__BASAIR_P206_SIGNED_ARCHIVE__:hist,
   __BASAIR_P207_ACTIVATION__:{read:async()=>state},
   setTimeout:function(){},location:{reload:function(){reloads++}}};
 new Function('window','document',source)(w,doc);
 var ui=w.__BASAIR_P216_UPDATE_CENTER__;
 if(typeof events.DOMContentLoaded==='function')events.DOMContentLoaded();
 ck('one P216 card staged beside hidden P207',grid.findAll(n=>n.id==='p216MoreUpdates').length===1&&
   more.getAttribute('data-p216-menu')==='1'&&style.includes('#p207OwnerUpdatesInMore'));
 ck('registered without native changes',ui&&ui.version===216&&installs===0&&checks===0&&restores===0);
 ck('no OTA install at boot',installs===0);
 ck('open uses P121 dialog',ui.open()===true&&!!doc.getElementById('p216UpdateCenter'));
 await Promise.resolve();await Promise.resolve();await Promise.resolve();
 // Race-independent: explicit check once any opening check finished.
 var signed=await ui.refresh();
 ck('native verified release retrieved',!!signed||ui.status().remoteSequence===130);
 ck('local sequence read from phone',ui.status().localSequence===126);
 ck('no auto-download on signed notify',installs===0);
 ck('latest release details visible',doc.getElementById('p216UpdateCenter').textContent.includes('Seq130'));
 var didInstall=await ui.install();
 ck('manual P121 install returns success',didInstall===true&&installs===1);
 ck('no automatic reload after download',reloads===0);
 ck('install advances recorded local sequence',ui.status().localSequence===130);
 // New release, auto mode: never manually start a second install.
 release=manifest(131,'automatic');
 await ui.refresh();
 ck('automatic signed release refuses manual double install',await ui.install()===false&&installs===1);
 // A newer release cannot be installed unless it is re-checked as the same signed sequence.
 release=manifest(132,'notify');
 await ui.refresh();release=manifest(133,'notify');
 ck('manifest change between display and click is refused',await ui.install()===false&&installs===1);
 ck('stale candidate error is visible',ui.status().error.indexOf('تغير إصدار الخادم')>=0);
 // Archive list displays non-approved history without offering restore for it.
 await ui.loadArchive();
 var center=doc.getElementById('p216UpdateCenter');
 ck('no restore without explicit confirmation',await ui.restore(124)===false&&restores===0);
 // Open restore tab as a real button, then choose approved snapshot, confirm twice.
 var t=center.find(n=>n.tagName==='BUTTON'&&n.textContent==='الرجوع');
 ck('restore tab exists',!!t);t.click();await ui.loadArchive();
 center=doc.getElementById('p216UpdateCenter');
 var selectors=center.findAll(n=>n.tagName==='BUTTON'&&n.textContent==='اختيار الإصدار');
 ck('only approved snapshot can be selected',selectors.length===1);
 selectors[0].click();
 center=doc.getElementById('p216UpdateCenter');
 var preview=center.find(n=>n.tagName==='BUTTON'&&n.textContent==='متابعة إلى التأكيد');
 ck('confirm preview requires first click',!!preview&&restores===0);preview.click();
 center=doc.getElementById('p216UpdateCenter');
 var confirm=center.find(n=>n.tagName==='BUTTON'&&n.textContent==='تأكيد الرجوع الآن');
 ck('final approval button is separate',!!confirm&&restores===0);confirm.click();
 await Promise.resolve();await Promise.resolve();await Promise.resolve();
 ck('restore delegates only to verified P206',restores===1);
 ck('restore does not reload without direct action',reloads===0);
 // Disable is reversible and must not touch the native update engine.
 var old=ota.install;
 ck('disable center preserves native engine',ui.disable()===true&&ota.install===old);
 ck('disabling removes own entry and restores old More',!more.getAttribute('data-p216-menu')&&
   grid.findAll(n=>n.id==='p216MoreUpdates').length===0);
 ck('disabling hides center and leaves native modal available',doc.getElementById('p216UpdateCenter').hidden===true);
 ck('safe disable rejects further actions',await ui.install()===false&&installs===1);
 ck('night and RTL declarations present',style.includes('body.dark #p216UpdateCenter')&&
   style.includes('direction:rtl'));
 return {passed:pass,failed:fail.length,errors:fail,checks:checks,
   installs:installs,restores:restores,reloads:reloads,
   limit:'Isolated DOM/API contracts; no real Android/WebView acceptance'};
 };
})(typeof window!=='undefined'?window:globalThis);
