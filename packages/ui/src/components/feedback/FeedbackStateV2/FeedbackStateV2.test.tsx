import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { FeedbackStateV2 } from './FeedbackStateV2';

afterEach(cleanup);

describe('FeedbackStateV2', () => {
  it('fits the consumer heading hierarchy and forwards the root ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<FeedbackStateV2 ref={ref} state="empty" title="No results" headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'No results' })).toBeInTheDocument();
    expect(ref.current).toBe(screen.getByRole('region', { name: 'No results' }));
  });

  it('renders a zero-valued description as valid React content', () => {
    render(<FeedbackStateV2 state="empty" title="Matching records" description={0} />);
    const panel = screen.getByRole('region', { name: 'Matching records' });
    expect(panel).toHaveAccessibleDescription('0');
  });

  it('keeps generated label and description ids distinct between instances', () => {
    render(<>
      <FeedbackStateV2 state="empty" title="Projects" description="No projects" />
      <FeedbackStateV2 state="empty" title="Members" description="No members" />
    </>);
    const projects = screen.getByRole('region', { name: 'Projects' });
    const members = screen.getByRole('region', { name: 'Members' });
    expect(projects.getAttribute('aria-labelledby')).not.toBe(members.getAttribute('aria-labelledby'));
    expect(projects).toHaveAccessibleDescription('No projects');
    expect(members).toHaveAccessibleDescription('No members');
  });
  it('announces errors with their heading, description, and actions', () => {
    render(
      <FeedbackStateV2
        state="error"
        title="Could not load projects"
        description="Check your connection and retry."
        actions={<button>Retry</button>}
        className="consumer-layout"
        data-testid="feedback-state"
      />,
    );

    const alert = screen.getByRole('alert', { name: 'Could not load projects' });
    expect(alert).toHaveClass('consumer-layout');
    expect(alert).toHaveAttribute('data-testid', 'feedback-state');
    expect(alert).toHaveAttribute('aria-describedby');
    expect(alert).toHaveTextContent('Check your connection and retry.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('announces loading without marking the live region busy and hides the decorative spinner', () => {
    render(<FeedbackStateV2 state="loading" title="Loading projects" />);

    const status = screen.getByRole('status', { name: 'Loading projects' });
    expect(status).not.toHaveAttribute('aria-busy', 'true');
    expect(status.querySelector('[data-feedback-spinner]')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(['empty', 'readOnly'] as const)(
    'exposes the %s state as a named region',
    (state) => {
      render(<FeedbackStateV2 state={state} title="No projects yet" />);

      expect(screen.getByRole('region', { name: 'No projects yet' })).toBeInTheDocument();
    },
  );
});
