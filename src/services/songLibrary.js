import * as XLSX from 'xlsx';
import { DEFAULT_REMOTE_WORKBOOK_URL } from './remoteWorkbook';
import { LOCAL_SONG_SOURCES } from './data/localSongSources';

const REMOTE_WORKBOOK_URL_QUERY_PARAM = 'workbookUrl';
const REMOTE_WORKBOOK_URL_STORAGE_KEY = 'song-collections-workbook-url';
const DEFAULT_UNKNOWN_VALUE = 'Không rõ';

const SHEET_NAME_TO_COLLECTION_KEY = {
  TVCHH: 'tvchh',
  HOSANNA: 'hosanna',
  BAI_HAT_TU_DO: 'free',
  THANH_CA_XANH: 'tcx',
};

const COLLECTION_KEY_TO_LABEL = LOCAL_SONG_SOURCES.reduce((accumulator, source) => {
  accumulator[source.key] = source.label;
  return accumulator;
}, {});

function normalizeUnknownText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .replace(/Không rõ/gi, DEFAULT_UNKNOWN_VALUE)
    .replace(/KhÃ´ng rÃµ/gi, DEFAULT_UNKNOWN_VALUE)
    .replace(/KhÃƒÂ´ng rÃƒÂµ/gi, DEFAULT_UNKNOWN_VALUE)
    .replace(/KhÃƒÆ’Ã‚Â´ng rÃƒÆ’Ã‚Âµ/gi, DEFAULT_UNKNOWN_VALUE);
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

export function normalizeLyricText(value) {
  if (Array.isArray(value)) {
    return value.map((line) => String(line).trim()).filter(Boolean).join('\n');
  }

  if (typeof value !== 'string') {
    return '';
  }

  const normalizedValue = normalizeUnknownText(value);

  if (!normalizedValue || normalizedValue === DEFAULT_UNKNOWN_VALUE) {
    return '';
  }

  const parsedLines = lyricArrayStringToLines(normalizedValue);

  if (parsedLines) {
    return parsedLines.join('\n');
  }

  return normalizedValue;
}

function normalizeCollectionKey(value, fallbackCollectionKey) {
  const normalizedValue = String(value || '')
    .trim()
    .toLowerCase();

  if (SHEET_NAME_TO_COLLECTION_KEY[String(value || '').trim()]) {
    return SHEET_NAME_TO_COLLECTION_KEY[String(value || '').trim()];
  }

  if (normalizedValue === 'tvchh') {
    return 'tvchh';
  }

  if (normalizedValue === 'hosanna') {
    return 'hosanna';
  }

  if (normalizedValue === 'free' || normalizedValue === 'bai_hat_tu_do') {
    return 'free';
  }

  if (normalizedValue === 'tcx' || normalizedValue === 'thanh_ca_xanh') {
    return 'tcx';
  }

  return fallbackCollectionKey;
}

function normalizeSongRecord(record, fallbackCollectionKey) {
  const sourceCollectionKey = normalizeCollectionKey(
    record.sourceCollectionKey || record.sheetName || record.collectionKey,
    fallbackCollectionKey
  );

  const collectionLabel =
    normalizeUnknownText(record.collection) ||
    COLLECTION_KEY_TO_LABEL[sourceCollectionKey] ||
    DEFAULT_UNKNOWN_VALUE;

  return {
    id: String(record.id || '').trim(),
    songName: String(record.songName || '').trim(),
    tone: normalizeUnknownText(record.tone) || DEFAULT_UNKNOWN_VALUE,
    timeSignature: normalizeUnknownText(record.timeSignature) || DEFAULT_UNKNOWN_VALUE,
    category: normalizeUnknownText(record.category) || DEFAULT_UNKNOWN_VALUE,
    lyricist: normalizeUnknownText(record.lyricist) || DEFAULT_UNKNOWN_VALUE,
    composer: normalizeUnknownText(record.composer) || DEFAULT_UNKNOWN_VALUE,
    collection: collectionLabel,
    audio: normalizeUnknownText(record.audio) || DEFAULT_UNKNOWN_VALUE,
    lyric: normalizeLyricText(record.lyric),
    image: String(record.image || '').trim(),
    sourceCollectionKey,
  };
}

function createLocalSongLibrary() {
  return LOCAL_SONG_SOURCES.flatMap((source) =>
    source.songs
      .map((song) => normalizeSongRecord(song, source.key))
      .filter((song) => song.id && song.songName)
  );
}

function resolveRemoteWorkbookUrl() {
  if (typeof window === 'undefined') {
    return process.env.REACT_APP_SONG_WORKBOOK_URL || DEFAULT_REMOTE_WORKBOOK_URL || '';
  }

  const url = new URL(window.location.href);
  const queryValue = url.searchParams.get(REMOTE_WORKBOOK_URL_QUERY_PARAM)?.trim();

  if (queryValue) {
    window.localStorage.setItem(REMOTE_WORKBOOK_URL_STORAGE_KEY, queryValue);
    return queryValue;
  }

  return (
    window.localStorage.getItem(REMOTE_WORKBOOK_URL_STORAGE_KEY) ||
    process.env.REACT_APP_SONG_WORKBOOK_URL ||
    DEFAULT_REMOTE_WORKBOOK_URL ||
    ''
  );
}

function normalizeRemoteWorkbookUrl(rawUrl) {
  if (!rawUrl) {
    return '';
  }

  try {
    const url = new URL(rawUrl);

    if (url.hostname === 'docs.google.com') {
      const sheetsMatch = url.pathname.match(/^\/spreadsheets\/d\/([^/]+)/i);

      if (sheetsMatch) {
        const exportUrl = new URL(`https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/export`);
        exportUrl.searchParams.set('format', 'xlsx');

        const gid = url.searchParams.get('gid');
        if (gid) {
          exportUrl.searchParams.set('gid', gid);
        }

        return exportUrl.toString();
      }
    }

    if (url.hostname === 'drive.google.com') {
      const driveMatch = url.pathname.match(/^\/file\/d\/([^/]+)/i);

      if (driveMatch) {
        const downloadUrl = new URL('https://drive.google.com/uc');
        downloadUrl.searchParams.set('export', 'download');
        downloadUrl.searchParams.set('id', driveMatch[1]);
        return downloadUrl.toString();
      }
    }

    return url.toString();
  } catch (_error) {
    return rawUrl;
  }
}

async function fetchWorkbookBuffer(workbookUrl) {
  const resolvedWorkbookUrl = normalizeRemoteWorkbookUrl(workbookUrl);
  const response = await fetch(resolvedWorkbookUrl);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${resolvedWorkbookUrl}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (
    contentType.includes('text/html') &&
    !contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  ) {
    throw new Error(
      'Drive/Sheets returned HTML instead of an Excel file. Use a public export/download URL.'
    );
  }

  return response.arrayBuffer();
}

function readSongsFromWorkbook(workbook) {
  const collectionSheetSongs = workbook.SheetNames.flatMap((sheetName) => {
    const collectionKey = SHEET_NAME_TO_COLLECTION_KEY[sheetName];

    if (!collectionKey) {
      return [];
    }

    return XLSX.utils
      .sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: false })
      .map((row) => normalizeSongRecord(row, collectionKey))
      .filter((song) => song.id && song.songName);
  });

  if (collectionSheetSongs.length > 0) {
    return collectionSheetSongs;
  }

  if (workbook.Sheets.ALL_SONGS) {
    return XLSX.utils
      .sheet_to_json(workbook.Sheets.ALL_SONGS, { defval: '', raw: false })
      .map((row) => normalizeSongRecord(row, ''))
      .filter((song) => song.id && song.songName);
  }

  return [];
}

export async function loadSongLibrary() {
  const localSongs = createLocalSongLibrary();
  const workbookUrl = resolveRemoteWorkbookUrl();

  if (!workbookUrl) {
    return {
      songs: localSongs,
      source: 'local',
      workbookUrl: '',
      resolvedWorkbookUrl: '',
      error: '',
    };
  }

  const resolvedWorkbookUrl = normalizeRemoteWorkbookUrl(workbookUrl);

  try {
    const workbookData = await fetchWorkbookBuffer(workbookUrl);
    const workbook = XLSX.read(workbookData, { type: 'array' });
    const remoteSongs = readSongsFromWorkbook(workbook);

    if (remoteSongs.length === 0) {
      throw new Error('Workbook loaded, but no songs were found. Expected ALL_SONGS or known sheet names.');
    }

    return {
      songs: remoteSongs,
      source: 'remote',
      workbookUrl,
      resolvedWorkbookUrl,
      error: '',
    };
  } catch (error) {
    return {
      songs: localSongs,
      source: 'fallback',
      workbookUrl,
      resolvedWorkbookUrl,
      error: error instanceof Error ? error.message : 'Unknown workbook error',
    };
  }
}
