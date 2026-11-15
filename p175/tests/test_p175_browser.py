from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2] / 'p121/owner-qa/modules/tafsir'
if not ROOT.is_dir(): ROOT=Path(__file__).parent
CSS=(ROOT/'p175-tafsir-index-single-owner.css').read_text()
JS=(ROOT/'p175-tafsir-index-single-owner.js').read_text()
P174=ROOT
OLD_CSS=(P174/'p174-tafsir-index-native-final.css').read_text()
OLD_JS=(P174/'p174-tafsir-index-native-final.js').read_text()
CONFLICT='''
html body #tafsirIndex #basairTafsirB233TopBar #basairTafsirB232FavoritesBtn {display:flex!important}
html body #tafsirIndex #basairTafsirB233TopBar.bq173-bar button[data-bq173-owner="1"]{display:flex!important}
#tafsirIndex .bq173-bar {display:flex!important;flex-wrap:wrap!important}
html body #tafsirIndex #basairTafsirB233TopBar > :first-child {grid-column:1!important;grid-row:1!important}
html body #tafsirIndex #basairTafsirB233TopBar #p153FavoritesIndex {grid-column:2!important;grid-row:1!important}
'''
LABEL='تفسير بصائر القرآن — التفسير التدبري الشامل الموسع'

def toolbar(mode):
    if mode=='select':
        t=f'''<div id="sourceType" class="source-type"><small>نوع التفسير</small><select id="sourceSel" aria-label="اختيار نوع التفسير"><option value="long">{LABEL}</option><option value="short">تفسير بصائر القرآن المختصر</option></select></div>'''
    else:
        t=f'''<button id="sourceType" class="source-type"><small>نوع التفسير</small><span>{LABEL}</span></button>'''
    return f'''<div id="basairTafsirB233TopBar" class="bq173-bar bq171-tools">{t}
        <button id="basairTafsirB232FavoritesBtn" data-bq173-old="1">☆ المفضلة</button>
        <button id="mini" data-b233-top="search">⌕</button>
        <button id="p153NotesIndex" data-p153-tab="notes">✎ الملاحظات</button>
        <button id="p153FavoritesIndex" data-p153-tab="favorites"><span>☆</span><b>المفضلة</b></button>
        <button data-bq173-owner="1" data-bq171-saved="1">☆ المفضلة والملاحظات</button>
        <button id="follow">متابعة التفسير</button>
        <button id="last">آخر موضع</button></div>'''

def html(mode):
    return f'''<!doctype html><html lang="ar" dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>body{{margin:0;background:#fafaf6;font:14px Arial;color:#12513c}}
    #tafsirIndex{{box-sizing:border-box;padding:8px;width:100%}}
    #basairTafsirB233TopBar{{display:flex;gap:4px;align-items:center}}
    #basairTafsirB233TopBar>button{{min-height:50px;border:1px solid #cfcab8;background:#fff;border-radius:12px}}
    #sourceType{{border:1px solid #cfcab8;background:#e9f2ed;border-radius:12px}}
    #savedPanel{{display:none}}#savedPanel.show{{display:block}}
    </style></head><body><div id="tafsirIndex" class="active">{toolbar(mode)}
    <div id="search" style="padding:12px"><input id="v194T104SurahSearchInput" placeholder="ابحث عن سورة أو آية" /></div>
    <h2>فهرس السور</h2><div>سورة الفاتحة</div></div>
    <div id="savedPanel"><button id="notesTab">الملاحظات</button><button>المفضلة</button></div>
    <div id="tafsirReader"><div id="tafsirAyahs"><button id="verseFollow">متابعة الآية</button></div></div></body></html>'''

MOCK='''() => {
  window.events={saved:0,follow:0,last:0,verse:0,search:0,notes:0};
  window.__BASAIR_TAFSIR_P153_STABLE__={refresh(){}, openSaved(k){
     window.events.saved++;document.getElementById('savedPanel').classList.add('show');return true;
  }};
  window.addEventListener('click',e=>{
    const b=e.target.closest('#p153FavoritesIndex');
    if(b&&b.closest('#basairTafsirB233TopBar')){
      e.stopImmediatePropagation();e.preventDefault();
      window.events.saved++;document.getElementById('savedPanel').classList.add('show');
    }
  },true);
  document.getElementById('follow').onclick=()=>events.follow++;
  document.getElementById('last').onclick=()=>events.last++;
  document.getElementById('verseFollow').onclick=()=>events.verse++;
  document.getElementById('v194T104SurahSearchInput').oninput=()=>events.search++;
  document.getElementById('notesTab').onclick=()=>events.notes++;
  window.makeNativeBar=(template)=>{
    const old=document.getElementById('basairTafsirB233TopBar');
    old.outerHTML=template;
    document.getElementById('follow').onclick=()=>events.follow++;
    document.getElementById('last').onclick=()=>events.last++;
  };
}'''

CHECK='''() => {
  const bar=document.querySelector('#basairTafsirB233TopBar'),
    type=document.querySelector('#sourceType'),saved=document.querySelector('#p153FavoritesIndex'),
    follow=document.querySelector('#follow'),last=document.querySelector('#last'),
    name=type.querySelector('[data-bq175-full-value="1"]'),rect=x=>x.getBoundingClientRect(),
    show=x=>x&&getComputedStyle(x).display!=='none'&&getComputedStyle(x).visibility!=='hidden';
  const hidden=['#basairTafsirB232FavoritesBtn','#p153NotesIndex','#mini',
    '[data-bq171-saved="1"]','[data-bq173-owner="1"]'];
  const controls=Array.from(bar.querySelectorAll('button')).filter(show);
  return {ready:bar.getAttribute('data-bq175-owned')==='1',
    typeWidth:rect(type).width,barWidth:rect(bar).width,rows:[rect(type).top,rect(saved).top,rect(follow).top,rect(last).top],
    shown:controls.map(x=>x.id),hidden: hidden.every(s=>Array.from(bar.querySelectorAll(s)).every(x=>!show(x))),
    saved:show(saved),follow:show(follow),last:show(last),name:name?.textContent||'',
    mirrors:type.querySelectorAll('[data-bq175-full-value="1"]').length,
    fullSearch:show(document.getElementById('v194T104SurahSearchInput')),
    overflow:document.documentElement.scrollWidth>window.innerWidth+3,
    sourceSelect:!!type.querySelector('select')}
}'''

def assert_view(page,mode,width):
    page.wait_for_function('document.querySelector("#basairTafsirB233TopBar").getAttribute("data-bq175-owned")==="1"')
    data=page.evaluate(CHECK)
    assert data['ready'] and data['saved'] and data['follow'] and data['last'],data
    assert data['hidden'],data
    assert data['shown']==['p153FavoritesIndex','follow','last'] if mode=='select' else 'p153FavoritesIndex' in data['shown'],data
    assert data['typeWidth'] >= data['barWidth']-4,data
    assert data['rows'][1]>data['rows'][0] and abs(data['rows'][1]-data['rows'][2])<8 and abs(data['rows'][2]-data['rows'][3])<8,data
    assert data['fullSearch'] and not data['overflow'],data
    if mode=='select':
        assert data['name']==LABEL and data['mirrors']==1,data
    return data

def main():
    tested=0
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
        for mode in ('select','button'):
            for dark in (False,True):
                for width in (320,360,390,430,768):
                    page=browser.new_page(viewport={'width':width,'height':870},is_mobile=True,has_touch=True)
                    page.set_default_timeout(5000)
                    errors=[]
                    page.on('pageerror',lambda e: errors.append(str(e)))
                    page.set_content(html(mode))
                    page.evaluate(MOCK)
                    if dark:page.evaluate('document.body.classList.add("dark")')
                    page.add_style_tag(content=CONFLICT)
                    page.add_style_tag(content=OLD_CSS)
                    page.add_script_tag(content=OLD_JS)
                    page.add_style_tag(content=CSS)
                    page.add_script_tag(content=JS)
                    data=assert_view(page,mode,width)
                    page.locator('#p153FavoritesIndex').click()
                    assert page.evaluate('events.saved')==1
                    page.locator('#follow').click()
                    page.locator('#last').click()
                    page.locator('#v194T104SurahSearchInput').fill('الفاتحة')
                    page.evaluate("document.getElementById('verseFollow').click()")
                    assert page.evaluate('events.follow==1&&events.last==1&&events.search==1&&events.verse==1')
                    if mode=='select':
                        page.evaluate("() => {const s=document.getElementById('sourceSel'); s.value='short';s.dispatchEvent(new Event('change',{bubbles:true}));}")
                        page.wait_for_function("document.querySelector('[data-bq175-full-value]').textContent==='تفسير بصائر القرآن المختصر'")
                        assert page.locator('[data-bq175-full-value]').count()==1
                    # B233 rebuilds its entire toolbar AFTER the initial layout was installed.
                    page.evaluate('(template)=>window.makeNativeBar(template)',toolbar(mode))
                    assert_view(page,mode,width)
                    # Native reset of type element style (without changing children).
                    page.evaluate("() => {const b=document.querySelector('#basairTafsirB233TopBar'); b.style.display='flex';b.setAttribute('class','bq173-bar bq171-tools');}")
                    page.wait_for_function("getComputedStyle(document.querySelector('#basairTafsirB233TopBar')).display==='grid'")
                    assert_view(page,mode,width)
                    # Verify no uncontrolled repeating repaint loops while idle.
                    page.wait_for_timeout(150)
                    before=page.evaluate('window.__BASAIR_TAFSIR_P175_SINGLE_INDEX_OWNER__.status().ticks')
                    page.wait_for_timeout(250)
                    after=page.evaluate('window.__BASAIR_TAFSIR_P175_SINGLE_INDEX_OWNER__.status().ticks')
                    assert after-before<=2,(mode,dark,width,before,after)
                    assert not errors,errors
                    page.close()
                    tested+=1
                    print('pass',mode,'dark' if dark else 'light',width)
        browser.close()
    print(f'P175 Chromium browser: PASS {tested}/{tested}; original P153 control, full type, late rerender, idle stability')

if __name__=='__main__':main()
