from playwright.sync_api import sync_playwright
from pathlib import Path
import json,shutil,sys,argparse
arg=argparse.ArgumentParser();arg.add_argument('--report',default=None);a=arg.parse_args()
ROOT=Path(__file__).resolve().parents[2]
JS=(ROOT/'p121/owner-qa/modules/tafsir/p176-saved-return-context.js').read_text()
HTML='''<!doctype html><html lang="ar"><head><style>
#basairTafsirB232FavoritesPanel{display:none}#basairTafsirB232FavoritesPanel.show{display:block}
#tafsirReader{display:none}#tafsirReader.active{display:block}
</style></head><body>
<section id="tafsirIndex" class="active"><div id="v194T104SurahBrowser">فهرس السور</div></section>
<section id="tafsirReader">قارئ الآيات</section>
<section id="basairTafsirB232FavoritesPanel" class="show">
<div id="basairTafsirR3SavedTabs"><button data-r3-saved-tab="favorites" aria-selected="true" class="on">المفضلة</button>
<button data-r3-saved-tab="notes" aria-selected="false">الملاحظات</button></div>
<div id="basairTafsirB232FavoritesList" style="height:60px;overflow:auto"><div style="height:80px"></div>
<button data-b232-fav-open="2:5">سورة البقرة آية 5</button><div style="height:100px"></div></div>
<div id="basairTafsirR3NotesList" style="height:60px;overflow:auto"><div style="height:80px"></div>
<button data-r3-note-open="1:3">الفاتحة آية 3</button><button data-r3-note-edit="1:3">تعديل الملاحظة</button><div style="height:100px"></div></div>
<button id="basairTafsirB232FavoritesClose">رجوع</button>
</section></body></html>'''
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 results=[]
 for tab,selector in [('favorites','[data-b232-fav-open]'),('notes','[data-r3-note-open]')]:
  page=b.new_page(viewport={'width':390,'height':800},is_mobile=True,has_touch=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML)
  page.evaluate('''(tab) => {
   window.test={opens:0,tab:'',edited:0};
   window.__BASAIR_TAFSIR_P157_STABLE__={openSaved:(mode)=>{
    test.opens++;test.tab=mode;
    document.querySelector('#basairTafsirB232FavoritesPanel').classList.add('show');
    document.querySelectorAll('[data-r3-saved-tab]').forEach(e=>{let sel=e.dataset.r3SavedTab===mode;e.classList.toggle('on',sel);e.setAttribute('aria-selected',sel?'true':'false')});
    return true;
   }};
   document.querySelector('[data-r3-note-edit]').addEventListener('click',()=>{test.edited++});
   document.querySelectorAll('[data-b232-fav-open],[data-r3-note-open]').forEach(el=>el.addEventListener('click',()=>{
     document.querySelector('#basairTafsirB232FavoritesPanel').classList.remove('show');
     document.querySelector('#tafsirIndex').classList.remove('active');
     document.querySelector('#tafsirReader').classList.add('active');
   }));
  }''',tab)
  page.add_script_tag(content=JS)
  if tab=='notes':
   page.evaluate("document.querySelectorAll('[data-r3-saved-tab]').forEach(x=>{const active=x.dataset.r3SavedTab==='notes';x.classList.toggle('on',active);x.setAttribute('aria-selected',active?'true':'false')})")
  page.evaluate('''(tab)=>{const v=document.getElementById(tab==='notes'?'basairTafsirR3NotesList':'basairTafsirB232FavoritesList');v.scrollTop=40;}''',tab)
  page.locator(selector).click()
  page.wait_for_function('document.getElementById("tafsirReader").classList.contains("active")')
  # Leave the reader using native navigation; P176 must NOT hijack window.basairBack.
  page.evaluate("document.querySelector('#tafsirReader').classList.remove('active');document.querySelector('#tafsirIndex').classList.add('active');")
  page.wait_for_function('window.test.opens===1')
  # The original panel restores focus on the next animation frame.
  # Wait for that frame, rather than racing R3's focus restoration.
  page.wait_for_function("(tab) => document.activeElement?.getAttribute(tab==='notes'?'data-r3-note-open':'data-b232-fav-open') === (tab==='notes'?'1:3':'2:5')",arg=tab,timeout=1500)
  status=page.evaluate("window.__BASAIR_TAFSIR_P176_SAVED_RETURN__.status()")
  outcome=page.evaluate('''(tab)=>({panel:document.querySelector('#basairTafsirB232FavoritesPanel').classList.contains('show'),
    tab:document.querySelector('[aria-selected="true"]').dataset.r3SavedTab,
    scroll:document.getElementById(tab==='notes'?'basairTafsirR3NotesList':'basairTafsirB232FavoritesList').scrollTop,
    focused:document.activeElement?.getAttribute(tab==='notes'?'data-r3-note-open':'data-b232-fav-open')})''',tab)
  passed=outcome['panel'] and outcome['tab']==tab and outcome['scroll']>=39 and outcome['focused']==('1:3' if tab=='notes' else '2:5') and status['restored']==1 and not status['pending'] and not errors
  results.append({'case':tab,'passed':passed,'result':outcome,'state':status,'errors':errors})
  page.close()
 # close from saved panel without entering reader must not cause a restore
 page=b.new_page();page.set_content(HTML);page.add_script_tag(content=JS)
 page.locator('#basairTafsirB232FavoritesClose').click()
 status=page.evaluate('window.__BASAIR_TAFSIR_P176_SAVED_RETURN__.status()')
 results.append({'case':'close without item','passed':not status['pending'] and status['restored']==0,'status':status})
 page.close();b.close()
print(json.dumps(results,ensure_ascii=False,indent=2))
if a.report:Path(a.report).write_text(json.dumps(results,ensure_ascii=False,indent=2))
sys.exit(0 if all(r['passed'] for r in results) else 1)
