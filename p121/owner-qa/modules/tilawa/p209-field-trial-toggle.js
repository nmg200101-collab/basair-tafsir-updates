/* P209 owner-qa opt-in trial: NEVER activates new render automatically.
 * The original native B345 remains the sole audio/timing controller. The
 * experimental projection hides the old visual stack ONLY when explicitly
 * enabled in the currently open reader session. No persistent data writes.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P209_FIELD_TRIAL_UI__)return;
 var FLAG='__BASAIR_P209_FIELD_QA_ENABLED__',ID='p209TrialFieldCard',BUTTON='p209TrialFieldToggle';
 w[FLAG]=false; // Fail-closed on every fresh WebView launch.
 function E(id){return d.getElementById(id)}
 function good(){
  var p=w.__BASAIR_P205_ORIGINAL_PRINT_PARITY__,q=w.__BASAIR_P207_FOLLOW_GUARD__,r=w.__BASAIR_P209_ONE_SURFACE__;
  try{return !!(p&&typeof p.status==='function'&&p.status().installed===true&&
    q&&typeof q.status==='function'&&r&&typeof r.status==='function'&&
    typeof r.disable==='function')}
  catch(_){return false}
 }
 function refresh(){
  var card=E(ID),btn=E(BUTTON);if(!card||!btn)return;
  var ready=good(),on=w[FLAG]===true;
  btn.disabled=!ready&&!on;
  btn.textContent=on?'إيقاف تجربة العرض الجديد':'تجربة العرض الجديد P209';
  btn.setAttribute('aria-pressed',on?'true':'false');
  var small=card.querySelector('[data-p209-status]');
  if(small)small.textContent=!ready?'العارض التجريبي غير جاهز؛ المتابعة الأصلية محفوظة.':on?
   'التجربة مفعّلة لهذا الفتح فقط. ابدأ أو استأنف متابعة التلاوة لتظهر الصفحة الجديدة.':
   'اختياري: لا يتغير العرض حتى تضغط الزر. يمكن إيقاف التجربة فورًا.';
 }
 function toggle(){
  if(w[FLAG]===true){
   w[FLAG]=false;
   try{var a=w.__BASAIR_P209_ONE_SURFACE__;if(a&&typeof a.disable==='function')a.disable()}catch(_){}
  }else if(good()){
   w[FLAG]=true;
   try{var b=w.__BASAIR_P209_ONE_SURFACE__;if(b&&typeof b.refresh==='function')b.refresh()}catch(_){}
  }
  refresh();
 }
 function install(){
  var pane=E('v140FontPane');if(!pane)return false;
  if(E(ID)){refresh();return true}
  var card=d.createElement('section');card.id=ID;card.dir='rtl';
  card.style.cssText='margin:12px 6px;padding:11px;border:1px solid #b6cbbd;border-radius:12px;background:#f3f8f4;color:#164839;font:14px system-ui;line-height:1.5';
  var title=d.createElement('strong');title.textContent='اختبار متابعة التلاوة الجديدة';card.appendChild(title);
  var note=d.createElement('p');note.textContent='تجربة اختيارية داخل الطبعة الملونة؛ يعود العرض الأصلي إذا لم تجهز الصور، دون تغيير محرك الصوت.';note.style.cssText='margin:7px 0;font-size:12px';card.appendChild(note);
  var btn=d.createElement('button');btn.id=BUTTON;btn.type='button';btn.style.cssText='width:100%;padding:10px;border:0;border-radius:9px;background:#17634b;color:white;font:700 14px system-ui';
  btn.addEventListener('click',toggle);card.appendChild(btn);
  var status=d.createElement('small');status.setAttribute('data-p209-status','1');status.style.cssText='display:block;margin-top:7px';card.appendChild(status);
  pane.appendChild(card);refresh();return true;
 }
 function init(){install();w.setInterval(function(){if(!E(ID))install();else refresh()},1700)}
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P209_FIELD_TRIAL_UI__={version:209,experimental:true,install:install,toggle:toggle,status:function(){return{ready:good(),enabled:w[FLAG]===true}}};
})(window,document);
