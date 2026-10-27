import { fireEvent, render, screen } from '@testing-library/react';
import HomePage from './HomePage';
import { saveChordPreference } from '../store/chordPreferences';
import { STORAGE_KEY } from '../store/slideshowStore';

jest.mock('../features/collections/views/HosannaCollection', () => ({ onAddToSlideshow }) =>
  <button onClick={() => onAddToSlideshow('H18')}>Add song</button>);
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
