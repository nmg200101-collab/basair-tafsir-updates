"""P178 source/QA-050 contract against official V695 APK; no private keys."""
from pathlib import Path
import os
import zipfile
ROOT=Path(__file__).resolve().parents[1]
APK=Path(os.environ.get('BASAIR_V695_APK','/mnt/data/basair-v695-owner-signed.apk'))
if not APK.is_file(): raise SystemExit('V695 APK required locally: set BASAIR_V695_APK (never commit APK or private keys)')
js=(ROOT/'modules/p178-salman-selected-follow.js').read_text()
css=(ROOT/'modules/p178-salman-selected-follow.css').read_text()
with zipfile.ZipFile(APK) as z:
    native=z.read('assets/www/tilawa-r109-selected.js').decode()
    follow=z.read('assets/www/p89-follow.js').decode()
    seq=z.read('assets/www/index.html').decode()
    ota=z.read('assets/www/p121/universal-updates.js').decode()
checks={
    'R109 native reciter hook': "w.__BASAIR_R109_SELECTED__" in js and "r.reciter=function(id)" in js and "__BASAIR_R109_SELECTED__" in native,
    'R109 native non-modified': 'BASAIR_SELECTED_AUDIO_R109' in native and 'BASAIR_SELECTED_AUDIO_R109' not in js,
    'P89 follow route': "follow.resume('audio')" in js and 'openSelectedRecitations(pos,ticket)' in follow,
    'No fake ayah synchronization': 'V170_RECITERS[' not in js and 'V170_RECITERS' in seq and 'everyayah.com' in seq,
    'Protected owner approval': "'tilawa'" in ota and 'ownerApproval' in ota and 'Ed25519' in ota,
    'No secrets or embedded MP3': 'BEGIN PRIVATE KEY' not in js and 'OWNER_PASSWORD' not in js and len(list(ROOT.rglob('*.mp3')))==0,
    'External streaming credit': 'https://media.way2quran.com' in js and 'https://way2quran.com/ar/' in js,
    'No auto play on open': 'function showReader' in js and 'audio.play()' in js and '.play()' not in js.split('function showReader(n)')[1].split('function playSurah(n,offset)')[0],
    'No reader text override': '#tafsirReader' not in css and '#mushafPage' not in css,
}
for name,passed in checks.items():
 print(('PASS' if passed else 'FAIL'),name)
assert all(checks.values()),'P178 source contract failed'
print('P178 source contract',len(checks),'/',len(checks),'PASS')
