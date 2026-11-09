/* BASAIR P108 / QA043 DRAFT ONLY — Way2Quran reader directory.
 * Public-data index is generated separately by audited sync workflow.
 * Never claims streamed audio availability until per-track MP3 is verified.
 * Does not touch original readers, playback engine, signed V690 receiver,
 * or the protected Qur'an content. Keeps explicit source attribution.
 */
(function (w, d) {
  'use strict';
  if (w.__BASAIR_P108_MORE_READERS__) return;
  var BASE = 'https://way2quran.com/ar/reciters';
  var JSON_URL = 'https://raw.githubusercontent.com/nmg200101-collab/basair-tafsir-updates/main/p92/owner-qa-001/way2quran-readers.json';
  var open = false, panel = null, list = [], loaded = false;
  var queue = false, view = 'index', query = '', shown = 36, selected = null;
  var clicks = 0, errors = [], router = null, priorLayer = null, priorBack = null;
  function E(id) { return d.getElementById(id); }
  function node(tag, className, content) {
    var n = d.createElement(tag); if(className)n.className=className;
    if(content != null)n.textContent=content;return n;
  }
  function trace(s) { errors.push(s); if(errors.length > 8)errors.shift(); }
  function norm(t) { return String(t||'').replace(/[\u064b-\u065f\u0670ـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase().trim(); }
  function goodUrl(url) {
    try {var u=new URL(url);return u.protocol==='https:'&&u.hostname==='way2quran.com'&&/^\/ar\/reciters\/[a-z0-9-]+\/?$/.test(u.pathname)?u.href:null;
    } catch(_) {return null;}
  }
  function safeAudio(url) {
    try {var u=new URL(url);return u.protocol==='https:'&&['media.way2quran.com','way2quran.com','cdn.way2quran.com'].includes(u.hostname)&&/\.mp3(?:$|\?)/i.test(u.href)?u.href:null;
    }catch(_){return null;}
  }
  function installed() {var s=E('r108Sheet'),r=w.__BASAIR_R109_SELECTED__;
    return !!(s&&r&&r._test&&r._test.state);}
  function inReaders() {var r=w.__BASAIR_R109_SELECTED__,s=r&&r._test&&r._test.state;
    return !!(s&&s.active&&s.screen==='readers'&&E('r108Sheet')&&!E('r108Sheet').hidden);}
  var CSS = `
  #bqP108MoreButton {border:1px solid #cdbd90;border-radius:12px;padding:9px 13px;margin:10px 7px;background:#edf5ee;color:#124e40;font-weight:750;font-size:.85rem;display:flex;align-items:center;gap:9px;justify-content:center;width:calc(100% - 14px)}
  #bqP108Overlay[hidden] {display:none!important}
  #bqP108Overlay{position:fixed;z-index:2147483630;inset:0;background:#0008;display:flex;align-items:stretch;justify-content:center;direction:rtl;font-family:inherit}
  #bqP108Panel{width:min(100%,600px);height:100%;background:#fffdf7;display:flex;flex-direction:column;overflow:hidden;color:#143b32}
  #bqP108Top{background:linear-gradient(140deg,#06453c,#17654e);color:#fff;padding:20px 15px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px}
  #bqP108Top strong{font-size:1.17rem} #bqP108Top small{display:block;color:#e8d5a2;margin-top:5px;font-size:.68rem}
  #bqP108Top button{border:1px solid #f5f2e0a9;background:transparent;color:#fff;border-radius:10px;min-width:44px;min-height:44px;font-size:1.35rem}
  #bqP108Tools{padding:12px 12px 0;display:flex;gap:8px;flex-direction:column}
  #bqP108Query{width:100%;border:1px solid #dbd1b6;background:white;border-radius:12px;min-height:45px;padding:8px 13px;color:#143b32;font-size:1rem;box-sizing:border-box}
  #bqP108Meta{font-size:.76rem;color:#678078;padding:8px 3px}
  #bqP108Body{flex:1;min-height:0;overflow-y:auto;padding:5px 12px 24px;overscroll-behavior:contain}
  .bqP108Reader{display:flex;align-items:center;gap:10px;border:1px solid #e5d7bb;border-radius:12px;margin:0 0 7px;padding:7px 9px;background:#fff;box-shadow:0 1px 3px #143b3212;min-height:57px}
  .bqP108Avatar{width:41px;height:41px;flex:0 0 41px;border:1px solid #c4b17c;border-radius:11px;display:grid;place-items:center;background:#f7f4e8;color:#12614f;font-size:1.1rem}
  .bqP108ReaderText{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.bqP108ReaderText b{font-size:.9rem}.bqP108ReaderText small{color:#73837c;font-size:.67rem}
  .bqP108Open{border:1px solid #16634b;color:#15543e;background:#edf6ef;border-radius:9px;padding:8px 12px;font-size:.81rem;min-height:36px}
  .bqP108Action{border:1px solid #b8a477;background:#fff;color:#15543e;border-radius:10px;padding:10px;margin:6px 0;font-size:.86rem}
  #bqP108More{margin:9px auto 20px;display:block;border-radius:11px;background:#135642;color:#fff;border:0;padding:10px 22px}
  .bqP108Message{padding:25px 12px;text-align:center;color:#67776e;line-height:1.8}
  #bqP108Footer{border-top:1px solid #eee5d1;padding:8px 13px;color:#6c7771;text-align:center;font-size:.68rem}
  #bqP108Footer a{color:#135d46;text-decoration:underline}
  `;
  function injectStyle(){if(E('bqP108Style'))return;var s=node('style');s.id='bqP108Style';s.textContent=CSS;(d.head||d.documentElement).appendChild(s);}
  function ensureButton(){if(!inReaders())return false;var anchor=E('r108List');if(!anchor)return false;
    var b=E('bqP108MoreButton');if(!b){b=node('button','', '◉ المزيد من القرّاء · الطريق إلى القرآن');b.id='bqP108MoreButton';b.type='button';b.addEventListener('click',show);}
    if(!b.isConnected)anchor.insertBefore(b,anchor.firstChild);return true;
  }
  function ensurePanel(){if(panel)return panel;injectStyle();var over=node('div');over.id='bqP108Overlay';over.hidden=true;
    var shell=node('section');shell.id='bqP108Panel';shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','المزيد من القراء - الطريق إلى القرآن');
    var top=node('header');top.id='bqP108Top';var name=node('div');name.appendChild(node('strong','','المزيد من القرّاء'));name.appendChild(node('small','','مكتبة متصلة · المصدر: الطريق إلى القرآن'));top.appendChild(name);
    var close=node('button','','×');close.type='button';close.setAttribute('aria-label','الرجوع إلى التلاوات المختارة');close.addEventListener('click',goBack);top.appendChild(close);shell.appendChild(top);
    var tools=node('div');tools.id='bqP108Tools';var inp=node('input');inp.id='bqP108Query';inp.placeholder='ابحث عن قارئ...';inp.setAttribute('aria-label','ابحث عن قارئ');inp.addEventListener('input',function(){query=inp.value;shown=36;render();});tools.appendChild(inp);tools.appendChild(node('div','','جارٍ تحميل الفهرس...')).id='bqP108Meta';shell.appendChild(tools);
    var body=node('main');body.id='bqP108Body';shell.appendChild(body);var footer=node('footer');footer.id='bqP108Footer';footer.appendChild(node('span','','بيانات القراء من '));
    var src=node('a','','الطريق إلى القرآن');src.href=BASE;src.rel='noopener noreferrer';src.target='_self';footer.appendChild(src);shell.appendChild(footer);
    over.appendChild(shell);d.body.appendChild(over);panel=over;return over;
  }
  function message(s) {var body=E('bqP108Body');body.replaceChildren(node('div','bqP108Message',s));}
  function openReader(item) {selected=item;view='detail';render();}
  function renderDetail(){var body=E('bqP108Body');body.replaceChildren();var i=selected;if(!i)return;
    var box=node('div','bqP108Reader');box.appendChild(node('div','bqP108Avatar','۞'));var t=node('div','bqP108ReaderText');t.appendChild(node('b','',i.name));t.appendChild(node('small','','القارئ موجود في مكتبة الطريق إلى القرآن'));box.appendChild(t);body.appendChild(box);
    body.appendChild(node('p','bqP108Message','التلاوات متصلة بمصدرها، ولا تُعرض روابط صوت غير موثقة على أنها تعمل.'));
    if(Array.isArray(i.tracks)&&i.tracks.length){i.tracks.forEach(function(track){var url=safeAudio(track.url);if(!url)return;var row=node('div','bqP108Reader');row.appendChild(node('span','bqP108ReaderText',track.title||'تلاوة'));var play=node('button','bqP108Open','▶ تشغيل');play.addEventListener('click',function(){var audio=E('bqP108Audio');if(!audio){audio=node('audio');audio.id='bqP108Audio';audio.controls=true;body.prepend(audio)}audio.src=url;audio.play().catch(function(){trace('audio-rejected')})});row.appendChild(play);body.appendChild(row);});}
    var a=node('a','bqP108Action','↗ صفحة القارئ على الموقع الأصلي');a.href=goodUrl(i.url)||BASE;a.target='_self';a.rel='noopener noreferrer';body.appendChild(a);
  }
  function render(){if(!panel||panel.hidden)return;var body=E('bqP108Body'),meta=E('bqP108Meta'),search=E('bqP108Query');
    if(view==='detail'){search.hidden=true;meta.textContent='تفاصيل القارئ';renderDetail();return}
    search.hidden=false;var q=norm(query),matches=list.filter(function(r){return !q||norm(r.name).includes(q);});
    meta.textContent=list.length+' قارئًا من الفهرس المتصل · '+matches.length+' نتيجة';body.replaceChildren();
    matches.slice(0,shown).forEach(function(item){var row=node('article','bqP108Reader');row.appendChild(node('span','bqP108Avatar','۞'));
      var txt=node('div','bqP108ReaderText');txt.appendChild(node('b','',item.name));txt.appendChild(node('small','','الطريق إلى القرآن · متصل'));row.appendChild(txt);
      var b=node('button','bqP108Open','فتح');b.type='button';b.addEventListener('click',function(){openReader(item)});row.appendChild(b);body.appendChild(row);
    });
    if(shown<matches.length){var more=node('button','','عرض المزيد');more.id='bqP108More';more.addEventListener('click',function(){shown+=36;render()});body.appendChild(more)}
    if(!matches.length)message('لا توجد نتائج مطابقة.');
  }
  function validate(data){if(!data||data.schema!==1||!Array.isArray(data.readers)||data.readers.length<1000)throw Error('incomplete reader index');
    var seen={};var out=[];data.readers.forEach(function(r){if(typeof r.name!=='string'||r.name.length<3||r.name.length>100)return;
      var url=goodUrl(r.url);if(!url||seen[url])return;seen[url]=1;out.push({name:r.name,url:url,tracks:r.tracks||null})});
    if(out.length<1000)throw Error('invalid reader index');return out;
  }
  function load(){var meta=E('bqP108Meta');meta.textContent='يجري جلب فهرس القراء من المصدر...';
    w.fetch(JSON_URL,{cache:'no-store',mode:'cors'}).then(function(res){if(!res.ok)throw Error('catalog http '+res.status);return res.json()}).then(function(data){list=validate(data);loaded=true;render()}).catch(function(e){trace(String(e&&e.message||e).slice(0,80));meta.textContent='تعذر جلب الفهرس الآن';message('الفهرس المتصل غير متاح حاليًا. لن تُعرض قائمة ناقصة على أنها جميع القراء. حاول مجددًا عند توفر الاتصال.');});
  }
  function show(){clicks++;var o=ensurePanel();o.hidden=false;open=true;view='index';selected=null;E('bqP108Query').value='';query='';shown=36;E('bqP108Query').focus();if(loaded)render();else load();}
  function close(){if(!panel||panel.hidden)return false;panel.hidden=true;open=false;view='index';selected=null;var a=E('bqP108Audio');if(a){try{a.pause();a.remove()}catch(_){}}return true}
  function goBack(){if(!open)return false;if(view==='detail'){view='index';selected=null;render();return true}return close();}
  function wireBack(){if(router)return;var r=w.__BASAIR_P102_VISIBLE_BACK__;if(!r||typeof r.layer!=='function'||typeof r.back!=='function')return;
    router=r;priorLayer=r.layer;priorBack=r.back;
    r.layer=function(){return open?'p108-more-readers':priorLayer.apply(r,arguments)};
    r.back=function(){return open?goBack():priorBack.apply(r,arguments)};
  }
  function boot(){
    injectStyle();
    var attached=false,waiting=null;
    function attach(){
      if(attached)return true;
      if(!installed()||!E('r108List'))return false;
      attached=true;
      var obs=new MutationObserver(function(){
        if(!queue){queue=true;Promise.resolve().then(function(){queue=false;ensureButton();wireBack()})}
      });
      obs.observe(E('r108List'),{childList:true,subtree:false});
      ensureButton();wireBack();
      if(waiting){waiting.disconnect();waiting=null;}
      return true;
    }
    if(!attach()&&w.MutationObserver){
      waiting=new MutationObserver(attach);
      waiting.observe(d.documentElement||d,{childList:true,subtree:true});
    }
    d.addEventListener('click',function(e){
      if(e.target&&e.target.closest&&e.target.closest('#r108EntryButton,#r108Back,#r108Close'))
        w.setTimeout(function(){attach();ensureButton()},0);
    },true);
    w.addEventListener('pageshow',function(){attach();ensureButton();wireBack()},false);
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  w.__BASAIR_P108_MORE_READERS__={version:'P108-QA043-DRAFT',show:show,hide:close,diagnostics:function(){return {indexReady:loaded,indexCount:list.length,shown:shown,opened:open,view:view,clicks:clicks,backRouter:!!router,errors:errors.slice()}}};
})(window,document);
