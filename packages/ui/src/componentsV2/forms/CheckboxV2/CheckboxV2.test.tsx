import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckboxV2 } from './CheckboxV2';

afterEach(cleanup);

describe('CheckboxV2', () => {
  it('renders a native checkbox named by its label', () => {
    render(<CheckboxV2>Email updates</CheckboxV2>);
    const checkbox = screen.getByRole('checkbox', { name: 'Email updates' });
    expect(checkbox).toHaveAttribute('type', 'checkbox');
    expect(checkbox.closest('label')).not.toBeNull();
  });

  it('toggles when its label is clicked', () => {
    render(<CheckboxV2>Email updates</CheckboxV2>);
    fireEvent.click(screen.getByText('Email updates'));
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('does not wrap the input in a label when it is named from outside', () => {
    render(
      <>
        <label htmlFor="terms">Terms</label>
        <CheckboxV2 id="terms" />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Terms' }).closest('label')).toBeNull();
  });

  it('forwards its ref and native props to the input and class name to the root', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <CheckboxV2 ref={ref} name="terms" value="yes" required className="custom">
        Terms
      </CheckboxV2>,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(ref.current).toBe(checkbox);
    expect(checkbox).toHaveAttribute('name', 'terms');
    expect(checkbox).toBeRequired();
    expect(checkbox.closest('label')).toHaveClass('custom');
  });

  it('sets the indeterminate DOM property and follows the prop', () => {
    const { rerender } = render(<CheckboxV2 indeterminate>All</CheckboxV2>);
    const checkbox = screen.getByRole<HTMLInputElement>('checkbox');
    expect(checkbox.indeterminate).toBe(true);
    rerender(<CheckboxV2 indeterminate={false}>All</CheckboxV2>);
    expect(checkbox.indeterminate).toBe(false);
  });

  it('stays indeterminate after a click while the prop remains true', () => {
    const onChange = vi.fn();
    render(
      <CheckboxV2 indeterminate onChange={onChange}>
        All
      </CheckboxV2>,
    );
    const checkbox = screen.getByRole<HTMLInputElement>('checkbox');
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledOnce();
    expect(checkbox.indeterminate).toBe(true);
  });

  it('leaves the mixed state when the parent changes it after a click', () => {
    function Parent() {
      const [mixed, setMixed] = useState(true);
      return (
        <CheckboxV2 indeterminate={mixed} onChange={() => setMixed(false)}>
          All
        </CheckboxV2>
      );
    }
    render(<Parent />);
    const checkbox = screen.getByRole<HTMLInputElement>('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox.indeterminate).toBe(false);
  });

  it('marks the root and blocks changes when disabled', () => {
    const onChange = vi.fn();
    render(
      <CheckboxV2 disabled onChange={onChange}>
        Terms
      </CheckboxV2>,
    );
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(screen.getByText('Terms'));
    expect(checkbox).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
    expect(checkbox.closest('label')).toHaveAttribute('data-disabled', 'true');
  });

  it('links validation messages to the input', () => {
    render(
      <>
        <CheckboxV2 aria-invalid aria-describedby="error">
          Terms
        </CheckboxV2>
        <small id="error">Accept the terms.</small>
      </>,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInvalid();
    expect(checkbox).toHaveAccessibleDescription('Accept the terms.');
  });
});
