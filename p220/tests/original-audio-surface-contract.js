/* P220 module regression on native B345/R33 contract: mock DOM, not Android QA. */
(function(root){
root.__BASAIR_P220_TESTS__=function(src){
 let passed=0,errors=[];const check=(n,ok)=>{if(ok)passed++;else errors.push(n)};
 function classes(init){const x=new Set(init||[]);return{contains:k=>x.has(k),add:k=>x.add(k),remove:k=>x.delete(k)}}
 function node(id){
   let e={id,children:[],parentNode:null,nextSibling:null,isConnected:true,classList:classes(),
     appendChild(c){return this.insertBefore(c,null)},insertBefore(c,before){
       if(c.parentNode){let i=c.parentNode.children.indexOf(c);if(i>=0)c.parentNode.children.splice(i,1)}
       let i=before?this.children.indexOf(before):-1;
       if(i<0)i=this.children.length;this.children.splice(i,0,c);c.parentNode=this;
       this.children.forEach((x,j)=>x.nextSibling=this.children[j+1]||null);return c;
     }};
   return e;
 }
 function boot(){
   const body=node('body'),head=node('head'),origin=node('origin'),dock=node('mushafDock'),
         mini=node('sequenceMiniControl'),sibling=node('sibling'),reader=node('mushafReader'),
         stack=node('b345NormalStack'),staticPage=node('mushafText');
   body.classList.add('reader-active');mini.classList.add('show');
   origin.appendChild(mini);origin.appendChild(sibling);
   let ready=false,loaded=true,edition='original',scale=100,font='original',clearCount=0;
   const card=node('card4'),img=node('image');
   card.offsetTop=0;card.offsetHeight=1100;
   card.getAttribute=k=>k==='data-b345-ready'?(ready?'1':'0'):null;
   card.querySelector=()=>img;
   img.complete=true;img.naturalWidth=720;img.naturalHeight=1280;
   stack.querySelector=q=>q.includes('"4"')?card:null;
   reader.scrollTop=0;reader.scrollHeight=5000;reader.clientHeight=700;
   const elems={mushafDock:dock,sequenceMiniControl:mini,mushafReader:reader,b345NormalStack:stack,mushafText:staticPage};
   const doc={body,head,readyState:'complete',getElementById:k=>elems[k]||head.children.find(n=>n.id===k)||null,
      createElement:tag=>node(tag),addEventListener(){}};
   const state={running:false,mode:'silent',page:4,progress:.05,paused:false,scaleMode:'normal',surfaceBusy:false,userScrolling:false};
   const w={__BASAIR_B345_SEQUENCE__:{state},__BASAIR_PRINT_FOLLOW_100__:{
        active:()=>true,edition:()=>edition,scale:()=>scale},
      localStorage:{getItem:k=>k==='stableFont'?font:null},
      setInterval:()=>1,clearInterval:()=>{clearCount++}};
   new Function('window','document',src)(w,doc);
   return{api:w.__BASAIR_P220_ORIGINAL_AUDIO_FOLLOW__,w,doc,state,body,head,origin,dock,
     mini,sibling,reader,stack,card,img,ready:x=>ready=x,edition:x=>edition=x,
     scale:x=>scale=x,font:x=>font=x,clearCount:()=>clearCount};
 }
 const a=boot(),api=a.api;
 check('registered singleton P220',api.version===220);
 check('default inactive',!api.status().active);
 a.state.running=true;a.state.mode='silent';api.refresh();
 check('silent mode preserved',!api.status().active&&a.mini.parentNode===a.origin);
 a.state.mode='audio';api.refresh();
 check('audio without loaded card leaves static page',!api.status().active&&a.mini.parentNode===a.origin);
 check('waiting for ready status recorded',api.status().waitingForNativePage===1);
 a.ready(true);api.refresh();
 check('audio with real card engages',api.status().active===true);
 check('body class active',a.body.classList.contains('p220-original-audio-live'));
 check('control moved not recreated',a.mini.parentNode===a.dock&&a.dock.children.length===1);
 check('original sibling remains',a.origin.children[0]===a.sibling);
 check('style injected once',a.head.children.length===1&&a.head.children[0].id==='p220OriginalAudioSurfaceStyle');
 let css=a.head.children[0].textContent;
 check('CSS hides only static overlap',css.includes('p220-original-audio-live')&&css.includes('#mushafReader #mushafText{opacity:0'));
 check('CSS removes duplicate green frame',css.includes('>.stableFrame{display:none'));
 check('CSS positions existing mini in dock',css.includes('#mushafDock>#sequenceMiniControl'));
 check('never allocates a second image',!src.includes("createElement('img')")&&!src.includes('cloneNode('));
 check('no synthetic timing clock',!src.includes('currentTime')&&!src.includes('playbackRate'));
 api.refresh();api.refresh();
 check('no repeated activation/style/control reparent',api.status().activations===1&&api.status().controlMoves===1&&a.head.children.length===1);
 a.state.progress=.15;api.refresh();
 check('progress alone does not force early scroll',a.reader.scrollTop===0&&api.status().scrollRecoveries===0);
 a.state.progress=.25;api.refresh();
 check('two observed progress increases fix stalled native scroller',a.reader.scrollTop>0&&api.status().scrollRecoveries===1);
 a.reader.scrollTop+=30;a.state.progress=.27;api.refresh();
 check('native scrolling remains sole owner if active',api.status().nativeScrollMoves>=1&&api.status().scrollRecoveries===1);
 const recoveredScroll=a.reader.scrollTop;
 a.state.paused=true;a.state.progress=.8;api.refresh();
 check('pause preserves current native printed page',api.status().active&&a.mini.parentNode===a.dock);
 check('pause preserves scroll position',a.reader.scrollTop===recoveredScroll);
 check('pause does not stop audio engine',a.state.running===true);
 a.state.paused=false;api.refresh();
 check('resume retains the active printed page',api.status().active&&a.mini.parentNode===a.dock);
 a.edition('tajwid');api.refresh();check('Tajwid excluded',!api.status().active);
 a.edition('blue');api.refresh();check('blue edition excluded',!api.status().active);
 a.edition('original');a.scale(130);api.refresh();check('enlarged print excluded',!api.status().active);
 a.scale(100);a.font('digital');api.refresh();check('digital font excluded',!api.status().active);
 a.font('original');a.body.classList.add('stableDigital');api.refresh();check('digital reader excluded',!api.status().active);
 a.body.classList.remove('stableDigital');a.body.classList.add('h25-hifz');api.refresh();check('Hifz excluded',!api.status().active);
 a.body.classList.remove('h25-hifz');a.body.classList.add('h90-review');api.refresh();check('Review excluded',!api.status().active);
 a.body.classList.remove('h90-review');a.body.classList.add('h100-teacher');api.refresh();check('Teacher excluded',!api.status().active);
 a.body.classList.remove('h100-teacher');api.refresh();check('original audio resumes',api.status().active);
 a.state.surfaceBusy=true;api.refresh();check('native busy excluded',!api.status().active);
 a.state.surfaceBusy=false;api.refresh();check('native ready reengages',api.status().active);
 a.state.running=false;api.refresh();check('stop restores original stage',!api.status().active&&a.mini.parentNode===a.origin&&!a.body.classList.contains('p220-original-audio-live'));
 api.disable();a.state.running=true;api.refresh();
 check('disabled repair cannot reengage',!api.status().active&&api.status().enabled===false);
 api.enable();check('explicit enable reengages',api.status().active);
 new Function('window','document',src)(a.w,a.doc);
 check('duplicate injection ignored',a.w.__BASAIR_P220_ORIGINAL_AUDIO_FOLLOW__===api);
 const b=boot();b.ready(true);b.state.running=true;b.state.mode='audio';b.api.refresh();
 b.state.progress=null;b.api.refresh();b.api.refresh();
 check('no progress no synthetic scroll',b.reader.scrollTop===0&&b.api.status().scrollRecoveries===0);
 b.state.progress=.12;b.state.userScrolling=true;b.api.refresh();b.state.progress=.3;b.api.refresh();
 check('user gesture excludes scroll recovery',b.reader.scrollTop===0);
 const c=boot();c.ready(true);c.state.running=true;c.state.mode='audio';c.api.refresh();
 c.reader.scrollHeight=c.reader.clientHeight;c.state.progress=.2;c.api.refresh();c.state.progress=.4;c.api.refresh();
 check('no content extent no recovery',c.reader.scrollTop===0);
 check('no persistent writes',!src.includes('.setItem(')&&!src.includes('indexedDB'));
 check('no P219 mutation',!src.includes('__BASAIR_P219_SINGLE_SHADOW_OWNER__')&&!src.includes('__BASAIR_P215_DIGITAL_SHADOW__'));
 return{passed,failed:errors.length,errors,note:'Browser DOM mock only; V695 audio follow still needs device QA'};
 }
})(typeof window!=='undefined'?window:globalThis);
