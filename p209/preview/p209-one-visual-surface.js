/* P209 FOUNDATIONAL EXPERIMENT — NOT FOR RELEASE / DEFAULT OFF.
 * Basair Quran V695. Read-only visual projection of the native B345 page+progress
 * onto one foreground viewport using ORIGINAL print image sources, without a
 * second visible legacy stack. B345 remains sole owner of audio, timings and
 * page transitions; P207 stays owner of STOP -> original static DOM restoration.
 *
 * Activate ONLY in a controlled offline QA harness by setting:
 *     window.__BASAIR_P209_FIELD_QA_ENABLED__ = true;
 * before injecting the experiment. NEVER auto-enable in production.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P209_ONE_SURFACE__)return;
 var FLAG='__BASAIR_P209_FIELD_QA_ENABLED__',BODY_FLAG='data-p209-visual-owner';
 var S='p209VisualSurface',ST='p209VisualStyle',TOOLS='p209FollowControls';
 var editionKey='',images=Object.create(null),order=[],active=false,finishAt=0;
 var host=null,slots=[],toolbar=null,interval=0,raf=0,session=0,lastPaint='',lastPage=0;
 var stats={activations:0,restores:0,updates:0,fallbacks:0,fetchErrors:0,skipped:0,controlActions:0,tapsMapped:0,tapsSuppressed:0,tapMisses:0,restoreWaits:0,mode:'off',page:0,progress:0,edition:''};
 function id(k){return d.getElementById(k)}
 function native(){return w.__BASAIR_B345_SEQUENCE__}
 function print(){return w.__BASAIR_PRINT_FOLLOW_100__}
 function pageNumber(v){v=Number(v);return Number.isInteger(v)&&v>=1&&v<=604?v:0}
 function edition(){var p=print(),x='';try{x=p&&typeof p.edition==='function'?p.edition():''}catch(_){}
   return ['original','tajwid','blue'].indexOf(x)>=0?x:''}
 function eligible(){
  if(w[FLAG]!==true||!d.body||!d.body.classList.contains('reader-active'))return false;
  var b=d.body,c=native(),s=c&&c.state,p=print();
  if(!s||!s.running||s.scaleMode!=='normal'||s.surfaceBusy||!pageNumber(s.page))return false;
  if(b.classList.contains('stableDigital')||b.classList.contains('h25-hifz')||
     b.classList.contains('h90-review')||b.classList.contains('h100-teacher'))return false;
  if(!p||typeof p.active!=='function'||!p.active()||
     typeof p.scale!=='function'||Number(p.scale())!==100)return false;
  if(!edition()||!id('mushafReader')||!id('mushafDock')||!id('mushafPage'))return false;
  // Do not steal the visual stage until native B345 has its correct print page.
  var card=d.querySelector('#b345NormalStack>[data-b345-page="'+s.page+'"]');
  return !!(card&&card.getAttribute('data-b345-ready')==='1');
 }
 function style(){if(id(ST))return;
  var el=d.createElement('style');el.id=ST;
  el.textContent=
   '#'+S+'{position:fixed;z-index:60;display:none;overflow:hidden;'+
   'box-sizing:border-box;isolation:isolate;pointer-events:none;'+
   'background:var(--mushaf-paper,#fbf8e8);direction:rtl}'+
   '#'+S+'>.p209Page{position:absolute;inset:0;overflow:hidden;'+
   'width:100%;height:100%;will-change:transform;pointer-events:none}'+
   '#'+S+' .p209Page>img{display:block;position:absolute;inset:0;'+
   'width:100%;height:100%;object-fit:fill;pointer-events:none;'+
   'user-select:none;-webkit-user-drag:none;'+
   'filter:brightness(var(--readerBrightness,1)) contrast(var(--readerContrast,1))}'+
   'body.dark #'+S+' .p209Page>img{filter:invert(.92) hue-rotate(145deg) '+
   'saturate(.58) brightness(calc(.72*var(--readerBrightness,1))) contrast(1.12)}'+
   '#'+S+'[data-edition="blue"] .p209Page>img{filter:grayscale(.06) sepia(.08) '+
   'hue-rotate(145deg) saturate(.88) brightness(var(--readerBrightness,1)) '+
   'contrast(var(--readerContrast,1))}'+
   '#'+S+' .p209Page>.stableFrame{pointer-events:none}'+
   '#'+S+' .p209HitLayer{position:absolute!important;inset:0!important;'+
   'width:100%!important;height:100%!important;pointer-events:none!important;z-index:16!important}'+
   '#'+S+' .p209HitLayer .ayahHit{pointer-events:none!important}'+
   'body['+BODY_FLAG+'="1"] #b345NormalStack{opacity:0!important;'+
   'pointer-events:none!important}'+
   'body['+BODY_FLAG+'="1"] #sequenceMiniControl{display:none!important}'+
   'body['+BODY_FLAG+'="1"] #mushafReader::-webkit-scrollbar{display:none!important}'+
   'body['+BODY_FLAG+'="1"] #mushafReader{scrollbar-width:none!important}'+
   'body['+BODY_FLAG+'="1"] #mushafDock{height:calc(102px + '+
   'env(safe-area-inset-bottom))!important;'+
   'grid-template-columns:repeat(5,minmax(0,1fr))!important;'+
   'grid-template-rows:46px 54px!important;align-items:stretch!important}'+
   'body['+BODY_FLAG+'="1"] #mushafDock>:not(#'+TOOLS+'){'+
   'grid-row:2!important;min-width:0!important}'+
   '#'+TOOLS+'{grid-column:1/-1!important;grid-row:1!important;'+
   'display:flex;align-items:center;justify-content:center;gap:12px;'+
   'padding:2px 8px;direction:rtl;min-height:40px}'+
   '#'+TOOLS+'>button{display:inline-flex!important;flex-direction:row!important;'+
   'min-width:100px!important;min-height:37px!important;padding:6px 14px!important;'+
   'border:0!important;border-radius:20px!important;background:#25574a!important;'+
   'color:#fff!important;font:700 13px system-ui!important;gap:4px!important}'+
   '#'+TOOLS+'>button.p209Stop{background:#8b3329!important}';
  (d.head||d.documentElement).appendChild(el);
 }
 function copyApprovedDecoration(tile){
  // Clone ONLY passive decoration from the APPROVED static page, never its
  // Quran text/hit layers/reader controls. This preserves the selected
  // original frame/margin style without a second live Quran renderer.
  var stage=d.querySelector('#mushafText .localPageStage');
  var frame=stage&&stage.querySelector(':scope>.stableFrame');
  var tint=(stage&&stage.querySelector(':scope>.stableMarginTint'))||
           d.querySelector('#mushafPage>.stableMarginTint');
  function cleanIds(root){if(root.removeAttribute)root.removeAttribute('id');
   var all=root.querySelectorAll?root.querySelectorAll('[id]'):[];
   for(var i=0;i<all.length;i++)all[i].removeAttribute('id');
  }
  var f=tile.querySelector(':scope>.stableFrame');
  if(frame&&f){var copy=frame.cloneNode(true);cleanIds(copy);
   copy.setAttribute('aria-hidden','true');tile.replaceChild(copy,f)}
  if(tint&&!tile.querySelector(':scope>.stableMarginTint')){
   var tintCopy=tint.cloneNode(true);cleanIds(tintCopy);
   tintCopy.setAttribute('aria-hidden','true');
   var stop=tile.querySelector(':scope>.stableFrame');tile.insertBefore(tintCopy,stop);
  }
 }
 function create(){
  if(host)return;
  style();host=d.createElement('section');host.id=S;host.setAttribute('aria-hidden','true');
  slots=[];
  for(var i=0;i<2;i++){
   var tile=d.createElement('div');tile.className='p209Page';
   var im=d.createElement('img');im.alt='';im.decoding='async';im.draggable=false;
   tile.appendChild(im);
   // Reuse the REAL V695 stableFrame CSS; the source page raster has no frame.
   var frame=d.createElement('div');frame.className='stableFrame';frame.setAttribute('aria-hidden','true');tile.appendChild(frame);
   copyApprovedDecoration(tile);host.appendChild(tile);slots.push({tile:tile,img:im,page:0,src:''});
  }
  d.body.appendChild(host);
 }
 function controls(){
  if(toolbar&&toolbar.parentNode===id('mushafDock'))return true;
  var dock=id('mushafDock'),pause=id('sequenceMiniPause'),c=native();
  if(!dock||!pause||!c||typeof c.stop!=='function')return false;
  if(toolbar&&toolbar.parentNode)toolbar.parentNode.removeChild(toolbar);
  toolbar=d.createElement('div');toolbar.id=TOOLS;
  var p=d.createElement('button');p.type='button';p.className='p209Pause';
  p.textContent='⏸ إيقاف مؤقت';p.addEventListener('click',function(ev){
   ev.preventDefault();ev.stopPropagation();
   if(!active)return;var target=id('sequenceMiniPause');
   if(target){target.click();stats.controlActions++}
  });
  var stop=d.createElement('button');stop.type='button';stop.className='p209Stop';
  stop.textContent='■ إيقاف';stop.addEventListener('click',function(ev){
   ev.preventDefault();ev.stopPropagation();if(!active)return;
   // Native B345 stop (no replacement audio clock and no new stop handler).
   var controller=native();if(controller&&typeof controller.stop==='function'){
    controller.stop();stats.controlActions++;beginExit();
   }
  });
  toolbar.appendChild(p);toolbar.appendChild(stop);dock.appendChild(toolbar);return true;
 }
 function key(page){return editionKey+':'+page}
 function prune(){while(order.length>7){var k=order.shift();delete images[k]}}
 function source(page){
  if(editionKey==='tajwid')return Promise.resolve('assets/tajweed-pages/tajweed-'+String(page).padStart(3,'0')+'.webp');
  var card=d.querySelector('#b345NormalStack [data-r33-print-page="'+page+'"] .r33PrintImage');
  if(card&&card.complete&&card.naturalWidth>0&&String(card.src||''))return Promise.resolve(card.currentSrc||card.src);
  var bridge=w.__BASAIR_PRINT_BRIDGE__;
  if(!bridge||typeof bridge.resolvePage!=='function')return Promise.reject(Error('No original-print resolver'));
  return Promise.resolve(bridge.resolvePage(page));
 }
 function request(page){
  if(!page||page>604)return null;
  var k=key(page),cached=images[k];if(cached)return cached;
  cached={page:page,ready:false,failed:false,src:'',token:session,startedAt:Date.now()};images[k]=cached;
  order.push(k);prune();
  source(page).then(function(src){
   if(!src||cached.token!==session)return;
   var im=new w.Image();cached.loader=im;
   im.onload=function(){if(cached.token!==session)return;
    if(im.naturalWidth>0&&im.naturalHeight>0){cached.src=src;cached.ready=true}
    else{cached.failed=true;stats.fetchErrors++}
   };
   im.onerror=function(){if(cached.token!==session)return;cached.failed=true;stats.fetchErrors++};
   im.src=src;
   if(im.complete&&im.naturalWidth>0){cached.src=src;cached.ready=true}
  }).catch(function(){if(cached.token!==session)return;cached.failed=true;stats.fetchErrors++});
  return cached;
 }
 function resize(){
  if(!host)return;
  var sc=id('mushafReader'),dock=id('mushafDock');if(!sc||!dock)return;
  var rect=sc.getBoundingClientRect(),dr=dock.getBoundingClientRect();
  var top=Math.max(0,Math.round(rect.top));
  var bottom=Math.max(top+180,Math.round(dr.top));
  // Use native reader's horizontal extent; no added header or second border.
  host.style.top=top+'px';host.style.left=Math.max(0,Math.round(rect.left))+'px';
  host.style.width=Math.max(1,Math.round(rect.width))+'px';
  host.style.height=Math.max(180,bottom-top)+'px';
 }
 function setSlot(slot,page,src){
  if(slot.page===page&&slot.src===src)return;
  slot.page=page;slot.src=src;slot.img.src=src;
  slot.img.setAttribute('data-mushaf-page',String(page));
  // The R33 hit geometry is derived from the real B345 page. Project only
  // its passive spatial metadata into the matching visual page. No duplicate
  // live Quran controls, text renderer or extra frame is created.
  var prior=slot.tile.querySelector(':scope>.p209HitLayer');
  if(prior&&prior.parentNode)prior.parentNode.removeChild(prior);
  var shell=d.querySelector('#b345NormalStack>[data-r33-print-page="'+page+'"]');
  var hit=shell&&shell.querySelector(':scope>.ayahHitLayer');
  if(!hit)return;
  var layer=hit.cloneNode(true);layer.classList.add('p209HitLayer');
  layer.removeAttribute('id');
  var named=layer.querySelectorAll('[id]');
  for(var i=0;i<named.length;i++)named[i].removeAttribute('id');
  layer.setAttribute('aria-hidden','true');
  layer.style.pointerEvents='none';
  slot.tile.appendChild(layer);
 }
 // R33 listens for the end gesture on window in the bubbling phase and
 // otherwise hit-tests the invisible B345 page at its OLD coordinates.
 // Intercept an actual tap during projection and retarget based on the
 // projected, transformed hit geometry. Vertical swipes still belong to B345.
 var touch={on:false,x:0,y:0,kind:''};
 function eventPoint(ev){
  var t=ev.changedTouches&&ev.changedTouches.length?ev.changedTouches[0]:ev;
  return{x:Number(t.clientX)||0,y:Number(t.clientY)||0};
 }
 function within(rect,x,y){return x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom}
 function gestureDown(ev){
  if(!active)return;
  var xy=eventPoint(ev),box=host&&host.getBoundingClientRect();
  touch.on=!!(box&&within(box,xy.x,xy.y));
  touch.x=xy.x;touch.y=xy.y;touch.kind=ev.type;
 }
 function gestureEnd(ev){
  if(!touch.on||!active)return;
  touch.on=false;
  var xy=eventPoint(ev),dx=xy.x-touch.x,dy=xy.y-touch.y;
  if(dx*dx+dy*dy>144)return; // a swipe, not a word/ayah selection
  var rect=host&&host.getBoundingClientRect();
  if(!rect||!within(rect,xy.x,xy.y))return;
  // Prevent R33 from retargeting a different ayah in its hidden scroll stack.
  if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
  stats.tapsSuppressed++;
  var c=native(),s=c&&c.state;
  if(!s||!s.running||typeof c.retargetPrintAyah!=='function')return;
  for(var i=0;i<slots.length;i++){
   var slot=slots[i];
   if(slot.tile.style.display==='none')continue;
   var box=slot.tile.getBoundingClientRect();
   if(!within(box,xy.x,xy.y))continue;
   var hits=slot.tile.querySelectorAll('.p209HitLayer .ayahHit');
   for(var j=0;j<hits.length;j++){
    var h=hits[j],hr=h.getBoundingClientRect();
    if(!within(hr,xy.x,xy.y))continue;
    var progress=box.height>0?Math.max(0,Math.min(1,((hr.top+hr.bottom)*.5-box.top)/box.height)):.5;
    try{if(c.retargetPrintAyah({page:slot.page,s:Number(h.getAttribute('data-s'))||0,
       a:Number(h.getAttribute('data-selectayah'))||0,g:Number(h.getAttribute('data-g'))||0,
       progress:progress}))stats.tapsMapped++;else stats.tapMisses++}
    catch(_){stats.tapMisses++}
    return;
   }
   break;
  }
  stats.tapMisses++;
 }
 function paint(s){
  if(!host)return;
  var pg=pageNumber(s.page),nowImg=request(pg),nextImg=pg<604?request(pg+1):null;
  // An asset can fail AFTER successful activation (e.g. a missing page 006).
  // Never keep the visual projection stuck at page 005 while B345 audio moves.
  // Expose the untouched native R33 renderer instead of showing a blank card.
  if((nowImg&&nowImg.failed)||(nextImg&&nextImg.failed)||
     (nextImg&&!nextImg.ready&&Date.now()-nextImg.startedAt>5000)){
    stats.fallbacks++;cleanup();return;
  }
  if(!nowImg||!nowImg.ready){stats.skipped++;return}
  // Never reveal an empty next page: hold the authentic visible page until ready.
  var readyNext=nextImg&&nextImg.ready;
  var progress=Math.max(0,Math.min(1,Number(s.progress)||0));
  if(s.userScrolling){try{var c=native(),getter=c&&c._test&&c._test.normalProgressFromView;
   if(typeof getter==='function')progress=Math.max(0,Math.min(1,Number(getter())||0));}catch(_){}}
  if(pg===604||!readyNext)progress=0;
  var signature=pg+':'+(readyNext?'1':'0');
  if(signature!==lastPaint){setSlot(slots[0],pg,nowImg.src);
   if(readyNext)setSlot(slots[1],pg+1,nextImg.src);
   slots[1].tile.style.display=readyNext?'block':'none';lastPaint=signature}
  slots[0].tile.style.transform='translate3d(0,-'+(progress*100).toFixed(3)+'%,0)';
  if(readyNext)slots[1].tile.style.transform='translate3d(0,'+((1-progress)*100).toFixed(3)+'%,0)';
  if(toolbar){var p=toolbar.querySelector('.p209Pause');
   if(p)p.textContent=s.paused?'▶ استئناف':'⏸ إيقاف مؤقت'}
  stats.updates++;stats.page=pg;stats.progress=progress;stats.mode=s.paused?'paused':'running';
  request(pg+2);
 }
 function activate(){
  if(active||!controls())return false;
  create();resize();
  d.body.setAttribute(BODY_FLAG,'1');host.style.display='block';
  active=true;finishAt=0;stats.activations++;stats.mode='running';stats.edition=editionKey;
  return true;
 }
 function cleanup(){
  touch.on=false;
  if(!active)return;
  active=false;finishAt=0;d.body.removeAttribute(BODY_FLAG);
  if(host)host.style.display='none';
  if(toolbar&&toolbar.parentNode)toolbar.parentNode.removeChild(toolbar);
  lastPaint='';stats.restores++;stats.mode='off';
 }
 function staticReady(){
  // Real V695 B345/R39 STOP initially freezes a live print stack and leaves
  // data-b345-sequence-surface=normal. P207 releases that frozen stack and
  // calls renderLocalPage asynchronously. Do not expose R39 as static early.
  var stage=d.querySelector('#mushafReader .localPageStage')||d.querySelector('#mushafText .localPageStage');
  var img=stage&&stage.querySelector(':scope>img[data-mushaf-page]');
  var c=native(),s=c&&c.state,p=print();
  var frozen=false;
  try{frozen=!!(s&&s.printStaticHeld)||(p&&typeof p.frozenActive==='function'&&p.frozenActive())}catch(_){}
  if(frozen||d.body.hasAttribute('data-b345-sequence-surface')){stats.restoreWaits++;return false}
  var rect=stage&&stage.getBoundingClientRect();
  return !!(stage&&rect&&rect.width>0&&rect.height>0&&img&&img.complete&&img.naturalWidth>0&&
    pageNumber(img.getAttribute('data-mushaf-page'))===lastPage);
 }
 function beginExit(){if(!active)return;finishAt=Date.now()+1500;stats.mode='restoring'}
 function loop(){raf=0;
  if(!active)return;
  var c=native(),s=c&&c.state;
  if(w[FLAG]!==true||!d.body.classList.contains('reader-active')){cleanup();return}
  // Hot font/zoom/edition switches must immediately return visual ownership to
  // the native B345 renderer; do not hold the wrong printed surface for 1.5s.
  if(s&&s.running){
   var p=print(),valid=false;
   try{valid=!!(s.scaleMode==='normal'&&p&&p.active()&&Number(p.scale())===100&&
     edition()===editionKey&&!d.body.classList.contains('stableDigital')&&
     !d.body.classList.contains('h25-hifz')&&!d.body.classList.contains('h90-review')&&
     !d.body.classList.contains('h100-teacher'))}catch(_){}
   if(!valid){cleanup();stats.fallbacks++;return}
  }
  if(!s||!s.running||s.scaleMode!=='normal'){
   if(!finishAt)beginExit();
   if(staticReady()||Date.now()>finishAt){cleanup();return}
  }else{
   finishAt=0;lastPage=pageNumber(s.page)||lastPage;
   resize();paint(s);
  }
  raf=w.requestAnimationFrame(loop);
 }
 function poll(){
  if(w[FLAG]!==true){if(active)cleanup();return}
  var c=native(),s=c&&c.state;
  if(active){if(!raf)raf=w.requestAnimationFrame(loop);return}
  if(!eligible()){stats.mode='standby';return}
  var kind=edition();
  if(editionKey!==kind){editionKey=kind;images=Object.create(null);order=[];session++}
  var pg=pageNumber(s.page),cur=request(pg),next=pg<604?request(pg+1):null;
  if(!cur||!cur.ready||(next&&!next.ready))return;
  if(activate()){lastPage=pg;paint(s);raf=w.requestAnimationFrame(loop)}
 }
 function init(){if(interval||!d.body)return;
  if(w.PointerEvent){
   w.addEventListener('pointerdown',gestureDown,{capture:true,passive:true});
   w.addEventListener('pointerup',gestureEnd,{capture:true,passive:false});
   w.addEventListener('pointercancel',function(){touch.on=false},{capture:true,passive:true});
  }else{
   w.addEventListener('touchstart',gestureDown,{capture:true,passive:true});
   w.addEventListener('touchend',gestureEnd,{capture:true,passive:false});
   w.addEventListener('touchcancel',function(){touch.on=false},{capture:true,passive:true});
  }
  interval=w.setInterval(poll,180);
  d.addEventListener('visibilitychange',function(){if(d.hidden&&active)beginExit()},false);
  w.addEventListener('resize',function(){if(active)resize()},false);
  poll();
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P209_ONE_SURFACE__={version:209,experimental:true,
  status:function(){return Object.assign({},stats,{enabled:w[FLAG]===true,active:active,imageCache:order.length})},
  refresh:poll,disable:function(){w[FLAG]=false;cleanup()}};
})(window,document);
