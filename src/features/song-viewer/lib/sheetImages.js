import gallery from './gallery';

const UNKNOWN_IMAGE_VALUES = new Set(['', 'Không rõ', 'KhÃ´ng rÃµ']);

function normalizeImageToken(value) {
  return String(value || '').trim();
}

export function hasKnownImageValue(value) {
  return !UNKNOWN_IMAGE_VALUES.has(normalizeImageToken(value));
}

function extractLocalImageKey(value) {
  const normalizedValue = normalizeImageToken(value);

  if (!normalizedValue) {
    return '';
  }

  if (gallery[normalizedValue]) {
    return normalizedValue;
  }

  const fileName = normalizedValue.split('/').pop()?.split('?')[0]?.split('#')[0] || '';
  const imageKey = fileName.replace(/\.(png|jpe?g|svg|webp)$/i, '');

  return gallery[imageKey] ? imageKey : '';
}

function extractGoogleDriveFileId(value) {
  const normalizedValue = normalizeImageToken(value);

  if (!normalizedValue) {
    return '';
  }

  try {
    const url = new URL(normalizedValue);

    if (!/google\.com$/i.test(url.hostname)) {
      return '';
    }

    const directId = url.searchParams.get('id');
    if (directId) {
      return directId;
    }

    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/i);
    if (fileMatch) {
      return fileMatch[1];
    }

    const documentMatch = url.pathname.match(/\/uc$/i);
    if (documentMatch) {
      return url.searchParams.get('id') || '';
    }

    return '';
  } catch (_error) {
    return '';
  }
}

function resolveRemoteImageUrl(value) {
  const normalizedValue = normalizeImageToken(value);

  if (!normalizedValue) {
    return '';
  }

  const driveFileId = extractGoogleDriveFileId(normalizedValue);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w2000`;
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  return '';
}

export function parseSheetImageSources(image) {
  const normalizedImage = normalizeImageToken(image);

  if (!hasKnownImageValue(normalizedImage)) {
    return [];
  }

  return normalizedImage
    .split(',')
    .map((entry) => normalizeImageToken(entry))
    .filter(Boolean)
    .map((entry, index) => {
      const localImageKey = extractLocalImageKey(entry);

      if (localImageKey) {
        return {
          id: `local-${localImageKey}-${index}`,
          kind: 'local',
          src: gallery[localImageKey],
          label: localImageKey,
        };
      }

      const remoteImageUrl = resolveRemoteImageUrl(entry);

      if (remoteImageUrl) {
        return {
          id: `remote-${index}-${entry}`,
          kind: 'remote',
          src: remoteImageUrl,
          label: entry,
        };
      }

      return null;
    })
    .filter(Boolean);
}
