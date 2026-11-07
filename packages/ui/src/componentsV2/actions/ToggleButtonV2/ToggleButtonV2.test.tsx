import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToggleButtonV2 } from './ToggleButtonV2';

afterEach(cleanup);

describe('ToggleButtonV2', () => {
  it('is a native non-submitting button that starts unpressed', () => {
    render(<ToggleButtonV2>Boxes</ToggleButtonV2>);
    const button = screen.getByRole('button', { name: 'Boxes' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('data-size', 'md');
  });

  it('toggles its own state when uncontrolled and reports each change', () => {
    const onPressedChange = vi.fn();
    render(<ToggleButtonV2 onPressedChange={onPressedChange}>Boxes</ToggleButtonV2>);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(onPressedChange.mock.calls).toEqual([[true], [false]]);
  });

  it('honours defaultPressed', () => {
    render(<ToggleButtonV2 defaultPressed>Boxes</ToggleButtonV2>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('follows the pressed prop when controlled and never changes by itself', () => {
    const onPressedChange = vi.fn();
    render(
      <ToggleButtonV2 pressed={false} onPressedChange={onPressedChange}>
        Boxes
      </ToggleButtonV2>,
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('works inside a parent that owns the state', () => {
    function Host() {
      const [on, setOn] = useState(false);
      return (
        <ToggleButtonV2 pressed={on} onPressedChange={setOn}>
          Boxes
        </ToggleButtonV2>
      );
    }
    render(<Host />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not toggle when the click handler prevents the default or the button is disabled', () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <ToggleButtonV2 onClick={(event) => event.preventDefault()} onPressedChange={onPressedChange}>
        Boxes
      </ToggleButtonV2>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onPressedChange).not.toHaveBeenCalled();
    rerender(
      <ToggleButtonV2 disabled onPressedChange={onPressedChange}>
        Boxes
      </ToggleButtonV2>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it('supports an icon-only button with an accessible name, a ref and a custom class', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<ToggleButtonV2 ref={ref} aria-label="Show boxes" iconStart={<svg data-testid="icon" />} className="custom" size="lg" />);
    const button = screen.getByRole('button', { name: 'Show boxes' });
    expect(ref.current).toBe(button);
    expect(button).toHaveClass('custom');
    expect(button).toHaveAttribute('data-size', 'lg');
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});
