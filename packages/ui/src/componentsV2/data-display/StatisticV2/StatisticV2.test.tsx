import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { StatisticV2 } from './StatisticV2';

afterEach(cleanup);

describe('StatisticV2', () => {
  it('pairs the label with its value and unit as a description list', () => {
    const { container } = render(<StatisticV2 label="Total count" value="1,284" unit="items" />);
    expect(container.querySelector('dl')).toHaveAttribute('data-variant', 'plain');
    expect(screen.getByText('Total count').tagName).toBe('DT');
    expect(screen.getByText('1,284').closest('dd')).toHaveTextContent('1,284items');
  });

  it('omits the unit when none is given', () => {
    render(<StatisticV2 label="Rate" value="72.8" />);
    expect(screen.getByText('72.8').closest('dd')?.children).toHaveLength(1);
  });

  it('shows a trend with its direction in words for assistive technology', () => {
    render(
      <StatisticV2
        label="Count"
        value="10"
        variant="trend"
        trend={{ direction: 'rising', delta: '+12.4%', baseline: 'from previous sample', intent: 'positive' }}
      />,
    );
    const trend = screen.getByText('+12.4%').closest('dd');
    expect(trend).toHaveAttribute('data-direction', 'rising');
    expect(trend).toHaveAttribute('data-intent', 'positive');
    expect(trend).toHaveTextContent('Rising +12.4%from previous sample');
    expect(trend?.querySelector('[aria-hidden="true"]')).toHaveTextContent('↗');
  });

  it('treats a trend with no intent as neutral, and a falling one is not automatically bad', () => {
    render(<StatisticV2 label="Count" value="10" variant="card" trend={{ direction: 'falling', delta: '−8.3%' }} />);
    const trend = screen.getByText('−8.3%').closest('dd');
    expect(trend).toHaveAttribute('data-direction', 'falling');
    expect(trend).toHaveAttribute('data-intent', 'neutral');
  });

  it('does not render the trend in the plain variant', () => {
    render(<StatisticV2 label="Count" value="10" trend={{ direction: 'unchanged', delta: '0.0%' }} />);
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
  });

  it('forwards its ref, class name and native props', () => {
    const ref = createRef<HTMLDListElement>();
    render(<StatisticV2 ref={ref} className="custom" data-testid="stat" label="L" value="1" />);
    expect(ref.current).toBe(screen.getByTestId('stat'));
    expect(ref.current).toHaveClass('custom');
  });
});
