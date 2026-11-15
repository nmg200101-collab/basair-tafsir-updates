#!/usr/bin/env python3
from pathlib import Path
from zipfile import ZipFile
import argparse,hashlib
from playwright.sync_api import sync_playwright
import json,shutil,sys
cli=argparse.ArgumentParser(description='Exercise real P117/P118 bytes from owner V695 APK against proposed OTA UI; no Android WebView installed.')
cli.add_argument('--apk',required=True)
args=cli.parse_args()
ROOT=Path(__file__).resolve().parents[2]
patch=ROOT/'p121/owner-qa/modules/tafsir'
with ZipFile(args.apk) as apk:
 P117=apk.read('assets/www/tafsir-index-p117.js').decode('utf8')
 P118=apk.read('assets/www/p118-tafsir-visual-match.js').decode('utf8')
 B233=apk.read('assets/www/tafsir-final-ui-polish-b233.js')
assert hashlib.sha256(P117.encode()).hexdigest()=='e25b4d6b8fc82c09ede63ecc2599284cf71e13daecaca018da15f76caae2dcfb'
assert hashlib.sha256(P118.encode()).hexdigest()=='30a87fc1897bf0c6820cf830d18408cb2a654121ca98af92feb086d4c85b5fb5'
assert hashlib.sha256(B233).hexdigest()=='c924a1f61eca09a89ace43f47b6738ce9c5cbcd848bf545e741bef24201f16a2'
P175=(patch/'p175-tafsir-index-single-owner.js').read_text()
CSS=(patch/'p175-tafsir-index-single-owner.css').read_text()
html='''<!doctype html><html lang="ar" dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:5px;font:14px Arial;background:#fffefa} #tafsirIndex{display:block;padding:3px}
#basairTafsirB233TopBar{display:flex;gap:5px;width:100%}button{cursor:pointer}
#v194T104SurahBrowser{min-height:90px}</style></head><body>
<div id="bqP26Actions"><button id="bqP26More">المزيد</button></div>
<section id="tafsirIndex" class="active"><div class="readerHead">فهرس التفسير</div>
<div id="v194T104SurahBrowser" data-view="list"><div class="v194T104SurahHead"><b>فهرس السور</b><small>اختر السورة للبدء</small></div></div>
<div id="v194T2IndexNav"><div class="v194T2NavHead">النوع</div></div>
<select id="v194T2IndexType"><option value="basair">تفسير بصائر القرآن — التفسير التدبري الموسع والشامل</option><option value="brief">تفسير القرآن المختصر</option></select>
<div class="v194T104SurahSearch"><input id="v194T104SurahSearchInput" placeholder="ابحث عن سورة أو آية"></div>
<div id="basairTafsirB233TopBar" style="display:grid!important"><button id="basairTafsirB233TypeBtn">نوع التفسير</button><button data-b233-top="search">⌕</button><button id="basairTafsirB232FavoritesBtn">☆ المفضلة</button></div>
</section><section id="tafsirReader"></section><section id="basairTafsirB232FavoritesPanel"><button id="favoritesTab">المفضلة</button><button id="notesTab">الملاحظات</button></section>
</body></html>'''
js_hook='''() => {
 window.test={opens:0,lastType:'',follows:0};
 window.__BASAIR_TAFSIR_P157_STABLE__={openSaved:(v)=>{window.test.opens++;return true;}};
 window.__BASAIR_TAFSIR_STEP2__={state:()=>({s:1,a:1,type:document.getElementById('v194T2IndexType').value}),open:()=>{window.test.follows++}};
 window.__BASAIR_TAFSIR_STEP104__={view:()=>{}};
}'''
snap='''() => {
 const q=s=>document.querySelector(s);
 const get=e=>e ? getComputedStyle(e):null;
 const top=q('#bqTf118Topbar'); const mini=q('#bqTf118SearchAction');
 const type=q('#bqTf117Type');const typeValue=q('#bq175P118FullType');
 const save=q('#bq175P118Saved');const fav=q('#bqTf117Favorites');const old=q('#basairTafsirB233TopBar');
 return {present:!!top,layout:get(top)?.display,gridColumns:get(top)?.gridTemplateColumns,
  miniVisible:!!mini&&get(mini).display!=='none',oldVisible:!!old&&get(old).display!=='none',
  favVisible:!!fav&&get(fav).display!=='none',saved:!!save,saveVisible:!!save&&get(save).display!=='none',
  mirror:typeValue?.textContent,select:type?.value,typeVisible:get(type)?.pointerEvents,
  typeParent:type?.parentElement?.parentElement?.id,controls:[...top?.children||[]].map(e=>({id:e.id,cl:e.className})),
  marginOverflow:document.documentElement.scrollWidth-window.innerWidth,
  ready:window.__BASAIR_TAFSIR_P175_SINGLE_INDEX_OWNER__?.status(),
  p118:window.__BASAIR_P118_TAFSIR_INDEX_MATCH__?.diagnostics?.()};
}'''
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=shutil.which('chromium') or None,
                                  args=['--no-sandbox','--disable-dev-shm-usage'])
    cases = [(width,mode,order) for width in (320,360,390,430,768)
             for mode in ('light','dark') for order in ('patch-first','patch-last')]
    results=[]
    for start in range(0,len(cases),4):
        batch=[]
        for width,mode,order in cases[start:start+4]:
            page=browser.new_page(viewport={'width':width,'height':850},is_mobile=True,has_touch=True)
            errors=[]
            page.on('pageerror',lambda e,errs=errors:errs.append(str(e)))
            page.set_content(html)
            if mode=='dark':page.evaluate("document.body.classList.add('dark')")
            page.evaluate(js_hook)
            if order=='patch-first':
                page.add_style_tag(content=CSS);page.add_script_tag(content=P175)
                page.add_script_tag(content=P117);page.add_script_tag(content=P118)
            else:
                page.add_script_tag(content=P117);page.add_script_tag(content=P118)
                page.add_style_tag(content=CSS);page.add_script_tag(content=P175)
            batch.append((page,width,mode,order,errors))
        # Wait for the real native P117/P118 timed initialization.
        batch[0][0].wait_for_timeout(4800)
        for page,width,mode,order,errors in batch:
            try:
                page.wait_for_function("document.querySelector('#bqTf118Topbar') && document.querySelector('#bq175P118Saved')",timeout=700)
                before=page.evaluate(snap)
                page.locator('#bq175P118Saved').click(force=True)
                opened=page.evaluate('window.test.opens')
                page.evaluate('''() => {
                    let n=document.querySelector('#v194T2IndexType');n.value='brief';
                    n.dispatchEvent(new Event('change',{bubbles:true}));
                    let b=document.querySelector('#bqTf117Type');b.value='brief';
                    b.dispatchEvent(new Event('change',{bubbles:true}));
                }''')
                page.wait_for_timeout(50)
                selected=page.evaluate(snap)['mirror']
                page.evaluate("""() => {
                    const bar=document.getElementById('bqTf118Topbar');
                    const dash=document.getElementById('bqTf117Dashboard');
                    for(const child of [...bar.children])
                        if(child.classList.contains('bq-tf117-type')||child.classList.contains('bq-tf117-actions'))
                            dash.insertBefore(child,bar);
                    bar.remove();
                    window.__BASAIR_P118_TAFSIR_INDEX_MATCH__.refresh();
                }""")
                page.wait_for_function("document.querySelector('#bqTf118Topbar #bq175P118Saved')",timeout=700)
                after=page.evaluate(snap)
                valid=all([
                    before['present'],before['layout']=='grid',not before['miniVisible'],
                    not before['oldVisible'],not before['favVisible'],before['saved'],
                    before['saveVisible'],opened==1, before['marginOverflow']<=4,
                    selected=='تفسير القرآن المختصر',
                    after['present'],after['layout']=='grid',not after['miniVisible'],
                    not after['oldVisible'],not after['favVisible'],after['saved'],after['saveVisible'],
                    not errors,
                ])
                results.append({'width':width,'mode':mode,'order':order,'pass':valid,
                                'selected':selected,'mirrored':after['mirror'],
                                'errors':errors[:3]})
            except Exception as exc:
                results.append({'width':width,'mode':mode,'order':order,'pass':False,
                                'error':str(exc),'errors':errors[:3]})
            page.close()
    browser.close()
    passed=sum(bool(x['pass']) for x in results)
    print(json.dumps({'passed':passed,'total':len(results),
                      'fixture':'genuine V695 P117/P118 JavaScript from owner APK; synthetic native host shell',
                      'android_webview':False,'results':results},ensure_ascii=False,indent=2))
    if passed!=len(results):sys.exit(1)
