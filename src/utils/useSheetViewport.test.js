import { useRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { useSheetViewport } from './useSheetViewport';

function Sheet({ isOpen = true }) {
  const ref = useRef(null);
  useSheetViewport(ref, isOpen);
  return isOpen ? <div ref={ref} data-testid="sheet" /> : null;
}

const originalViewport = window.visualViewport;

afterEach(() => {
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: originalViewport });
});

test('fits the visible browser area, follows toolbar changes, and preserves native pinch zoom', () => {
  const viewport = Object.assign(new EventTarget(), {
    width: 844, height: 280, scale: 1, offsetTop: 10, offsetLeft: 0,
  });
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
  const removeListener = jest.spyOn(viewport, 'removeEventListener');
  const view = render(<Sheet />);
  const style = screen.getByTestId('sheet').style;
  expect(style.getPropertyValue('--sheet-viewport-height')).toBe('280px');
  expect(style.getPropertyValue('--sheet-viewport-top')).toBe('10px');

  act(() => {
    viewport.height = 330;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(style.getPropertyValue('--sheet-viewport-height')).toBe('330px');

  act(() => {
    Object.assign(viewport, { scale: 2, height: 165, width: 422, offsetLeft: 100 });
    viewport.dispatchEvent(new Event('resize'));
    viewport.dispatchEvent(new Event('scroll'));
  });
  expect(style.getPropertyValue('--sheet-viewport-height')).toBe('330px');
  expect(style.getPropertyValue('--sheet-viewport-width')).toBe('844px');
  expect(style.getPropertyValue('--sheet-viewport-left')).toBe('0px');

  act(() => {
    Object.assign(viewport, { scale: 1, height: 740, width: 390, offsetLeft: 0, offsetTop: 0 });
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(style.getPropertyValue('--sheet-viewport-height')).toBe('740px');
  expect(style.getPropertyValue('--sheet-viewport-width')).toBe('390px');
  view.unmount();
  expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function));
  expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function));
});

test('falls back to the window dimensions when VisualViewport is unavailable', () => {
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
  const view = render(<Sheet isOpen={false} />);
  view.rerender(<Sheet />);
  const style = screen.getByTestId('sheet').style;
  expect(style.getPropertyValue('--sheet-viewport-height')).toBe(`${window.innerHeight}px`);
  expect(style.getPropertyValue('--sheet-viewport-width')).toBe(`${window.innerWidth}px`);
});
