import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlertV2 } from './AlertV2';

afterEach(cleanup);

describe('AlertV2', () => {
  it('announces politely by default with info soft defaults', () => {
    render(<AlertV2 title="Saved" description="All changes are stored." />);
    const alert = screen.getByRole('status');
    expect(alert).toHaveAttribute('data-tone', 'info');
    expect(alert).toHaveAttribute('data-variant', 'soft');
    expect(alert).toHaveTextContent('Saved');
    expect(alert).toHaveTextContent('All changes are stored.');
  });

  it('interrupts only for errors', () => {
    render(<AlertV2 tone="error" title="Failed" />);
    expect(screen.getByRole('alert')).toHaveAttribute('data-tone', 'error');
  });

  it.each(['info', 'success', 'warning', 'neutral'] as const)('keeps %s as a status', (tone) => {
    render(<AlertV2 tone={tone} title="Notice" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('lets the consumer choose the role', () => {
    render(<AlertV2 tone="error" role="note" title="Static notice" />);
    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['info', 'i'],
    ['warning', '!'],
    ['error', '×'],
    ['neutral', '•'],
  ] as const)('shows a decorative glyph for %s', (tone, glyph) => {
    render(<AlertV2 tone={tone} role="note" title="Notice" />);
    const icon = screen.getByText(glyph);
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws the success mark as an icon', () => {
    render(<AlertV2 tone="success" title="Notice" />);
    expect(screen.getByRole('status').querySelector('[aria-hidden="true"] svg')).not.toBeNull();
  });

  it('replaces or removes the icon', () => {
    const { rerender } = render(<AlertV2 title="Notice" icon={<svg data-testid="custom" />} />);
    expect(screen.getByTestId('custom').parentElement).toHaveAttribute('aria-hidden', 'true');
    rerender(<AlertV2 title="Notice" icon={null} />);
    expect(screen.getByRole('status').querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('uses children as the description, and prefers description', () => {
    const { rerender } = render(<AlertV2>From children</AlertV2>);
    expect(screen.getByRole('status')).toHaveTextContent('From children');
    rerender(<AlertV2 description="From description">From children</AlertV2>);
    expect(screen.getByRole('status')).toHaveTextContent('From description');
    expect(screen.getByRole('status')).not.toHaveTextContent('From children');
  });

  it('composes actions without owning them', () => {
    const onClick = vi.fn();
    render(
      <AlertV2
        title="Failed"
        actions={
          <button type="button" onClick={onClick}>
            Retry
          </button>
        }
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows a named dismiss button only when it can be dismissed', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<AlertV2 title="Notice" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<AlertV2 title="Notice" onDismiss={onDismiss} />);
    const dismiss = screen.getByRole('button', { name: 'Close' });
    expect(dismiss).toHaveAttribute('type', 'button');
    fireEvent.click(dismiss);
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<AlertV2 title="Notice" onDismiss={onDismiss} dismissLabel="Cerrar" />);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });

  it('forwards its ref, native props and custom class name', () => {
    const ref = createRef<HTMLDivElement>();
    render(<AlertV2 ref={ref} title="Notice" id="notice" className="custom" variant="outline" />);
    const alert = screen.getByRole('status');
    expect(ref.current).toBe(alert);
    expect(alert).toHaveAttribute('id', 'notice');
    expect(alert).toHaveClass('custom');
    expect(alert).toHaveAttribute('data-variant', 'outline');
  });
});
