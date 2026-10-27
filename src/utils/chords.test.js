import { inferKey, transposeLyrics } from './chords';

test('transposes the supplied minor progression without changing lyrics or line breaks', () => {
  const lyric = '[Em]Ca ngợi [C]Chúa Cha nhân từ,\n[D]Ca ngợi [G]Chúa Cha nhân từ,\n[Em]Ca ngợi [Am]Chúa Cha nhân từ,\n[D]Và hằng còn [B7]mãi,\n[D]Mãi còn đời [Em]đời.';
  expect(transposeLyrics(lyric, 'Em', 'Dm')).toBe('[Dm]Ca ngợi [Bb]Chúa Cha nhân từ,\n[C]Ca ngợi [F]Chúa Cha nhân từ,\n[Dm]Ca ngợi [Gm]Chúa Cha nhân từ,\n[C]Và hằng còn [A7]mãi,\n[C]Mãi còn đời [Dm]đời.');
});

test('preserves chord qualities, transposes bass notes and ignores annotations', () => {
  expect(transposeLyrics('[D/F#] [Bm7] [A7sus4] [C#m7(b5)] [Điệp khúc] [N.C.]', 'D', 'E'))
    .toBe('[E/G#] [C#m7] [B7sus4] [D#m7(b5)] [Điệp khúc] [N.C.]');
  expect(transposeLyrics('[B♭/D] [Fmaj7]', 'Bb', 'C')).toBe('[C/E] [Gmaj7]');
  expect(transposeLyrics('[Em]\n\ntext', 'Em', 'Em')).toBe('[Em]\n\ntext');
  expect(inferKey('[Em]text')).toBe('Em');
  expect(inferKey('[C]text', 'F')).toBe('F');
});
