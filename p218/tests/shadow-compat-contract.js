/* P218 focused DOM contract reproduces missing P215 host attributes.
 * Isolated mocked V695 markup; real WebView/audio acceptance still mandatory.
 */
(function(root){
root.__BASAIR_P218_TESTS__=function(src,css,legacy){
var passed=0,fail=[],disabled=0,enabled=0;
function ck(label,v){if(v)passed++;else fail.push(label)}
function cl(names){var s=new Set(names||[]);return{contains:k=>s.has(k),add:k=>s.add(k),remove:k=>s.delete(k)}}
function word(s,a,str,y){return{classList:cl([]),textContent:str,pos:y,
 getAttribute:k=>k==='data-s'?String(s):k==='data-selectayah'?String(a):null,
 getBoundingClientRect:function(){return{top:this.pos,bottom:this.pos+26,height:26,width:65}}}}
var x=word(2,1,'الم',290),y=word(2,1,'كلمة',313),z=word(2,2,'ذلك',542),
 u=word(2,1,'الم',288),v=word(2,2,'ذلك',542),nested=word(2,2,'كتاب',546);
var flow={querySelectorAll:q=>q.includes('.v160Ayah')?[u,v]:[u,v,nested]};
var normal={getAttribute:k=>null,querySelector:q=>q.includes('.exactLine')?{}:null,
 querySelectorAll:q=>[x,y,z]};
var zoom={getAttribute:k=>k==='data-b330-scroll-owner'?'b274LargeTextHost':
 k==='data-b345-sequence-stack'?'zoom':null,
 querySelector:q=>q.includes('.v160DigitalFlow')?flow:null};
var b={classList:cl(['reader-active','stableDigital'])};
var doc={body:b,hidden:false,readyState:'loading',listeners:{},
 addEventListener:function(k,f){this.listeners[k]=f},
 getElementById:k=>k==='stableDigitalHost'?normal:
 k==='b274LargeTextHost'?zoom:null};
var state={page:4,mode:'silent',running:true,paused:false,exactAyahAudio:false};
var core={status:()=>({route:'digital',running:true})};
var w={innerHeight:800,getComputedStyle:()=>({display:'block',visibility:'visible'}),
 setTimeout:function(){},__BASAIR_P213_FOLLOW__:core,__BASAIR_B345_SEQUENCE__:{state}};
new Function('window','document',legacy)(w,doc);
var old=w.__BASAIR_P215_DIGITAL_SHADOW__;
ck('P215 normal 100% misses host lacking data-b327-page',old._test.tick()===false);
w.__BASAIR_P215_DIGITAL_SHADOW__={status:old.status,
 disable:function(){disabled++;return old.disable()},
 enable:function(){enabled++;return old.enable()}};
new Function('window','document',src)(w,doc);
var a=w.__BASAIR_P218_SHADOW__;
ck('P218 registered',a&&a.version===218);
ck('no eager second owner',disabled===0&&!a.status().active);
var wrap=w.__BASAIR_P215_DIGITAL_SHADOW__,realStatus=wrap.status;
wrap.status=function(){var x=realStatus();return Object.assign({},x,{active:true})};
ck('existing P215 shade prevents P218 double ownership',
   a._test.tick()===false&&!a.status().owned&&disabled===0);
wrap.status=realStatus;
ck('first fallback tick waits',a._test.tick()===false&&disabled===0);
ck('second fallback tick owns shading',a._test.tick()===true&&disabled===1);
ck('only first verse words shaded at 100%',x.classList.contains('p218ShadowMark')&&
 y.classList.contains('p218ShadowMark')&&!z.classList.contains('p218ShadowMark'));
ck('original P215 disabled while P218 owns',old.status().enabled===false&&!old.status().active);
var changes=a.status().changes;a._test.tick();
ck('same target does not flicker',changes===a.status().changes);
state.paused=true;x.pos=600;y.pos=630;z.pos=290;a._test.tick();
ck('pause freezes original ayah',x.classList.contains('p218ShadowMark')&&
 y.classList.contains('p218ShadowMark')&&!z.classList.contains('p218ShadowMark'));
state.paused=false;a._test.tick();
ck('resume picks visible verse',z.classList.contains('p218ShadowMark')&&
 !x.classList.contains('p218ShadowMark'));
state.mode='audio';state.exactAyahAudio=true;
state.exactAyahPage=4;state.exactAyahSurah=2;state.exactAyah=1;
a._test.tick();
ck('exact audio verse overrides guide',a.status().quality==='exact-audio'&&
 x.classList.contains('p218ShadowMark')&&!z.classList.contains('p218ShadowMark'));
state.running=false;a._test.tick();
ck('stop clears new shade and restores old visual engine',!a.status().active&&
 old.status().enabled===true&&enabled===1);
state.running=true;state.exactAyahAudio=false;state.mode='silent';
b.classList.add('b274LargeMushaf');state.scaleMode='zoom';
ck('P215 zoom misses V160 flow without B345 zoom card',old._test.tick()===false);
ck('zoom waits for second inactive old tick',a._test.tick()===false);
ck('zoom accepts real V160 flow',a._test.tick()===true);
ck('zoom marks whole Ayah but never nested word',u.classList.contains('p218ShadowMark')&&
 !v.classList.contains('p218ShadowMark')&&!nested.classList.contains('p218ShadowMark'));
u.pos=590;v.pos=285;a._test.tick();
ck('zoom follows next visible ayah',!u.classList.contains('p218ShadowMark')&&
 v.classList.contains('p218ShadowMark'));
var originalZoomQuery=zoom.querySelector;
zoom.querySelector=function(){return null};
a._test.tick();
ck('missing zoom flow clears mark and rejects stale 100% fallback',
 !a.status().active&&!u.classList.contains('p218ShadowMark')&&
 !v.classList.contains('p218ShadowMark')&&
 !x.classList.contains('p218ShadowMark'));
zoom.querySelector=originalZoomQuery;
core.status=()=>({route:'printed',running:true});a._test.tick();
ck('printed route excluded',!a.status().active&&!v.classList.contains('p218ShadowMark'));
core.status=()=>({route:'digital',running:true});
b.classList.add('h25-hifz');a._test.tick();
ck('hifz excluded',!a.status().active);
b.classList.remove('h25-hifz');state.running=false;a._test.tick();
ck('never changes B345 running',state.running===false);
state.running=true;b.classList.remove('b274LargeMushaf');
ck('fallback reacquires ownership first wait',a._test.tick()===false);
ck('fallback reacquires ownership second tick',a._test.tick()===true&&a.status().owned);
a.disable();
ck('disabling P218 clears marker and returns visual ownership to P215',
 !a.status().owned&&!a.status().active&&!a.status().enabled&&
 old.status().enabled===true);
ck('disable has not modified native B345 running state',state.running===true);
a.enable();a._test.tick(); // reacquire after the two-tick handoff
ck('re-enabled P218 claims visual ownership again',a.status().owned===true);
old.enable(); // simulate external re-enable during P218 ownership
a._test.tick();
ck('external P215 re-enable yields ownership immediately',
 !a.status().owned&&!a.status().active&&old.status().enabled===true);

ck('night normal and zoom CSS declared',css.includes('body.dark.reader-active.stableDigital')&&
 css.includes('.quranWord.p218ShadowMark')&&css.includes('.v160Ayah.p218ShadowMark'));
ck('no font size/line/scroll geometry in CSS',!/(?:font-size|line-height|transform|position|scroll-behavior)\s*:/.test(css));
return{passed,failed:fail.length,errors:fail};
};
})(typeof window!=='undefined'?window:globalThis);
