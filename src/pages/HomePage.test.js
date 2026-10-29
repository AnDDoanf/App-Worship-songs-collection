import { act, fireEvent, render, screen } from '@testing-library/react';
import HomePage from './HomePage';
import { saveChordPreference } from '../store/chordPreferences';
import { STORAGE_KEY } from '../store/slideshowStore';

let mockAddResult;

jest.mock('../features/collections/views/HosannaCollection', () => ({ onAddToSlideshow, onRequestAddToSet, onOpenReader }) => <>
  <button onClick={() => { mockAddResult = onAddToSlideshow('H18'); }}>Add song</button>
  <button onClick={() => onAddToSlideshow('H19')}>Add another song</button>
  <button onClick={() => onRequestAddToSet('H18')}>Choose set</button>
  <button onClick={() => onOpenReader('H18', 'lyrics')}>Open reader</button>
</>);
jest.mock('../features/collections/views/TVCHHCollection', () => () => null);
jest.mock('../features/collections/views/TCXCollection', () => () => null);
jest.mock('../features/collections/views/BaihattudoCollection', () => () => null);
jest.mock('../features/slideshow/components/LyricsQueueModal', () => ({ songs, trigger }) =>
  trigger ? <p>{songs[0]?.lyric}</p> : null);
jest.mock('../features/recommendations/SongRecommendationsPanel', () => ({ songs, onRequestAddToSet, onSelectList, onAdd, onPreview }) => <div>
  <button onClick={() => onRequestAddToSet(songs[0]?.id || 'H18')}>Request recommendation set</button>
  <button onClick={() => onSelectList('Selected')}>Select recommendation list</button>
  <button onClick={() => onAdd(songs[0]?.id || 'H18', 'Selected')}>Add recommendation</button>
  <button onClick={() => onPreview(songs[0] || { id: 'H18', lyric: '' })}>Preview recommendation</button>
</div>);
jest.mock('../features/slideshow/components/SlideshowBuilder', () => ({ lists, onOpenSlideshow, onUpdateList, onCreateList, onDeleteList, onDuplicateList, onImportLists, onOpenLyricsProjection, onExportLists }) => <>
  <button onClick={() => onOpenSlideshow(lists[0].name)}>Open sheet</button>
  <button onClick={() => onCreateList({ name: 'Created', draft: 'H18' })}>Create valid list</button>
  <button onClick={() => onCreateList({ name: 'Missing', draft: 'NOPE' })}>Create invalid list</button>
  <button onClick={() => onCreateList({ name: '   ', draft: '' })}>Create empty list</button>
  <button onClick={() => onCreateList({ name: '__proto__', draft: '' })}>Create unsafe list</button>
  <button onClick={() => onCreateList({ name: lists[0].name, draft: '' })}>Create duplicate name</button>
  <button onClick={() => onUpdateList({ originalName: lists[0].name, name: 'Renamed', draft: 'H18' })}>Rename</button>
  <button onClick={() => onUpdateList({ originalName: lists[0].name, name: lists[1]?.name || lists[0].name, draft: '' })}>Rename duplicate</button>
  <button onClick={() => onUpdateList({ originalName: lists[0].name, name: lists[0].name, draft: '', serviceDate: '2026-01-01', service: 'Sunday', status: 'ready', songNotes: { H18: 'Solo' } })}>Update metadata</button>
  <button onClick={() => onDeleteList(lists[0].name)}>Delete list</button>
  <button onClick={() => onDeleteList('missing')}>Delete missing</button>
  <button onClick={() => onDuplicateList(lists[0].name)}>Duplicate list</button>
  <button onClick={() => onImportLists(JSON.stringify({ format: 'worship-setlists', version: 1, state: { activeListName: 'Imported', lists: { Imported: { ids: ['H18'], draft: 'H18' } } } }))}>Import lists</button>
  <button onClick={() => onExportLists()}>Export lists</button>
  <button onClick={() => onOpenLyricsProjection(lists[0].name)}>Open projection</button>
</>);
jest.mock('../features/song-viewer/components/Popup2', () => ({ trigger, songId, onPrevious, onNext, onAdd, setTrigger, isSetView }) => trigger ? <div className={`popup-lyric workspace-reader-sheet ${isSetView ? 'workspace-set-view' : ''}`} role="dialog" aria-label="reader-mock">
  <span>{songId}</span><button onClick={onPrevious}>Previous reader song</button><button onClick={onNext}>Next reader song</button><button onClick={onAdd}>Add from reader</button><button onClick={() => setTrigger(false)}>Close reader</button>
</div> : null);

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
  fireEvent.click(screen.getByText('Open sheet'));
  expect(document.querySelector('.workspace-reader-sheet')).toBeInTheDocument();
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

test('validates list definitions and persists valid creates, imports, duplicates, and deletes', () => {
  localStorage.clear();
  render(<HomePage songLibraryState={{ songs: [{ id: 'H18', songName: 'Song', tone: 'D', lyric: '[D]Praise', sourceCollectionKey: 'hosanna' }], isLoading: false }} />);
  fireEvent.click(screen.getByText('Create invalid list'));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists.Missing).toBeUndefined();
  fireEvent.click(screen.getByText('Create valid list'));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists.Created.ids).toEqual(['H18']);
  fireEvent.click(screen.getByText('Duplicate list'));
  expect(Object.keys(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists).length).toBeGreaterThan(2);
  fireEvent.click(screen.getByText('Import lists'));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists.Imported.ids).toEqual(['H18']);
  fireEvent.click(screen.getByText('Delete list'));
  expect(Object.keys(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists).length).toBeGreaterThan(1);
});

test('opens a song from a direct link after the library has loaded', () => {
  localStorage.clear();
  window.history.replaceState({}, '', '/?song=H18');
  render(<HomePage songLibraryState={{ songs: [{ id: 'H18', songName: 'Linked song', tone: 'D', lyric: '[D]Praise', sourceCollectionKey: 'hosanna' }], isLoading: false }} />);
  expect(document.querySelector('.popup-lyric')).toBeInTheDocument();
  window.history.replaceState({}, '', '/');
});

test('handles list validation, metadata, empty deletion, and missing list actions', () => {
  localStorage.clear();
  render(<HomePage songLibraryState={{ songs: [{ id: 'H18', tone: 'D', lyric: '[D]Praise', sourceCollectionKey: 'hosanna' }], isLoading: false }} />);
  fireEvent.click(screen.getByText('Create empty list'));
  fireEvent.click(screen.getByText('Create unsafe list'));
  fireEvent.click(screen.getByText('Create duplicate name'));
  fireEvent.click(screen.getByText('Rename duplicate'));
  fireEvent.click(screen.getByText('Update metadata'));
  fireEvent.click(screen.getByText('Delete missing'));
  const state = JSON.parse(localStorage.getItem(STORAGE_KEY));
  const updated = Object.values(state.lists).find((list) => list.service === 'Sunday');
  expect(updated.serviceDate).toBe('2026-01-01');
  expect(Object.keys(state.lists)).toHaveLength(1);
});

test('opens a reader from the collection and navigates songs within its scope', () => {
  localStorage.clear();
  render(<HomePage songLibraryState={{ songs: [
    { id: 'H18', songName: 'One', tone: 'D', lyric: '[D]one', sourceCollectionKey: 'hosanna' },
    { id: 'H19', songName: 'Two', tone: 'C', lyric: '[C]two', sourceCollectionKey: 'hosanna' },
  ], isLoading: false }} />);
  fireEvent.click(screen.getByText('Open reader'));
  expect(screen.getByRole('dialog', { name: 'reader-mock' })).toHaveTextContent('H18');
  fireEvent.click(screen.getByText('Next reader song'));
  expect(screen.getByRole('dialog', { name: 'reader-mock' })).toHaveTextContent('H19');
  fireEvent.click(screen.getByText('Previous reader song'));
  expect(screen.getByRole('dialog', { name: 'reader-mock' })).toHaveTextContent('H18');
  fireEvent.click(screen.getByText('Add from reader'));
  expect(document.querySelector('.set-picker')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Close reader'));
  expect(screen.queryByRole('dialog', { name: 'reader-mock' })).not.toBeInTheDocument();
});

test('shows loading and fallback states and updates active collection from search and tabs', () => {
  localStorage.clear();
  const { rerender } = render(<HomePage songLibraryState={{ songs: [], isLoading: true }} />);
  expect(document.querySelector('.data-source-banner-warning')).not.toBeInTheDocument();
  rerender(<HomePage songLibraryState={{ songs: [], isLoading: false, source: 'fallback' }} />);
  expect(document.querySelector('.data-source-banner-warning')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'praise' } });
  expect(document.querySelector('.collection-menu .menu-item.active')).toHaveAttribute('aria-selected', 'true');
  fireEvent.change(document.getElementById('collection-menu-mobile'), { target: { value: '4' } });
  expect(document.querySelector('.collection-menu .menu-item.active')).toHaveAttribute('aria-selected', 'true');
});

test('imports valid songs from shared links, skips missing IDs, and opens the first sheet', () => {
  localStorage.clear();
  window.history.replaceState({}, '', '/share?name=Shared&songs=H18%7CH19%7CNOPE%7CH18');
  render(<HomePage songLibraryState={{ songs: [
    { id: 'H18', songName: 'One', tone: 'C', lyric: '[C]one', image: 'https://example.com/one.png', sourceCollectionKey: 'hosanna' },
    { id: 'H19', songName: 'Two', tone: 'D', lyric: '[D]two', image: 'https://example.com/two.png', sourceCollectionKey: 'hosanna' },
  ], isLoading: false }} />);
  const imported = JSON.parse(localStorage.getItem(STORAGE_KEY));
  expect(imported.lists.Shared.ids).toEqual(['H18', 'H19']);
  expect(document.querySelector('.workspace-reader-sheet')).toBeInTheDocument();
  expect(document.querySelector('.workspace-set-view')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/');
  window.history.replaceState({}, '', '/');
});

test('ignores loading share links, warns when no shared song exists, and handles missing direct song links', () => {
  localStorage.clear();
  window.history.replaceState({}, '', '/share?name=Empty&songs=NOPE');
  const view = render(<HomePage songLibraryState={{ songs: [], isLoading: true }} />);
  expect(window.location.pathname).toBe('/share');
  view.rerender(<HomePage songLibraryState={{ songs: [], isLoading: false }} />);
  expect(window.location.pathname).toBe('/');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists.Empty).toBeUndefined();
  view.unmount();
  window.history.replaceState({}, '', '/?song=NOPE');
  render(<HomePage songLibraryState={{ songs: [], isLoading: false }} />);
  expect(document.querySelector('.popup-lyric')).not.toBeInTheDocument();
  window.history.replaceState({}, '', '/');
});

test('submits search, toggles topic chips, and opens recommendation previews', () => {
  localStorage.clear();
  const songs = [{ id: 'H18', songName: 'One', tone: 'C', lyric: '[C]one', sourceCollectionKey: 'hosanna' }];
  render(<HomePage songLibraryState={{ songs, isLoading: false }} />);
  const heading = document.getElementById('song-results-heading');
  heading.scrollIntoView = jest.fn(); heading.focus = jest.fn();
  window.matchMedia = jest.fn(() => ({ matches: true }));
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'one' } });
  fireEvent.submit(screen.getByRole('search'));
  expect(heading.focus).toHaveBeenCalled();
  expect(heading.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  fireEvent.click(screen.getByText('Preview recommendation'));
  expect(screen.getByRole('dialog', { name: 'reader-mock' })).toHaveTextContent('H18');
});
