import { fireEvent, render, screen } from '@testing-library/react';
import Popup from './Popup';

const pages = 'https://example.com/one.png,https://example.com/two.png,https://example.com/three.png';

test('renders no modal when closed and an empty state when no sheet exists', () => {
  const { container, rerender } = render(<Popup image="" trigger={false} setTrigger={jest.fn()} />);
  expect(container).toBeEmptyDOMElement();
  rerender(<Popup image="" trigger setTrigger={jest.fn()} />);
  expect(screen.getByText('No Sheet available')).toBeInTheDocument();
});

test('navigates pages with buttons and keyboard while keeping clicks inside open', () => {
  const setTrigger = jest.fn();
  render(<Popup image={pages} trigger setTrigger={setTrigger} />);
  const track = document.querySelector('.sheet-track');
  expect(track).toHaveStyle({ transform: 'translateX(-0%)' });
  fireEvent.click(screen.getByRole('button', { name: 'Next sheet page' }));
  expect(track).toHaveStyle({ transform: 'translateX(-100%)' });
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  expect(track).toHaveStyle({ transform: 'translateX(-200%)' });
  fireEvent.keyDown(window, { key: 'ArrowLeft' });
  expect(track).toHaveStyle({ transform: 'translateX(-100%)' });
  fireEvent.click(document.querySelector('.popup-sheet'));
  expect(setTrigger).not.toHaveBeenCalled();
  fireEvent.click(document.querySelector('.popup-sheet-overlay'));
  expect(setTrigger).toHaveBeenCalledWith(false);
});

test('supports swipe navigation only when the gesture is unzoomed and horizontal', () => {
  render(<Popup image={pages} trigger setTrigger={jest.fn()} />);
  const carousel = document.querySelector('.sheet-carousel');
  const track = document.querySelector('.sheet-track');
  fireEvent.touchStart(carousel, { touches: [{ clientX: 300 }] });
  fireEvent.touchEnd(carousel, { touches: [], changedTouches: [{ clientX: 200 }] });
  expect(track).toHaveStyle({ transform: 'translateX(-100%)' });
  fireEvent.touchStart(carousel, { touches: [{ clientX: 200 }, { clientX: 210 }] });
  fireEvent.touchEnd(carousel, { touches: [], changedTouches: [{ clientX: 100 }] });
  expect(track).toHaveStyle({ transform: 'translateX(-100%)' });
  fireEvent.touchStart(carousel, { touches: [{ clientX: 200 }] });
  fireEvent.touchEnd(carousel, { touches: [], changedTouches: [{ clientX: 300 }] });
  expect(track).toHaveStyle({ transform: 'translateX(-0%)' });
});

test('shows two sheets together on desktop and does not show navigation for a single sheet', () => {
  const { rerender } = render(<Popup image={pages.split(',').slice(0, 2).join(',')} trigger setTrigger={jest.fn()} />);
  expect(document.querySelector('.popup-sheet-dual')).toBeInTheDocument();
  expect(document.querySelectorAll('.sheet-desktop-page')).toHaveLength(2);
  rerender(<Popup image="https://example.com/one.png" trigger setTrigger={jest.fn()} />);
  expect(document.querySelector('.popup-sheet-carousel')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Next sheet page' })).not.toBeInTheDocument();
});

test('closes on Escape and cleans up the body scroll lock', () => {
  const setTrigger = jest.fn();
  render(<Popup image={pages} trigger setTrigger={setTrigger} />);
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(setTrigger).toHaveBeenCalledWith(false);
});
