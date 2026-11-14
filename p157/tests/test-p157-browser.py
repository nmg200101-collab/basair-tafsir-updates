#!/usr/bin/env python3
"""P157 simulated Android-sized Chromium QA. NOT physical Android WebView."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
JS=(ROOT/'p121/owner-qa/modules/tafsir/p157-merged-saved-reader.js').read_text()
CSS=(ROOT/'p121/owner-qa/modules/tafsir/p157-merged-saved-reader.css').read_text()
HTML="""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font:16px Arial;margin:0}
#tafsirIndex{padding:8px}#basairTafsirB233TopBar{display:flex;gap:3px}
#basairTafsirB233TopBar button{flex:1;min-width:0;min-height:50px}
#tafsirReader{padding:8px;max-height:700px;overflow:auto}
.v194T2Ayah{min-height:165px;border:1px solid #bbb;margin:5px;padding:8px}
.basairB231AyahActions{display:flex;gap:3px}
.basairB231AyahActions button{flex:1;min-width:0;min-height:44px}
#basairTafsirB232FavoritesPanel{display:none}
#basairTafsirB232FavoritesPanel.show{display:block}
</style></head><body>
<section id="tafsirIndex" class="active"><div id="basairTafsirB233TopBar">
<button>المصادر</button><button>المكتبة</button>
<button data-b233-top="search">بحث</button>
<button id="basairTafsirB232FavoritesBtn">المفضلة</button>
<button>آخر موضع</button></div></section>
<section id="basairTafsirB232FavoritesPanel">
<div id="basairTafsirR3SavedTabs">
<button data-r3-saved-tab="favorites">المفضلة</button>
<button data-r3-saved-tab="notes">الملاحظات</button>
</div></section>
<section id="tafsirReader" class="active" data-basair-main-tab="tafsir">
<div id="tafsirAyahs"><article class="v194T2Ayah" data-t2ayah="1" data-t5-s="1"
data-t5-a="1" data-t5-type="basair">
<div class="basairB231AyahActions" data-s="1" data-a="1" data-type="basair">
<button data-r2-action="note">ملاحظة</button>
<button data-b231-action="copy">نسخ</button>
<button data-b231-action="compare">مقارنة</button>
<button data-b231-action="mark">مفضلة</button></div></article>
<div id="v194T5Sentinel"></div></div></section></body></html>"""

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1.25,has_touch=True,is_mobile=True)
 errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.set_content(HTML,wait_until='domcontentloaded')
 page.add_style_tag(content=CSS)
 page.evaluate("""() => {
 const q=Array.from({length:114},(_,i)=>({count:i===0?24:20}));
 const x=window.__fixture={notes:0,favorites:0,tab:'',copies:0,compares:0,follow:false,loads:0,opens:0};
 document.querySelector('#basairTafsirB232FavoritesBtn').addEventListener('click',()=>{
   x.favorites++;document.querySelector('#basairTafsirB232FavoritesPanel').classList.add('show')});
 for(const tab of document.querySelectorAll('[data-r3-saved-tab]'))
   tab.addEventListener('click',()=>{x.tab=tab.dataset.r3SavedTab});
 document.addEventListener('click', e=>{
   if(e.target.closest('[data-r2-action="note"]')) x.notes++;
   if(e.target.closest('[data-b231-action="copy"]')) x.copies++;
   if(e.target.closest('[data-b231-action="compare"]')) x.compares++;
 });
 window.__BASAIR_TAFSIR_FINAL_B233__={favorites:{open(){
   document.querySelector('#basairTafsirB232FavoritesPanel').classList.add('show')}}};
 window.__BASAIR_TAFSIR_R3__={favoritesUpgrade(){}};
 window.__BASAIR_TAFSIR_R2__={notes:{get(){return null}},openNote(){}};
 window.__BASAIR_TAFSIR_CORE__={q};
 window.__BASAIR_TAFSIR_R114__={
   status(){return{running:x.follow}},
   start(){x.follow=true},stop(){x.follow=false},toggle(){x.follow=!x.follow}
 };
 let state={s:1,a:1,type:'basair'};
 function html(s,a,generated){
   return '<article class="v194T2Ayah '+(generated?'v194T5Generated v194T5Ayah':'')+
      '" data-t2ayah="'+a+'" data-t5-a="'+a+'" data-t5-s="'+s+
      '" data-t5-type="basair"><p>آية '+s+':'+a+'</p><div class="basairB231AyahActions" '+
      'data-s="'+s+'" data-a="'+a+'" data-type="basair">'+
      '<button data-r2-action="note"><span>✎</span><b>ملاحظة</b></button>'+
      '<button data-b231-action="copy">نسخ</button>'+
      '<button data-b231-action="compare">مقارنة</button>'+
      '<button data-b231-action="mark">مفضلة</button></div></article>';
 }
 window.__BASAIR_TAFSIR_STEP2__={
   state(){return state},
   open(s,a,type){
     x.opens++;state={s,a,type};
     document.querySelector('#tafsirAyahs').innerHTML=
       html(s,a,false)+'<div id="v194T5Sentinel"></div>';
   }
 };
 window.__BASAIR_TAFSIR_STEP5__={loadNext(){
   const host=document.querySelector('#tafsirAyahs');
   const rows=[...host.querySelectorAll('.v194T5Ayah')];
   const last=rows[rows.length-1];if(!last)throw Error('Missing validated native tail');
   const s=Number(last.dataset.t5S),a=Number(last.dataset.t5A);
   const next=a<q[s-1].count?{s,a:a+1}:{s:s+1,a:1};
   host.querySelector('#v194T5Sentinel')
       .insertAdjacentHTML('beforebegin',html(next.s,next.a,true));
   x.loads++;
 }};
 }""")
 page.add_script_tag(content=JS)
 page.wait_for_function("() => !!window.__BASAIR_TAFSIR_P157_RECOVERY__")
 # Index is never cloned; all five original slots remain in place.
 for _ in range(10):
  page.evaluate("""() => {
    const index=document.querySelector('#tafsirIndex');
    index.classList.remove('active');index.classList.add('active');
    window.__BASAIR_TAFSIR_P157_RECOVERY__.refresh();
  }""")
 page.wait_for_timeout(150)
 assert page.locator('#basairTafsirB233TopBar button').count()==5
 # A single wide native-compatible Favorites+Notes card, old Search absent.
 assert page.locator('#basairTafsirB233TopBar > *').count()==4
 assert page.locator('#basairTafsirB233TopBar .bq157SavedPair > button').count()==2
 assert page.locator('#basairTafsirB233TopBar button[data-b233-top="search"]').count()==0
 assert page.locator('#basairTafsirB233TopBar #basairTafsirB232FavoritesBtn').count()==1
 assert page.locator('#basairTafsirB233TopBar[data-bq157-ready]').count()==1
 assert page.evaluate("() => getComputedStyle(document.querySelector('.bq157SavedPair')).display")=='grid'

 assert page.locator('[data-bq157-notes="1"]').count()==1
 page.locator('[data-bq157-notes="1"]').click()
 assert page.evaluate('window.__fixture.tab')=='notes'
 # Neither first load nor mere refresh may reassign the native main tab.
 assert page.locator('#tafsirReader').get_attribute('data-basair-main-tab')=='tafsir'

 page.locator('#basairTafsirB232FavoritesBtn').click()
 assert page.evaluate('window.__fixture.favorites')==1
 page.locator('[data-r2-action="note"]').click()
 page.locator('[data-b231-action="copy"]').click()
 page.locator('[data-b231-action="compare"]').click()
 assert page.evaluate('window.__fixture.notes===1&&window.__fixture.copies===1&&window.__fixture.compares===1')
 # Original bar recreation must retain the same count and a working Notes button.
 page.evaluate("""() => {
   document.querySelector('#basairTafsirB233TopBar').innerHTML=
   '<button>المصادر</button><button>المكتبة</button>'+
   '<button data-b233-top="search">بحث</button>'+
   '<button id="basairTafsirB232FavoritesBtn">المفضلة</button>'+
   '<button>آخر موضع</button>';
 }""")
 page.wait_for_function("() => document.querySelectorAll('[data-bq157-notes]').length===1")
 page.locator('[data-bq157-notes="1"]').click()
 assert page.evaluate('window.__fixture.tab')=='notes'
 assert page.locator('#basairTafsirB233TopBar button').count()==5
 # Sequential manual loading, with uniqueness and transitions across surahs.
 for n in range(25):
  ok=page.evaluate('window.__BASAIR_TAFSIR_P157_RECOVERY__.manualNext()')
  assert ok,f'Manual next failed on step {n+1}'
  page.wait_for_function("() => !window.__BASAIR_TAFSIR_P157_RECOVERY__.status().pending")
 ids=page.evaluate("""() => [...document.querySelectorAll('#tafsirAyahs .v194T2Ayah')]
     .map(r=>r.dataset.t5S+':'+r.dataset.t5A)""")
 assert len(ids)==26 and len(set(ids))==26,ids
 assert ids[0]=='1:1' and ids[-1]=='2:2',ids[-1]
 assert page.locator('#tafsirAyahs .basairB231AyahActions > button').count()==26*5
 # From the visible verse, stop Follow and continue manual reading.
 page.locator('#tafsirAyahs .v194T2Ayah').last.scroll_into_view_if_needed()
 page.locator('#tafsirAyahs .v194T2Ayah').last.locator('[data-bq157-follow]').click()
 page.wait_for_function("() => window.__fixture.follow")
 assert page.evaluate("window.__fixture.opens")>=1
 page.locator('[data-bq157-follow]').first.click()
 page.wait_for_function("() => !window.__fixture.follow")
 ok=page.evaluate("window.__BASAIR_TAFSIR_P157_RECOVERY__.manualNext()")
 assert ok,'Manual reading not restored after Follow stops'
 page.wait_for_function("() => !window.__BASAIR_TAFSIR_P157_RECOVERY__.status().pending")
 for mode in ('dark','light'):
  page.evaluate("""m => {document.body.classList.toggle('dark',m==='dark');}""",mode)
  assert page.locator('[data-bq157-notes]').count()==1
 assert not errors,errors
 status=page.evaluate('window.__BASAIR_TAFSIR_P157_RECOVERY__.status()')
 print(json.dumps({'status':'PASS','browser':'Chromium (not Android WebView)',
  'indexOpen':10,'indexButtons':5,'nativeNotes':True,'manualLoaded':25,
  'uniqueVerses':len(ids),'crossSurah':True,'followStopResume':True,
  'dayNight':True,'diagnostics':status},ensure_ascii=False))
 browser.close()
