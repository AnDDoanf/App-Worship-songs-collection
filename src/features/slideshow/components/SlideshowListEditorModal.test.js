import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SlideshowListEditorModal from './SlideshowListEditorModal';

const songs = [
  { id: 'H18', songName: 'First song', lyric: '[Em]Praise', tone: 'Em', timeSignature: '4/4' },
  { id: 'H19', songName: 'Second song', lyric: '[C]Glory', tone: 'C', timeSignature: '3/4' },
];

function renderEditor(overrides = {}) {
  const props = {
    trigger: true, mode: 'create', originalName: '', initialName: '', initialDraft: '',
    songs, setTrigger: jest.fn(), onCreateList: jest.fn(() => ({ error: '' })),
    onUpdateList: jest.fn(() => ({ error: '' })), onDeleteList: jest.fn(() => ({ error: '' })),
    onDuplicateList: jest.fn(() => ({ error: '' })), ...overrides,
  };
  return { ...render(<SlideshowListEditorModal {...props} />), props };
}

test('creates a list with edited name, schedule, status, notes, and song order', () => {
  const { props } = renderEditor({ initialDraft: 'H18, H19' });
  const name = document.querySelector('.popup-list-editor input[type="text"]');
  fireEvent.change(name, { target: { value: 'Sunday set' } });
  const fields = document.querySelectorAll('.set-details-fields input');
  fireEvent.change(fields[0], { target: { value: '2026-11-01' } });
  fireEvent.change(fields[1], { target: { value: 'Morning worship' } });
  fireEvent.change(document.querySelector('.set-details-fields select'), { target: { value: 'ready' } });
  fireEvent.change(document.querySelector('input[aria-label*="H18"]'), { target: { value: 'Verse one' } });
  fireEvent.click(document.querySelector('.set-reorder-actions button:not(:disabled)'));
  expect(document.querySelector('.popup-list-editor-textarea')).toHaveValue('H19, H18');
  fireEvent.click(document.querySelector('.popup-list-editor-actions button:last-child'));
  expect(props.onCreateList).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Sunday set', draft: 'H19, H18', serviceDate: '2026-11-01', service: 'Morning worship', status: 'ready',
    songNotes: expect.objectContaining({ H18: 'Verse one' }),
  }));
  expect(props.setTrigger).toHaveBeenCalledWith(false);
});

test('keeps the editor open and shows validation errors when save fails', () => {
  const onNotify = jest.fn();
  const { props } = renderEditor({ onCreateList: jest.fn(() => ({ error: 'Invalid song code' })), onNotify });
  fireEvent.change(document.querySelector('.popup-list-editor input[type="text"]'), { target: { value: 'Set' } });
  fireEvent.change(document.querySelector('.popup-list-editor-textarea'), { target: { value: 'NOPE' } });
  fireEvent.click(document.querySelector('.popup-list-editor-actions button:last-child'));
  expect(document.querySelector('.slideshow-error')).toHaveTextContent('Invalid song code');
  expect(props.setTrigger).not.toHaveBeenCalled();
  expect(onNotify).toHaveBeenCalled();
});

test('views a set, duplicates it, and can switch the view into edit mode', () => {
  const { props } = renderEditor({
    mode: 'view', originalName: 'Worship', initialName: 'Worship', initialDraft: 'H18, H19',
    initialDetails: { service: 'Sunday', status: 'ready', songNotes: { H18: 'Verse one' } },
    listSongs: songs,
  });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(document.querySelector('.set-service-summary')).toHaveTextContent('Sunday');
  expect(document.querySelector('.set-song-note')).toHaveTextContent('Verse one');
  fireEvent.click(document.querySelector('.popup-list-editor-actions button:first-child'));
  expect(props.onDuplicateList).toHaveBeenCalledWith('Worship');
  expect(props.setTrigger).toHaveBeenCalledWith(false);
  props.setTrigger.mockClear();
  fireEvent.click(document.querySelector('.popup-list-editor-actions button:last-child'));
  expect(document.querySelector('.popup-list-editor-textarea')).toBeInTheDocument();
});

test('keeps the set open when duplicate or delete operations return an error', () => {
  const onDuplicateList = jest.fn(() => ({ error: 'Duplicate failed' }));
  const onDeleteList = jest.fn(() => ({ error: 'Delete failed' }));
  const { props } = renderEditor({ mode: 'view', originalName: 'Set', initialName: 'Set', initialDraft: 'H18', listSongs: songs, onDuplicateList, onDeleteList });
  fireEvent.click(document.querySelector('.popup-list-editor-actions button:first-child'));
  expect(onDuplicateList).toHaveBeenCalled();
  fireEvent.click(document.querySelector('.popup-list-editor-actions button:last-child'));
  fireEvent.click(document.querySelector('.slideshow-list-editor-delete'));
  expect(document.querySelector('.slideshow-error')).toHaveTextContent('Delete failed');
  expect(props.setTrigger).not.toHaveBeenCalled();
});

test('previews songs and navigates between previews', async () => {
  renderEditor({ mode: 'view', originalName: 'Set', initialName: 'Set', initialDraft: 'H18, H19', listSongs: songs });
  fireEvent.click(screen.getByRole('button', { name: 'First song' }));
  await waitFor(() => expect(document.querySelector('.workspace-dialog')).toBeInTheDocument());
  fireEvent.keyDown(window, { key: 'Escape' });
});

test('closes on backdrop, close control, and Escape when no song preview is open', () => {
  const { props, unmount } = renderEditor();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(props.setTrigger).toHaveBeenCalledWith(false);
  unmount();
  const second = renderEditor();
  fireEvent.click(document.querySelector('.popup-close-button'));
  expect(second.props.setTrigger).toHaveBeenCalledWith(false);
  second.unmount();
  const third = renderEditor();
  fireEvent.click(document.querySelector('.popup'));
  expect(third.props.setTrigger).toHaveBeenCalledWith(false);
});
