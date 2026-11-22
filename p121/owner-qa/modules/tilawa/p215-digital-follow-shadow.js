/* BASAIR P215 — read-only digital FOLLOW shadow, isolated from B345/P214.
 * No rewrite of Quran text, follow engines, progress or scroll geometry.
 * Native V695 100%: #b345NormalStack .b345ExactPage .quranWord.
 * Native V695 >100%: #b274LargeTextHost .b345ZoomPage .v160Ayah.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P215_DIGITAL_SHADOW__)return;
 var VERSION=215,MARK='p215ShadowMark',enabled=true,locked=false,
     last=null,marked=[],failures=0,lastError='',ticks=0,changes=0,source='';
 var WAIT_ACTIVE=220,WAIT_IDLE=800,timer=null;
 function reason(text){lastError=String(text||'').slice(0,180);failures++;if(failures>=3){locked=true;enabled=false;clear();}}
 function clear(){
   marked.forEach(function(n){try{n.classList.remove(MARK)}catch(_){}});
   marked=[];last=null;source='';
 }
 function bodyReady(){
   var b=d&&d.body;
   return !!(b&&b.classList&&b.classList.contains('reader-active')&&
     b.classList.contains('stableDigital')&&
     !b.classList.contains('h25-hifz')&&
     !b.classList.contains('h90-review')&&
     !b.classList.contains('h100-teacher'));
 }
 function current(){
   if(!enabled||locked||!bodyReady()||d.hidden)return null;
   var core=w.__BASAIR_P213_FOLLOW__,native=w.__BASAIR_B345_SEQUENCE__;
   if(!core||typeof core.status!=='function'||!native||!native.state)return null;
   var state=core.status(),s=native.state;
   if(!state||state.route!=='digital'||s.running!==true)return null;
   var page=Number(s.page);
   if(!Number.isSafeInteger(page)||page<1||page>604)return null;
   return {state:s,page:page,zoom:s.scaleMode==='zoom'};
 }
 function visibleHost(session){
   var outer,card,selector;
   if(session.zoom){
     outer=d.getElementById('b274LargeTextHost');
     if(!outer)return null;
     selector='.b345ZoomPage[data-b345-page="'+session.page+'"]';
     card=outer.querySelector(selector);
     if(!card && outer.getAttribute('data-b345-sequence-stack')!=='zoom')card=outer;
   }else{
     outer=d.getElementById('b345NormalStack');
     selector='.b345ExactPage[data-b345-page="'+session.page+'"]';
     card=outer&&outer.querySelector(selector);
     if(!card){
       outer=d.getElementById('stableDigitalHost');
       if(outer&&Number(outer.getAttribute('data-b327-page'))===session.page)card=outer;
     }
   }
   if(!card||!outer||!card.querySelectorAll||!w.getComputedStyle)return null;
   var style=w.getComputedStyle(outer),css=w.getComputedStyle(card);
   if(!style||!css||style.display==='none'||style.visibility==='hidden'||
       css.display==='none'||css.visibility==='hidden')return null;
   return card;
 }
 function nodes(card,zoom){
   return Array.prototype.slice.call(card.querySelectorAll(zoom?
     '.v160Ayah[data-s][data-selectayah],.quranWord[data-s][data-selectayah]':
     '.quranWord[data-s][data-selectayah]'),0,1000);
 }
 function safeKey(n){
   if(!n||!n.getAttribute)return null;
   var s=Number(n.getAttribute('data-s')),a=Number(n.getAttribute('data-selectayah'));
   if(!Number.isSafeInteger(s)||s<1||s>114||
     !Number.isSafeInteger(a)||a<1||a>286)return null;
   if(!String(n.textContent||'').replace(/\s+/g,''))return null;
   return {s:s,a:a};
 }
 function selectVisible(list){
   if(!list.length)return null;
   var vh=Math.max(320,Number(w.innerHeight)||720),preferred=vh*.39,
       top=35,bottom=vh-70,best=null,dist=1e9;
   for(var i=0;i<list.length;i++){
     var el=list[i],key=safeKey(el);
     if(!key||!el.getBoundingClientRect)continue;
     var r=el.getBoundingClientRect();
     if(!r||!(r.bottom>top&&r.top<bottom&&r.height>0&&r.width>0))continue;
     var dlt=Math.abs(((r.top+r.bottom)/2)-preferred);
     if(dlt<dist){dist=dlt;best=key;}
   }
   return best;
 }
 function activeKey(session,list){
   var st=session.state;
   if(st.paused&&last&&last.page===session.page)return {s:last.s,a:last.a,quality:last.quality};
   if(st.mode==='audio'&&st.exactAyahAudio===true &&
      Number(st.exactAyahPage)===session.page){
     var s=Number(st.exactAyahSurah),a=Number(st.exactAyah);
     if(s>=1&&s<=114&&a>=1&&a<=286)return{s:s,a:a,quality:'exact-audio'};
   }
   // Page MP3 has no trustworthy per-ayah timestamps; shade the on-screen
   // READING POSITION, not an invented "currently spoken ayah".
   var key=selectVisible(list);
   return key?{s:key.s,a:key.a,quality:'visible-reading-guide'}:null;
 }
 function paint(session,card,list,key){
   var next=[];
   if(key)for(var i=0;i<list.length;i++){
     var candidate=safeKey(list[i]);
     if(candidate&&candidate.s===key.s&&candidate.a===key.a)next.push(list[i]);
   }
   if(!next.length){if(marked.length)clear();return;}
   var same=last&&last.page===session.page&&last.s===key.s&&last.a===key.a&&
     marked.length===next.length&&marked.every(function(n,i){return n===next[i]&&n.classList.contains(MARK)});
   if(same)return;
   marked.forEach(function(n){try{n.classList.remove(MARK)}catch(_){}});
   marked=next;
   marked.forEach(function(n){n.classList.add(MARK)});
   last={page:session.page,s:key.s,a:key.a,quality:key.quality};
   source=key.quality;changes++;
 }
 function tick(){
   ticks++;
   try{
     var session=current();
     if(!session){if(marked.length||last)clear();return false;}
     var host=visibleHost(session);
     if(!host){if(marked.length||last)clear();return false;}
     var list=nodes(host,session.zoom),key=activeKey(session,list);
     paint(session,host,list,key);
     failures=0;return !!key;
   }catch(err){reason(err&&err.message||err);return false;}
 }
 function schedule(){
   timer=null;
   if(!w.setTimeout)return;
   tick();
   timer=w.setTimeout(schedule,current()?WAIT_ACTIVE:WAIT_IDLE);
 }
 function disable(){enabled=false;clear();return true;}
 function enable(){if(locked)return false;enabled=true;return tick();}
 function status(){return{version:VERSION,enabled:enabled,locked:locked,active:marked.length>0,
   page:last&&last.page||null,surah:last&&last.s||null,ayah:last&&last.a||null,
   quality:source,markedWords:marked.length,changes:changes,ticks:ticks,failures:failures,lastError:lastError};}
 w.__BASAIR_P215_DIGITAL_SHADOW__=Object.freeze({
   version:VERSION,enable:enable,disable:disable,status:status,
   _test:Object.freeze({tick:tick})
 });
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',schedule,{once:true});
 else schedule();
})(typeof window!=='undefined'?window:globalThis,typeof document!=='undefined'?document:null);
