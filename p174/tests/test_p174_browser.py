from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
R=Path(__file__).parent
css=(R/'p174-tafsir-index-native-final.css').read_text()
js=(R/'p174-tafsir-index-native-final.js').read_text()
# Relevant historical selector collisions reproduced without changing signed baselines.
conflict='''
html body #tafsirIndex #basairTafsirB233TopBar #basairTafsirB232FavoritesBtn{display:flex!important}
html body #tafsirIndex[data-bq157-saved-ready="1"] #basairTafsirB233TopBar.bq173-bar #basairTafsirB232FavoritesBtn[data-bq173-old="1"]{display:none!important}
#tafsirIndex .bq173-bar{display:flex!important;flex-wrap:wrap!important}
#tafsirIndex .bq173-bar > :not([data-bq173-type="1"]):not([data-bq173-old="1"]){flex:1 1 calc(33.3% - 6px)!important}
html body #tafsirIndex .bq173-bar button[data-bq173-owner="1"]{display:flex!important}
#tafsirIndex #basairTafsirB233TopBar button[data-bq171-saved="1"]{display:flex!important}
'''

def html(mode):
    if mode=='select':
        t='''<div id="sourceType" data-bq173-type="1"><small>نوع التفسير</small><select id="nativeSource"><option value="long">تفسير بصائر القرآن · التفسير التدبري الشامل الموسع</option><option value="short">تفسير بصائر القرآن المختصر</option></select></div>'''
    else:
        t='''<button id="sourceType" data-bq173-type="1"><small>نوع التفسير</small><span>تفسير بصائر القرآن · التفسير التدبري الشامل الموسع</span></button>'''
    return f'''<!doctype html><html lang="ar" dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1" /><style>
    body{{margin:0;padding:0;background:#fffdf9;font:13px Arial,sans-serif}}
    #tafsirIndex{{margin:8px;padding:5px;min-width:0}}
    #basairTafsirB233TopBar{{display:flex;align-items:center;gap:3px}}
    #basairTafsirB233TopBar > button{{min-width:0;min-height:55px}}
    button{{background:white;border:1px solid #d0cbb6;border-radius:12px;color:#14583f;padding:7px}}
    #basairTafsirB232FavoritesPanel{{display:none}}
    #basairTafsirB232FavoritesPanel.show{{display:block}}
    </style></head><body><section id="tafsirIndex" class="active" data-bq157-saved-ready="1"><div id="basairTafsirB233TopBar" class="bq173-bar bq171-tools">
    {t}<button id="miniSearch" data-b233-top="search">🔎</button>
    <button id="p153NotesIndex" data-p153-tab="notes">✎ الملاحظات</button>
    <button id="basairTafsirB232FavoritesBtn" data-bq173-old="1">☆ المفضلة</button>
    <button id="p153FavoritesIndex" data-p153-tab="favorites"><span>☆</span><b>المفضلة</b></button>
    <button data-bq173-owner="1" data-bq171-saved="1">☆ المفضلة والملاحظات</button>
    <button id="follow">متابعة التفسير</button><button id="last">آخر موضع</button>
    </div><div id="fullSearch"><input id="v194T104SurahSearchInput" placeholder="ابحث عن سورة أو آية"></div><h3>فهرس السور</h3><div>سورة الفاتحة</div></section>
    <div id="basairTafsirB232FavoritesPanel"><button data-r3-saved-tab="favorites">المفضلة</button><button data-r3-saved-tab="notes">الملاحظات</button></div>
    <div id="tafsirReader"><div id="tafsirAyahs"><button id="verseFollow">متابعة الآية</button></div></div>
    </body></html>'''

def run():
    count=0;failures=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=(shutil.which('chromium') or shutil.which('google-chrome')),args=['--no-sandbox','--disable-dev-shm-usage'])
        for mode in ('select','button'):
            for dark in (False,True):
                for width in (320,360,390,430,768):
                    page=browser.new_page(viewport={'width':width,'height':840},is_mobile=True,has_touch=True)
                    page.set_default_timeout(2000)
                    errors=[]
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    try:
                        page.set_content(html(mode))
                        page.evaluate('''() => {
                         window.mock={opened:0,notes:0,other:0,changes:0};
                         window.__BASAIR_TAFSIR_P153_STABLE__={refresh(){},openSaved(kind){window.mock.opened++;return true}};
                         window.addEventListener('click',e=>{
                           const b=e.target.closest('button[data-p153-tab]');
                           if(b&&b.closest('#basairTafsirB233TopBar')){
                             e.stopImmediatePropagation();e.preventDefault();
                             document.getElementById('basairTafsirB232FavoritesPanel').classList.add('show');
                             window.mock.opened++;
                           }
                         },true);
                         document.getElementById('follow').onclick=()=>window.mock.other++;
                         document.getElementById('last').onclick=()=>window.mock.other++;
                         document.getElementById('v194T104SurahSearchInput').oninput=()=>window.mock.other++;
                         document.getElementById('verseFollow').onclick=()=>window.mock.other++;
                        }''')
                        if dark:page.evaluate("document.body.classList.add('dark')")
                        page.add_style_tag(content=conflict)
                        page.add_style_tag(content=css)
                        page.add_script_tag(content=js)
                        page.wait_for_function("!!document.querySelector('#tafsirIndex[data-bq174-ready=\"1\"]')")
                        def inspect():
                            return page.evaluate('''() => {
                              const idx=document.querySelector('#tafsirIndex');
                              const bar=idx.querySelector('#basairTafsirB233TopBar');
                              const shown=Array.from(bar.querySelectorAll('button')).filter(x=>{
                               const s=getComputedStyle(x);return s.display!=='none'&&s.visibility!=='hidden';
                              });
                              const p=document.querySelector('#p153FavoritesIndex');
                              const f=document.querySelector('#basairTafsirB232FavoritesBtn');
                              const t=document.querySelector('#sourceType');
                              const v=t.querySelector('[data-bq174-value]');
                              return {shown:shown.map(x=>x.id),savedVisible:getComputedStyle(p).display!=='none',
                               nativeHidden:getComputedStyle(f).display==='none',miniHidden:getComputedStyle(document.querySelector('#miniSearch')).display==='none',
                               originalNotesHidden:getComputedStyle(document.querySelector('#p153NotesIndex')).display==='none',
                               fullSearchVisible:getComputedStyle(document.querySelector('#fullSearch')).display!=='none',
                               typeDisplayed:getComputedStyle(t).display!=='none',
                               selectFullValue:v?v.textContent:'',
                               noOverflow:document.documentElement.scrollWidth<=innerWidth+2,
                               cssGrid:getComputedStyle(bar).display==='grid',
                               typeWidth:t.getBoundingClientRect().width};
                            }''')
                        st=inspect()
                        assert st['cssGrid'] and st['savedVisible'] and st['nativeHidden'] and st['miniHidden'] and st['originalNotesHidden'] and st['fullSearchVisible'],st
                        assert st['shown'].count('p153FavoritesIndex')==1,st
                        assert st['noOverflow'],(width,st)
                        if mode=='select':
                            assert 'الشامل الموسع' in st['selectFullValue'],st
                            page.locator('#nativeSource').select_option('short')
                            page.wait_for_function("document.querySelector('[data-bq174-value]').textContent.includes('المختصر')")
                        page.locator('#p153FavoritesIndex').click()
                        assert page.evaluate('window.mock.opened')==1
                        # Native B233 rebuilds entire toolbar (keep all scripts running).
                        page.evaluate('''() => {
                          const old=document.querySelector('#basairTafsirB233TopBar');
                          const bar=old.cloneNode(true);old.replaceWith(bar);
                        }''')
                        page.wait_for_function("document.querySelector('#p153FavoritesIndex').getAttribute('data-bq174-saved')==='1'")
                        st=inspect()
                        assert st['cssGrid'] and st['nativeHidden'] and st['savedVisible'] and st['miniHidden'] and st['noOverflow'],st
                        assert st['shown'].count('p153FavoritesIndex')==1,st
                        assert not errors,errors
                        count+=1
                    except Exception as e:
                        failures.append((mode,dark,width,str(e)[:550]))
                    finally:page.close()
        browser.close()
    print({'passed':count,'total':20,'failures':failures})
    assert not failures and count==20

if __name__=='__main__':run()
