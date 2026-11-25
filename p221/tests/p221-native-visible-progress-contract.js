/* P221 regression: real source, simulated native B345 geometry.
 * This is NOT an Android WebView acceptance test.
 */
(function(root){
root.__BASAIR_P221_VISUAL_TESTS__=function(src){
 var count=0,fail=[];
 function ck(name,b){if(b)count++;else fail.push(name)}
 function css(){var x={};return{setProperty(k,v,p){x[k]={v:v,p:p||''}},getPropertyValue(k){return x[k]?x[k].v:''},getPropertyPriority(k){return x[k]?x[k].p:''},removeProperty(k){delete x[k]}}}
 function cl(input){var s=new Set(input||[]);return{contains:k=>s.has(k),add:k=>s.add(k),remove:k=>s.delete(k)}}
 function boot(geometry){
   var doc={},body={classList:cl(['reader-active'])},head={children:[],appendChild(x){this.children.push(x)}};
   var reader={scrollTop:0,scrollHeight:4200,clientHeight:600,getBoundingClientRect(){return{top:80,width:380,height:650}}};
   var pageReading={scrollTop:0,scrollHeight:3000,clientHeight:650,getBoundingClientRect(){return{top:80,width:380,height:650}}};
   var stack={style:css(),querySelector(q){var m=q.match(/"([0-9]+)"/);return m?cards[Number(m[1])]||null:null}};
   var stage={id:'mushafText'};
   var cards={};
   var shift=0,nativeYOffset=0;
   function image(){return{complete:true,naturalWidth:720,naturalHeight:1280}}
   function rect(page){return{top:80+(page-4)*910-nativeYOffset-
     (geometry==='reader'?reader.scrollTop:0)-
     (geometry==='pageReading'?pageReading.scrollTop:0)+shift,
      width:360,height:910,bottom:990}}
   for(var pg of [4,5]){
     (function(page){
       cards[page]={getAttribute:k=>k==='data-b345-ready'?'1':null,
        querySelector:q=>q==='img'||q==='.r33PrintImage'?image():null,
        getBoundingClientRect:()=>rect(page)};
     })(pg);
   }
   var raw=stack.style.setProperty;
   stack.style.setProperty=function(k,v,p){
     raw.call(this,k,v,p);
     if(k==='transform')shift=Number((String(v).match(/translate3d\(0,([-\d.]+)px/)||[])[1])||0;
   };
   var remove=stack.style.removeProperty;
   stack.style.removeProperty=function(k){remove.call(this,k);if(k==='transform')shift=0};
   var ids={mushafReader:reader,pageReading:pageReading,b345NormalStack:stack,mushafText:stage};
   doc.body=body;doc.head=head;doc.readyState='complete';doc.hidden=false;
   doc.getElementById=function(id){return ids[id]||head.children.find(x=>x.id===id)||null};
   doc.createElement=function(tag){return{id:tag,style:css(),textContent:''}};
   doc.addEventListener=function(){};
   var s={running:false,mode:'audio',page:4,progress:.1,paused:false,scaleMode:'normal',
     surfaceBusy:false,userScrolling:false};
   var edition='original',scale=100,active220=true,callbacks=0;
   var w={__BASAIR_B345_SEQUENCE__:{state:s},
     __BASAIR_PRINT_FOLLOW_100__:{active:()=>true,edition:()=>edition,scale:()=>scale},
     __BASAIR_P220_ORIGINAL_AUDIO_FOLLOW__:{status:()=>({active:active220})},
     setInterval(){callbacks++;return callbacks},clearInterval(){callbacks--}};
   new Function('window','document',src)(w,doc);
   var api=w.__BASAIR_P221_VISIBLE_PRINT_FOLLOW__;
   return{api,s,body,reader,pageReading,stack,head,w,
     nativeMove:px=>{nativeYOffset+=px},
     toggle220:x=>active220=x,zoom:x=>scale=x,edition:x=>edition=x,visualTop:()=>rect(s.page).top,
     shift:()=>shift};
 }
 function advance(x,n=4,delta=.0006){for(var i=0;i<n;i++){x.s.progress+=delta;x.api.refresh()}}
 var a=boot('reader');
 ck('P221 module registered',a.api&&a.api.version===221);
 ck('initial no takeover',a.api.status().mode==='off');
 a.s.running=true;a.s.mode='silent';a.api.refresh();
 ck('silent original mode border clean active',a.body.classList.contains('p221-original-silent-clean'));
 ck('silent does not move native scroller',a.reader.scrollTop===0&&a.pageReading.scrollTop===0);
 ck('silent style has no shadow/synthetic border',a.head.children[0].textContent.includes('>.stableFrame{display:none!important}'));
 a.s.mode='audio';a.api.refresh();
 ck('audio activation clears silent-only class',!a.body.classList.contains('p221-original-silent-clean'));
 ck('audio requires working P220 and shows existing native stack',a.body.classList.contains('p221-original-audio-visual'));
 a.s.progress+=.0006;a.api.refresh();
 ck('one small native progress delta does NOT cause jump',a.reader.scrollTop===0);
 advance(a,3);
 ck('cumulative 0.24pct progress detected at ordinary audio speed',a.api.status().stalledProgressEvents>=1);
 ck('native visible reader scroller corrected',a.reader.scrollTop>0&&a.api.status().scrollCorrected===1);
 ck('visual R33 card actually moved',a.visualTop()<80);
 ck('scroll owner recorded correctly',a.api.status().visualOwner==='scroll');
 ck('no duplicate frame or Quran clone',!src.includes("createElement('img')")&&!src.includes('cloneNode('));
 ck('no new audio clock, no audio method call',!src.includes('currentTime')&&!src.includes('playbackRate')&&!src.includes('.startAudio('));
 var before=a.reader.scrollTop;a.s.paused=true;a.s.progress+=.1;a.api.refresh();
 ck('paused audio leaves current page stationary',a.reader.scrollTop===before);
 a.s.paused=false;a.s.running=false;a.api.refresh();
 ck('stop removes only P221 scoped classes',!a.body.classList.contains('p221-original-audio-visual'));
 ck('stop leaves native B345 state untouched',!a.s.running&&a.stack.style.getPropertyValue('transform')==='');
 var b=boot('pageReading');b.s.running=true;b.api.refresh();advance(b);
 ck('wrong reader scrollTop does not count as success',b.reader.scrollTop===0);
 ck('uses inner pageReading scroll if it visibly moves page',b.pageReading.scrollTop>0&&b.api.status().scrollCorrected===1);
 var c=boot('none');c.s.running=true;c.api.refresh();advance(c);
 ck('both nonvisual scroll writes are restored',c.reader.scrollTop===0&&c.pageReading.scrollTop===0);
 ck('native stack translation is last resort',c.api.status().visualOwner==='native-stack'&&c.api.status().stackCorrected===1);
 ck('fallback translates same native stack visibly',c.shift()<0&&c.visualTop()<80);
 ck('fallback does not create image frames',c.head.children.length===1&&!src.includes("createElement('section')"));
 var previous=c.shift();c.s.progress+=.001;c.api.refresh();
 ck('fallback continuously follows native progress',c.shift()<previous);
 var pausedShift=c.shift();c.s.paused=true;c.s.progress+=.2;c.api.refresh();
 ck('fallback freezes while paused',c.shift()===pausedShift);
 c.s.paused=false;c.s.running=false;c.api.refresh();
 ck('stack transform restored exactly on stop',c.shift()===0&&c.stack.style.getPropertyValue('transform')==='');
 var d=boot('native');d.s.running=true;d.api.refresh();
 for(var i=0;i<4;i++){d.s.progress+=.0006;d.nativeMove(2);d.api.refresh()}
 ck('already visible native page motion is not overridden',d.reader.scrollTop===0&&d.shift()===0);
 ck('existing visual motion detected',d.api.status().visibleMovementEvents>=1);
 var e=boot('none');e.s.running=true;e.api.refresh();
 e.s.progress=null;e.api.refresh();e.api.refresh();
 ck('null progress not mistaken for zero timing',e.api.status().visualCorrections===0);
 var f=boot('none');f.s.running=true;f.api.refresh();f.s.progress=.1001;f.api.refresh();
 f.s.userScrolling=true;advance(f);
 ck('manual user gesture not overridden',f.shift()===0&&f.reader.scrollTop===0);
 var g=boot('reader');g.s.running=true;g.toggle220(false);g.api.refresh();
 ck('fail closed if P220 runtime not active',g.api.status().mode==='off');
 var h=boot('reader');h.s.running=true;h.edition('tajwid');h.api.refresh();
 ck('colored Tajwid edition excluded',h.api.status().mode==='off');
 h.edition('original');h.zoom(125);h.api.refresh();
 ck('zoomed print edition excluded',h.api.status().mode==='off');
 h.zoom(100);h.body.classList.add('stableDigital');h.api.refresh();
 ck('digital typeface excluded',h.api.status().mode==='off');
 var j=boot('reader');j.s.running=true;j.api.refresh();j.s.page=5;j.s.progress=.01;j.api.refresh();
 ck('page change resets old progress proof without wrong scroll',j.reader.scrollTop===0&&j.api.status().page===5);
 j.s.mode='silent';j.api.refresh();
 ck('audio to silent clears audio class but keeps border cleanup',!j.body.classList.contains('p221-original-audio-visual')&&j.body.classList.contains('p221-original-silent-clean'));
 j.api.disable();
 ck('disable removes all corrective classes',!j.body.classList.contains('p221-original-silent-clean')&&j.api.status().enabled===false);
 j.api.enable();
 ck('explicit re-enable only acts in proper silent mode',j.api.status().mode==='silent');
 var old=j.api;
 new Function('window','document',src)(j.w,{});
 ck('singleton prevents accidental duplicate hook',old===j.w.__BASAIR_P221_VISIBLE_PRINT_FOLLOW__);
 ck('no persistent user setting or APK mutation',!src.includes('localStorage')&&!src.includes('indexedDB')&&!src.includes('fetch('));
 return{passed:count,failed:fail.length,errors:fail,scope:'Mock card geometry only; Android on-device motion not proven'};
};
})(typeof window!=='undefined'?window:globalThis);
