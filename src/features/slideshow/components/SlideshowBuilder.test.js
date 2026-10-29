import { fireEvent, render, screen, within } from '@testing-library/react';
import SlideshowBuilder from './SlideshowBuilder';

const originalScrollTo = window.scrollTo;
beforeEach(() => { window.scrollTo = jest.fn(); });
afterEach(() => { window.scrollTo = originalScrollTo; });

const songLibrary = [
  { id: 'H18', songName: 'Thi Thiên 150', tone: 'Em', timeSignature: '4/4', tempo: 98 },
  { id: 'T1', songName: 'Xin Thần Linh Đến', tone: 'G', timeSignature: '2/4' },
  { id: 'T2', songName: 'Trọn Cả Tấm Lòng', tone: 'C', timeSignature: '6/8' },
];
const list = { name: 'Chủ nhật', ids: ['H18', 'T1'], draft: 'H18, T1',
  codesLabel: 'H18, T1', songs: [{ ...songLibrary[0], tone: 'Dm' }, songLibrary[1]], isNewest: true };

test('clicking a folder shows names, performed tones and Nhịp, then allows editing', () => {
  const onUpdateList = jest.fn(() => ({ error: '' }));
  render(<SlideshowBuilder lists={[list]} newestListName={list.name} songLibrary={songLibrary} onUpdateList={onUpdateList} />);
  fireEvent.click(screen.getByRole('button', { name: /Chủ nhật/ }));
  const dialog = screen.getByRole('dialog', { name: 'Chủ nhật' });
  const row = within(dialog).getByRole('row', { name: /Thi Thiên 150/ });
  expect(within(row).getByText('Dm')).toBeInTheDocument();
  expect(within(row).getByText('4/4')).toBeInTheDocument();
  expect(within(dialog).getByRole('columnheader', { name: 'Nhịp' })).toBeInTheDocument();
  expect(within(dialog).queryByText('98 BPM')).not.toBeInTheDocument();
  const other = within(dialog).getByRole('row', { name: /Xin Thần Linh Đến/ });
  expect(within(other).getByText('2/4')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Mã bài hát' })).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Chỉnh sửa bộ bài hát' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Mã bài hát' }), { target: { value: 'H18, T1, T2' } });
  expect(screen.getByText('6/8')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
  expect(onUpdateList).toHaveBeenCalledWith(expect.objectContaining({ originalName: 'Chủ nhật', name: 'Chủ nhật', draft: 'H18, T1, T2' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('an empty folder remains editable and Escape closes the view', () => {
  render(<SlideshowBuilder lists={[{ ...list, ids: [], songs: [], draft: '', codesLabel: 'Chưa có bài' }]} newestListName={list.name} />);
  fireEvent.click(screen.getByRole('button', { name: /Chủ nhật/ }));
  expect(screen.getByText(/Thư mục chưa có bài hát/)).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('saves service details, song order, notes and a set-specific key', () => {
  const onUpdateList = jest.fn(() => ({ error: '' }));
  render(<SlideshowBuilder lists={[list]} newestListName={list.name} songLibrary={songLibrary} onUpdateList={onUpdateList} />);
  fireEvent.click(screen.getByRole('button', { name: /Chủ nhật/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa bộ bài hát' }));
  fireEvent.change(screen.getByLabelText('Ngày nhóm'), { target: { value: '2026-11-01' } });
  fireEvent.change(screen.getByLabelText('Buổi nhóm / ban hát'), { target: { value: 'Ban hát sáng' } });
  fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'ready' } });
  fireEvent.change(screen.getByLabelText('Ghi chú H18'), { target: { value: 'Câu 1, điệp khúc hai lần' } });
  fireEvent.change(screen.getByLabelText('Tone H18'), { target: { value: 'Am' } });
  fireEvent.click(screen.getByRole('button', { name: 'Đưa H18 xuống' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
  expect(onUpdateList).toHaveBeenCalledWith(expect.objectContaining({
    draft: 'T1, H18', serviceDate: '2026-11-01', service: 'Ban hát sáng', status: 'ready',
    songNotes: { H18: 'Câu 1, điệp khúc hai lần' }, chordPreferences: { H18: { sourceKey: 'Em', targetKey: 'Am' } },
  }));
  expect(songLibrary[0].tone).toBe('Em');
});
