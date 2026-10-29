import { fireEvent, render, screen } from '@testing-library/react';
import Song from './Song';

jest.mock('../../../components/common/AudioPlayer', () => () => null);
jest.mock('../../song-viewer/components/Popup', () => () => null);
jest.mock('../../song-viewer/components/Popup2', () => () => null);

test('adding a song shows a three-second toast with a working undo action', () => {
  const undo = jest.fn();
  const onShowToast = jest.fn();
  const onAddToSlideshow = jest.fn(() => ({ added: true, undo }));
  render(<Song id="H18" songName="Thi Thiên 150" onAddToSlideshow={onAddToSlideshow} onShowToast={onShowToast} />);
  fireEvent.click(screen.getByRole('button', { name: 'Thêm H18 vào bộ bài hát' }));
  expect(onAddToSlideshow).toHaveBeenCalledWith('H18');
  const options = onShowToast.mock.calls[0][1];
  expect(options.duration).toBe(3000);
  expect(options.action.label).toBe('Hoàn tác');
  options.action.onClick();
  expect(undo).toHaveBeenCalledTimes(1);
});

test('the plus button requests a set picker without adding the song immediately', () => {
  const request = jest.fn();
  const add = jest.fn();
  render(<Song id="H18" songName="Thi Thiên 150" onRequestAddToSet={request} onAddToSlideshow={add} />);
  fireEvent.click(screen.getByRole('button', { name: 'Thêm H18 vào bộ bài hát' }));
  expect(request).toHaveBeenCalledWith('H18');
  expect(add).not.toHaveBeenCalled();
});
