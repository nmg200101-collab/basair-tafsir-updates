#!/usr/bin/env python3
"""P171 field-failure regression: real B233 capture collision, P157/P170 coexistence,
fallback toolbar without B233 id, 320..430 day/night, and SPA re-render.

This is a DOM fixture, not an Android V695 runtime.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
TAFSIR=ROOT/'p121/owner-qa/modules/tafsir'
def read(name):return (TAFSIR/name).read_text(encoding='utf8')
P157JS=read('p157-native-saved-stability.js')
P157CSS=read('p157-native-saved-stability.css')
P170JS=read('p170-tafsir-index-saved-type-stable.js')
P170CSS=read('p170-tafsir-index-saved-type-stable.css')
P171JS=read('p171-tafsir-index-native-saved-recovery.js')
P171CSS=read('p171-tafsir-index-native-saved-recovery.css')

def html(native_bar):
    name='id="basairTafsirB233TopBar"' if native_bar else 'class="nativeToolbarUnknownId"'
    typ=('''<button id="nativeType"><b>نوع التفسير</b><select id="typeValue">
         <option value="m">بصائر القرآن — الموسع</option><option value="s">المختصر</option>
         </select></button>''' if native_bar else '''
         <div id="nativeType"><span>نوع التفسير</span><select id="typeValue">
         <option value="m">بصائر القرآن — الموسع</option><option value="s">المختصر</option>
         </select></div>''')
    return f"""<!doctype html><html lang="ar" dir="rtl"><head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
    body{{margin:6px;font:14px Arial;background:#fcfbf5;color:#17442b}}
    #basairTafsirB233TopBar,.nativeToolbarUnknownId{{display:flex;gap:4px;align-items:center}}
    #basairTafsirB233TopBar > *,.nativeToolbarUnknownId > *{{flex:1 1 auto;min-height:45px;min-width:0;max-width:32%}}
    #basairTafsirB232FavoritesPanel{{display:none}}#basairTafsirB232FavoritesPanel.show{{display:block}}
    </style></head><body><div id="tafsirIndex" class="active">
    <div {name}>{typ}
    <button id="miniSearch" data-b233-top="search">⌕</button>
    <button id="basairTafsirB232FavoritesBtn">☆ المفضلة</button>
    <button id="followTafsir">متابعة التفسير</button>
    <button id="lastPosition">آخر موضع</button></div>
    <div id="fullSearch">
      <input id="v194T104SurahSearchInput" placeholder="بحث عن سورة أو آية">
    </div><h2>فهرس السور</h2></div>
    <section id="basairTafsirB232FavoritesPanel"><div id="basairTafsirR3SavedTabs">
    <button data-r3-saved-tab="favorites">المفضلة</button>
    <button data-r3-saved-tab="notes">الملاحظات</button></div></section>
    <section id="tafsirReader"><div id="tafsirAyahs">
    <button data-p125-follow="1">متابعة الآية</button></div></section></body></html>"""

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    total=0
    for layout in (True,False):
        for width in (320,360,390,430):
            for dark in (False,True):
                page=browser.new_page(viewport={'width':width,'height':850},is_mobile=True,has_touch=True)
                errors=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.set_content(html(layout))
                page.evaluate("""() => {
                  window.test={opens:0,tab:'',follow:0,query:0};
                  // Original B233 captures clicks before OTA, preventing native
                  // Favorites click listeners. Distinct proxy must avoid collision.
                  window.addEventListener('click',e=>{
                    if(e.target.closest('#basairTafsirB232FavoritesBtn')){
                      e.stopImmediatePropagation();e.preventDefault();
                    }
                  },true);
                  window.__BASAIR_TAFSIR_FINAL_B233__={favorites:{open(){
                     document.getElementById('basairTafsirB232FavoritesPanel').classList.add('show');
                     test.opens++;
                  }}};
                  window.__BASAIR_TAFSIR_R3__={favoritesUpgrade(){}};
                  document.querySelectorAll('[data-r3-saved-tab]').forEach(b=>
                    b.addEventListener('click',()=>{test.tab=b.dataset.r3SavedTab}));
                  document.getElementById('followTafsir').addEventListener('click',()=>test.follow++);
                  document.getElementById('v194T104SurahSearchInput').addEventListener('input',()=>test.query++);
                }""")
                if dark:page.evaluate("document.body.classList.add('dark')")
                if layout:
                    page.add_style_tag(content=P157CSS)
                    page.add_script_tag(content=P157JS)
                page.add_style_tag(content=P170CSS)
                page.add_script_tag(content=P170JS)
                page.add_style_tag(content=P171CSS)
                page.add_script_tag(content=P171JS)
                proxy=page.locator('#tafsirIndex button[data-bq171-saved="1"]')
                assert proxy.count()==1,(layout,width,dark,'not_one_proxy')
                assert proxy.is_visible(),(layout,width,dark,'proxy_not_visible')
                assert 'المفضلة والملاحظات' in proxy.inner_text()
                assert not page.locator('#miniSearch').is_visible()
                assert not page.locator('#basairTafsirB232FavoritesBtn').is_visible()
                assert page.locator('#nativeType').is_visible()
                assert page.locator('#typeValue').is_visible()
                assert page.locator('#v194T104SurahSearchInput').is_visible()
                assert page.locator('#tafsirAyahs [data-p125-follow]').count()==1
                assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+3'),(layout,width,dark,'overflow')
                if layout:assert not page.locator('#bq157SavedGroup').is_visible()
                page.locator('#typeValue').select_option('s')
                assert page.locator('#typeValue').input_value()=='s'
                proxy.click()
                assert page.evaluate("test.opens===1&&test.tab==='favorites'")
                page.locator('[data-r3-saved-tab="notes"]').click()
                assert page.evaluate("test.tab==='notes'")
                page.locator('#v194T104SurahSearchInput').fill('الفاتحة')
                page.locator('#followTafsir').click()
                assert page.evaluate("test.query===1&&test.follow===1")
                # Native B233 replaces the original favorite during SPA navigation.
                page.evaluate("""() => {
                   const old=document.querySelector('#basairTafsirB232FavoritesBtn');
                   const fresh=document.createElement('button');
                   fresh.id='basairTafsirB232FavoritesBtn';fresh.textContent='☆ المفضلة';
                   old.replaceWith(fresh);
                }""")
                page.wait_for_function("document.querySelector('#basairTafsirB232FavoritesBtn').getAttribute('data-bq171-native-anchor')==='1'")
                assert page.locator('button[data-bq171-saved="1"]').count()==1
                assert not errors,errors
                total+=1
                page.close()
    browser.close()
    assert total==16
    print(f'P171 Chromium native-capture + SPA field regression: PASS {total}/16; no Android test performed')
