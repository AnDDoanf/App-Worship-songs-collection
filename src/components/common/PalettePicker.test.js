import { fireEvent, render, screen } from '@testing-library/react';
import PalettePicker from './PalettePicker';

test('opens the palette menu, marks the active option, and reports a selection', () => {
  const onChange = jest.fn();
  render(<PalettePicker value="church-logo" onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: /Logo/i }));
  expect(screen.getByRole('menu')).toBeInTheDocument();
  expect(screen.getByRole('menuitemradio', { name: /Logo/i })).toHaveAttribute('aria-checked', 'true');
  fireEvent.click(screen.getByRole('menuitemradio', { name: /Dreamy/i }));
  expect(onChange).toHaveBeenCalledWith('dreamy-calming');
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});

test('uses the default palette for unknown values and toggles the menu with the trigger', () => {
  render(<PalettePicker value="not-a-palette" onChange={jest.fn()} />);
  const trigger = screen.getByRole('button', { name: /Solarized/i });
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getAllByRole('menuitemradio')).toHaveLength(7);
  fireEvent.click(trigger);
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});

test('closes the menu on Escape and outside pointer events', () => {
  render(<><PalettePicker value="solarized" onChange={jest.fn()} /><button type="button">Outside</button></>);
  fireEvent.click(screen.getByRole('button', { name: /Solarized/i }));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Solarized/i }));
  fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});

test('updates the menu position on viewport resize and scroll', () => {
  render(<PalettePicker value="solarized" onChange={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Solarized/i }));
  fireEvent.resize(window);
  fireEvent.scroll(window);
  expect(screen.getByRole('menu')).toBeInTheDocument();
});
