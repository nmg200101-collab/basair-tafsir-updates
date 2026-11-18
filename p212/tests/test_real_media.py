"""P212 local Chromium regression in REAL V695 HTML. Media plays actual WAV bytes.
No Android WebView, no network, no APK build, no private keys.
"""
from pathlib import Path
import zipfile, wave, io, math, struct, base64, json
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
APK=Path('/mnt/data/basair-v695-owner-signed.apk')
checks=[]
def ck(v,desc):
    assert v,desc
    checks.append(desc)
    print(f"[PASS] {len(checks)} {desc}", flush=True)
with zipfile.ZipFile(APK) as z:
    pfx='assets/www/'; names=set(z.namelist())
    html=z.read(pfx+'index.html').decode('utf-8').replace('<head>','<head><base href="https://basair-v695.invalid/">',1)
    init='''(()=>{const mem=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k),clear:()=>mem.clear(),key:i=>Array.from(mem.keys())[i]||null,get length(){return mem.size}}});window.__BASAIR_OFFLINE_TEST__=true})();'''
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
        ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
        ctx.add_init_script(init)
        page=ctx.new_page();errors=[]
        page.on('pageerror',lambda err:errors.append(str(err)+('\n'+str(getattr(err,'stack','')) if hasattr(err,'stack') else '')))
        def fulfill(route):
            u=urlparse(route.request.url)
            if u.netloc!='basair-v695.invalid':return route.fulfill(status=204,body=b'')
            key=pfx+unquote(u.path).lstrip('/')
            if key not in names:return route.fulfill(status=404,body=b'')
            typ={'.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'}.get(Path(key).suffix,'application/octet-stream')
            return route.fulfill(status=200,body=z.read(key),content_type=typ)
        page.route('**/*',fulfill)
        page.set_content(html,wait_until='domcontentloaded',timeout=60000)
        ck(page.evaluate('!!window.__BASAIR_B345_SEQUENCE__&&!!window.__BASAIR_PRINT_FOLLOW_100__'),'Original B345/R33 booted')
        page.get_by_text('افتح التلاوة',exact=False).first.click(timeout=15000)
        page.wait_for_timeout(400)
        page.get_by_role('button',name='فتح',exact=True).first.click(timeout=15000)
        page.evaluate('window.openPage(4)');page.wait_for_timeout(400)
        page.evaluate('document.querySelector(\'[data-v129-print="tajwid"]\').click()')
        page.wait_for_timeout(500)
        ck(page.evaluate('window.__BASAIR_PRINT_FOLLOW_100__.active()&&window.__BASAIR_PRINT_FOLLOW_100__.edition()==="tajwid"'),'Real Tajwid print mode')
        page.add_script_tag(content=(ROOT/'src/p212-tajwid-static-follow.js').read_text())
        page.wait_for_timeout(500)
        ck(page.locator('#p212Silent').count()==1,'New silent controller is mounted')
        ck(page.locator('#p212Audio').count()==1,'New audio controller is mounted')
        ck(page.evaluate('document.body.getAttribute("data-p212-tajwid-route")==="1"'),'Tajwid overrides legacy route')
        page.evaluate("document.getElementById('sequenceSheetV10').classList.add('open')")
        page.locator('#p212Silent').click()
        page.wait_for_timeout(350)
        ck(page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.status().running'),'Independent silent follow starts')
        page.screenshot(path=str(ROOT/'reports/P212_RUNNING_CHROMIUM.png'))
        ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'B345 has not started')
        ck(page.locator('#b345NormalStack > *').count()==0,'No old stacked follow pages')
        page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.stop("silent-test")')
        ck(page.locator('#mushafReader .localPageStage img[data-mushaf-page]').get_attribute('data-mushaf-page')=='4','Silent stop retains real static page')
        # Tone, not a mocked media promise: HTMLAudioElement must decode and finish this WAV.
        out=io.BytesIO()
        with wave.open(out,'wb') as wf:
            rate=16000;frames=round(rate*1.6)
            wf.setnchannels(1);wf.setsampwidth(2);wf.setframerate(rate)
            buf=bytearray()
            for i in range(frames):
                # Soft, newly generated short sine, not copyrighted recitation.
                sample=int(1800*math.sin(2*math.pi*440*i/rate))
                buf.extend(struct.pack('<h',sample))
            wf.writeframes(bytes(buf))
        data='data:audio/wav;base64,'+base64.b64encode(out.getvalue()).decode()
        page.evaluate('''(src)=>{
          window.__BASAIR_V180_TEST__={peek:(p,k)=>src,packUrl:(k,p)=>src,warm:(p,k)=>Promise.resolve(src)};
          window.__P212_MEDIA_EVENTS__=[];
          document.addEventListener('play',ev=>{if(ev.target.id==='p212DedicatedPageAudio')window.__P212_MEDIA_EVENTS__.push('play')},true);
          document.addEventListener('ended',ev=>{if(ev.target.id==='p212DedicatedPageAudio')window.__P212_MEDIA_EVENTS__.push('ended')},true);
        }''',data)
        page.evaluate("document.getElementById('sequenceSheetV10').classList.add('open')")
        page.locator('#p212Audio').click(timeout=8000)
        page.wait_for_function("window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.status().audioStarted===true",timeout=6000)
        ck(page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.status().mode==="audio"'),'Independent real-media audio mode')
        ck(page.locator('#p212DedicatedPageAudio').count()==1,'Own dedicated audio element created')
        ck(page.evaluate('document.getElementById("p212DedicatedPageAudio")!==document.getElementById("tilawaAudio")'),'B345 audio element untouched')
        ck(page.evaluate('document.getElementById("p212DedicatedPageAudio").readyState>=2'),'Real media data buffered')
        ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'B345 remains stopped while audio plays')
        # Pause/resume with REAL HTMLMediaElement currentTime, no mocked play()
        page.wait_for_timeout(220)
        page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.pause()')
        paused_time=page.evaluate('document.getElementById("p212DedicatedPageAudio").currentTime')
        ck(page.evaluate('document.getElementById("p212DedicatedPageAudio").paused'),'HTMLAudioElement paused')
        page.wait_for_timeout(260)
        stalled_time=page.evaluate('document.getElementById("p212DedicatedPageAudio").currentTime')
        ck(abs(stalled_time-paused_time)<.06,'Audio currentTime held steady while paused')
        page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.pause()')
        page.wait_for_timeout(200)
        resumed_time=page.evaluate('document.getElementById("p212DedicatedPageAudio").currentTime')
        ck(resumed_time>stalled_time+.02,'Audio resumed from exact paused position')
        # Source lasts 0.9 sec, ended must advance the actual stable page
        page.wait_for_function('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.status().page>=5',timeout=10000)
        ck(page.evaluate('window.__P212_MEDIA_EVENTS__.includes("ended")'),'Native HTMLMediaElement emitted ended')
        ck(page.locator('#mushafReader .localPageStage img[data-mushaf-page]').get_attribute('data-mushaf-page')=='5','Media end advanced ORIGINAL stable framed page')
        page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.stop("audio-test")')
        ck(not page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.status().running'),'STOP releases own audio')
        ck(page.locator('#p212DedicatedPageAudio').get_attribute('src') is None,'STOP clears audio src')
        ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'STOP did not reenable B345')
        ck(page.locator('#mushafReader .localPageStage img[data-mushaf-page]').get_attribute('data-mushaf-page')=='5','STOP retained single true page')
        page.screenshot(path=str(ROOT/'reports/P212_AFTER_STOP_CHROMIUM.png'))
        # Malformed key must never silently play fallback Alafasy from v180PackUrl
        page.evaluate('''() => {const s=document.getElementById("sequenceReciterV17");const o=new Option("اختبار غير مدعوم","invalid-reciter");s.add(o);s.value="invalid-reciter"}''')
        ck(not page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.start("audio")'),'Unsupported reciter fails closed')
        ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'No legacy fallback for unsupported reciter')
        ck(not page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.status().running'),'Unsupported reciter remains stopped')
        # Arkani must not get Alafasy under any circumstance
        page.evaluate('document.getElementById("sequenceReciterV17").value="arkani"')
        ck(not page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.start("audio")'),'Arkani multi-segment refused instead of substituting')
        ck(page.evaluate('document.getElementById("p212DedicatedPageAudio").getAttribute("src")===null'),'Arkani failure kept player cleared')
        # Bad cached object + good pack URL: only ONE fallback attempt, no
        # double-skipped source if `error` and play() rejection overlap.
        page.evaluate('''(good)=>{
           const sel=document.getElementById('sequenceReciterV17');sel.value='alafasy';
           window.__BASAIR_V180_TEST__={peek:()=> 'data:audio/mp3;base64,bad',packUrl:()=>good,warm:()=>Promise.resolve(null)};
        }''',data)
        page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.start("audio")')
        page.wait_for_timeout(900)
        page.wait_for_function('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.status().audioStarted',timeout=2500)
        ck(page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.status().sourceIndex===2'),'Invalid first source tried exactly once before valid fallback')
        ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'Audio fallback never starts B345')
        ck(page.evaluate('document.getElementById("p212DedicatedPageAudio").readyState>=2'),'Fallback is real valid media')
        page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.stop("fallback-stop")')
        ck(page.locator('#p212DedicatedPageAudio').get_attribute('src') is None,'Fallback stop clears source')
        # Immediate STOP must invalidate the initial play() promise even when
        # a media-load job is queued. No second player or delayed ghost start.
        page.evaluate('''(src) => {
           const sel=document.getElementById('sequenceReciterV17');sel.value='alafasy';
           window.__BASAIR_V180_TEST__={peek:()=>src,packUrl:()=>src,warm:()=>Promise.resolve(null)};
           const c=window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__;
           c.start('audio');c.stop('immediate-stop');
        }''',data)
        page.wait_for_timeout(160)
        ck(not page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.status().running'),'Immediate STOP invalidates queued media completion')
        ck(page.locator('#p212DedicatedPageAudio').get_attribute('src') is None,'Immediate STOP prevents ghost source')
        ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'Immediate stop never starts B345')
        # Changing selected reciter during playback must keep originally chosen
        # voice for next page, not substitute another recording silently.
        page.evaluate('''(src) => {
           window.__P212_RECITER_KEYS__=[];
           window.__BASAIR_V180_TEST__={peek:(p,k)=>null,packUrl:(k,p)=>{window.__P212_RECITER_KEYS__.push(k);return src},warm:()=>Promise.resolve(null)};
           const pick=document.getElementById('sequenceReciterV17');pick.value='alafasy';
           window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.start('audio');
           pick.value='husary';
        }''',data)
        page.wait_for_function('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.status().page>=6',timeout=10000)
        ck(page.evaluate('window.__P212_RECITER_KEYS__.every(k=>k==="alafasy")'),'Selected reciter locked across page transition')
        page.evaluate('window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.stop("reciter-check")')
        # Edition switching must never route the original print into P212.
        page.evaluate('''() => {localStorage.setItem('v129PrintMode','original');window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.route()}''')
        ck(not page.evaluate('document.body.hasAttribute("data-p212-tajwid-route")'),'Original print stays outside new static-colored route')
        ck(page.evaluate('typeof window.__BASAIR_B345_SEQUENCE__.startSilent==="function"'),'Original print retains native B345 follow')
        # Re-enter Tajwid with non-100% zoom: do not allow legacy fallback.
        page.evaluate('''() => {localStorage.setItem('v129PrintMode','tajwid');window.__BASAIR_PRINT_FOLLOW_100__.scale=()=>130;window.__BASAIR_P212_TAJWID_STATIC_FOLLOW__.route()}''')
        ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.startSilent()'),'Colored 130% zoom does not leak into legacy B345')

        print('BROWSER_ERRORS_FIRST',[x[:650] for x in errors[:3]])
        browser.close()
print('P212 REAL MEDIA TEST',len(checks),'PASS')
(ROOT/'reports/P212_REAL_MEDIA_RESULTS.json').write_text(json.dumps({'checks':checks,'pass':len(checks),'real_media_element':True,'played_generated_wav':True,'android_webview':False,'cloud_ci_used':False},ensure_ascii=False,indent=2)+'\n')
