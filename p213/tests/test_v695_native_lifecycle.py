#!/usr/bin/env python3
"""Read-only V695 B345 lifecycle check against the original owner-signed APK.
Requires Playwright + Chromium. Does not load P213, modify APK, sign, or prove
Android WebView, sound quality, or multi-page scrolling.
"""
import argparse
import json
from pathlib import Path
from urllib.parse import urlparse, unquote
from zipfile import ZipFile
from playwright.sync_api import sync_playwright

def check(apk: Path, executable: str):
    with ZipFile(apk) as z:
        names = set(z.namelist())
        native = z.read('assets/www/tilawa-arkani-nav-header-final-lock-b255.js').decode()
        assert 'function captureControls(ev)' in native
        for selector in ('#sequenceSilentB345','#sequenceAudioB345',
                         '#sequenceMiniPause','#sequenceMiniStop'):
            assert selector in native, 'Missing original B345 selector: ' + selector
        html = z.read('assets/www/index.html').decode().replace(
            '<head>', '<head><base href="https://basair-v695.invalid/">',1)
        with sync_playwright() as p:
            b = p.chromium.launch(headless=True,executable_path=executable,
                args=['--no-sandbox','--disable-dev-shm-usage'])
            try:
                ctx = b.new_context(viewport={'width':390,'height':844},
                                    is_mobile=True,has_touch=True)
                ctx.add_init_script("""(()=>{
                  const m=new Map();
                  Object.defineProperty(window,'localStorage',{configurable:true,
                    value:{getItem:k=>m.has(k)?m.get(k):null,
                      setItem:(k,v)=>m.set(k,String(v)),
                      removeItem:k=>m.delete(k),clear:()=>m.clear()}});
                  window.__BASAIR_OFFLINE_TEST__=true
                })()""")
                page = ctx.new_page()
                def local(route):
                    u = urlparse(route.request.url)
                    if u.netloc != 'basair-v695.invalid':
                        return route.fulfill(status=204,body=b'')
                    name = 'assets/www/' + unquote(u.path).lstrip('/')
                    if name not in names:return route.fulfill(status=404,body=b'')
                    typ={'.js':'application/javascript','.css':'text/css',
                         '.webp':'image/webp','.json':'application/json'}
                    return route.fulfill(status=200,body=z.read(name),
                      content_type=typ.get(Path(name).suffix,'application/octet-stream'))
                page.route('**/*',local)
                page.set_content(html,wait_until='domcontentloaded',timeout=65000)
                page.get_by_text('افتح التلاوة',exact=False).first.click(timeout=15000)
                page.get_by_role('button',name='فتح',exact=True).first.click(timeout=15000)
                page.evaluate('window.openPage(4)')
                page.wait_for_timeout(500)
                assert page.evaluate("document.body.classList.contains('reader-active')")
                assert page.evaluate('window.__BASAIR_PRINT_FOLLOW_100__?.active()')
                actions=[('start','startSilent'),('pause','pause'),
                         ('resume','pause'),('stop','stop')]
                states=[]
                for label, op in actions:
                    outcome=page.evaluate("""op=>{
                      const e=window.__BASAIR_B345_SEQUENCE__;
                      const returned=op==='startSilent'?e.startSilent():
                        op==='stop'?e.stop():e._test.togglePause();
                      const s=e.state;
                      return {returned,running:s.running,paused:s.paused,
                        mode:s.mode,page:s.page,scaleMode:s.scaleMode}
                    }""",op)
                    states.append({'action':label,**outcome})
                for i,expected in enumerate(((True,False,'silent'),
                    (True,True,'silent'),(True,False,'silent'),(False,False,''))):
                    state=states[i]
                    assert (state['running'],state['paused'],state['mode'])==expected,states
                    assert state['returned'] is False and state['page']==4,states
                print(json.dumps({'status':'PASS','checks':4,
                  'source':'original V695 signed APK',
                  'environment':'isolated Chromium — NOT Android WebView',
                  'states':states},ensure_ascii=False,indent=2))
            finally:b.close()

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--apk',type=Path,required=True)
    p.add_argument('--chromium',default='/usr/bin/chromium')
    args=p.parse_args()
    check(args.apk,args.chromium)
