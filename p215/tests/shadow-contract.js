/* P215 — isolated source-contract tests for original V695 digital DOM.
 * Call window.__BASAIR_P215_SHADOW_TESTS__(shadowSource,shadowCss).
 * Mock DOM proves safety only; Android real-scroll/audio needs owner acceptance.
 */
(function(root){
 'use strict';
 root.__BASAIR_P215_SHADOW_TESTS__=function(src,css){
   var total=0,failed=[],functions=0,tasks=0,windowListeners={};
   function ck(name,ok){total++;if(!ok)failed.push(name);}
   function classes(list){
     var x=new Set(list||[]);
     return{contains:function(k){return x.has(k)},add:function(k){x.add(k)},
       remove:function(k){x.delete(k)}};
   }
   function word(s,a,t,y){
     var el={textContent:t,classList:classes(),pos:y,visible:true,
       getAttribute:function(k){return k==='data-s'?String(s):k==='data-selectayah'?String(a):null;},
       getBoundingClientRect:function(){return {top:this.pos,bottom:this.pos+28,height:28,width:70}}};
     return el;
   }
   function card(n){
     return{children:n,querySelectorAll:function(q){if(q.indexOf('v160Ayah')>=0)return n.filter(function(x){return x.ayah===true});
       return n.filter(function(x){return x.word!==false});}};
   }
   function host(cardRef,zoom){
     return{c:cardRef,querySelector:function(q){
       return q.indexOf(zoom?'b345ZoomPage':'b345ExactPage')>=0?this.c:null;},
       getAttribute:function(k){return k==='data-b345-sequence-stack'?'zoom':k==='data-b327-page'?'4':null;}};
   }
   var first=word(2,1,'الٓمٓ',280),second=word(2,1,'كلمة',307),third=word(2,2,'ذَٰلِكَ',540);
   var normal=card([first,second,third]),normalHost=host(normal,false);
   var z1=word(2,1,'الٓمٓ',285),z2=word(2,2,'ذلك الكتاب',545),nested=word(2,2,'كتاب',548);
   z1.ayah=z2.ayah=true;nested.ayah=false;
   var zoom=card([z1,z2,nested]),zoomHost=host(zoom,true);
   var b=classes(['reader-active','stableDigital']);
   var doc={body:{classList:b},readyState:'loading',hidden:false,events:{},
     addEventListener:function(type,fn){this.events[type]=fn;},
     getElementById:function(id){return id==='b345NormalStack'?normalHost:
       id==='b274LargeTextHost'?zoomHost:id==='stableDigitalHost'?normalHost:null;}};
   var state={running:true,paused:false,page:4,scaleMode:'normal',mode:'silent',exactAyahAudio:false};
   var core={status:function(){return {route:'digital',running:true}}};
   var startSilent=function(){functions++},stop=function(){functions++};
   var native={state:state,startSilent:startSilent,stop:stop};
   var win={innerHeight:800,getComputedStyle:function(){return {display:'block',visibility:'visible'};},
     setTimeout:function(){tasks++;return tasks},
     __BASAIR_P213_FOLLOW__:core,__BASAIR_B345_SEQUENCE__:native};
   new Function('window','document',src)(win,doc);
   var api=win.__BASAIR_P215_DIGITAL_SHADOW__;
   ck('runtime registered',!!api&&api.version===215);
   ck('no background loop before DOM ready',tasks===0);
   ck('100% shade starts',api._test.tick()===true);
   ck('100% entire active ayah shaded',first.classList.contains('p215ShadowMark')&&second.classList.contains('p215ShadowMark')&&!third.classList.contains('p215ShadowMark'));
   ck('native start and stop untouched',native.startSilent===startSilent&&native.stop===stop&&functions===0);
   ck('guide is visual rather than invented audio',api.status().quality==='visible-reading-guide');
   var before=api.status().changes;
   api._test.tick();
   ck('stable same target does not flicker',api.status().changes===before);
   state.paused=true;first.pos=600;second.pos=620;third.pos=286;
   api._test.tick();
   ck('pause freezes shade',first.classList.contains('p215ShadowMark')&&second.classList.contains('p215ShadowMark')&&!third.classList.contains('p215ShadowMark'));
   state.paused=false;api._test.tick();
   ck('resume selects visible target',third.classList.contains('p215ShadowMark')&&!first.classList.contains('p215ShadowMark'));
   state.mode='audio';state.exactAyahAudio=true;state.exactAyahPage=4;state.exactAyahSurah=2;state.exactAyah=1;
   api._test.tick();
   ck('exact per-ayah audio overrides guide',first.classList.contains('p215ShadowMark')&&!third.classList.contains('p215ShadowMark')&&api.status().quality==='exact-audio');
   state.running=false;api._test.tick();
   ck('stop cleans shade, leaves Quran DOM',!first.classList.contains('p215ShadowMark')&&!second.classList.contains('p215ShadowMark')&&first.textContent==='الٓمٓ');
   state.running=true;state.mode='silent';state.exactAyahAudio=false;
   core.status=function(){return{route:'printed',running:true}};api._test.tick();
   ck('print never shaded',!first.classList.contains('p215ShadowMark'));
   core.status=function(){return{route:'digital',running:true}};
   b.add('h25-hifz');api._test.tick();ck('hifz excluded',!api.status().active);
   b.remove('h25-hifz');
   state.scaleMode='zoom';state.page=5;
   api._test.tick();
   ck('zoom v160Ayah shaded',z1.classList.contains('p215ShadowMark'));
   ck('zoom nested word not double shaded',!nested.classList.contains('p215ShadowMark'));
   z1.pos=590;z2.pos=275;api._test.tick();
   ck('zoom highlight advances',!z1.classList.contains('p215ShadowMark')&&z2.classList.contains('p215ShadowMark'));
   state.paused=true;state.page=6;zoomHost.c=card([word(2,3,'تجربة',280)]);
   api._test.tick();
   ck('page switch resets old shade',!z2.classList.contains('p215ShadowMark')&&api.status().page===6);
   state.paused=false;api.disable();
   ck('disable affects shade only',api.status().enabled===false&&!api.status().active&&state.running===true);
   ck('re-enable without changing native follow',api.enable()===true&&state.running===true);
   api.disable();state.scaleMode='normal';state.page=4;normalHost.c=normal;state.mode='silent';
   api.enable();
   normal.querySelectorAll=function(){throw Error('invalid shadow selector')};
   api._test.tick();api._test.tick();api._test.tick();
   ck('3 failures fail closed and clear visual',api.status().locked===true&&api.status().enabled===false&&!api.status().active);
   ck('locked shade cannot reactivate',api.enable()===false);
   ck('no native engine changes after shadow fault',native.startSilent===startSilent&&native.stop===stop&&state.running===true);
   ck('dark and normal contrast rules',css.indexOf('body.dark.reader-active.stableDigital')>=0&&css.indexOf('.v160Ayah.p215ShadowMark')>=0);
   ck('no layout/text metrics edited in CSS',css.indexOf('font-size:')<0&&css.indexOf('line-height:')<0&&css.indexOf('transform:')<0);
   return{passed:total-failed.length,failed:failed.length,errors:failed};
 };
})(typeof window!=='undefined'?window:globalThis);
