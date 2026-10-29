import { hideChords } from './chords';

export function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

const canonicalCode = (value) => value.replace(/^([a-z]+)0+(\d)/, '$1$2');

export function createSearchIndex(songs) {
  return songs.map((song) => ({
    song,
    code: canonicalCode(normalizeSearch(song.id)),
    title: normalizeSearch(song.songName),
    aliases: normalizeSearch(Array.isArray(song.aliases) ? song.aliases.join(' ') : song.aliases),
    lyrics: normalizeSearch(hideChords(song.lyric)),
    category: normalizeSearch(song.category),
  }));
}

export function rankSongs(index, value) {
  const query = normalizeSearch(value);
  if (!query) return index.map((entry) => entry.song);
  const code = canonicalCode(query.replace(/\s+/g, ''));
  const tokens = query.split(/\s+/);
  return index.flatMap((entry) => {
    let score = 0;
    if (entry.code === code) score = 100;
    else if (entry.title === query) score = 90;
    else if (entry.title.startsWith(query)) score = 80;
    else if (entry.title.includes(query)) score = 65;
    else if (entry.aliases.includes(query)) score = 55;
    else if (entry.code.startsWith(code)) score = 50;
    else if (tokens.every((token) => `${entry.title} ${entry.aliases} ${entry.lyrics} ${entry.category}`.includes(token))) score = 15;
    return score ? [{ song: entry.song, score }] : [];
  }).sort((a, b) => b.score - a.score || a.song.id.localeCompare(b.song.id, 'vi', { numeric: true })).map((item) => item.song);
}
