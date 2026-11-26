/* P225 source-only adapter. Reads V695's existing recording providers via
 * injected references. No native playback, state, settings or DOM writes.
 * Page-based follow only. Exact ayah/surah repeat remains on P222 until
 * separately implemented and verified. Never silently downgrade that mode. */
(function(root){
 'use strict';
 const validPage=p=>Number.isInteger(p)&&p>=1&&p<=604;
 const num=n=>Number.isFinite(Number(n))?Number(n):NaN;
 const url=u=>typeof u==='string'&&u.trim()?u:'';
 const bounds=(s,e)=>Number.isFinite(s)&&Number.isFinite(e)&&s>=0&&e>s;
 function create({pageProvider,specialProvider,fallbackProvider}){
  async function resolve({page,reciter,selectedGlobal,repeatMode='page'}){
   if(!validPage(page)||!reciter||repeatMode!=='page')throw Error('unsupported follow request');
   const sp=specialProvider;
   if(reciter==='arkani'){
    if(!sp||typeof sp.pagePositions!=='function'||typeof sp.arkaniTiming!=='function'||typeof sp.arkaniTrackUrl!=='function')throw Error('arkani provider unavailable');
    const positions=sp.pagePositions(page);
    if(!Array.isArray(positions)||!positions.length)throw Error('missing page positions');
    const groups=[];
    for(const pos of positions){
     const s=num(pos.s),a=num(pos.a),g=num(pos.g);
     if(!Number.isInteger(s)||s<1||s>114||!Number.isInteger(a)||a<1||a>286)throw Error('invalid ayah position');
     if(!groups.length||groups[groups.length-1].s!==s)groups.push({s,items:[]});
     groups[groups.length-1].items.push({s,a,g});
    }
    const segments=await Promise.all(groups.map(async group=>{
     const map=await sp.arkaniTiming(group.s),items=group.items;
     const timings=items.map(x=>{
      const t=map&&map[x.a],start=num(t&&t.start),end=num(t&&t.end);
      if(!bounds(start,end))throw Error('invalid ayah timing');
      return {...x,start,end};
     });
     const start=timings[0].start,end=timings[timings.length-1].end,src=url(sp.arkaniTrackUrl(group.s));
     if(!bounds(start,end)||!src||timings.some((t,i)=>i>0&&(t.start<timings[i-1].start||t.end<timings[i-1].end)))throw Error('invalid segment');
     return {sources:[src],start,end,timings};
    }));
    let index=0,initial=segments[0].start;
    for(let i=0;i<segments.length;i++){const hit=segments[i].timings.find(t=>Number.isFinite(t.g)&&t.g===selectedGlobal);if(hit){index=i;initial=hit.start;break}}
    return {page,reciter,segments,index,initial};
   }
   if(reciter==='minshawy_teacher'){
    if(!sp||typeof sp.teacherPage!=='function')throw Error('teacher provider unavailable');
    const obj=await sp.teacherPage(page),src=url(obj&&obj.url),end=num(obj&&obj.duration);
    if(!src||!bounds(0,end)||Number(obj.page)!==page)throw Error('invalid teacher recording');
    const positions=typeof sp.pagePositions==='function'?sp.pagePositions(page):[];
    const selected=Array.isArray(positions)&&positions.find(p=>Number(p.g)===selectedGlobal);
    const item=selected&&Array.isArray(obj.items)&&obj.items.find(x=>Number(x.s)===Number(selected.s)&&Number(x.a)===Number(selected.a));
    const initial=item?num(item.start):0;
    if(!Number.isFinite(initial)||initial<0||initial>=end)throw Error('invalid teacher start');
    return {page,reciter,segments:[{sources:[src],start:0,end}],index:0,initial};
   }
   let sources=[];
   const add=x=>{x=url(x);if(x&&!sources.includes(x))sources.push(x)};
   if(pageProvider){
    try{if(typeof pageProvider.peek==='function')add(pageProvider.peek(page,reciter))}catch(_){}
    try{if(typeof pageProvider.warm==='function')add(await pageProvider.warm(page,reciter))}catch(_){}
    try{if(typeof pageProvider.packUrl==='function')add(pageProvider.packUrl(reciter,page))}catch(_){}
   }
   if(!sources.length&&typeof fallbackProvider==='function'){
    const list=await fallbackProvider(page,reciter);
    if(Array.isArray(list))list.forEach(add);
   }
   if(!sources.length)throw Error('page recording unavailable');
   // Native media duration is authoritative. No invented duration.
   return {page,reciter,segments:[{sources,start:0,end:null}],index:0,initial:0};
  }
  return Object.freeze({resolve});
 }
 root.__BASAIR_P225_RECORDING_PLAN__=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
