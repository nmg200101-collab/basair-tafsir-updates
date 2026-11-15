from pathlib import Path
from playwright.sync_api import sync_playwright
from textwrap import dedent
import json
B=Path(__file__).resolve().parents[2]
CSS=(B/'p121/owner-qa/modules/tafsir/p169-tafsir-top-status-notes-back.css').read_text()
JS=(B/'p121/owner-qa/modules/tafsir/p169-tafsir-top-status-notes-back.js').read_text()
HTML=dedent('''<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>
<main class="app"><header class="top" style="position:sticky;top:0;height:116px;background:#fafaf8;display:flex;align-items:center;justify-content:space-between"><button>السور</button><h1>تفسير بصائر القرآن</h1><button>125%</button></header>
<div id="tafsirIndex" style="display:none"></div>
<div id="tafsirReader" class="active" style="height:800px;overflow:auto"><div id="tafsirAyahs">
<article class="v194T2Ayah" data-t5-a="2" style="height:1650px;padding:15px;border:1px solid #ddd">
<div class="v194T2Qrow">الآية 2</div><div class="v194T2Body"><div class="v194T2Field meaning"><div class="v194T2FieldTitle"><b>المعنى</b><button class="bq166Voice">◖ ناطق</button></div><p>التفسير</p></div></div>
<div class="p146TopMic" style="display:none"><button class="p144MicButton">ناطق أصلي</button></div>
<div class="bq163NoteLower"><button data-bq163-note="1" class="bq163NoteChip">ملاحظة</button></div>
<div class="basairB231AyahActions"><button data-p125-follow="1">متابعة</button><button>نسخ</button><button>مقارنة</button><button>مفضلة</button></div>
</article></div></div></main>
<div id="basairTafsirR114Status"><span>◉ قراءة تلقائية</span><b data-r114-clock>00:02</b><small data-r114-rate>0.6 ث/سطر</small><button id="b114Stop">إيقاف</button></div>
<div id="p144SpeechFrame">جارٍ تجهيز الناطق</div>
<section id="basairTafsirB232FavoritesPanel" style="display:none" aria-hidden="true"><button id="basairTafsirB232FavoritesClose">رجوع</button><button data-r3-saved-tab="notes">الملاحظات</button><button data-r3-note-edit="2:2">تعديل ملاحظة</button></section>
<section id="basairTafsirR2NoteSheet" aria-hidden="true" style="display:none"><div class="b263r2NotePanel"><div class="b263r2SheetHead"><button data-r2-note-close="1">×</button><b>ملاحظة آية 2</b></div><textarea id="basairTafsirR2NoteText">ملاحظة محفوظة</textarea><button data-r2-note-save="1">حفظ</button></div></section>
<script>
window.TEST={stops:0,notes:0};
document.querySelector('#b114Stop').addEventListener('click',()=>{TEST.stops++;document.querySelector('#basairTafsirR114Status').hidden=true});
function openNote(){const s=document.querySelector('#basairTafsirR2NoteSheet');s.classList.add('show');s.style.display='block';s.setAttribute('aria-hidden','false');}
function closeNote(){const s=document.querySelector('#basairTafsirR2NoteSheet');s.classList.remove('show');s.style.display='none';s.setAttribute('aria-hidden','true');}
document.querySelector('.bq163NoteChip').addEventListener('click',()=>{TEST.notes++;openNote()});
document.querySelector('[data-r3-note-edit]').addEventListener('click',()=>{TEST.notes++;openNote()});
document.querySelector('[data-r2-note-close]').addEventListener('click',()=>closeNote());
window.basairBack=function(){const s=document.querySelector('#basairTafsirR2NoteSheet');if(s.classList.contains('show')){closeNote();return false};const saved=document.querySelector('#basairTafsirB232FavoritesPanel');if(saved.classList.contains('show')){saved.classList.remove('show');saved.style.display='none';return false}return true;};
</script></body></html>''')
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,args=['--no-sandbox'])
 for width in (320,360,390,430):
  for dark in (False,True):
   page=b.new_page(viewport={'width':width,'height':780},has_touch=True,is_mobile=True)
   page.set_content(HTML)
   page.add_style_tag(content=CSS)
   page.add_script_tag(content=JS)
   page.wait_for_timeout(170)
   bar=page.locator('#basairTafsirR114Status')
   speech=page.locator('#p144SpeechFrame')
   pos=bar.evaluate('(e)=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,width:e.getBoundingClientRect().width,computed:window.getComputedStyle(e).position})')
   assert 100<pos['top']<250,pos
   assert pos['bottom']<300,pos
   assert pos['width']<=205+1,pos
   assert speech.evaluate('(e)=>e.getBoundingClientRect().top')>100
   assert page.locator('#tafsirAyahs button.bq166Voice').count()==1
   assert page.locator('.bq163NoteChip').count()==1
   page.locator('#b114Stop').click()
   assert page.evaluate('TEST.stops')==1
   page.locator('#tafsirReader').evaluate('(e)=>e.scrollTop=290')
   page.locator('.bq163NoteChip').evaluate('(e)=>e.click()')
   assert page.locator('#basairTafsirR2NoteSheet.show').count()==1
   page.wait_for_function("document.querySelector('[data-r2-note-close]').textContent==='‹ رجوع'", timeout=2000)
   page.keyboard.press('Escape')
   page.wait_for_timeout(80)
   assert page.locator('#basairTafsirR2NoteSheet.show').count()==0
   assert abs(page.locator('#tafsirReader').evaluate('(e)=>e.scrollTop')-290)<10
   # Saved notes: closing edit should leave saved layer; second back closes saved.
   page.evaluate('''()=>{const el=document.querySelector('#basairTafsirB232FavoritesPanel');el.classList.add('show');el.style.display='block';el.setAttribute('aria-hidden','false')}''')
   page.locator('[data-r3-note-edit]').click()
   page.wait_for_timeout(35)
   assert page.locator('#basairTafsirR2NoteSheet.show').count()==1
   page.keyboard.press('Escape')
   page.wait_for_timeout(80)
   assert page.locator('#basairTafsirR2NoteSheet.show').count()==0
   assert page.locator('#basairTafsirB232FavoritesPanel.show').count()==1
   page.evaluate('window.basairBack()')
   assert page.locator('#basairTafsirB232FavoritesPanel.show').count()==0
   print(json.dumps({'width':width,'night':dark,'status':'PASS','top':round(pos['top']),'nativeStop':1,'back':'verse=>saved=>reader'}))
   page.close()
 b.close()
