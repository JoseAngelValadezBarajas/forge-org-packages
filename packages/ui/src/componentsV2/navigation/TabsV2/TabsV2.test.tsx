import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TabsV2, type TabsV2Item } from './TabsV2';

afterEach(cleanup);

const items: TabsV2Item[] = [
  { id: 'one', label: 'One', content: 'Panel one' },
  { id: 'two', label: 'Two', content: 'Panel two', disabled: true },
  { id: 'three', label: 'Three', content: 'Panel three' },
  { id: 'four', label: 'Four', content: 'Panel four' },
];
const tab = (name: string) => screen.getByRole('tab', { name });
const press = (name: string, key: string) => fireEvent.keyDown(tab(name), { key });

describe('TabsV2', () => {
  it('reports a click on the shown tab when the controlled value fell back', () => {
    const onValueChange = vi.fn();
    const fallback = [
      { id: 'one', label: 'One', content: 'Panel one' },
      { id: 'two', label: 'Two', content: 'Panel two', disabled: true },
    ];
    render(<TabsV2 aria-label="Views" items={fallback} value="two" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'One' }));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('one');
  });

  it('stays silent on a click on the tab already selected by default', () => {
    const onValueChange = vi.fn();
    render(<TabsV2 aria-label="Views" items={[{ id: 'one', label: 'One', content: 'Panel' }]} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'One' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('links a named tablist, tabs and panels', () => {
    render(<TabsV2 aria-label="Views" items={items} />);
    expect(screen.getByRole('tablist', { name: 'Views' })).toBeInTheDocument();
    const panel = screen.getByRole('tabpanel', { name: 'One' });
    expect(panel).toHaveTextContent('Panel one');
    expect(tab('One')).toHaveAttribute('aria-selected', 'true');
    expect(tab('One')).toHaveAttribute('aria-controls', panel.id);
    expect(tab('Three')).toHaveAttribute('aria-selected', 'false');
    expect(document.getElementById(tab('Three').getAttribute('aria-controls') as string)).not.toBeNull();
  });

  it('gives two instances with the same ids distinct DOM ids', () => {
    render(
      <>
        <TabsV2 aria-label="First" items={items} />
        <TabsV2 aria-label="Second" items={items} />
      </>,
    );
    const ids = screen.getAllByRole('tab', { name: 'One' }).map((element) => element.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('keeps one tab stop on the selected tab', () => {
    render(<TabsV2 aria-label="Views" items={items} defaultValue="three" />);
    expect(tab('Three')).toHaveAttribute('tabindex', '0');
    expect(tab('One')).toHaveAttribute('tabindex', '-1');
    expect(tab('Four')).toHaveAttribute('tabindex', '-1');
  });

  it('selects on click and reports the change', () => {
    const onValueChange = vi.fn();
    render(<TabsV2 aria-label="Views" items={items} onValueChange={onValueChange} />);
    fireEvent.click(tab('Three'));
    expect(tab('Three')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel three');
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('three');
    fireEvent.click(tab('Three'));
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  it('moves with the arrow keys, wraps and skips disabled tabs', () => {
    render(<TabsV2 aria-label="Views" items={items} />);
    tab('One').focus();
    press('One', 'ArrowRight');
    expect(tab('Three')).toHaveFocus();
    expect(tab('Three')).toHaveAttribute('aria-selected', 'true');
    press('Three', 'ArrowLeft');
    expect(tab('One')).toHaveFocus();
    press('One', 'ArrowLeft');
    expect(tab('Four')).toHaveFocus();
    press('Four', 'ArrowRight');
    expect(tab('One')).toHaveFocus();
  });

  it('jumps with Home and End to enabled tabs', () => {
    const disabledEdges = [{ ...items[0]!, disabled: true }, items[2]!, items[3]!, { ...items[1]!, disabled: true }];
    render(<TabsV2 aria-label="Views" items={disabledEdges} defaultValue="three" />);
    tab('Three').focus();
    press('Three', 'End');
    expect(tab('Four')).toHaveFocus();
    press('Four', 'Home');
    expect(tab('Three')).toHaveFocus();
  });

  it('reverses the arrow keys in right-to-left layouts', () => {
    render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <TabsV2 aria-label="Views" items={items} />
      </div>,
    );
    tab('One').focus();
    press('One', 'ArrowLeft');
    expect(tab('Three')).toHaveFocus();
  });

  it('moves focus without selecting under manual activation', () => {
    render(<TabsV2 aria-label="Views" items={items} activation="manual" />);
    tab('One').focus();
    press('One', 'ArrowRight');
    expect(tab('Three')).toHaveFocus();
    expect(tab('Three')).toHaveAttribute('tabindex', '0');
    expect(tab('One')).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(tab('Three'));
    expect(tab('Three')).toHaveAttribute('aria-selected', 'true');
  });

  it('returns the tab stop to the selected tab when focus leaves', () => {
    render(
      <>
        <TabsV2 aria-label="Views" items={items} activation="manual" />
        <button type="button">After</button>
      </>,
    );
    tab('One').focus();
    press('One', 'ArrowRight');
    act(() => screen.getByRole('button', { name: 'After' }).focus());
    expect(tab('One')).toHaveAttribute('tabindex', '0');
    expect(tab('Three')).toHaveAttribute('tabindex', '-1');
  });

  it('follows the parent when controlled', () => {
    const onValueChange = vi.fn();
    function Parent({ follow }: { follow: boolean }) {
      const [value, setValue] = useState('one');
      return (
        <TabsV2
          aria-label="Views"
          items={items}
          value={value}
          onValueChange={(id) => {
            onValueChange(id);
            if (follow) setValue(id);
          }}
        />
      );
    }
    const { rerender } = render(<Parent follow={false} />);
    fireEvent.click(tab('Three'));
    expect(onValueChange).toHaveBeenCalledWith('three');
    expect(tab('One')).toHaveAttribute('aria-selected', 'true');
    rerender(<Parent follow />);
    fireEvent.click(tab('Three'));
    expect(tab('Three')).toHaveAttribute('aria-selected', 'true');
  });

  it('ignores disabled tabs and falls back from a disabled value', () => {
    const onValueChange = vi.fn();
    render(<TabsV2 aria-label="Views" items={items} defaultValue="two" onValueChange={onValueChange} />);
    expect(tab('One')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Two')).toBeDisabled();
    fireEvent.click(tab('Two'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps hidden panels mounted so their content survives a tab change', () => {
    render(<TabsV2 aria-label="Views" items={items} />);
    expect(screen.getByText('Panel three')).not.toBeVisible();
    fireEvent.click(tab('Three'));
    expect(screen.getByText('Panel three')).toBeVisible();
    expect(screen.getByText('Panel one')).not.toBeVisible();
  });

  it('forwards its ref and class name to the root, and exposes variant and size', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <TabsV2 ref={ref} aria-label="Views" items={items} variant="pill" size="sm" className="custom" data-testid="tabs" />,
    );
    const root = screen.getByTestId('tabs');
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('custom');
    expect(root).toHaveAttribute('data-variant', 'pill');
    expect(root).toHaveAttribute('data-size', 'sm');
  });

  it('draws the indicator only for the underline variant', () => {
    const { rerender } = render(<TabsV2 aria-label="Views" items={items} />);
    expect(tab('One').querySelector('[aria-hidden="true"]')).not.toBeNull();
    rerender(<TabsV2 aria-label="Views" items={items} variant="pill" />);
    expect(tab('One').querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('renders nothing without items', () => {
    const { container } = render(<TabsV2 aria-label="Views" items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
