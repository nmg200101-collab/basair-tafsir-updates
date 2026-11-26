'use strict';
require('../staging/p225-independent-printed-viewport.js');
(async function(api){
 let checks=0; function ok(v,label){if(!v)throw Error(label);checks++}
 class Node{
  constructor(tag){this.tag=tag;this.children=[];this.parentNode=null;this.style={};this.attrs={};this.scrollTop=0;this.clientHeight=500;this.naturalWidth=720;this.naturalHeight=1280}
  setAttribute(k,v){this.attrs[k]=v}
  appendChild(c){if(c.parentNode)throw Error('already mounted');c.parentNode=this;this.children.push(c);return c}
  removeChild(c){if(c.parentNode!==this)throw Error('wrong owner');this.children=this.children.filter(n=>n!==c);c.parentNode=null;return c}
  get scrollHeight(){return this.children.length*1000}
  getBoundingClientRect(){if(this.tag==='section')return {top:100+this.parentNode.children.indexOf(this)*1000-this.parentNode.scrollTop,height:1000};return {top:100,height:500}}
  decode(){return this.src==='fail'?Promise.reject(Error('decode failure')):Promise.resolve()}
 }
 const d={createElement:t=>new Node(t)},digital=new Node('digital'),original=new Node('original'),tajwid=new Node('tajwid');
 const marker=new Node('word');marker.setAttribute('class','quranWord current');digital.appendChild(marker);
 let ed='original',loads=[],hold=null,failPage=0;
 function ports(name,mount){return{document:d,mount,isEligible:()=>ed===name,resolvePage:(p,k)=>{loads.push([p,k]);if(p===failPage)return 'fail';if(hold&&hold.page===p)return hold.promise;return k+'-'+p}}}
 let p=api.pair({original:ports('original',original),tajwid:ports('tajwid',tajwid)});
 const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve()};
 ok(!(await p.start('tajwid',1)),'wrong route rejected');
 ok(!(await p.start('original',0)),'invalid page rejected');
 ok(await p.start('original',12),'original starts');
 await flush();ok(original.children.length===1&&tajwid.children.length===0,'only original mounted');
 ok(p.position().nextReady,'neighbor ready');
 ok(p.progress(.35)&&Math.abs(original.children[0].scrollTop-350)<1,'actual viewport target');
 ok(!(await p.start('tajwid',13)),'mutual exclusion');
 ok(await p.advance(),'advance');ok(p.position().page===13,'correct next page');
 ok(original.children[0].scrollTop===0,'advance rebases');p.stop();
 ok(original.children.length===0&&p.position()===null,'stop removes owned node');
 ed='tajwid';ok(await p.start('tajwid',22),'colored starts');await flush();
 ok(tajwid.children[0].children[0].children[0].src==='tajwid-22','colored source');
 ok(p.progress(.7)&&tajwid.children[0].scrollTop===700,'colored independent scroll');
 ed='original';ok(!p.progress(.8),'edition change rejects writes');ok(!(await p.advance()),'edition change rejects transition');p.stop();
 ok(tajwid.children.length===0,'colored stop');
 let resolve;hold={page:33,promise:new Promise(r=>resolve=r)};
 const stale=p.start('original',33);await flush();p.stop();
 ok(await p.start('original',34),'new session after cancelled load');
 resolve('original-33');ok(!(await stale),'stale load rejected');await flush();
 ok(p.position().page===34&&original.children.length===1,'new mount preserved');p.stop();hold=null;
 failPage=40;ok(!(await p.start('original',40)),'decode error rejects start');ok(original.children.length===0,'failed start leaves no surface');
 failPage=42;ok(await p.start('original',41),'current page ready despite failed neighbor');await flush();
 ok(!p.position().nextReady,'failed neighbor not committed');
 ok(p.progress(.9)&&original.children[0].scrollTop===500,'no movement into unready page');
 ok(!(await p.advance()),'advance blocked on failed next');failPage=0;
 ok(await p.advance(),'retry next succeeds');ok(p.position().page===42,'retry moves once');p.stop();
 ok(await p.start('original',604),'last page starts');await flush();
 ok(!(await p.advance()),'no page 605');ok(p.progress(1)&&original.children[0].scrollTop===500,'last page clamps');p.stop();
 ok(digital.children.length===1&&digital.children[0]===marker&&marker.attrs.class==='quranWord current','digital sentinel unchanged');
 ok(!loads.some(([n])=>n<1||n>604),'valid page bounds');
 let same=false;try{api.pair({original:ports('original',original),tajwid:ports('tajwid',original)})}catch(_){same=true}ok(same,'shared mount rejected');
 return {checks,scope:'simulated DOM geometry/image decode; not actual browser/WebView'};
})(globalThis.__BASAIR_P225_PRINT_VIEWPORT__).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e);process.exitCode=1});
