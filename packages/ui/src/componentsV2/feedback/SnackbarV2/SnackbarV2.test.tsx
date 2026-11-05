import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef, useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SnackbarStackV2, SnackbarV2 } from './SnackbarV2';

beforeAll(() => {
  HTMLElement.prototype.showPopover = vi.fn();
  HTMLElement.prototype.hidePopover = vi.fn();
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const elapse = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('SnackbarV2', () => {
  it('announces politely with neutral compact defaults', () => {
    render(<SnackbarV2 title="Saved" />);
    const snackbar = screen.getByRole('status');
    expect(snackbar).toHaveTextContent('Saved');
    expect(snackbar).toHaveAttribute('data-tone', 'neutral');
    expect(snackbar).toHaveAttribute('data-density', 'compact');
  });

  it('interrupts only for errors', () => {
    render(<SnackbarV2 tone="error" title="Failed" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it.each(['neutral', 'info', 'success', 'warning'] as const)('keeps %s as a status', (tone) => {
    render(<SnackbarV2 tone={tone} title="Note" />);
    expect(screen.getByRole('status')).toHaveAttribute('data-tone', tone);
  });

  it('renders description and action', () => {
    render(<SnackbarV2 density="detailed" title="Saved" description="All done." action={<button type="button">Undo</button>} />);
    expect(screen.getByText('All done.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('closes with a named keyboard button and reports the reason', () => {
    const onDismiss = vi.fn();
    render(<SnackbarV2 title="Saved" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith('close');
  });

  it('hides the close button when not dismissible or without a handler', () => {
    const { rerender } = render(<SnackbarV2 title="Saved" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<SnackbarV2 title="Saved" onDismiss={() => {}} dismissible={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('never moves focus on arrival', () => {
    render(<button type="button">Page</button>);
    const page = screen.getByRole('button', { name: 'Page' });
    act(() => page.focus());
    render(<SnackbarV2 title="Saved" onDismiss={() => {}} />);
    expect(page).toHaveFocus();
  });

  it('expires after the default duration', () => {
    const onDismiss = vi.fn();
    render(<SnackbarV2 title="Saved" onDismiss={onDismiss} />);
    elapse(4999);
    expect(onDismiss).not.toHaveBeenCalled();
    elapse(1);
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith('timeout');
  });

  it('honors a custom duration', () => {
    const onDismiss = vi.fn();
    render(<SnackbarV2 title="Saved" duration={1000} onDismiss={onDismiss} />);
    elapse(1000);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it.each([
    ['null duration', { duration: null }],
    ['an error', { tone: 'error' as const }],
    ['an action', { action: <button type="button">Undo</button> }],
  ])('stays until dismissed with %s', (_, props) => {
    const onDismiss = vi.fn();
    render(<SnackbarV2 title="Saved" onDismiss={onDismiss} {...props} />);
    elapse(60000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('lets an explicit duration override the persistent default', () => {
    const onDismiss = vi.fn();
    render(<SnackbarV2 title="Failed" tone="error" duration={1000} onDismiss={onDismiss} />);
    elapse(1000);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('pauses on hover and keeps the time left', () => {
    const onDismiss = vi.fn();
    render(<SnackbarV2 title="Saved" duration={1000} onDismiss={onDismiss} />);
    const snackbar = screen.getByRole('status');
    elapse(600);
    fireEvent.pointerEnter(snackbar);
    expect(snackbar).toHaveAttribute('data-paused', 'true');
    elapse(10000);
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.pointerLeave(snackbar);
    expect(snackbar).not.toHaveAttribute('data-paused');
    elapse(399);
    expect(onDismiss).not.toHaveBeenCalled();
    elapse(1);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('pauses while focus is inside and resumes only when it leaves', () => {
    const onDismiss = vi.fn();
    render(<SnackbarV2 title="Saved" duration={1000} onDismiss={onDismiss} />);
    const close = screen.getByRole('button', { name: 'Dismiss' });
    act(() => close.focus());
    elapse(10000);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => close.blur());
    elapse(1000);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('stays paused while hover and focus overlap', () => {
    const onDismiss = vi.fn();
    render(<SnackbarV2 title="Saved" duration={1000} onDismiss={onDismiss} />);
    const snackbar = screen.getByRole('status');
    fireEvent.pointerEnter(snackbar);
    act(() => screen.getByRole('button').focus());
    fireEvent.pointerLeave(snackbar);
    elapse(10000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('pauses while the page is hidden', () => {
    const onDismiss = vi.fn();
    render(<SnackbarV2 title="Saved" duration={1000} onDismiss={onDismiss} />);
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    elapse(10000);
    expect(onDismiss).not.toHaveBeenCalled();
    hidden.mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    elapse(1000);
    expect(onDismiss).toHaveBeenCalledOnce();
    hidden.mockRestore();
  });

  it('does not restart the timer on a rerender with a new handler', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<SnackbarV2 title="Saved" duration={1000} onDismiss={first} />);
    elapse(600);
    rerender(<SnackbarV2 title="Saved" duration={1000} onDismiss={second} />);
    elapse(400);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('clears the timer on unmount', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(<SnackbarV2 title="Saved" duration={1000} onDismiss={onDismiss} />);
    unmount();
    elapse(5000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('returns focus to where it came from when it closes with focus inside', () => {
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button">Page</button>
          {open && <SnackbarV2 title="Saved" onDismiss={() => setOpen(false)} />}
        </>
      );
    }
    render(<Host />);
    const page = screen.getByRole('button', { name: 'Page' });
    const close = screen.getByRole('button', { name: 'Dismiss' });
    act(() => page.focus());
    act(() => close.focus());
    fireEvent.click(close);
    expect(page).toHaveFocus();
  });

  it('forwards the ref and native props', () => {
    const ref = createRef<HTMLDivElement>();
    render(<SnackbarV2 ref={ref} title="Saved" role="note" className="extra" />);
    expect(screen.getByRole('note')).toBe(ref.current);
    expect(ref.current).toHaveClass('extra');
  });
});

describe('SnackbarStackV2', () => {
  it('is a named region that defaults to bottom center', () => {
    render(<SnackbarStackV2 data-testid="stack" />);
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveAttribute('role', 'region');
    expect(stack).toHaveAttribute('aria-label', 'Notifications');
    expect(stack).toHaveAttribute('data-placement', 'bottom-center');
    expect(HTMLElement.prototype.showPopover).toHaveBeenCalled();
  });

  it('accepts bottom-end, a label and children', () => {
    render(
      <SnackbarStackV2 data-testid="stack" placement="bottom-end" aria-label="Updates">
        <SnackbarV2 title="One" />
        <SnackbarV2 title="Two" />
      </SnackbarStackV2>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack).toHaveAttribute('data-placement', 'bottom-end');
    expect(stack).toHaveAttribute('aria-label', 'Updates');
    expect(stack.children).toHaveLength(2);
  });
});
