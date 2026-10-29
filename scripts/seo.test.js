const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { generate, normalizeLyric, loadSongs } = require('./generate-seo');

test('generates complete crawl paths, escaped lyrics, valid metadata, and resolvable image links', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'song-seo-'));
  try {
    fs.writeFileSync(path.join(dir, 'index.html'), '<html><head></head><body><div id="root"></div></body></html>');
    const songs = Array.from({ length: 101 }, (_, index) => ({
      id: `T${index + 1}`, songName: `Bài hát ${index + 1} & <test>`, sourceCollectionKey: 'tvchh',
      lyric: "['[C]Lời một', 'Lời hai<br><script>alert(1)</script>']", composer: 'Không rõ', image: 'T1_page0',
    }));
    const result = generate({ songs, outputDir: dir, baseUrl: 'https://example.com/app/',
      assets: { 'static/media/T1_page0.jpg': '/app/static/media/T1_page0.hash.jpg' } });
    assert.equal(result.songs, 101);
    const dom = new JSDOM(fs.readFileSync(path.join(dir, 'songs/T1/index.html'), 'utf8'));
    const doc = dom.window.document;
    assert.equal(doc.documentElement.lang, 'vi');
    assert.equal(doc.querySelector('h1').textContent, songs[0].songName);
    assert.equal(doc.querySelector('link[rel="canonical"]').href, 'https://example.com/app/songs/T1/');
    assert.equal(doc.querySelector('img').src, 'https://example.com/app/static/media/T1_page0.hash.jpg');
    assert.ok(doc.querySelector('.lyrics').textContent.includes('[C]Lời một\nLời hai\n<script>'));
    assert.equal(doc.querySelectorAll('script').length, 1);
    const data = JSON.parse(doc.querySelector('script').textContent);
    assert.ok(!data['@graph'][0].composer);
    assert.ok(data['@graph'][0].lyrics.text.includes('Lời một'));
    const secondPage = fs.readFileSync(path.join(dir, 'collections/tvchh/page/2/index.html'), 'utf8');
    assert.ok(secondPage.includes('/app/songs/T101/'));
    assert.ok(secondPage.includes('href="/app/collections/tvchh/"'));
    const sitemap = fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8');
    const xml = new JSDOM(sitemap, { contentType: 'text/xml' }).window.document;
    assert.equal(xml.querySelectorAll('url').length, result.urls);
    for (const node of xml.querySelectorAll('loc')) {
      const relative = new URL(node.textContent).pathname.slice('/app/'.length);
      assert.ok(fs.existsSync(path.join(dir, relative, 'index.html')), relative);
    }
    assert.ok(fs.readFileSync(path.join(dir, 'index.html'), 'utf8').includes('/app/collections/tvchh/'));
    assert.ok(fs.readFileSync(path.join(dir, 'robots.txt'), 'utf8').includes('Sitemap: https://example.com/app/sitemap.xml'));
    const before = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    generate({ songs, outputDir: dir, baseUrl: 'https://example.com/app/' });
    assert.equal(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), before);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('rejects duplicate IDs and invalid path components', () => {
  const song = { id: 'T1', songName: 'Test', sourceCollectionKey: 'tvchh' };
  assert.throws(() => generate({ songs: [song, song], baseUrl: 'https://example.com/', outputDir: os.tmpdir() }), /Duplicate song ID/);
  assert.throws(() => generate({ songs: [{ ...song, id: '../escape' }], baseUrl: 'https://example.com/', outputDir: os.tmpdir() }), /Invalid song/);
});

test('normalizes both chorded lyrics and serialized arrays without dropping chords', () => {
  assert.equal(normalizeLyric('[C]Hello [Am]'), '[C]Hello [Am]');
  assert.equal(normalizeLyric("['[[C]Hello', 'World<br>Again']"), '[C]Hello\nWorld\nAgain');
  assert.equal(normalizeLyric('Không rõ'), '');
});

test('workbook failure falls back locally, while strict mode fails the build', async () => {
  const originalFetch = global.fetch;
  const originalStrict = process.env.SEO_REQUIRE_REMOTE;
  const originalOffline = process.env.SEO_OFFLINE;
  const originalWarn = console.warn;
  try {
    delete process.env.SEO_OFFLINE;
    delete process.env.SEO_REQUIRE_REMOTE;
    console.warn = () => {};
    global.fetch = async () => { throw new Error('Workbook offline'); };
    const fallback = await loadSongs();
    assert.equal(fallback.source, 'local fallback');
    assert.ok(fallback.songs.some((song) => song.id === 'T1'));
    process.env.SEO_REQUIRE_REMOTE = 'true';
    await assert.rejects(loadSongs(), /Workbook offline/);
  } finally {
    global.fetch = originalFetch;
    console.warn = originalWarn;
    if (originalStrict === undefined) delete process.env.SEO_REQUIRE_REMOTE;
    else process.env.SEO_REQUIRE_REMOTE = originalStrict;
    if (originalOffline === undefined) delete process.env.SEO_OFFLINE;
    else process.env.SEO_OFFLINE = originalOffline;
  }
});
