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
  expect(slides).toHaveLength(2);
  expect(slides[0].lines.join(' ')).toContain('C');
  expect(slides[1].songId).toBe('H18');
  expect(slides[0].lines.join(' ')).not.toContain('Ban hát');
});

test('supports slide shortcuts, blanking, operator notes and song navigation', () => {
  const close = jest.fn();
  render(<LyricsProjectionModal songs={songs} trigger setTrigger={close} />);
  expect(document.querySelector('.projection-header-pagination').textContent).toBe('1 / 2');
  fireEvent.click(document.querySelectorAll('.projection-controls [aria-pressed]')[2]);
  expect(document.querySelector('.projection-next').textContent).toContain('Ban');
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  expect(document.querySelector('.projection-header-pagination').textContent).toBe('2 / 2');
  fireEvent.keyDown(window, { key: 'b' });
  expect(document.querySelector('.projection-audience').textContent).toBe('');
  fireEvent.keyDown(window, { key: 'b' });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'H18' } });
  expect(within(screen.getByLabelText('Trang chiếu hiện tại')).getByText('Ca ngợi Chúa')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'h' });
  expect(screen.getByRole('button', { name: /Hiện điều khiển/ })).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'h' });
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(close).toHaveBeenCalledWith(false);
});

test('supports audience click and wheel navigation, dark mode, and control visibility', () => {
  render(<LyricsProjectionModal songs={songs} trigger setTrigger={jest.fn()} />);
  const audience = document.querySelector('.projection-audience');
  fireEvent.click(audience, { clientX: 100 });
  expect(document.querySelector('.projection-header-pagination')).toHaveTextContent('2 / 2');
  fireEvent.click(audience, { clientX: -10 });
  expect(document.querySelector('.projection-header-pagination')).toHaveTextContent('1 / 2');
  fireEvent.wheel(audience, { deltaY: 40 });
  expect(document.querySelector('.projection-header-pagination')).toHaveTextContent('2 / 2');
  fireEvent.click(document.querySelectorAll('.projection-controls button')[1]);
  expect(document.querySelector('.lyrics-projection')).toHaveClass('theme-dark');
  fireEvent.click(document.querySelectorAll('.projection-controls button')[3]);
  expect(document.querySelector('.projection-show-controls')).toBeInTheDocument();
  fireEvent.click(document.querySelector('.projection-show-controls'));
  expect(document.querySelector('.projection-controls')).toBeInTheDocument();
});

test('handles empty projections, keyboard boundaries, and fullscreen toggling', () => {
  const close = jest.fn();
  const requestFullscreen = jest.fn().mockResolvedValue(undefined);
  HTMLElement.prototype.requestFullscreen = requestFullscreen;
  render(<LyricsProjectionModal songs={[]} trigger setTrigger={close} />);
  expect(document.querySelector('.projection-audience')).toHaveTextContent(/Chưa có lời bài hát/);
  expect(document.querySelector('.projection-header-pagination')).toHaveTextContent('0 / 0');
  fireEvent.keyDown(window, { key: 'ArrowLeft' });
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  fireEvent.keyDown(window, { key: 'd' });
  expect(document.querySelector('.lyrics-projection')).toHaveClass('theme-dark');
  fireEvent.click(document.querySelector('.projection-header button'));
  expect(requestFullscreen).toHaveBeenCalled();
  fireEvent.click(document.querySelector('.projection-header button:last-child'));
  expect(close).toHaveBeenCalledWith(false);
  delete HTMLElement.prototype.requestFullscreen;
});
