"""P177 scoped narrator, long-press selection, saved return tests.
This is a real Chromium DOM/runtime test, not an Android WebView field test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent
JS=(ROOT/'p177-tafsir-reader-final.js').read_text()
CSS=(ROOT/'p177-tafsir-reader-final.css').read_text()

HTML='''<!doctype html><html lang="ar" dir="rtl"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{box-sizing:border-box}body{font:15px Arial;margin:0;background:#fdfbf4;color:#16432e}
.view{display:none}.view.active{display:block}#tafsirReader{width:100%;padding:9px}
.v194T2Ayah{background:#fff;border:1px solid #ddd;border-radius:12px;padding:12px;margin:9px 0;}
.v194T2Qrow{padding:8px;background:#faf6ed}.v194T2Body{padding:8px}
.p144MicButton{display:inline-flex;min-height:36px;border:1px solid green;background:#eee}
.bq165InlineNarrator,.bq166Voice{display:inline-block}
#basairTafsirB232FavoritesPanel,#basairTafsirR2NoteSheet{display:none}
#basairTafsirB232FavoritesPanel.show,#basairTafsirR2NoteSheet.show{display:block}
#p144SpeechFrame{bottom:110px;position:fixed}
</style>
<body>
<section id="home" class="view"></section>
<section id="tafsirIndex" class="view"></section>
<section id="tafsirReader" class="view active">
 <div id="tafsirAyahs">
 <article class="v194T2Ayah" id="a1"><div class="v194T2Qrow"><span class="qtext">الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ</span></div>
 <div class="v194T2Body"><h3 class="v194T2FieldTitle">المعنى <button class="bq165InlineNarrator">ناطق قديم</button></h3>
 <p id="bodyText">الثناء الكامل لله وحده، رب جميع الخلق، منشئهم ومربيهم.</p>
 <button class="p144MicButton" aria-pressed="false"><b>الناطق</b></button>
 <button id="nativeCopy">نسخ</button><textarea id="noteText">ملاحظة المستخدم</textarea>
 </div></article>
 <article class="v194T2Ayah" id="a2"><div class="v194T2Qrow"><span class="qtext">الرَّحْمَٰنِ الرَّحِيمِ</span></div>
 <div class="v194T2Body"><div class="v194T2FieldTitle">الخلاصة</div>
 <p>تفسير الآية الثانية</p><button class="p144MicButton" aria-pressed="false"><b>الناطق</b></button>
 <button class="bq166Voice">ناطق آخر</button></div></article>
 </div></section>
<section id="basairTafsirB232FavoritesPanel"><button id="basairTafsirB232FavoritesClose">رجوع</button><div id="basairTafsirR3NotesList"><button data-r3-note-edit="1:2">تعديل ملاحظة</button><button data-r3-note-open="1:2">فتح آية</button></div></section>
<section id="basairTafsirR2NoteSheet"><button data-r2-note-close>إغلاق</button></section>
<div id="p144SpeechFrame" role="status">الناطق يعمل</div>
</body></html>'''

BOOT='''() => {
  window.test={running:false,settings:0,copied:0,r3Installs:0,backNativeCalls:0,savedOpened:0,indexOpens:0};
  window.basairBack=()=>{test.backNativeCalls++};
  window.__BASAIR_TAFSIR_NATIQ_P132__={
    status(){return {running:test.running}},
    settings(){test.settings++}
  };
  window.__BASAIR_TAFSIR_R3__={
    installBack(){test.r3Installs++;const f=()=>{test.backNativeCalls++};f.__r3=true;window.basairBack=f},
    status(){return {back:!!window.basairBack.__r3}}
  };
  window.__BASAIR_TAFSIR_P157_STABLE__={
    openSaved(tab){test.savedOpened++;document.querySelector('#basairTafsirB232FavoritesPanel').classList.add('show');return true}
  };
  window.openTafsirIndex=()=>{
    test.indexOpens++;document.querySelectorAll('.view').forEach(e=>e.classList.remove('active'));
    document.getElementById('tafsirIndex').classList.add('active');
  };
  document.getElementById('nativeCopy').addEventListener('click',()=>test.copied++);
  document.querySelectorAll('.p144MicButton').forEach(b=>{
    let timer;
    b.addEventListener('pointerdown',()=>{timer=setTimeout(()=>{test.settings++},570)});
    b.addEventListener('pointerup',()=>clearTimeout(timer));
    b.addEventListener('pointercancel',()=>clearTimeout(timer));
    b.addEventListener('click',()=>{test.running=!test.running;
      b.setAttribute('aria-pressed',test.running?'true':'false');
      b.classList.toggle('p132-on',test.running);
    });
  });
  document.getElementById('basairTafsirB232FavoritesClose').addEventListener('click',
    ()=>document.getElementById('basairTafsirB232FavoritesPanel').classList.remove('show'));
}'''


def main():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  tested=0;failures=[]
  for width in (320,360,390,430,768):
   for night in (False,True):
    page=browser.new_page(viewport={'width':width,'height':800},is_mobile=True,has_touch=True)
    errors=[];page.on('pageerror', lambda e:errors.append(str(e)))
    page.set_content(HTML)
    page.evaluate(BOOT)
    if night: page.evaluate("document.body.classList.add('dark')")
    page.add_style_tag(content=CSS)
    page.add_script_tag(content=JS)
    page.wait_for_function("document.querySelectorAll('.p177VoiceDock > button.p144MicButton').length === 2")
    assert page.locator('.p177VoiceDock > button.p144MicButton').count()==2
    assert page.locator('.bq165InlineNarrator').is_hidden() and page.locator('.bq166Voice').is_hidden()
    assert page.evaluate("getComputedStyle(document.querySelector('#a1 .v194T2Body')).userSelect")=='none'
    assert page.evaluate("getComputedStyle(document.getElementById('noteText')).userSelect")=='text'
    assert page.evaluate("getComputedStyle(document.querySelector('#p144SpeechFrame')).top !== 'auto'")
    page.locator('#nativeCopy').click()
    assert page.evaluate('test.copied')==1
    b=page.locator('#a1 .p177VoiceDock button')
    b.click()
    page.wait_for_function("document.querySelector('#a1').hasAttribute('data-p177-speaking')",timeout=2000)
    assert page.evaluate("getComputedStyle(document.querySelector('#a1 .p177VoiceDock button')).backgroundColor")=='rgb(21, 102, 74)' if not night else True
    b.click();page.wait_for_function("!document.querySelector('#a1').hasAttribute('data-p177-speaking')",timeout=2000)
    # Long press must reach the original P144 button, not be stolen by a proxy.
    b.dispatch_event('pointerdown',{'pointerId':1,'clientX':10,'clientY':10})
    page.wait_for_timeout(620)
    b.dispatch_event('pointerup',{'pointerId':1,'clientX':10,'clientY':10})
    assert page.evaluate('test.settings')>=1
    # Disable native selection handles in verse prose only.
    page.evaluate('''() => { const t=document.querySelector('#bodyText').firstChild;
      const r=document.createRange();r.setStart(t,0);r.setEnd(t,10);
      const s=getSelection();s.removeAllRanges();s.addRange(r);
      document.dispatchEvent(new Event('selectionchange'));
    }''')
    assert page.evaluate('getSelection().rangeCount')==0
    assert not errors, errors
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 3')
    tested+=1
    page.close()
  # Saved / Notes return cases, app Back remains native owner R3.
  page=browser.new_page(viewport={'width':390,'height':830})
  page.set_content(HTML);page.evaluate(BOOT)
  page.add_style_tag(content=CSS);page.add_script_tag(content=JS)
  page.evaluate('''() => {
    document.querySelectorAll('.view').forEach(e=>e.classList.remove('active'));
    document.querySelector('#tafsirIndex').classList.add('active');
    document.querySelector('#basairTafsirB232FavoritesPanel').classList.add('show');
  }''')
  page.wait_for_function('test.r3Installs >= 1',timeout=1500)
  page.locator('[data-r3-note-edit]').dispatch_event('pointerdown')
  page.evaluate('''() => {
    document.querySelector('#basairTafsirB232FavoritesPanel').classList.remove('show');
    document.querySelector('#basairTafsirR2NoteSheet').classList.add('show');
  }''')
  page.evaluate('''() => {
    document.querySelector('#basairTafsirR2NoteSheet').classList.remove('show');
    window.__BASAIR_TAFSIR_P177_FINAL__.refresh();
  }''')
  page.wait_for_function("document.querySelector('#basairTafsirB232FavoritesPanel').classList.contains('show')")
  assert page.evaluate('test.savedOpened >= 1')
  tested+=1
  # Native home jump from a saved verse is corrected to tafsirIndex.
  page.locator('[data-r3-note-open]').dispatch_event('pointerdown')
  page.evaluate('''() => {
    document.querySelector('#basairTafsirB232FavoritesPanel').classList.remove('show');
    document.querySelector('#tafsirIndex').classList.remove('active');
    document.querySelector('#tafsirReader').classList.add('active');
  }''')
  page.evaluate('''() => {
    document.querySelector('#tafsirReader').classList.remove('active');
    document.querySelector('#home').classList.add('active');
  }''')
  page.wait_for_function('test.indexOpens>=1',timeout=1500)
  assert page.locator('#tafsirIndex').get_attribute('class')=='view active'
  tested+=1
  # Explicit Home button must still work (never forcibly return to Tafsir).
  page.evaluate('''() => {
    const b=document.createElement('button');b.id='realHome';b.dataset.nav='home';document.body.appendChild(b);
    document.querySelector('#basairTafsirB232FavoritesPanel').classList.add('show');
    b.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    document.querySelectorAll('.view').forEach(e=>e.classList.remove('active'));
    document.querySelector('#home').classList.add('active');
    window.__BASAIR_TAFSIR_P177_FINAL__.refresh();
  }''')
  page.wait_for_timeout(60)
  assert page.locator('#home').get_attribute('class')=='view active'
  tested+=1
  # If an older app back handler reasserts itself while Saved is open,
  # the original R3 back owner must be restored without overriding back globally.
  page.evaluate('''() => {
    document.querySelector('#tafsirIndex').classList.add('active');
    document.querySelector('#home').classList.remove('active');
    document.querySelector('#basairTafsirB232FavoritesPanel').classList.add('show');
    window.basairBack=()=>false; // simulate late native V117 reassertion
  }''')
  page.wait_for_function("window.__BASAIR_TAFSIR_R3__.status().back",timeout=2000)
  calls=page.evaluate('test.r3Installs')
  page.wait_for_timeout(780)
  assert page.evaluate('test.r3Installs')==calls, 'No redundant R3 back reinstallation loop'
  tested+=1
  page.close()
  # During active TTS, any NEW verse waits until speech finishes before the
  # original microphone is relocated. There must be no flashing bottom mic.
  p2=browser.new_page(viewport={'width':390,'height':810})
  p2.set_content(HTML);p2.evaluate(BOOT)
  p2.add_style_tag(content=CSS);p2.add_script_tag(content=JS)
  p2.wait_for_function("document.querySelectorAll('.p177VoiceDock > button.p144MicButton').length===2")
  p2.evaluate('''() => {
    test.running=true;
    const x=document.createElement('article');x.className='v194T2Ayah';x.id='newVerse';
    x.innerHTML='<div class="v194T2Qrow">آية جديدة</div><div class="v194T2Body"><button class="p144MicButton">الناطق</button></div>';
    document.querySelector('#tafsirAyahs').appendChild(x);
  }''')
  p2.wait_for_function("document.querySelector('#newVerse').hasAttribute('data-p177-voice-pending')")
  assert p2.locator('#newVerse .v194T2Body .p144MicButton').is_hidden()
  p2.evaluate('test.running=false')
  p2.wait_for_function("document.querySelector('#newVerse .p177VoiceDock > button.p144MicButton') !== null",timeout=2500)
  tested+=1
  p2.close()
  # R3 panels created after OTA boot must still be watched for their close event.
  p3=browser.new_page(viewport={'width':390,'height':830})
  p3.set_content(HTML)
  p3.evaluate(BOOT)
  p3.evaluate("document.getElementById('basairTafsirB232FavoritesPanel').remove();document.getElementById('basairTafsirR2NoteSheet').remove()")
  p3.add_style_tag(content=CSS);p3.add_script_tag(content=JS)
  p3.evaluate('''() => {
    document.querySelectorAll('.view').forEach(e=>e.classList.remove('active'));
    document.getElementById('tafsirIndex').classList.add('active');
    const saved=document.createElement('section');saved.id='basairTafsirB232FavoritesPanel';
    saved.innerHTML='<button data-r3-note-edit="2:1">تعديل ملاحظة</button>';
    const note=document.createElement('section');note.id='basairTafsirR2NoteSheet';
    document.body.append(saved,note);
  }''')
  p3.wait_for_timeout(750) # late panel observers attach without full-page mutations
  p3.evaluate("document.getElementById('basairTafsirB232FavoritesPanel').classList.add('show')")
  p3.locator('[data-r3-note-edit]').dispatch_event('pointerdown')
  p3.evaluate('''() => {
    document.getElementById('basairTafsirB232FavoritesPanel').classList.remove('show');
    document.getElementById('basairTafsirR2NoteSheet').classList.add('show');
  }''')
  p3.evaluate("document.getElementById('basairTafsirR2NoteSheet').classList.remove('show')")
  p3.wait_for_function("document.getElementById('basairTafsirB232FavoritesPanel').classList.contains('show')",timeout=2000)
  assert p3.evaluate('test.savedOpened')>=1
  tested+=1;p3.close()
  browser.close()
  print(f'PASS P177 Chromium: {tested} checks (responsive/night reader; Saved/Notes and late-mounted back; original P144+R3 preserved)')

if __name__=='__main__': main()
