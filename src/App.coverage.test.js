import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { loadSongLibrary } from './services/songLibrary';

jest.mock('./services/songLibrary', () => ({ loadSongLibrary: jest.fn() }));
jest.mock('./layouts/RootLayout', () => ({ mode, handleMode, palette, onPaletteChange, children }) => <main>
  <button onClick={() => handleMode((value) => !value)}>Toggle mode</button>
  <button onClick={() => handleMode(false)}>Set light</button>
  <button onClick={() => onPaletteChange('ocean')}>Set palette</button>
  <span data-testid="layout-state">{`${mode}:${palette}`}</span>{children}
</main>);
jest.mock('./pages/HomePage', () => ({ songLibraryState }) => <p data-testid="library-state">{`${songLibraryState.source}:${songLibraryState.isLoading}`}</p>);

const originalMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = originalMatchMedia; localStorage.clear(); document.documentElement.className = ''; });

test('loads songs and reflects explicit theme and palette preferences', async () => {
  localStorage.setItem('song-collections-theme', 'dark');
  localStorage.setItem('song-collections-palette', 'blue');
  loadSongLibrary.mockResolvedValue({ songs: [{ id: 'H1' }], source: 'remote', workbookUrl: 'book.xlsx' });
  const view = render(<App />);
  expect(screen.getByTestId('layout-state')).toHaveTextContent('true:blue');
  await waitFor(() => expect(screen.getByTestId('library-state')).toHaveTextContent('remote:false'));
  expect(document.documentElement).toHaveClass('dark-mode');
  fireEvent.click(screen.getByText('Set palette'));
  expect(localStorage.getItem('song-collections-palette')).toBe('ocean');
  fireEvent.click(screen.getByText('Toggle mode'));
  expect(document.documentElement).not.toHaveClass('dark-mode');
  fireEvent.click(screen.getByText('Set light'));
  view.unmount();
});

test('follows system color changes and ignores late song loads after unmount', async () => {
  let listener;
  const media = { matches: false, addEventListener: (_event, callback) => { listener = callback; }, removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(() => media);
  let resolveLoad;
  loadSongLibrary.mockReturnValue(new Promise((resolve) => { resolveLoad = resolve; }));
  const view = render(<App />);
  expect(screen.getByTestId('layout-state')).toHaveTextContent('false:church-logo');
  act(() => listener({ matches: true }));
  expect(document.documentElement).toHaveClass('dark-mode');
  view.unmount();
  await act(async () => resolveLoad({ songs: [], source: 'late' }));
});
