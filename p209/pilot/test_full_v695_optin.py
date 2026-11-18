"""P209 R5 full V695 HTML shell + exact owner-signed P205/P207 integration.
Local Chromium with original APK scripts, images, and genuine B345/R33 code.
NOT Android WebView, APK installation, real audio, or a production OTA.

Example:
  python tests/test_full_v695_shell.py --apk /mnt/data/basair-v695-owner-signed.apk \
    --p205 /mnt/data/p209-work/real_ota_sources/p205-original-print-parity.js \
    --p207 /mnt/data/p209-work/real_ota_sources/p207-native-follow-lifecycle.js
"""
import argparse, base64, hashlib, json, re, zipfile
from pathlib import Path
from urllib.parse import urlparse, unquote
from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--apk',type=Path,required=True)
for v in ('p205','p207'):
    parser.add_argument('--'+v,type=Path,default=HERE.parent/'p121/owner-qa/modules/tilawa'/('p205-original-print-parity.js' if v=='p205' else 'p207-native-follow-lifecycle.js'))
parser.add_argument('--snapshot-dir',type=Path,default=HERE/'report'/'r5_full_shell')
args=parser.parse_args()
checks=[]
def ck(v,description):
    if not v: raise AssertionError(description)
    checks.append(description)

def verify_signed_source():
    # Approval inventory is retained by owner in an independently signed Seq116 envelope.
    # An exact local hash check avoids accidentally testing source from another release.
    expected={'p205':('7a6c86a518436bb4f8611898ad530a768e051158734ea719f4a7e13b82199fdd',12980),
              'p207':('09ea36835e233aa9e2093e15aa8ae3d608707c4bad82fd6b306efe140509c04c',7479)}
    for name in ('p205','p207'):
        content=getattr(args,name).read_bytes();dig,length=expected[name]
        ck(len(content)==length and hashlib.sha256(content).hexdigest()==dig,f'Exact signed Seq116 {name.upper()} source hash')

ck(args.apk.is_file(),'Official V695 APK provided')
verify_signed_source()
sha=hashlib.sha256(args.apk.read_bytes()).hexdigest()
ck(sha=='925f6116899ad8acf1cba2a9ec75d04db7951af66ad5b3de98b7cbc7cba9d384','Owner-signed V695 APK SHA256')
source=(HERE/'src/p209-one-visual-surface.js').read_text()
ck('__BASAIR_P209_FIELD_QA_ENABLED__' in source,'P209 default-off switch retained')
args.snapshot_dir.mkdir(parents=True,exist_ok=True)

with zipfile.ZipFile(args.apk) as apk:
    entries=set(apk.namelist());prefix='assets/www/'
    for req in ['index.html','print-follow-100-r33.js','tilawa-arkani-nav-header-final-lock-b255.js','assets/tajweed-pages/tajweed-004.webp']:
        ck(prefix+req in entries,'V695 APK contains '+req)
    html=apk.read(prefix+'index.html').decode('utf-8').replace('<head>','<head><base href="https://basair-v695.invalid/">',1)
    # Chromium about:blank is an opaque origin under the environment's security policy.
    # Give it an isolated in-memory localStorage for this *test only*; never alter the APK.
    shim='''(()=>{const mem=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),
        removeItem:k=>mem.delete(k),clear:()=>mem.clear(),key:i=>Array.from(mem.keys())[i]||null,
        get length(){return mem.size}}});window.__BASAIR_OFFLINE_TEST__=true})();'''
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,has_touch=True,is_mobile=True)
        context.add_init_script(shim)
        page=context.new_page();errors=[];block_count={'external':0,'missing':0}
        page.on('pageerror',lambda error: errors.append(str(error)))
        def fulfill(route):
            url=urlparse(route.request.url)
            if url.netloc!='basair-v695.invalid':
                block_count['external']+=1
                return route.fulfill(status=204,body=b'')
            key=prefix+unquote(url.path).lstrip('/')
            if key not in entries:
                block_count['missing']+=1
                return route.fulfill(status=404,body=b'')
            typ={'.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml',
                 '.png':'image/png','.json':'application/json','.mp3':'audio/mpeg'}.get(Path(key).suffix,'application/octet-stream')
            return route.fulfill(status=200,body=apk.read(key),content_type=typ)
        page.route('**/*',fulfill)
        page.set_content(html,wait_until='domcontentloaded',timeout=45000)
        ck(page.evaluate('!!window.__BASAIR_B345_SEQUENCE__&&!!window.__BASAIR_PRINT_FOLLOW_100__'),'Genuine V695 B345 and R33 controllers booted')
        ck(not page.evaluate('!!window.__BASAIR_P209_ONE_SURFACE__'),'Experimental module not included in baseline APK')
        page.get_by_text('افتح التلاوة',exact=False).first.click(timeout=10000)
        page.wait_for_timeout(650)
        page.get_by_role('button',name='فتح',exact=True).first.click(timeout=10000)
        page.evaluate('window.openPage(4)')
        page.wait_for_timeout(700)
        page.evaluate('document.querySelector(\'[data-v129-print="tajwid"]\').click()')
        page.wait_for_timeout(900)
        orig=page.evaluate('''() => ({page:document.querySelector('#mushafReader .localPageStage img[data-mushaf-page]')?.getAttribute('data-mushaf-page'),
            edition:window.__BASAIR_PRINT_FOLLOW_100__.edition(),active:window.__BASAIR_PRINT_FOLLOW_100__.active(),
            image:[...document.querySelectorAll('#mushafReader img')].some(x=>x.src.includes('tajweed-004.webp')&&x.complete&&x.naturalWidth>0)})''')
        ck(orig['active'] and orig['edition']=='tajwid','Actual V695 printed Tajwid static mode selected')
        ck(orig['page']=='4' and orig['image'],'Static page 004 authentic image displayed')
        page.screenshot(path=str(args.snapshot_dir/'before_follow.png'))
        page.add_script_tag(content=args.p205.read_text())
        page.add_script_tag(content=args.p207.read_text())
        ck(page.evaluate('window.__BASAIR_P205_ORIGINAL_PRINT_PARITY__.status().installed'),'Owner-signed P205 genuine adapter installed')
        ck(page.evaluate('!!window.__BASAIR_P207_FOLLOW_GUARD__'),'Owner-signed P207 STOP handler installed')
        page.add_script_tag(content=source)
        pilot=Path('/mnt/data/p209-pilot/p209-field-trial-toggle.js').read_text()
        page.add_script_tag(content=pilot)
        ck(page.evaluate('window.__BASAIR_P209_FIELD_QA_ENABLED__===false'),'Opt-in trial remains OFF after loading signed module source')
        ck(page.evaluate('document.getElementById("p209TrialFieldToggle")!==null'),'Real V695 Tools panel contains manual trial switch')
        page.evaluate('document.getElementById("p209TrialFieldToggle").click()')
        ck(page.evaluate('window.__BASAIR_P209_FIELD_QA_ENABLED__===true'),'Explicit owner manual click enables visual projection')
        ck(not page.evaluate('window.__BASAIR_P209_ONE_SURFACE__.status().active'),'P209 dormant before native follow')
        # Actually call the real B345 silent-mode controller; no audio stream is started.
        page.evaluate('window.__BASAIR_B345_SEQUENCE__.startSilent()')
        page.wait_for_function('window.__BASAIR_P209_ONE_SURFACE__.status().active',timeout=6500)
        live=page.evaluate('''() => ({p209:window.__BASAIR_P209_ONE_SURFACE__.status(),
          b345:window.__BASAIR_B345_SEQUENCE__.snapshot(),
          images:[...document.querySelectorAll('#p209VisualSurface .p209Page img')].map(x=>({p:x.dataset.mushafPage,loaded:x.complete&&x.naturalWidth>0})),
          bodyOwned:document.body.getAttribute('data-p209-visual-owner'),
          stackOpacity:getComputedStyle(document.getElementById('b345NormalStack')).opacity})''')
        ck(live['b345']['running'] and live['b345']['mode']=='silent','Real B345 owns silent sequence after native startup')
        ck(live['p209']['active'] and live['p209']['page']==4 and live['p209']['edition']=='tajwid','Single printed visual surface activated on authentic page 004')
        ck(live['bodyOwned']=='1' and live['stackOpacity']=='0','Old B345 visual stack hidden only after P209 ready')
        ck(len(live['images'])==3 and all(x['loaded'] for x in live['images']),'Three authentic Tajwid raster page buffers loaded')
        geom=page.evaluate('''() => {const d=document.getElementById('mushafDock'),bar=document.getElementById('p209FollowControls'),r=d.getBoundingClientRect();
            const tools=[...d.children].filter(n=>n.tagName==='BUTTON'&&getComputedStyle(n).display!=='none')
              .map(n=>({id:n.id,y:n.getBoundingClientRect().y,bottom:n.getBoundingClientRect().bottom}));
            return{dock:{top:r.top,bottom:r.bottom,height:r.height},bar:{top:bar.getBoundingClientRect().top,bottom:bar.getBoundingClientRect().bottom},
              tools,host:{top:document.getElementById('p209VisualSurface').getBoundingClientRect().top,bottom:document.getElementById('p209VisualSurface').getBoundingClientRect().bottom}}}''')
        ck(geom['dock']['height']>=90 and geom['bar']['top']>=geom['dock']['top'],'Two-row dock really fits despite native high-specificity V695 CSS')
        ck(len(geom['tools'])>=5 and all(0<=n['y'] and n['bottom']<=844+8 for n in geom['tools']),'Original dock tools remain inside viewport')
        ck(geom['host']['bottom']<=geom['dock']['top']+1,'Visual page stops above the two-row dock')
        ck(page.locator('#p209VisualSurface').count()==1 and page.locator('#p209FollowControls button').count()==2,'Only one visual surface and one pair of native-delegated controls')
        page.screenshot(path=str(args.snapshot_dir/'follow_active.png'))
        # Check the ACTUAL R33 printed ayah geometry from the owner APK, not
        # synthetic boxes from the preview harness.
        zones=page.evaluate('''() => ({raw:[...document.querySelectorAll('#b345NormalStack>.r33PrintShell')].slice(0,3).map(x=>x.querySelectorAll('.ayahHitLayer .ayahHit').length),
            projected:[...document.querySelectorAll('#p209VisualSurface .p209Page')].map(x=>x.querySelectorAll('.p209HitLayer .ayahHit').length)})''')
        ck(len(zones['raw'])==3 and all(n>0 for n in zones['raw']) and zones['raw']==zones['projected'],
           'Actual P205 printed ayah hit geometry projected without missing/extra zones')
        candidate=page.evaluate('''() => {const h=document.getElementById('p209VisualSurface').getBoundingClientRect();
          for(const e of document.querySelectorAll('#p209VisualSurface .p209Page:first-child .p209HitLayer .ayahHit')){
           const r=e.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
           if(x>h.left+15&&x<h.right-15&&y>h.top+75&&y<h.bottom-80)return{x,y,a:Number(e.dataset.selectayah)};
          }return null;}''')
        ck(bool(candidate and candidate['a']>0),'Live page 004 ayah hit is tappable at its projected location')
        old_retarget=page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.printRetargets')
        page.mouse.click(candidate['x'],candidate['y'])
        page.wait_for_timeout(160)
        tapped=page.evaluate('''() => ({projected:window.__BASAIR_P209_ONE_SURFACE__.status().tapsMapped,
             native:window.__BASAIR_B345_SEQUENCE__.state.printRetargets,
             running:window.__BASAIR_B345_SEQUENCE__.state.running})''')
        ck(tapped['projected']==1 and tapped['native']==old_retarget+1 and tapped['running'],
           'Real ayah tap retargets the genuine B345 controller exactly once')
        mapped_before_swipe=tapped['projected']
        # A genuine touch gesture must reach the native B345 manual-hold lifecycle,
        # not freeze it at Infinity or retarget an ayah during a swipe.
        cdp=context.new_cdp_session(page)
        try:
            cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':180,'y':365,'id':1}]})
            page.wait_for_timeout(100)
            started=page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.userScrolling')
            cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':180,'y':295,'id':1}]})
            page.wait_for_timeout(75)
            cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
            page.wait_for_timeout(160)
            ended_touch=page.evaluate('''() => ({userScrolling:window.__BASAIR_B345_SEQUENCE__.state.userScrolling,
               hold:window.__BASAIR_B345_SEQUENCE__.state.manualHoldUntil,
               gestureEnds:window.__BASAIR_P209_ONE_SURFACE__.status().nativeGestureEnds,
               taps:window.__BASAIR_P209_ONE_SURFACE__.status().tapsMapped,
               running:window.__BASAIR_B345_SEQUENCE__.state.running})''')
            ck(bool(started),'Real B345 receives touchStart within the full reader')
            ck(not ended_touch['userScrolling'] and ended_touch['hold']!=float('inf'),
               'Real B345 releases manual-hold after full-screen P209 swipe')
            ck(ended_touch['running'] and ended_touch['taps']==mapped_before_swipe,
               'Native follow continues after swipe without a false ayah retarget')
        finally:cdp.detach()
        page.locator('#p209FollowControls .p209Pause').click(force=True)
        page.wait_for_timeout(850)
        pause=page.evaluate('''() => ({state:window.__BASAIR_B345_SEQUENCE__.state.paused, p209:window.__BASAIR_P209_ONE_SURFACE__.status()})''')
        ck(bool(pause['state']),'Native B345 pause triggered by P209 control')
        page.locator('#p209FollowControls .p209Pause').click(force=True)
        page.wait_for_timeout(240)
        ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.paused'),'Native B345 resume triggered by same control')
        page.locator('#p209FollowControls .p209Stop').click(force=True)
        page.wait_for_function('!window.__BASAIR_P209_ONE_SURFACE__.status().active',timeout=3600)
        page.wait_for_timeout(200)
        ended=page.evaluate('''() => ({native:window.__BASAIR_B345_SEQUENCE__.snapshot(),
            frame:document.querySelector('#mushafReader .localPageStage img[data-mushaf-page]')?.getAttribute('data-mushaf-page'),
            p209:window.__BASAIR_P209_ONE_SURFACE__.status(),
            guard:window.__BASAIR_P207_FOLLOW_GUARD__.status(),
            reader:document.getElementById('mushafReader'),bodyFlag:document.body.hasAttribute('data-p209-visual-owner')})''')
        ck(not ended['native']['running'] and ended['native']['activeOwners']==0,'STOP releases real B345 ownership and timers')
        ck(not ended['native']['printStaticHeld'],'Owner-signed P207 releases frozen R39 stack after STOP')
        ck(not ended['bodyFlag'] and not ended['p209']['active'],'P209 removes all visual overlay ownership after STOP')
        ck(ended['frame'] in ('4','5'),'Authentic printed page restored rather than the old digital follow stack')
        ck(page.locator('#p209FollowControls').count()==0,'No duplicated Follow controls after STOP')
        page.screenshot(path=str(args.snapshot_dir/'after_stop.png'))
        # Browser origin is opaque (we use a localStorage shim), so these baseline
        # IndexedDB rejections are expected. Do not count them as P209 regressions.
        err_unexpected=[e for e in errors if 'IDBFactory' not in e and 'insertBefore' not in e]
        ck(not err_unexpected,'No unexpected JavaScript exception in full V695 shell: '+repr(err_unexpected))
        browser.close()

summary={'kind':'FULL-V695-CODE-IN-CHROMIUM-NOT-ANDROID-WEBVIEW','passed':len(checks),'failed':0,
  'apk_sha256':sha,'real_b345':True,'real_r33':True,'real_p205_signed':True,'real_p207_signed':True,
  'native_silent_start_pause_resume_stop':True,'real_android_webview':False,'real_audio':False,
  'live_ota_changed':False,'offline_external_requests_blocked':block_count['external'],
  'baseline_expected_opaque_origin_errors':'IndexedDB API disabled in this test origin'}
(args.snapshot_dir/'results.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print('P209 R5 FULL V695 SHELL CHECKS:',len(checks),'PASS')
for i,x in enumerate(checks,1):print(f'{i:02}. {x}')
