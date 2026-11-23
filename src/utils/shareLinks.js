import { parseSongCodes } from './slideshow';
import { normalizePreferences } from '../store/chordPreferences';
import { isKey } from './chords';

const PENDING_SHARE_STORAGE_KEY = 'song-collections-pending-share';
const DEFAULT_SHARED_LIST_NAME = 'Danh sách được chia sẻ';

function trimTrailingSlash(value) {
  if (!value || value === '/') {
    return '';
  }

  return value.replace(/\/+$/, '');
}

function normalizeShareName(value) {
  return String(value || '').trim() || DEFAULT_SHARED_LIST_NAME;
}

function normalizeShareIds(ids) {
  return [...new Set((ids || []).map((id) => String(id || '').trim().toUpperCase()).filter(Boolean))];
}

function splitSongs(value) {
  return parseSongCodes(String(value || '').replace(/\|/g, ','));
}

function looksLikeSongCode(value) {
  return /^[A-Z]+\d+[A-Z0-9]*$/i.test(String(value || '').trim());
}

function decodeQueryPart(value) {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
}

function parseCompactShareQuery(rawQuery) {
  const segments = rawQuery.split('|').map(decodeQueryPart).map((part) => part.trim()).filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const firstCode = segments[0].split(':')[0];
  const songSegments = looksLikeSongCode(firstCode) ? segments : segments.slice(1);
  const entries = songSegments.map((segment) => {
    const [id, targetKey = ''] = segment.split(':');
    return { id: id.toUpperCase(), targetKey };
  }).filter(({ id }) => looksLikeSongCode(id));
  const ids = normalizeShareIds(entries.map(({ id }) => id));
  const targetKeys = Object.fromEntries(entries
    .filter(({ id, targetKey }) => ids.includes(id) && isKey(targetKey))
    .map(({ id, targetKey }) => [id, targetKey]));

  return {
    name: looksLikeSongCode(firstCode) ? DEFAULT_SHARED_LIST_NAME : normalizeShareName(segments[0]),
    ids,
    workbookUrl: '',
    chordPreferences: {},
    targetKeys,
  };
}

function parseNamedShareQuery(rawQuery) {
  const searchParams = new URLSearchParams(rawQuery);
  const rawSongs = String(searchParams.get('songs') || '');
  const songAndKeyEntries = rawSongs.split(',').map((entry) => entry.trim().split('|'));
  const hasTargetKeys = songAndKeyEntries.length > 0 && songAndKeyEntries.every(([id, targetKey, extra]) =>
    !extra && looksLikeSongCode(id) && isKey(targetKey));
  const ids = normalizeShareIds(hasTargetKeys
    ? songAndKeyEntries.map(([id]) => id)
    : splitSongs(rawSongs));
  const targetKeys = hasTargetKeys
    ? Object.fromEntries(songAndKeyEntries.map(([id, targetKey]) => [id.toUpperCase(), targetKey]))
    : {};
  let chordPreferences = {};
  try {
    chordPreferences = normalizePreferences(JSON.parse(searchParams.get('chords')),
      ids);
  } catch (_error) { /* Older or malformed links still import their song IDs. */ }

  return {
    name: normalizeShareName(searchParams.get('name')),
    ids,
    workbookUrl: String(searchParams.get('workbookUrl') || '').trim(),
    chordPreferences,
    targetKeys,
  };
}

function getAppBasePath() {
  const publicUrl = process.env.PUBLIC_URL || '';

  if (!publicUrl) {
    return '';
  }

  try {
    const baseOrigin = typeof window === 'undefined' ? 'https://example.com' : window.location.origin;
    const pathname = new URL(publicUrl, baseOrigin).pathname;
    return trimTrailingSlash(pathname);
  } catch (_error) {
    const normalized = trimTrailingSlash(publicUrl);
    return normalized.startsWith('/') || !normalized ? normalized : `/${normalized}`;
  }
}

export function getAppHomePath() {
  const basePath = getAppBasePath();
  return basePath ? `${basePath}/` : '/';
}

function getSharePath() {
  const basePath = getAppBasePath();
  return `${basePath}/share`;
}

function isSharePath(pathname) {
  return trimTrailingSlash(pathname || '/') === getSharePath();
}

export function buildShareUrl({ name, ids, origin, chordPreferences }) {
  const normalizedIds = normalizeShareIds(ids);
  const normalizedOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  const encodedName = encodeURIComponent(normalizeShareName(name));

  const preferences = normalizePreferences(chordPreferences, normalizedIds);
  const encodedSongs = normalizedIds.map((id) => `${encodeURIComponent(id)}${preferences[id] ? `|${encodeURIComponent(preferences[id].targetKey)}` : ''}`).join(',');
  const hasCustomLyrics = Object.values(preferences).some((preference) => typeof preference.lyric === 'string');
  const chords = Object.keys(preferences).length ? `&chords=${encodeURIComponent(JSON.stringify(preferences))}` : '';
  return `${normalizedOrigin}${getSharePath()}?name=${encodedName}&songs=${encodedSongs}${hasCustomLyrics ? chords : ''}`;
}

export function parseShareLocation(locationLike) {
  if (!isSharePath(locationLike?.pathname || '')) {
    return null;
  }

  const rawQuery = String(locationLike?.search || '').replace(/^\?/, '').trim();

  if (!rawQuery) {
    return null;
  }

  return rawQuery.includes('=') ? parseNamedShareQuery(rawQuery) : parseCompactShareQuery(rawQuery);
}

export function consumePendingShareLocation() {
  if (typeof window === 'undefined') {
    return null;
  }

  const directShare = parseShareLocation(window.location);

  if (directShare) {
    return directShare;
  }

  const pendingShareValue = window.sessionStorage.getItem(PENDING_SHARE_STORAGE_KEY);

  if (!pendingShareValue) {
    return null;
  }

  window.sessionStorage.removeItem(PENDING_SHARE_STORAGE_KEY);

  try {
    return parseShareLocation(JSON.parse(pendingShareValue));
  } catch (_error) {
    return null;
  }
}
