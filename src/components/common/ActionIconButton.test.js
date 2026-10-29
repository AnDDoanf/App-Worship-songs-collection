import { fireEvent, render, screen } from '@testing-library/react';
import ActionIconButton from './ActionIconButton';

test('shows named tooltips on pointer hover and keyboard focus without changing its action', () => {
  const onClick = jest.fn();
  render(<ActionIconButton label="Chiếu lời" icon={<svg />} onClick={onClick} />);
  const button = screen.getByRole('button', { name: 'Chiếu lời' });
  expect(button.textContent).toBe('');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  fireEvent.mouseEnter(button.parentElement);
  expect(screen.getByRole('tooltip')).toHaveTextContent('Chiếu lời');
  fireEvent.mouseLeave(button.parentElement);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  fireEvent.focus(button);
  expect(button).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(button, { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
