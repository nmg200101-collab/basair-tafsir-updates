/* BASAIR P180 — V695 Tilawa page-index list (QA050 OWNER-LOCK).
 * Additive, non-invasive enhancement of the existing #navSheet navigator.
 * No changes to the native openPage(), ayah selection, player, storage or follow.
 */
(function (w, d) {
  'use strict';
  if (w.__BASAIR_P180_PAGE_INDEX__) return;

  // Exact SURAH_START and JUZ_START arrays from the bundled V694/V695 Mushaf
  // index; page numbers are the Madinah 604-page layout used by the app.
  var SURAH_START = [1,2,50,77,106,128,151,177,187,208,221,235,249,255,262,267,282,293,305,312,322,332,342,350,359,367,377,385,396,404,411,415,418,428,434,440,446,453,458,467,477,483,489,496,499,502,507,511,515,518,520,523,526,528,531,534,537,542,545,549,551,553,554,556,558,560,562,564,566,568,570,572,574,575,577,578,580,582,583,585,586,587,587,589,590,591,591,592,593,594,595,595,596,596,597,597,598,598,599,599,600,600,601,601,601,602,602,602,603,603,603,604,604,604];
  var JUZ_START = [1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582];
  var sheet, list, search, heading, currentLabel, lastOpen = false;
  var watching = false, scheduled = false, needsScroll = false, currentOnOpen = 1;
  var sheetWatcher, listWatcher;
  var metrics = { openings:0, decorated:0, jumped:0 };
  function el(id){return d.getElementById(id);}
  function num(x){return String(x).replace(/\d/g, function(c){return '٠١٢٣٤٥٦٧٨٩'[+c];});}
  function clamp(n){n=Number(n);return Number.isInteger(n)&&n>=1&&n<=604?n:0;}
  function savedPage(){try{return clamp(JSON.parse(w.localStorage.getItem('basair:lastPage')));}catch(_){return 0;}}
  function readingPage(){
    // #readerPageInput is updated by native openPage and continuous readers.
    var input=el('readerPageInput'),value=clamp(input&&input.value);
    return value||savedPage()||1;
  }
  function surahNumber(p){for(var i=SURAH_START.length-1;i>=0;i--)if(p>=SURAH_START[i])return i+1;return 1;}
  function juzNumber(p){for(var i=JUZ_START.length-1;i>=0;i--)if(p>=JUZ_START[i])return i+1;return 1;}
  function surahName(s){
    var q=w.LOCAL_QURAN, names=w.SURAH_NAMES;
    var name=q&&q[s-1]&&q[s-1].name||names&&names[s-1]||'';
    return String(name||('السورة '+num(s)));
  }
  function make(tag,cls,value){var x=d.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=value;return x;}
  function activePage(){return !!(sheet&&sheet.classList.contains('open')&&list&&list.classList.contains('pages'));}
  function selectedRow(){return list&&list.querySelector('button[data-navpage="'+currentOnOpen+'"]');}
  function scrollToCurrent(){
    if(!activePage())return false;
    var target=selectedRow();if(!target)return false;
    var top=target.offsetTop-(list.clientHeight-target.offsetHeight)/2;
    list.scrollTop=Math.max(0,top);metrics.jumped++;
    return true;
  }
  function refreshCurrent(){
    if(!activePage())return;
    var p=currentOnOpen;
    if(currentLabel)currentLabel.textContent='أنت الآن في الصفحة '+num(p)+' من ٦٠٤';
    var previous=list.querySelectorAll('[aria-current="page"]');
    previous.forEach(function(x){x.removeAttribute('aria-current');x.classList.remove('p180Current');});
    var row=selectedRow();if(row){row.classList.add('p180Current');row.setAttribute('aria-current','page');}
  }
  function decorate(){
    if(!list||!sheet)return;
    var isPage=list.classList.contains('pages');
    sheet.classList.toggle('p180-page-active',isPage&&sheet.classList.contains('open'));
    if(heading)heading.hidden=!isPage;
    if(search)search.placeholder=isPage?'ابحث برقم الصفحة — من ١ إلى ٦٠٤':'بحث أو انتقال سريع';
    if(!isPage)return;
    // Keep the native data-navpage, whose delegated handler performs openPage.
    var buttons=list.querySelectorAll('button[data-navpage]');
    buttons.forEach(function(button){
      if(button.dataset.p180Ready==='1')return;
      var p=clamp(button.getAttribute('data-navpage'));if(!p)return;
      var title=make('span','p180Surah','سورة '+surahName(surahNumber(p)));
      var juz=make('span','p180Juz','الجزء '+num(juzNumber(p)));
      var ornament=make('span','p180Ornament','🕋');ornament.setAttribute('aria-hidden','true');
      var number=make('strong','p180Page',num(p));
      button.replaceChildren(juz,title,ornament,number);
      button.classList.add('p180PageRow');button.dataset.p180Ready='1';
      button.setAttribute('aria-label','الصفحة '+num(p)+'، '+title.textContent+'، '+juz.textContent);
      metrics.decorated++;
    });
    refreshCurrent();
    if(needsScroll&&buttons.length&&list.querySelector('button[data-navpage="'+currentOnOpen+'"]')){
      needsScroll=false;
      w.requestAnimationFrame(function(){w.requestAnimationFrame(scrollToCurrent);});
    }
  }
  function schedule(){if(scheduled)return;scheduled=true;w.requestAnimationFrame(function(){scheduled=false;decorate();});}
  function pageTab(){return sheet&&sheet.querySelector('[data-navtab="page"]');}
  function onOpen(){
    currentOnOpen=readingPage();needsScroll=true;metrics.openings++;
    // An explicit 'الأجزاء' launcher stays on its own tab; the generic index
    // defaults to the page table. The user may still freely choose any tab.
    var current=sheet.querySelector('.navTabs button.on');
    if(current&&current.getAttribute('data-navtab')==='surah'){
      var tab=pageTab();if(tab)tab.click();
    }
    schedule();
  }
  function observeSheet(){
    if(!sheet||sheetWatcher)return;
    sheetWatcher=new MutationObserver(function(){
      var isOpen=sheet.classList.contains('open');
      if(isOpen&&!lastOpen)onOpen();
      if(!isOpen&&lastOpen){needsScroll=false;sheet.classList.remove('p180-page-active');}
      lastOpen=isOpen;
    });
    sheetWatcher.observe(sheet,{attributes:true,attributeFilter:['class']});
    lastOpen=sheet.classList.contains('open');if(lastOpen)onOpen();
  }
  function init(){
    sheet=el('navSheet');list=el('navList');search=el('navSearch');
    if(!sheet||!list||!search)return false;
    if(!heading){
      var panel=sheet.querySelector('.navPanel'),tabs=sheet.querySelector('.navTabs');
      if(!panel||!tabs)return false;
      heading=make('div','p180IndexHeading');heading.id='p180IndexHeading';heading.hidden=true;
      var copy=make('div','p180IndexCopy');copy.appendChild(make('b','','صفحات المصحف الشريف'));
      currentLabel=make('small','', '');copy.appendChild(currentLabel);
      var back=make('button','p180FindCurrent','موضعي الحالي');back.type='button';
      back.addEventListener('click',function(){currentOnOpen=readingPage();refreshCurrent();scrollToCurrent();});
      heading.append(copy,back);tabs.insertAdjacentElement('afterend',heading);
      var surahTab=sheet.querySelector('[data-navtab="surah"]');
      if(surahTab&&surahTab.textContent.trim()==='الفهرس')surahTab.textContent='السور';
      // Native tab buttons render the pane *after* click; defer enhancement.
      sheet.querySelectorAll('[data-navtab]').forEach(function(tab){tab.addEventListener('click',function(){
        if(tab.getAttribute('data-navtab')==='page'){currentOnOpen=readingPage();needsScroll=!String(search.value||'').trim();}
        schedule();
      });});
      if(!watching){
        watching=true;
        listWatcher=new MutationObserver(schedule);
        listWatcher.observe(list,{childList:true,subtree:true});
        search.addEventListener('input',function(){if(search.value.trim())needsScroll=false;else if(activePage())needsScroll=true;schedule();});
      }
    }
    sheet.classList.add('p180-index-ready');observeSheet();schedule();return true;
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
  w.__BASAIR_P180_PAGE_INDEX__={version:180,refresh:init,goToCurrent:scrollToCurrent,
    _test:{read:readingPage,surah:surahNumber,juz:juzNumber,decorate:decorate,metrics:metrics}};
})(window,document);
