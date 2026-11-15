/* BASAIR P179 — native R109 card layout for P178 Salman; remove Follow shortcut.
 * Source-only until new owner-signed QA-050/RSA OTA. Keep V695/Seq54 intact.
 * Load AFTER p178-salman-selected-follow.js; never edit P89, R109 or V170.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P179_SALMAN_CARD_FIX__)return;
 var ID='p178SalmanReaderCard',NAME='سلمان عبيد المطيري';
 var SOURCE='https://way2quran.com/ar/reciters/salman-obaid-al-mutairi/hafs-an-asim';
 var watched=null,observer=null;
 function el(tag,cls,text){var a=d.createElement(tag);if(cls)a.className=cls;if(text!=null)a.textContent=text;return a;}
 function disableFollowShortcut(){
   // P178's installer checks for this ID. A detached/empty hidden sentinel
   // prevents the old shortcut returning when the Follow screen is reopened.
   if(!d.body)return;
   var marker=d.getElementById('p178FollowChoice');
   if(!marker){marker=el('span');marker.id='p178FollowChoice';}
   if(marker.parentElement!==d.body)d.body.appendChild(marker);
   if(marker.firstChild)marker.replaceChildren();
   marker.hidden=true;marker.setAttribute('aria-hidden','true');
 }
 function enhanceCard(){
   var card=d.getElementById(ID);
   if(!card||card.dataset.p179Ready==='1')return false;
   // Keep the original P178 click handler rather than reimplement playback.
   var original=card.querySelector('button');if(!original)return false;
   var details=el('div','r91ReaderDetails');
   var portrait=el('span','p104Portrait');portrait.setAttribute('role','img');
   portrait.setAttribute('aria-label','رمز زخرفي للقارئ');
   portrait.appendChild(el('span','p104Avatar','۞'));details.appendChild(portrait);
   var copy=el('div','r91ReaderText');copy.appendChild(el('b','',NAME));
   copy.appendChild(el('small','','مصحف مرتل كامل · حفص عن عاصم'));
   details.appendChild(copy);
   var chips=el('div','r91Chips');chips.appendChild(el('span','','114 تسجيلًا متاحًا'));
   chips.appendChild(el('span','','الطريق إلى القرآن'));
   details.appendChild(chips);
   var actions=el('div','r91Actions'),open=el('button','r91Btn r91Primary','فتح');
   open.type='button';open.addEventListener('click',function(){original.click();});
   actions.appendChild(open);
   var menu=el('button','p104CardMenu','⋮');menu.type='button';
   menu.setAttribute('aria-label','معلومات ومصدر تلاوات '+NAME);
   menu.setAttribute('aria-expanded','false');
   menu.addEventListener('click',showSourceInfo);
   card.replaceChildren(details,actions,menu);
   card.classList.add('r91ReaderCard','p179NativeCard');
   // P104's decorator normally adds this portrait and menu. Do not duplicate.
   card.dataset.p104Ready='1';card.dataset.p179Ready='1';
   return true;
 }
 function showSourceInfo(){
   var modal=d.getElementById('p179SalmanInfo');
   if(!modal){
     modal=el('div','p179InfoOverlay');modal.id='p179SalmanInfo';
     modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
     modal.setAttribute('aria-label','معلومات تلاوات '+NAME);
     var sheet=el('div','p179InfoSheet');
     sheet.appendChild(el('strong','',NAME));
     sheet.appendChild(el('p','','مصحف مرتل كامل · 114 سورة · حفص عن عاصم. الاستماع للسورة كاملة دون مزامنة آية بآية.'));
     var link=el('a','p179SourceLink','المصدر: الطريق إلى القرآن');
     link.href=SOURCE;link.target='_blank';link.rel='noopener noreferrer';sheet.appendChild(link);
     var close=el('button','p179InfoClose','إغلاق');close.type='button';
     close.addEventListener('click',function(){modal.hidden=true;});
     sheet.appendChild(close);modal.appendChild(sheet);
     modal.addEventListener('click',function(e){if(e.target===modal)modal.hidden=true;});
     d.body.appendChild(modal);
   }
   modal.hidden=false;
 }
 function applyNativeFilter(){
   var card=d.getElementById(ID),list=d.getElementById('r108List');
   if(!card||!list)return;
   var search=list.querySelector('.r91SearchRow .r109Search'),filter=list.querySelector('.r91SearchRow .r91Filter');
   var query=String(search&&search.value||'').replace(/\s/g,'').toLowerCase();
   var mode=filter&&filter.value||'all';
   var visible=(mode==='all'||mode==='mp3')&&NAME.replace(/\s/g,'').toLowerCase().indexOf(query)>=0;
   card.hidden=!visible;
 }
 function handleNativeFilter(){w.setTimeout(function(){enhanceCard();applyNativeFilter();},0);}
 function sync(){disableFollowShortcut();enhanceCard();applyNativeFilter();
   var list=d.getElementById('r108List');
   if(list&&list!==watched){
     if(observer)observer.disconnect();
     if(watched){watched.removeEventListener('input',handleNativeFilter,true);watched.removeEventListener('change',handleNativeFilter,true);}
     watched=list;list.addEventListener('input',handleNativeFilter,true);list.addEventListener('change',handleNativeFilter,true);
     observer=new MutationObserver(function(){enhanceCard();applyNativeFilter();});
     observer.observe(list,{childList:true,subtree:true});
   }
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
 // R109 is mounted lazily, while P178 may recreate its injected reader card.
 w.setInterval(sync,1800);
 w.__BASAIR_P179_SALMAN_CARD_FIX__={version:179,refresh:sync,
   status:function(){return{card:!!d.querySelector('#'+ID+'[data-p179-ready="1"]'),
                        followShortcutVisible:!!d.querySelector('#sequenceSheetV10 #p178FollowChoice')}}};
})(window,document);
