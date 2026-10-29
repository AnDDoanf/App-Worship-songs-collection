import { hideChords, isKey } from '../../utils/chords';
import { normalizeSearch } from '../../utils/songSearch';
export { normalizeSearch } from '../../utils/songSearch';

const STOP_WORDS = new Set('va la cua cho trong nhung mot co voi duoc nay da de khi thi ma o nhu cac tu den do se nhat tren duoi'.split(' '));
const PITCHES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function known(value) {
  const text = String(value || '').trim();
  return text && !['khong ro', 'unknown', 'n/a'].includes(normalizeSearch(text)) ? text : '';
}

function words(value) {
  return (normalizeSearch(value).match(/[a-z]+/g) || []).filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function keyOf(song) {
  // An opening chord alone is not reliable evidence of a song's musical key.
  const value = known(song.tone).replace(/♯/g, '#').replace(/♭/g, 'b');
  return isKey(value) ? value : '';
}

function keyInfo(key) {
  const minor = key.endsWith('m');
  const pitch = (PITCHES[key[0]] + (key[1] === '#' ? 1 : key[1] === 'b' ? -1 : 0) + 12) % 12;
  const majorPitch = (pitch + (minor ? 3 : 0)) % 12;
  return { pitch, minor, circle: majorPitch * 7 % 12 };
}

export function keySimilarity(left, right) {
  if (!isKey(left) || !isKey(right)) return null;
  const a = keyInfo(left);
  const b = keyInfo(right);
  if (a.pitch === b.pitch && a.minor === b.minor) return 1;
  if (a.circle === b.circle) return 0.85;
  const gap = Math.abs(a.circle - b.circle);
  const distance = Math.min(gap, 12 - gap);
  return Math.max(0, 1 - distance / 3) * 0.75;
}

function cosine(left, right) {
  let sum = 0;
  const [small, large] = left.size < right.size ? [left, right] : [right, left];
  for (const [word, weight] of small) sum += weight * (large.get(word) || 0);
  return Math.min(1, Math.max(0, sum));
}

function categorySimilarity(left, right) {
  if (!left.length || !right.length) return null;
  if (left.join(':') === right.join(':')) return 1;
  if (left[0] === right[0]) return 0.35;
  return 0;
}

export function createRecommendationIndex(songs) {
  const frequencies = new Map();
  const entries = songs.map((song) => {
    const lyric = known(song.lyric);
    const title = /^thanh ca xanh \d+$/i.test(normalizeSearch(song.songName)) ? '' : known(song.songName);
    const terms = new Map();
    const addWords = (text, boost) => {
      for (const word of words(text).slice(0, 2000)) terms.set(word, (terms.get(word) || 0) + boost);
    };
    addWords(title, 3);
    addWords(hideChords(lyric).replace(/<br\s*\/?>/gi, ' '), 1);
    for (const word of terms.keys()) frequencies.set(word, (frequencies.get(word) || 0) + 1);
    return {
      song, terms, key: keyOf(song),
      category: known(song.category).split(/[:;]/).map((part) => normalizeSearch(part).trim()).filter(Boolean),
      meter: /^\d+\/\d+$/.test(song.timeSignature) ? song.timeSignature : '',
      hasContent: Boolean(lyric || known(song.image)),
    };
  });
  for (const entry of entries) {
    let norm = 0;
    for (const [word, count] of entry.terms) {
      const weight = (1 + Math.log(count)) * (1 + Math.log((songs.length + 1) / (frequencies.get(word) + 1)));
      entry.terms.set(word, weight);
      norm += weight * weight;
    }
    norm = Math.sqrt(norm);
    if (norm) for (const [word, weight] of entry.terms) entry.terms.set(word, weight / norm);
  }
  return { entries, byId: new Map(entries.map((entry) => [entry.song.id.toUpperCase(), entry])) };
}

function compare(left, right) {
  const text = left.terms.size && right.terms.size ? cosine(left.terms, right.terms) : null;
  const category = categorySimilarity(left.category, right.category);
  const key = keySimilarity(left.key, right.key);
  const meter = left.meter && right.meter ? Number(left.meter === right.meter) : null;
  let total = 0;
  let weight = 0;
  for (const [value, importance] of [[text, 0.5], [category, 0.25], [key, 0.2], [meter, 0.05]]) {
    if (value !== null) { total += value * importance; weight += importance; }
  }
  return { score: weight ? total / weight : 0, text, category, key, meter };
}

function reasonsFor(match, seed, candidate) {
  const reasons = [];
  if (match.category === 1) reasons.push('Cùng chủ đề');
  else if (match.category > 0) reasons.push('Chủ đề gần nhau');
  if (match.text >= 0.12) reasons.push('Lời ca và tên bài gần nhau');
  if (match.key === 1) reasons.push(`Cùng tone ${candidate.key}`);
  else if (match.key >= 0.85) reasons.push('Giọng trưởng/thứ tương ứng');
  else if (match.key >= 0.5) reasons.push(`Tone ${candidate.key} gần ${seed.key}`);
  if (match.meter === 1) reasons.push(`Cùng nhịp ${candidate.meter}`);
  return reasons.slice(0, 3);
}

// Exact weighted KNN. Set mode unions each seed's K neighbours, then ranks
// the pool by both its strongest match and average fit across the set.
export function recommendSongs(index, seedSongs, { limit = 4, k = 24, excludeIds = [], diversify = true } = {}) {
  if (!index || !seedSongs.length || limit <= 0 || k <= 0) return [];
  const excluded = new Set([...excludeIds, ...seedSongs.map((song) => song.id)].map((id) => id.toUpperCase()));
  const seeds = [...new Map(seedSongs.map((song) => [song.id.toUpperCase(), song])).values()]
    .flatMap((song) => {
      const entry = index.byId.get(song.id.toUpperCase());
      return entry ? [{ ...entry, key: keyOf(song) }] : [];
    });
  if (!seeds.length) return [];
  const pool = new Set();
  const candidates = index.entries.filter((entry) => !excluded.has(entry.song.id.toUpperCase()) && entry.hasContent);
  const tieBreak = (a, b) => a.song.id.localeCompare(b.song.id, 'vi', { numeric: true });
  for (const seed of seeds) {
    candidates.map((entry) => ({ entry, match: compare(seed, entry) }))
      .filter(({ match }) => match.category > 0 || match.text >= 0.08)
      .sort((a, b) => b.match.score - a.match.score || tieBreak(a.entry, b.entry))
      .slice(0, k).forEach(({ entry }) => pool.add(entry));
  }
  const scored = [...pool].map((entry) => {
    const matches = seeds.map((seed) => ({ seed, match: compare(seed, entry) })).sort((a, b) => b.match.score - a.match.score);
    const best = matches[0];
    const average = matches.reduce((sum, item) => sum + item.match.score, 0) / matches.length;
    return {
      entry, song: entry.song, score: best.match.score * 0.65 + average * 0.35,
      reasons: reasonsFor(best.match, best.seed, entry), matchedSong: best.seed.song,
    };
  });
  const selected = [];
  while (scored.length && selected.length < limit) {
    const adjusted = (candidate) => candidate.score - (diversify && seeds.length > 1
      ? 0.12 * Math.max(0, ...selected.map((other) => cosine(candidate.entry.terms, other.entry.terms))) : 0);
    scored.sort((a, b) => adjusted(b) - adjusted(a) || tieBreak(a, b));
    selected.push(scored.shift());
  }
  return selected.map(({ entry, ...result }) => result);
}
