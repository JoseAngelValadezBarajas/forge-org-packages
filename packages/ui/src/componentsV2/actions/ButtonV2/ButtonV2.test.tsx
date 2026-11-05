import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef, type FormEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ButtonV2 } from './ButtonV2';

afterEach(cleanup);

describe('ButtonV2', () => {
  it('renders a native non-submitting button with primary md defaults', () => {
    render(<ButtonV2>Continue</ButtonV2>);
    const button = screen.getByRole('button', { name: 'Continue' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'md');
  });

  it('forwards its ref, native props and custom class name', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <ButtonV2 ref={ref} type="submit" name="save" className="custom" data-testid="button">
        Save
      </ButtonV2>,
    );
    const button = screen.getByTestId('button');
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('name', 'save');
    expect(button).toHaveClass('custom');
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)('exposes the %s variant', (variant) => {
    render(<ButtonV2 variant={variant}>Continue</ButtonV2>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant);
  });

  it.each(['sm', 'md', 'lg'] as const)('exposes the %s size', (size) => {
    render(<ButtonV2 size={size}>Continue</ButtonV2>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', size);
  });

  it('activates on click and stays inert when natively disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(<ButtonV2 onClick={onClick}>Continue</ButtonV2>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(
      <ButtonV2 onClick={onClick} disabled>
        Continue
      </ButtonV2>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows a spinner and the loading label while busy', () => {
    render(
      <ButtonV2 loading iconStart={<svg data-testid="start" />} iconEnd={<svg data-testid="end" />}>
        Save
      </ButtonV2>,
    );
    const button = screen.getByRole('button', { name: 'Saving…' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('[data-button-spinner]')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByTestId('start')).not.toBeInTheDocument();
    expect(screen.queryByTestId('end')).not.toBeInTheDocument();
  });

  it('accepts a custom loading label', () => {
    render(
      <ButtonV2 loading loadingLabel="Guardando…">
        Save
      </ButtonV2>,
    );
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeInTheDocument();
  });

  it('blocks activation while loading and keeps keyboard focus', () => {
    const onClick = vi.fn();
    const { rerender } = render(<ButtonV2 onClick={onClick}>Save</ButtonV2>);
    const button = screen.getByRole('button');
    button.focus();

    rerender(
      <ButtonV2 onClick={onClick} loading>
        Save
      </ButtonV2>,
    );
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveFocus();
  });

  it('does not submit its form while loading', () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ButtonV2 type="submit" loading>
          Save
        </ButtonV2>
      </form>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('places decorative icons around the label', () => {
    render(
      <ButtonV2 iconStart={<svg data-testid="start" />} iconEnd={<svg data-testid="end" />}>
        Continue
      </ButtonV2>,
    );
    const button = screen.getByRole('button', { name: 'Continue' });
    const start = screen.getByTestId('start');
    const end = screen.getByTestId('end');
    expect(start.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(end.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(button.firstElementChild).toBe(start.parentElement);
    expect(button.lastElementChild).toBe(end.parentElement);
  });

  it('names an icon-only button through aria-label and keeps that name while loading', () => {
    const { rerender } = render(<ButtonV2 aria-label="Search" iconStart={<svg />} />);
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();

    rerender(<ButtonV2 aria-label="Search" iconStart={<svg />} loading />);
    const button = screen.getByRole('button', { name: 'Search' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).not.toHaveTextContent('Saving…');
  });
});
