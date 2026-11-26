/* P225 owner-only field trial controls; no auto activation, no storage.
 * Injected only by the signed tilawa OTA loader. OFF on every WebView load.
 * No native button replacement, no modifications to digital reader or settings. */
(function(w,d){
 'use strict';
 if(w.__BASAIR_P225_TRIAL_PANEL__)return;
 const script=d.currentScript;
 if(!script||script.dataset?.basairP121!=='tilawa')return;
 let panel=null,emergency=null,buttons={},statusText=null,timer=null;
 const bridge=()=>w.__BASAIR_P225_READER_BRIDGE__;
 function makeButton(label,fn){
   const b=d.createElement('button');b.type='button';b.textContent=label;
   Object.assign(b.style,{font:'inherit',padding:'9px 10px',border:'1px solid #658374',borderRadius:'8px',background:'transparent',color:'inherit',cursor:'pointer'});
   b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn()});
   return b;
 }
 function message(s){if(statusText)statusText.textContent=s}
 function toggle(ed){
   const b=bridge();if(!b)return;
   const on=!b.status().enabled[ed];
   if(b.setTrial(ed,on))message(on?'تم اختيار المحرك التجريبي لهذه الطبعة. شغّل المتابعة من أزرارها المعتادة.':'أُعيد المحرك السابق لهذه الطبعة.');
   else message('أوقف التلاوة الحالية أولًا، ثم أعد المحاولة.');
   refresh();
 }
 function stop(){
   const b=bridge();if(!b)return;
   message(b.stopTrial()?'أوقفت التجربة وأعدت المحركات السابقة.':'تعذر الإيقاف. أغلق التطبيق وافتحه لإلغاء التجربة.');
   refresh();
 }
 function mount(){
   const mode=d.getElementById('sequenceSilentV10'),host=mode?.parentNode?.parentNode;
   const mini=d.getElementById('sequenceMiniControl');
   if(!host||!mini?.parentNode)return false;
   if(!panel){
     panel=d.createElement('section');panel.id='p225TrialPanel';panel.dir='rtl';
     Object.assign(panel.style,{display:'none',padding:'10px',margin:'8px 0',border:'1px solid #658374',borderRadius:'10px'});
     const title=d.createElement('strong');title.textContent='اختبار اختياري — P225';panel.appendChild(title);
     const note=d.createElement('div');note.textContent='للتجربة فقط عند حجم 100٪. الخطوط الآلية لا تتغير. يُلغى الاختبار عند إعادة فتح التطبيق.';Object.assign(note.style,{fontSize:'12px',margin:'6px 0'});panel.appendChild(note);
     const row=d.createElement('div');Object.assign(row.style,{display:'flex',flexWrap:'wrap',gap:'6px'});
     for(const ed of ['original','tajwid']){buttons[ed]=makeButton('',()=>toggle(ed));row.appendChild(buttons[ed])}
     row.appendChild(makeButton('إيقاف التجربة وإعادة المحركات السابقة',stop));panel.appendChild(row);
     statusText=d.createElement('div');statusText.setAttribute('aria-live','polite');statusText.style.fontSize='12px';panel.appendChild(statusText);
     host.insertBefore(panel,mode.parentNode);
   }
   if(!emergency){
     emergency=makeButton('إيقاف تجربة P225',stop);emergency.id='p225TrialEmergency';
     Object.assign(emergency.style,{display:'none',position:'fixed',right:'12px',bottom:'112px',zIndex:'2140',background:'#fff4db',color:'#34280d',border:'1px solid #9c6b22',fontSize:'13px'});
     mini.parentNode.insertBefore(emergency,mini);
   }
   return true;
 }
 function refresh(){
   const b=bridge();if(!b||!mount())return;
   b.guard();const s=b.status(),ed=b.edition(),active=s.owner==='p225'&&!!s.session;
   panel.style.display=ed?'block':'none';
   buttons.original.textContent='الأصلية: '+(s.enabled.original?'تجريبي':'سابق');
   buttons.tajwid.textContent='الملونة: '+(s.enabled.tajwid?'تجريبي':'سابق');
   for(const k of ['original','tajwid'])buttons[k].setAttribute('aria-pressed',String(s.enabled[k]));
   emergency.style.display=active?'block':'none';
 }
 function tick(){try{refresh()}catch(_){/* Never take over native controls on UI failure. */}timer=w.setTimeout(tick,250)}
 function reset(){try{bridge()?.stopTrial()}catch(_){}}
 w.addEventListener('pagehide',reset,{passive:true});
 w.__BASAIR_P225_TRIAL_PANEL__=Object.freeze({refresh,stop});
 tick();
})(window,document);
