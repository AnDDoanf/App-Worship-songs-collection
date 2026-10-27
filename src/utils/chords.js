const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const PITCHES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const KEY_OPTIONS = [...KEYS, ...KEYS.map((key) => `${key}m`)];
const keyPattern = /^([A-G])([#b]?)(m?)$/;
const chordPattern = /^([A-G][#b♯♭]?)((?:(?:maj|min|dim|aug|sus|add|omit|m|M|Δ|ø|°|\+|-)|[0-9#b♯♭(),])*)(?:\/([A-G][#b♯♭]?))?$/;
const normalizeAccidentals = (value) => value.replace(/♯/g, '#').replace(/♭/g, 'b');
export const isKey = (value) => typeof value === 'string' && keyPattern.test(value);
const pitch = (note) => (PITCHES[note[0]] + (note[1] === '#' ? 1 : note[1] === 'b' ? -1 : 0) + 12) % 12;

export function inferKey(lyric, tone = '') {
  if (isKey(tone)) return tone;
  for (const match of String(lyric || '').matchAll(/\[([^\u005B\u005D]+)\]/g)) {
    const chord = normalizeAccidentals(match[1].trim()).match(chordPattern);
    if (chord) return chord[1] + (/^(m(?!aj)|min)/.test(chord[2]) ? 'm' : '');
  }
  return '';
}

export function transposeLyrics(lyric, sourceKey, targetKey) {
  if (!isKey(sourceKey) || !isKey(targetKey) || sourceKey === targetKey) return lyric;
  const shift = pitch(targetKey) - pitch(sourceKey);
  const notes = targetKey.includes('b') || ['F', 'Dm', 'Gm', 'Cm', 'Fm'].includes(targetKey) ? FLATS : SHARPS;
  const transposeNote = (note) => notes[(pitch(normalizeAccidentals(note)) + shift + 12) % 12];
  return String(lyric).replace(/\[([^\u005B\u005D]+)\]/g, (whole, content) => {
    const chord = content.trim().match(chordPattern);
    if (!chord) return whole;
    const result = transposeNote(chord[1]) + chord[2] + (chord[3] ? `/${transposeNote(chord[3])}` : '');
    return `[${content.replace(content.trim(), result)}]`;
  });
}
