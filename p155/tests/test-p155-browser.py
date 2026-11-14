#!/usr/bin/env python3
"""P155 real Chromium smoke: native B231/B233/R2/R3 controls, Android width, 125%."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
JS=(ROOT/'p121/owner-qa/modules/tafsir/p155-native-foundation.js').read_text()
CSS=(ROOT/'p121/owner-qa/modules/tafsir/p155-native-foundation.css').read_text()
HTML="""<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:Arial;min-height:120vh}#tafsirIndex{padding:4px}
#basairTafsirB233TopBar{display:flex;align-items:stretch;gap:3px}
#basairTafsirB233TopBar button{flex:1;min-height:52px;max-width:28%}
#tafsirReader{margin-top:14px}#tafsirAyahs .v194T2Ayah{min-height:350px;border:1px solid #cbd4c6;padding:10px}
.basairB231AyahActions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin-top:15px}
.basairB231AyahActions button{min-width:0;min-height:44px}
#basairTafsirB232FavoritesPanel{display:none}
#basairTafsirB232FavoritesPanel.show{display:block}
</style></head><body>
<section id="tafsirIndex" class="active">
<div id="basairTafsirB233TopBar">
 <button id="type">نوع التفسير</button>
 <button id="library">المكتبة</button>
 <button data-b233-top="search" id="mini">بحث</button>
 <button id="basairTafsirB232FavoritesBtn">المفضلة</button>
 <button id="resume">آخر موضع</button>
</div>
<input id="v194T104SurahSearchInput" placeholder="ابحث عن سورة أو آية">
</section>
<section id="basairTafsirB232FavoritesPanel">
 <div id="basairTafsirR3SavedTabs">
  <button data-r3-saved-tab="favorites">المفضلة</button>
  <button data-r3-saved-tab="notes">الملاحظات</button>
 </div><div id="nativePanel">المحفوظات الأصلية</div>
</section>
<section id="tafsirReader" class="active"><div id="tafsirAyahs">
 <article class="v194T2Ayah" id="verse-2-3"><h2>الآية الثالثة</h2>
 <button class="b263r3NoteChip">ملاحظة أعلى الآية</button>
 <div class="basairB231AyahActions" data-s="2" data-a="3">
  <button data-r2-action="note"><span>✎</span><b>إضافة ملاحظة</b></button>
  <button data-b231-action="copy">نسخ</button>
  <button data-b231-action="compare">مقارنة</button>
  <button data-b231-action="mark">مفضلة</button>
 </div></article>
</div></section></body></html>"""

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
 ctx=browser.new_context(viewport={"width":412,"height":915},device_scale_factor=1.25,is_mobile=True,has_touch=True)
 page=ctx.new_page()
 errors=[]
 page.on("pageerror",lambda e: errors.append(str(e)))
 page.set_content(HTML,wait_until="domcontentloaded")
 page.add_style_tag(content=CSS)
 page.evaluate("""() => {
  window.__p155Test={nativeSave:0,search:0,favorite:0,note:0,copy:0,compare:0,follow:false,tab:''};
  const x=window.__p155Test;
  document.querySelector('#basairTafsirB232FavoritesBtn').addEventListener('click',()=>{
    window.__BASAIR_TAFSIR_FINAL_B233__.favorites.open();x.favorite++;});
  document.querySelector('#v194T104SurahSearchInput').addEventListener('input',()=>x.search++);
  document.querySelector('[data-r2-action="note"]').addEventListener('click',()=>x.note++);
  document.querySelector('[data-b231-action="copy"]').addEventListener('click',()=>x.copy++);
  document.querySelector('[data-b231-action="compare"]').addEventListener('click',()=>x.compare++);
  for(const b of document.querySelectorAll('[data-r3-saved-tab]'))
   b.addEventListener('click',()=>{x.tab=b.dataset.r3SavedTab});
  window.__BASAIR_TAFSIR_FINAL_B233__={favorites:{open(){
    document.querySelector('#basairTafsirB232FavoritesPanel').classList.add('show');x.nativeSave++;}}};
  window.__BASAIR_TAFSIR_R3__={favoritesUpgrade(){return true}};
  window.__BASAIR_TAFSIR_R2__={notes:{get(s,a){return s===2&&a===3?{text:'محفوظة'}:null}}};
  window.__BASAIR_TAFSIR_R114__={toggle(){x.follow=!x.follow},status(){return{running:x.follow}}};
 }""")
 page.add_script_tag(content=JS)
 assert page.locator('#basairTafsirB233TopBar button').count()==5,"Index layout changed"
 assert page.locator('[data-bq155-notes]').count()==1,"Notes duplicated"
 assert page.locator('button[data-r2-action="note"]').count()==1,"Native note replaced"
 assert page.locator('#tafsirAyahs .basairB231AyahActions button').count()==5,"Native verse tools lost"
 assert page.locator('#tafsirAyahs .b263r3NoteChip').evaluate("(el)=>getComputedStyle(el).display")=="none"
 page.locator('[data-bq155-notes]').click()
 assert page.evaluate("window.__p155Test.tab")=="notes","Notes tab not opened"
 page.locator('#basairTafsirB232FavoritesBtn').click()
 page.wait_for_timeout(100)
 assert page.evaluate("window.__p155Test.tab")=="favorites","Original Favorites must open its own tab"
 assert page.evaluate("window.__p155Test.favorite")==1,"Original favorite handler must remain functional"
 page.locator('#v194T104SurahSearchInput').fill('البقرة')
 assert page.evaluate("window.__p155Test.search")==1,"Full search broken"
 page.locator('[data-r2-action="note"]').click()
 assert page.evaluate("window.__p155Test.note")==1,"Native note click broken"
 page.locator('[data-b231-action="copy"]').click()
 page.locator('[data-b231-action="compare"]').click()
 assert page.evaluate("window.__p155Test.copy===1&&window.__p155Test.compare===1")
 page.locator('[data-bq155-follow]').click()
 assert page.evaluate("window.__p155Test.follow"),"Follow did not start"
 page.locator('[data-bq155-follow]').click()
 assert not page.evaluate("window.__p155Test.follow"),"Follow did not stop"
 page.evaluate("() => {for(let i=0;i<100;i++)window.__BASAIR_TAFSIR_P155_FOUNDATION__.refresh()}")
 assert page.locator('[data-bq155-notes]').count()==1
 assert page.locator('#tafsirAyahs .basairB231AyahActions button').count()==5
 page.evaluate("""() => {
  const root=document.querySelector('#tafsirAyahs');
  root.innerHTML='<article class="v194T2Ayah"><div class="basairB231AyahActions" data-s="3" data-a="1"><button data-r2-action="note"><span>✎</span><b>إضافة ملاحظة</b></button><button data-b231-action="copy">نسخ</button><button data-b231-action="compare">مقارنة</button><button data-b231-action="mark">مفضلة</button></div></article>';
 }""")
 page.wait_for_timeout(250)
 assert page.locator('#tafsirAyahs .basairB231AyahActions button').count()==5,"Next ayah actions lost"
 assert not errors,f"Browser JS exceptions: {errors}"
 status=page.evaluate("window.__BASAIR_TAFSIR_P155_FOUNDATION__.status()")
 print(json.dumps({"pass":True,"browser":"Chromium","scale":"125%","indexButtons":5,
  "verseButtons":5,"nativeNotes":True,"fullSearch":True,"navigationRerender":True,
  "repeatedRefresh":100,"status":status},ensure_ascii=False))
 browser.close()
