import { fireEvent, render, screen, within } from '@testing-library/react';
import LyricsProjectionModal from './LyricsProjectionModal';
import { buildLyricSlides } from '../lib/lyricSlides';

const songs = [
  { id: 'T1', songName: 'Bài một', lyric: '[C]Câu một\nCâu hai\nCâu ba\nCâu bốn\nCâu năm', setNote: 'Ban hát hát câu 1' },
  { id: 'H18', songName: 'Bài hai', lyric: '[Em]Ca ngợi Chúa' },
  { id: 'TD1', songName: 'Chưa có lời', lyric: 'Không rõ' },
];
beforeEach(() => { window.scrollTo = jest.fn(); });

test('builds readable slides without chords or private operator notes', () => {
  const slides = buildLyricSlides(songs);
  expect(slides).toHaveLength(3);
  expect(slides[0].lines).toEqual(['Câu một', 'Câu hai', 'Câu ba', 'Câu bốn']);
  expect(slides[1].lines).toEqual(['Câu năm']);
  expect(slides[2].songId).toBe('H18');
  expect(slides[0].lines.join(' ')).not.toContain('Ban hát');
});

test('supports slide shortcuts, blanking, operator notes and song navigation', () => {
  const close = jest.fn();
  render(<LyricsProjectionModal songs={songs} trigger setTrigger={close} />);
  expect(screen.getByText('Câu một')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  expect(screen.getByText('Câu năm')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'b' });
  expect(screen.getByLabelText('Màn hình đen')).toBeEmptyDOMElement();
  fireEvent.keyDown(window, { key: 'b' });
  fireEvent.click(screen.getByRole('button', { name: 'Góc nhìn điều khiển' }));
  expect(screen.getByText('Ban hát hát câu 1')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'H18' } });
  expect(within(screen.getByLabelText('Trang chiếu hiện tại')).getByText('Ca ngợi Chúa')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'h' });
  expect(screen.getByRole('button', { name: /Hiện điều khiển/ })).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'h' });
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(close).toHaveBeenCalledWith(false);
});
