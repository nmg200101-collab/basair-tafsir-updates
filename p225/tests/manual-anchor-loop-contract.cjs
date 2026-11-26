'use strict';
const fs=require('fs'),path=require('path');
const source=n=>fs.readFileSync(path.resolve(__dirname,'../staging',n),'utf8');
(async function(viewSrc,sessionSrc){
 let checks=0,clock=1000;const check=(v,label)=>{if(!v)throw Error(label);checks++};
 const w={};new Function('window','Date',viewSrc)(w,{now:()=>clock});new Function('window',sessionSrc)(w);
 class Node{
  constructor(tag){this.tag=tag;this.children=[];this.parentNode=null;this.style={};this.scrollTop=0;this.clientHeight=500;this.naturalWidth=720;this.naturalHeight=1280;this.events={}}
  setAttribute(){} addEventListener(e,f){this.events[e]=f} fire(e){this.events[e]?.()}
  appendChild(x){x.parentNode=this;this.children.push(x)} removeChild(x){this.children=this.children.filter(n=>n!==x);x.parentNode=null}
  get scrollHeight(){return this.children.length*1000}
  getBoundingClientRect(){return this.tag==='section'?{top:100+this.parentNode.children.indexOf(this)*1000-this.parentNode.scrollTop,height:1000}:{top:100,height:500}}
  decode(){return Promise.resolve()}
 }
 const mount=new Node('mount'),d={createElement:t=>new Node(t)},digital={shadow:'native'};
 const v=w.__BASAIR_P225_PRINT_VIEWPORT__.create({document:d,mount,edition:'original',resolvePage:p=>'p'+p,isEligible:()=>true});
 const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve()};
 check(await v.start(20),'start');await flush();let el=mount.children[0];
 check(v.progress(.2)&&el.scrollTop===200,'initial clock');el.fire('touchstart');el.scrollTop=650;el.fire('scroll');clock+=200;
 check(v.progress(.3)&&el.scrollTop===650,'manual drag respected');el.fire('touchend');clock+=100;
 check(v.progress(.35)&&el.scrollTop===650,'settling respected');clock+=500;
 check(v.progress(.4)&&Math.abs(el.scrollTop-650)<1,'anchor no snap');clock+=500;
 check(v.progress(.7)&&Math.abs(el.scrollTop-825)<1,'anchor advances from actual position');check(v.position().clockProgress===.7,'audio clock independent');
 check(v.reset()&&el.scrollTop===0&&!v.position().manual,'repeat clears manual anchor');
 check(v.progress(.5)&&el.scrollTop===500,'repeat progress follows original clock');check(await v.advance()&&v.position().page===21,'transition clears anchor');
 check(digital.shadow==='native','digital untouched');v.stop();
 let q=new Map(),seq=0,media=[],resets=0,advances=0,display=null;
 const viewport={async start(e,p){display=p;return true},progress:()=>true,reset(){resets++;return true},async advance(){advances++;display++;return true},stop(){display=null}};
 const recordings={async resolve({page}){return {page,index:0,initial:0,segments:[{sources:['recording'],start:0,end:null}]}}};
 const ctrl=w.__BASAIR_P225_PRINT_SESSION__.create({viewport,recordings,createMedia:()=>{const m={currentTime:0,duration:10,paused:true,async play(){this.paused=false},pause(){this.paused=true},removeAttribute(){},load(){}};media.push(m);return m},now:()=>clock,schedule:f=>{q.set(++seq,f);return seq},cancel:t=>q.delete(t),eligible:()=>true});
 const req={edition:'original',mode:'audio',reciter:'alafasy',page:12,repeatCount:Infinity};
 check(await ctrl.start(req),'loop starts');
 for(let i=0;i<4;i++){media.at(-1).currentTime=10;let jobs=[...q.values()];q.clear();jobs.forEach(f=>f());await flush();check(ctrl.status().page===12&&ctrl.status().repeatsLeft===Infinity,'loop stays on page '+i)}
 check(resets===4&&advances===0,'loop reset count');check(ctrl.stop()&&media.every(m=>m.paused)&&q.size===0,'loop stop');
 check(!await ctrl.start({...req,repeatCount:4}),'unsupported count rejected');
 return {checks,scope:'simulated viewport input and audio loop; real WebView pending'};
})(source('p225-independent-printed-viewport.js'),source('p225-independent-printed-session.js')).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e);process.exitCode=1});
