import { fireEvent, render, screen } from '@testing-library/react';
import Popup2 from './Popup2';
import { readChordPreferences } from '../../../store/chordPreferences';
import { copyTextToClipboard } from '../../../utils/clipboard';

jest.mock('../../../utils/clipboard', () => ({ copyTextToClipboard: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../services/data/localSongSources', () => ({ LOCAL_SONG_SOURCES: [] }));

test('chosen key updates preview and copy, persists on reopen, and resets', () => {
  localStorage.clear();
  const props = { lyric: '[Em]Ngợi [B7]Chúa', tone: 'Em', songId: 'H18', trigger: true, setTrigger: jest.fn() };
  const { rerender } = render(<Popup2 {...props} />);
  expect(screen.getByTestId('popup-original-key')).toHaveTextContent('Em');
  expect(screen.queryByRole('textbox', { name: /tông gốc/i })).toBeNull();
  fireEvent.change(screen.getByLabelText('Chuyển sang tông'), { target: { value: 'Dm' } });
  expect(screen.getByText('[Dm]Ngợi [A7]Chúa')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Copy'));
  expect(copyTextToClipboard).toHaveBeenCalledWith('[Dm]Ngợi [A7]Chúa');
  expect(readChordPreferences().H18.targetKey).toBe('Dm');
  rerender(<Popup2 {...props} trigger={false} />);
  rerender(<Popup2 {...props} />);
  expect(screen.getByLabelText('Chuyển sang tông')).toHaveValue('Dm');
  fireEvent.click(screen.getByText('Sửa lời'));
  fireEvent.change(screen.getByLabelText('Lời và hợp âm'), { target: { value: '[Dm]Sửa [A7]lời' } });
  expect(screen.getByTestId('popup-original-key')).toHaveTextContent('Em');
  fireEvent.change(screen.getByLabelText('Chuyển sang tông'), { target: { value: 'Em' } });
  expect(screen.getByLabelText('Lời và hợp âm')).toHaveValue('[Em]Sửa [B7]lời');
  fireEvent.click(screen.getByText('Reset'));
  expect(screen.getByLabelText('Lời và hợp âm')).toHaveValue(props.lyric);
  expect(readChordPreferences().H18).toBeUndefined();
});
