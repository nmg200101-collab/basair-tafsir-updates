/* BASAIR P93.1 — Owner QA 003 | KFQC Hafs Uthmani SVG viewer.
 * Pinned upstream: quran-ws/quran-svg @ b4155f07e4aea087d2c458069acff9f7c7e749f6
 * Only visual page images; does not change Quran text, navigation, audio or hit targets.
 * Opening pages 1/2 fit vector ink bounds after a frame, with a safe fallback.
 * Original image remains visible until an independent vector page is fully loaded.
 */
(function () {
  'use strict';
  if (window.__BASAIR_P931_UTHMANI__) return;
  var SOURCE='https://raw.githubusercontent.com/quran-ws/quran-svg/b4155f07e4aea087d2c458069acff9f7c7e749f6/mushafs/hafs/kfqc/svg/';
  var root=document.getElementById('mushafReader'),body=document.body;
  if(!root||!body||!window.MutationObserver||!window.DOMParser||!window.XMLSerializer)return;
  var EXCLUDE='.h25-hifz,.h90-review,.h100-teacher,.stableDigital';
  var CACHE_LIMIT=10,MAX_SVG_CHARS=1200000;
  var cache=new Map(),scanScheduled=false;
  var state={loaded:0,failures:0,lastError:''};
  function active(){return body.getAttribute('data-v144-print')==='blue'&&!body.matches(EXCLUDE)}
  function pageOf(stage){
    var im=stage.querySelector('img[data-mushaf-page]');
    var n=Number(im&&im.getAttribute('data-mushaf-page'))||Number(stage.getAttribute('data-contpage'))||0;
    return n>=1&&n<=604&&Number.isInteger(n)?n:0;
  }
  function notice(stage,message){
    var n=stage.querySelector(':scope>.p931Notice');
    if(!message){if(n)n.remove();return;}
    if(!n){n=document.createElement('div');n.className='p931Notice';n.setAttribute('role','status');stage.appendChild(n);}
    if(n.textContent!==message)n.textContent=message;
  }
  function reset(stage){
    if(stage.classList.contains('p931-uthmani-ready'))stage.classList.remove('p931-uthmani-ready');
    notice(stage,'');
  }
  function safeSvg(svg){
    if(!svg||svg.localName!=='svg'||svg.namespaceURI!=='http://www.w3.org/2000/svg')throw Error('صيغة صفحة غير صالحة');
    // The artwork is fetched from one immutable commit. Remove scripting and external dependencies.
    var forbidden=svg.querySelectorAll('script,foreignObject,iframe,object,embed,image,video,audio');
    forbidden.forEach(function(n){n.remove();});
    [svg].concat(Array.from(svg.querySelectorAll('*'))).forEach(function(node){
      Array.from(node.attributes||[]).forEach(function(a){
        if(/^on/i.test(a.name)||(/^(?:href|xlink:href)$/i.test(a.name)&&!/^#[\w.-]+$/.test(a.value))||(/url\(\s*['"]?(?:https?:|javascript:|data:)/i.test(a.value)))node.removeAttribute(a.name);
      });
    });
  }
  async function normalizedSvg(txt,p){
    if(txt.length>MAX_SVG_CHARS||txt.length<200||/<!DOCTYPE|<!ENTITY/i.test(txt))throw Error('حجم أو محتوى SVG غير متوقع');
    var doc=new DOMParser().parseFromString(txt,'image/svg+xml');
    if(doc.querySelector('parsererror'))throw Error('تعذر تحليل SVG');
    var svg=doc.documentElement;
    safeSvg(svg);
    if(p===1||p===2){
      // KFQC opening pages carry a 345x550 spread viewBox but only ~222x275 units
      // of ink. Fit after layout as documented by the source; never crop on error.
      var host=document.createElement('div');
      host.style.cssText='position:fixed;left:-20000px;top:0;width:345px;height:550px;visibility:hidden;pointer-events:none;overflow:visible';
      var displayed=document.importNode(svg,true);
      displayed.setAttribute('width','345');displayed.setAttribute('height','550');
      host.appendChild(displayed);document.body.appendChild(host);
      try {
        await new Promise(function(resolve){(window.requestAnimationFrame||function(f){return setTimeout(f,0);})(resolve);});
        var b=displayed.getBBox();
        if(b && [b.x,b.y,b.width,b.height].every(Number.isFinite) && b.width>60 && b.height>70 && b.width<=345 && b.height<=550){
          var pad=Math.max(b.width,b.height)*0.04;
          svg.setAttribute('viewBox',[b.x-pad,b.y-pad,b.width+2*pad,b.height+2*pad].join(' '));
        }
      } catch (e) { /* preserve upstream viewBox; original fallback remains */ }
      finally{host.remove();}
    }
    svg.removeAttribute('width');svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    return new XMLSerializer().serializeToString(svg);
  }
  function cachePage(p,url){
    cache.set(p,url);
    while(cache.size>CACHE_LIMIT){
      var oldest=cache.keys().next().value;
      var u=cache.get(oldest);cache.delete(oldest);
      try{URL.revokeObjectURL(u);}catch(e){}
    }
    return url;
  }
  async function loadPage(p){
    var stored=cache.get(p);
    if(stored){cache.delete(p);cache.set(p,stored);return stored;}
    // Deduplicate repeated DOM mutation checks while a page is downloading.
    if(loadPage.pending.has(p))return loadPage.pending.get(p);
    var task=(async function(){
      var c=new AbortController(),timer=setTimeout(function(){c.abort();},16000);
      try{
        var res=await fetch(SOURCE+String(p).padStart(3,'0')+'.svg',{
          cache:'force-cache',mode:'cors',credentials:'omit',redirect:'error',signal:c.signal
        });
        if(!res.ok)throw Error('استجابة المصدر '+res.status);
        var txt=await res.text();
        var cleaned=await normalizedSvg(txt,p);
        return cachePage(p,URL.createObjectURL(new Blob([cleaned],{type:'image/svg+xml'})));
      }finally{clearTimeout(timer);}
    })();
    loadPage.pending.set(p,task);
    try{return await task;}finally{loadPage.pending.delete(p);}
  }
  loadPage.pending=new Map();
  function handle(stage){
    if(!active()){reset(stage);var old=stage.querySelector(':scope>img.p931SvgRaster');if(old)old.remove();return;}
    var p=pageOf(stage);
    if(!p){reset(stage);return;}
    var im=stage.querySelector(':scope>img.p931SvgRaster');
    if(im&&im.getAttribute('data-p931-page')===String(p)){
      if(im.dataset.p931Loaded==='1')stage.classList.add('p931-uthmani-ready');
      return;
    }
    reset(stage);
    if(im)im.remove();
    im=document.createElement('img');
    im.className='p931SvgRaster';im.alt='';im.setAttribute('aria-hidden','true');
    im.setAttribute('data-p931-page',String(p));im.loading='eager';im.decoding='async';
    im.onerror=function(){
      if(!im.isConnected||im.getAttribute('data-p931-page')!==String(pageOf(stage)))return;
      stage.classList.remove('p931-uthmani-ready');
      state.failures++;state.lastError='page '+p;
      notice(stage,'تعذّر تحميل الصفحة العثمانية؛ تظهر الأصلية مؤقتًا');
    };
    im.onload=function(){
      if(!im.isConnected||!active()||im.getAttribute('data-p931-page')!==String(pageOf(stage)))return;
      if(!im.naturalWidth||!im.naturalHeight){im.onerror();return;}
      im.dataset.p931Loaded='1';notice(stage,'');stage.classList.add('p931-uthmani-ready');state.loaded++;
    };
    stage.insertBefore(im,stage.querySelector('.ayahHitLayer')||null);
    loadPage(p).then(function(url){
      if(im.isConnected&&active()&&p===pageOf(stage))im.src=url;
    }).catch(function(){im.onerror();});
  }
  function scan(){
    scanScheduled=false;
    root.querySelectorAll('.localPageStage,.continuousImagePage').forEach(handle);
  }
  function schedule(){
    if(scanScheduled)return;
    scanScheduled=true;
    (window.requestAnimationFrame||function(f){return Promise.resolve().then(f);})(scan);
  }
  var pageObserver=new MutationObserver(function(mutations){
    if(mutations.some(function(m){return m.type==='childList'||m.attributeName==='data-mushaf-page'||m.attributeName==='data-contpage';}))schedule();
  });
  pageObserver.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-mushaf-page','data-contpage']});
  var modeObserver=new MutationObserver(schedule);
  modeObserver.observe(body,{attributes:true,attributeFilter:['data-v144-print','class']});
  window.addEventListener('pageshow',schedule,false);
  window.addEventListener('pagehide',function(){cache.forEach(function(url){URL.revokeObjectURL(url);});cache.clear();});
  window.__BASAIR_P931_UTHMANI__={
    version:'P93.1-OWNER-QA-003',sourceCommit:'b4155f07e4aea087d2c458069acff9f7c7e749f6',status:state,resync:schedule
  };
  schedule();
})();
