#!/usr/bin/env python3
"""P170 viewport regression: native B233 Saved/Notes, type, dark mode and remount.
Requires Python playwright + Chromium; does NOT run an OTA publish workflow.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

R = Path(__file__).resolve().parents[2]
BASE = R / "p121/owner-qa/modules/tafsir"
P157CSS = (BASE / "p157-native-saved-stability.css").read_text()
P157JS = (BASE / "p157-native-saved-stability.js").read_text()
CSS = (BASE / "p170-tafsir-index-saved-type-stable.css").read_text()
JS = (BASE / "p170-tafsir-index-saved-type-stable.js").read_text()

HTML = """<!doctype html><html lang="ar" dir="rtl"><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:Arial;margin:8px;background:#fdfcf8;color:#15563f}
#tafsirIndex{padding:4px}
#basairTafsirB233TopBar{display:flex;align-items:stretch;gap:4px}
#basairTafsirB233TopBar>button{flex:1;min-width:0;max-width:27%;min-height:49px}
#basairTafsirB233TopBar>button:first-child{max-width:36%}
#basairTafsirB232FavoritesPanel{display:none}
#basairTafsirB232FavoritesPanel.show{display:block}
</style></head><body>
<section id="tafsirIndex" class="active">
<div id="basairTafsirB233TopBar">
<button id="nativeType"><b>نوع التفسير</b><span>بصائر القرآن — الموسع</span>
<select id="tafsirType"><option value="short">المختصر</option><option value="full">بصائر القرآن — الموسع</option></select></button>
<button data-b233-top="search" id="mini">⌕</button>
<button id="basairTafsirB232FavoritesBtn">☆ المفضلة</button>
<button id="follow">متابعة التفسير</button>
<button id="last">آخر موضع</button>
</div><input id="v194T104SurahSearchInput" placeholder="ابحث عن سورة أو آية">
</section>
<section id="basairTafsirB232FavoritesPanel"><div id="basairTafsirR3SavedTabs">
<button data-r3-saved-tab="favorites">المفضلة</button>
<button data-r3-saved-tab="notes">الملاحظات</button></div></section>
<section id="tafsirReader"><div id="tafsirAyahs">
<button id="nativeVerseTool" data-p125-follow="1">متابعة الآية</button></div></section>
</body></html>"""

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    try:
        for width in (320,360,390,430):
            for dark in (False,True):
                page = browser.new_page(viewport={"width":width,"height":850},is_mobile=True,has_touch=True)
                errors=[]
                page.on("pageerror",lambda e:errors.append(str(e)))
                page.set_content(HTML)
                page.evaluate("""() => {
                    window.test={opens:0,tab:'',search:0,follow:0};
                    const panel=document.querySelector('#basairTafsirB232FavoritesPanel');
                    window.__BASAIR_TAFSIR_FINAL_B233__={favorites:{open(){
                      panel.classList.add('show');window.test.opens++;
                    }}};
                    window.__BASAIR_TAFSIR_R3__={favoritesUpgrade(){}};
                    document.querySelector('#basairTafsirB232FavoritesBtn').addEventListener('click',
                      ()=>window.__BASAIR_TAFSIR_FINAL_B233__.favorites.open());
                    document.querySelectorAll('[data-r3-saved-tab]').forEach(b=>b.addEventListener('click',
                      ()=>window.test.tab=b.getAttribute('data-r3-saved-tab')));
                    document.querySelector('#v194T104SurahSearchInput').addEventListener('input',
                      ()=>window.test.search++);
                    document.querySelector('#nativeVerseTool').addEventListener('click',
                      ()=>window.test.follow++);
                }""")
                if dark:
                    page.evaluate("document.body.classList.add('dark')")
                page.add_style_tag(content=P157CSS)
                page.add_script_tag(content=P157JS)
                page.wait_for_function("document.querySelector('#bq157SavedGroup')!==null")
                page.add_style_tag(content=CSS)
                # CSS alone must hide old double group and expose the native Saved button.
                assert not page.locator('#bq157SavedGroup').is_visible()
                assert page.locator('#basairTafsirB232FavoritesBtn').is_visible()
                assert not page.locator('#mini').is_visible()
                page.add_script_tag(content=JS)
                assert page.locator('#tafsirIndex').get_attribute('data-bq170-index-ready')=='1'
                assert page.locator('#basairTafsirB232FavoritesBtn').get_attribute('aria-label')=='المفضلة والملاحظات'
                label=page.locator('#basairTafsirB232FavoritesBtn').evaluate(
                 "(b)=>getComputedStyle(b,'::after').content")
                assert 'المفضلة والملاحظات' in label,label
                typebox=page.locator('#nativeType').bounding_box()
                assert typebox and typebox['width']>width*0.75,(width,typebox)
                assert not page.evaluate("document.documentElement.scrollWidth>window.innerWidth+3")
                page.locator('#tafsirType').select_option('full')
                assert page.locator('#tafsirType').input_value()=='full'
                page.locator('#basairTafsirB232FavoritesBtn').click()
                assert page.evaluate('window.test.opens')==1
                page.locator('[data-r3-saved-tab="notes"]').click()
                assert page.evaluate("window.test.tab")=='notes'
                page.locator('#v194T104SurahSearchInput').fill('الفاتحة')
                page.locator('#nativeVerseTool').click()
                assert page.evaluate("window.test.search===1&&window.test.follow===1")
                # Native SPA navigation re-renders the index: P170 must re-tag, not clone.
                page.evaluate("""() => {
                  const b=document.querySelector('#basairTafsirB233TopBar');
                  const original=b.querySelector('#basairTafsirB232FavoritesBtn');
                  const replacement=document.createElement('button');
                  replacement.id='basairTafsirB232FavoritesBtn';
                  replacement.textContent='☆ المفضلة';
                  original.replaceWith(replacement);
                  replacement.addEventListener('click',
                    ()=>window.__BASAIR_TAFSIR_FINAL_B233__.favorites.open());
                }""")
                page.wait_for_function("document.querySelector('#basairTafsirB232FavoritesBtn').getAttribute('data-bq170-saved')==='1'")
                assert page.locator('#basairTafsirB232FavoritesBtn').count()==1
                assert page.locator('#bq157SavedGroup').count()==1
                assert not errors,errors
                page.close()
        print("P170 Chromium: PASS — 320/360/390/430 day/night, native Saved/Notes, type, rerender, search, verse tools")
    finally:
        browser.close()
