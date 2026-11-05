import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef, useRef, useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PopoverV2 } from './PopoverV2';

beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});

afterEach(cleanup);

const trigger = <button type="button">More options</button>;
const opener = () => screen.getByRole('button', { name: 'More options' });
const panel = () => screen.getByRole('dialog', { hidden: true });

describe('PopoverV2', () => {
  it('wires the trigger and opens on click', () => {
    render(<PopoverV2 trigger={trigger} title="Preferences" />);
    expect(opener()).toHaveAttribute('aria-expanded', 'false');
    expect(opener()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(opener()).not.toHaveAttribute('aria-controls');
    fireEvent.click(opener());
    expect(opener()).toHaveAttribute('aria-expanded', 'true');
    expect(panel()).toHaveAttribute('data-state', 'open');
    fireEvent.click(opener());
    expect(panel()).toHaveAttribute('data-state', 'closed');
  });

  it('is a nonmodal dialog named by its title', () => {
    render(<PopoverV2 trigger={trigger} title="Preferences" description="Choose." defaultOpen />);
    const popover = panel();
    expect(document.getElementById(popover.getAttribute('aria-labelledby') as string)).toHaveTextContent('Preferences');
    expect(popover).not.toHaveAttribute('aria-modal');
    expect(popover).toHaveTextContent('Choose.');
  });

  it('accepts aria-label or aria-labelledby without a title', () => {
    render(<PopoverV2 trigger={trigger} aria-label="Filters" defaultOpen />);
    expect(panel()).toHaveAttribute('aria-label', 'Filters');
  });

  it('lets the consumer choose a role for its content', () => {
    render(<PopoverV2 trigger={trigger} title="Details" role="group" />);
    expect(opener()).not.toHaveAttribute('aria-haspopup');
    expect(opener()).toHaveAttribute('aria-controls', screen.getByRole('group', { hidden: true }).id);
    expect(screen.getByRole('group', { hidden: true })).toBeInTheDocument();
  });

  it('moves focus to the first control, or to itself without one', () => {
    render(
      <PopoverV2 trigger={trigger} title="Preferences">
        <input aria-label="Name" />
      </PopoverV2>,
    );
    fireEvent.click(opener());
    expect(screen.getByLabelText('Name')).toHaveFocus();
    cleanup();
    render(<PopoverV2 trigger={trigger} title="Preferences" />);
    fireEvent.click(opener());
    expect(panel()).toHaveFocus();
  });

  it('leaves focus alone with initialFocus none', () => {
    render(<PopoverV2 trigger={trigger} title="Preferences" initialFocus="none" />);
    act(() => opener().focus());
    fireEvent.click(opener());
    expect(opener()).toHaveFocus();
  });

  it('closes on Escape and restores focus to the trigger', () => {
    render(
      <PopoverV2 trigger={trigger} title="Preferences">
        <input aria-label="Name" />
      </PopoverV2>,
    );
    act(() => opener().focus());
    fireEvent.click(opener());
    fireEvent.keyDown(screen.getByLabelText('Name'), { key: 'Escape' });
    expect(panel()).toHaveAttribute('data-state', 'closed');
    expect(opener()).toHaveFocus();
  });

  it('closes on an outside press without stealing the focus target', () => {
    render(
      <>
        <button type="button">Elsewhere</button>
        <PopoverV2 trigger={trigger} title="Preferences" />
      </>,
    );
    fireEvent.click(opener());
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(panel()).toHaveAttribute('data-state', 'closed');
  });

  it('stays open on a press inside', () => {
    render(<PopoverV2 trigger={trigger} title="Preferences" defaultOpen />);
    fireEvent.pointerDown(panel());
    expect(panel()).toHaveAttribute('data-state', 'open');
  });

  it('closes when focus leaves it', () => {
    render(
      <>
        <button type="button">Elsewhere</button>
        <PopoverV2 trigger={trigger} title="Preferences" defaultOpen />
      </>,
    );
    act(() => screen.getByRole('button', { name: 'Elsewhere' }).focus());
    expect(panel()).toHaveAttribute('data-state', 'closed');
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });

  it('stays controlled: the open prop wins', () => {
    const onOpenChange = vi.fn();
    render(<PopoverV2 trigger={trigger} title="Preferences" open onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(panel()).toHaveAttribute('data-state', 'open');
  });

  it('anchors to an external ref without a trigger', () => {
    function Host() {
      const anchor = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(true);
      return (
        <>
          <button ref={anchor} type="button">
            Anchor
          </button>
          <PopoverV2 anchorRef={anchor} open={open} onOpenChange={setOpen} aria-label="Details" />
        </>
      );
    }
    render(<Host />);
    expect(panel()).toHaveAttribute('data-state', 'open');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('data-state', 'closed');
  });

  it('positions itself when the anchor is declared after it', () => {
    function Host() {
      const anchor = useRef<HTMLButtonElement>(null);
      return (
        <>
          <PopoverV2 anchorRef={anchor} open onOpenChange={() => {}} aria-label="Details" />
          <button ref={anchor} type="button">
            Anchor
          </button>
        </>
      );
    }
    render(<Host />);
    expect(panel()).toHaveAttribute('data-placement', 'bottom');
  });

  it('closes only the inner layer on Escape', () => {
    render(
      <PopoverV2 trigger={trigger} title="Outer" defaultOpen data-testid="outer">
        <PopoverV2 trigger={<button type="button">Inner</button>} title="Inner layer" defaultOpen data-testid="inner" />
      </PopoverV2>,
    );
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.getByTestId('inner')).toHaveAttribute('data-state', 'closed');
    expect(screen.getByTestId('outer')).toHaveAttribute('data-state', 'open');
  });

  it('keeps a trigger ref attached across renders and honors its cleanup', () => {
    const attached = vi.fn();
    const detached = vi.fn();
    const ref = (node: HTMLButtonElement | null) => {
      attached(node);
      return detached;
    };
    const view = (title: string) => (
      <PopoverV2
        trigger={
          <button ref={ref} type="button">
            More options
          </button>
        }
        title={title}
      />
    );
    const { rerender, unmount } = render(view('One'));
    rerender(view('Two'));
    expect(attached).toHaveBeenCalledOnce();
    expect(attached).not.toHaveBeenCalledWith(null);
    expect(detached).not.toHaveBeenCalled();
    unmount();
    expect(detached).toHaveBeenCalledOnce();
  });

  it('forwards the ref and native props', () => {
    const ref = createRef<HTMLDivElement>();
    render(<PopoverV2 ref={ref} trigger={trigger} title="Preferences" width="regular" className="extra" />);
    expect(ref.current).toHaveAttribute('data-width', 'regular');
    expect(ref.current).toHaveClass('extra');
  });
});
