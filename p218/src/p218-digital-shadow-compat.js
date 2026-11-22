/* P218 digital-only fallback for real P214 V695 Unicode/V160 hosts.
 * Independent visual owner: NEVER replaces P214, B345, audio or page geometry.
 * Claims only when P215 has no shade; disables P215 before drawing.
 * STAGING ONLY — protected module release needs signed owner approval.
 */
(function(w,d){
'use strict';
if(w.__BASAIR_P218_SHADOW__)return;
var MARK='p218ShadowMark',enabled=true,locked=false,own=false,disabledOld=false,
    pending=0,marked=[],last=null,changes=0,fails=0,reason='';
function old(){return w.__BASAIR_P215_DIGITAL_SHADOW__}
function erase(){marked.forEach(function(x){try{x.classList.remove(MARK)}catch(_){}});marked=[];last=null}
function release(){
 erase();pending=0;own=false;
 var x=old();if(enabled&&disabledOld&&x&&x.status&&x.status().locked!==true&&x.enable)x.enable();
 disabledOld=false;
}
function ready(){
 var b=d&&d.body;
 return !!(enabled&&!locked&&b&&b.classList.contains('reader-active')&&
 b.classList.contains('stableDigital')&&!b.classList.contains('h25-hifz')&&
 !b.classList.contains('h90-review')&&!b.classList.contains('h100-teacher')&&!d.hidden);
}
function current(){
 if(!ready())return null;
 var core=w.__BASAIR_P213_FOLLOW__,e=w.__BASAIR_B345_SEQUENCE__;
 var c=core&&core.status&&core.status(),s=e&&e.state;
 if(!c||c.route!=='digital'||!s||s.running!==true)return null;
 var p=Number(s.page);return Number.isSafeInteger(p)&&p>=1&&p<=604?{p:p,s:s}:null;
}
function shown(x){if(!x||!w.getComputedStyle)return false;var s=w.getComputedStyle(x);
 return !!(s&&s.display!=='none'&&s.visibility!=='hidden')}
function textNodes(){
 var b=d.body,h=d.getElementById('b274LargeTextHost'),f,n;
 if(b.classList.contains('b274LargeMushaf')&&h&&shown(h)&&
 h.getAttribute('aria-busy')!=='true'&&
 h.getAttribute('data-b330-scroll-owner')==='b274LargeTextHost'&&
 h.getAttribute('data-b329-zoom-source')!=='diagnostic'){
   f=h.querySelector('.v160DigitalFlow:not(.b329ZoomDiagnostic)');
   if(f&&shown(f)){
     n=Array.prototype.slice.call(f.querySelectorAll(
       '.v160Ayah[data-s][data-selectayah]'),0,1000);
     if(n.length)return n; // one element per ayah, never shade nested words
     n=Array.prototype.slice.call(f.querySelectorAll(
       '.quranWord[data-s][data-selectayah]'),0,1000);
     if(n.length)return n;
   }
 }
 h=d.getElementById('stableDigitalHost');
 if(h&&shown(h)&&h.getAttribute('aria-busy')!=='true'&&
 h.querySelector('.exactLine.text .unicodeLine')){
   n=Array.prototype.slice.call(h.querySelectorAll(
     '.quranWord[data-s][data-selectayah]'),0,1000);
   if(n.length)return n;
 }
 return null;
}
function key(n){
 if(!n||!n.getAttribute)return null;
 var s=Number(n.getAttribute('data-s')),a=Number(n.getAttribute('data-selectayah'));
 if(!Number.isSafeInteger(s)||s<1||s>114||!Number.isSafeInteger(a)||a<1||a>286||
 !String(n.textContent||'').replace(/\s+/g,''))return null;
 return{s:s,a:a};
}
function select(list,c){
 var st=c.s;
 if(st.paused&&last&&last.p===c.p)return{s:last.s,a:last.a,q:last.q};
 if(st.mode==='audio'&&st.exactAyahAudio===true&&Number(st.exactAyahPage)===c.p){
   var s=Number(st.exactAyahSurah),a=Number(st.exactAyah);
   if(Number.isSafeInteger(s)&&s>0&&s<=114&&Number.isSafeInteger(a)&&a>0&&a<=286)
     return{s:s,a:a,q:'exact-audio'};
 }
 var vh=Math.max(320,Number(w.innerHeight)||720),pref=vh*.39,best=null,dist=Infinity;
 for(var i=0;i<list.length;i++){
   var n=list[i],k=key(n);if(!k||!n.getBoundingClientRect)continue;
   var r=n.getBoundingClientRect();
   if(!r||!(r.bottom>35&&r.top<vh-70&&r.width>0&&r.height>0))continue;
   var dx=Math.abs((r.top+r.bottom)/2-pref);if(dx<dist){best=k;dist=dx}
 }
 return best?{s:best.s,a:best.a,q:'visible-reading-guide'}:null;
}
function claim(){
 if(own)return true;
 var l=old(),s=l&&l.status&&l.status();
 if(!s||!l.disable||s.active||(s.enabled===false&&!s.locked)){pending=0;return false}
 if(++pending<2)return false;
 if(s.enabled!==false){l.disable();disabledOld=true}
 own=true;return true;
}
function paint(list,c,k){
 var next=list.filter(function(n){var x=key(n);return x&&x.s===k.s&&x.a===k.a});
 if(!next.length){erase();return false}
 if(last&&last.p===c.p&&last.s===k.s&&last.a===k.a&&
 next.length===marked.length&&marked.every(function(x,i){
 return x===next[i]&&x.classList.contains(MARK)}))return true;
 erase();marked=next;
 marked.forEach(function(x){x.classList.add(MARK)});
 last={p:c.p,s:k.s,a:k.a,q:k.q};changes++;return true;
}
function tick(){
 try{
   var c=current();if(!c){release();return false}
   var list=textNodes(),k=list&&select(list,c);
   if(!k){release();return false}
   if(!claim()){erase();return false}
   var success=paint(list,c,k);fails=0;return success;
 }catch(err){
   reason=String(err&&err.message||err).slice(0,180);
   if(++fails>=3){locked=true;release();enabled=false}
   return false;
 }
}
function loop(){tick();if(w.setTimeout)w.setTimeout(loop,current()?220:850)}
function disable(){enabled=false;erase();return true}
function enable(){if(locked)return false;enabled=true;tick();return true}
function status(){return{version:218,enabled:enabled,locked:locked,owned:own,
 active:marked.length>0,changes:changes,marked:marked.length,quality:last&&last.q||'',
 ayah:last&&last.a||null,reason:reason}}
w.__BASAIR_P218_SHADOW__=Object.freeze({version:218,status:status,disable:disable,
 enable:enable,_test:Object.freeze({tick:tick})});
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',loop,{once:true});
else loop();
})(typeof window!=='undefined'?window:globalThis,
 typeof document!=='undefined'?document:null);
