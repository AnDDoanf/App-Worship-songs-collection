import { normalizeLyricText } from '../../../services/songLibrary';
import { hideChords } from '../../../utils/chords';

function hasStrongEnding(line) {
  return /[.!?]$/u.test(line.trim());
}

function wrapLine(line, maxWords = 10, maxLength = 30) {
  const lines = [];
  let current = '';
  for (const word of line.trim().split(/\s+/)) {
    if (current && (current.split(/\s+/).length >= maxWords || current.length + word.length + 1 > maxLength)) {
      lines.push(current);
      current = '';
    }
    current += `${current ? ' ' : ''}${word}`;
    const wordCount = current.split(/\s+/).length;
    const punctuationBreak = /[.!?]$/u.test(word) || (/[,;:]$/u.test(word) && wordCount >= 3);
    if (wordCount >= maxWords || punctuationBreak) {
      lines.push(current);
      current = '';
    }
  }
  if (current) lines.push(current);

  for (let i = 1; i < lines.length; i += 1) {
    const previousWords = lines[i - 1].split(/\s+/u);
    const currentWords = lines[i].split(/\s+/u);
    while (currentWords.length < 3 && previousWords.length > 2 && !/[,.!?;:]$/u.test(lines[i - 1])) {
      const candidate = previousWords[previousWords.length - 1];
      if (`${candidate} ${currentWords.join(' ')}`.length > maxLength || currentWords.length >= maxWords) break;
      currentWords.unshift(previousWords.pop());
    }
    lines[i - 1] = previousWords.join(' ');
    lines[i] = currentWords.join(' ');
  }

  return lines;
}

function groupLinesIntoSlides(lines, maxLines = 5) {
  const slides = [];
  let current = [];

  lines.forEach((line) => {
    current.push(line);
    if (current.length >= maxLines || (current.length >= 3 && hasStrongEnding(line))) {
      slides.push(current);
      current = [];
    }
  });

  if (current.length) slides.push(current);
  return slides;
}

function hasEnoughContent(lines) {
  return lines.length >= 2 && lines.join(' ').split(/\s+/u).length >= 6;
}

function rebalanceShortSlides(slides, maxLines = 5) {
  for (let i = 0; i < slides.length; i += 1) {
    if (hasEnoughContent(slides[i])) {
      const next = slides[i + 1];
      if (next && !hasEnoughContent(next) && slides[i].length + next.length <= maxLines) {
        slides[i].push(...next);
        slides.splice(i + 1, 1);
        i -= 1;
      }
      continue;
    }

    const previous = slides[i - 1];
    if (previous && previous.length + slides[i].length <= maxLines) {
      previous.push(...slides[i]);
      slides.splice(i, 1);
      i -= 1;
      continue;
    }

    if (previous && previous.length > 1 && slides[i].length < 2) {
      slides[i].unshift(previous.pop());
      continue;
    }

    const next = slides[i + 1];
    if (next && slides[i].length + next.length <= maxLines) {
      slides[i].push(...next);
      slides.splice(i + 1, 1);
      i -= 1;
    }
  }

  return slides.filter((slide) => slide.length);
}

export function buildLyricSlides(songs) {
  return songs.flatMap((song) => {
    const text = hideChords(normalizeLyricText(song.lyric)).trim();
    if (!text) return [];
    const slides = text.split(/\n\s*\n/).flatMap((paragraph) => {
      const lines = wrapLine(paragraph.replace(/\s*\n\s*/gu, ' '));
      return groupLinesIntoSlides(lines);
    });
    const groups = rebalanceShortSlides(slides);
    return groups.map((lines, index) => ({ songId: song.id, songName: song.songName, note: song.setNote || '', lines, part: index + 1, total: groups.length }));
  });
}
