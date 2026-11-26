/* P225 opt-in V695 integration candidate. NEVER auto-enable in OTA.
 * Registers only the printed route in the existing coordinator. The digital
 * adapter, P212 aliases, native audio and all P222 files stay untouched.
 * Requires exclusive print surface validation in real Android before release. */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P225_READER_BRIDGE__)return;
 const E=id=>d.getElementById(id),B=()=>d.body;
 let installed=false,engine=null,lease=null,serial=0,owner=null,legacy=null,core=null,sessionToken=0,lastError='',selected=null;
 const enabled={original:false,tajwid:false};
 const excluded=['stableDigital','h25-hifz','h90-review','h100-teacher','b274LargeMushaf'];
 function edition(){
   const b=B(),p=w.__BASAIR_PRINT_FOLLOW_100__;
   if(!b||!b.classList.contains('reader-active')||excluded.some(k=>b.classList.contains(k)))return '';
   try{
     if((w.localStorage.getItem('stableFont')||'original')!=='original'||!p||!p.active()||Number(p.scale())!==100)return '';
     const e=p.edition();return e==='original'||e==='tajwid'?e:'';
   }catch(_){return ''}
 }
 function nativeIdle(){
   const b=w.__BASAIR_B345_SEQUENCE__,p=w.__BASAIR_P212_TAJWID_STATIC_FOLLOW__,a=E('tilawaAudio');
   return !!(b&&b.state&&b.state.installed&&!b.state.running&&p&&typeof p.status==='function'&&!p.status().running&&a&&a.paused);
 }
 function page(){const n=Number(E('readerPageInput')?.value);return Number.isInteger(n)&&n>=1&&n<=604?n:0}
 function read(id,key,fallback){let v=E(id)?.value;try{if(!v&&key)v=w.localStorage.getItem(key)}catch(_){}return v||fallback}
 function exactPorts(){
   const factory=w.__BASAIR_P225_EXACT_REPEAT__,b=w.__BASAIR_B345_SEQUENCE__,p=w.__BASAIR_PRINT_BRIDGE__;
   if(!factory||!Array.isArray(w.LOCAL_QURAN)||typeof w.globalFor!=='function'||typeof w.pageForGlobal!=='function'||typeof b?._test?.exactAyahUrls!=='function'||typeof p?.hitHTML!=='function')return null;
   return factory.create({
     catalog:w.LOCAL_QURAN,
     pageFor:(s,a)=>{const g=Number(w.globalFor(s,a));return g>0?Number(w.pageForGlobal(g)):0},
     urls:(s,a,k)=>read('sequenceReciterV17','v170Reciter','alafasy')===k?b._test.exactAyahUrls(s,a):[],
     hitRows:page=>{
       const node=d.createElement('div');node.innerHTML=p.hitHTML(page,false);
       return Array.from(node.querySelectorAll('.ayahHit[data-s][data-selectayah]')).filter(n=>n.style.top.endsWith('%')&&n.style.height.endsWith('%')).map(n=>({s:Number(n.getAttribute('data-s')),a:Number(n.getAttribute('data-selectayah')),top:parseFloat(n.style.top)/100,height:parseFloat(n.style.height)/100}));
     }
   });
 }
 function request(mode){
   const ed=edition(),p=page(),repeatMode=read('sequenceRepeatModeR107',null,'page'),raw=read('sequenceRepeatV17',null,'1');
   const count=raw==='loop'||raw==='infinite'?Infinity:Number(raw),ppm=Number(read('sequenceSpeedV10','v170Speed','.5')),rate=Number(read('sequenceAudioRateV174','v174AudioRate','1'));
   if(!ed||!p||!['page','ayah','surah'].includes(repeatMode)||!(count===Infinity||[1,2,3,5].includes(count))||mode==='silent'&&(count!==1||repeatMode!=='page')||!(ppm>0)||rate<.75||rate>1.75)return null;
   let volume=1;try{if(typeof w.v194s3Volume==='function')volume=Number(w.v194s3Volume())}catch(_){}
   if(!Number.isFinite(volume)||volume<0||volume>1)volume=1;
   const req={edition:ed,page:p,mode,repeatMode,repeatCount:count,durationMs:60000/ppm,rate,volume,reciter:read('sequenceReciterV17','v170Reciter','alafasy'),selectedGlobal:Number(w.selectedGlobal)||undefined,surah:Number(w.selectedSurah),ayah:Number(w.selectedTilawaAyah)};
   if(repeatMode!=='page'){try{if(!exactPorts()?.prepare(req))return null}catch(_){return null}}
   return req;
 }
 function layout(ed){
   const reader=E('mushafReader'),surface=E('pageReading'),text=E('mushafText'),stage=text&&text.querySelector('.localPageStage');
   if(edition()!==ed||!reader||!surface||!reader.contains(surface)||!surface.contains(text)||!stage)return null;
   const rect=surface.getBoundingClientRect(),rr=reader.getBoundingClientRect();
   if(rect.width<100||rect.height<80||rr.height<100||w.getComputedStyle(surface).display==='none')return null;
   const digital=E('stableDigitalHost'),zoom=E('b274LargeTextHost');
   for(const node of [digital,zoom]){
     if(node){const r=node.getBoundingClientRect(),s=w.getComputedStyle(node);
       if(r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&node.getClientRects().length)return null}
   }
   const image=stage.querySelector(ed==='tajwid'?'.rc18TajwidRaster':'img[data-mushaf-page]');
   if(!image||!image.complete||!image.naturalWidth||!image.getClientRects().length)return null;
   return {reader,surface,rect,rr};
 }
 function mountFor(l,ed){
   const el=d.createElement('div');el.setAttribute('data-p225-mount',ed);
   Object.assign(el.style,{display:'none',width:'100%',height:Math.max(100,Math.min(l.rect.height,l.rr.bottom-l.rect.top))+'px',overflow:'hidden',margin:'0',padding:'0'});
   l.surface.parentNode.insertBefore(el,l.surface);return el;
 }
 function restore(l){
   if(!l)return;
   if(l.original&&l.original.parentNode)l.original.parentNode.removeChild(l.original);
   if(l.tajwid&&l.tajwid.parentNode)l.tajwid.parentNode.removeChild(l.tajwid);
   // Only undo the specific inline property owned by this bridge.
   if(l.hidden&&l.surface.style.getPropertyValue('display')==='none'&&l.surface.style.getPropertyPriority('display')==='important'){
     if(l.prior)l.surface.style.setProperty('display',l.prior,l.priority);else l.surface.style.removeProperty('display');
   }
 }
 function resolvePage(p,ed){
   if(ed==='tajwid')return 'assets/tajweed-pages/tajweed-'+String(p).padStart(3,'0')+'.webp';
   const bridge=w.__BASAIR_PRINT_BRIDGE__;
   if(!bridge||typeof bridge.resolvePage!=='function')throw Error('original page source unavailable');
   return bridge.resolvePage(p);
 }
 function setMini(s){
   if(!lease||s&&edition()!==lease.edition||!s&&!nativeIdle())return;
   const mini=E('sequenceMiniControl'),label=E('sequenceMiniText'),pause=E('sequenceMiniPause');
   if(!mini||!label||!pause)return;
   if(s){mini.classList.add('show');label.textContent=(s.mode==='audio'?'🔊 ':'▤ ')+'صفحة '+s.page;pause.textContent=s.phase==='paused'?'▶ متابعة':'⏸ إيقاف مؤقت'}
   else{mini.classList.remove('show');label.textContent='';pause.textContent='⏸ إيقاف مؤقت'}
 }
 function release(restorePage){
   const l=lease,s=(engine&&engine.status())||(l&&l.lastSession);++serial;
   if(l)setMini(null);
   lease=null;const c=engine;engine=null;
   if(c)c.stop('bridge-release');
   restore(l);
   // Commit the final printed page only while the same printed reader remains.
   // Never invoke navigation after a font or edition switch.
   if(restorePage&&l&&s&&s.page!==l.page&&edition()===l.edition&&nativeIdle()&&typeof w.openPage==='function')w.openPage(s.page);
 }
 function create(req,l,token){
   const viewportApi=w.__BASAIR_P225_PRINT_VIEWPORT__,plans=w.__BASAIR_P225_RECORDING_PLAN__,sessions=w.__BASAIR_P225_PRINT_SESSION__;
   const eligible=ed=>lease===l&&serial===token&&edition()===ed&&nativeIdle();
   const pair=viewportApi.pair({original:{document:d,mount:l.original,resolvePage,isEligible:()=>eligible('original')},tajwid:{document:d,mount:l.tajwid,resolvePage,isEligible:()=>eligible('tajwid')}});
   const viewport={
     async start(ed,p){const ok=await pair.start(ed,p);if(!ok||!eligible(ed))return false;
       l[ed].style.display='block';l.surface.style.setProperty('display','none','important');l.hidden=true;
       // Now, and only now, geometry can be measured in the exclusive visible mount.
       if(!pair.progress(0)){restore(l);return false}return true},
     async seekPage(ed,p){if(!eligible(ed))return false;pair.stop();return await pair.start(ed,p)&&eligible(ed)&&pair.progress(0)},
     progress:p=>pair.progress(p),advance:()=>pair.advance(),reset:()=>pair.reset(),canAdvance:()=>pair.canAdvance(),stop:()=>pair.stop(),position:()=>pair.position()
   };
   const recordings=plans.create({pageProvider:w.__BASAIR_V180_TEST__,specialProvider:w.__BASAIR_SPECIAL_RECITER_R62__,fallbackProvider:(p,k)=>{const a=w.__BASAIR_V173_TEST__;return a&&typeof a.pageAudioUrls==='function'&&read('sequenceReciterV17','v170Reciter','alafasy')===k?a.pageAudioUrls(p):[]}});
   return sessions.create({viewport,recordings,exactRepeat:req.repeatMode==='page'?null:exactPorts(),createMedia:()=>new w.Audio(),now:()=>w.performance.now(),schedule:f=>w.setTimeout(f,50),cancel:t=>w.clearTimeout(t),eligible,onChange:s=>{
     if(lease!==l||serial!==token)return;
     if(s){l.lastSession=s;setMini(s)}
     else{w.setTimeout(()=>{if(lease===l&&serial===token&&owner==='p225'&&core.status()?.generation===sessionToken)core.stop('p225-session-ended')},0)}
   }});
 }
 const candidate={
   canStart(mode){return !!(request(mode)&&layout(edition())&&nativeIdle()&&(!core.status()||core.status().route==='printed'&&owner==='p225'))},
   start(mode){
     const req=request(mode),layoutState=req&&layout(req.edition);
     if(!req||!layoutState||!nativeIdle()||lease||typeof w.openPage!=='function')return false;
     const t=++serial,l={...layoutState,edition:req.edition,page:req.page,prior:layoutState.surface.style.getPropertyValue('display'),priority:layoutState.surface.style.getPropertyPriority('display'),hidden:false};
     lease=l;owner='p225';sessionToken=core.status()?.generation;
     try{l.original=mountFor(l,'original');l.tajwid=mountFor(l,'tajwid');engine=create(req,l,t);const instance=engine;
       instance.start(req).then(ok=>{if(!ok&&lease===l&&serial===t){lastError='start not ready';if(core.status()?.generation===sessionToken)core.stop('p225-start-failed')}}).catch(()=>{if(lease===l&&serial===t&&core.status()?.generation===sessionToken)core.stop('p225-start-error')});
       return true
     }catch(e){lastError=String(e);release(false);owner=null;return false}
   },
   stop(){if(owner!=='p225')return true;release(true);owner=null;return true},
   pause(){return !!engine&&engine.pause()},
   resume(){const instance=engine,t=serial;if(!instance||instance.status()?.phase!=='paused')return false;instance.resume().then(ok=>{if(!ok&&engine===instance&&serial===t&&owner==='p225'&&core.status()?.generation===sessionToken)core.stop('p225-resume-failed')});return true},
   position(){const s=engine&&engine.status();return s?{page:s.page,progress:s.progress}:null}
 };
 // Route only the explicitly selected printed edition to the experiment.
 // Pin the delegate for the entire session, including STOP after a route switch.
 function choose(){return enabled[edition()]?candidate:legacy}
 const dispatch={
   canStart(mode,opts){const a=choose();return !!a&&(!a.canStart||a.canStart(mode,opts)!==false)},
   start(mode,opts){const a=choose();if(!a)return false;selected=a;try{const ok=a.start(mode,opts);if(ok===false)selected=null;return ok}catch(e){try{a.stop('start-error')}finally{selected=null}throw e}},
   stop(reason){if(!selected)return true;const ok=selected.stop(reason);if(ok!==false)selected=null;return ok},
   pause(){return !!selected&&selected.pause()},
   resume(){return !!selected&&selected.resume()},
   position(){return selected?selected.position():null}
 };
 function install(){
   if(installed)return true;
   core=w.__BASAIR_P213_FOLLOW__;const a=w.__BASAIR_P213_ADAPTERS__,b=w.__BASAIR_P213_CONTROL_BRIDGE__;
   if(!core||core.status()||!a||!a.adapters||!a.adapters.printed||!b||!b.status().enabled||!nativeIdle()||
      !w.__BASAIR_P225_PRINT_VIEWPORT__||!w.__BASAIR_P225_RECORDING_PLAN__||!w.__BASAIR_P225_PRINT_SESSION__)return false;
   legacy=a.adapters.printed;core.register('printed',dispatch);installed=true;return true;
 }
 function uninstall(){
   if(!installed)return true;
   const state=core.status();
   if(state?.route==='printed'){
     if(selected!==candidate)return false;
     if(!core.stop('p225-uninstall'))return false;
   }
   if(lease)release(false);core.register('printed',legacy);installed=false;selected=null;
   enabled.original=enabled.tajwid=false;return true;
 }
 function setTrial(ed,on){
   if(!Object.prototype.hasOwnProperty.call(enabled,ed)||typeof on!=='boolean')return false;
   if(on){
     // Never reconfigure while any old or digital session owns controls.
     if(!nativeIdle()||w.__BASAIR_P213_FOLLOW__?.status())return false;
     if(!install())return false;enabled[ed]=true;return true;
   }
   if(lease?.edition===ed&&core.status()?.route==='printed'&&selected===candidate&&!core.stop('p225-disable-edition'))return false;
   enabled[ed]=false;
   if(!enabled.original&&!enabled.tajwid&&installed&&core.status()?.route!=='printed')return uninstall();
   return true;
 }
 function stopTrial(){
   if(selected===candidate&&core?.status()?.route==='printed'&&!core.stop('p225-emergency-stop'))return false;
   enabled.original=enabled.tajwid=false;
   if(installed&&core.status()?.route!=='printed')return uninstall();
   return true;
 }
 function guard(){
   // Also run during paused/preparing sessions, where no media tick is active.
   if(lease&&(edition()!==lease.edition||!nativeIdle()))return stopTrial();
   if(installed&&!enabled.original&&!enabled.tajwid&&core.status()?.route!=='printed')return uninstall();
   return true;
 }
 w.__BASAIR_P225_READER_BRIDGE__=Object.freeze({setTrial,stopTrial,guard,edition,status:()=>({installed,owner,error:lastError,enabled:{...enabled},session:engine&&engine.status()})});
})(window,document);
