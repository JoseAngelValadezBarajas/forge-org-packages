import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TextInputV2 } from './TextInputV2';

afterEach(cleanup);

describe('TextInputV2', () => {
  it('renders a native input with the md size by default', () => {
    render(<TextInputV2 aria-label="Name" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveAttribute('data-size', 'md');
    expect(input).not.toHaveAttribute('size');
  });

  it.each(['sm', 'md', 'lg'] as const)('exposes the %s size', (size) => {
    render(<TextInputV2 aria-label="Name" size={size} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', size);
  });

  it('forwards its ref, native props and custom class name', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <TextInputV2
        ref={ref}
        aria-label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="hello@sample.dev"
        className="custom"
      />,
    );
    const input = screen.getByRole('textbox');
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('placeholder', 'hello@sample.dev');
    expect(input).toHaveClass('custom');
  });

  it('works controlled', () => {
    const onChange = vi.fn();
    render(<TextInputV2 aria-label="Name" value="Atlas" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Orbit' } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByRole('textbox')).toHaveValue('Atlas');
  });

  it('keeps labels, messages and validation state outside the primitive', () => {
    render(
      <>
        <label htmlFor="email">Email</label>
        <TextInputV2 id="email" aria-invalid aria-describedby="email-error" />
        <small id="email-error">Enter a valid email address.</small>
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Enter a valid email address.');
  });

  it('passes the native disabled and read-only states through', () => {
    const { rerender } = render(<TextInputV2 aria-label="Name" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    rerender(<TextInputV2 aria-label="Name" readOnly defaultValue="Atlas" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });
});
