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
  var TRACKS_BASE = 'https://raw.githubusercontent.com/nmg200101-collab/basair-tafsir-updates/main/p92/owner-qa-001/way2quran-tracks/';
  var CACHE_KEY = 'BASAIR_P108_WAY2QURAN_DIRECTORY_V1';
  var open = false, panel = null, list = [], loaded = false;
  var trackCache = {}, trackGeneration = 0, currentAudio = null, listScroll = 0;
  var amerFixCount = 0, reciterTrackLoads = 0, reciterPlayable = 0;
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
  .bqP108Track{display:flex;align-items:center;gap:7px;border:1px solid #e5d7bb;border-radius:11px;padding:7px 9px;margin:5px 0;background:#fff}
  .bqP108Track b{flex:1;font-size:.82rem;min-width:0}.bqP108Track button{border-radius:8px;background:#135642;color:white;border:0;padding:8px 11px;min-height:36px}
  .bqP108Recitation{width:100%;border:1px solid #d9c99e;background:#fff;padding:10px 12px;border-radius:10px;color:#143b32;margin:8px 0}
  .bqP108Player{position:sticky;top:0;z-index:2;background:#f5f5ea;padding:10px;border:1px solid #e0d4ac;border-radius:12px;margin:5px 0}.bqP108Player audio{width:100%;display:block}
  .bqP108Hint{padding:12px;background:#f7f1df;border:1px solid #e4d6b6;border-radius:10px;font-size:.78rem;line-height:1.7;margin:10px 0}
  .bqP108Retry{width:100%;background:#dfeee5;border:1px solid #b9cfc3;color:#124d3f;padding:11px;border-radius:9px;margin:8px 0}
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
  function stopAudio(){
    var a=E('bqP108Audio'); if(a){try{a.pause();a.removeAttribute('src');a.load()}catch(_){}}
    currentAudio=null;
  }
  function audioName(n){
    var opt=d.querySelector('#readerSurahSelect option[value="'+n+'"]');
    if(opt)return opt.textContent.trim();
    var surahs=w.LOCAL_QURAN || [];
    var q=surahs[n-1];return q&&q.name?'سورة '+q.name:'سورة '+n;
  }
  function tracksPart(slug){var sum=0;for(var i=0;i<slug.length;i++)sum+=slug.charCodeAt(i);
    return 'part-'+String(sum%32).padStart(2,'0')+'.json';}
  function validatedTracks(value,slug){
    if(!value||value.schema!==1||!value.readers||!Object.prototype.hasOwnProperty.call(value.readers,slug))return [];
    var entry=value.readers[slug];if(!entry||entry.slug!==slug||!Array.isArray(entry.recitations))return [];
    var output=[];
    entry.recitations.forEach(function(g){if(!g||!Array.isArray(g.tracks))return;
      var data=g.tracks.map(function(t){return {n:Number(t.n),url:safeAudio(t.url)};})
        .filter(function(t){return Number.isInteger(t.n)&&t.n>=1&&t.n<=114&&!!t.url});
      if(data.length){data.sort(function(a,b){return a.n-b.n});output.push({edition:String(g.edition||'قراءة'),tracks:data});}
    });return output;
  }
  function loadTracks(item){
    reciterTrackLoads++;
    if(trackCache[item.slug])return Promise.resolve(trackCache[item.slug]);
    var url=TRACKS_BASE+tracksPart(item.slug);
    return w.fetch(url,{mode:'cors',cache:'no-store'}).then(function(res){if(!res.ok)throw Error('tracks-http-'+res.status);return res.json();})
      .then(function(raw){var t=validatedTracks(raw,item.slug);trackCache[item.slug]=t;return t;});
  }
  function openReader(item){
    stopAudio();selected=item;view='detail';render();
  }
  function addWebsiteAction(parent,item){
    var a=node('a','bqP108Action','↗ فتح صفحة القارئ ومشغّل الموقع الأصلي');
    a.href=goodUrl(item.url)||BASE;a.target='_self';a.rel='noopener noreferrer';
    parent.appendChild(a);
  }
  function renderTracks(item,groups){
    if(view!=='detail'||!selected||selected.slug!==item.slug)return;
    var body=E('bqP108Body');
    var existing=E('bqP108Tracks');if(existing)existing.remove();
    var target=node('div');target.id='bqP108Tracks';body.appendChild(target);
    if(!groups.length){
      target.appendChild(node('p','bqP108Hint','لم تتوفر روابط MP3 موثقة لهذا القارئ في الفهرس بعد. يمكنك الاستماع من الموقع الأصلي دون إنشاء روابط تخمينية.'));
      addWebsiteAction(target,item);return;
    }
    reciterPlayable++;
    target.appendChild(node('div','bqP108Hint','المقاطع المتاحة هنا بروابط MP3 مباشرة من «الطريق إلى القرآن». تختلف التسجيلات المتوفرة بحسب القارئ والرواية.'));
    var choice=node('select','bqP108Recitation');choice.setAttribute('aria-label','اختر القراءة');
    groups.forEach(function(g,i){var edition=g.edition==='hafs an asim'?'حفص عن عاصم':g.edition;var option=node('option','',edition+' · '+g.tracks.length+' تسجيلًا');option.value=String(i);choice.appendChild(option)});
    target.appendChild(choice);
    var player=node('div','bqP108Player');player.hidden=true;
    var playtitle=node('div','','');player.appendChild(playtitle);
    var audio=node('audio');audio.controls=true;audio.preload='none';audio.id='bqP108Audio';player.appendChild(audio);
    var audioError=node('small','');player.appendChild(audioError);
    audio.addEventListener('error',function(){audioError.textContent='تعذر التشغيل عبر هذا الاتصال؛ استخدم صفحة الموقع الأصلية.'});
    target.appendChild(player);
    var tracks=node('div');target.appendChild(tracks);
    function paint(){
      tracks.replaceChildren();var g=groups[Number(choice.value)||0];
      g.tracks.forEach(function(t){var row=node('div','bqP108Track');row.appendChild(node('b','',audioName(t.n)));
        var play=node('button','','▶ تشغيل');play.type='button';play.addEventListener('click',function(){
          if(currentAudio&&currentAudio!==audio){try{currentAudio.pause()}catch(_){}}
          currentAudio=audio;playtitle.textContent=item.name+' · '+audioName(t.n);audioError.textContent='';
          player.hidden=false;audio.src=t.url;audio.load();
          try{var p=audio.play();if(p&&p.catch)p.catch(function(){audioError.textContent='اضغط تشغيل في شريط الصوت أو افتح المصدر الأصلي.'});}
          catch(_){audioError.textContent='تعذر التشغيل؛ استخدم الموقع الأصلي.'}
        });row.appendChild(play);
        var source=node('a','bqP108Open','المصدر');source.href=t.url;source.target='_self';source.rel='noopener noreferrer';
        source.setAttribute('aria-label','فتح ملف الصوت الأصلي من الطريق إلى القرآن');row.appendChild(source);
        tracks.appendChild(row);
      });
    }
    choice.addEventListener('change',function(){stopAudio();player.hidden=true;paint()});
    paint();addWebsiteAction(target,item);
  }
  function renderDetail(){
    var body=E('bqP108Body');body.replaceChildren();var i=selected;if(!i)return;
    var box=node('div','bqP108Reader');box.appendChild(node('div','bqP108Avatar','۞'));
    var t=node('div','bqP108ReaderText');t.appendChild(node('b','',i.name));
    t.appendChild(node('small','','المصدر: الطريق إلى القرآن · متصل بالإنترنت'));
    box.appendChild(t);body.appendChild(box);
    var loading=node('p','bqP108Message','جارٍ تحميل روابط التلاوات المتاحة من المصدر…');
    loading.id='bqP108Tracks';body.appendChild(loading);
    var token=++trackGeneration;
    loadTracks(i).then(function(groups){if(token!==trackGeneration)return;renderTracks(i,groups)}).catch(function(e){
      if(token!==trackGeneration)return;trace('track-load:'+String(e&&e.message).slice(0,60));renderTracks(i,[]);
    });
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
      var url=goodUrl(r.url);if(!url||seen[url])return;seen[url]=1;out.push({name:r.name,url:url,slug:url.slice(url.lastIndexOf('/')+1),tracks:r.tracks||null})});
    if(out.length<1000)throw Error('invalid reader index');return out;
  }
  function load(){var meta=E('bqP108Meta');meta.textContent='يجري جلب فهرس القراء من المصدر...';
    w.fetch(JSON_URL,{cache:'no-store',mode:'cors'}).then(function(res){if(!res.ok)throw Error('catalog http '+res.status);return res.json()}).then(function(data){list=validate(data);loaded=true;
      try{w.localStorage.setItem(CACHE_KEY,JSON.stringify({at:Date.now(),data:data}))}catch(_){}render();
    }).catch(function(e){trace(String(e&&e.message||e).slice(0,80));
      try{var cached=JSON.parse(w.localStorage.getItem(CACHE_KEY)||'null');
        if(cached&&cached.data&&Date.now()-cached.at<259200000){list=validate(cached.data);loaded=true;render();meta.textContent+=' · نسخة محفوظة، قد تكون قديمة';return;}
      }catch(_){}
      meta.textContent='تعذر جلب الفهرس الآن';message('يتطلب عرض القراء اتصالًا بالإنترنت. أعد المحاولة، أو افتح الموقع الأصلي.');
      var retry=node('button','bqP108Retry','إعادة المحاولة');retry.type='button';retry.addEventListener('click',load);E('bqP108Body').appendChild(retry);
      var site=node('a','bqP108Action','زيارة الطريق إلى القرآن');site.href=BASE;site.target='_self';site.rel='noopener noreferrer';E('bqP108Body').appendChild(site);
    });
  }
  function show(){clicks++;var o=ensurePanel();o.hidden=false;open=true;view='index';selected=null;E('bqP108Query').value='';query='';shown=36;E('bqP108Query').focus();if(loaded)render();else load();}
  function close(){if(!panel||panel.hidden)return false;stopAudio();trackGeneration++;panel.hidden=true;open=false;view='index';selected=null;return true}
  function goBack(){if(!open)return false;if(view==='detail'){stopAudio();trackGeneration++;view='index';selected=null;render();return true}return close();}
  function wireBack(){if(router)return;var r=w.__BASAIR_P102_VISIBLE_BACK__;if(!r||typeof r.layer!=='function'||typeof r.back!=='function')return;
    router=r;priorLayer=r.layer;priorBack=r.back;
    r.layer=function(){return open?'p108-more-readers':priorLayer.apply(r,arguments)};
    r.back=function(){return open?goBack():priorBack.apply(r,arguments)};
  }
  function installAmerDirect(){
    var r=w.__BASAIR_R109_SELECTED__,s=r&&r._test&&r._test.state;
    if(!s||!s.reader||s.reader.id!=='amer'||!Array.isArray(s.items))return 0;
    var count=0;
    s.items.forEach(function(t){var n=Number(t.n);
      if(t.reader!=='amer'||!Number.isInteger(n)||n<1||n>114)return;
      var url='https://media.way2quran.com/muhammad-hussein-amer/hafs-an-asim/'+String(n).padStart(3,'0')+'.mp3';
      // Published MP3 links on official reader profile. Prevent QA042's
      // older Archive.org shim from overwriting the correct source.
      t.p107DirectChecked=true;
      if(t.url!==url){t.url=url;count++;}
    });
    amerFixCount+=count;return count;
  }
  function amerClicked(event){
    var button=event.target&&event.target.closest&&event.target.closest('#r108List .r109Track .r91Primary');
    if(button)installAmerDirect();
  }
  function boot(){
    injectStyle();
    d.addEventListener('click',amerClicked,true);
    var attached=false,waiting=null;
    function attach(){
      if(attached)return true;
      if(!installed()||!E('r108List'))return false;
      attached=true;
      var obs=new MutationObserver(function(){
        if(!queue){queue=true;Promise.resolve().then(function(){queue=false;ensureButton();wireBack()})}
      });
      obs.observe(E('r108List'),{childList:true,subtree:false});
      ensureButton();wireBack();installAmerDirect();
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
  w.__BASAIR_P108_MORE_READERS__={version:'P108-QA043-CANDIDATE',show:show,hide:close,fixAmer:installAmerDirect,diagnostics:function(){return {indexReady:loaded,indexCount:list.length,shown:shown,opened:open,view:view,clicks:clicks,backRouter:!!router,amerDirectApplied:amerFixCount,readerTrackLoads:reciterTrackLoads,readerPlayable:reciterPlayable,errors:errors.slice()}}};
})(window,document);
