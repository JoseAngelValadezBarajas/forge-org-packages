import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ToggleButtonV2 } from '../ToggleButtonV2';
import { ToolbarSeparatorV2, ToolbarV2 } from './ToolbarV2';

afterEach(cleanup);

const tabIndexes = () =>
  screen
    .getAllByRole('button')
    .filter((button) => !(button as HTMLButtonElement).disabled)
    .map((button) => button.tabIndex);

function Tools({ orientation }: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <ToolbarV2 aria-label="Tools" orientation={orientation}>
      <ToggleButtonV2 aria-label="Select" />
      <ToggleButtonV2 aria-label="Add" />
      <ToolbarSeparatorV2 />
      <ToggleButtonV2 aria-label="Pan" disabled />
      <ToggleButtonV2 aria-label="Zoom" />
    </ToolbarV2>
  );
}

describe('ToolbarV2', () => {
  it('is a labelled toolbar with an orientation, and forwards its ref and class name', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ToolbarV2 ref={ref} aria-label="Tools" orientation="vertical" className="custom">
        <ToggleButtonV2 aria-label="Select" />
      </ToolbarV2>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Tools' });
    expect(ref.current).toBe(toolbar);
    expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
    expect(toolbar).toHaveClass('custom');
  });

  it('defaults to horizontal and makes the separator perpendicular to it', () => {
    render(<Tools />);
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('keeps one tab stop, on the first enabled control', () => {
    render(<Tools />);
    expect(tabIndexes()).toEqual([0, -1, -1]);
  });

  it('moves between controls with the arrow keys, skipping disabled ones and wrapping around', () => {
    render(<Tools />);
    const [select, add, , zoom] = screen.getAllByRole('button');
    select.focus();
    fireEvent.keyDown(select, { key: 'ArrowRight' });
    expect(add).toHaveFocus();
    fireEvent.keyDown(add, { key: 'ArrowRight' });
    expect(zoom).toHaveFocus();
    fireEvent.keyDown(zoom, { key: 'ArrowRight' });
    expect(select).toHaveFocus();
    fireEvent.keyDown(select, { key: 'ArrowLeft' });
    expect(zoom).toHaveFocus();
  });

  it('jumps to the ends with Home and End', () => {
    render(<Tools />);
    const [select, , , zoom] = screen.getAllByRole('button');
    select.focus();
    fireEvent.keyDown(select, { key: 'End' });
    expect(zoom).toHaveFocus();
    fireEvent.keyDown(zoom, { key: 'Home' });
    expect(select).toHaveFocus();
  });

  it('uses the vertical arrows when vertical and ignores the horizontal ones', () => {
    render(<Tools orientation="vertical" />);
    const [select, add] = screen.getAllByRole('button');
    select.focus();
    fireEvent.keyDown(select, { key: 'ArrowRight' });
    expect(select).toHaveFocus();
    fireEvent.keyDown(select, { key: 'ArrowDown' });
    expect(add).toHaveFocus();
  });

  it('makes the focused control the single tab stop', () => {
    render(<Tools />);
    const [, add] = screen.getAllByRole('button');
    add.focus();
    expect(tabIndexes()).toEqual([-1, 0, -1]);
  });

  it('lets a consumer key handler prevent the roving behaviour', () => {
    render(
      <ToolbarV2 aria-label="Tools" onKeyDown={(event) => event.preventDefault()}>
        <ToggleButtonV2 aria-label="One" />
        <ToggleButtonV2 aria-label="Two" />
      </ToolbarV2>,
    );
    const [one] = screen.getAllByRole('button');
    one.focus();
    fireEvent.keyDown(one, { key: 'ArrowRight' });
    expect(one).toHaveFocus();
  });
});
