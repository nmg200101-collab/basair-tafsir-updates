/* BASAIR P192 — page metadata only, no Quran reader or navigation changes.
 * Existing RC18 metadata comes from LOCAL_QURAN and BASAIR_PAGE_RANGES.
 * A page beginning with the first ayah of a surah already has its genuine
 * printed ornamental header; do NOT add a second one above that artwork.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P192_PAGE_HEADING__)return;
 var JUZ_PAGES=[1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582];
 var root=null,observer=null,queued=false,applied=0;
 function ar(n){return String(n).replace(/[0-9]/g,function(c){return '٠١٢٣٤٥٦٧٨٩'[+c]})}
 function firstSurah(page){
   var ranges=w.BASAIR_PAGE_RANGES, q=w.LOCAL_QURAN;
   if(!ranges||!q||!ranges[page-1])return null;
   var g=Number(ranges[page-1][0]);if(!(g>0))return null;
   for(var i=0;i<q.length;i++){
     var su=q[i],ayahs=su&&su.ayahs;
     if(!ayahs||!ayahs.length)continue;
     var first=Number(ayahs[0].g),last=Number(ayahs[ayahs.length-1].g);
     if(g>=first&&g<=last)return {name:String(su.name||''),isNativeHeading:g===first};
   }
   return null;
 }
 function juz(page){for(var i=JUZ_PAGES.length-1;i>=0;i--)if(JUZ_PAGES[i]<=page)return i+1;return 1}
 function refresh(){
   if(!root||!root.isConnected)return;
   var stages=root.querySelectorAll('.localPageStage.rc18-tajwid-ready,.continuousImagePage.rc18-tajwid-ready');
   for(var i=0;i<stages.length;i++){
     var stage=stages[i],labels=stage.querySelector(':scope > .rc18TajwidLabels');
     if(!labels)continue;
     var page=Number(labels.getAttribute('data-page'));
     if(!(page>=1&&page<=604))continue;
     if(stage.getAttribute('data-p192-page')===String(page))continue;
     var meta=firstSurah(page);
     if(!meta||!meta.name)continue; // fail safe; never show a guessed surah
     var nativeTop=meta.isNativeHeading||page<=2;
     var name=labels.querySelector('.rc18TajwidSurah');
     var part=labels.querySelector('.rc18TajwidJuz');
     if(!name||!part)continue;
     if(!nativeTop){
       name.textContent='سورة '+meta.name;
       part.textContent='ج '+ar(juz(page));
       var number=labels.querySelector('.p192PageNumber');
       if(!number){number=d.createElement('span');number.className='p192PageNumber';labels.appendChild(number)}
       number.textContent='ص '+ar(page);
     }
     stage.classList.toggle('p192-native-top-head',nativeTop);
     stage.classList.add('p192-meta-ready');
     stage.setAttribute('data-p192-page',String(page));
     applied++;
   }
 }
 function queue(){if(queued)return;queued=true;(w.requestAnimationFrame||function(f){w.setTimeout(f,16)})(function(){queued=false;refresh()})}
 function init(){
   root=d.getElementById('mushafReader');if(!root)return;
   observer=new MutationObserver(queue);
   observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-page']});
   queue();
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P192_PAGE_HEADING__={version:192,refresh:refresh,status:function(){return{active:!!root,applied:applied}}};
})(window,document);
