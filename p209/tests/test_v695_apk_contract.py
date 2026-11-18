"""Read-only contract audit against the exact owner-supplied V695 APK.
No signing, no APK modification, no cloud calls.
Usage: python tests/test_v695_apk_contract.py /path/to/basair-v695-owner-signed.apk
"""
from io import BytesIO
from pathlib import Path
import re,sys,zipfile
from PIL import Image
ROOT=Path(__file__).parents[1]
APK=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/mnt/data/basair-v695-owner-signed.apk')
checks=[]
def ck(v,name):
 assert v,name
 checks.append(name)
ck(APK.exists(),'Official V695 APK available for independent local contract audit')
with zipfile.ZipFile(APK) as z:
 read=lambda name:z.read('assets/www/'+name)
 b345=read('tilawa-arkani-nav-header-final-lock-b255.js').decode()
 r33=read('print-follow-100-r33.js').decode()
 index=read('index.html').decode()
 img=Image.open(BytesIO(read('assets/tajweed-pages/tajweed-004.webp')))
 ck(img.size==(720,1280),'Authentic local Tajwid page has the approved 720x1280 size')
 ck('__BASAIR_B345_SEQUENCE__ = controller' in b345,'B345 native controller exported')
 ck('retargetPrintAyah: retargetPrintAyah' in b345,'B345 page/ayah retarget API is exposed')
 ck('userEnd: markUserScrollEnd' in b345,'B345 native userEnd is exposed for tap release')
 ck("state.userScrolling = true" in b345 and 'state.manualHoldUntil = Infinity' in b345,'Native manual-scroll hold requires explicit pointerup release')
 ck("['touchend', 'pointerup'].forEach(function (type)" in b345 and "w.addEventListener(type, markUserScrollEnd" in b345,'Native B345 captures pointerup to release manual hold')
 ck('data-b345-ready' in b345,'Native printed page readiness flag exists')
 ck('data-b345-sequence-surface' in b345,'Native visible surface ownership flag exists')
 ck('normalProgressFromView: normalProgressFromView' in b345,'Native scroll progress function is exposed')
 ck('printStaticHeld' in b345,'Native STOP may require R39 static thaw')
 ck('__BASAIR_PRINT_FOLLOW_100__=' in r33,'R33 original print Follow controller exported')
 ck('restoreAfterStop:restoreAfterStop' in r33,'R33 STOP-to-static restore API exists')
 ck('frozenActive:frozenActive' in r33,'R33 frozen print state API exists')
 ck('className=\'b345ExactPage r33PrintShell\'' in r33,'R33 creates original printed page shells')
 ck('tilawa-arkani-nav-header-final-lock-b255.js' in index,'V695 index loads native B345')
 ck('print-follow-100-r33.js' in index,'V695 index loads R33 print source')
code=(ROOT/'src/p209-one-visual-surface.js').read_text()
ck("var FLAG='__BASAIR_P209_FIELD_QA_ENABLED__'" in code,'P209 remains opt-in only')
ck('userEnd' in code and 'state.userScrolling===true' in code,'P209 protects native gesture release before suppressing R33')
ck('pg!==stats.page' in code,'P209 will not display a stale page after unbuffered jump')
ck('nativeGestureEndErrors' in code,'P209 tracks gesture release failure')
ck(not re.search(r'(?<![A-Za-z0-9_.])(?:s|state)\.progress\s*=',code) and 'mushafReader.scrollTop=' not in code,'P209 does not directly mutate B345 scroll/progress')
print('Official V695 APK/P209 contract: PASS',len(checks))
for i,item in enumerate(checks,1):print(f'{i:02d}. {item}')
