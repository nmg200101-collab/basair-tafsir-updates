/* BASAIR P193 — clone the EXISTING original green top ornament only.
 * P191 brings the first Quran line upward. A full-size unmasked ornament
 * would overlap the ayah. The clipped, vertically compact copy does not.
 * No source URL is guessed and no Quran raster or navigation is changed.
 */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P193_AUTH_HEAD__)return;
 var root,watcher,scheduled=false,applied=0;
 function refresh(){
   if(!root||!root.isConnected)return;
   var stages=root.querySelectorAll('.rc18-tajwid-ready.p192-meta-ready');
   for(var i=0;i<stages.length;i++){
     var stage=stages[i];
     var existing=stage.querySelector(':scope > img.p193AuthenticTop');
     if(stage.classList.contains('p192-native-top-head')||
        stage.classList.contains('p918-original-special')){
       if(existing)existing.remove();continue;
     }
     var source=stage.querySelector(':scope > img.rc18TajwidOrnament');
     if(!source)continue;
     var url=source.currentSrc||source.src||source.getAttribute('src');
     if(!url)continue;
     if(!existing){
       existing=d.createElement('img');
       existing.className='p193AuthenticTop';
       existing.alt='';
       existing.setAttribute('aria-hidden','true');
       existing.draggable=false;
       stage.appendChild(existing);
       applied++;
     }
     if(existing.src!==url)existing.src=url;
   }
 }
 function queue(){
   if(scheduled)return;scheduled=true;
   (w.requestAnimationFrame||function(cb){w.setTimeout(cb,16)})(function(){
     scheduled=false;refresh();
   });
 }
 function init(){
   root=d.getElementById('mushafReader');if(!root)return;
   watcher=new MutationObserver(queue);
   watcher.observe(root,{subtree:true,childList:true,attributes:true,
     attributeFilter:['class','data-page']});
   queue();
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
 w.__BASAIR_P193_AUTH_HEAD__={version:193,refresh:refresh,status:function(){
   return{active:!!(root&&root.isConnected),applied:applied};
 }};
})(window,document);
