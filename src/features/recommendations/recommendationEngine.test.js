import { createRecommendationIndex, keySimilarity, recommendSongs } from './recommendationEngine';

const seed = { id: 'H1', songName: 'Khúc cảm tạ', category: 'Thờ phượng: Cảm tạ', tone: 'C', timeSignature: '4/4', lyric: '[C]Ca ngợi tình yêu ân điển biết ơn' };
const close = { ...seed, id: 'H2', lyric: '[F#]Ca ngợi tình yêu ân điển biết ơn' };
const related = { ...seed, id: 'H3', tone: 'G', timeSignature: '3/4' };
const unrelated = { id: 'T4', songName: 'Máng cỏ Bết-lê-hem', category: 'Giáng sinh', tone: 'C', timeSignature: '4/4', lyric: 'Đêm đông sao sáng thiên binh loan báo' };

test('finds nearest neighbours without treating chords as lyric content', () => {
  const index = createRecommendationIndex([seed, close, related, unrelated]);
  const results = recommendSongs(index, [seed]);
  expect(results.map((item) => item.song.id)).toEqual(['H2', 'H3']);
  expect(results[0].score).toBeCloseTo(1);
  expect(results[0].reasons).toContain('Cùng tone C');
  expect(results[0].reasons).toContain('Cùng chủ đề');
  expect(results[0].matchedSong.id).toBe('H1');
});

test('understands enharmonic keys, relative minors and the circle of fifths', () => {
  expect(keySimilarity('C#', 'Db')).toBe(1);
  expect(keySimilarity('C', 'Am')).toBe(0.85);
  expect(keySimilarity('C', 'G')).toBeGreaterThan(keySimilarity('C', 'F#'));
  expect(keySimilarity('C', 'Cm')).toBeLessThan(1);
  expect(keySimilarity('Không rõ', 'C')).toBeNull();
});

test('excludes the entire target set and seed regardless of ID case', () => {
  const index = createRecommendationIndex([seed, close, related]);
  expect(recommendSongs(index, [seed], { excludeIds: ['h2'] }).map((item) => item.song.id)).toEqual(['H3']);
  expect(recommendSongs(index, [seed, close], { limit: 1 })[0].song.id).toBe('H3');
});

test('does not invent matches from unknown metadata, generic titles, or key alone', () => {
  const unknown = { id: 'TCX1', songName: 'Thánh Ca Xanh 1', category: 'Không rõ', lyric: 'Không rõ', tone: 'Không rõ', image: 'TCX1_page0' };
  const otherUnknown = { ...unknown, id: 'TCX2', songName: 'Thánh Ca Xanh 2' };
  const index = createRecommendationIndex([seed, unrelated, unknown, otherUnknown]);
  expect(recommendSongs(index, [seed])).toEqual([]);
  expect(recommendSongs(index, [unknown])).toEqual([]);
  expect(recommendSongs(index, [])).toEqual([]);
});

test('uses a transposed seed key and respects K and result limits', () => {
  const inD = { ...close, id: 'H4', tone: 'D' };
  const index = createRecommendationIndex([seed, close, inD, related]);
  const results = recommendSongs(index, [{ ...seed, tone: 'D' }], { k: 1, limit: 4 });
  expect(results).toHaveLength(1);
  expect(results[0].song.id).toBe('H4');
  expect(results[0].reasons).toContain('Cùng tone D');
});

test('explains related categories and relative minor keys and supports non-diversified set ranking', () => {
  const worship = { id: 'H20', songName: 'Morning praise', category: 'Worship: Praise', tone: 'C', timeSignature: '4/4', lyric: 'Morning praise and worship together' };
  const candidate = { id: 'H21', songName: 'Evening worship', category: 'Worship: Songs', tone: 'Am', timeSignature: '3/4', lyric: 'Evening worship and praise together' };
  const index = createRecommendationIndex([worship, candidate]);
  const result = recommendSongs(index, [worship], { diversify: false });
  expect(result[0].reasons).toHaveLength(3);
  expect(recommendSongs(index, [{ ...worship, id: 'MISSING' }])).toEqual([]);
  expect(recommendSongs(index, [worship], { limit: 0 })).toEqual([]);
  expect(recommendSongs(index, [worship], { k: 0 })).toEqual([]);
});
