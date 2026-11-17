/* P205: colored Tajwid follows EXACTLY the original R33 normal-print engine.
   No fixed overlay, clone, new frame, sound-clock change or APK build.
   Only images: original remote Tajwid CDN -> bundled Tajwid WEBP. */
(function(){
 'use strict';
 var VERSION='BASAIR-P205-TAJWID-ORIGINAL-PARITY/1.0.0';
 var MODES=['original','tajwid','blue'];
 /* Exact RC18 Tajwid sources from the accepted R30 index. */
 
 
 var sourceCache={};
 var stats={shellsCreated:0,cardsLoaded:0,cardsFailed:0,existingSourceHits:0,preloadRequests:0,ayahRetargets:0,staticFreezes:0};
 var frozen={active:false,page:0,edition:'',scrollTop:0};
 function E(id){return document.getElementById(id)}
 function clampPage(p){p=Number(p)||1;return Math.max(1,Math.min(604,p))}
 function read(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}
 function edition(){var k=read('v129PrintMode','original');if(k==='muallam')k='original';return MODES.indexOf(k)>=0?k:'original'}
 function stableFont(){return read('stableFont','original')||'original'}
 function scale(){var v=0;try{var z=window.__BASAIR_B330_ZOOM__;if(z&&typeof z.scale==='function')v=Number(z.scale())||0}catch(e){}if(!(v>0))v=Number(read('basair:tilawa-page-font-scale:v1','0'))||0;if(!(v>0)){var b=document.body,raw=b&&(b.getAttribute('data-b274-mushaf-scale')||b.getAttribute('data-b273-mushaf-scale'));v=Number(raw)||0}return v>0?v:100}
 function active(){var b=document.body;if(!b)return false;if(b.classList.contains('stableDigital')||stableFont()!=='original')return false;if(b.classList.contains('h25-hifz')||b.classList.contains('h90-review')||b.classList.contains('h100-teacher'))return false;if(scale()!==100)return false;return MODES.indexOf(edition())>=0}
 function ensureStyle(){if(E('r33PrintFollow100Style'))return;var s=document.createElement('style');s.id='r33PrintFollow100Style';s.textContent=
  '#b345NormalStack>.r33PrintShell{display:block!important;position:relative!important;width:100%!important;aspect-ratio:720/1280!important;min-height:1px!important;margin:0 auto 2px!important;padding:0!important;overflow:hidden!important;background:#fffdf8!important;color:transparent!important;border:0!important;border-radius:0!important;box-sizing:border-box!important;direction:rtl!important;touch-action:pan-y!important;-ms-touch-action:pan-y!important}' +
  '#b345NormalStack>.r33PrintShell:last-child{margin-bottom:0!important}' +
  '#b345NormalStack>.r33PrintShell>.r33PrintImage{display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:fill!important;object-position:center!important;opacity:1!important;visibility:visible!important;transform:none!important;transition:none!important;animation:none!important;background:#fffdf8!important;z-index:1!important;pointer-events:none!important;touch-action:pan-y!important}' +
  '#b345NormalStack>.r33PrintShell[data-print-edition="original"]>.r33PrintImage{filter:none!important}' +
  '#b345NormalStack>.r33PrintShell[data-print-edition="blue"]>.r33PrintImage{filter:grayscale(.06) sepia(.08) hue-rotate(145deg) saturate(.88) brightness(var(--readerBrightness,1)) contrast(var(--readerContrast,1))!important}' +
  '#b345NormalStack>.r33PrintShell[data-print-edition="tajwid"]>.r33PrintImage{filter:brightness(var(--readerBrightness,1)) contrast(var(--readerContrast,1))!important}' +
  '#b345NormalStack>.r33PrintShell>.r33PrintLoading{position:absolute!important;inset:0!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;text-align:center!important;background:#fffdf8!important;color:#6b5b46!important;font:800 12px Tahoma,Arial,sans-serif!important;z-index:0!important}' +
  '#b345NormalStack>.r33PrintShell[data-image-ready="1"]>.r33PrintLoading{display:none!important}' +
  '#b345NormalStack>.r33PrintShell>.ayahHitLayer{display:block!important;visibility:visible!important;opacity:1!important;position:absolute!important;inset:0!important;z-index:6!important;pointer-events:none!important;touch-action:pan-y!important;-ms-touch-action:pan-y!important}' +
  '#b345NormalStack>.r33PrintShell>.ayahHitLayer>.ayahHit{pointer-events:none!important;touch-action:pan-y!important;-ms-touch-action:pan-y!important;-webkit-user-select:none!important;user-select:none!important}';
 (document.head||document.documentElement).appendChild(s)}
 function srcOf(im){return im&&String(im.currentSrc||im.src||'')}
 function validImg(im){return !!(im&&im.complete&&Number(im.naturalWidth)>0&&Number(im.naturalHeight)>0&&srcOf(im))}
 function currentSource(p,k){p=clampPage(p);var q;if(k==='tajwid'){q=document.querySelector('#mushafReader .localPageStage>.rc18TajwidRaster[data-page="'+p+'"],#mushafReader .continuousImagePage>.rc18TajwidRaster[data-page="'+p+'"]');if(validImg(q)){stats.existingSourceHits++;return srcOf(q)}}q=document.querySelector('#mushafReader .localPageStage>img[data-mushaf-page="'+p+'"],#mushafReader .continuousImagePage>img[data-mushaf-page="'+p+'"]');if(validImg(q)){stats.existingSourceHits++;return srcOf(q)}return ''}
 function verifySource(src){return new Promise(function(resolve,reject){if(!src){reject(new Error('empty-source'));return}var im=new Image(),done=false;function finish(ok){if(done)return;done=true;im.onload=im.onerror=null;if(ok&&im.naturalWidth>0&&im.naturalHeight>0)resolve(src);else reject(new Error('image-load'))}im.onload=function(){finish(true)};im.onerror=function(){finish(false)};im.src=src;if(im.complete&&im.naturalWidth>0)setTimeout(function(){finish(true)},0)})}
 function originalSource(p){var cur=currentSource(p,'original');if(cur)return Promise.resolve(cur);var br=window.__BASAIR_PRINT_BRIDGE__;if(!br||typeof br.resolvePage!=='function')return Promise.reject(new Error('original-resolver-missing'));return Promise.resolve(br.resolvePage(p)).then(verifySource)}
 function tajwidSource(p){
  /* Image source is the ONLY colored-edition departure from the original print follow.
     604 complete 720x1280 WEBP pages are shipped inside the V694/V695 APK. */
  var url='assets/tajweed-pages/tajweed-'+String(clampPage(p)).padStart(3,'0')+'.webp';
  return verifySource(url);
 }
 function sourceFor(p,k){p=clampPage(p);k=MODES.indexOf(k)>=0?k:'original';var key=k+':'+p;if(sourceCache[key])return sourceCache[key];var promise=(k==='tajwid'?tajwidSource(p):originalSource(p));sourceCache[key]=Promise.resolve(promise).catch(function(e){delete sourceCache[key];throw e});return sourceCache[key]}
 function appendHits(card,p){try{var br=window.__BASAIR_PRINT_BRIDGE__,fn=br&&br.hitHTML;if(typeof fn!=='function'&&typeof window.hitHTML==='function')fn=window.hitHTML;if(typeof fn!=='function')return;var box=document.createElement('div');box.innerHTML=String(fn(p,false)||'');var hit=box.firstElementChild;if(hit)card.appendChild(hit)}catch(e){}}
 function shellFor(stack,p){return stack&&stack.querySelector('[data-r33-print-page="'+clampPage(p)+'"]')}
 function insertOrdered(stack,card,p){var xs=stack.querySelectorAll('[data-r33-print-page]'),before=null;for(var i=0;i<xs.length;i++){if(Number(xs[i].getAttribute('data-r33-print-page'))>p){before=xs[i];break}}if(before)stack.insertBefore(card,before);else stack.appendChild(card)}
 function createShell(stack,p,k,state){var card=shellFor(stack,p);if(card&&card.getAttribute('data-print-edition')===k)return card;if(card&&card.parentNode)card.parentNode.removeChild(card);card=document.createElement('section');card.className='b345ExactPage r33PrintShell';card.setAttribute('data-r33-print-page',String(p));card.setAttribute('data-print-edition',k);card.setAttribute('data-image-state','created');card.setAttribute('data-image-ready','0');card.setAttribute('data-b345-ready','0');if(state&&Number(state.normalPageHeightPx)>0){card.style.setProperty('height',Math.round(Number(state.normalPageHeightPx))+'px','important');card.style.setProperty('aspect-ratio','auto','important')}
  var loading=document.createElement('div');loading.className='r33PrintLoading';loading.textContent='جاري تجهيز صفحة المصحف…';card.appendChild(loading);var img=document.createElement('img');img.className='r33PrintImage';img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';img.loading='eager';card.appendChild(img);appendHits(card,p);var frame=document.createElement('div');frame.className='stableFrame';frame.setAttribute('aria-hidden','true');card.appendChild(frame);insertOrdered(stack,card,p);stats.shellsCreated++;return card}
 function loadShell(card,p,k){if(!card)return Promise.resolve(false);if(card.getAttribute('data-image-ready')==='1'&&card.getAttribute('data-b345-ready')==='1')return Promise.resolve(true);if(card.__r33LoadPromise)return card.__r33LoadPromise;var img=card.querySelector('.r33PrintImage');card.setAttribute('data-image-state','loading');card.__r33LoadPromise=sourceFor(p,k).then(function(src){return new Promise(function(resolve){var done=false;function finish(ok){if(done)return;done=true;img.onload=img.onerror=null;card.__r33LoadPromise=null;if(ok&&img.naturalWidth>0&&img.naturalHeight>0){card.setAttribute('data-image-state','loaded');card.setAttribute('data-image-ready','1');card.setAttribute('data-b345-ready','1');card.setAttribute('data-b345-page',String(p));stats.cardsLoaded++;resolve(true)}else{card.setAttribute('data-image-state','failed');card.setAttribute('data-image-ready','0');card.setAttribute('data-b345-ready','0');card.removeAttribute('data-b345-page');img.removeAttribute('src');stats.cardsFailed++;resolve(false)}}img.onload=function(){finish(true)};img.onerror=function(){finish(false)};img.src=src;if(img.complete&&img.naturalWidth>0)setTimeout(function(){finish(true)},0)})}).catch(function(){card.__r33LoadPromise=null;card.setAttribute('data-image-state','failed');card.setAttribute('data-image-ready','0');card.setAttribute('data-b345-ready','0');card.removeAttribute('data-b345-page');if(img)img.removeAttribute('src');stats.cardsFailed++;return false});return card.__r33LoadPromise}
 function stageAhead(p,k,stack,state){[p+1,p+2].forEach(function(q){if(q>604)return;stats.preloadRequests++;var sh=createShell(stack,q,k,state);loadShell(sh,q,k).catch(function(){})})}
 function appendNormalPage(page,token,stack,state){if(!active()||!stack||edition()!=='tajwid')return Promise.resolve(false);ensureStyle();page=clampPage(page);var k=edition(),card=createShell(stack,page,k,state);/* Create vertical extent immediately. Manual scrolling is available even while P+1/P+2 images are loading. */stageAhead(page,k,stack,state);return loadShell(card,page,k)}

 /* Keep R33's original shell/render/scroll source code. Only the colored image
    resolver differs; the original print edition delegates to its untouched API.
    This avoids P199-P201 mirrors, overlay frames, or replacing B345 geometry. */
 var installed=false,attempts=0,nativeApi=null,oldAppend=null,controller=null,metricState=null,metricBase=0;
 function eligible(){
   var b=document.body,s=controller&&controller.state;
   return !!(b&&s&&s.running&&s.scaleMode==='normal'&&active()&&edition()==='tajwid'&&b.classList.contains('reader-active'));
 }
 function metrics(){
   var s=controller&&controller.state;
   if(!s)return false;
   if(metricState===s)return true;
   var old=Object.getOwnPropertyDescriptor(s,'normalAnchorFontPx');
   if(old&&!old.configurable)return false;
   if(old&&(old.get||old.set))return false;
   metricBase=Number(s.normalAnchorFontPx)||0;
   try{
     Object.defineProperty(s,'normalAnchorFontPx',{
       configurable:true,enumerable:true,
       get:function(){return metricBase>0?metricBase:eligible()?18:0},
       set:function(x){metricBase=Number(x)||0}
     });
     metricState=s;return true;
   }catch(_){return false}
 }
 function install(){
   if(installed)return true;
   nativeApi=window.__BASAIR_PRINT_FOLLOW_100__;
   controller=window.__BASAIR_B345_SEQUENCE__;
   if(!nativeApi||!controller||!controller.state||typeof nativeApi.appendNormalPage!=='function')return false;
   if(nativeApi.appendNormalPage.__p205Parity){installed=true;return true}
   if(!metrics())return false;
   oldAppend=nativeApi.appendNormalPage;
   var fn=function(page,token,stack,state){
     if(!eligible())return oldAppend.apply(nativeApi,arguments);
     return appendNormalPage(page,token,stack,state);
   };
   fn.__p205Parity=true;
   nativeApi.appendNormalPage=fn;
   installed=true;
   return true;
 }
 function boot(){if(install())return;if(++attempts<70)window.setTimeout(boot,150)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.__BASAIR_P205_ORIGINAL_PRINT_PARITY__={version:205,install:install,status:function(){
   return{installed:installed,eligible:eligible(),edition:edition(),loaded:stats.cardsLoaded,failed:stats.cardsFailed,
   preloads:stats.preloadRequests,originalDelegated:!!oldAppend,page:controller&&controller.state&&controller.state.page};
 }};
})();
