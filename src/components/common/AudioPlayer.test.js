import { fireEvent, render, screen } from '@testing-library/react';
import AudioPlayer from './AudioPlayer';

test('shows a disabled state when a song has no audio source', () => {
  render(<AudioPlayer audio="   " />);
  expect(document.querySelector('.audio-button')).toBeDisabled();
});

test.each([
  ['https://www.youtube.com/watch?v=watch-id&t=4', 'watch-id'],
  ['https://m.youtube.com/shorts/short-id', 'short-id'],
  ['https://youtube.com/embed/embed-id', 'embed-id'],
  ['https://youtu.be/short-url-id', 'short-url-id'],
])('opens and closes YouTube source %s', (audio, videoId) => {
  const previousOverflow = document.body.style.overflow;
  render(<AudioPlayer audio={audio} />);
  fireEvent.click(screen.getByRole('button', { name: 'YouTube' }));
  const frame = screen.getByTitle('YouTube audio player');
  expect(frame).toHaveAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByTitle('YouTube audio player')).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe(previousOverflow);
});

test('closes a YouTube popup from the backdrop but not its inner content', () => {
  render(<AudioPlayer audio="https://youtu.be/video-id" />);
  fireEvent.click(screen.getByRole('button', { name: 'YouTube' }));
  fireEvent.click(screen.getByTitle('YouTube audio player'));
  expect(screen.getByTitle('YouTube audio player')).toBeInTheDocument();
  fireEvent.click(document.querySelector('.popup-youtube').parentElement);
  expect(screen.queryByTitle('YouTube audio player')).not.toBeInTheDocument();
});

test('loads a non-YouTube audio control only after requested', () => {
  render(<AudioPlayer audio="https://example.com/song.mp3" />);
  fireEvent.click(document.querySelector('.audio-button'));
  expect(document.querySelector('audio')).toHaveAttribute('src', 'https://example.com/song.mp3');
  expect(document.querySelector('audio')).toHaveAttribute('preload', 'none');
});

test('ignores malformed and unsupported audio URLs as YouTube sources', () => {
  render(<AudioPlayer audio="not a URL" />);
  fireEvent.click(document.querySelector('.audio-button'));
  expect(document.querySelector('audio')).toHaveAttribute('src', 'not a URL');
});
