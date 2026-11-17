/* BASAIR P198 — restore Tajwid 100% follow with OFFLINE local-page ownership.
 * V695 + QA-050: no edits to Quran rasters, typography, P193 or P194.
 * Source-verified from the V694 owner-signed APK: all 604 local Tajwid
 * images exist at assets/tajweed-pages/tajweed-NNN.webp.
 * Original R33 requests pages after the visible one via external CDNs;
 * B345 refuses to advance until data-b345-ready=1. P198 reuses the
 * existing exact B345 scroll surface and loads packaged images instead.
 */
(function (w, d) {
  'use strict';
  if (w.__BASAIR_P198_TAJWID_LOCAL_FOLLOW__) return;
  var nativeApi=null, controller=null, installed=false, anchorState=null, anchorBase=0;
  var tries=0, loaded=0, failed=0, bypasses=0, cssReady=false;
  var pending={};
  function el(id){return d.getElementById(id)}
  function eligible(){
    var b=d.body, p=nativeApi, state=controller&&controller.state;
    if(!b||!p||!state||!state.running||state.scaleMode!=='normal')return false;
    if(!b.classList.contains('reader-active')||b.classList.contains('stableDigital')||b.classList.contains('h25-hifz')||b.classList.contains('h90-review')||b.classList.contains('h100-teacher'))return false;
    if(b.getAttribute('data-v144-print')!=='tajwid')return false;
    try{return p.active()&&p.edition()==='tajwid'&&Number(p.scale())===100;}catch(_){return false}
  }
  function ensureMetric(){
    var s=controller&&controller.state;
    if(!s||s===anchorState)return !!s;
    var prior=Object.getOwnPropertyDescriptor(s,'normalAnchorFontPx');
    if(prior&&!prior.configurable)return false;
    if(prior&&(prior.get||prior.set))return false;
    anchorBase=Number(s.normalAnchorFontPx)||0;
    try{
      Object.defineProperty(s,'normalAnchorFontPx',{
        enumerable:true,configurable:true,
        get:function(){if(anchorBase>0)return anchorBase;if(eligible()){bypasses++;return 18;}return 0;},
        set:function(v){anchorBase=Number(v)||0;}
      });
      anchorState=s;return true;
    }catch(_){return false;}
  }
  function isReady(card,p){
    if(!card||card.getAttribute('data-b345-ready')!=='1'||Number(card.getAttribute('data-b345-page'))!==p)return false;
    var im=card.querySelector('.r33PrintImage');
    return !!(im&&im.complete&&im.naturalWidth>0);
  }
  function pageSrc(p){return 'assets/tajweed-pages/tajweed-'+String(p).padStart(3,'0')+'.webp';}
  function cardAt(stack,p){return stack&&stack.querySelector('[data-r33-print-page="'+p+'"]');}
  function ensureStyles(){
    if(cssReady)return;
    cssReady=true;
    /* P198 styling delivered as a separate signed CSS asset. */
  }
  function appendHitTargets(card,p){
    try{
      var bridge=w.__BASAIR_PRINT_BRIDGE__,fn=bridge&&bridge.hitHTML;
      if(typeof fn!=='function'&&typeof w.hitHTML==='function')fn=w.hitHTML;
      if(typeof fn!=='function')return;
      var x=d.createElement('div');x.innerHTML=String(fn(p,false)||'');
      if(x.firstElementChild)card.appendChild(x.firstElementChild);
    }catch(_){}
  }
  function shell(stack,p,state){
    var node=cardAt(stack,p);
    if(node&&node.getAttribute('data-print-edition')==='tajwid')return node;
    if(node)node.remove();
    node=d.createElement('section');node.className='b345ExactPage r33PrintShell';
    node.setAttribute('data-r33-print-page',String(p));node.setAttribute('data-print-edition','tajwid');
    node.setAttribute('data-b345-ready','0');node.setAttribute('data-image-ready','0');
    node.setAttribute('data-image-state','loading');
    if(state&&Number(state.normalPageHeightPx)>0){
      node.style.setProperty('height',Math.round(Number(state.normalPageHeightPx))+'px','important');
      node.style.setProperty('aspect-ratio','auto','important');
    }
    var img=d.createElement('img');img.className='r33PrintImage';img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';img.loading='eager';
    var msg=d.createElement('div');msg.className='r33PrintLoading';msg.textContent='جاري تجهيز صفحة المصحف…';
    node.appendChild(msg);node.appendChild(img);appendHitTargets(node,p);
    var frame=d.createElement('div');frame.className='stableFrame';frame.setAttribute('aria-hidden','true');node.appendChild(frame);
    var siblings=stack.querySelectorAll('[data-r33-print-page]'),before=null;
    for(var i=0;i<siblings.length;i++)if(Number(siblings[i].getAttribute('data-r33-print-page'))>p){before=siblings[i];break;}
    if(before)stack.insertBefore(node,before);else stack.appendChild(node);
    return node;
  }
  function load(stack,p,state){
    if(!stack||p<1||p>604||!eligible())return Promise.resolve(false);
    ensureStyles();
    var card=shell(stack,p,state),img=card.querySelector('.r33PrintImage');
    if(isReady(card,p))return Promise.resolve(true);
    var key=String(p),same=pending[key];
    if(same&&same.card===card)return same.job;
    var job=new Promise(function(resolve){
      var settled=false;
      function done(ok){
        if(settled)return;settled=true;img.onload=img.onerror=null;
        if(ok&&card.isConnected&&eligible()){
          card.setAttribute('data-b345-ready','1');card.setAttribute('data-b345-page',String(p));
          card.setAttribute('data-image-ready','1');card.setAttribute('data-image-state','loaded');loaded++;resolve(true);
        }else{
          card.setAttribute('data-b345-ready','0');card.removeAttribute('data-b345-page');
          card.setAttribute('data-image-ready','0');card.setAttribute('data-image-state','failed');failed++;resolve(false);
        }
      }
      img.onload=function(){done(img.naturalWidth>0&&img.naturalHeight>0)};
      img.onerror=function(){done(false)};
      img.src=pageSrc(p);
      if(img.complete&&img.naturalWidth>0)w.setTimeout(function(){done(true)},0);
    });
    pending[key]={card:card,job:job};
    return job.then(function(ok){if(pending[key]&&pending[key].card===card)delete pending[key];return ok;});
  }
  function render(p,token,stack,state){
    if(!eligible()||!stack)return nativeApi.__p198OriginalAppend.apply(nativeApi,arguments);
    p=Math.max(1,Math.min(604,Number(p)||1));
    // Create the next card immediately so WebView's scroll range is nonzero.
    for(var i=p+1;i<=Math.min(604,p+2);i++)load(stack,i,state).catch(function(){});
    return load(stack,p,state);
  }
  function install(){
    if(installed)return true;
    nativeApi=w.__BASAIR_PRINT_FOLLOW_100__;
    controller=w.__BASAIR_B345_SEQUENCE__;
    if(!nativeApi||!controller||!controller.state||typeof nativeApi.appendNormalPage!=='function')return false;
    if(!ensureMetric())return false;
    if(nativeApi.appendNormalPage.__p198Wrapped){installed=true;return true;}
    nativeApi.__p198OriginalAppend=nativeApi.appendNormalPage;
    var wrap=function(page,token,stack,state){return render(page,token,stack,state)};
    wrap.__p198Wrapped=true;
    nativeApi.appendNormalPage=wrap;installed=true;return true;
  }
  function boot(){if(install())return;if(++tries<=50)w.setTimeout(boot,200)}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  w.__BASAIR_P198_TAJWID_LOCAL_FOLLOW__={version:198,install:install,status:function(){
    return{installed:installed,printed:eligible(),loaded:loaded,failed:failed,metricBypasses:bypasses,pending:Object.keys(pending).length,
      livePage:controller&&controller.state&&controller.state.page,
      follow:controller&&typeof controller.snapshot==='function'?controller.snapshot().running:false};
  }};
})(window,document);
