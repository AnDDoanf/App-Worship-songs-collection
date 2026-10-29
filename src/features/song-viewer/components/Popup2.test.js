import { fireEvent, render, screen } from '@testing-library/react';
import Popup2 from './Popup2';
import { readChordPreferences } from '../../../store/chordPreferences';
import { copyTextToClipboard } from '../../../utils/clipboard';

jest.mock('../../../utils/clipboard', () => ({ copyTextToClipboard: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../services/data/localSongSources', () => ({ LOCAL_SONG_SOURCES: [] }));
beforeEach(() => { window.scrollTo = jest.fn(); });

test('chosen key updates preview and copy, persists on reopen, and resets', () => {
  localStorage.clear();
  const props = { lyric: '[Em]Ngợi [B7]Chúa', tone: 'Em', songId: 'H18', trigger: true, setTrigger: jest.fn() };
  const { rerender } = render(<Popup2 {...props} />);
  expect(screen.getByTestId('popup-original-key')).toHaveTextContent('Em');
  expect(screen.queryByRole('textbox', { name: /tông gốc/i })).toBeNull();
  fireEvent.change(screen.getByLabelText('Chuyển sang tông'), { target: { value: 'Dm' } });
  expect(screen.getByText('Dm', { selector: '.chord-symbol' })).toBeInTheDocument();
  expect(screen.getByText('A7', { selector: '.chord-symbol' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Sao chép lời' }));
  expect(copyTextToClipboard).toHaveBeenCalledWith('[Dm]Ngợi [A7]Chúa');
  expect(readChordPreferences().H18.targetKey).toBe('Dm');
  rerender(<Popup2 {...props} trigger={false} />);
  rerender(<Popup2 {...props} />);
  expect(screen.getByLabelText('Chuyển sang tông')).toHaveValue('Dm');
  fireEvent.click(screen.getByRole('button', { name: 'Sửa lời' }));
  fireEvent.change(screen.getByLabelText('Lời và hợp âm'), { target: { value: '[Dm]Sửa [A7]lời' } });
  expect(screen.getByTestId('popup-original-key')).toHaveTextContent('Em');
  fireEvent.change(screen.getByLabelText('Chuyển sang tông'), { target: { value: 'Em' } });
  expect(screen.getByLabelText('Lời và hợp âm')).toHaveValue('[Em]Sửa [B7]lời');
  fireEvent.click(screen.getByRole('button', { name: 'Khôi phục bản gốc' }));
  expect(screen.getByLabelText('Lời và hợp âm')).toHaveValue(props.lyric);
  expect(readChordPreferences().H18).toBeUndefined();
});

test('preserves the reading mode when moving to another song', () => {
  localStorage.clear();
  const props = { lyric: '[C]Ca ngợi Chúa', tone: 'C', songId: 'T1', trigger: true, setTrigger: jest.fn() };
  const view = render(<Popup2 {...props} />);
  fireEvent.click(screen.getByRole('tab', { name: 'Lời bài hát' }));
  expect(screen.getByText('Ca ngợi Chúa')).toBeInTheDocument();
  expect(document.querySelector('.chord-symbol')).toBeNull();
  view.rerender(<Popup2 {...props} songId="T2" tone="D" lyric="[D]Lời mới" />);
  expect(screen.getByRole('tab', { name: 'Lời bài hát' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('Lời mới')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Bản nhạc' }));
  expect(screen.getByText('Chưa có bản nhạc cho bài hát này.')).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Bản nhạc' }), { key: 'ArrowLeft' });
  expect(screen.getByRole('tab', { name: 'Hợp âm' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Hợp âm' })).toHaveFocus();
});
