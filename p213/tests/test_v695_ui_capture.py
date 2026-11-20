#!/usr/bin/env python3
"""Reproduce P213 reversible button-capture test on the original signed V695 APK.
Requires playwright + Chromium; never starts Android, signs or publishes.
Example: python3 p213/tests/test_v695_ui_capture.py --apk /path/to/V695.apk
"""
import argparse
from pathlib import Path
from urllib.parse import urlparse, unquote
import zipfile
import shutil
from playwright.sync_api import sync_playwright

P213_UI=Path(__file__).resolve().parents[1] / "src" / "owner-control-bridge.js"

def test(apk, browser_path):
    with zipfile.ZipFile(apk) as archive:
        files=set(archive.namelist())
        prefix="assets/www/"
        html=archive.read(prefix+"index.html").decode("utf-8").replace(
            "<head>", '<head><base href="https://basair-v695.invalid/">', 1)
        with sync_playwright() as driver:
            args=["--no-sandbox","--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required"]
            opts={"headless":True,"args":args}
            if browser_path:
                opts["executable_path"]=browser_path
            browser=driver.chromium.launch(**opts)
            try:
                context=browser.new_context(viewport={"width":390,"height":844},
                                            device_scale_factor=1,is_mobile=True,has_touch=True)
                context.add_init_script("""(()=>{
                  const m=new Map();
                  Object.defineProperty(window,'localStorage',{configurable:true,value:{
                    getItem:k=>m.has(k)?m.get(k):null,
                    setItem:(k,v)=>m.set(k,String(v)),
                    removeItem:k=>m.delete(k),clear:()=>m.clear()}});
                  window.__BASAIR_OFFLINE_TEST__=true;
                })();""")
                page=context.new_page()
                def serve(route):
                    u=urlparse(route.request.url)
                    if u.netloc != "basair-v695.invalid":
                        return route.fulfill(status=204,body=b"")
                    name=prefix+unquote(u.path).lstrip("/")
                    if name not in files:
                        return route.fulfill(status=404,body=b"")
                    media={".js":"application/javascript",".css":"text/css",
                           ".webp":"image/webp",".png":"image/png",
                           ".svg":"image/svg+xml",".json":"application/json"}
                    return route.fulfill(status=200,body=archive.read(name),
                                         content_type=media.get(Path(name).suffix,"application/octet-stream"))
                page.route("**/*",serve)
                page.set_content(html,wait_until="domcontentloaded",timeout=65000)
                page.get_by_text("افتح التلاوة",exact=False).first.click(timeout=15000)
                page.get_by_role("button",name="فتح",exact=True).first.click(timeout=15000)
                page.evaluate("window.openPage(4)")
                page.wait_for_timeout(350)
                assert page.evaluate("""() => window.__BASAIR_B345_SEQUENCE__?.state?.installed===true""")
                page.evaluate("""() => {
                  window.__TEST__={starts:0,session:null};
                  window.__BASAIR_P213_FOLLOW__={
                    status:()=>window.__TEST__.session,
                    start:(route,mode)=>{window.__TEST__.starts++;window.__TEST__.session={route,mode,paused:false};return true;},
                    stop:()=>{window.__TEST__.session=null;return true;},
                    pause:()=>true,resume:()=>true
                  };
                  window.__BASAIR_P213_ADAPTERS__={
                    nativeReady:()=>true,install:()=>true,
                    digitalEligible:()=>false,printedEligible:()=>true
                  };
                }""")
                page.add_script_tag(path=str(P213_UI))
                assert page.evaluate("window.__BASAIR_P213_CONTROL_BRIDGE__.enable()===true")
                # V695 dynamically mounts its sequence buttons; a DOM button
                # with the exact original B345 selector exercises native capture.
                click="""() => {
                  let b=document.getElementById('sequenceSilentB345');
                  if(!b){b=document.createElement('button');b.id='sequenceSilentB345';document.body.appendChild(b);}
                  b.click();
                }"""
                page.evaluate(click)
                captured=page.evaluate("""() => ({
                  starts:window.__TEST__.starts,
                  core:window.__TEST__.session,
                  nativeRunning:window.__BASAIR_B345_SEQUENCE__.state.running
                })""")
                assert captured["starts"]==1 and captured["core"]["route"]=="printed" and not captured["nativeRunning"],captured
                assert page.evaluate("window.__BASAIR_P213_CONTROL_BRIDGE__.disable()===true")
                page.wait_for_timeout(700)
                page.evaluate(click)
                restored=page.evaluate("""() => ({
                  starts:window.__TEST__.starts,
                  nativeRunning:window.__BASAIR_B345_SEQUENCE__.state.running,
                  nativeMode:window.__BASAIR_B345_SEQUENCE__.state.mode
                })""")
                assert restored["starts"]==1 and restored["nativeRunning"] and restored["nativeMode"]=="silent",restored
                page.evaluate("window.__BASAIR_B345_SEQUENCE__.stop()")
                print("PASS V695 Chromium: coordinator captures start; disabling restores native B345.")
                print("LIMIT: mocked P213 coordinator, not Android audio/scroll/production acceptance.")
            finally:
                browser.close()

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apk",type=Path,required=True)
    parser.add_argument("--chromium",default=shutil.which("chromium"))
    args=parser.parse_args()
    test(args.apk,args.chromium)
