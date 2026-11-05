import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './TextInputV2.module.css';

export type TextInputV2Size = 'sm' | 'md' | 'lg';

export type TextInputV2Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: TextInputV2Size;
};

export const TextInputV2 = forwardRef<HTMLInputElement, TextInputV2Props>(function TextInputV2(
  { size = 'md', className, ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      data-size={size}
      className={[styles.input, styles[size], className].filter(Boolean).join(' ')}
    />
  );
});
