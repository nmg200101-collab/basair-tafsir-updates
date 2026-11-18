"""P211 direct static Tajwid follow integration on real embedded V695 HTML.
Never invokes B345 start on colored mode; no Android/WebView/audio proof.
"""
import zipfile,hashlib,json,io,wave,base64
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).parent
APK=Path('/mnt/data/basair-v695-owner-signed.apk')
checks=[]
def ck(value,msg):
 if not value:raise AssertionError(msg)
 checks.append(msg)
with zipfile.ZipFile(APK) as z:
 entries=set(z.namelist());prefix='assets/www/'
 html=z.read(prefix+'index.html').decode('utf-8').replace('<head>','<head><base href="https://basair-v695.invalid/">',1)
 shim='''(()=>{const mem=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k),clear:()=>mem.clear(),key:i=>Array.from(mem.keys())[i]||null,get length(){return mem.size}}});window.__BASAIR_OFFLINE_TEST__=true})();'''
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,has_touch=True,is_mobile=True)
  context.add_init_script(shim);page=context.new_page();errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  def fulfill(route):
   url=urlparse(route.request.url)
   if url.netloc!='basair-v695.invalid':return route.fulfill(status=204,body=b'')
   key=prefix+unquote(url.path).lstrip('/')
   if key not in entries:return route.fulfill(status=404,body=b'')
   typ={'.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg'}.get(Path(key).suffix,'application/octet-stream')
   return route.fulfill(status=200,body=z.read(key),content_type=typ)
  page.route('**/*',fulfill)
  page.set_content(html,wait_until='domcontentloaded',timeout=50000)
  ck(page.evaluate('!!window.__BASAIR_B345_SEQUENCE__&&!!window.__BASAIR_PRINT_FOLLOW_100__'),'Embedded B345 & R33 booted')
  page.get_by_text('افتح التلاوة',exact=False).first.click(timeout=10000)
  page.wait_for_timeout(400)
  page.get_by_role('button',name='فتح',exact=True).first.click(timeout=10000)
  page.evaluate('window.openPage(4)');page.wait_for_timeout(350)
  page.evaluate('document.querySelector(\'[data-v129-print="tajwid"]\').click()')
  page.wait_for_timeout(500)
  ck(page.evaluate("window.__BASAIR_PRINT_FOLLOW_100__.active()&&window.__BASAIR_PRINT_FOLLOW_100__.edition()==='tajwid'"),'Tajwid static page entered')
  img=page.locator('#mushafReader .localPageStage img[data-mushaf-page]')
  ck(img.get_attribute('data-mushaf-page')=='4','Authentic stable page 4 displayed')
  page.add_script_tag(content=(ROOT/'p211-tajwid-static-follow.js').read_text())
  page.wait_for_timeout(550)
  ck(page.locator('#p211Silent').count()==1,'Own silent start button installed')
  ck(page.locator('#p211Audio').count()==1,'Own audio start button installed')
  ck(page.evaluate("document.body.getAttribute('data-p211-tajwid-route')==='1'"),'Direct Tajwid-only route engaged')
  ck(page.evaluate("getComputedStyle(document.getElementById('sequenceSilentV10')).display==='none'"),'Legacy B345 silent start hidden in colored route')
  ck(page.evaluate("getComputedStyle(document.getElementById('sequenceAudioV10')).display==='none'"),'Legacy B345 audio start hidden in colored route')
  page.evaluate("document.getElementById('sequenceSheetV10').classList.add('open')")
  ck(page.evaluate("document.getElementById('p211Silent').offsetParent!==null"),'New silent action visible in opened Follow sheet')
  page.evaluate("document.getElementById('p211Silent').click()")
  page.wait_for_timeout(500)
  state=page.evaluate('''() => ({modern:window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.status(),old:window.__BASAIR_B345_SEQUENCE__.snapshot(),
    nativePage:document.querySelector('#mushafReader .localPageStage img[data-mushaf-page]')?.getAttribute('data-mushaf-page'),
    b345Stack:document.querySelector('#b345NormalStack')?.children.length||0,
    bar:document.getElementById('p211FollowControls')?.getBoundingClientRect().toJSON()})''')
  ck(state['modern']['running'] and state['modern']['mode']=='silent','New independent engine started')
  ck(not state['old']['running'] and state['old']['starts']==0,'Old B345 never started')
  ck(state['nativePage']=='4','Same static page remains during Follow')
  ck(state['b345Stack']==0,'No old B345 page stack created')
  ck(state['bar']['top']>0 and state['bar']['bottom']<844,'Controls stay on screen')
  page.screenshot(path=str(ROOT/'p211_running.png'))
  page.evaluate("window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.pause()")
  ck(page.evaluate('window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.status().paused'),'Independent pause works')
  page.evaluate("window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.pause()")
  ck(not page.evaluate('window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.status().paused'),'Independent resume works')
  page.evaluate("window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.stop('test-stop')")
  page.wait_for_timeout(170)
  ck(not page.evaluate('window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.status().running'),'STOP terminates own session')
  ck(page.locator('#mushafReader .localPageStage img[data-mushaf-page]').get_attribute('data-mushaf-page')=='4','STOP retains original printed static page')
  ck(page.evaluate("!document.body.hasAttribute('data-b345-sequence-surface')"),'STOP never exposes legacy sequence surface')
  page.screenshot(path=str(ROOT/'p211_after_stop.png'))
  ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'Legacy B345 stays stopped after STOP')
  # Exercise page transition with a locally accelerated RAF clock; no B345 scroll.
  page.evaluate("""() => {const old=performance.now.bind(performance);Object.defineProperty(performance,'now',{configurable:true,value:()=>old()-150000});try{window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.start('silent')}finally{Object.defineProperty(performance,'now',{configurable:true,value:old})}}""")
  page.wait_for_function('window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.status().page===5',timeout=6500)
  ck(page.evaluate('window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.status().transitions>=1'),'Independent silent engine advances one page')
  ck(page.locator('#mushafReader .localPageStage img[data-mushaf-page]').get_attribute('data-mushaf-page')=='5','Page transition uses authentic static page 005')
  ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'Silent page transition never starts B345')
  page.evaluate("window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.stop('after-page-change')")
  ck(page.locator('#mushafReader .localPageStage img[data-mushaf-page]').get_attribute('data-mushaf-page')=='5','STOP after transition retains authentic page 005')
  # Audio is exercised with a stubbed local page source and media play():
  # verifies the NEW controller's events, not speaker output or Android playback.
  silence=io.BytesIO()
  with wave.open(silence,'wb') as audio_wave:
    audio_wave.setnchannels(1);audio_wave.setsampwidth(2);audio_wave.setframerate(8000)
    audio_wave.writeframes(b'\0\0'*8000*12)
  source='data:audio/wav;base64,'+base64.b64encode(silence.getvalue()).decode()
  page.evaluate("""(src) => {
    window.__BASAIR_V180_TEST__={peek:()=>null,packUrl:()=>src};
    window.__BASAIR_V173_TEST__={pageAudioUrls:()=>[]};
    const audio=document.getElementById('tilawaAudio');
    audio.play=function(){window.__p211AudioPlays=(window.__p211AudioPlays||0)+1;return Promise.resolve()};
    audio.pause=function(){};audio.load=function(){};
  }""",source)
  ck(page.evaluate("window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.start('audio')"),'New audio mode starts on printed page')
  page.wait_for_timeout(120)
  ck(page.evaluate('window.__p211AudioPlays>=1'),'New engine directly starts page audio service')
  ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'Audio-mode controller did not call old B345')
  page.evaluate("document.getElementById('tilawaAudio').dispatchEvent(new Event('ended'))")
  page.wait_for_function('window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.status().page===6',timeout=6500)
  ck(page.locator('#mushafReader .localPageStage img[data-mushaf-page]').get_attribute('data-mushaf-page')=='6','Audio end advances same framed page to 006')
  ck(page.evaluate('window.__p211AudioPlays>=2'),'Audio next-page playback uses independent controller')
  page.evaluate("window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.stop('audio-test-stop')")
  ck(page.locator('#mushafReader .localPageStage img[data-mushaf-page]').get_attribute('data-mushaf-page')=='6','Audio stop retains page 006 without old stack')
  ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'Legacy B345 stopped throughout independent audio session')
  ck(page.locator('#mushafReader .localPageStage').count()==1,'Only one original stable page stage after independent audio')
  ck(page.locator('#b345NormalStack .r33PrintShell').count()==0,'Never inserted duplicate R33 printed shell')
  # Built-in app calls must be routed into the new engine in Tajwid mode.
  page.evaluate('window.startSilentSequence()')
  ck(page.evaluate('window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.status().running'),'Existing sequence API delegates Tajwid to new controller')
  ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'Direct sequence API never activates B345 for colored pages')
  page.evaluate("window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.stop('alias-test')")
  # Special reciter formats must not quietly play a different Quran recording.
  page.evaluate("document.getElementById('sequenceReciterV17').value='arkani'")
  ck(not page.evaluate("window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.start('audio')"),'Unsupported multi-track reciter is refused, not silently substituted')
  ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'Unsupported reciter never reactivates old Follow')
  # Switch to original, ensure colored-specific controls absent and legacy remains available.
  page.evaluate("window.localStorage.setItem('v129PrintMode','original')");page.wait_for_timeout(550)
  ck(not page.evaluate("document.body.hasAttribute('data-p211-tajwid-route')"),'Edition switch returns original edition to native controller')
  ck(page.evaluate("typeof window.__BASAIR_B345_SEQUENCE__.startSilent==='function'"),'Original-edition B345 controller remains available')
  # Colored edition at non-100% zoom must NOT expose the old B345 start.
  page.evaluate("""() => {localStorage.setItem('v129PrintMode','tajwid');
    window.__BASAIR_PRINT_FOLLOW_100__.scale=()=>130;
    window.__BASAIR_P211_TAJWID_STATIC_FOLLOW__.route()}""")
  ck(page.evaluate("document.body.getAttribute('data-p211-tajwid-route')==='1'"),'Colored zoom still blocks legacy Follow')
  ck(not page.evaluate("window.__BASAIR_B345_SEQUENCE__.startSilent()"),'Unsupported zoom refuses new Follow rather than starting B345')
  ck(not page.evaluate('window.__BASAIR_B345_SEQUENCE__.state.running'),'No legacy colored Follow even at 130%')

  browser.close()
print('P211 direct static Tajwid engine real V695 local tests: PASS',len(checks))
for i,v in enumerate(checks,1):print(f'{i:02d}. {v}')
(ROOT/'test_results.json').write_text(json.dumps({'pass':len(checks),'cases':checks,'AndroidWebView':False,'real_audio':False,'published':False},ensure_ascii=False,indent=2))
