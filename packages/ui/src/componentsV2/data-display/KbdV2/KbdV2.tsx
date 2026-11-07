import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './KbdV2.module.css';

export type KbdV2Size = 'sm' | 'md';

export type KbdV2Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  size?: KbdV2Size;
  children: ReactNode;
};

/** A keyboard key, for shortcut hints. Renders a native `kbd` element. */
export const KbdV2 = forwardRef<HTMLElement, KbdV2Props>(function KbdV2(
  { size = 'md', className, children, ...props },
  ref,
) {
  return (
    <kbd {...props} ref={ref} data-size={size} className={[styles.kbd, styles[size], className].filter(Boolean).join(' ')}>
      {children}
    </kbd>
  );
});
