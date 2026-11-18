"""P209 regression: fast B345 jump must never show stale Quran page for 5s.
Local Chromium + original V695 page rasters, with mocked native B345 state only.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).parents[1]
html=(root/'preview/index.html').read_text().replace('<head>','<head><base href="https://basair-p209.local/">',1).replace('<script src="p209-one-visual-surface.js"></script>','')
js=(root/'src/p209-one-visual-surface.js').read_text()
checks=[]
def ck(x,n):assert x,n;checks.append(n)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  name=r.request.url.rsplit('/',1)[-1]
  file=root/'preview/assets/tajweed-pages'/name
  if file.is_file():r.fulfill(body=file.read_bytes(),content_type='image/webp')
  else:r.fulfill(status=404,body='missing')
 page.route('**/assets/tajweed-pages/*.webp',route)
 page.set_content(html,wait_until='load')
 page.evaluate('''() => {window.audioClock={time:13.25,playing:true}}''')
 page.add_script_tag(content=js)
 page.evaluate('startMock()')
 page.wait_for_function('window.__BASAIR_P209_ONE_SURFACE__.status().active',timeout=5000)
 ck(page.evaluate('window.__BASAIR_P209_ONE_SURFACE__.status().page')==4,'P209 starts at authentic page 004')
 page.evaluate('''() => {
  // New image requests never resolve. No 404 to trigger an eager error fallback.
  window.Image=class {constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0}set src(value){this._src=value}get src(){return this._src}};
  window.__state.page=200;window.__state.progress=.1;
 }''')
 page.wait_for_function('!window.__BASAIR_P209_ONE_SURFACE__.status().active',timeout=950)
 ck(page.evaluate('window.__BASAIR_P209_ONE_SURFACE__.status().fallbacks')>=1,'Fast jump to unbuffered page yields immediate R33 fallback')
 ck(page.locator('body[data-p209-visual-owner="1"]').count()==0,'Stale visual page is hidden after unbuffered jump')
 ck(page.locator('#p209FollowControls').count()==0,'Fallback removes extra Follow tools')
 ck(page.evaluate('window.__state.running') is True,'Native B345 recitation still running')
 ck(page.evaluate('window.audioClock.time')==13.25,'P209 does not alter native audio time')
 ck(page.locator('#b345NormalStack').count()==1,'Actual B345 display DOM retained for fallback')
 ck(not errors,'No uncaught JavaScript error')
 page.close();browser.close()
print('P209 unbuffered jump PASS',len(checks))
for i,x in enumerate(checks,1):print(f'{i:02d}. {x}')
