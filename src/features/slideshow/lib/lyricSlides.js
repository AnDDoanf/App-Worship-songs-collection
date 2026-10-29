import { normalizeLyricText } from '../../../services/songLibrary';
import { hideChords } from '../../../utils/chords';

function wrapLine(line, maxLength = 64) {
  const lines = [];
  let current = '';
  for (const word of line.trim().split(/\s+/)) {
    if (current && current.length + word.length + 1 > maxLength) { lines.push(current); current = ''; }
    current += `${current ? ' ' : ''}${word}`;
  }
  if (current) lines.push(current);
  return lines;
}

export function buildLyricSlides(songs) {
  return songs.flatMap((song) => {
    const text = hideChords(normalizeLyricText(song.lyric)).trim();
    if (!text) return [];
    const groups = text.split(/\n\s*\n/).flatMap((paragraph) => {
      const lines = paragraph.split('\n').flatMap((line) => wrapLine(line));
      const slides = [];
      for (let index = 0; index < lines.length; index += 4) slides.push(lines.slice(index, index + 4));
      return slides;
    });
    return groups.map((lines, index) => ({ songId: song.id, songName: song.songName, note: song.setNote || '', lines, part: index + 1, total: groups.length }));
  });
}
