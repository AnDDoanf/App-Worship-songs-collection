import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the application heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Thánh Ca Hội Thánh/i })).toBeInTheDocument();
});
