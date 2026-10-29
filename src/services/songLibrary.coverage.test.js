import * as XLSX from 'xlsx';
import { loadSongLibrary, mergePreferredImages, normalizeLyricText } from './songLibrary';

jest.mock('./data/localSongSources', () => ({ LOCAL_SONG_SOURCES: [] }));

function responseFor(workbook) {
  const data = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return {
    ok: true,
    headers: { get: () => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    arrayBuffer: async () => data,
  };
}

function workbookWith(sheetName, rows) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), sheetName);
  return workbook;
}

test('normalizes arrays, non-string values, and placeholder lyrics', () => {
  expect(normalizeLyricText([' first ', '', 'second'])).toBe('first\nsecond');
  expect(normalizeLyricText(42)).toBe('');
  expect(normalizeLyricText('   ')).toBe('');
});

test('prefers matching local images, falls back by ID, and marks missing images', () => {
  const remote = [
    { id: 'H1', sourceCollectionKey: 'hosanna', image: '' },
    { id: 'H2', sourceCollectionKey: 'free', image: '' },
    { id: 'H3', sourceCollectionKey: 'tcx', image: 'https://remote.example/page.png' },
    { id: 'H4', sourceCollectionKey: 'tvchh', image: '' },
  ];
  const local = [
    { id: 'H1', sourceCollectionKey: 'hosanna', image: 'local-match' },
    { id: 'H2', sourceCollectionKey: 'hosanna', image: 'id-fallback' },
    { id: 'H3', sourceCollectionKey: 'tcx', image: '' },
  ];
  expect(mergePreferredImages(remote, local).map((song) => song.image)).toEqual([
    'local-match', 'id-fallback', 'https://remote.example/page.png', expect.any(String),
  ]);
});

test('loads rows from the ALL_SONGS fallback sheet', async () => {
  const originalFetch = global.fetch;
  const workbook = workbookWith('ALL_SONGS', [
    { id: 'H18', songName: 'Song', sourceCollectionKey: 'hosanna', lyric: '[D]Praise', image: 'https://example.com/page.png' },
  ]);
  global.fetch = jest.fn().mockResolvedValue(responseFor(workbook));
  localStorage.clear();
  try {
    const result = await loadSongLibrary();
    expect(result.source).toBe('remote');
    expect(result.songs[0]).toMatchObject({ id: 'H18', songName: 'Song', sourceCollectionKey: 'hosanna' });
  } finally {
    global.fetch = originalFetch;
  }
});

test('falls back cleanly when the workbook fetch fails or contains no usable songs', async () => {
  const originalFetch = global.fetch;
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, headers: { get: () => '' } });
  try {
    expect(await loadSongLibrary()).toMatchObject({ source: 'fallback', songs: [], error: expect.stringContaining('403') });
    global.fetch = jest.fn().mockResolvedValue(responseFor(workbookWith('OTHER', [{ id: 'H1', songName: 'Unknown' }])));
    expect(await loadSongLibrary()).toMatchObject({ source: 'fallback', songs: [], error: expect.stringContaining('no songs') });
  } finally {
    global.fetch = originalFetch;
  }
});

test('rejects an HTML workbook response and normalizes Google Sheets workbook URLs', async () => {
  const originalFetch = global.fetch;
  const workbook = workbookWith('TVCHH', [{ id: 'T1', songName: 'Sheet song' }]);
  global.fetch = jest.fn().mockResolvedValue({
    ...responseFor(workbook),
    headers: { get: () => 'text/html' },
  });
  window.history.replaceState({}, '', '/?workbookUrl=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2Fbook-id%2Fedit%3Fgid%3D4');
  localStorage.clear();
  try {
    const result = await loadSongLibrary();
    expect(result.source).toBe('fallback');
    expect(result.error).toContain('HTML');
    expect(global.fetch).toHaveBeenCalledWith('https://docs.google.com/spreadsheets/d/book-id/export?format=xlsx&gid=4');
    expect(localStorage.getItem('song-collections-workbook-url')).toContain('docs.google.com');
  } finally {
    global.fetch = originalFetch;
    window.history.replaceState({}, '', '/');
  }
});
