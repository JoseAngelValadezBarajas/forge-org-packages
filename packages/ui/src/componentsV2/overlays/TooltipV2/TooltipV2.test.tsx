import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipV2 } from './TooltipV2';

beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const elapse = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const state = () => screen.getByRole('tooltip', { hidden: true }).getAttribute('data-state');
const pointer = (type: string, target: Element, pointerType = 'mouse') => {
  const event = new MouseEvent(type, { bubbles: true });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  fireEvent(target, event);
};
const setup = (props: Partial<Parameters<typeof TooltipV2>[0]> = {}) => {
  render(
    <TooltipV2 content="Copy the link" {...props}>
      <button type="button">Copy</button>
    </TooltipV2>,
  );
  return screen.getByRole('button', { name: 'Copy' });
};

describe('TooltipV2', () => {
  it('describes the trigger without replacing its name', () => {
    const trigger = setup();
    expect(trigger).toHaveAccessibleName('Copy');
    expect(trigger).toHaveAccessibleDescription('Copy the link');
  });

  it('keeps a description the trigger already has', () => {
    render(
      <>
        <span id="hint">Existing</span>
        <TooltipV2 content="Extra">
          <button type="button" aria-describedby="hint">
            Copy
          </button>
        </TooltipV2>
      </>,
    );
    expect(screen.getByRole('button')).toHaveAccessibleDescription('Existing Extra');
  });

  it('shows on hover only after the delay', () => {
    const trigger = setup();
    pointer('pointerover', trigger);
    elapse(299);
    expect(state()).toBe('closed');
    elapse(1);
    expect(state()).toBe('open');
  });

  it('honors a custom delay', () => {
    const trigger = setup({ delay: 0 });
    pointer('pointerover', trigger);
    elapse(0);
    expect(state()).toBe('open');
  });

  it('never opens from a touch pointer', () => {
    const trigger = setup();
    pointer('pointerover', trigger, 'touch');
    elapse(1000);
    expect(state()).toBe('closed');
  });

  it('survives moving from the trigger onto the tooltip', () => {
    const trigger = setup();
    pointer('pointerover', trigger);
    elapse(300);
    pointer('pointerout', trigger);
    elapse(50);
    pointer('pointerover', screen.getByRole('tooltip', { hidden: true }));
    elapse(1000);
    expect(state()).toBe('open');
    pointer('pointerout', screen.getByRole('tooltip', { hidden: true }));
    elapse(120);
    expect(state()).toBe('closed');
  });

  it('dismisses with Escape while focus stays on the trigger', () => {
    const trigger = setup();
    act(() => trigger.focus());
    pointer('pointerover', trigger);
    elapse(300);
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(state()).toBe('closed');
    expect(trigger).toHaveFocus();
  });

  it('closes when the trigger is pressed', () => {
    const trigger = setup();
    pointer('pointerover', trigger);
    elapse(300);
    fireEvent.pointerDown(trigger);
    expect(state()).toBe('closed');
  });

  it('keeps the handlers and ref of the trigger', () => {
    const onPointerDown = vi.fn();
    const triggerRef = createRef<HTMLButtonElement>();
    render(
      <TooltipV2 content="Tip">
        <button ref={triggerRef} type="button" onPointerDown={onPointerDown}>
          Copy
        </button>
      </TooltipV2>,
    );
    fireEvent.pointerDown(screen.getByRole('button'));
    expect(onPointerDown).toHaveBeenCalledOnce();
    expect(triggerRef.current).toBe(screen.getByRole('button'));
  });

  it('forwards the ref and native props to the tooltip', () => {
    const ref = createRef<HTMLDivElement>();
    setup({ ref, className: 'extra', id: 'tip' });
    expect(ref.current).toHaveAttribute('id', 'tip');
    expect(ref.current).toHaveClass('extra');
  });
});
