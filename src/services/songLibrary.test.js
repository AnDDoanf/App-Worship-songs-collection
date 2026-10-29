import * as XLSX from 'xlsx';
import { loadSongLibrary, normalizeLyricText } from './songLibrary';

jest.mock('./data/localSongSources', () => ({ LOCAL_SONG_SOURCES: [] }));

describe('normalizeLyricText', () => {
  test('cleans legacy chord brackets and HTML line breaks without inventing empty lyrics', () => {
    expect(normalizeLyricText('[[C]Ca ngợi<br>[[Am]Chúa')).toBe('[C]Ca ngợi\n[Am]Chúa');
    expect(normalizeLyricText('[]')).toBe('');
  });
  test('preserves chord brackets in plain lyric strings', () => {
    expect(normalizeLyricText('[G] [C]Tôn [D]vinh Chiên [G]Con')).toBe(
      '[G] [C]Tôn [D]vinh Chiên [G]Con'
    );
  });

  test('parses serialized lyric arrays from workbook cells', () => {
    expect(normalizeLyricText("['[G]Line one', '[C]Line two']")).toBe('[G]Line one\n[C]Line two');
  });
});

test('preserves workbook tempo aliases and does not substitute time signature for missing tempo', async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
    { id: 'T1', songName: 'One', tempo: '92' },
    { id: 'T2', songName: 'Two', bpm: '104' },
    { id: 'T3', songName: 'Three', tempo: 'Không rõ', BPM: '118' },
    { id: 'T4', songName: 'Four', timeSignature: '4/4' },
  ]), 'TVCHH');
  const data = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const originalFetch = global.fetch;
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true,
    headers: { get: () => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    arrayBuffer: async () => data });
  try {
    const result = await loadSongLibrary();
    expect(result.source).toBe('remote');
    expect(result.songs.map((song) => song.tempo)).toEqual(['92', '104', '118', 'Không rõ']);
  } finally {
    global.fetch = originalFetch;
  }
});
