/* BASAIR P182 — QA-050 protected, V695: uninterrupted one-tap print/digital cycle.
 * Layer AFTER P181. Intercepts only the existing font-cycle button in CAPTURE,
 * leaving native RC18/RC19, Tajwid, night toggle and all other tools untouched.
 * The currently disabled printed 'blue' Uthmani edition remains excluded.
 */
(function (w, d) {
  'use strict';
  if (w.__BASAIR_P182_FONT_CONTINUITY__) return;
  var ID = 'p181DockFont';
  var MODES = [
    {kind:'print',key:'original',label:'الطبعة الأصلية'},
    {kind:'print',key:'tajwid',label:'التجويد الملوّن'},
    {kind:'auto',key:'auto',label:'الخط التلقائي'},
    {kind:'digital',key:'uthmani',label:'العثماني الرقمي'},
    {kind:'digital',key:'digital',label:'النسخ الواضح'},
    {kind:'digital',key:'amiri',label:'أميري قرآن'},
    {kind:'digital',key:'ruqaa',label:'الرقعة'},
    {kind:'digital',key:'kufi',label:'الكوفي'},
    {kind:'digital',key:'traditional',label:'النسخ التقليدي'}
  ];
  var busy=false, accepted=0, skipped=0, last='', attempt=0;
  function element(){return d.getElementById(ID);}
  function get(key,fallback){try{return w.localStorage.getItem(key)||fallback;}catch(_){return fallback;}}
  function autoApi(){return w.__BASAIR_PAGE_AUTO_FONT_V1__;}
  function printApi(){return w.__BASAIR_RC18__;}
  function fontApi(){return w.__BASAIR_RC19__;}
  function autoEnabled(){var a=autoApi();try{return !!(a&&typeof a.enabled==='function'&&a.enabled());}catch(_){return false;}}
  function effectiveMode(){
    if(autoEnabled())return 2;
    var font=get('stableFont','original');
    if(font!=='original')for(var i=3;i<MODES.length;i++)if(MODES[i].key===font)return i;
    return get('v129PrintMode','original')==='tajwid'?1:0;
  }
  function active(){
    var r=d.getElementById('mushafReader');
    return !!(r&&r.classList.contains('active')&&d.body.classList.contains('reader-active')&&
      !d.body.classList.contains('h25-hifz')&&!d.body.classList.contains('h90-review')&&
      !d.body.classList.contains('h100-teacher'));
  }
  function ready(){
    var p=printApi(),f=fontApi();
    return !!(p&&typeof p.setPrint==='function'&&f&&typeof f.setFont==='function');
  }
  function tell(text){
    last=text;
    // Show the same UI notification service used by the existing app, if exposed.
    try{if(typeof w.toast==='function')w.toast(text);}catch(_){/* no duplicate modal */}
  }
  function update(){
    var b=element();if(!b)return;
    var mode=MODES[effectiveMode()];
    b.disabled=busy;
    b.setAttribute('aria-busy',busy?'true':'false');
    b.setAttribute('aria-label',busy?'جاري تجهيز النمط التالي…':'تغيير الخط. الحالي: '+mode.label+'. اضغط للنمط التالي');
    b.title=busy?'جاري تجهيز النمط التالي':'تغيير الخط — '+mode.label;
    b.dataset.p182Current=mode.key;
    b.classList.toggle('p182FontBusy',busy);
  }
  function off(){var a=autoApi();if(a&&typeof a.disable==='function')a.disable();}
  function verify(index){
    var kind=MODES[index].kind,key=MODES[index].key;
    if(kind==='auto')return autoEnabled();
    if(autoEnabled())return false;
    if(kind==='digital')return get('stableFont','original')===key;
    return get('stableFont','original')==='original' && get('v129PrintMode','original')===key;
  }
  async function select(index){
    if(!ready())return false;
    var m=MODES[index],p=printApi(),f=fontApi();
    if(m.kind==='auto'){
      // Printed page mode must be reset before starting built-in automatic font.
      var p0=await Promise.resolve(p.setPrint('original',false));
      if(p0===false)return false;
      var a=autoApi();
      if(!a||typeof a.apply!=='function')return false;
      var a0=await Promise.resolve(a.apply(false));
      return a0!==false && verify(index);
    }
    off();
    if(m.kind==='digital'){
      var pp=await Promise.resolve(p.setPrint('original',false));
      if(pp===false)return false;
      var ff=await Promise.resolve(f.setFont(m.key,false));
      return ff!==false && verify(index);
    }
    // RC18.setPrint('tajwid') may reject after a page-image load fails.
    // Wait for that result, never claim a visual change on failed raster.
    var reset=await Promise.resolve(f.setFont('original',false));
    if(reset===false)return false;
    var result=await Promise.resolve(p.setPrint(m.key,false));
    return result!==false && verify(index);
  }
  async function advance(){
    if(busy||!active())return false;
    if(!ready()){tell('محرك خطوط المصحف غير جاهز');return false;}
    busy=true;update();
    var start=effectiveMode(),chosen=-1,hadUnavailable=false;
    attempt++;
    try{
      // Explicit finite scan guarantees no trap at original after a failed
      // Tajwid image request. Each click selects exactly one AVAILABLE style.
      for(var step=1;step<=MODES.length;step++){
        var ix=(start+step)%MODES.length;
        var ok=false;
        try{ok=await select(ix);}catch(_){ok=false;}
        if(ok){chosen=ix;break;}
        hadUnavailable=true;skipped++;
      }
      if(chosen>=0){
        accepted++;
        if(hadUnavailable)tell('تعذّر نمط سابق؛ تم الانتقال إلى '+MODES[chosen].label);
        return true;
      }
      tell('تعذّر تطبيق الأنماط؛ لم تُعدّل ملفات المصحف');
      return false;
    }finally{busy=false;update();}
  }
  // Document capture precedes P181's target-level click handler. Stop the
  // old handler ONLY for #p181DockFont; navigation, night, tafsir are untouched.
  d.addEventListener('click',function(ev){
    var target=ev.target;
    var b=target&&target.closest&&target.closest('#'+ID);
    if(!b)return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    if(!busy)advance();
  },true);
  w.__BASAIR_P182_FONT_CONTINUITY__={version:182,advance:advance,refresh:update,
    status:function(){return{active:active(),busy:busy,current:MODES[effectiveMode()].label,
      accepted:accepted,unavailableSkipped:skipped,presses:attempt,lastNotice:last};}};
})(window,document);
