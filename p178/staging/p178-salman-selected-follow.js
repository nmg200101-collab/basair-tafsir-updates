/* BASAIR P178 — Salman Obaid Al Mutairi; add-on for V695 Selected Recitations.
 * QA-050 PROTECTED: never deploy without independently signed Ed25519 ownerApproval.
 * 114 complete surah MP3 streams; NOT an ayah-by-ayah synchronized reciter.
 * Does not alter the original seven EveryAyah readers or existing R109 IndexedDB.
 */
(function (w,d) {
  'use strict';
  if (w.__BASAIR_TILAWA_SALMAN_P178__) return;
  var ID='salman-obaid-almutairi', NAME='سلمان عبيد المطيري';
  var BASE='https://media.way2quran.com/salman-obaid-al-mutairi/hafs-an-asim/';
  var SOURCE='https://way2quran.com/ar/reciters/salman-obaid-al-mutairi/hafs-an-asim';
  var SITE_LABEL='الطريق إلى القرآن · حفص عن عاصم';
  var reader={id:ID,name:NAME,provider:'external',note:'مصحف مرتل كامل · 114 سورة · استماع السورة كاملة'};
  var r109=null, nativeReciter=null, rootObserver=null, lastRoot=null;
  var currentSurah=1, lastTime=0, ownAudio=null, patchEpoch=0;
  var get=function(id){return d.getElementById(id);};
  function three(n){return String(n).padStart(3,'0');}
  function validSurah(n){n=Number(n);return Number.isInteger(n)&&n>=1&&n<=114;}
  function audioUrl(n){return validSurah(n)?BASE+three(n)+'.mp3':null;}
  function surahName(n){
    var s=get('readerSurahSelect'),opt=s&&s.querySelector('option[value="'+n+'"]');
    if(opt)return opt.textContent.trim();
    var a=w.LOCAL_QURAN&&w.LOCAL_QURAN[n-1];
    return a&&a.name?('سورة '+a.name):('سورة رقم '+n);
  }
  function node(tag,cls,text){var e=d.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function button(label,action,cls){var b=node('button',cls,label);b.type='button';b.addEventListener('click',action);return b;}
  function selected(){var r=w.__BASAIR_R109_SELECTED__;return r&&r._test&&r._test.state||null;}
  function toast(t){var label=get('r108Status');if(label)label.textContent=t;}
  function stopPlaying(){
    var st=selected();
    if(ownAudio){try{ownAudio.pause();ownAudio.removeAttribute('src');ownAudio.load();}catch(_){}ownAudio=null;}
    if(st&&st.screen==='player'&&r109&&typeof r109.back==='function')try{r109.back();}catch(_){}
  }
  function setReader(){var st=selected();if(!st)return false;
    st.reader=reader;st.screen='records';st.edition={name:'حفص عن عاصم · السور الكاملة',id:'salman-hafs'};
    // Keep the native R109 state for P89 follow center; never create a second DB.
    st.items=[];st.playing=null;st.row=null;st.audio=null;
    return true;
  }
  function savedAudio(){var p=w.__BASAIR_P89_FOLLOW__;return p&&typeof p.read==='function'?p.read('audio'):null;}
  function showReader(n){
    var r=w.__BASAIR_R109_SELECTED__;if(!r||typeof r.open!=='function')return false;
    if(!r.active||!r.active())r.open();
    stopPlaying();if(!setReader())return false;
    var list=get('r108List');if(!list)return false;
    list.replaceChildren();if(get('r108Title'))get('r108Title').textContent=NAME;
    if(get('r108Back'))get('r108Back').hidden=false;
    var intro=node('div','r91ReaderDetails');
    intro.appendChild(node('strong','',NAME));
    intro.appendChild(node('small','','مصحف كامل برواية حفص عن عاصم · سور MP3 لا توقيت آيات'));list.appendChild(intro);
    var credit=node('a','r91SourceLink','المصدر: الطريق إلى القرآن');credit.href=SOURCE;credit.rel='noopener noreferrer';credit.target='_blank';list.appendChild(credit);
    var controls=node('div','r91ListControls');
    var number=node('select','r91EditionSelect');number.id='p178SurahSelect';
    for(var i=1;i<=114;i++){var opt=node('option','',three(i)+' · '+surahName(i));opt.value=i;number.appendChild(opt);}
    var from=validSurah(n)?Number(n):currentSurah;
    number.value=String(from);
    number.addEventListener('change',function(){currentSurah=Number(number.value);});
    controls.appendChild(number);
    controls.appendChild(button('▶ استماع السورة',function(){playSurah(Number(number.value),0);},'r91Btn r91Primary'));
    var last=savedAudio();
    if(last&&last.readerId===ID&&/^salman-\d+$/.test(last.trackKey||'')){
      var lastN=Number(last.trackKey.split('-')[1]);
      if(validSurah(lastN))controls.appendChild(button('متابعة آخر استماع',function(){number.value=String(lastN);playSurah(lastN,last.seconds||0);},'r91Btn'));
    }
    list.appendChild(controls);
    var notice=node('p','r91Notice','الاستماع هنا لسورة كاملة. متابعة الآية المتزامنة تتطلب توقيتات غير متوفرة لهذا التسجيل.');
    list.appendChild(notice);toast('اختر سورة للاستماع. لا يبدأ التشغيل تلقائيًا.');
    return true;
  }
  function playSurah(n,offset){
    var url=audioUrl(n),st=selected(),area=get('r108MediaArea');
    if(!url||!st||!area)return false;
    if(st.screen==='player'&&r109&&typeof r109.back==='function')try{r109.back();}catch(_){}
    if(ownAudio){try{ownAudio.pause();}catch(_){}ownAudio=null;}
    var native=get('tilawaAudio');if(native&&!native.paused)try{native.pause();}catch(_){}
    area.replaceChildren();area.hidden=false;
    area.appendChild(node('strong','r91MiniHeading',NAME+' · '+surahName(n)));
    var audio=node('audio','r91Audio');audio.id='r109Audio';audio.controls=true;audio.preload='none';audio.src=url;
    var start=Number(offset)||0;
    if(start>0)audio.addEventListener('loadedmetadata',function(){if(audio.duration>start+1)audio.currentTime=start;},{once:true});
    audio.addEventListener('error',function(){toast('تعذر تشغيل التسجيل؛ تحقق من اتصال الإنترنت أو جرّب المصدر المباشر.');});
    audio.addEventListener('ended',function(){toast('انتهت '+surahName(n));});
    area.appendChild(audio);
    area.appendChild(node('small','r91Notice',SITE_LABEL));
    st.reader=reader;st.screen='player';st.playing={reader:ID,key:'salman-'+n,name:surahName(n),n:n,url:url,edition:SITE_LABEL};
    st.audio=audio;ownAudio=audio;currentSurah=n;
    // Play ONLY after explicit user action; display a real failure when blocked.
    var run;try{run=audio.play();}catch(e){toast('تعذر بدء الصوت: '+String(e));return false;}
    if(run&&run.catch)run.catch(function(){toast('المصدر الصوتي لم يبدأ؛ اضغط تشغيل في المشغّل أو افحص اتصالك.');});
    return true;
  }
  function addCard(){
    var r=w.__BASAIR_R109_SELECTED__,grid=d.querySelector('#r108List .r109ReaderGrid');
    if(!r||!grid||!r.active||!r.active())return false;
    var search=get('r109Search'),filter=d.querySelector('#r108List select.r91Filter');
    var text=search&&search.value||'',mode=filter&&filter.value||'all';
    var normalized=function(s){return String(s||'').replace(/\s/g,'').toLowerCase();};
    var show=(mode==='all'||mode==='mp3')&&normalized(NAME).includes(normalized(text));
    var card=get('p178SalmanReaderCard');
    if(!show){if(card)card.remove();return false;}
    if(card&&card.parentElement===grid)return true;
    card=node('article','r91ReaderCard');card.id='p178SalmanReaderCard';
    var info=node('div','r91ReaderDetails');info.appendChild(node('b','',NAME));
    info.appendChild(node('small','','مصحف مرتل كامل · 114 سورة · حفص عن عاصم'));
    card.appendChild(info);
    card.appendChild(button('فتح تلاوات القارئ',function(){showReader(currentSurah);},'r91Btn r91Primary'));
    grid.appendChild(card);
    return true;
  }
  function installCompanion(){
    var host=get('sequenceReciterV17');if(!host||get('p178FollowChoice'))return;
    var wrap=node('div','p178FollowChoice');wrap.id='p178FollowChoice';
    wrap.appendChild(button('سلمان المطيري · استماع سورة كاملة',function(){
      var n=Number((get('readerSurahSelect')||{}).value)||currentSurah;
      // Do NOT insert an invalid key in V170_RECITERS: it would silently use Alafasy.
      if(typeof w.v170StopSequence==='function')try{w.v170StopSequence(true);}catch(_){}
      var follow=w.__BASAIR_P89_FOLLOW__;
      if(follow&&follow._test&&typeof follow._test.update==='function'&&typeof follow.resume==='function'){
        follow._test.update('audio',{readerId:ID,readerName:NAME,trackKey:'',trackName:'',seconds:0,mode:'selected'},true);
        follow.resume('audio'); // Handles tilawa-index document isolation and its reload intent.
        return;
      }
      if(typeof w.openTilawaIndex==='function')try{w.openTilawaIndex();}catch(_){}
      w.setTimeout(function(){showReader(n);},180);
    },'r91Btn'));
    wrap.appendChild(node('small','','استماع سورة كاملة، وليس تزامنًا آيةً بآية.'));
    host.parentElement&&host.parentElement.appendChild(wrap);
  }
  function install(){
    var r=w.__BASAIR_R109_SELECTED__;
    if(r&&r!==r109&&typeof r.reciter==='function'){
      r109=r;nativeReciter=r.reciter;
      r.reciter=function(id){if(id===ID){return showReader(currentSurah);}return nativeReciter.apply(this,arguments);};
      patchEpoch++;
    }
    var label=get('r108EntryButton');label=label&&label.querySelector('small');
    if(label&&label.textContent.indexOf('13 قارئًا')>=0)label.textContent=label.textContent.replace('13 قارئًا','14 قارئًا');
    addCard();installCompanion();
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',install,{once:true});else install();
  var observer=new MutationObserver(function(){install();});
  observer.observe(d.documentElement,{childList:true,subtree:true});
  w.addEventListener('input',function(e){if(e.target&&e.target.id==='r109Search')w.setTimeout(addCard,0);},true);
  w.addEventListener('change',function(e){if(e.target&&e.target.id==='r91Filter')w.setTimeout(addCard,0);},true);
  // Native R109 may be injected after the P121 OTA module; low-cost reconciliation.
  w.setInterval(install,1600);
  w.__BASAIR_TILAWA_SALMAN_P178__={id:ID,name:NAME,source:SOURCE,mode:'surah-only',url:audioUrl,
    open:showReader,play:playSurah,status:function(){return{patched:!!r109,patchEpoch:patchEpoch,surah:currentSurah};}};
})(window,document);
