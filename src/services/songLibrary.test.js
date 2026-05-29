import { normalizeLyricText } from './songLibrary';

describe('normalizeLyricText', () => {
  test('preserves chord brackets in plain lyric strings', () => {
    expect(normalizeLyricText('[G] [C]Tôn [D]vinh Chiên [G]Con')).toBe(
      '[G] [C]Tôn [D]vinh Chiên [G]Con'
    );
  });

  test('parses serialized lyric arrays from workbook cells', () => {
    expect(normalizeLyricText("['[G]Line one', '[C]Line two']")).toBe('[G]Line one\n[C]Line two');
  });
});
