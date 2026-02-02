import { render, screen } from '@testing-library/react';
import LanguageSelector from '../LanguageSelector';

describe('LanguageSelector', () => {
  it('should render language selector', () => {
    render(<LanguageSelector />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should display language toggle text', () => {
    render(<LanguageSelector />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/EN|ES/);
  });
});
