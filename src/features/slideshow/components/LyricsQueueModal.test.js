import { fireEvent, render, screen } from '@testing-library/react';
import LyricsQueueModal from './LyricsQueueModal';

const songs = [
  { id: 'H1', songName: 'Song with chords', lyric: '[G]Praise [D]God' },
  { id: 'H2', songName: 'Song without lyrics', lyric: '' },
];

test('renders nothing while closed', () => {
  const { container } = render(<LyricsQueueModal songs={songs} trigger={false} setTrigger={jest.fn()} />);
  expect(container).toBeEmptyDOMElement();
});

test('lists songs, toggles chord visibility, and closes from its close control', () => {
  const setTrigger = jest.fn();
  render(<LyricsQueueModal songs={songs} trigger setTrigger={setTrigger} />);
  expect(screen.getByText('Song with chords')).toBeInTheDocument();
  expect(screen.getByText('Song without lyrics')).toBeInTheDocument();
  expect(document.querySelector('.chord-symbol')).toHaveTextContent('G');
  const toggle = document.querySelector('.chord-visibility-toggle');
  expect(toggle).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(document.querySelector('.chord-symbol')).toBeNull();
  expect(screen.getByText(/Không có lời bài hát|KhÃ´ng cÃ³ lá»i bÃ i hÃ¡t/)).toBeInTheDocument();
  fireEvent.click(document.querySelector('.popup-close-button'));
  expect(setTrigger).toHaveBeenCalledWith(false);
});

test('closes when the backdrop is clicked and keeps clicks inside the modal', () => {
  const setTrigger = jest.fn();
  render(<LyricsQueueModal songs={songs} trigger setTrigger={setTrigger} />);
  fireEvent.click(document.querySelector('.popup-lyrics-queue'));
  expect(setTrigger).not.toHaveBeenCalled();
  fireEvent.click(document.querySelector('.popup'));
  expect(setTrigger).toHaveBeenCalledWith(false);
});
