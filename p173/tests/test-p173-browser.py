from pathlib import Path
from shutil import which
import os
from playwright.sync_api import sync_playwright
R=Path(os.environ.get('BASAIR_TAFSIR_ASSET_DIR', str(Path(__file__).resolve().parents[2]/'p121/owner-qa/modules/tafsir')))
JS=(R/'p173-tafsir-index-rebuild-guard.js').read_text()
CSS=(R/'p173-tafsir-index-rebuild-guard.css').read_text()

def markup(nested=False, with_proxy=False):
    typ='<div class="type"><span>نوع التفسير</span><select id="typeChooser"><option value="b">بصائر القرآن الموسع</option><option value="m">الميسر</option></select></div>' if nested else '<button id="typeBtn">نوع التفسير <select id="typeChooser"><option value="b">بصائر القرآن الموسع</option><option value="m">الميسر</option></select></button>'
    proxy='<button data-bq171-saved="1" id="oldProxy"><b>المفضلة والملاحظات</b></button>' if with_proxy else ''
    return f'''<div id="basairTafsirB233TopBar" class="toolbar">
    {typ}
    <button id="mini" data-b233-top="search">⌕</button>
    <button id="basairTafsirB232FavoritesBtn">☆ المفضلة</button>
    {proxy}<button id="follow">متابعة التفسير</button>
    <button id="last">آخر موضع</button>
    </div>'''

def html(nested, with_proxy, second_root):
    def root(style='',active=True):
        return f'''<section id="tafsirIndex" class="{'active' if active else ''}" style="{style}"><div class="host">{markup(nested,with_proxy)}</div><input id="v194T104SurahSearchInput" placeholder="ابحث عن سورة أو آية"><h2>فهرس السور</h2></section>'''
    hidden=root('display:none',False) if second_root else ''
    return f'''<!doctype html><html lang="ar" dir="rtl"><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{{font:14px Arial;margin:6px;background:#fffdf8;color:#153d30}}.toolbar{{display:flex;gap:5px;align-items:center}}.toolbar>*{{flex:1 1 30%;min-width:0;min-height:44px}}button{{border:1px solid #bbc8bd;border-radius:12px;padding:5px;color:inherit;background:inherit}}#savedPanel{{display:none}}#savedPanel.show{{display:block}}.type{{display:flex;flex-direction:column}}#typeChooser{{width:100%}}</style>
    <body>{hidden}{root()}<div id="savedPanel"><div id="basairTafsirR3SavedTabs"><button data-r3-saved-tab="favorites">المفضلة</button><button data-r3-saved-tab="notes">الملاحظات</button></div></div>
    <div id="tafsirReader"><div id="tafsirAyahs"><button id="followVerse">متابعة الآية</button></div></div>
    </body></html>'''

with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=which('chromium') or None,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    cases=0
    for variant in ('normal','nested','duplicate','existingProxy'):
        for w in (320,360,390,430,768):
            for dark in (False,True):
                is_nested=variant=='nested'
                second=variant=='duplicate'
                with_proxy=variant=='existingProxy'
                p=b.new_page(viewport={'width':w,'height':860},is_mobile=True,has_touch=True)
                errors=[]
                p.on('pageerror',lambda e:errors.append(str(e)))
                p.set_content(html(is_nested,with_proxy,second))
                if dark:p.evaluate("document.body.classList.add('dark')")
                p.evaluate('''() => {
                   window.hits={opened:0,tab:'',search:0,follow:0,oldProxy:0};
                   window.addEventListener('click',e=>{
                     if(e.target.closest('#basairTafsirB232FavoritesBtn')){e.stopImmediatePropagation();e.preventDefault()}
                   },true);
                   window.__BASAIR_TAFSIR_P157_STABLE__={openSaved(k){
                     if(k==='favorites'){
                      const panel=document.querySelector('#savedPanel');panel.classList.add('show');
                      window.hits.opened++;return true
                     }
                     return false
                   }};
                   document.querySelectorAll('[data-r3-saved-tab]').forEach(e=>e.addEventListener('click',()=>window.hits.tab=e.dataset.r3SavedTab));
                   document.querySelectorAll('#v194T104SurahSearchInput').forEach(e=>e.addEventListener('input',()=>window.hits.search++));
                   document.querySelectorAll('#follow').forEach(e=>e.addEventListener('click',()=>window.hits.follow++));
                   if(document.querySelector('#oldProxy'))document.querySelector('#oldProxy').addEventListener('click',()=>window.hits.oldProxy++);
                }''')
                p.add_style_tag(content=CSS)
                p.add_script_tag(content=JS)
                root=p.locator('#tafsirIndex.active')
                assert p.locator('#tafsirIndex button[data-bq173-owner="1"]:visible').count()==1,(variant,w,dark,'initial proxy')
                assert root.locator('#mini').is_hidden(),(variant,w,dark,'mini')
                assert root.locator('#basairTafsirB232FavoritesBtn').is_hidden(),(variant,w,dark,'native fav')
                assert root.locator('#typeChooser').is_visible(),(variant,w,dark,'type')
                if w<760:
                    pos=root.locator('[data-bq173-type]').bounding_box()
                    assert pos and pos['width']>w*.80,(variant,w,dark,'type width',pos)
                else:assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+3'),(variant,w,dark,'tablet overflow')
                root.locator('[data-bq173-owner="1"]').click()
                assert p.evaluate('window.hits.opened')==1,(variant,w,dark,'favorites opens')
                assert p.evaluate('window.hits.oldProxy')==0,(variant,w,dark,'duplicate click')
                p.locator('[data-r3-saved-tab="notes"]').click()
                assert p.evaluate('window.hits.tab')=='notes'
                root.locator('#typeChooser').select_option('m')
                assert root.locator('#typeChooser').input_value()=='m'
                root.locator('#v194T104SurahSearchInput').fill('الفاتحة')
                root.locator('#follow').click()
                assert p.evaluate('window.hits.search===1&&window.hits.follow===1')
                # Native re-renders the toolbar *inside the same connected index* (late UI replacement).
                p.evaluate('''() => {
                  const root=document.querySelector('#tafsirIndex.active');
                  const bar=root.querySelector('#basairTafsirB233TopBar');
                  const parent=bar.parentElement;
                  const replacement=bar.cloneNode(true);
                  replacement.querySelectorAll('[data-bq173-owner],[data-bq171-saved]').forEach(x=>x.remove());
                  replacement.querySelector('#basairTafsirB232FavoritesBtn').removeAttribute('data-bq173-old');
                  replacement.querySelector('#mini').removeAttribute('data-bq173-mini');
                  replacement.querySelector('#typeChooser').value='b';
                  replacement.removeAttribute('class');
                  replacement.querySelectorAll('[data-bq173-type]').forEach(x=>x.removeAttribute('data-bq173-type'));
                  parent.replaceChild(replacement,bar);
                }''')
                # Observe the very next painted frame: native replacement must be reconciled
                # before a visible frame returns to the old toolbar.
                repaired_next_frame=p.evaluate('''() => new Promise(resolve => requestAnimationFrame(() => {
                   const root=document.querySelector('#tafsirIndex.active');
                   resolve(root.querySelectorAll('button[data-bq173-owner=\"1\"]').length===1 &&
                     root.querySelector('#mini').getAttribute('data-bq173-mini')==='1');
                }))''')
                assert repaired_next_frame,(variant,w,dark,'replaced within a painted frame')
                p.wait_for_function('''() => {
                  const root=document.querySelector('#tafsirIndex.active');
                  return root.querySelectorAll('button[data-bq173-owner="1"]').length===1 &&
                    root.querySelector('#mini').getAttribute('data-bq173-mini')==='1' &&
                    root.querySelector('#basairTafsirB232FavoritesBtn').getAttribute('data-bq173-old')==='1';
                }''')
                assert root.locator('button[data-bq173-owner="1"]').count()==1,(variant,w,dark,'rebuild no duplicates')
                assert root.locator('#mini').is_hidden(),(variant,w,dark,'mini hidden after replacement')
                assert root.locator('#basairTafsirB232FavoritesBtn').is_hidden()
                # Rerender via nested wrapper mutation, not direct Index child or known bar ID.
                p.evaluate('''() => {
                  let host=document.querySelector('#tafsirIndex.active .host');
                  host.innerHTML=host.innerHTML.replace(/data-bq173-owner="1"/g,'data-bq173-removed="1"')
                   .replace(/data-bq173-old="1"/g,'data-bq173-removedold="1"')
                   .replace(/data-bq173-mini="1"/g,'data-bq173-removedmini="1"');
                  host.querySelectorAll('button[data-bq173-removed="1"]').forEach(e=>e.remove());
                  host.querySelectorAll('[data-bq173-type]').forEach(e=>e.removeAttribute('data-bq173-type'));
                  host.querySelector('#basairTafsirB233TopBar').classList.remove('bq173-bar');
                }''')
                p.wait_for_function("""() => document.querySelectorAll('#tafsirIndex.active button[data-bq173-owner="1"]').length === 1""")
                assert root.locator('#mini').is_hidden(),(variant,w,dark,'nested rerender')
                assert not errors,(variant,w,dark,errors)
                cases+=1;p.close()
    b.close()
    print('P173 Chromium field re-render regression PASS',cases,'/',cases)
