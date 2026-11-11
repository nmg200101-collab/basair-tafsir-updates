/* BASAIR P123 OWNER-ONLY QA: no Quran/Tilawa/Tafsir modification. */
(function(){
  var mark="P123-NOTIFY-V1";
  window.BasairP123OtaQA=Object.freeze({id:mark,ready:true});
  function show(){
    var dlg=document.getElementById("basairUniversalP121Dialog");
    if(!dlg||dlg.querySelector("[data-p123-owner-qa]"))return;
    var p=document.createElement("p");p.setAttribute("data-p123-owner-qa",mark);
    p.textContent="اختبار المالك P123 — تفعيل التحديث اليدوي بنجاح";
    p.style.cssText="font-size:12px;line-height:1.6;color:#52675f;";
    var box=dlg.querySelector(".bu-p121-panel");if(box)box.appendChild(p);
  }
  show();
  document.addEventListener("click",function(e){
    var el=e.target;if(el&&el.closest&&el.closest("[data-basair-p121-button]"))setTimeout(show,0);
  },true);
})();
