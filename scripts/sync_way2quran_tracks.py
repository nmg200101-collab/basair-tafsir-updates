"""Read *public* Way2Quran reciter profile pages and extract MP3 links.

Never calls /api/ paths, guesses a URL, proxies audio, or downloads audio files.
Writes only referenced https://media.way2quran.com/*.mp3 URLs and source labels.
This is a best-effort metadata cache for Basair's in-app player.
"""
from __future__ import annotations
import argparse, concurrent.futures, datetime as dt, json, re, time
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
import requests
from bs4 import BeautifulSoup

ORIGIN = 'https://way2quran.com'
MEDIA = {'media.way2quran.com'}
SURAH = re.compile(r'^(?:0*([1-9]|[1-9]\d|1[01]\d|11[0-4]))\.mp3$', re.I)
HEADERS = {'User-Agent': 'BasairQuran-Directory-Metadata/1.0 (+public links only; no audio downloads)'}

def url_ok(value: str):
    try:
        u=urlparse(value)
        return u.scheme=='https' and u.hostname in MEDIA and u.path.lower().endswith('.mp3') and not u.username and not u.password
    except Exception:
        return False

def extract(html: str):
    soup=BeautifulSoup(html, 'html.parser')
    groups={}
    for a in soup.find_all('a', href=True):
        url=urljoin(ORIGIN, a['href'])
        if not url_ok(url):continue
        u=urlparse(url); parts=[unquote(x) for x in u.path.split('/') if x]
        if len(parts)<3:continue
        recitation=parts[-2];nmatch=SURAH.fullmatch(parts[-1]);n=int(nmatch.group(1)) if nmatch else None
        if n is None:continue  # numbered surah files only; no guessed labels
        edition=recitation.replace('-',' ')
        groups.setdefault(edition,{})[n]={'n':n,'url':url}
    return [{'edition':name,'tracks':[v for _,v in sorted(files.items())]}
            for name,files in sorted(groups.items())]

def fetch_one(r, timeout=22):
    url=r.get('url','')
    u=urlparse(url)
    if u.scheme!='https' or u.hostname!='way2quran.com' or not u.path.startswith('/ar/reciters/'):
        return None,'invalid-reciter-url'
    try:
        resp=requests.get(url,headers=HEADERS,timeout=timeout,allow_redirects=True)
        if resp.status_code!=200 or urlparse(resp.url).hostname!='way2quran.com':
            return None, f'http:{resp.status_code}'
        groups=extract(resp.text)
        if not groups:return None,'no-numbered-audio-links'
        return {'slug':r['slug'],'name':r['name'],'page':url,'recitations':groups},None
    except requests.RequestException as e:
        return None,type(e).__name__

def write_shards(src:Path,out_dir:Path,max_readers:int=0,workers:int=3):
    catalog=json.loads(src.read_text(encoding='utf-8'))
    readers=catalog['readers']
    if max_readers:
        priority={'muhammad-hussein-amer','islam-sobhi','abdul-rahman-musaad'}
        readers=([r for r in readers if r['slug'] in priority]
                +[r for r in readers if r['slug'] not in priority])[:max_readers]
    data={};failures={};time0=time.monotonic()
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures={pool.submit(fetch_one,rec):rec for rec in readers}
        for idx,f in enumerate(concurrent.futures.as_completed(futures),1):
            rec=futures[f]
            try:got,err=f.result()
            except Exception as e:got,err=None,type(e).__name__
            if got:data[got['slug']]=got
            else:failures[rec['slug']]=err
            if idx%25==0 or idx==len(readers):
                print(f'public profiles {idx}/{len(readers)} with tracks {len(data)} failed {len(failures)} time={time.monotonic()-time0:.1f}s',flush=True)
    out_dir.mkdir(parents=True,exist_ok=True)
    shards=[{} for _ in range(32)]
    for slug,entry in data.items():
        shard=sum(map(ord,slug))%32
        shards[shard][slug]=entry
    for idx,content in enumerate(shards):
        target=out_dir/f'part-{idx:02d}.json'
        target.write_text(json.dumps({'schema':1,'source':ORIGIN+'/ar/reciters',
             'readers':content},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    report={'scanned':len(readers),'with_tracks':len(data),'total_audio_links':sum(len(e['tracks']) for v in data.values() for e in v['recitations']),
            'failures':failures,'synced_at':dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')}
    (out_dir/'sync-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('TOTAL',json.dumps({k:v for k,v in report.items() if k!='failures'}),flush=True)
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--catalog',default='p92/owner-qa-001/way2quran-readers.json')
    parser.add_argument('--output',default='p92/owner-qa-001/way2quran-tracks')
    parser.add_argument('--max-readers',type=int,default=0)
    parser.add_argument('--workers',type=int,default=3)
    args=parser.parse_args()
    report=write_shards(Path(args.catalog),Path(args.output),args.max_readers,args.workers)
    if report['with_tracks']<(1000 if not args.max_readers else 1):raise SystemExit('INCOMPLETE VERIFIED AUDIO DIRECTORY: keep last good data')