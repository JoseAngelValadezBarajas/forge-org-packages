import { cleanup, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { TableV2, type TableV2Column } from './TableV2';

afterEach(cleanup);

type Video = { id: string; name: string; frames: number };
const rows: Video[] = [
  { id: 'a', name: 'first.mp4', frames: 120 },
  { id: 'b', name: 'second.mp4', frames: 2445 },
];
const columns: TableV2Column<Video>[] = [
  { key: 'name', header: 'Video', cell: (row) => row.name, rowHeader: true },
  { key: 'frames', header: 'Frames', cell: (row) => row.frames, align: 'end', width: '8rem' },
];

describe('TableV2', () => {
  it('renders a captioned table with column headers and one row per item', () => {
    render(<TableV2 caption="Videos" columns={columns} rows={rows} getRowKey={(row) => row.id} />);
    const table = screen.getByRole('table', { name: 'Videos' });
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Video', 'Frames']);
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getByRole('rowheader', { name: 'first.mp4' })).toHaveAttribute('scope', 'row');
    expect(within(table).getByRole('cell', { name: '2445' })).toHaveAttribute('data-align', 'end');
  });

  it('applies column widths through a colgroup', () => {
    const { container } = render(<TableV2 caption="Videos" columns={columns} rows={rows} getRowKey={(row) => row.id} />);
    const cols = container.querySelectorAll('col');
    expect(cols).toHaveLength(2);
    expect((cols[1] as HTMLElement).style.width).toBe('8rem');
    expect((cols[0] as HTMLElement).style.width).toBe('');
  });

  it('keeps a hidden caption available as the accessible name', () => {
    render(<TableV2 caption="Videos" hideCaption columns={columns} rows={rows} getRowKey={(row) => row.id} />);
    expect(screen.getByRole('table', { name: 'Videos' })).toBeInTheDocument();
  });

  it('shows the empty content in a single full-width cell when there are no rows', () => {
    render(<TableV2 caption="Videos" columns={columns} rows={[]} getRowKey={(row: Video) => row.id} empty="No videos yet" />);
    const cell = screen.getByRole('cell', { name: 'No videos yet' });
    expect(cell).toHaveAttribute('colspan', '2');
  });

  it('renders only the header when there are no rows and no empty content', () => {
    render(<TableV2 caption="Videos" columns={columns} rows={[]} getRowKey={(row: Video) => row.id} />);
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('marks the current row and exposes density', () => {
    render(<TableV2 caption="Videos" density="compact" currentKey="b" columns={columns} rows={rows} getRowKey={(row) => row.id} />);
    expect(screen.getByRole('table')).toHaveAttribute('data-density', 'compact');
    const current = screen.getAllByRole('row').filter((row) => row.getAttribute('aria-current') === 'true');
    expect(current).toHaveLength(1);
    expect(within(current[0]).getByRole('rowheader', { name: 'second.mp4' })).toBeInTheDocument();
  });

  it('passes the row and its index to the cell renderer, and forwards ref and native props', () => {
    const ref = createRef<HTMLTableElement>();
    render(
      <TableV2
        ref={ref}
        caption="Videos"
        className="custom"
        data-testid="table"
        columns={[{ key: 'n', header: 'N', cell: (row: Video, index) => `${index}:${row.id}` }]}
        rows={rows}
        getRowKey={(row) => row.id}
      />,
    );
    expect(ref.current).toBe(screen.getByTestId('table'));
    expect(ref.current).toHaveClass('custom');
    expect(screen.getByText('0:a')).toBeInTheDocument();
    expect(screen.getByText('1:b')).toBeInTheDocument();
  });
});
