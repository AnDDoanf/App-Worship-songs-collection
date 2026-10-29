import { act, fireEvent, render, screen } from '@testing-library/react';
import HomePage from './HomePage';
import { saveChordPreference } from '../store/chordPreferences';
import { STORAGE_KEY } from '../store/slideshowStore';

let mockAddResult;

jest.mock('../features/collections/views/HosannaCollection', () => ({ onAddToSlideshow, onRequestAddToSet }) => <>
  <button onClick={() => { mockAddResult = onAddToSlideshow('H18'); }}>Add song</button>
  <button onClick={() => onAddToSlideshow('H19')}>Add another song</button>
  <button onClick={() => onRequestAddToSet('H18')}>Choose set</button>
</>);
jest.mock('../features/collections/views/TVCHHCollection', () => () => null);
jest.mock('../features/collections/views/TCXCollection', () => () => null);
jest.mock('../features/collections/views/BaihattudoCollection', () => () => null);
jest.mock('../features/slideshow/components/SheetSlideshowModal', () => () => null);
jest.mock('../features/slideshow/components/LyricsQueueModal', () => ({ songs, trigger }) =>
  trigger ? <p>{songs[0]?.lyric}</p> : null);
jest.mock('../features/slideshow/components/SlideshowBuilder', () => ({ lists, onOpenLyricsQueue, onUpdateList }) => <>
  <button onClick={() => onOpenLyricsQueue(lists[0].name)}>Open lyrics</button>
  <button onClick={() => onUpdateList({ originalName: lists[0].name, name: 'Renamed', draft: 'H18' })}>Rename</button>
</>);

test('adding captures the preferred key and list edits/reloads preserve it', () => {
  localStorage.clear();
  saveChordPreference('H18', { sourceKey: 'Em', targetKey: 'Dm' });
  const props = { songLibraryState: { songs: [{ id: 'H18', tone: 'Em', lyric: '[Em]Chúa [B7]con', sourceCollectionKey: 'hosanna' }], isLoading: false } };
  const view = render(<HomePage {...props} />);
  fireEvent.click(screen.getByText('Add song'));
  fireEvent.click(screen.getByText('Rename'));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists.Renamed.chordPreferences.H18.targetKey).toBe('Dm');
  view.unmount();
  saveChordPreference('H18', { sourceKey: 'Em', targetKey: 'Am' });
  render(<HomePage {...props} />);
  fireEvent.click(screen.getByText('Open lyrics'));
  expect(screen.getByText('[Dm]Chúa [A7]con')).toBeInTheDocument();
});

test('undo removes only the added song, keeping later additions and their preferences', () => {
  localStorage.clear();
  render(<HomePage songLibraryState={{ songs: [
    { id: 'H18', tone: 'Em', lyric: '[Em]Con', sourceCollectionKey: 'hosanna' },
    { id: 'H19', tone: 'C', lyric: '[C]Chúa', sourceCollectionKey: 'hosanna' },
  ], isLoading: false }} />);
  fireEvent.click(screen.getByText('Add song'));
  expect(mockAddResult.added).toBe(true);
  const undo = mockAddResult.undo;
  fireEvent.click(screen.getByText('Add another song'));
  act(() => undo());
  const list = Object.values(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists)[0];
  expect(list.ids).toEqual(['H19']);
  expect(list.draft).toBe('H19');
  expect(list.chordPreferences.H18).toBeUndefined();
  expect(list.chordPreferences.H19.targetKey).toBe('C');
  act(() => undo());
  expect(Object.values(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists)[0].ids).toEqual(['H19']);
});

test('discovery contains only live search and topic tags, with correct Vietnamese labels', () => {
  localStorage.clear();
  render(<HomePage songLibraryState={{ songs: [], isLoading: false }} />);
  expect(screen.getByLabelText('Tìm theo tên, mã bài hoặc lời bài hát')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Tìm bài' })).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox', { name: 'Thêm vào bộ bài hát' })).not.toBeInTheDocument();
});

test('choosing a set adds the song only after confirming its destination', () => {
  localStorage.clear(); window.scrollTo = jest.fn();
  render(<HomePage songLibraryState={{ songs: [{ id: 'H18', songName: 'Thi Thiên 150', tone: 'D', lyric: '[D]Ngợi khen', sourceCollectionKey: 'hosanna' }], isLoading: false }} />);
  fireEvent.click(screen.getByText('Choose set'));
  expect(screen.getByRole('dialog', { name: 'Chọn bộ bài hát' })).toBeInTheDocument();
  expect(Object.values(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists)[0].ids).toEqual([]);
  fireEvent.click(screen.getByRole('button', { name: 'Thêm vào Danh sách mặc định' }));
  expect(Object.values(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists)[0].ids).toEqual(['H18']);
  expect(screen.queryByRole('dialog', { name: 'Chọn bộ bài hát' })).not.toBeInTheDocument();
});
