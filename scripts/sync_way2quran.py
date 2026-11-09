"""Sync public Way2Quran reciter directory into a read-only attributed index.

This reads ONLY public /ar/reciters pages (not the site's /api/ routes).
If the site changes, fails or blocks extraction, do NOT replace the last good catalog.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

SOURCE = 'https://way2quran.com/ar/reciters'
ALLOWED_PATH = re.compile(r'^/ar/reciters/([a-z0-9-]+)(?:/[^?#]*)?$')
ARABIC_WORD = re.compile(r'[\u0621-\u064a]')


def normalize_link(link: str):
    from urllib.parse import urljoin
    u = urlparse(urljoin(SOURCE, link))
    if u.scheme != 'https' or u.hostname != 'way2quran.com':
        return None
    m = ALLOWED_PATH.fullmatch(u.path.rstrip('/'))
    if not m:
        return None
    slug = m.group(1)
    # Canonicalize any /recitation subpath to ONE stable record per reciter.
    return f'https://way2quran.com/ar/reciters/{slug}', slug


def choose_name(text: str, alt: str, slug: str) -> str:
    """Name from the visible card only; no guessed names."""
    choices = [alt, *re.split(r'[\n\r]+', text or '')]
    for choice in choices:
        choice = re.sub(r'\s+', ' ', choice).strip()
        if not ARABIC_WORD.search(choice):
            continue
        # Remove English transliteration and view-count suffixes.
        choice = re.split(r'(?=[A-Za-z]{2})|(?:مختار|[\U0001f1e6-\U0001f1ff])', choice)[0].strip(' .،·-')
        if 3 <= len(choice) <= 75 and ARABIC_WORD.search(choice):
            return choice
    return ''


def sync(output: Path, max_pages: int = 70, min_records: int = 1000, *, url: str = SOURCE):
    from playwright.sync_api import sync_playwright

    records = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = browser.new_page(locale='ar-SA', viewport={'width': 1250, 'height': 900})
        page.goto(url, wait_until='domcontentloaded', timeout=45000)
        page.wait_for_timeout(1000)
        previous = None
        for page_number in range(1, max_pages + 1):
            # Read only the public directory links presented to ordinary visitors.
            data = page.locator('a[href*="/reciters/"]').evaluate_all('''nodes => nodes.map(a => ({
              url: a.href, text: a.innerText || '',
              alt: a.querySelector('img')?.alt || '',
              country: a.querySelector('[data-country]')?.textContent || ''
            }))''')
            discovered = 0
            for row in data:
                url_data = normalize_link(row['url'])
                if not url_data:
                    continue
                href, slug = url_data
                name = choose_name(row['text'], row['alt'], slug)
                if not name:
                    continue
                if slug not in records:
                    records[slug] = {
                        'name': name, 'url': href, 'slug': slug,
                        'source': 'الطريق إلى القرآن',
                    }
                    discovered += 1
            print(f'public directory page {page_number}: {len(data)} anchors, {discovered} new readers; total {len(records)}', flush=True)
            # Cursor-pagination buttons vary between Arabic and English layouts.
            nxt = page.get_by_role('button', name='›', exact=True)
            if nxt.count() == 0:
                nxt = page.locator('button[aria-label*="التالي"],button[aria-label*="Next"]')
            if nxt.count() == 0 or not nxt.first.is_enabled():
                break
            fingerprint = [d['url'] for d in data][:5]
            try:
                nxt.first.click(timeout=6000)
                page.wait_for_function('''before => {
                    const a=[...document.querySelectorAll('a[href*="/reciters/"]')].slice(0,5).map(e=>e.href);
                    return a.length && JSON.stringify(a)!==JSON.stringify(before);
                }''', arg=fingerprint, timeout=12000)
                page.wait_for_timeout(350)
            except Exception as exc:
                print(f'Pagination ended at {page_number}: {type(exc).__name__}', flush=True)
                break
        browser.close()

    if len(records) < min_records:
        raise RuntimeError(f'Incomplete catalog: only {len(records)} records; keep previous catalog unchanged')
    # All visible names/URLs are from the site's public directory; no guessing.
    payload = {
        'schema': 1,
        'source': SOURCE,
        'source_title': 'الطريق إلى القرآن',
        'synced_at': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
        'count': len(records),
        'readers': sorted(records.values(), key=lambda r: r['name']),
        'note': 'تزامن دوري من صفحات الفهرس العامة. يُستمع إلى التسجيلات من المصدر الأصلي.',
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    tmp = output.with_suffix(output.suffix + '.tmp')
    tmp.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    tmp.replace(output)
    print('Validated complete catalog:', len(records), 'at', output)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--output', default='p92/owner-qa-001/way2quran-readers.json')
    ap.add_argument('--min-records', type=int, default=1000)
    ap.add_argument('--max-pages', type=int, default=70)
    args = ap.parse_args()
    sync(Path(args.output), args.max_pages, args.min_records)
