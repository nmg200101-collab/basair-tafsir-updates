#!/usr/bin/env python3
"""P176: actual V695 P117/P118 source + signed P175 index layer. Browser fixture,
not a field test on Android. 5 widths × day/night × long/short source = 20 cases.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from zipfile import ZipFile
import sys, json, hashlib, shutil, argparse
arg=argparse.ArgumentParser(description='P176 browser fixture with owner V695 original APK code; no APK sent to GitHub')
arg.add_argument('--apk',required=True)
arg.add_argument('--report',default=None)
a=arg.parse_args()
ROOT=Path(__file__).resolve().parents[2]
ASSETS=ROOT/'p121/owner-qa/modules/tafsir'
APK=Path(a.apk)
assert APK.is_file(),str(APK)
with ZipFile(APK) as z:
 p117=z.read('assets/www/tafsir-index-p117.js').decode('utf-8')
 p118=z.read('assets/www/p118-tafsir-visual-match.js').decode('utf-8')
 assert hashlib.sha256(p117.encode()).hexdigest()=='e25b4d6b8fc82c09ede63ecc2599284cf71e13daecaca018da15f76caae2dcfb'
 assert hashlib.sha256(p118.encode()).hexdigest()=='30a87fc1897bf0c6820cf830d18408cb2a654121ca98af92feb086d4c85b5fb5'
js175=(ASSETS/'p175-tafsir-index-single-owner.js').read_text()
css175=(ASSETS/'p175-tafsir-index-single-owner.css').read_text()
css176=(ASSETS/'p176-tafsir-two-row-index.css').read_text()
js176=(ASSETS/'p176-saved-return-context.js').read_text()

HTML='''<!doctype html><html lang="ar" dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:5px;font:14px Arial;background:#fffefa}#tafsirIndex{display:block;padding:3px}button{cursor:pointer}#v194T104SurahBrowser{min-height:90px}</style></head>
<body><div id="bqP26Actions"><button id="bqP26More">المزيد</button></div>
<section id="tafsirIndex" class="active"><div class="readerHead">فهرس التفسير</div>
<div id="v194T104SurahBrowser" data-view="list"><div class="v194T104SurahHead"><b>فهرس السور</b><small>اختر السورة للبدء</small></div></div>
<select id="v194T2IndexType"><option value="basair">بصائر القرآن — المشروع التدبري الموسع</option><option value="brief">التفسير المختصر</option></select>
<div class="v194T104SurahSearch"><input id="v194T104SurahSearchInput" placeholder="بحث عن سورة أو آية"></div>
<div id="basairTafsirB233TopBar"><button>نوع التفسير</button><button data-b233-top="search">⌕</button><button id="basairTafsirB232FavoritesBtn">☆ المفضلة</button></div>
</section>
<section id="tafsirReader"></section>
<div id="basairTafsirB232FavoritesPanel"><div id="basairTafsirR3SavedTabs"><button data-r3-saved-tab="favorites" aria-selected="true" class="on">المفضلة</button><button data-r3-saved-tab="notes">الملاحظات</button></div>
 <div id="basairTafsirB232FavoritesList"><button data-b232-fav-open="2:5">سورة البقرة — آية 5</button></div>
 <div id="basairTafsirR3NotesList"><button data-r3-note-open="1:3">سورة الفاتحة — آية 3</button></div>
 <button id="basairTafsirB232FavoritesClose">رجوع</button>
</div></body></html>'''
PREP='''() => {
window.test={opens:0,follows:0,surahs:0,last:0,search:0,restores:0};
window.__BASAIR_TAFSIR_P157_STABLE__={openSaved:(tab)=>{test.opens++;const panel=document.getElementById('basairTafsirB232FavoritesPanel');panel.classList.add('show');const nodes=panel.querySelectorAll('[data-r3-saved-tab]');nodes.forEach(e=>{const good=e.getAttribute('data-r3-saved-tab')===tab;e.classList.toggle('on',good);e.setAttribute('aria-selected',good?'true':'false')});return true}};
window.__BASAIR_TAFSIR_STEP2__={state:()=>({s:1,a:1,type:document.getElementById('v194T2IndexType').value}),open:()=>{test.follows++}};
window.__BASAIR_TAFSIR_STEP104__={view:()=>{}};
window.__BASAIR_TAFSIR_CORE__={q:[{name:'الفاتحة',count:7},{name:'البقرة',count:286}],toast:()=>{}};
}'''
SNAP='''() => {const $=s=>document.querySelector(s),cs=e=>e?getComputedStyle(e):{};
const top=$('#bqTf118Topbar'),mirror=$('#bq175P118FullType'),save=$('#bq175P118Saved');const type=$('.bq-tf117-type'),follow=$('#bqTf117Resume'),last=$('#bqTf118Last'),jumps=$('.bq-tf117-jumps');
const r={top:!!top,grid:cs(top).display,columns:cs(top).gridTemplateColumns,
 typeBox:type?.getBoundingClientRect().toJSON(),saveBox:save?.getBoundingClientRect().toJSON(),followBox:follow?.getBoundingClientRect().toJSON(),lastBox:last?.getBoundingClientRect().toJSON(),
 searchBox:$('.bq-tf117-search-panel')?.getBoundingClientRect().toJSON(),surahBox:$('#v194T104SurahBrowser')?.getBoundingClientRect().toJSON(),
 mirror:mirror?.textContent,saveVisible:!!save&&cs(save).display!=='none',miniHidden:cs($('#bqTf118SearchAction')).display==='none',favHidden:cs($('#bqTf117Favorites')).display==='none',
 searchVisible:!!$('#bqTf117Search'),jumpButtons:jumps?.querySelectorAll('button').length,overflow:document.documentElement.scrollWidth-innerWidth};return r;}'''

results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (320,360,390,430,768):
  for dark in (False,True):
   page=browser.new_page(viewport={'width':width,'height':850},is_mobile=True,has_touch=True)
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(HTML)
   if dark:page.evaluate("document.body.classList.add('dark')")
   page.evaluate(PREP)
   page.add_script_tag(content=p117)
   page.add_script_tag(content=p118)
   page.add_style_tag(content=css175)
   page.add_script_tag(content=js175)
   page.add_style_tag(content=css176)
   page.add_script_tag(content=js176)
   page.wait_for_function("document.querySelector('#bqTf118Topbar') && document.querySelector('#bq175P118Saved')",timeout=6500)
   for opt in ('basair','brief'):
    try:
     page.locator('#bqTf117Type').select_option(opt,force=True)
     page.wait_for_timeout(45)
     s=page.evaluate(SNAP)
     b=[s[k] for k in ('typeBox','saveBox','followBox','lastBox')]
     # Same toolbar row and exact top alignment, within 3 CSS px.
     row=all(x is not None for x in b) and max(abs(x['y']-b[0]['y']) for x in b)<=3
     searchBelow=bool(s['searchBox'] and b[0] and s['searchBox']['y']>=b[0]['bottom']-3)
     surahsBelow=bool(s['surahBox'] and s['searchBox'] and s['surahBox']['y']>=s['searchBox']['bottom']-3)
     longVisible='بصائر القرآن' in s['mirror'] if opt=='basair' else 'مختصر' in s['mirror']
     isOk=all([row,searchBelow,surahsBelow,s['saveVisible'],s['miniHidden'],s['favHidden'],s['searchVisible'],s['jumpButtons']==3,s['overflow']<=3,longVisible,not errors])
     results.append({'width':width,'night':dark,'source':opt,'pass':isOk,'topRowSameY':row,'secondSearchRow':searchBelow,'surahsBelow':surahsBelow,'overflow':s['overflow'],'topHeight':round(b[0]['height'],1) if b[0] else None,'mirror':s['mirror'],'errors':errors[:2]})
    except Exception as exc:
     results.append({'width':width,'night':dark,'source':opt,'pass':False,'error':str(exc),'errors':errors[:3]})
   page.close()
 browser.close()
print(json.dumps({'passed':sum(x['pass'] for x in results),'total':len(results),'results':results},ensure_ascii=False,indent=2))
if a.report:
 Path(a.report).write_text(json.dumps({'passed':sum(x['pass'] for x in results),'total':len(results),'results':results},ensure_ascii=False,indent=2))
sys.exit(0 if all(x['pass'] for x in results) else 1)
