import { buildLyricSlides } from './lyricSlides';

test('drops blank songs and separates independent lyric paragraphs', () => {
  const slides = buildLyricSlides([
    { id: 'H1', songName: 'Blank', lyric: 'KhÃ´ng rÃµ' },
    { id: 'H2', songName: 'Verse', lyric: '[C]One two three.\n\n[G]Four five six.' },
  ]);
  expect(slides).toHaveLength(1);
  expect(slides[0].songId).toBe('H2');
  expect(slides[0].lines.join(' ')).not.toMatch(/\[C\]|\[G\]/);
  expect(slides[0].part).toBe(1);
  expect(slides[0].total).toBe(1);
});

test('wraps long lyrics within word limits and preserves light punctuation inside a page', () => {
  const slides = buildLyricSlides([{ id: 'H3', songName: 'Long', lyric:
    'One two three four five six seven eight nine ten, eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty. ' +
    'A second sentence begins here, and this comma stays together; this clause also stays together. A third sentence closes!' }]);
  expect(slides.length).toBeGreaterThan(1);
  slides.forEach((slide) => {
    expect(slide.lines.length).toBeLessThanOrEqual(5);
    slide.lines.forEach((line) => expect(line.split(/\s+/).length).toBeLessThanOrEqual(10));
  });
  expect(slides.some((slide) => slide.lines.some((line) => /together;/.test(line)))).toBe(true);
});

test('balances a sparse final page with neighboring lyric lines', () => {
  const lyrics = Array.from({ length: 6 }, (_, i) => `Line ${i + 1} has several words here`).join('\n');
  const slides = buildLyricSlides([{ id: 'H4', songName: 'Balanced', lyric: lyrics }]);
  expect(slides).toHaveLength(2);
  expect(slides[1].lines.length).toBeGreaterThan(1);
  expect(slides.flatMap((slide) => slide.lines).join(' ')).toContain('Line 6');
});
