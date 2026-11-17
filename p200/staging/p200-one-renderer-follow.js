/* BASAIR P200 | QA-050 | One visual renderer for colored-print Follow.
 * P198 keeps the B345/R33 hidden scroll engine advancing and the local
 * images ready. P199 supplies the exact P193 native-page visual mirror.
 * Never create another frame, stage or image. When and ONLY when P199 has
 * painted its first complete image, conceal the whole *old* pageReading
 * subtree (not the scroller) so the user sees exactly one complete Mushaf.
 * Preserve scroll geometry, audio clock, B345 ownership, mini controls,
 * stop/restore, zoom, digital fonts, all other editions and the OTA UI.
 */
(function (w,d) {
  'use strict';
  if (w.__BASAIR_P200_SINGLE_RENDERER__) return;
  var MODE='p200-one-renderer-active', current=false, activations=0,
      releases=0, rejected=0, previous=null, timer=0;
  function E(id){return d.getElementById(id)}
  function eligible(){
    var b=d.body, ctl=w.__BASAIR_B345_SEQUENCE__,pr=w.__BASAIR_PRINT_FOLLOW_100__;
    if(!b||!ctl||!ctl.state||!ctl.state.running||ctl.state.scaleMode!=='normal'||
      !b.classList.contains('reader-active')||b.getAttribute('data-v144-print')!=='tajwid'||
      b.classList.contains('stableDigital')||b.classList.contains('h25-hifz')||
      b.classList.contains('h90-review')||b.classList.contains('h100-teacher')||
      b.getAttribute('data-b345-sequence-surface')!=='normal')return false;
    try{return !!(pr&&pr.active()&&pr.edition()==='tajwid'&&Number(pr.scale())===100)}
    catch(_){return false}
  }
  function mirrorReady(){
    var m=E('p199FixedFollowMirror'), ctl=w.__BASAIR_B345_SEQUENCE__,
        api=w.__BASAIR_P199_FIXED_TAJWID_FOLLOW__;
    if(!m||!m.isConnected||!api||typeof api.status!=='function')return false;
    var st;try{st=api.status()}catch(_){return false}
    if(!st||!st.mirroring||!st.currentPage||!ctl||!ctl.state)return false;
    var card=m.querySelector('.localPageStage.p199FollowStaticStage');
    if(!card||card.style.visibility==='hidden')return false;
    var image=card.querySelector('img.rc18TajwidRaster'),p=card.querySelector('img[data-mushaf-page]');
    if(!image||!image.complete||!(image.naturalWidth>0)||!p||
      Number(p.getAttribute('data-mushaf-page'))!==Number(st.currentPage))return false;
    var rect=m.getBoundingClientRect();
    return rect.width>=150&&rect.height>=220&&rect.bottom>0&&rect.top<w.innerHeight;
  }
  function setVisible(on){
    if(on===current)return;
    current=on;
    d.body.classList.toggle(MODE,on);
    if(on)activations++;else releases++;
  }
  function tick(){
    var good=eligible();
    if(!good){setVisible(false);return;}
    var ready=mirrorReady();
    if(!ready){rejected++;setVisible(false);return;}
    // Only switch visual ownership after a complete P199 full-page image exists.
    // B345 remains in DOM, fully sized and scrollable, but is invisible.
    var source=E('pageReading'),mirror=E('p199FixedFollowMirror');
    if(!source||!mirror){setVisible(false);return;}
    setVisible(true);
    previous=Number(w.__BASAIR_B345_SEQUENCE__.state.page)||previous;
  }
  function init(){
    if(!E('mushafReader'))return false;
    tick();timer=w.setInterval(tick,80);
    d.addEventListener('visibilitychange',function(){if(d.hidden)setVisible(false);else tick()});
    w.addEventListener('pagehide',function(){setVisible(false)}, {passive:true});
    return true;
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
  w.__BASAIR_P200_SINGLE_RENDERER__={version:200,refresh:tick,status:function(){return{
    active:current,eligible:eligible(),mirrorReady:mirrorReady(),
    activations:activations,releases:releases,notReadyChecks:rejected,
    lastEnginePage:previous,geometryPreserved:!!E('b345NormalStack')
  }}};
})(window,document);
