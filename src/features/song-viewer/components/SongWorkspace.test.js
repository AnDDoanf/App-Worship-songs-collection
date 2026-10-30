import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SongWorkspace from './SongWorkspace';

function renderWorkspace(overrides = {}) {
  const setTrigger = jest.fn();
  const onNotify = jest.fn();
  const props = { lyric: '[C]Praise the [G]Lord', tone: 'C', songId: 'H18', songName: 'Praise', trigger: true, setTrigger, onNotify, ...overrides };
  const view = render(<SongWorkspace {...props} />);
  return { ...view, props, setTrigger, onNotify };
}

const originalMatchMedia = window.matchMedia;
beforeEach(() => localStorage.clear());
afterEach(() => { window.matchMedia = originalMatchMedia; });

test('switches reader tabs with keyboard and edits, transposes, restores, and copies lyrics', async () => {
  const { onNotify } = renderWorkspace();
  const tabs = document.querySelectorAll('[role="tab"]');
  tabs[0].focus();
  fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
  expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'D' } });
  fireEvent.click(screen.getByRole('button', { name: /Sá»­a lá»i|Sửa lời/i }));
  const editor = screen.getByRole('textbox');
  fireEvent.change(editor, { target: { value: '[D]Edited lyric' } });
  expect(localStorage.getItem('song-collections-chord-preferences')).toContain('Edited lyric');
  fireEvent.click(screen.getByRole('button', { name: /KhÃ´i phá»¥c|Khôi phục/i }));
  expect(screen.getByRole('textbox')).toHaveValue('[C]Praise the [G]Lord');
  fireEvent.click(screen.getByRole('button', { name: /Sao chÃ©p|Sao chép/i }));
  await waitFor(() => expect(onNotify).toHaveBeenCalled());
});

test('navigates sheet pages before adjacent songs and supports add, close, and escape', () => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 });
  window.matchMedia = jest.fn((query) => ({ matches: query.includes('max-width: 560px'), addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  const onPrevious = jest.fn(); const onNext = jest.fn(); const onAdd = jest.fn(); const setTrigger = jest.fn();
  renderWorkspace({ initialView: 'sheet', image: 'https://example.com/one.png,https://example.com/two.png', onPrevious, onNext, onAdd, setTrigger });
  fireEvent.click(document.querySelector('[role="tab"][id$="-sheet"]'));
  const sheetButtons = () => document.querySelectorAll('.workspace-page-controls button');
  fireEvent.click(sheetButtons()[1]);
  expect(screen.getAllByRole('img', { name: /page 2/i }).length).toBeGreaterThan(0);
  fireEvent.click(document.querySelector('.workspace-song-navigation button:last-child'));
  expect(onNext).toHaveBeenCalledTimes(1);
  fireEvent.click(sheetButtons()[0]);
  expect(screen.getAllByRole('img', { name: /page 1/i }).length).toBeGreaterThan(0);
  fireEvent.keyDown(window, { key: 'ArrowLeft' });
  expect(onPrevious).toHaveBeenCalledTimes(1);
  fireEvent.click(document.querySelector('[role="tab"][id$="-chords"]'));
  fireEvent.click(screen.getByRole('button', { name: 'Thêm vào bộ' }));
  expect(onAdd).toHaveBeenCalled();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(setTrigger).toHaveBeenCalledWith(false);
});

test('swipes horizontally to navigate pages and adjacent songs', () => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 });
  window.matchMedia = jest.fn((query) => ({ matches: query.includes('max-width: 560px'), addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  const onPrevious = jest.fn(); const onNext = jest.fn();
  renderWorkspace({ initialView: 'sheet', image: 'https://example.com/one.png,https://example.com/two.png', onPrevious, onNext });
  fireEvent.click(screen.getByRole('tab', { name: /Báº£n nháº¡c/i }));
  const panel = screen.getByRole('tabpanel');
  fireEvent.touchStart(panel, { touches: [{ clientX: 300, clientY: 120 }] });
  fireEvent.touchEnd(panel, { changedTouches: [{ clientX: 220, clientY: 125 }] });
  expect(screen.getAllByRole('img', { name: /page 2/i }).length).toBeGreaterThan(0);
  fireEvent.touchStart(panel, { touches: [{ clientX: 220, clientY: 120 }] });
  fireEvent.touchEnd(panel, { changedTouches: [{ clientX: 150, clientY: 122 }] });
  expect(onNext).toHaveBeenCalledTimes(1);
  fireEvent.touchStart(panel, { touches: [{ clientX: 120, clientY: 120 }] });
  fireEvent.touchEnd(panel, { changedTouches: [{ clientX: 200, clientY: 122 }] });
  expect(screen.getAllByRole('img', { name: /page 1/i }).length).toBeGreaterThan(0);
  fireEvent.touchStart(panel, { touches: [{ clientX: 200, clientY: 120 }] });
  fireEvent.touchEnd(panel, { changedTouches: [{ clientX: 270, clientY: 121 }] });
  expect(onPrevious).toHaveBeenCalledTimes(1);
});

test('supports paired sheet presentation and hides the subject in set view', () => {
  renderWorkspace({ initialView: 'sheet', image: 'https://example.com/one.png', category: 'Praise', isSetView: true,
    pairedSheetSong: { id: 'H19', songName: 'Second song', tone: 'D', lyric: '[D]Amen', timeSignature: '3/4' } });
  expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('Second song');
  expect(screen.queryByText('Praise', { selector: '.workspace-subject-chip' })).not.toBeInTheDocument();
  expect(document.querySelector('.workspace-set-view')).toBeInTheDocument();
});

test('copies lyrics view without chords and reports empty content', async () => {
  const onNotify = jest.fn();
  const view = renderWorkspace({ initialView: 'lyrics', lyric: '[C]Praise', onNotify });
  fireEvent.click(screen.getByRole('button', { name: /Sao chép lời/i }));
  await waitFor(() => expect(onNotify).toHaveBeenCalled());
  view.unmount();
  const empty = renderWorkspace({ songId: 'H19', lyric: '' });
  fireEvent.click(screen.getByRole('button', { name: /Sao chép lời/i }));
  expect(empty.onNotify).toHaveBeenCalled();
});
