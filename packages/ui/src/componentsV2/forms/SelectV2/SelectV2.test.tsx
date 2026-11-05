import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectV2 } from './SelectV2';

afterEach(cleanup);

const options = [
  <option key="" value="">
    Choose an option
  </option>,
  <option key="a" value="a">
    Option A
  </option>,
];

describe('SelectV2', () => {
  it('renders a native select with the md size by default', () => {
    render(<SelectV2 aria-label="Plan">{options}</SelectV2>);
    const select = screen.getByRole('combobox', { name: 'Plan' });
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveAttribute('data-size', 'md');
    expect(select).not.toHaveAttribute('size');
  });

  it.each(['sm', 'md', 'lg'] as const)('exposes the %s size', (size) => {
    render(
      <SelectV2 aria-label="Plan" size={size}>
        {options}
      </SelectV2>,
    );
    expect(screen.getByRole('combobox')).toHaveAttribute('data-size', size);
  });

  it('forwards its ref and native props to the select and class name to the root', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <SelectV2 ref={ref} aria-label="Plan" name="plan" required className="custom">
        {options}
      </SelectV2>,
    );
    const select = screen.getByRole('combobox');
    expect(ref.current).toBe(select);
    expect(select).toHaveAttribute('name', 'plan');
    expect(select).toBeRequired();
    expect(select.parentElement).toHaveClass('custom');
    expect(select).not.toHaveClass('custom');
  });

  it('keeps the chevron out of the accessibility tree', () => {
    render(<SelectV2 aria-label="Plan">{options}</SelectV2>);
    expect(screen.getByRole('combobox').nextElementSibling).toHaveAttribute('aria-hidden', 'true');
  });

  it('works controlled', () => {
    const onChange = vi.fn();
    render(
      <SelectV2 aria-label="Plan" value="" onChange={onChange}>
        {options}
      </SelectV2>,
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a' } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('exposes invalid and disabled states natively', () => {
    const { rerender } = render(
      <SelectV2 aria-label="Plan" aria-invalid aria-describedby="error">
        {options}
      </SelectV2>,
    );
    expect(screen.getByRole('combobox')).toBeInvalid();
    rerender(
      <SelectV2 aria-label="Plan" disabled>
        {options}
      </SelectV2>,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
