import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeScope } from './ThemeScope';

afterEach(cleanup);

describe('ThemeScope', () => {
  it('renders theme variables in the server HTML before hydration', () => {
    const html = renderToString(
      <ThemeScope theme={{ mode: 'light', roles: { surface: '#ffffff', onSurface: '#112233' } }}>
        <button>Continue</button>
      </ThemeScope>,
    );
    expect(html).toContain('--cf-v2-surface:#ffffff');
    expect(html).toContain('--cf-v2-on-surface:#112233');
    expect(html).toContain('color-scheme:light');
    expect(html).toContain('<button>Continue</button>');
  });

  it('isolates nested themes and never writes to the document theme', () => {
    const documentStyle = document.documentElement.getAttribute('style');
    render(
      <ThemeScope data-testid="outer" theme={{ mode: 'dark', roles: { primary: '#abcdef' } }}>
        <ThemeScope data-testid="inner" theme={{ mode: 'light', roles: { primary: '#123456' } }} />
      </ThemeScope>,
    );
    expect(screen.getByTestId('outer').style.getPropertyValue('--cf-v2-primary')).toBe('#abcdef');
    expect(screen.getByTestId('inner').style.getPropertyValue('--cf-v2-primary')).toBe('#123456');
    expect(document.documentElement.getAttribute('style')).toBe(documentStyle);
    expect(screen.getByTestId('outer')).not.toHaveAttribute('data-theme');
  });

  it('updates variables and removes roles that are absent in the next theme', () => {
    const { rerender } = render(
      <ThemeScope data-testid="scope" theme={{ mode: 'dark', roles: { primary: '#abcdef', temporaryAccent: '#ffffff' } }} />,
    );
    rerender(<ThemeScope data-testid="scope" theme={{ mode: 'light', roles: { primary: '#123456' } }} />);
    const scope = screen.getByTestId('scope');
    expect(scope.style.getPropertyValue('--cf-v2-primary')).toBe('#123456');
    expect(scope.style.getPropertyValue('--cf-v2-temporary-accent')).toBe('');
    expect(scope.style.colorScheme).toBe('light');
  });

  it('forwards the native ref, attributes, children, and layout styles', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ThemeScope ref={ref} id="preview" className="consumer-layout" style={{ padding: 12 }}
        theme={{ mode: 'high-contrast', roles: { primary: '#ffffff' } }}>
        <span>Nested content</span>
      </ThemeScope>,
    );
    expect(ref.current).toHaveClass('consumer-layout');
    expect(ref.current).toHaveAttribute('id', 'preview');
    expect(ref.current).toHaveStyle({ padding: '12px', colorScheme: 'dark' });
    expect(ref.current).toHaveTextContent('Nested content');
  });
});
