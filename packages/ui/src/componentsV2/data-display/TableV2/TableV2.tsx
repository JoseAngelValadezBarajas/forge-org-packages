import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { forwardRef, type ForwardedRef, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import styles from './TableV2.module.css';

export type TableV2Density = 'comfortable' | 'compact';
export type TableV2Align = 'start' | 'center' | 'end';

export type TableV2Column<Row> = {
  /** Stable identifier for the column. */
  key: string;
  header: ReactNode;
  cell: (row: Row, index: number) => ReactNode;
  /** Any CSS width, for example `12rem` or `20%`. Columns without one share the remaining space. */
  width?: string;
  align?: TableV2Align;
  /** Marks the cell as the row's header, so assistive technology reads it as the row's name. */
  rowHeader?: boolean;
};

export type TableV2Props<Row> = Omit<HTMLAttributes<HTMLTableElement>, 'children'> & {
  columns: readonly TableV2Column<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row, index: number) => string;
  /** The table's accessible name. */
  caption: ReactNode;
  /** Keeps the caption for assistive technology only. */
  hideCaption?: boolean;
  density?: TableV2Density;
  /** Shown in place of the rows when there are none. */
  empty?: ReactNode;
  /** Marks one row as the current one with `aria-current`. */
  currentKey?: string;
};

function TableV2Inner<Row>(
  { columns, rows, getRowKey, caption, hideCaption = false, density = 'comfortable', empty, currentKey, className, ...props }: TableV2Props<Row>,
  ref: ForwardedRef<HTMLTableElement>,
) {
  return (
    <div className={styles.frame}>
      <table
        {...props}
        ref={ref}
        data-density={density}
        className={[styles.table, styles[density], className].filter(Boolean).join(' ')}
      >
        <caption className={[styles.caption, hideCaption && styles.hidden].filter(Boolean).join(' ')}>{caption}</caption>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={styles.header} data-align={column.align ?? 'start'}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && empty != null ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const key = getRowKey(row, index);
              return (
                <tr key={key} className={styles.row} aria-current={key === currentKey ? 'true' : undefined}>
                  {columns.map((column) =>
                    column.rowHeader ? (
                      <th key={column.key} scope="row" className={styles.cell} data-align={column.align ?? 'start'}>
                        {column.cell(row, index)}
                      </th>
                    ) : (
                      <td key={column.key} className={styles.cell} data-align={column.align ?? 'start'}>
                        {column.cell(row, index)}
                      </td>
                    ),
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/** A semantic data table. It owns structure, spacing and accessibility; the cells' content stays the consumer's. */
export const TableV2 = forwardRef(TableV2Inner) as <Row>(
  props: TableV2Props<Row> & { ref?: Ref<HTMLTableElement> },
) => ReactElement;
