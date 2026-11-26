/* P225 staged standalone raster viewport. Does not access B345, R33, P212,
 * storage, body, native audio, digital DOM, or any global control function.
 * Original and Tajwid instances own different private state and DOM nodes.
 * Not an OTA asset: integration with actual reader/clock is a separate gate. */
(function(root){
 'use strict';
 function create(opts){
   const {document:d,mount,edition,resolvePage,isEligible}=opts;
   if(!d||!mount||!['original','tajwid'].includes(edition)||typeof resolvePage!=='function'||typeof isEligible!=='function')throw Error('invalid viewport ports');
   let epoch=0,view=null,current=null,next=null,pending=null,phase='idle',fraction=0;
   const valid=p=>Number.isInteger(p)&&p>=1&&p<=604;
   const alive=t=>t===epoch&&isEligible();
   function makeViewport(){
     const node=d.createElement('div');
     node.setAttribute('data-p225-viewport',edition);
     Object.assign(node.style,{position:'relative',width:'100%',height:'100%',overflowY:'auto',overflowX:'hidden',overscrollBehavior:'contain',background:'#fffdf8',margin:'0',padding:'0',display:'block',boxSizing:'border-box'});
     return node;
   }
   function card(p){
     const n=d.createElement('section'),img=d.createElement('img');
     n.setAttribute('data-p225-page',String(p));
     Object.assign(n.style,{display:'block',position:'relative',margin:'0 auto',padding:'0',width:'100%',maxWidth:'720px',lineHeight:'0'});
     Object.assign(img.style,{display:'block',width:'100%',height:'auto',margin:'0',padding:'0'});
     img.alt='';img.setAttribute('aria-label','Quran page '+p);img.decoding='async';n.appendChild(img);
     return {p,n,img};
   }
   async function load(p,t){
     if(!valid(p)||!alive(t))return null;
     const c=card(p),src=await resolvePage(p,edition);
     if(!alive(t)||typeof src!=='string'||!src)return null;
     c.img.src=src;
     if(typeof c.img.decode!=='function')throw Error('image decode unavailable');
     await c.img.decode();
     return alive(t)&&c.img.naturalWidth>0&&c.img.naturalHeight>0?c:null;
   }
   function clear(){
     ++epoch; if(view&&view.parentNode===mount)mount.removeChild(view);
     view=current=next=pending=null;fraction=0;phase='idle';
   }
   async function preload(t){
     if(!current||current.p===604||!alive(t))return false;
     const old=current,number=old.p+1;
     try{
       const loaded=await load(number,t);
       if(!loaded||!alive(t)||current!==old||!view)return false;
       if(next)return next.p===number;
       view.appendChild(loaded.n);next=loaded;return true;
     }catch(_){return false}
   }
   function kick(t){const p=preload(t);pending=p;p.then(()=>{if(pending===p)pending=null});return p}
   async function start(p){
     if(!valid(p)||phase!=='idle'||!isEligible())return false;
     const t=++epoch;phase='preparing';
     try{
       const loaded=await load(p,t);
       if(!loaded||!alive(t)){if(t===epoch)clear();return false}
       const newView=makeViewport();newView.appendChild(loaded.n);
       // The host integration must provide a dedicated, exclusive print mount.
       // Never erase or replace siblings: no access to the existing reader.
       mount.appendChild(newView);view=newView;current=loaded;phase='ready';
       kick(t);return true;
     }catch(_){if(t===epoch)clear();return false}
   }
   function geometry(){
     if(!view||!current)return null;
     const top=view.scrollTop,vr=view.getBoundingClientRect(),cr=current.n.getBoundingClientRect();
     const base=top+cr.top-vr.top,height=cr.height;
     const span=next?next.n.getBoundingClientRect().top-cr.top:height;
     if(!(height>0&&span>0&&view.clientHeight>0))return null;
     return {base,span,height,max:Math.max(0,view.scrollHeight-view.clientHeight)};
   }
   function progress(value){
     if(phase!=='ready'||!isEligible()||!Number.isFinite(value))return false;
     const g=geometry();if(!g)return false;
     fraction=Math.min(1,Math.max(0,value));
     const limit=next?g.max:Math.min(g.max,g.base+Math.max(0,g.height-view.clientHeight));
     view.scrollTop=Math.max(0,Math.min(limit,g.base+fraction*g.span));
     return true;
   }
   async function advance(){
     if(phase!=='ready'||!current||current.p===604||!isEligible())return false;
     const t=epoch,old=current;
     if(!next)await (pending||kick(t));
     if(!alive(t)||current!==old||!next||next.p!==old.p+1||!view)return false;
     view.removeChild(old.n);current=next;next=null;fraction=0;view.scrollTop=0;
     kick(t);return true;
   }
   function position(){return Object.freeze({edition,phase,page:current?current.p:null,progress:fraction,nextReady:!!next})}
   return Object.freeze({start,progress,advance,stop:clear,position});
 }
 function pair(opts){
   if(!opts.original||!opts.tajwid||opts.original.mount===opts.tajwid.mount)throw Error('separate mounts required');
   const engines={original:create({...opts.original,edition:'original'}),tajwid:create({...opts.tajwid,edition:'tajwid'})};
   let active=null;
   async function start(edition,page){
     if(active||!Object.prototype.hasOwnProperty.call(engines,edition))return false;
     const session={edition,engine:engines[edition]};active=session;
     const ok=await session.engine.start(page);
     if(active!==session)return false;
     if(!ok){active=null;return false}
     return true;
   }
   function stop(){const session=active;active=null;if(session)session.engine.stop()}
   return Object.freeze({start,stop,progress(value){return !!active&&active.engine.progress(value)},advance(){return active?active.engine.advance():Promise.resolve(false)},position(){return active?active.engine.position():null}});
 }
 root.__BASAIR_P225_PRINT_VIEWPORT__=Object.freeze({create,pair});
})(typeof window!=='undefined'?window:globalThis);
