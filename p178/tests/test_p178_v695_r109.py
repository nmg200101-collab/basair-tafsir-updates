"""P178 executes exact tilawa-r109-selected.js from official V695 APK in Chromium."""
from pathlib import Path
import os
import zipfile
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
APK=Path(os.environ.get('BASAIR_V695_APK','/mnt/data/basair-v695-owner-signed.apk'))
if not APK.is_file(): raise SystemExit('V695 APK required locally: set BASAIR_V695_APK (never commit APK or private keys)')
with zipfile.ZipFile(APK) as z:
    NATIVE=z.read('assets/www/tilawa-r109-selected.js').decode('utf-8')
P178=(ROOT/'modules/p178-salman-selected-follow.js').read_text()
CSS=(ROOT/'modules/p178-salman-selected-follow.css').read_text()
HTML='''<!DOCTYPE html><html lang="ar" dir="rtl"><body>
<section id="tilawaIndex" class="active"><div id="v135TilawaTools"></div></section>
<select id="sequenceReciterV17"><option value="alafasy">مشاري العفاسي</option></select>
<select id="readerSurahSelect"><option value="1">سورة الفاتحة</option><option value="18">سورة الكهف</option></select>
<audio id="tilawaAudio"></audio></body></html>'''
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    checks=[]
    for width in (320,390,768):
      for early in (True,False):
        page=b.new_page(viewport={'width':width,'height':900})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(HTML)
        page.evaluate("HTMLMediaElement.prototype.play=function(){return Promise.resolve()};HTMLMediaElement.prototype.pause=function(){};")
        if early:page.add_script_tag(content=P178)
        page.add_script_tag(content=NATIVE)
        if not early:page.add_script_tag(content=P178)
        page.add_style_tag(content=CSS)
        page.evaluate('window.__BASAIR_R109_SELECTED__.open()')
        page.wait_for_selector('#p178SalmanReaderCard',timeout=6000)
        assert page.locator('#p178SalmanReaderCard').count()==1
        assert page.evaluate('window.__BASAIR_R109_SELECTED__.readers.length')==13
        page.locator('#p178SalmanReaderCard button').click()
        assert page.locator('#p178SurahSelect option').count()==114
        page.locator('#p178SurahSelect').select_option('18')
        page.locator('#r108List button').first.click()
        assert page.locator('#r109Audio').count()==1
        assert page.evaluate('window.__BASAIR_R109_SELECTED__._test.state.playing.reader')=='salman-obaid-almutairi'
        page.evaluate('window.__BASAIR_R109_SELECTED__.back()')
        assert page.locator('#r109Audio').count()==0
        assert page.locator('#p178SurahSelect').count()==1
        page.evaluate('window.__BASAIR_R109_SELECTED__.back()')
        assert page.locator('#p178SalmanReaderCard').count()==1
        assert not errors,errors
        checks.append((width,early))
        page.close()
    b.close()
    print('P178 real V695 R109 source tests:',len(checks),'/',len(checks),'PASS')
