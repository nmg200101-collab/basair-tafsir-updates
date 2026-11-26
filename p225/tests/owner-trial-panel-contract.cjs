'use strict';
const fs=require('fs'),path=require('path');
const result=(function(source){
 let checks=0;const ok=(v,l)=>{if(!v)throw Error(l);checks++};
 class Node{constructor(){this.children=[];this.parentNode=null;this.style={};this.attrs={};this.textContent='';this.events={}}get isConnected(){return this.parentNode?this.parentNode.isConnected:this.root===true}appendChild(x){x.parentNode=this;this.children.push(x)}insertBefore(x,y){let i=this.children.indexOf(y);if(i<0)throw Error('missing sibling');x.parentNode=this;this.children.splice(i,0,x)}setAttribute(k,v){this.attrs[k]=v}addEventListener(k,v){this.events[k]=v}click(){this.events.click?.({preventDefault(){},stopPropagation(){}})}}
 function setup(signed){
  const root=new Node();root.root=true;const host=new Node(),modes=new Node(),button=new Node(),mini=new Node();root.appendChild(host);host.appendChild(modes);modes.appendChild(button);root.appendChild(mini);
  let ed='original',enabled={original:false,tajwid:false},active=false,calls=[],jobs=[],events={},available=true,allow=true;
  const b={status:()=>({enabled:{...enabled},owner:active?'p225':null,session:active?{}:null}),edition:()=>ed,guard(){calls.push('guard');return true},setTrial(k,v){calls.push(k+':'+v);if(!allow)return false;enabled[k]=v;return true},stopTrial(){calls.push('stop');enabled.original=enabled.tajwid=active=false;return true}};
  const d={currentScript:signed?{dataset:{basairP121:'tilawa'}}:{dataset:{}},createElement:()=>new Node(),getElementById:k=>available?(k==='sequenceSilentV10'?button:k==='sequenceMiniControl'?mini:null):null};
  const w={__BASAIR_P225_READER_BRIDGE__:b,setTimeout:f=>{jobs.push(f);return jobs.length},addEventListener:(k,f)=>events[k]=f};
  new Function('window','document',source)(w,d);
  return {w,b,root,host,mini,calls,events,step(){jobs.shift()?.()},setEdition(v){ed=v},setActive(v){active=v},setAvailable(v){available=v},setAllow(v){allow=v}};
 }
 let x=setup(false);ok(!x.w.__BASAIR_P225_TRIAL_PANEL__&&x.calls.length===0,'unsigned injection inert');
 x=setup(true);const panel=x.host.children.find(n=>n.id==='p225TrialPanel'),em=x.root.children.find(n=>n.id==='p225TrialEmergency'),row=panel.children[2];
 ok(!!panel&&!!em,'signed panel mounted');ok(panel.style.display==='block','printed panel visible');ok(em.style.display==='none','emergency hidden by default');ok(!x.calls.some(c=>c.includes(':')),'default does not activate');ok(row.children[0].attrs['aria-pressed']==='false'&&row.children[1].attrs['aria-pressed']==='false','both off');
 row.children[0].click();ok(x.b.status().enabled.original&&!x.b.status().enabled.tajwid,'original alone');row.children[1].click();ok(x.b.status().enabled.tajwid,'colored independent');x.setActive(true);x.step();ok(em.style.display==='block','emergency visible during trial');em.click();ok(!x.b.status().enabled.original&&!x.b.status().enabled.tajwid&&em.style.display==='none','emergency disables both');
 x.setEdition('');x.step();ok(panel.style.display==='none','digital panel hidden');x.setAvailable(false);let prior=x.calls.length;x.step();ok(x.calls.length===prior+1&&x.calls.at(-1)==='guard','guard runs without UI');x.setAvailable(true);x.setEdition('original');x.step();x.setAllow(false);row.children[0].click();ok(!x.b.status().enabled.original,'busy refuses toggle');x.setAllow(true);row.children[0].click();x.events.pagehide();ok(!x.b.status().enabled.original,'pagehide disarms trial');
 return {checks,scope:'mock DOM signed-loader gate and user controls; no Android rendering'};
})(fs.readFileSync(path.resolve(__dirname,'../staging/p225-owner-trial-panel.js'),'utf8'));console.log(JSON.stringify(result));
