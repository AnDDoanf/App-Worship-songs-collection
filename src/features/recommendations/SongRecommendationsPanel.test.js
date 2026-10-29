import { fireEvent, render, screen, within } from '@testing-library/react';
import SongRecommendations from './SongRecommendationsPanel';

const songs = [
  { id: 'H1', songName: 'Khúc cảm tạ', category: 'Cảm tạ', tone: 'C', timeSignature: '4/4', lyric: '[C]Ca ngợi tình yêu biết ơn' },
  { id: 'H2', songName: 'Bài ca cảm tạ', category: 'Cảm tạ', tone: 'C', timeSignature: '4/4', lyric: '[C]Ca ngợi tình yêu biết ơn' },
  { id: 'T3', songName: 'Tình yêu thương', category: 'Cảm tạ', tone: 'G', timeSignature: '4/4', lyric: '[G]Ca ngợi tình yêu biết ơn' },
];
const lists = [{ name: 'Chủ nhật', ids: ['H1'], songs: [songs[0]] }, { name: 'Tối thứ tư', ids: [], songs: [] }];

test('recommends for the selected set and connects preview, add and list selection', () => {
  const undo = jest.fn();
  const onAdd = jest.fn(() => ({ added: true, undo }));
  const onNotify = jest.fn();
  const onPreview = jest.fn();
  const onSelectList = jest.fn();
  const view = render(<SongRecommendations songs={songs} lists={lists} activeListName="Chủ nhật"
    onAdd={onAdd} onNotify={onNotify} onPreview={onPreview} onSelectList={onSelectList} />);
  const toggle = screen.getByRole('button', { name: 'Gợi ý bài hát' });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('combobox', { name: 'Thêm vào bộ bài hát' })).not.toBeInTheDocument();
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const card = screen.getByRole('heading', { name: 'H2. Bài ca cảm tạ' }).closest('li');
  expect(within(card).getByText(/Cùng chủ đề/)).toBeInTheDocument();
  fireEvent.click(within(card).getByRole('button', { name: 'Xem trước H2' }));
  expect(onPreview).toHaveBeenCalledWith(songs[1]);
  fireEvent.click(within(card).getByRole('button', { name: 'Thêm gợi ý H2' }));
  expect(onAdd).toHaveBeenCalledWith('H2');
  expect(onNotify.mock.calls[0][1]).toMatchObject({ duration: 3000, action: { label: 'Hoàn tác', onClick: undo } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Thêm vào bộ bài hát' }), { target: { value: 'Tối thứ tư' } });
  expect(onSelectList).toHaveBeenCalledWith('Tối thứ tư');
  view.rerender(<SongRecommendations songs={songs} lists={[{ ...lists[0], ids: ['H1', 'H2'], songs: songs.slice(0, 2) }]} activeListName="Chủ nhật" />);
  expect(screen.queryByRole('button', { name: 'Thêm gợi ý H2' })).not.toBeInTheDocument();
});

test('supports a cold start through accent-insensitive song search', () => {
  render(<SongRecommendations songs={songs} lists={[lists[1]]} activeListName="Tối thứ tư" />);
  fireEvent.click(screen.getByRole('button', { name: 'Gợi ý bài hát' }));
  fireEvent.click(screen.getByRole('button', { name: 'Chọn một bài để khám phá' }));
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'khuc cam ta' } });
  fireEvent.click(screen.getByRole('button', { name: 'H1. Khúc cảm tạ' }));
  expect(screen.getByRole('heading', { name: 'H2. Bài ca cảm tạ' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Thêm gợi ý H1' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Gợi ý bài hát' }));
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Gợi ý bài hát' }));
  expect(screen.getByRole('searchbox')).toHaveValue('H1. Khúc cảm tạ');
  expect(screen.getByRole('heading', { name: 'H2. Bài ca cảm tạ' })).toBeInTheDocument();
});

test('shows loading and insufficient-data states without random suggestions', () => {
  const view = render(<SongRecommendations songs={[]} lists={lists} activeListName="Chủ nhật" isLoading />);
  fireEvent.click(screen.getByRole('button', { name: 'Gợi ý bài hát' }));
  expect(screen.getByRole('status')).toHaveTextContent('Đang chuẩn bị gợi ý');
  view.rerender(<SongRecommendations songs={[songs[0]]} lists={lists} activeListName="Chủ nhật" />);
  expect(screen.getByRole('status')).toHaveTextContent('Chưa đủ dữ liệu');
});

test('adding opens the set picker, while selecting a search seed still explores similar songs', () => {
  const request = jest.fn();
  const add = jest.fn();
  render(<SongRecommendations songs={songs} lists={lists} activeListName="Chủ nhật" onRequestAddToSet={request} onAdd={add} />);
  fireEvent.click(screen.getByRole('button', { name: 'Gợi ý bài hát' }));
  fireEvent.click(screen.getByRole('button', { name: 'Thêm gợi ý H2' }));
  expect(request).toHaveBeenCalledWith('H2');
  expect(add).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Bài tương tự' }));
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'H1' } });
  fireEvent.click(screen.getByRole('button', { name: 'H1. Khúc cảm tạ' }));
  expect(screen.getByRole('heading', { name: 'H2. Bài ca cảm tạ' })).toBeInTheDocument();
  expect(request).toHaveBeenCalledTimes(1);
});
