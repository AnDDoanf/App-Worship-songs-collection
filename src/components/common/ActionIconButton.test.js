import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ActionIconButton from './ActionIconButton';

test('shows named tooltips on pointer hover and keyboard focus without changing its action', async () => {
  const onClick = jest.fn();
  render(<ActionIconButton label="Chiếu lời" icon={<svg />} onClick={onClick} />);
  const button = screen.getByRole('button', { name: 'Chiếu lời' });
  expect(button.textContent).toBe('');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  fireEvent.mouseEnter(button.parentElement);
  expect(screen.getByRole('tooltip')).toHaveTextContent('Chiếu lời');
  expect(screen.getByRole('tooltip').parentElement).toBe(document.body);
  expect(screen.getByRole('tooltip')).toHaveClass('action-tooltip-below');
  fireEvent.mouseLeave(button.parentElement);
  await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  fireEvent.focus(button);
  expect(button).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(button, { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('renders tooltips outside an overflow-clipped modal and flips them below controls near the viewport top', () => {
  render(<div className="popup-lyric" style={{ overflow: 'hidden' }}><ActionIconButton label="Modal action" icon={<svg />} onClick={jest.fn()} /></div>);
  const button = screen.getByRole('button', { name: 'Modal action' });
  button.getBoundingClientRect = () => ({ left: 40, right: 84, top: 2, bottom: 46, width: 44, height: 44 });
  fireEvent.focus(button);
  const tooltip = screen.getByRole('tooltip');
  expect(tooltip.parentElement).toBe(document.body);
  expect(tooltip).toHaveClass('action-tooltip-below');
});
