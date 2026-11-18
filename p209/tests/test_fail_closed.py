"""P209 fail-closed and non-interference checks in local Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).parents[1]
base=(root/'preview/index.html').read_text().replace('<head>','<head><base href="https://basair-p209.local/">',1).replace('<script src="p209-one-visual-surface.js"></script>','')
code=(root/'src/p209-one-visual-surface.js').read_text()
checks=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 def case(name,mutate,missing=None):
  pg=browser.new_page(viewport={'width':390,'height':844})
  def route(r):
   filename=r.request.url.rsplit('/',1)[-1]
   if filename==missing:r.fulfill(status=404,body='not-found');return
   x=root/'preview/assets/tajweed-pages'/filename
   r.fulfill(status=200,body=x.read_bytes(),content_type='image/webp') if x.exists() else r.fulfill(status=404,body='not-found')
  pg.route('**/assets/tajweed-pages/*.webp',route)
  pg.set_content(base)
  pg.evaluate(mutate)
  pg.add_script_tag(content=code)
  pg.wait_for_timeout(700)
  status=pg.evaluate('window.__BASAIR_P209_ONE_SURFACE__.status()')
  assert status['active'] is False,(name,status)
  assert pg.locator('body[data-p209-visual-owner="1"]').count()==0,name+' ghost owner'
  assert pg.locator('#p209FollowControls').count()==0,name+' ghost tools'
  checks.append(name)
  pg.close()
 case('Disabled feature stays fully dormant', 'window.__BASAIR_P209_FIELD_QA_ENABLED__=false;startMock()')
 case('Hifz mode excluded', "document.body.classList.add('h25-hifz');startMock()")
 case('Digital font excluded', "document.body.classList.add('stableDigital');startMock()")
 case('Zoom mode excluded', "window.__state.scaleMode='zoom';startMock()")
 case('Scale !=100 excluded', "window.__BASAIR_PRINT_FOLLOW_100__.scale=()=>130;startMock()")
 case('Unknown edition excluded', "window.__BASAIR_PRINT_FOLLOW_100__.edition=()=> 'unknown';startMock()")
 case('B345 card not ready excluded', "document.querySelector('[data-b345-page=\"4\"]').setAttribute('data-b345-ready','0');startMock()")
 case('No native B345 stop action excluded', "delete window.__BASAIR_B345_SEQUENCE__.stop;startMock()")
 case('P207 STOP restore module absent', 'delete window.__BASAIR_P207_FOLLOW_GUARD__;startMock()')
 case('P205 Tajwid parity module absent', 'delete window.__BASAIR_P205_ORIGINAL_PRINT_PARITY__;startMock()')
 case('P205 parity not installed', 'window.__BASAIR_P205_ORIGINAL_PRINT_PARITY__.status=()=>({installed:false});startMock()')
 case('Failed next page asset -> safe original fallback', "startMock()",missing='tajweed-005.webp')
 browser.close()
print('P209 local fail-closed PASS',len(checks))
for i,x in enumerate(checks,1):print(f'{i:02d}. {x}')
