import { useRef } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { useModalFocus } from './useModalFocus';

function FocusHarness({ open, empty = false }) {
  const ref = useRef(null);
  useModalFocus(ref, open);
  return <div ref={ref} tabIndex={-1} data-testid="modal">{empty ? null : <>
    <button type="button" disabled>Disabled</button>
    <button type="button" data-testid="first">First</button>
    <button type="button" hidden>Hidden</button>
    <button type="button" aria-hidden="true">Aria hidden</button>
    <button type="button" data-testid="last">Last</button>
  </>}</div>;
}

test('focuses the modal and wraps Tab between its first and last available controls', () => {
  const before = document.createElement('button');
  document.body.appendChild(before);
  before.focus();
  const { getByTestId, unmount } = render(<FocusHarness open />);
  const modal = getByTestId('modal');
  const first = getByTestId('first');
  const last = getByTestId('last');
  expect(modal).toHaveFocus();
  fireEvent.keyDown(modal, { key: 'Tab', shiftKey: true });
  expect(last).toHaveFocus();
  fireEvent.keyDown(last, { key: 'Tab' });
  expect(first).toHaveFocus();
  fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
  expect(last).toHaveFocus();
  unmount();
  expect(before).toHaveFocus();
  before.remove();
});

test('does not trap focus when closed and traps Tab when no focusable children exist', () => {
  const { rerender, getByTestId } = render(<FocusHarness open={false} />);
  const modal = getByTestId('modal');
  const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  modal.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
  rerender(<FocusHarness open empty />);
  const emptyEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  getByTestId('modal').dispatchEvent(emptyEvent);
  expect(emptyEvent.defaultPrevented).toBe(true);
});
