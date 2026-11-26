/* P225 private follow session. Uses its own display ports and media clock.
 * No B345/R33/P212, storage, digital DOM or native audio mutation.
 * STAGING: caller must provide exclusive reader/gesture ownership and a
 * fresh media element. Do not wire until V695 integration has real QA. */
(function(root){
 'use strict';
 function create({viewport,recordings,createMedia,now,schedule,cancel,eligible,onChange=()=>{}}){
   if(!viewport||!recordings||typeof createMedia!=='function'||typeof now!=='function'||typeof schedule!=='function'||typeof cancel!=='function'||typeof eligible!=='function')throw Error('invalid session ports');
   let run=null;
   const live=r=>run===r&&eligible(r.edition);
   const snapshot=()=>run?{edition:run.edition,mode:run.mode,page:run.page,phase:run.phase,progress:run.progress,repeatCount:run.repeatCount,repeatsLeft:run.repeatsLeft,reason:run.reason}:null;
   function emit(){try{onChange(snapshot())}catch(_){}}
   function detach(r){if(r.timer!==null)cancel(r.timer);r.timer=null;if(r.media){try{r.media.pause();r.media.removeAttribute('src');r.media.load()}catch(_){}r.media=null}}
   function stop(reason='stopped'){const r=run;if(!r)return false;run=null;r.reason=reason;detach(r);viewport.stop();emit();return true}
   function arm(r){if(!live(r)||r.timer!==null||r.phase!=='running')return;r.timer=schedule(()=>{r.timer=null;tick(r).catch(()=>{if(run===r)stop('clock-error')})},50)}
   const limit=x=>Math.min(1,Math.max(0,x));
   function update(r,p){if(!live(r))return false;r.progress=limit(p);return viewport.progress(r.progress)}
   function validPlan(p,page){return p&&p.page===page&&Array.isArray(p.segments)&&p.segments.length>0&&Number.isInteger(p.index)&&p.index>=0&&p.index<p.segments.length&&p.segments.every(s=>Array.isArray(s.sources)&&s.sources.length&&Number.isFinite(s.start)&&s.start>=0&&(s.end===null||Number.isFinite(s.end)&&s.end>s.start))&&(p.segments.length===1||p.segments.every(s=>s.end!==null))}
   async function playSegment(r,index,initial){
     if(!live(r))return false;
     const s=r.plan.segments[index];if(!s)return false;
     const old=r.media;if(old){try{old.pause();old.removeAttribute('src');old.load()}catch(_){}}
     // Never reuse the application's tilawaAudio. Each source attempt owns its element.
     for(const src of s.sources){
       if(!live(r))return false;
       const media=createMedia();r.media=media;r.segment=index;
       try{
         media.src=src;media.preload='auto';media.playbackRate=r.rate;media.volume=r.volume;
         // HTMLMediaElement accepts a pending seek before loadedmetadata.
         media.currentTime=Math.max(s.start,initial);
         await media.play();
         if(!live(r)||r.media!==media){media.pause();return false}
         if(r.phase==='paused'){media.pause();return true}
         return true;
       }catch(_){try{media.pause();media.removeAttribute('src');media.load()}catch(_){}if(!live(r))return false}
     }
     return false;
   }
   async function loadAudio(r,selection){
     const plan=await recordings.resolve({page:r.page,reciter:r.reciter,selectedGlobal:selection,repeatMode:'page'});
     if(!live(r)||!validPlan(plan,r.page))return false;
     r.plan=plan;return playSegment(r,plan.index,plan.initial);
   }
   async function next(r){
     if(!live(r)||r.phase!=='running')return;
     // The reader may be holding the page at the end of its clock. Wait
     // for the private viewport's gesture to settle instead of switching it.
     if(typeof viewport.canAdvance==='function'&&!viewport.canAdvance()){arm(r);return}
     r.phase='transition';emit();
     if(r.media)r.media.pause();
     if(r.mode==='audio'&&r.repeatsLeft>1){
       if(Number.isFinite(r.repeatsLeft))r.repeatsLeft--;r.progress=0;
       if((typeof viewport.reset==='function'&&!viewport.reset())||!update(r,0)||!await playSegment(r,0,r.plan.segments[0].start)){if(run===r)stop('repeat-failed');return}
     }else{
       if(r.page===604){stop('complete');return}
       if(!await viewport.advance()||!live(r)){if(run===r)stop('next-page-not-ready');return}
       r.page++;r.progress=0;r.repeatsLeft=r.repeatCount;r.elapsed=0;
       if(r.mode==='audio'&&!await loadAudio(r,undefined)){if(run===r)stop('audio-unavailable');return}
     }
     if(!live(r)){if(run===r)stop('route-changed');return}
     r.base=now();r.phase='running';emit();arm(r);
   }
   async function tick(r){
     if(!live(r)){if(run===r)stop('route-changed');return}
     if(r.phase!=='running')return;
     if(r.mode==='silent'){
       const p=(r.elapsed+Math.max(0,now()-r.base))/r.duration;
       if(!update(r,p)){stop('display-not-ready');return}
       if(p>=1){await next(r);return}
     }else{
       const m=r.media,s=r.plan.segments[r.segment];
       if(!m||m.error){stop('media-error');return}
       const end=s.end===null?Number(m.duration):s.end,cur=Number(m.currentTime);
       if(Number.isFinite(end)&&end>s.start&&Number.isFinite(cur)){
         const spans=r.plan.segments.map((v,i)=>v.end===null&&i===r.segment?end-v.start:v.end-v.start);
         const total=spans.reduce((a,b)=>a+b,0),before=spans.slice(0,r.segment).reduce((a,b)=>a+b,0);
         if(total>0&&!update(r,(before+Math.min(end-s.start,Math.max(0,cur-s.start)))/total)){stop('display-not-ready');return}
         if(m.ended&&cur<end-.25){stop('recording-ended-early');return}
         if(cur>=end||m.ended){
           if(r.segment+1<r.plan.segments.length){
             r.phase='transition';m.pause();
             const i=r.segment+1;
             if(!await playSegment(r,i,r.plan.segments[i].start)){if(run===r)stop('segment-failed');return}
             if(!live(r)){if(run===r)stop('route-changed');return}r.phase='running';emit();
           }else{await next(r);return}
         }
       }else if(m.ended){stop('unknown-media-duration');return}
     }
     arm(r);
   }
   async function start(opts){
     if(run||!opts||!['original','tajwid'].includes(opts.edition)||!['silent','audio'].includes(opts.mode)||!Number.isInteger(opts.page)||opts.page<1||opts.page>604||!eligible(opts.edition))return false;
     if(opts.repeatMode&&opts.repeatMode!=='page')return false;
     const rate=opts.rate??1,volume=opts.volume??1,count=opts.repeatCount??1;
     if(!Number.isFinite(rate)||rate<.75||rate>1.75||!Number.isFinite(volume)||volume<0||volume>1||!(count===Infinity||[1,2,3,5].includes(count)))return false;
     if(opts.mode==='silent'&&(!(Number.isFinite(opts.durationMs)&&opts.durationMs>0)||count!==1)||opts.mode==='audio'&&!opts.reciter)return false;
     const r={edition:opts.edition,mode:opts.mode,page:opts.page,phase:'preparing',progress:0,reason:'',timer:null,media:null,plan:null,rate,volume,repeatCount:count,repeatsLeft:count,duration:opts.durationMs,reciter:opts.reciter,elapsed:0,base:0};
     run=r;emit();
     try{
       if(!await viewport.start(r.edition,r.page)||!live(r)){if(run===r)stop('surface-unavailable');return false}
       if(r.mode==='audio'&&!await loadAudio(r,opts.selectedGlobal)){if(run===r)stop('playback-unavailable');return false}
       if(!live(r)){if(run===r)stop('route-changed');return false}
       r.base=now();r.phase='running';emit();arm(r);return true;
     }catch(_){if(run===r)stop('start-failed');return false}
   }
   function pause(){
     const r=run;if(!r||!live(r)||r.phase!=='running')return false;
     if(r.timer!==null)cancel(r.timer);r.timer=null;
     if(r.mode==='silent')r.elapsed+=Math.max(0,now()-r.base);
     else r.media.pause();
     r.phase='paused';emit();return true;
   }
   async function resume(){
     const r=run;if(!r||!live(r)||r.phase!=='paused')return false;
     try{
       r.phase='resuming';
       const media=r.media;
       if(media)await media.play();
       if(!live(r)){if(media)media.pause();if(run===r)stop('route-changed');return false}
       r.base=now();r.phase='running';emit();arm(r);return true;
     }catch(_){if(run===r)stop('resume-failed');return false}
   }
   return Object.freeze({start,stop,pause,resume,status:snapshot});
 }
 root.__BASAIR_P225_PRINT_SESSION__=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
