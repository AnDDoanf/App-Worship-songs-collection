const imageContext = require.context('./', true, /TCX\d+\/TCX\d+_page\d+\.jpg$/i);

const collator = new Intl.Collator('vi', {
  numeric: true,
  sensitivity: 'base',
});

const pagesBySong = imageContext.keys().reduce((songs, key) => {
  const match = key.match(/(TCX\d+)_page(\d+)\.jpg$/i);

  if (!match) {
    return songs;
  }

  const [, songId, pageIndex] = match;

  if (!songs[songId]) {
    songs[songId] = [];
  }

  songs[songId][Number(pageIndex)] = `${songId}_page${pageIndex}`;
  return songs;
}, {});

const song4Data = Object.keys(pagesBySong)
  .sort((left, right) => collator.compare(left, right))
  .map((songId) => ({
    id: songId,
    songName: `Thánh Ca Xanh ${songId.replace('TCX', '')}`,
    tone: 'Không rõ',
    timeSignature: 'Không rõ',
    category: 'Không rõ',
    lyricist: 'Không rõ',
    composer: 'Không rõ',
    collection: 'Thánh Ca Xanh',
    audio: 'Không rõ',
    lyric: 'Không rõ',
    image: pagesBySong[songId].filter(Boolean).join(', '),
  }));

export default song4Data;
