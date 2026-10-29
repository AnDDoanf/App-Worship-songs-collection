import { fireEvent, render, screen } from '@testing-library/react';
import SetPickerModal from './SetPickerModal';

beforeEach(() => { window.scrollTo = jest.fn(); });
const song = { id: 'H18', songName: 'Thi Thiên 150' };
const lists = [{ name: 'Sáng', ids: [] }, { name: 'Chiều', ids: ['H18'] }];
test('shows existing sets, prevents duplicates and keeps the three-second Undo toast', () => {
  const undo = jest.fn();
  const select = jest.fn(() => ({ added: true, undo }));
  const notify = jest.fn();
  const close = jest.fn();
  render(<SetPickerModal song={song} lists={lists} activeListName="Sáng" onSelect={select} onClose={close} onNotify={notify} />);
  expect(screen.getByRole('button', { name: 'Chiều: đã có H18' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Thêm vào Sáng' }));
  expect(select).toHaveBeenCalledWith('Sáng');
  expect(notify.mock.calls[0][1]).toMatchObject({ duration: 3000, action: { label: 'Hoàn tác', onClick: undo } });
  expect(close).toHaveBeenCalled();
});
test('can create a new set directly from the picker', () => {
  const create = jest.fn(() => ({ added: true }));
  render(<SetPickerModal song={song} lists={lists} onClose={jest.fn()} onCreate={create} />);
  fireEvent.change(screen.getByLabelText('Hoặc tạo bộ mới'), { target: { value: 'Chúa nhật' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo và thêm' }));
  expect(create).toHaveBeenCalledWith('Chúa nhật');
});
