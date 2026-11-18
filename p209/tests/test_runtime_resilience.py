"""P209 in-session fallback and native B345 audio/scroll state isolation.
Local Chromium only; not actual Android WebView or real reciter audio."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).parents[1]
HTML=(ROOT/'preview/index.html').read_text().replace('<head>','<head><base href="https://basair-p209.local/">',1).replace('<script src="p209-one-visual-surface.js"></script>','')
JS=(ROOT/'src/p209-one-visual-surface.js').read_text()
checks=[]
def ck(ok,label):
    assert ok,label
    checks.append(label)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for missing in (None,'tajweed-006.webp'):
        page=browser.new_page(viewport={'width':390,'height':844})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        def route(r):
            name=r.request.url.rsplit('/',1)[-1]
            file=ROOT/'preview/assets/tajweed-pages'/name
            if name==missing or not file.exists():r.fulfill(status=404,body='missing')
            else:r.fulfill(status=200,body=file.read_bytes(),content_type='image/webp')
        page.route('**/assets/tajweed-pages/*.webp',route)
        page.set_content(HTML,wait_until='load')
        page.evaluate('''() => {
          window.audioClock={time:36.5,rate:1.0,playing:true};
          window.__state.audioPlaying=true;
          window.__state.audioCurrentTime=36.5;
          window.__state.progress=0.27;
          /* scrollTop set after native stack is actually visible */
        }''')
        page.evaluate('startMock()')
        page.evaluate('document.getElementById("mushafReader").scrollTop=37')
        before_scroll=page.evaluate('document.getElementById("mushafReader").scrollTop')
        page.add_script_tag(content=JS)
        page.wait_for_function('window.__BASAIR_P209_ONE_SURFACE__.status().active',timeout=5000)
        ck(page.evaluate('window.__state.progress')==0.27,'Native B345 audio progress is not overwritten by P209')
        ck(page.evaluate('window.audioClock.time')==36.5,'Existing mocked reciter audio time is unmodified')
        ck(page.evaluate('document.getElementById("mushafReader").scrollTop')==before_scroll and before_scroll>0,'Native scrollTop is not reset when projection activates')
        page.evaluate('''() => {window.__state.paused=true;window.audioClock.playing=false;}''')
        page.wait_for_timeout(180)
        ck(page.evaluate('window.__BASAIR_P209_ONE_SURFACE__.status().mode')=='paused','P209 follows B345 pause without owning its clock')
        page.evaluate('''() => {window.__state.paused=false;window.audioClock.playing=true;window.__state.progress=.41}''')
        page.wait_for_timeout(180)
        ck(abs(page.evaluate('window.__BASAIR_P209_ONE_SURFACE__.status().progress')-.41)<.01,'P209 reads changed native progress on resume')
        ck(page.evaluate('window.audioClock.playing') is True,'P209 resume does not interfere with native audio state')
        if missing:
            page.evaluate('nextMock()')
            page.wait_for_function('!window.__BASAIR_P209_ONE_SURFACE__.status().active',timeout=2500)
            ck(page.evaluate('window.__BASAIR_P209_ONE_SURFACE__.status().fallbacks')>=1,'Mid-session missing page 006 triggers native R33 fallback')
            ck(page.locator('body[data-p209-visual-owner="1"]').count()==0,'Mid-session missing image never retains a ghost overlay')
            ck(page.locator('#p209FollowControls').count()==0,'Mid-session fallback removes P209 controls')
            ck(page.locator('#b345NormalStack').count()==1,'Native B345 renderer still exists for fallback')
            ck(page.evaluate('window.__state.running'),'P209 failure does not stop the native recitation controller')
        else:
            page.evaluate('''() => {window.__BASAIR_PRINT_FOLLOW_100__.edition=()=>"blue"}''')
            page.wait_for_function('!window.__BASAIR_P209_ONE_SURFACE__.status().active',timeout=1000)
            ck(page.evaluate('window.__BASAIR_P209_ONE_SURFACE__.status().fallbacks')>=1,'Hot printed edition change yields immediate native fallback')
            ck(page.evaluate('window.__state.running'),'Hot edition switch does not stop native B345')
        ck(not errors,'No uncaught browser errors in fallback/audio test')
        page.close()
    browser.close()
print('P209 native resilience / audio-state isolation: PASS',len(checks))
for i,x in enumerate(checks,1):print(f'{i:02d}. {x}')
