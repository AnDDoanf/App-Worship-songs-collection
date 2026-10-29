import { fireEvent, render } from '@testing-library/react';
import UsageGuideModal from './UsageGuideModal';

test('renders all guide steps and closes from the close button', () => {
  const setTrigger = jest.fn();
  render(<UsageGuideModal trigger setTrigger={setTrigger} />);
  expect(document.querySelectorAll('.usage-guide-step')).toHaveLength(5);
  fireEvent.click(document.querySelector('.popup-close-button'));
  expect(setTrigger).toHaveBeenCalledWith(false);
});

test('renders nothing while closed and closes from the backdrop', () => {
  const { container, rerender } = render(<UsageGuideModal trigger={false} setTrigger={jest.fn()} />);
  expect(container).toBeEmptyDOMElement();
  const setTrigger = jest.fn();
  rerender(<UsageGuideModal trigger setTrigger={setTrigger} />);
  fireEvent.click(document.querySelector('.usage-guide-overlay'));
  expect(setTrigger).toHaveBeenCalledWith(false);
});

test('keeps clicks inside the guide from closing it', () => {
  const setTrigger = jest.fn();
  render(<UsageGuideModal trigger setTrigger={setTrigger} />);
  fireEvent.click(document.querySelector('.usage-guide-shell'));
  expect(setTrigger).not.toHaveBeenCalled();
});
