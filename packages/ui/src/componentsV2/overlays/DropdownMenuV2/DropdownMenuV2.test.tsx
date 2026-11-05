import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { DropdownMenuV2, type DropdownMenuV2Item } from './DropdownMenuV2';

beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});

afterEach(cleanup);

const onEdit = vi.fn();
const onArchive = vi.fn();
const items: DropdownMenuV2Item[] = [
  { id: 'edit', label: 'Edit', onSelect: onEdit },
  { id: 'duplicate', label: 'Duplicate' },
  { type: 'separator', id: 'split' },
  { id: 'archive', label: 'Archive unavailable', disabled: true, onSelect: onArchive },
  { id: 'delete', label: 'Delete', destructive: true },
];

const setup = (props = {}) => {
  render(<DropdownMenuV2 trigger={<button type="button">More actions</button>} items={items} {...props} />);
  return screen.getByRole('button', { name: 'More actions' });
};
const menu = () => screen.getByRole('menu', { hidden: true });
const item = (name: string) => screen.getByRole('menuitem', { name, hidden: true });
const press = (key: string) => fireEvent.keyDown(document.activeElement as Element, { key });

describe('DropdownMenuV2', () => {
  it('wires the trigger as a menu button', () => {
    const trigger = setup();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(menu()).toHaveAttribute('aria-labelledby', trigger.id);
  });

  it('uses an explicit label instead of the trigger', () => {
    setup({ 'aria-label': 'Row actions' });
    expect(menu()).toHaveAttribute('aria-label', 'Row actions');
    expect(menu()).not.toHaveAttribute('aria-labelledby');
  });

  it('renders menu items and a non-focusable separator', () => {
    setup({ defaultOpen: true });
    expect(screen.getAllByRole('menuitem', { hidden: true })).toHaveLength(4);
    expect(screen.getByRole('separator', { hidden: true })).not.toHaveAttribute('tabindex');
    expect(item('Delete')).toHaveAttribute('data-destructive', 'true');
    expect(item('Archive unavailable')).toBeDisabled();
  });

  it('focuses the menu after a pointer click and the first item after a keyboard click', () => {
    const trigger = setup();
    fireEvent.click(trigger, { detail: 1 });
    expect(menu()).toHaveFocus();
    fireEvent.click(trigger, { detail: 1 });
    fireEvent.click(trigger, { detail: 0 });
    expect(item('Edit')).toHaveFocus();
  });

  it('opens on ArrowDown at the first item and on ArrowUp at the last', () => {
    const trigger = setup();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(item('Edit')).toHaveFocus();
    press('Escape');
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    expect(item('Delete')).toHaveFocus();
  });

  it('moves with the arrows, wraps, and skips disabled items', () => {
    const trigger = setup();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    press('ArrowDown');
    expect(item('Duplicate')).toHaveFocus();
    press('ArrowDown');
    expect(item('Delete')).toHaveFocus();
    press('ArrowDown');
    expect(item('Edit')).toHaveFocus();
    press('ArrowUp');
    expect(item('Delete')).toHaveFocus();
  });

  it('jumps with Home and End', () => {
    const trigger = setup();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    press('End');
    expect(item('Delete')).toHaveFocus();
    press('Home');
    expect(item('Edit')).toHaveFocus();
  });

  it('goes to the first item on ArrowDown from the menu itself', () => {
    const trigger = setup();
    fireEvent.click(trigger, { detail: 1 });
    press('ArrowDown');
    expect(item('Edit')).toHaveFocus();
  });

  it('finds enabled labels by typing, and ignores disabled ones', () => {
    const trigger = setup();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    press('d');
    expect(item('Duplicate')).toHaveFocus();
    press('d');
    expect(item('Delete')).toHaveFocus();
    press('d');
    expect(item('Duplicate')).toHaveFocus();
  });

  it('matches a typed prefix', () => {
    const trigger = setup();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    press('d');
    press('e');
    expect(item('Delete')).toHaveFocus();
  });

  it('ignores a label of a disabled item while typing', () => {
    const trigger = setup();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    press('a');
    expect(item('Edit')).toHaveFocus();
  });

  it('activates, closes, and returns focus to the trigger', () => {
    onEdit.mockClear();
    const trigger = setup();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.click(item('Edit'));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(menu()).toHaveAttribute('data-state', 'closed');
    expect(trigger).toHaveFocus();
  });

  it('never activates a disabled item', () => {
    onArchive.mockClear();
    setup({ defaultOpen: true });
    fireEvent.click(item('Archive unavailable'));
    expect(onArchive).not.toHaveBeenCalled();
    expect(menu()).toHaveAttribute('data-state', 'open');
  });

  it('closes on Escape and restores the trigger focus', () => {
    const trigger = setup();
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    press('Escape');
    expect(menu()).toHaveAttribute('data-state', 'closed');
    expect(trigger).toHaveFocus();
  });

  it('closes on Tab through the trigger', () => {
    const trigger = setup();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    press('Tab');
    expect(menu()).toHaveAttribute('data-state', 'closed');
    expect(trigger).toHaveFocus();
  });

  it('closes on an outside press', () => {
    setup({ defaultOpen: true });
    fireEvent.pointerDown(document.body);
    expect(menu()).toHaveAttribute('data-state', 'closed');
  });

  it('highlights the hovered item through focus', () => {
    setup({ defaultOpen: true });
    fireEvent.pointerMove(item('Duplicate'));
    expect(item('Duplicate')).toHaveFocus();
    fireEvent.pointerLeave(item('Duplicate'));
    expect(menu()).toHaveFocus();
  });

  it('reserves the icon column only when an item has an icon', () => {
    render(
      <DropdownMenuV2
        trigger={<button type="button">Icons</button>}
        defaultOpen
        items={[
          { id: 'a', label: 'With', icon: <svg data-testid="icon" /> },
          { id: 'b', label: 'Without' },
        ]}
      />,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Without', hidden: true }).querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it('stays controlled and forwards the ref', () => {
    const ref = createRef<HTMLDivElement>();
    const onOpenChange = vi.fn();
    setup({ ref, open: true, onOpenChange, density: 'comfortable', className: 'extra' });
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(ref.current).toHaveAttribute('data-state', 'open');
    expect(ref.current).toHaveAttribute('data-density', 'comfortable');
    expect(ref.current).toHaveClass('extra');
  });
});
