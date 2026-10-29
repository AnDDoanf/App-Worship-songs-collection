const fs = require('node:fs');
const path = require('node:path');
const XLSX = require('xlsx');

const ROOT = path.resolve(__dirname, '..');
const SITE_NAME = 'Thánh Ca Hội Thánh';
const SITE_TITLE = `${SITE_NAME} — Lời bài hát, hợp âm và bản nhạc`;
const DESCRIPTION = 'Tra cứu lời bài hát, hợp âm và bản nhạc thánh ca Việt Nam. Tuyển tập Tôn Vinh Chúa Hằng Hữu, Hosanna Việt Nam, Thánh Ca Xanh và bài hát tự do.';
const COLLECTIONS = [
  { key: 'tvchh', label: 'Tôn Vinh Chúa Hằng Hữu', file: 'song-data.json', sheet: 'TVCHH' },
  { key: 'hosanna', label: 'Hosanna Việt Nam', file: 'song2-data.json', sheet: 'HOSANNA' },
  { key: 'free', label: 'Bài hát tự do', file: 'song3-data.json', sheet: 'BAI_HAT_TU_DO' },
  { key: 'tcx', label: 'Thánh Ca Xanh', sheet: 'THANH_CA_XANH' },
];
const PAGE_SIZE = 100;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function chordHtml(lyric) {
  return lyric.split('\n').map((line) => {
    let chord = '';
    const parts = [];
    for (const piece of line.split(/(\[[^\[\]]+\])/g)) {
      if (/^\[[A-G][#b]?(?:(?:maj|min|dim|aug|sus|add|m|M)|[0-9#b(),+/A-G])*\]$/.test(piece)) {
        chord += `${chord ? ' ' : ''}${piece.slice(1, -1)}`;
      } else for (const text of piece.split(/(\s+)/).filter(Boolean)) {
        parts.push(`<span class="chord-word"><span class="chord-symbol">${escapeHtml(chord) || '&#160;'}</span><span>${escapeHtml(text)}</span></span>`);
        chord = '';
      }
    }
    if (chord) parts.push(`<span class="chord-word"><span class="chord-symbol">${escapeHtml(chord)}</span><span>&#160;</span></span>`);
    return `<p class="chord-line">${parts.join('') || '&#160;'}</p>`;
  }).join('');
}

function known(value) {
  const text = String(value || '').trim();
  return text && !/^(Không rõ|KhÃ´ng rÃµ|KhÃƒÂ´ng rÃƒÂµ)$/i.test(text) ? text : '';
}

function normalizeLyric(value) {
  if (Array.isArray(value)) return value.map(String).join('\n');
  let text = known(value);
  if (/^\[\s*['"]/.test(text) && /['"]\s*\]$/.test(text)) {
    text = text.slice(1, -1).split(/',\s*'|",\s*"|',\s*"|",\s*'/)
      .map((line) => line.replace(/^['"]|['"]$/g, '')).join('\n');
  }
  return text.replace(/<br\s*\/?>/gi, '\n').replace(/\r\n?/g, '\n').replace(/\[{2,}/g, '[').trim();
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function loadLocalSongs() {
  const tcxPages = new Map();
  for (const file of walk(path.join(ROOT, 'src/assets/images/sheets'))) {
    const match = path.basename(file).match(/^(TCX\d+)_page(\d+)\.jpg$/i);
    if (!match) continue;
    if (!tcxPages.has(match[1])) tcxPages.set(match[1], []);
    tcxPages.get(match[1])[Number(match[2])] = path.basename(file, '.jpg');
  }
  return COLLECTIONS.flatMap((collection) => {
    const songs = collection.file
      ? JSON.parse(fs.readFileSync(path.join(ROOT, 'src/services/data', collection.file), 'utf8'))
      : [...tcxPages].sort(([a], [b]) => a.localeCompare(b, 'vi', { numeric: true })).map(([id, pages]) => ({
        id, songName: `Thánh Ca Xanh ${id.slice(3)}`, image: pages.filter(Boolean).join(', '),
      }));
    return songs.map((song) => ({ ...song, sourceCollectionKey: collection.key }));
  });
}

async function loadSongs() {
  const local = loadLocalSongs();
  if (process.env.SEO_OFFLINE === 'true') return { songs: local, source: 'local' };
  const config = fs.readFileSync(path.join(ROOT, 'src/services/remoteWorkbook.js'), 'utf8');
  const rawUrl = process.env.REACT_APP_SONG_WORKBOOK_URL || config.match(/https:[^'"\s]+/)?.[0];
  if (!rawUrl) return { songs: local, source: 'local' };
  try {
    const url = new URL(rawUrl);
    const sheets = url.pathname.match(/^\/spreadsheets\/d\/([^/]+)/);
    const drive = url.pathname.match(/^\/file\/d\/([^/]+)/);
    const download = sheets && url.hostname === 'docs.google.com'
      ? `https://docs.google.com/spreadsheets/d/${sheets[1]}/export?format=xlsx${url.searchParams.has('gid') ? `&gid=${encodeURIComponent(url.searchParams.get('gid'))}` : ''}`
      : drive && url.hostname === 'drive.google.com'
        ? `https://drive.google.com/uc?export=download&id=${drive[1]}` : url.href;
    const response = await fetch(download, { signal: AbortSignal.timeout(20000) });
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) throw new Error(`Workbook unavailable (${response.status})`);
    const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array' });
    let songs = COLLECTIONS.flatMap((collection) => workbook.Sheets[collection.sheet]
      ? XLSX.utils.sheet_to_json(workbook.Sheets[collection.sheet], { defval: '', raw: false })
        .map((song) => ({ ...song, sourceCollectionKey: collection.key })) : []);
    if (!songs.length && workbook.Sheets.ALL_SONGS) {
      songs = XLSX.utils.sheet_to_json(workbook.Sheets.ALL_SONGS, { defval: '', raw: false }).map((song) => ({
        ...song,
        sourceCollectionKey: COLLECTIONS.find((collection) => [collection.key, collection.sheet].includes(song.sourceCollectionKey || song.sheetName || song.collectionKey))?.key,
      }));
    }
    songs = songs.filter((song) => song.id && song.songName);
    if (!songs.length) throw new Error('Workbook contains no songs');
    const byId = new Map(local.map((song) => [song.id, song]));
    songs = songs.map((song) => ({ ...song, image: known(byId.get(song.id)?.image) || song.image }));
    return { songs, source: 'remote workbook' };
  } catch (error) {
    if (process.env.SEO_REQUIRE_REMOTE === 'true') throw error;
    console.warn(`SEO: ${error.message}; using the committed local library. Set SEO_REQUIRE_REMOTE=true to fail instead.`);
    return { songs: local, source: 'local fallback' };
  }
}

function generate({ songs, outputDir, baseUrl, assets = {} }) {
  const base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  const url = (relative = '') => new URL(relative, base).href;
  const href = (relative = '') => new URL(relative, base).pathname;
  const songPath = (song) => `songs/${encodeURIComponent(song.id)}/`;
  const urls = [url()];
  const seen = new Set();
  songs = songs.map((song) => ({ ...song, id: String(song.id || '').trim(), songName: String(song.songName || '').trim(), lyric: normalizeLyric(song.lyric) }));
  for (const song of songs) {
    if (!/^[A-Za-z]+\d+[A-Za-z0-9]*$/.test(song.id) || !song.songName) throw new Error(`Invalid song: ${song.id}`);
    if (seen.has(song.id.toUpperCase())) throw new Error(`Duplicate song ID: ${song.id}`);
    seen.add(song.id.toUpperCase());
    if (!COLLECTIONS.some((collection) => collection.key === song.sourceCollectionKey)) throw new Error(`Unknown collection: ${song.id}`);
  }
  const write = (relative, content) => {
    const destination = path.join(outputDir, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content);
  };
  const link = (relative, label) => `<a href="${escapeHtml(href(relative))}">${escapeHtml(label)}</a>`;
  const collectionLinks = COLLECTIONS.map((collection) => link(`collections/${collection.key}/`, collection.label)).join(' · ');
  const document = ({ title, description, relative, body, data }) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(url(relative))}"><link rel="icon" href="${href('favicon.svg')}" type="image/svg+xml">
<meta property="og:type" content="website"><meta property="og:locale" content="vi_VN"><meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(url(relative))}">
<meta property="og:image" content="${url('social-card.png')}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${SITE_TITLE}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${url('social-card.png')}">
<link rel="stylesheet" href="${href('catalogue.css')}"><script type="application/ld+json">${jsonLd(data)}</script></head>
<body><header>${link('', SITE_NAME)}<nav aria-label="Điều hướng">${link('songs/', 'Danh mục thánh ca')} · ${link('', 'Mở ứng dụng')}</nav></header>
<main>${body}</main><footer><nav aria-label="Tuyển tập">${collectionLinks}</nav><p>${link('', 'Tra cứu, đổi tone và trình chiếu trong ứng dụng')}</p></footer></body></html>`;

  for (const song of songs) {
    const collection = COLLECTIONS.find((item) => item.key === song.sourceCollectionKey);
    const relative = songPath(song);
    const description = `${song.songName} (${song.id}) — ${collection.label}. ${song.lyric ? 'Xem lời bài hát, hợp âm và bản nhạc' : 'Xem thông tin và bản nhạc'} tại ${SITE_NAME}.`;
    const images = String(song.image || '').split(',').map((token) => token.trim()).filter(Boolean).flatMap((token) => {
      const imageKey = token.split('/').pop().split(/[?#]/)[0].replace(/\.(png|jpe?g|svg|webp)$/i, '');
      const asset = Object.entries(assets).find(([key]) => path.posix.basename(key).replace(/\.[^.]+$/, '') === imageKey);
      if (asset) return [new URL(asset[1], base).href];
      try {
        const remote = new URL(token);
        if (!['https:', 'http:'].includes(remote.protocol)) return [];
        if (['drive.google.com', 'docs.google.com'].includes(remote.hostname)) {
          const id = remote.searchParams.get('id') || remote.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
          if (id) return [`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w2000`];
        }
        return [remote.href];
      } catch {
        return [];
      }
    });
    const details = [['Tuyển tập', collection.label], ['Chủ đề', known(song.category)], ['Tone', known(song.tone)], ['Nhịp', known(song.timeSignature)], ['Nhạc', known(song.composer)], ['Lời', known(song.lyricist)]]
      .filter(([, value]) => value).map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
    const peers = songs.filter((item) => item.sourceCollectionKey === song.sourceCollectionKey);
    const index = peers.indexOf(song);
    const nearby = peers.slice(Math.max(0, index - 2), index + 3).filter((item) => item !== song);
    const data = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'MusicComposition', '@id': url(relative), name: song.songName, identifier: song.id, url: url(relative), inLanguage: 'vi',
        ...(known(song.composer) ? { composer: { '@type': 'Person', name: known(song.composer) } } : {}),
        ...(song.lyric ? { lyrics: { '@type': 'CreativeWork', text: song.lyric.replace(/\[[^\]]*\]/g, ''), inLanguage: 'vi' } } : {}) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: url() },
        { '@type': 'ListItem', position: 2, name: collection.label, item: url(`collections/${collection.key}/`) },
        { '@type': 'ListItem', position: 3, name: song.songName, item: url(relative) },
      ] },
    ] };
    const body = `<nav aria-label="Đường dẫn">${link('songs/', 'Thánh ca')} / ${link(`collections/${collection.key}/`, collection.label)}</nav>
<article><h1>${escapeHtml(song.songName)}</h1><p class="song-code">${escapeHtml(song.id)}</p><dl>${details}</dl>
<p>${link(`?song=${encodeURIComponent(song.id)}`, 'Mở bài hát trong ứng dụng')}</p>
${song.lyric ? `<section><h2>Lời bài hát và hợp âm</h2><div class="lyrics">${chordHtml(song.lyric)}</div></section>` : '<p>Chưa có lời bài hát dạng văn bản trong dữ liệu hiện tại.</p>'}
${images.length ? `<section><h2>Bản nhạc</h2>${images.map((src, i) => `<figure><a href="${escapeHtml(src)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(song.songName)} (${song.id}) — bản nhạc trang ${i + 1}" loading="${i ? 'lazy' : 'eager'}" decoding="async"></a><figcaption>Trang ${i + 1} — nhấn để xem ảnh đầy đủ</figcaption></figure>`).join('')}</section>` : ''}
</article><aside><h2>Cùng tuyển tập</h2><ul>${nearby.map((item) => `<li>${link(songPath(item), `${item.id}. ${item.songName}`)}</li>`).join('')}</ul>${link(`collections/${collection.key}/`, 'Xem toàn bộ tuyển tập')}</aside>`;
    write(`${relative}index.html`, document({ title: `${song.songName} (${song.id}) — Lời, hợp âm | ${SITE_NAME}`, description, relative, body, data }));
    urls.push(url(relative));
  }

  for (const collection of COLLECTIONS) {
    const entries = songs.filter((song) => song.sourceCollectionKey === collection.key);
    const count = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
    for (let page = 1; page <= count; page += 1) {
      const relative = `collections/${collection.key}/${page === 1 ? '' : `page/${page}/`}`;
      const chunk = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      const title = `${collection.label}${page > 1 ? ` — Trang ${page}` : ''} | ${SITE_NAME}`;
      const pagination = Array.from({ length: count }, (_, i) => i + 1).map((n) => n === page
        ? `<span aria-current="page">Trang ${n}</span>` : link(`collections/${collection.key}/${n === 1 ? '' : `page/${n}/`}`, `Trang ${n}`)).join(' · ');
      const body = `<h1>${escapeHtml(collection.label)}</h1><p>${entries.length} bài hát · Trang ${page}/${count}</p><ul class="catalogue">${chunk.map((song) => `<li>${link(songPath(song), `${song.id}. ${song.songName}`)}</li>`).join('')}</ul><nav aria-label="Phân trang">${pagination}</nav>`;
      write(`${relative}index.html`, document({ title, description: `Danh mục ${collection.label}, trang ${page}: tra cứu tên bài hát, lời, hợp âm và bản nhạc.`, relative, body,
        data: { '@context': 'https://schema.org', '@type': 'ItemList', name: title, itemListElement: chunk.map((song, i) => ({ '@type': 'ListItem', position: (page - 1) * PAGE_SIZE + i + 1, name: song.songName, url: url(songPath(song)) })) } }));
      urls.push(url(relative));
    }
  }
  write('songs/index.html', document({ title: `Danh mục thánh ca — ${SITE_NAME}`, description: DESCRIPTION, relative: 'songs/',
    body: `<h1>Danh mục thánh ca</h1><p>Tra cứu ${songs.length} bài hát theo tuyển tập. Đọc lời, hợp âm và xem bản nhạc mà không cần mở ứng dụng.</p><ul>${COLLECTIONS.map((collection) => `<li>${link(`collections/${collection.key}/`, collection.label)} (${songs.filter((song) => song.sourceCollectionKey === collection.key).length} bài)</li>`).join('')}</ul>`,
    data: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Danh mục thánh ca', url: url('songs/'), inLanguage: 'vi' } }));
  urls.push(url('songs/'));
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((entry) => `<url><loc>${escapeHtml(entry)}</loc></url>`).join('\n')}</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${url('sitemap.xml')}\n`);
  const homepagePath = path.join(outputDir, 'index.html');
  if (fs.existsSync(homepagePath)) {
    let homepage = fs.readFileSync(homepagePath, 'utf8');
    homepage = homepage.replace('<div id="root"></div>', `<div id="root"><main><h1>${SITE_NAME}</h1><p>${DESCRIPTION}</p><nav aria-label="Tuyển tập">${collectionLinks}</nav><p>${link('songs/', 'Danh mục tất cả bài hát')}</p></main></div>`);
    const data = { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: url(), inLanguage: 'vi', description: DESCRIPTION };
    homepage = homepage.replace(/<script id="seo-site" type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    homepage = homepage.replace('</head>', `<script id="seo-site" type="application/ld+json">${jsonLd(data)}</script></head>`);
    fs.writeFileSync(homepagePath, homepage);
  }
  return { songs: songs.length, urls: urls.length };
}

async function main() {
  const { songs, source } = await loadSongs();
  const outputDir = path.join(ROOT, 'build');
  const assets = JSON.parse(fs.readFileSync(path.join(outputDir, 'asset-manifest.json'), 'utf8')).files;
  const result = generate({ songs, outputDir, baseUrl: require('../package.json').homepage, assets });
  console.log(`SEO: generated ${result.songs} song pages and ${result.urls} sitemap URLs from ${source}.`);
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { generate, normalizeLyric, escapeHtml, jsonLd, loadSongs };
