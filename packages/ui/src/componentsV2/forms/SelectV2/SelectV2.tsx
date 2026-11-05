import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { forwardRef, type SelectHTMLAttributes } from 'react';
import styles from './SelectV2.module.css';

export type SelectV2Size = 'sm' | 'md' | 'lg';

export type SelectV2Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'multiple'> & {
  size?: SelectV2Size;
};

export const SelectV2 = forwardRef<HTMLSelectElement, SelectV2Props>(function SelectV2(
  { size = 'md', className, style, ...props },
  ref,
) {
  return (
    <span className={[styles.root, className].filter(Boolean).join(' ')} style={style}>
      <select {...props} ref={ref} data-size={size} className={[styles.select, styles[size]].join(' ')} />
      <svg className={styles.chevron} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M3 6L8 11L13 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
});
