"""P178 mock-DOM behavior regression, not a live WebView/network audio test."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
JS=(ROOT/'modules/p178-salman-selected-follow.js').read_text()
CSS=(ROOT/'modules/p178-salman-selected-follow.css').read_text()

HTML='''<!doctype html><html lang="ar" dir="rtl"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>
<section id="tilawaIndex" class="active"><div id="v135TilawaTools"></div></section>
<div id="r108Sheet" hidden><div id="r108Panel"><header><button id="r108Back">رجوع</button><b id="r108Title">التلاوات المختارة</b></header>
<div id="r108List"><input id="r109Search"/><select id="r91Filter" class="r91Filter"><option value="all">الكل</option><option value="mp3">مصحف صوتي</option><option value="tv">مختارات</option></select>
<div id="r109ReaderGrid" class="r109ReaderGrid"><article id="originalReader">القارئ الحالي</article></div></div><div id="r108MediaArea" hidden></div><p id="r108Status"></p></div></div>
<div id="sequenceSheetV10"><label>القارئ <select id="sequenceReciterV17"><option value="alafasy">مشاري العفاسي</option></select></label></div>
<select id="readerSurahSelect"><option value="1">سورة الفاتحة</option><option value="18">سورة الكهف</option></select>
<audio id="tilawaAudio"></audio>
</body></html>'''

PRELUDE='''() => {
 window.__originalChosen=[];
 window.__followOps=[];
 const st={screen:'readers',reader:null,playing:null,items:[],audio:null};
 const r={active(){return !document.getElementById('r108Sheet').hidden;},open(){document.getElementById('r108Sheet').hidden=false;},
  reciter(id){window.__originalChosen.push(id);},
  back(){if(st.screen==='player'){if(st.audio)st.audio.pause();st.audio=null;st.playing=null;document.getElementById('r108MediaArea').replaceChildren();st.screen='records';return true;}
   if(st.screen==='records'){st.screen='readers';st.reader=null;return true;}return false;},
  _test:{state:st}};
 window.__BASAIR_R109_SELECTED__=r;
 window.__BASAIR_P89_FOLLOW__={
  read(kind){return kind==='audio'?{readerId:'salman-obaid-almutairi',trackKey:'salman-18',seconds:43}:{};},
  _test:{update(kind,pos){window.__followOps.push({kind,readerId:pos.readerId});}},
  resume(kind){window.__followOps.push({resume:kind});}
 };
 HTMLMediaElement.prototype.play=function(){this.__played=true;return Promise.resolve();};
 HTMLMediaElement.prototype.pause=function(){this.__played=false;};
}
'''

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  results=[]
  for width in (320,390,430,768):
   for mode in ('light','dark'):
    page=browser.new_page(viewport={'width':width,'height':880})
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    page.set_content(HTML)
    page.evaluate(PRELUDE)
    if mode=='dark':page.evaluate('document.documentElement.classList.add("dark")')
    page.add_style_tag(content=CSS)
    page.add_script_tag(content=JS)
    # The R109 sheet is initially closed; the native app opens it lazily.
    page.evaluate('document.getElementById("r108Sheet").hidden=false')
    page.wait_for_selector('#p178SalmanReaderCard')
    assert page.locator('#p178SalmanReaderCard').count()==1
    assert page.locator('#originalReader').count()==1
    # Open the new reader and verify the exact full 114-surah list.
    page.locator('#p178SalmanReaderCard button').click()
    assert page.locator('#p178SurahSelect option').count()==114
    assert page.locator('#r108MediaArea').is_hidden()
    assert page.evaluate('window.__BASAIR_R109_SELECTED__._test.state.reader.id')=='salman-obaid-almutairi'
    # Current reader is not replaced in the original Native R109 list.
    page.evaluate("window.__BASAIR_R109_SELECTED__.reciter('masad')")
    assert page.evaluate('window.__originalChosen[0]')=='masad'
    # Streaming starts only after an explicit click.
    page.locator('#p178SurahSelect').select_option('18')
    page.locator('#r108List button').first.click()
    assert page.locator('#r109Audio').count()==1
    assert page.evaluate('document.getElementById("r109Audio").src.endsWith("/018.mp3")')
    assert page.evaluate('window.__BASAIR_R109_SELECTED__._test.state.playing.key')=='salman-18'
    assert page.locator('#r108MediaArea').is_visible()
    page.evaluate('window.__BASAIR_R109_SELECTED__.back()')
    assert page.locator('#r109Audio').count()==0
    # Adding to Follow section is deliberately *surah audio*, not EveryAyah.
    assert page.locator('#p178FollowChoice').count()==1
    page.locator('#p178FollowChoice button').click()
    assert page.evaluate('window.__followOps.length')==2
    assert page.evaluate('window.__followOps[0].readerId')=='salman-obaid-almutairi'
    assert page.evaluate('window.__followOps[1].resume')=='audio'
    # UI idempotence: only one follow control; the original 7 EveryAyah options stay untouched.
    page.evaluate('window.__BASAIR_TILAWA_SALMAN_P178__.open(1)')
    assert page.locator('#p178FollowChoice').count()==1
    assert page.evaluate('document.getElementById("sequenceReciterV17").options.length')==1
    assert page.evaluate('window.__BASAIR_TILAWA_SALMAN_P178__.url(114).endsWith("114.mp3")')
    assert page.evaluate('window.__BASAIR_TILAWA_SALMAN_P178__.url(115)') is None
    assert not errors,errors
    results.append((width,mode))
    page.close()
  browser.close()
  print('P178 selected/Follow surah-only Chromium fixtures:',len(results),'/',len(results),'PASS')

if __name__=='__main__':run()
