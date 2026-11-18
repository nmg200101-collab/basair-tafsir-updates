const fs=require('fs');const vm=require('vm');const assert=require('node:assert/strict');
const code=fs.readFileSync(require('node:path').join(__dirname,'../../p121/owner-qa/modules/tilawa/p208-print-follow-surface.js'),'utf8');
const checks=[];function check(label,fn){fn();checks.push(label)}
class CL {constructor(xs=[]){this.x=new Set(xs)}contains(s){return this.x.has(s)}add(s){this.x.add(s)}remove(s){this.x.delete(s)}}
class El{
 constructor(tag,id=''){this.tagName=tag;this.id=id;this.children=[];this.parentNode=null;this.isConnected=true;this.classList=new CL();this.attributes={};this.text='';this.style={};}
 get firstChild(){return this.children[0]||null}
 get nextSibling(){if(!this.parentNode)return null;return this.parentNode.children[this.parentNode.children.indexOf(this)+1]||null}
 appendChild(n){if(n.parentNode)n.parentNode.removeChild(n);this.children.push(n);n.parentNode=this;return n}
 insertBefore(n,other){if(n.parentNode)n.parentNode.removeChild(n);const i=other?this.children.indexOf(other):this.children.length;this.children.splice(i<0?this.children.length:i,0,n);n.parentNode=this;return n}
 removeChild(n){this.children.splice(this.children.indexOf(n),1);n.parentNode=null;return n}
 setAttribute(k,v){this.attributes[k]=v}
 querySelector(q){if(q===':scope>.stableFrame')return this.children.find(x=>x.className==='stableFrame')||null;return null}
}
const doc={readyState:'complete',body:new El('body'),head:new El('head'),documentElement:new El('html'),handlers:{},getElementById(id){return [this.body,this.head,this.documentElement,...all].find(x=>x.id===id)||null},createElement:t=>new El(t),querySelectorAll(q){if(q==='#b345NormalStack>.r33PrintShell')return cards;return []},addEventListener(k,f){this.handlers[k]=f}};
doc.body.classList.add('reader-active');const origin=new El('div','mushafReader'),dock=new El('nav','mushafDock'),mini=new El('div','sequenceMiniControl'),next=new El('div','after-mini'),existingButtons=[new El('button','sequenceMiniPause'),new El('button','sequenceMiniStop')];
mini.appendChild(existingButtons[0]);mini.appendChild(existingButtons[1]);origin.appendChild(mini);origin.appendChild(next);for(let i=0;i<6;i++)dock.appendChild(new El('button','dock'+i));
const cards=[new El('section'),new El('section')];for(const c of cards){c.className='r33PrintShell';const frame=new El('div');frame.className='stableFrame';c.appendChild(frame)}
const all=[origin,dock,mini,next,...existingButtons,...cards,...cards.flatMap(x=>x.children),...dock.children];let printed=true,edition='tajwid',scale=100,interval,timeout=[],resizeCount=0,scrollTop=123;
const controller={state:{running:false,paused:false,scaleMode:'normal',page:4}};
const w={__BASAIR_B345_SEQUENCE__:controller,__BASAIR_PRINT_FOLLOW_100__:{active:()=>printed,edition:()=>edition,scale:()=>scale},setInterval:fn=>{interval=fn;return 1},setTimeout:fn=>{timeout.push(fn);return 1},Event:class{constructor(k){this.type=k}},dispatchEvent(ev){if(ev.type==='resize')resizeCount++}};
vm.runInNewContext(code,{window:w,document:doc,console});const api=w.__BASAIR_P208_PRINT_SURFACE__;
check('Initially no dock mutations',()=>assert.equal(mini.parentNode,origin));
controller.state.running=true;api.refresh();
check('Starts Follow active printed surface',()=>assert.equal(api.status().active,true));
check('Reparents EXACT existing control under dock',()=>assert.equal(mini.parentNode,dock));
check('Preserves 6 existing dock tools',()=>assert.equal(dock.children.length,7));
check('Original pause and stop elements retained',()=>{assert.equal(mini.children[0],existingButtons[0]);assert.equal(mini.children[1],existingButtons[1])});
check('Original Quran pages and frames unchanged',()=>{assert.equal(cards.length,2);assert.ok(cards.every(x=>x.children.length===1))});
check('Body follow class scoped',()=>assert.equal(doc.body.classList.contains('p208-print-follow'),true));
check('Styles injected once',()=>assert.equal(doc.head.children.filter(x=>x.id==='p208PrintFollowSurfaceStyle').length,1));
api.refresh();api.refresh();
check('Refresh idempotent without another move',()=>assert.equal(api.status().moves,1));
check('No extra reflows on refresh',()=>assert.equal(resizeCount,1));
controller.state.paused=true;api.refresh();
check('Paused Follow retains controls in dock',()=>assert.equal(mini.parentNode,dock));
controller.state.running=false;api.refresh();
check('Stop restores control to original parent',()=>assert.equal(mini.parentNode,origin));
check('Stop restores precise sibling order',()=>{assert.equal(origin.children[0],mini);assert.equal(origin.children[1],next)});
check('Stop removes scoped body style',()=>assert.equal(doc.body.classList.contains('p208-print-follow'),false));
check('Stop triggers one geometry recalculation',()=>assert.equal(resizeCount,2));
controller.state.running=true;controller.state.paused=false;doc.body.classList.add('stableDigital');api.refresh();
check('Digital font is not affected',()=>assert.equal(api.status().active,false));
doc.body.classList.remove('stableDigital');edition='unknown';api.refresh();
check('Non-printed edition ignored',()=>assert.equal(api.status().active,false));
edition='original';scale=130;api.refresh();
check('Enlarged printed page not affected',()=>assert.equal(api.status().active,false));
scale=100;api.refresh();
check('Original print mode supported',()=>assert.equal(api.status().active,true));
controller.state.running=false;api.refresh();
check('No storage or service side effects',()=>assert.equal(typeof w.localStorage,'undefined'));
console.log(JSON.stringify({result:'PASS',tests:checks.length,cases:checks,stats:api.status()},null,2));