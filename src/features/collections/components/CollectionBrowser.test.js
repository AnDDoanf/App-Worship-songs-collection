import { act, fireEvent, render, screen } from '@testing-library/react';
import CollectionBrowser from './CollectionBrowser';

jest.mock('./Song', () => ({ id, onAddToSlideshow }) => (
  <button onClick={() => onAddToSlideshow?.(id)}>{id}</button>
));

const songs = Array.from({ length: 30 }, (_, index) => ({
  id: `T${index + 1}`,
  songName: `Song ${index + 1}`,
  lyric: '',
  category: '',
  tone: index < 15 ? 'C' : 'D',
  timeSignature: '4/4',
}));

let observers;
const originalObserver = window.IntersectionObserver;

beforeEach(() => {
  observers = [];
  window.IntersectionObserver = jest.fn(function (callback) {
    this.observe = jest.fn();
    this.disconnect = jest.fn();
    observers.push({ callback, instance: this });
  });
});

afterEach(() => {
  window.IntersectionObserver = originalObserver;
});

test('shows skeletons until the library is ready, then shows songs', () => {
  const view = render(<CollectionBrowser songs={[]} isLoading />);
  expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByRole('status')).toHaveTextContent('Đang tải bài hát');
  expect(screen.queryByText('Không tìm thấy bài hát phù hợp.')).not.toBeInTheDocument();
  expect(window.IntersectionObserver).not.toHaveBeenCalled();
  view.rerender(<CollectionBrowser songs={songs} isLoading={false} />);
  expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false');
  expect(screen.getByRole('button', { name: 'T1', exact: true })).toBeInTheDocument();
  expect(screen.queryByText('Đang tải bài hát…')).not.toBeInTheDocument();
});

test('appends batches on intersection, ignores stale callbacks, and stops at the end', () => {
  const addSong = jest.fn();
  const view = render(<CollectionBrowser songs={songs} onAddToSlideshow={addSong} />);
  expect(screen.queryByRole('button', { name: 'T13', exact: true })).not.toBeInTheDocument();
  const first = observers[0];
  act(() => first.callback([{ isIntersecting: false }]));
  expect(screen.queryByRole('button', { name: 'T13', exact: true })).not.toBeInTheDocument();
  act(() => first.callback([{ isIntersecting: true }]));
  expect(screen.getByRole('button', { name: 'T24', exact: true })).toBeInTheDocument();
  expect(first.instance.disconnect).toHaveBeenCalled();
  act(() => first.callback([{ isIntersecting: true }]));
  expect(screen.queryByRole('button', { name: 'T25', exact: true })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'T24', exact: true }));
  expect(addSong).toHaveBeenCalledWith('T24');
  view.rerender(<CollectionBrowser songs={songs} onAddToSlideshow={addSong} />);
  expect(screen.getByRole('button', { name: 'T24', exact: true })).toBeInTheDocument();
  act(() => observers.at(-1).callback([{ isIntersecting: true }]));
  expect(screen.getByRole('button', { name: 'T30', exact: true })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Xem thêm bài hát' })).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('30 / 30');
});

test('supports manual loading without IntersectionObserver and resets after search and filters', () => {
  window.IntersectionObserver = undefined;
  render(<CollectionBrowser songs={songs} />);
  fireEvent.click(screen.getByRole('button', { name: 'Xem thêm bài hát' }));
  expect(screen.getByRole('button', { name: 'T24', exact: true })).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Tên bài hát...'), { target: { value: 'Song' } });
  expect(screen.queryByRole('button', { name: 'T13', exact: true })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Xem thêm bài hát' }));
  fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'D' } });
  expect(screen.getByRole('button', { name: 'T16', exact: true })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'T28', exact: true })).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('12 / 15');
  fireEvent.change(screen.getByPlaceholderText('Tên bài hát...'), { target: { value: 'missing song' } });
  expect(screen.getByRole('status')).toHaveTextContent('Không tìm thấy bài hát phù hợp.');
  expect(screen.queryByRole('button', { name: 'Xem thêm bài hát' })).not.toBeInTheDocument();
});
