#!/usr/bin/env python3
"""P213 full coordinator regression on original signed V695 HTML in Chromium.

Unlike test_v695_ui_capture.py this test uses the REAL P213 coordinator,
the real route adapters, the corrected P212 controller, and the reversible
control bridge; B345/R33/R51 are loaded from the actual V695 APK.
It is not Android WebView or real-reciter-audio acceptance. No APK mutation.
Run from repo checkout:
python3 p213/tests/test_v695_integrated_follow.py --apk /path/to/basair-v695-owner-signed.apk
"""
from pathlib import Path
from urllib.parse import urlparse, unquote
import argparse, shutil, zipfile
from playwright.sync_api import sync_playwright

SRC=Path(__file__).resolve().parents[1]/"src"
SCRIPTS=[
    "p213-tajwid-static-follow-v2.js", # replacement, not old P212
    "unified-follow-core.js",
    "follow-route-adapters.js",
    "owner-control-bridge.js",
]
def test(apk, chromium):
    with zipfile.ZipFile(apk) as z:
        names=set(z.namelist())
        base="assets/www/"
        html=z.read(base+"index.html").decode("utf-8").replace(
            "<head>", '<head><base href="https://basair-v695.invalid/">',1)
        with sync_playwright() as p:
            kw=dict(headless=True,args=["--no-sandbox","--disable-dev-shm-usage",
                "--autoplay-policy=no-user-gesture-required"])
            if chromium:kw["executable_path"]=chromium
            browser=p.chromium.launch(**kw)
            try:
                ctx=browser.new_context(viewport={"width":390,"height":844},
                    device_scale_factor=1,is_mobile=True,has_touch=True)
                ctx.add_init_script("""(()=>{
                  const mem=new Map();
                  Object.defineProperty(window,'localStorage',{configurable:true,
                    value:{getItem:k=>mem.has(k)?mem.get(k):null,
                      setItem:(k,v)=>mem.set(k,String(v)),
                      removeItem:k=>mem.delete(k),clear:()=>mem.clear()}});
                  window.__BASAIR_OFFLINE_TEST__=true;
                })();""")
                page=ctx.new_page()
                def serve(route):
                    u=urlparse(route.request.url)
                    if u.netloc!="basair-v695.invalid":
                        return route.fulfill(status=204,body=b"")
                    key=base+unquote(u.path).lstrip("/")
                    if key not in names:
                        return route.fulfill(status=404,body=b"")
                    media={".js":"application/javascript",".css":"text/css",
                        ".webp":"image/webp",".png":"image/png",
                        ".svg":"image/svg+xml",".json":"application/json"}
                    return route.fulfill(status=200,body=z.read(key),
                        content_type=media.get(Path(key).suffix,"application/octet-stream"))
                page.route("**/*",serve)
                page.set_content(html,wait_until="domcontentloaded",timeout=65000)
                page.get_by_text("افتح التلاوة",exact=False).first.click(timeout=15000)
                page.get_by_role("button",name="فتح",exact=True).first.click(timeout=15000)
                page.evaluate("window.openPage(4)")
                page.wait_for_timeout(350)
                assert page.evaluate("window.__BASAIR_B345_SEQUENCE__?.state?.installed===true"),"V695 B345 not installed"
                assert page.evaluate("!!window.__BASAIR_PRINT_FOLLOW_100__"),"V695 R33 absent"
                assert page.evaluate("!!window.__BASAIR_PRINT_ZOOM_FOLLOW_R51__"),"V695 R51 absent"
                for src in SCRIPTS:
                    page.add_script_tag(path=str(SRC/src))
                page.wait_for_timeout(550)
                assert page.evaluate("window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__?.version===213"),"P212 v2 not installed"
                assert page.evaluate("window.__BASAIR_P213_CONTROL_BRIDGE__.enable()===true"),"UI bridge not armed"
                # Use a real native B345 selector; capture listener acts before
                # the button's own direct onclick, exactly like V695.
                page.evaluate("""() => {
                    if(!document.getElementById('sequenceSilentB345')){
                      const b=document.createElement('button');
                      b.id='sequenceSilentB345';document.body.appendChild(b);
                    }
                    document.getElementById('sequenceSilentB345').click();
                }""")
                actual=page.evaluate("""() => ({
                    core:window.__BASAIR_P213_FOLLOW__.status(),
                    native:window.__BASAIR_B345_SEQUENCE__.state.running,
                    p212:window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.status().running,
                    zoom:window.__BASAIR_PRINT_FOLLOW_100__.scale()
                })""")
                assert actual["core"] is not None and actual["core"]["route"]=="printed",actual
                assert actual["native"] is True and actual["p212"] is False,actual
                assert actual["zoom"]==100,actual
                assert page.evaluate("window.__BASAIR_P213_FOLLOW__.pause()===true"),"Pause failed"
                assert page.evaluate("window.__BASAIR_P213_FOLLOW__.resume()===true"),"Resume failed"
                assert page.evaluate("window.__BASAIR_P213_FOLLOW__.stop()===true"),"Stop failed"
                stopped=page.evaluate("""() => ({
                    core:window.__BASAIR_P213_FOLLOW__.status(),
                    native:window.__BASAIR_B345_SEQUENCE__.state.running,
                    page:window.currentPage
                })""")
                assert stopped["core"] is None and not stopped["native"],stopped
                assert page.evaluate("window.__BASAIR_P213_CONTROL_BRIDGE__.disable()===true")
                print("PASS: real V695 printed 100% routed through P213 core to B345; pause/resume/stop and bridge restore.")
                print("LIMIT: no Android WebView; original offline image content and real reciter audio unverified.")
                # Digital and Tajwid acceptance must be run only when the real
                # corresponding renderer is ready; never count absent data as pass.
                print("NOT TESTED: printed original real-image continuous page motion, Tajwid audio, digital loaded page, Android rollback.")
            finally:
                browser.close()

if __name__=="__main__":
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apk",type=Path,required=True)
    ap.add_argument("--chromium",default=shutil.which("chromium"))
    a=ap.parse_args();test(a.apk,a.chromium)
