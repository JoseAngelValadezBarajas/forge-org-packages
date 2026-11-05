import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SwitchV2 } from './SwitchV2';

afterEach(cleanup);

describe('SwitchV2', () => {
  it('renders a native checkbox with the switch role', () => {
    render(<SwitchV2>Notifications</SwitchV2>);
    const control = screen.getByRole('switch', { name: 'Notifications' });
    expect(control).toHaveAttribute('type', 'checkbox');
    expect(control.closest('label')).not.toBeNull();
  });

  it('toggles when its label is clicked', () => {
    render(<SwitchV2>Notifications</SwitchV2>);
    fireEvent.click(screen.getByText('Notifications'));
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('accepts an external name without a wrapping label', () => {
    render(<SwitchV2 aria-label="Notifications" />);
    expect(screen.getByRole('switch', { name: 'Notifications' }).closest('label')).toBeNull();
  });

  it('forwards its ref and native props to the input and class name to the root', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <SwitchV2 ref={ref} name="alerts" className="custom">
        Alerts
      </SwitchV2>,
    );
    const control = screen.getByRole('switch');
    expect(ref.current).toBe(control);
    expect(control).toHaveAttribute('name', 'alerts');
    expect(control.closest('label')).toHaveClass('custom');
  });

  it('works controlled', () => {
    const onChange = vi.fn();
    render(
      <SwitchV2 checked={false} onChange={onChange}>
        Alerts
      </SwitchV2>,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('marks the root and blocks changes when disabled', () => {
    const onChange = vi.fn();
    render(
      <SwitchV2 disabled onChange={onChange}>
        Alerts
      </SwitchV2>,
    );
    fireEvent.click(screen.getByText('Alerts'));
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('switch').closest('label')).toHaveAttribute('data-disabled', 'true');
  });
});
