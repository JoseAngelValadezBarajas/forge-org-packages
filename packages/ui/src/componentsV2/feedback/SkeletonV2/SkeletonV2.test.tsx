import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { SkeletonV2 } from './SkeletonV2';

afterEach(cleanup);

describe('SkeletonV2', () => {
  it('is decorative with text, small and static defaults', () => {
    render(<SkeletonV2 data-testid="shape" />);
    const shape = screen.getByTestId('shape');
    expect(shape).toHaveAttribute('aria-hidden', 'true');
    expect(shape).toHaveAttribute('data-shape', 'text');
    expect(shape).toHaveAttribute('data-size', 'sm');
    expect(shape).toHaveAttribute('data-animation', 'none');
  });

  it('cannot be exposed by a consumer prop', () => {
    render(<SkeletonV2 data-testid="shape" aria-hidden={false} />);
    expect(screen.getByTestId('shape')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(['text', 'rectangle', 'circle'] as const)('renders shape %s', (shape) => {
    render(<SkeletonV2 shape={shape} size="md" data-testid="shape" />);
    expect(screen.getByTestId('shape')).toHaveAttribute('data-shape', shape);
  });

  it.each(['pulse', 'wave'] as const)('opts into animation %s', (animation) => {
    render(<SkeletonV2 animation={animation} data-testid="shape" />);
    expect(screen.getByTestId('shape')).toHaveAttribute('data-animation', animation);
  });

  it('overrides width and height, and lets style win', () => {
    render(<SkeletonV2 width="80%" height={20} style={{ height: 30 }} data-testid="shape" />);
    expect(screen.getByTestId('shape')).toHaveStyle({ width: '80%', height: '30px' });
  });

  it('adds no size override by default', () => {
    render(<SkeletonV2 data-testid="shape" />);
    expect(screen.getByTestId('shape')).not.toHaveAttribute('style');
  });

  it('forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<SkeletonV2 ref={ref} className="extra" />);
    expect(ref.current).toHaveClass('extra');
  });
});
