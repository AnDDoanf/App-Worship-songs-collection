import { parseSongCodes } from './slideshow';

export const PENDING_SHARE_STORAGE_KEY = 'song-collections-pending-share';
export const DEFAULT_SHARED_LIST_NAME = 'Danh sách được chia sẻ';

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

  if (looksLikeSongCode(segments[0])) {
    return {
      name: DEFAULT_SHARED_LIST_NAME,
      ids: normalizeShareIds(segments),
      workbookUrl: '',
    };
  }

  return {
    name: normalizeShareName(segments[0]),
    ids: normalizeShareIds(segments.slice(1)),
    workbookUrl: '',
  };
}

function parseNamedShareQuery(rawQuery) {
  const searchParams = new URLSearchParams(rawQuery);

  return {
    name: normalizeShareName(searchParams.get('name')),
    ids: normalizeShareIds(splitSongs(searchParams.get('songs'))),
    workbookUrl: String(searchParams.get('workbookUrl') || '').trim(),
  };
}

export function getAppBasePath() {
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

export function getSharePath() {
  const basePath = getAppBasePath();
  return `${basePath}/share`;
}

export function isSharePath(pathname) {
  return trimTrailingSlash(pathname || '/') === getSharePath();
}

export function buildShareUrl({ name, ids, origin, workbookUrl = '' }) {
  const normalizedIds = normalizeShareIds(ids);
  const normalizedOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  const encodedName = encodeURIComponent(normalizeShareName(name));
  const encodedSongs = normalizedIds.map((id) => encodeURIComponent(id)).join('|');
  const workbookSegment = workbookUrl
    ? `&workbookUrl=${encodeURIComponent(String(workbookUrl).trim())}`
    : '';

  return `${normalizedOrigin}${getSharePath()}?name=${encodedName}&songs=${encodedSongs}${workbookSegment}`;
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
