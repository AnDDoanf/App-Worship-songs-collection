import { createSearchIndex, rankSongs } from './songSearch';

const songs = [
  { id: 'H18', songName: 'Thi Thiên 150', lyric: 'Hãy ngợi khen Chúa', category: 'Ngợi khen' },
  { id: 'T1', songName: 'Xin Thần Linh Đến', aliases: ['Thần Linh giáng trên'], lyric: 'Xin Ngài hiện diện', category: 'Thờ phượng' },
  { id: 'H1', songName: 'Ngợi khen Chúa', lyric: '[C]Tình yêu', category: 'Ngợi khen' },
];
test('searches accented names and aliases without accents', () => {
  const index = createSearchIndex(songs);
  expect(rankSongs(index, 'xin than linh den')[0].id).toBe('T1');
  expect(rankSongs(index, 'giang tren')[0].id).toBe('T1');
});
test('prioritizes exact codes and titles above lyric matches', () => {
  const index = createSearchIndex(songs);
  expect(rankSongs(index, 'h001')[0].id).toBe('H1');
  expect(rankSongs(index, 'ngoi khen chua').map((song) => song.id)).toEqual(['H1', 'H18']);
  expect(rankSongs(index, 'missing')).toEqual([]);
});
