import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import SheetPages from './SheetPages';

function StatefulPages(props) {
  const [page, setPage] = useState(0);
  return <SheetPages {...props} page={page} onPageChange={setPage} />;
}

test('shows an empty state when there are no sheet images', () => {
  render(<SheetPages image="" page={0} onPageChange={jest.fn()} />);
  expect(screen.getByText(/No sheet|bản nhạc/i)).toBeInTheDocument();
});

test('navigates sheet pages with controls and keyboard, then moves to adjacent songs', () => {
  const onPreviousSong = jest.fn();
  const onNextSong = jest.fn();
  render(<StatefulPages image="https://example.com/a.png,https://example.com/b.png" songName="Song" allowPageNavigation onPreviousSong={onPreviousSong} onNextSong={onNextSong} />);
  expect(screen.getAllByRole('img', { name: 'Song page 1' })[0]).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /tiếp theo/i }));
  expect(screen.getAllByRole('img', { name: 'Song page 2' })[0]).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  expect(onNextSong).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /trước/i }));
  expect(screen.getAllByRole('img', { name: 'Song page 1' })[0]).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'ArrowLeft' });
  expect(onPreviousSong).toHaveBeenCalled();
});

test('ignores page keyboard shortcuts while editing text controls', () => {
  const onNextSong = jest.fn();
  render(<SheetPages image="https://example.com/a.png" page={0} onPageChange={jest.fn()} allowPageNavigation onNextSong={onNextSong} />);
  const input = document.createElement('input');
  document.body.appendChild(input);
  fireEvent.keyDown(input, { key: 'ArrowRight' });
  expect(onNextSong).not.toHaveBeenCalled();
  input.remove();
});

test('pairs two pages from one song or one page from each adjacent song', () => {
  const { rerender } = render(<SheetPages image="https://example.com/a.png,https://example.com/b.png" songName="Song" page={0} onPageChange={jest.fn()} />);
  expect(document.querySelectorAll('.workspace-sheet-pair [role="img"]')).toHaveLength(2);
  rerender(<SheetPages image="https://example.com/a.png" songName="First" pairedSong={{ id: 'H2', songName: 'Second', image: 'https://example.com/b.png' }} page={0} onPageChange={jest.fn()} />);
  expect(screen.getByRole('img', { name: 'First' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Second' })).toBeInTheDocument();
});
