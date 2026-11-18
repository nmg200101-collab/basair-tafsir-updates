"""Offline Chromium regression gate grounded in V695 B345/R39/print-follow-100-r33.js.
Does not test actual Android WebView or real audio."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).parents[1]
html=(root/'preview/index.html').read_text().replace('<head>','<head><base href="https://basair-p209.local/">',1).replace('<script src="p209-one-visual-surface.js"></script>','')
js=(root/'src/p209-one-visual-surface.js').read_text()
checks=[]
def ck(condition, description):
    assert condition, description
    checks.append(description)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    page.on('pageerror',lambda exc: print('Page error: ',str(exc)))
    def fulfill(route):
        name=route.request.url.rsplit('/',1)[-1]
        file=root/'preview/assets/tajweed-pages'/name
        if file.exists(): route.fulfill(status=200,body=file.read_bytes(),content_type='image/webp')
        else: route.fulfill(status=404,body=b'not found')
    page.route('**/assets/tajweed-pages/*.webp',fulfill)
    page.set_content(html,wait_until='load')
    page.evaluate('''() => {
       window.nativeTapCalls=[];window.legacyTapBubble=0;
       window.__BASAIR_B345_SEQUENCE__.retargetPrintAyah=(x)=>{window.nativeTapCalls.push(x);return true};
       window.addEventListener('pointerup',()=>window.legacyTapBubble++,false);
       for(let pg=4;pg<=5;pg++){
        const sh=document.querySelector('#b345NormalStack [data-b345-page="'+pg+'"]');
        sh.setAttribute('data-r33-print-page',String(pg));
        const l=document.createElement('div');l.className='ayahHitLayer';
        l.style.cssText='position:absolute;inset:0;pointer-events:none';
        const h=document.createElement('span');h.className='ayahHit';
        h.style.cssText='position:absolute;left:30%;top:28%;width:28%;height:24%;pointer-events:none';
        h.dataset.s=pg===4?'2':'3';h.dataset.selectayah=pg===4?'17':'18';h.dataset.g='1';
        l.appendChild(h);sh.appendChild(l);
       }
    }''')
    page.add_script_tag(content=js)
    page.evaluate('startMock()')
    page.wait_for_function('window.__BASAIR_P209_ONE_SURFACE__.status().active',timeout=5000)
    hit=page.locator('#p209VisualSurface .p209Page:first-child .p209HitLayer .ayahHit')
    ck(hit.count()==1,'Actual first printed ayah hit zone cloned into the matching visual page')
    rect=hit.bounding_box()
    ck(rect and rect['width']>0 and rect['height']>0,'Projected R33 ayah hit box has usable geometry')
    x=rect['x']+rect['width']/2;y=rect['y']+rect['height']/2
    page.mouse.move(x,y);page.mouse.down();page.mouse.up()
    ck(page.evaluate('window.nativeTapCalls.length')==1,'Projected tap invokes exactly one native retarget')
    ck(page.evaluate('window.nativeTapCalls[0].page')==4,'Projected tap maps to page 4')
    ck(page.evaluate('window.nativeTapCalls[0].a')==17,'Projected tap selects the correct ayah 17')
    ck(page.evaluate('window.legacyTapBubble')==0,'Wrong native hidden-stack bubble hit is suppressed')
    ck(page.evaluate('window.__BASAIR_P209_ONE_SURFACE__.status().tapsMapped')==1,'Tap-mapping evidence counter increments')
    # Drag starts over ayah: a gesture is scrolling, not selecting a verse.
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x,y+47,steps=5);page.mouse.up()
    ck(page.evaluate('window.nativeTapCalls.length')==1,'Swipe gesture does not fire ayah retarget')
    ck(page.evaluate('window.legacyTapBubble')>=1,'Swipe retains native B345 event propagation')
    # The next page uses the SAME printed hit mapping when the reader advances.
    page.evaluate('progressMock(0.5)')
    page.wait_for_timeout(240)
    next_hit=page.locator('#p209VisualSurface .p209Page:nth-child(2) .p209HitLayer .ayahHit')
    ck(next_hit.count()==1,'Next-page authentic hit map is projected into the second page buffer')
    nr=next_hit.bounding_box()
    ck(nr and nr['width']>0 and nr['height']>0,'Next-page transformed ayah hit remains measurable')
    nx=nr['x']+nr['width']/2;ny=nr['y']+nr['height']/2
    page.mouse.move(nx,ny);page.mouse.down();page.mouse.up()
    ck(page.evaluate('window.nativeTapCalls.length')==2,'Next-page visual tap retargets exactly once')
    ck(page.evaluate('window.nativeTapCalls[1].page')==5,'Next-page visual tap maps to page 5')
    ck(page.evaluate('window.nativeTapCalls[1].a')==18,'Next-page visual tap chooses its own ayah 18')
    page.evaluate('progressMock(0)')
    page.wait_for_timeout(230)
    # Simulate actual B345/R39 STOP: keeps frozen print stack and data-b345
    # attr until the separate P207 asynchronous releaseStaticPrint/restore.
    page.evaluate('''() => {
      window.__BASAIR_B345_SEQUENCE__.stop=function(){
         window.nativeCalls.stop++;
         window.__state.running=false;window.__state.printStaticHeld=true;
         document.body.setAttribute('data-b345-sequence-surface','normal');
         setTimeout(()=>{
           window.__state.printStaticHeld=false;
           document.body.removeAttribute('data-b345-sequence-surface');
           document.getElementById('b345NormalStack').hidden=true;
           document.getElementById('mushafText').style.display='block';
         },350);
      }
    }''')
    page.locator('#p209FollowControls button.p209Stop').click()
    page.wait_for_timeout(110)
    ck(page.evaluate('window.__BASAIR_P209_ONE_SURFACE__.status().active'),
       'R39 frozen stack remains shielded while original static page is not yet restored')
    ck(page.evaluate('window.__BASAIR_P209_ONE_SURFACE__.status().restoreWaits')>0,
       'The original R39 frozen-state guard was exercised')
    page.wait_for_function('!window.__BASAIR_P209_ONE_SURFACE__.status().active',timeout=1600)
    ck(page.evaluate('!document.body.hasAttribute("data-p209-visual-owner")'),
       'P207-style asynchronous restoration returns visual ownership without ghost overlay')
    ck(page.evaluate('window.nativeCalls.stop')==1,'STOP invoked the existing B345 engine exactly once')
    page.close();browser.close()
print('P209 native R39/ayah Chromium gate: PASS',len(checks))
for i,name in enumerate(checks,1):print(f'{i:02d}. {name}')
