const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'src', 'data');
const OUTPUT_DIR = path.join(ROOT_DIR, 'exports');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'song-collections.xlsx');
const UNKNOWN_VALUE = 'Không rõ';

const COLLECTIONS = [
  {
    key: 'tvchh',
    label: 'Tôn vinh Chúa Hằng Hữu',
    sheetName: 'TVCHH',
    filePath: path.join(DATA_DIR, 'song-data.json'),
  },
  {
    key: 'hosanna',
    label: 'Hosanna Việt Nam',
    sheetName: 'HOSANNA',
    filePath: path.join(DATA_DIR, 'song2-data.json'),
  },
  {
    key: 'free',
    label: 'Bài hát tự do',
    sheetName: 'BAI_HAT_TU_DO',
    filePath: path.join(DATA_DIR, 'song3-data.json'),
  },
  {
    key: 'tcx',
    label: 'Thánh Ca Xanh',
    sheetName: 'THANH_CA_XANH',
    loadSongs: loadTcxSongs,
  },
];

function normalizeUnknownText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .replace(/KhÃ´ng rÃµ/gi, UNKNOWN_VALUE)
    .replace(/KhÃƒÂ´ng rÃƒÂµ/gi, UNKNOWN_VALUE);
}

function lyricArrayStringToLines(value) {
  const trimmed = value.trim();

  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return null;
  }

  return trimmed
    .slice(1, -1)
    .split(/',\s*'|",\s*"|',\s*"|",\s*'/)
    .map((line) => line.replace(/^['"]|['"]$/g, '').trim())
    .filter(Boolean);
}

function normalizeLyricText(value) {
  if (Array.isArray(value)) {
    return value.map((line) => String(line).trim()).filter(Boolean).join('\n');
  }

  if (typeof value !== 'string') {
    return '';
  }

  const normalizedValue = normalizeUnknownText(value);

  if (!normalizedValue || normalizedValue === UNKNOWN_VALUE) {
    return '';
  }

  const parsedLines = lyricArrayStringToLines(normalizedValue);

  if (parsedLines) {
    return parsedLines.join('\n');
  }

  return normalizedValue;
}

function normalizeSong(song, collection) {
  return {
    id: String(song.id || '').trim(),
    songName: String(song.songName || '').trim(),
    tone: normalizeUnknownText(song.tone) || UNKNOWN_VALUE,
    timeSignature: normalizeUnknownText(song.timeSignature) || UNKNOWN_VALUE,
    category: normalizeUnknownText(song.category) || UNKNOWN_VALUE,
    lyricist: normalizeUnknownText(song.lyricist) || UNKNOWN_VALUE,
    composer: normalizeUnknownText(song.composer) || UNKNOWN_VALUE,
    collection: normalizeUnknownText(song.collection) || collection.label,
    audio: normalizeUnknownText(song.audio) || UNKNOWN_VALUE,
    lyric: normalizeLyricText(song.lyric),
    image: String(song.image || '').trim(),
    sourceCollectionKey: collection.key,
  };
}

function loadJsonSongs(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walkDirectory(directoryPath, callback) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  entries.forEach((entry) => {
    const resolvedPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      walkDirectory(resolvedPath, callback);
      return;
    }

    callback(resolvedPath);
  });
}

function loadTcxSongs() {
  const pagesBySong = {};

  walkDirectory(DATA_DIR, (filePath) => {
    const relativePath = path.relative(DATA_DIR, filePath).replace(/\\/g, '/');
    const match = relativePath.match(/(TCX\d+)\/(TCX\d+)_page(\d+)\.jpg$/i);

    if (!match) {
      return;
    }

    const [, songId, imageId, pageIndex] = match;

    if (!pagesBySong[songId]) {
      pagesBySong[songId] = [];
    }

    pagesBySong[songId][Number(pageIndex)] = imageId;
  });

  const collator = new Intl.Collator('vi', {
    numeric: true,
    sensitivity: 'base',
  });

  return Object.keys(pagesBySong)
    .sort((left, right) => collator.compare(left, right))
    .map((songId) => ({
      id: songId,
      songName: `Thánh Ca Xanh ${songId.replace('TCX', '')}`,
      tone: UNKNOWN_VALUE,
      timeSignature: UNKNOWN_VALUE,
      category: UNKNOWN_VALUE,
      lyricist: UNKNOWN_VALUE,
      composer: UNKNOWN_VALUE,
      collection: 'Thánh Ca Xanh',
      audio: UNKNOWN_VALUE,
      lyric: '',
      image: pagesBySong[songId].filter(Boolean).join(', '),
    }));
}

function getSongsForCollection(collection) {
  const songs = collection.loadSongs ? collection.loadSongs() : loadJsonSongs(collection.filePath);

  return songs
    .map((song) => normalizeSong(song, collection))
    .filter((song) => song.id && song.songName);
}

function autosizeColumns(rows) {
  const headers = Object.keys(rows[0] || {});

  return headers.map((header) => ({
    wch: Math.min(
      48,
      Math.max(
        header.length + 2,
        ...rows.map((row) =>
          String(row[header] || '')
            .split('\n')
            .reduce((max, line) => Math.max(max, line.length), 0) + 2
        )
      )
    ),
  }));
}

function ensureOutputDirectory() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function writeWorkbook() {
  const workbook = XLSX.utils.book_new();
  const allSongs = [];

  COLLECTIONS.forEach((collection) => {
    const songs = getSongsForCollection(collection);
    const sheet = XLSX.utils.json_to_sheet(songs);
    sheet['!cols'] = autosizeColumns(songs);
    XLSX.utils.book_append_sheet(workbook, sheet, collection.sheetName);
    allSongs.push(...songs);
  });

  const allSongsSheet = XLSX.utils.json_to_sheet(allSongs);
  allSongsSheet['!cols'] = autosizeColumns(allSongs);
  XLSX.utils.book_append_sheet(workbook, allSongsSheet, 'ALL_SONGS');

  ensureOutputDirectory();
  XLSX.writeFile(workbook, OUTPUT_PATH);

  console.log(`Wrote ${allSongs.length} songs to ${OUTPUT_PATH}`);
}

writeWorkbook();
