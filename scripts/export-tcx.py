"""Build the TCX CSV from chord pages matched to the supplied local sheets.

Resume-safe: successful page extractions are cached, failures are retried next run.
Requires requests, beautifulsoup4. Does not modify the application song data.
"""
import argparse
import csv
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'exports'
CACHE = OUT / 'tcx-source-cache'
BASE = 'https://thanhca.httlvn.org'
UNKNOWN = 'Không rõ'
HEADERS = ['id', 'songName', 'tone', 'timeSignature', 'category', 'lyricist', 'composer', 'collection', 'audio', 'lyric', 'image', 'sourceCollectionKey']


def get_page(url):
    for attempt in range(3):
        try:
            response = requests.get(url, timeout=(15, 45))
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser'), response.url
        except requests.RequestException:
            if attempt == 2:
                raise
            time.sleep(2 ** (attempt + 1))


def local_images():
    songs = {}
    for path in (ROOT / 'src/assets/images/sheets').glob('TCX*/*.jpg'):
        match = re.fullmatch(r'TCX(\d+)_page(\d+)', path.stem)
        if match:
            songs.setdefault(int(match[1]), []).append((int(match[2]), path))
    return {number: [p for _, p in sorted(pages)] for number, pages in songs.items()}


def extract_lyric(element):
    if element is None:
        return ''
    # Replace structural breaks only; get_text(' ') would split hyphenated words.
    for br in element.find_all('br'):
        br.replace_with('\n')
    for paragraph in element.find_all(['p', 'div']):
        paragraph.insert_after('\n')
    lines = []
    for line in element.get_text().splitlines():
        line = re.sub(r'[\t \xa0]+', ' ', line).strip()
        if re.fullmatch(r'B\d+L', line):
            continue
        line = re.sub(r'\(Lặp lại\)', '', line, flags=re.I).strip()
        if line:
            lines.append(line)
    return '\n'.join(lines)


def finalize_result(result):
    row = result['row']
    # Some pages render escaped <b> headings as text rather than HTML nodes.
    if re.search(r'</?(?:b|p|br|div|i|span)\b', row['lyric'], re.I):
        fragment = BeautifulSoup(row['lyric'], 'html.parser')
        row['lyric'] = extract_lyric(fragment)
    if row['tone'] == UNKNOWN:
        result['notes'].append('Key label missing or malformed on the website; left unknown.')
    result['notes'] = list(dict.fromkeys(result['notes']))
    return result


def fetch_song(number, images, audio_ids):
    path = CACHE / f'TCX{number:03}.json'
    if path.exists():
        return json.loads(path.read_text(encoding='utf-8'))
    soup, url = get_page(f'{BASE}/thanh-ca-{number:03}?op=chords')
    title = soup.select_one('h1')
    if title is None:
        raise ValueError('Missing song title')
    number_text = title.select_one('small')
    if number_text:
        match = re.search(r'Thánh Ca\s+(\d+)', number_text.get_text(' ', strip=True), re.I)
        if not match or int(match[1]) != number:
            raise ValueError('Song number mismatch / redirect')
    credit_row = title.parent.find_previous_sibling('div')
    composer = credit_row.select_one('.text-left') if credit_row else None
    lyricist = credit_row.select_one('.text-right') if credit_row else None
    if number_text:
        number_text.decompose()
    song_name = title.get_text(' ', strip=True)
    categories = [a.get_text(' ', strip=True) for a in soup.select('ol.breadcrumb a') if 'cat_' in a.get('href', '')]
    tone_node = soup.select_one('.control-chord-display .chord')
    tone = tone_node.get_text(strip=True).strip('[]') if tone_node else ''
    if not re.fullmatch(r'[A-G](?:#|b)?m?', tone):
        tone = UNKNOWN
    lyric_node = soup.select_one('#lyric-content')
    notes = []
    if lyric_node and re.search(r'\bB\d+L\b', lyric_node.get_text()):
        notes.append('Website contains an internal B-number-L marker; removed. Check for missing verses.')
    # Only reproduce song texts for which the user supplied a local sheet.
    lyric = extract_lyric(lyric_node) if images else ''
    if not images:
        notes.append('No local sheet image supplied; lyric left blank.')
    elif len(re.sub(r'\[[^]]*\]', '', lyric).split()) < 25:
        notes.append('Very short lyric on chord page; may be incomplete.')
    if lyric and not re.search(r'\[[A-G]', lyric):
        notes.append('No bracketed chords on source page.')
    if lyric.count('[') != lyric.count(']'):
        notes.append('Unbalanced chord brackets in source text.')
    audio = UNKNOWN
    if number in audio_ids:
        audio_page, audio_url = get_page(f'{BASE}/thanh-ca-{number:03}?op=mp3')
        media = audio_page.select_one('audio source[src], audio[src]')
        if media:
            audio = urljoin(audio_url, media['src'].replace('\\', '/'))
        else:
            notes.append('Listed in audio index, but no audio source found.')
    row = dict(zip(HEADERS, [
        f'TCX{number:03}', song_name, tone, UNKNOWN, ': '.join(categories) or UNKNOWN,
        lyricist.get_text(' ', strip=True) if lyricist else UNKNOWN,
        composer.get_text(' ', strip=True) if composer else UNKNOWN,
        'Thánh Ca Xanh', audio, lyric, ','.join(p.stem for p in images), 'tcx',
    ]))
    for field in ['lyricist', 'composer']:
        row[field] = row[field] or UNKNOWN
    result = {'row': row, 'source': url, 'notes': notes}
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    time.sleep(0.15)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=903)
    args = parser.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    images = local_images()
    audio_page, _ = get_page(f'{BASE}/thanh-ca-903?op=mp3')
    audio_ids = {int(m[1]) for a in audio_page.select('.list-group a[href]')
                 if (m := re.search(r'/thanh-ca-(\d+)', a['href']))}
    results, failures = {}, {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        tasks = {pool.submit(fetch_song, n, images.get(n, []), audio_ids): n for n in range(1, args.limit + 1)}
        for future in as_completed(tasks):
            number = tasks[future]
            try:
                results[number] = future.result()
            except Exception as error:
                failures[number] = str(error)
            done = len(results) + len(failures)
            if done % 25 == 0 or done == args.limit:
                print(f'{done}/{args.limit}: {len(results)} saved, {len(failures)} failed', flush=True)
    results = {n: finalize_result(result) for n, result in results.items()}
    rows = [results[n]['row'] for n in sorted(results)]
    with (OUT / 'tcx-001-903.csv').open('w', newline='', encoding='utf-8-sig') as handle:
        writer = csv.DictWriter(handle, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(rows)
    report = {
        'song_count': len(rows), 'failures': failures,
        'method': 'Chord-page text with real line breaks; metadata as credited on website; image stems matched to local sheets. Time signature is unknown because it is not specified on the chord pages. Audio URLs extracted from audio pages, not playback-tested. Lyrics have not been fully proofread against all scans.',
        'songs': [{'id': result['row']['id'], 'source': result['source'], 'notes': result['notes']} for _, result in sorted(results.items())],
    }
    (OUT / 'tcx-001-903-review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    summary = ['# TCX export review', '', report['method'], '',
               f'Songs: {len(rows)}. Source pages: https://thanhca.httlvn.org/thanh-ca-001?op=chords through song 903.', '',
               '| Song | Review note | Source |', '| --- | --- | --- |']
    for song in report['songs']:
        if song['notes']:
            summary.append(f'| {song["id"]} | {"; ".join(song["notes"])} | [Source]({song["source"]}) |')
    (OUT / 'tcx-001-903-review.md').write_text('\n'.join(summary) + '\n', encoding='utf-8')
    assert len({row['id'] for row in rows}) == len(rows)
    with (OUT / 'tcx-001-903.csv').open(encoding='utf-8-sig', newline='') as handle:
        assert list(csv.DictReader(handle)) == rows
    print(f'CSV validated: {len(rows)} rows. Review notes: {sum(bool(r["notes"]) for r in results.values())}.', flush=True)
    if failures:
        raise SystemExit('Some pages failed; rerun to retry using cached successes.')


if __name__ == '__main__':
    main()
