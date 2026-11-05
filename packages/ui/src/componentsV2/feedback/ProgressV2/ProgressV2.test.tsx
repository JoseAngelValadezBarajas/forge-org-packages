import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProgressV2 } from './ProgressV2';

afterEach(cleanup);

describe('ProgressV2', () => {
  it('exposes determinate progress semantics', () => {
    render(<ProgressV2 label="Processing" value={68} />);
    const bar = screen.getByRole('progressbar', { name: 'Processing' });
    expect(bar).toHaveAttribute('aria-valuenow', '68');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveTextContent('68%');
    expect(bar).toHaveAttribute('data-shape', 'linear');
    expect(bar).toHaveAttribute('data-status', 'normal');
  });

  it('omits value semantics while indeterminate', () => {
    render(<ProgressV2 label="Processing" indeterminate />);
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).not.toHaveAttribute('aria-valuemin');
    expect(bar).not.toHaveAttribute('aria-valuemax');
    expect(bar).toHaveTextContent('Ongoing');
  });

  it('computes the percent from a custom max and rounds it', () => {
    render(<ProgressV2 label="Steps" value={1} max={3} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '3');
    expect(bar).toHaveTextContent('33%');
  });

  it.each([
    [-5, '0', '0%'],
    [150, '100', '100%'],
    [Number.NaN, '0', '0%'],
  ])('clamps %s', (value, now, text) => {
    render(<ProgressV2 label="Clamped" value={value} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', now);
    expect(bar).toHaveTextContent(text);
  });

  it('falls back to a max of 100 when max is invalid', () => {
    render(<ProgressV2 label="Invalid" value={40} max={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
  });

  it('sets the linear fill width', () => {
    const { container } = render(<ProgressV2 label="Fill" value={25} />);
    expect(container.querySelector('[style]')).toHaveStyle({ width: '25%' });
  });

  it('draws a circular arc from the value and keeps the name without visible text', () => {
    const { container } = render(<ProgressV2 shape="circular" label="Upload" value={68} />);
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(bar).toHaveTextContent('68%');
    expect(bar).not.toHaveTextContent('Upload');
    expect(container.querySelectorAll('circle')[1]).toHaveAttribute('stroke-dasharray', '68 100');
  });

  it('draws no arc at zero, so a round cap does not fake progress', () => {
    const { container } = render(<ProgressV2 shape="circular" label="Upload" value={0} />);
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });

  it('marks circular indeterminate progress with an ellipsis', () => {
    render(<ProgressV2 shape="circular" aria-label="Loading" indeterminate />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toHaveTextContent('…');
  });

  it('replaces or removes the value label', () => {
    const { rerender } = render(<ProgressV2 label="Steps" value={3} max={5} valueLabel="Step 3 of 5" />);
    expect(screen.getByRole('progressbar')).toHaveTextContent('Step 3 of 5');
    rerender(<ProgressV2 label="Steps" value={3} max={5} valueLabel={null} />);
    expect(screen.getByRole('progressbar')).toHaveTextContent(/^Steps$/);
  });

  it.each(['success', 'error'] as const)('reports status %s', (status) => {
    render(<ProgressV2 label="Done" value={100} status={status} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-status', status);
  });

  it('accepts aria-labelledby and forwards the ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <>
        <span id="name">External</span>
        <ProgressV2 ref={ref} aria-labelledby="name" value={1} className="extra" />
      </>,
    );
    expect(screen.getByRole('progressbar', { name: 'External' })).toBe(ref.current);
    expect(ref.current).toHaveClass('extra');
  });
});
