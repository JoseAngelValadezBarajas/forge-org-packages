import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { KbdV2 } from './KbdV2';

afterEach(cleanup);

describe('KbdV2', () => {
  it('renders a native kbd element with md as the default size', () => {
    render(<KbdV2>Ctrl</KbdV2>);
    const key = screen.getByText('Ctrl');
    expect(key.tagName).toBe('KBD');
    expect(key).toHaveAttribute('data-size', 'md');
  });

  it('supports the sm size, a custom class name, native props and ref forwarding', () => {
    const ref = createRef<HTMLElement>();
    render(
      <KbdV2 ref={ref} size="sm" className="custom" title="Delete">
        Del
      </KbdV2>,
    );
    const key = screen.getByText('Del');
    expect(ref.current).toBe(key);
    expect(key).toHaveAttribute('data-size', 'sm');
    expect(key).toHaveClass('custom');
    expect(key).toHaveAttribute('title', 'Delete');
  });
});
