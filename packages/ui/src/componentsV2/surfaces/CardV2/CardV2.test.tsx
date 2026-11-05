import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CardV2 } from './CardV2';

afterEach(cleanup);

describe('CardV2', () => {
  it('renders a plain div with the default variant and no interactive semantics', () => {
    render(<CardV2 data-testid="card">Body</CardV2>);
    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
    expect(card).toHaveAttribute('data-variant', 'default');
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabindex');
  });

  it.each(['section', 'article', 'aside'] as const)('renders as %s', (as) => {
    render(
      <CardV2 as={as} data-testid="card">
        Body
      </CardV2>,
    );
    expect(screen.getByTestId('card').tagName).toBe(as.toUpperCase());
  });

  it('renders only the slots it receives, in order', () => {
    const { rerender } = render(
      <CardV2 data-testid="card" header="Title" footer="Footer">
        Body
      </CardV2>,
    );
    expect(screen.getByTestId('card').children).toHaveLength(3);
    expect(screen.getByTestId('card')).toHaveTextContent('TitleBodyFooter');
    rerender(<CardV2 data-testid="card" header="Title" />);
    expect(screen.getByTestId('card').children).toHaveLength(1);
  });

  it('forwards its ref, native props and custom class name', () => {
    const ref = createRef<HTMLElement>();
    render(
      <CardV2 ref={ref} data-testid="card" id="atlas" className="custom">
        Body
      </CardV2>,
    );
    const card = screen.getByTestId('card');
    expect(ref.current).toBe(card);
    expect(card).toHaveAttribute('id', 'atlas');
    expect(card).toHaveClass('custom');
  });

  it('is a non-submitting button when interactive, and activates', () => {
    const onClick = vi.fn();
    render(
      <CardV2 variant="interactive" header="Open" onClick={onClick}>
        Body
      </CardV2>,
    );
    const card = screen.getByRole('button', { name: /Open/ });
    expect(card).toHaveAttribute('type', 'button');
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps phrasing content inside an interactive card', () => {
    render(
      <CardV2 variant="interactive" header="Open" footer="More">
        Body
      </CardV2>,
    );
    expect(screen.getByRole('button').querySelector('div')).toBeNull();
  });

  it('stays inert when an interactive button is disabled', () => {
    const onClick = vi.fn();
    render(<CardV2 variant="interactive" header="Open" disabled onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('can be an interactive link', () => {
    render(<CardV2 variant="interactive" as="a" href="/atlas" header="Atlas" />);
    const link = screen.getByRole('link', { name: 'Atlas' });
    expect(link).toHaveAttribute('href', '/atlas');
    expect(link).not.toHaveAttribute('type');
  });
});
