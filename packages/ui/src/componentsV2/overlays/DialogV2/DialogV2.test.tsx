import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef, StrictMode, useRef, useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { DialogV2 } from './DialogV2';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

afterEach(cleanup);

describe('DialogV2', () => {
  it('stays closed until open and renders nothing interactive', () => {
    render(<DialogV2 open={false} onOpenChange={() => {}} title="Confirm" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names and describes the modal', () => {
    render(<DialogV2 open onOpenChange={() => {}} title="Confirm action" description="Review the details." />);
    const dialog = screen.getByRole('dialog', { name: 'Confirm action' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Review the details.');
    expect(dialog).toHaveAttribute('data-size', 'sm');
    expect(screen.getByRole('heading', { level: 2, name: 'Confirm action' })).toBeInTheDocument();
  });

  it('omits the description reference without a description', () => {
    render(<DialogV2 open onOpenChange={() => {}} title="Confirm" />);
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });

  it.each(['sm', 'md', 'lg'] as const)('applies size %s', (size) => {
    render(<DialogV2 open onOpenChange={() => {}} title="Confirm" size={size} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', size);
  });

  it('renders content and footer slots', () => {
    render(
      <DialogV2 open onOpenChange={() => {}} title="Confirm" footer={<button type="button">Continue</button>}>
        Body
      </DialogV2>,
    );
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('asks to close on Escape', () => {
    const onOpenChange = vi.fn();
    render(<DialogV2 open onOpenChange={onOpenChange} title="Confirm" />);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('keeps a locked dialog open on Escape and on a native cancel', () => {
    const onOpenChange = vi.fn();
    render(
      <DialogV2 open onOpenChange={onOpenChange} title="Confirm" closeOnEscape={false} footer={<button type="button">Ok</button>} />,
    );
    fireEvent.keyDown(document.body, { key: 'Escape' });
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('routes a native cancel through onOpenChange so the open prop stays in charge', () => {
    const onOpenChange = vi.fn();
    render(<DialogV2 open onOpenChange={onOpenChange} title="Confirm" />);
    const event = new Event('cancel', { cancelable: true });
    fireEvent(screen.getByRole('dialog'), event);
    expect(event.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('ignores a cancel event that bubbles from a nested file input', () => {
    const onOpenChange = vi.fn();
    render(
      <DialogV2 open onOpenChange={onOpenChange} title="Confirm">
        <input type="file" aria-label="File" />
      </DialogV2>,
    );
    fireEvent(screen.getByLabelText('File'), new Event('cancel', { bubbles: true, cancelable: true }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('syncs a native close, such as a dialog form', () => {
    const onOpenChange = vi.fn();
    render(<DialogV2 open onOpenChange={onOpenChange} title="Confirm" />);
    const dialog = screen.getByRole('dialog');
    dialog.removeAttribute('open');
    fireEvent(dialog, new Event('close'));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('ignores a late close event from an earlier close once it is open again', async () => {
    const close = vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
      queueMicrotask(() => this.dispatchEvent(new Event('close')));
    });
    const onOpenChange = vi.fn();
    render(
      <StrictMode>
        <DialogV2 open onOpenChange={onOpenChange} title="Confirm" />
      </StrictMode>,
    );
    await act(async () => {});
    expect(onOpenChange).not.toHaveBeenCalled();
    close.mockRestore();
  });

  it('locks page scroll while open and restores it', () => {
    const { rerender } = render(<DialogV2 open onOpenChange={() => {}} title="Confirm" />);
    expect(document.documentElement.style.overflow).toBe('hidden');
    rerender(<DialogV2 open={false} onOpenChange={() => {}} title="Confirm" />);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('keeps the lock until the last dialog closes', () => {
    const first = render(<DialogV2 open onOpenChange={() => {}} title="One" />);
    const second = render(<DialogV2 open onOpenChange={() => {}} title="Two" />);
    first.unmount();
    expect(document.documentElement.style.overflow).toBe('hidden');
    second.unmount();
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('restores focus to the opener, also when unmounted while open', () => {
    function Host() {
      const [mounted, setMounted] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setMounted(true)}>
            Open
          </button>
          {mounted && (
            <DialogV2
              open
              onOpenChange={() => {}}
              title="Confirm"
              footer={
                <button type="button" onClick={() => setMounted(false)}>
                  Done
                </button>
              }
            />
          )}
        </>
      );
    }
    render(<Host />);
    const opener = screen.getByRole('button', { name: 'Open' });
    act(() => opener.focus());
    fireEvent.click(opener);
    act(() => screen.getByRole('button', { name: 'Done' }).focus());
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(opener).toHaveFocus();
  });

  it('honors initialFocusRef', () => {
    function Host() {
      const target = useRef<HTMLButtonElement>(null);
      return (
        <DialogV2
          open
          onOpenChange={() => {}}
          title="Confirm"
          initialFocusRef={target}
          footer={
            <>
              <button type="button">First</button>
              <button ref={target} type="button">
                Second
              </button>
            </>
          }
        />
      );
    }
    render(<Host />);
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
  });

  it('wraps Tab and Shift+Tab inside the dialog', () => {
    render(
      <DialogV2
        open
        onOpenChange={() => {}}
        title="Confirm"
        footer={
          <>
            <button type="button">First</button>
            <button type="button">Last</button>
          </>
        }
      />,
    );
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });
    act(() => last.focus());
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('forwards the ref and native props', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<DialogV2 ref={ref} open onOpenChange={() => {}} title="Confirm" data-testid="modal" className="extra" />);
    expect(ref.current).toBe(screen.getByTestId('modal'));
    expect(ref.current).toHaveClass('extra');
  });
});
