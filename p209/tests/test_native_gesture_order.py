"""P209 regression: actual B345 _test.userEnd lifecycle under listener-order variation.
Tests projection touch-to-ayah redirection against a real Chromium DOM and authentic
V695 Tajwid page raster, but not Android WebView/audio hardware.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).parents[1]
html=(root/'preview/index.html').read_text().replace('<head>','<head><base href="https://basair-p209.local/">',1)
html=html.replace('<script src="p209-one-visual-surface.js"></script>', '')
src=(root/'src/p209-one-visual-surface.js').read_text()
checks=[]
def ck(value,title):
 assert value,title
 checks.append(title)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for order in ['P209-first','B345-first','B345-no-API']:
  pg=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  def route(r):
   file=root/'preview/assets/tajweed-pages'/r.request.url.rsplit('/',1)[-1]
   if file.is_file():r.fulfill(status=200,body=file.read_bytes(),content_type='image/webp')
   else:r.fulfill(status=404,body=b'Not found')
  pg.route('**/assets/tajweed-pages/*.webp',route)
  pg.set_content(html,wait_until='load')
  pg.evaluate('''() => {
    const shell=document.querySelector('#b345NormalStack>[data-b345-page="4"]');
    shell.setAttribute('data-r33-print-page','4');
    const layer=document.createElement('div');layer.className='ayahHitLayer';layer.style.cssText='position:absolute;inset:0;z-index:6;pointer-events:none';
    const hit=document.createElement('span');hit.className='ayahHit';
    hit.setAttribute('data-s','2');hit.setAttribute('data-selectayah','22');hit.setAttribute('data-g','29');
    hit.style.cssText='position:absolute;left:45px;top:110px;width:170px;height:95px;pointer-events:none';
    layer.appendChild(hit);shell.appendChild(layer);
    window.gesture={down:0,end:0,retargets:[],hidden:0};
    window.__BASAIR_B345_SEQUENCE__._test={userEnd:()=>{window.gesture.end++;window.__state.userScrolling=false;window.__state.manualHoldUntil=Date.now()+2200;}};
    window.__BASAIR_B345_SEQUENCE__.retargetPrintAyah=(t)=>{window.gesture.retargets.push(t);return true};
  }''')
  if order=='B345-first':
   pg.evaluate('''() => window.addEventListener('pointerup',()=>{
     if(window.__state.userScrolling)window.__BASAIR_B345_SEQUENCE__._test.userEnd();
   },{capture:true})''')
  if order=='B345-no-API':
   pg.evaluate('delete window.__BASAIR_B345_SEQUENCE__._test.userEnd')
  pg.add_script_tag(content=src)
  if order!='B345-first':
   pg.evaluate('''() => window.addEventListener('pointerup',()=>{
     if(window.__state.userScrolling){window.__state.userScrolling=false;window.gesture.end++}
   },{capture:true})''')
  pg.evaluate('''() => window.addEventListener('pointerup',()=>window.gesture.hidden++,{capture:true})''')
  pg.evaluate('startMock()')
  pg.wait_for_function('window.__BASAIR_P209_ONE_SURFACE__.status().active',timeout=5000)
  box=pg.evaluate('''() => {
    const el=document.querySelector('#p209VisualSurface .ayahHit');if(!el)return null;
    const r=el.getBoundingClientRect();return{x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};
  }''')
  ck(bool(box),'Projected ayah hit geometry exists: '+order)
  # Long finger swipe: P209 must NOT intercept B345's native pointerup.
  pg.evaluate('''(p) => {
    window.__state.userScrolling=true;
    window.dispatchEvent(new PointerEvent('pointerdown',{clientX:p.x,clientY:p.y,bubbles:true,pointerId:1}));
    window.dispatchEvent(new PointerEvent('pointerup',{clientX:p.x,clientY:p.y+80,bubbles:true,pointerId:1}));
  }''',box)
  swipe=pg.evaluate('''() => ({g:window.gesture,stillScrolling:window.__state.userScrolling,
    taps:window.__BASAIR_P209_ONE_SURFACE__.status().tapsSuppressed})''')
  ck(swipe['g']['end']==1 and swipe['g']['hidden']==1 and not swipe['stillScrolling'],
     'Native B345 and R33 receive swipes without interception: '+order)
  ck(swipe['taps']==0,'Swipe never mistaken for an ayah tap: '+order)
  pg.evaluate('''() => {window.gesture.end=0;window.gesture.hidden=0;}''')
  pg.evaluate('''(p) => {
    window.__state.userScrolling=true;window.__state.manualHoldUntil=Infinity;
    window.dispatchEvent(new PointerEvent('pointerdown',{clientX:p.x,clientY:p.y,bubbles:true,pointerId:1}));
    window.dispatchEvent(new PointerEvent('pointerup',{clientX:p.x,clientY:p.y,bubbles:true,pointerId:1}));
  }''',box)
  result=pg.evaluate('''() => ({g:window.gesture,st:window.__state.userScrolling,
     p209:window.__BASAIR_P209_ONE_SURFACE__.status()})''')
  ck(result['g']['end']==1 and result['st'] is False,'B345 manual hold released exactly once: '+order)
  if order!='B345-no-API':
   ck(len(result['g']['retargets'])==1,'Ayah retargeted once: '+order)
   ck(result['g']['retargets'][0]['a']==22,'Correct ayah chosen: '+order)
   ck(result['g']['hidden']==0,'Hidden R33 handler suppressed: '+order)
   ck(result['p209']['active'],'Projection remains active after valid tap: '+order)
  else:
   ck(not result['p209']['active'],'Fails closed if native B345 userEnd API absent: '+order)
   ck(result['g']['hidden']==1,'Allows downstream B345 handler when no API: '+order)
  ck(not errs,'No browser JS exceptions: '+order)
  pg.close()
 browser.close()
print('P209 native B345 gesture order PASS',len(checks))
for i,item in enumerate(checks,1):print(f'{i:02d}. {item}')
