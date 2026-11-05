import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { AvatarGroupV2, AvatarV2 } from './AvatarV2';

afterEach(cleanup);

const image = (container: HTMLElement) => container.querySelector('img') as HTMLImageElement;

describe('AvatarV2', () => {
  it('is an image named by alt, with small circle defaults', () => {
    render(<AvatarV2 alt="Ada Lovelace" initials="AL" />);
    const avatar = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(avatar).toHaveAttribute('data-size', 'sm');
    expect(avatar).toHaveAttribute('data-shape', 'circle');
    expect(avatar).toHaveAttribute('data-content', 'initials');
    expect(avatar).toHaveTextContent('AL');
  });

  it('is hidden from assistive technology when alt is empty', () => {
    render(<AvatarV2 alt="" initials="AL" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the generic glyph without an image or initials', () => {
    const { container } = render(<AvatarV2 alt="Unknown" />);
    expect(screen.getByRole('img')).toHaveAttribute('data-content', 'fallback');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('keeps initials visible until the image loads', () => {
    const { container } = render(<AvatarV2 alt="Ada" src="/ada.png" initials="AL" />);
    expect(screen.getByRole('img')).toHaveAttribute('data-content', 'initials');
    fireEvent.load(image(container));
    expect(screen.getByRole('img')).toHaveAttribute('data-content', 'image');
    expect(screen.getByRole('img')).not.toHaveTextContent('AL');
  });

  it('falls back to initials and then to the glyph when the image fails', () => {
    const { container, rerender } = render(<AvatarV2 alt="Ada" src="/broken.png" initials="AL" />);
    fireEvent.error(image(container));
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('data-content', 'initials');
    rerender(<AvatarV2 alt="Ada" src="/broken.png" />);
    expect(screen.getByRole('img')).toHaveAttribute('data-content', 'fallback');
  });

  it('retries when src changes after a failure', () => {
    const { container, rerender } = render(<AvatarV2 alt="Ada" src="/broken.png" />);
    fireEvent.error(image(container));
    rerender(<AvatarV2 alt="Ada" src="/ok.png" />);
    fireEvent.load(image(container));
    expect(screen.getByRole('img')).toHaveAttribute('data-content', 'image');
  });

  it('does not show a stale image while a new src loads', () => {
    const { container, rerender } = render(<AvatarV2 alt="Ada" src="/one.png" initials="AL" />);
    fireEvent.load(image(container));
    rerender(<AvatarV2 alt="Ada" src="/two.png" initials="AL" />);
    expect(screen.getByRole('img')).toHaveAttribute('data-content', 'initials');
  });

  it('ignores an empty src', () => {
    const { container } = render(<AvatarV2 alt="Ada" src="" initials="AL" />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('keeps the inner image decorative and passes loading', () => {
    const { container } = render(<AvatarV2 alt="Ada" src="/ada.png" loading="lazy" />);
    expect(image(container)).toHaveAttribute('alt', '');
    expect(image(container)).toHaveAttribute('loading', 'lazy');
  });

  it('adds the status to the accessible name, so color is not the only signal', () => {
    const { container } = render(<AvatarV2 alt="Ada" statusTone="success" statusLabel="Available" />);
    expect(screen.getByRole('img', { name: 'Ada, Available' })).toBeInTheDocument();
    expect(container.querySelector('[data-status="success"]')).toBeInTheDocument();
  });

  it('stays exposed when only the status has meaning', () => {
    render(<AvatarV2 alt="" statusTone="error" statusLabel="Busy" />);
    expect(screen.getByRole('img', { name: 'Busy' })).toBeInTheDocument();
  });

  it.each(['sm', 'md', 'lg'] as const)('applies size %s', (size) => {
    render(<AvatarV2 alt="Ada" size={size} shape="rounded" />);
    expect(screen.getByRole('img')).toHaveAttribute('data-size', size);
    expect(screen.getByRole('img')).toHaveAttribute('data-shape', 'rounded');
  });

  it('forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<AvatarV2 ref={ref} alt="Ada" className="extra" />);
    expect(ref.current).toHaveClass('extra');
  });
});

describe('AvatarGroupV2', () => {
  const avatars = ['Ada', 'Grace', 'Linus', 'Margaret', 'Alan'].map((name) => <AvatarV2 key={name} alt={name} />);

  it('is a named group that sets the size of its avatars', () => {
    render(
      <AvatarGroupV2 aria-label="Team" size="lg">
        {avatars}
      </AvatarGroupV2>,
    );
    expect(screen.getByRole('group', { name: 'Team' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ada' })).toHaveAttribute('data-size', 'lg');
  });

  it('collapses the rest into a named count', () => {
    render(
      <AvatarGroupV2 aria-label="Team" max={3}>
        {avatars}
      </AvatarGroupV2>,
    );
    expect(screen.getAllByRole('img')).toHaveLength(4);
    expect(screen.getByRole('img', { name: '2 more' })).toHaveTextContent('+2');
    expect(screen.queryByRole('img', { name: 'Alan' })).not.toBeInTheDocument();
  });

  it('shows no count when everything fits', () => {
    render(
      <AvatarGroupV2 aria-label="Team" max={5}>
        {avatars}
      </AvatarGroupV2>,
    );
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('translates the count label', () => {
    render(
      <AvatarGroupV2 aria-label="Equipo" max={1} moreLabel={(count) => `${count} más`}>
        {avatars}
      </AvatarGroupV2>,
    );
    expect(screen.getByRole('img', { name: '4 más' })).toBeInTheDocument();
  });
});
