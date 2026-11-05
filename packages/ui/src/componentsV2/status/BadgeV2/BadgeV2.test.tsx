import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { BadgeV2 } from './BadgeV2';

afterEach(cleanup);

describe('BadgeV2', () => {
  it('renders static text with neutral solid sm defaults', () => {
    render(<BadgeV2 data-testid="badge">Ready</BadgeV2>);
    const badge = screen.getByTestId('badge');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveTextContent('Ready');
    expect(badge).toHaveAttribute('data-tone', 'neutral');
    expect(badge).toHaveAttribute('data-variant', 'solid');
    expect(badge).toHaveAttribute('data-size', 'sm');
    expect(badge).not.toHaveAttribute('role');
    expect(badge).not.toHaveAttribute('tabindex');
  });

  it.each(['neutral', 'primary', 'success', 'warning', 'error', 'info'] as const)('exposes the %s tone', (tone) => {
    render(
      <BadgeV2 data-testid="badge" tone={tone}>
        Label
      </BadgeV2>,
    );
    expect(screen.getByTestId('badge')).toHaveAttribute('data-tone', tone);
  });

  it.each(['solid', 'subtle', 'outline'] as const)('exposes the %s variant', (variant) => {
    render(
      <BadgeV2 data-testid="badge" variant={variant}>
        Label
      </BadgeV2>,
    );
    expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', variant);
  });

  it('forwards its ref, native props and custom class name', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <BadgeV2 ref={ref} data-testid="badge" title="Full label" className="custom" size="md">
        Label
      </BadgeV2>,
    );
    const badge = screen.getByTestId('badge');
    expect(ref.current).toBe(badge);
    expect(badge).toHaveAttribute('title', 'Full label');
    expect(badge).toHaveClass('custom');
    expect(badge).toHaveAttribute('data-size', 'md');
  });
});
