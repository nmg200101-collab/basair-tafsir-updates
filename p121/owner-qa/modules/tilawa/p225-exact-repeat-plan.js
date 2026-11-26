/* P225 exact repeat: independent ayah recordings only. Read-only catalog,
 * page mapping, source and geometry ports. No native playback or state writes.
 * Geometry uses existing V695 hit coordinates, not estimated audio timings. */
(function(root){
 'use strict';
 const pageOK=p=>Number.isInteger(p)&&p>=1&&p<=604;
 const bound=x=>Math.max(0,Math.min(1,x));
 function create({catalog,pageFor,urls,hitRows}){
   if(!Array.isArray(catalog)||typeof pageFor!=='function'||typeof urls!=='function'||typeof hitRows!=='function')throw Error('exact ports unavailable');
   function length(s){const a=catalog[s-1]?.ayahs;return Array.isArray(a)?a.length:0}
   function target(s,a){if(!Number.isInteger(s)||s<1||s>114||!Number.isInteger(a)||a<1||a>length(s))return null;const page=pageFor(s,a);return pageOK(page)?{s,a,page}:null}
   function point(t){
     const rows=hitRows(t.page);
     if(!Array.isArray(rows))return null;
     const candidates=rows.filter(x=>x.s===t.s&&x.a===t.a&&Number.isFinite(x.top)&&Number.isFinite(x.height)&&x.top>=0&&x.height>0&&x.top+x.height<=1.001);
     if(!candidates.length)return null;
     return bound(Math.min(...candidates.map(x=>x.top+x.height/2)));
   }
   function prepare({page,reciter,repeatMode,surah,ayah}){
     if(!['ayah','surah'].includes(repeatMode)||!reciter||['arkani','minshawy_teacher'].includes(reciter))return null;
     const first=target(surah,repeatMode==='surah'?1:ayah);
     if(!first||first.page!==page)return null;
     const next=repeatMode==='surah'&&first.a<length(first.s)?target(first.s,first.a+1):null;
     const firstPlan=record(first,reciter,next);
     if(!firstPlan)return null;
     return Object.freeze({mode:repeatMode,reciter,first,firstPlan});
   }
   function record(t,reciter,next){
     if(!t)return null;
     const source=urls(t.s,t.a,reciter);
     const sources=Array.isArray(source)?[...new Set(source.filter(x=>typeof x==='string'&&x.trim()))]:[];
     const start=point(t);if(!sources.length||start===null)return null;
     // If the next ayah is on the same line, keep the viewport at that
     // line. Do not invent a vertical range or word timestamps.
     const end=next&&next.page===t.page?point(next):start;
     if(end===null)return null;
     return {page:t.page,reciter,index:0,initial:0,segments:[{sources,start:0,end:null}],visual:{start,end:Math.max(start,end)},target:t};
   }
   function following(spec,t){
     if(spec.mode!=='surah'||t.s!==spec.first.s||t.a>=length(t.s))return null;
     const n=target(t.s,t.a+1);if(!n)throw Error('missing mapped next ayah');return n;
   }
   function plan(spec,t){
     if(t.s!==spec.first.s||spec.mode==='ayah'&&t.a!==spec.first.a)return null;
     return record(t,spec.reciter,following(spec,t));
   }
   return Object.freeze({prepare,following,plan});
 }
 root.__BASAIR_P225_EXACT_REPEAT__=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
