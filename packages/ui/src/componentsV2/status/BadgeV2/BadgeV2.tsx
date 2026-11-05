import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './BadgeV2.module.css';

export type BadgeV2Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeV2Variant = 'solid' | 'subtle' | 'outline';
export type BadgeV2Size = 'sm' | 'md';

export type BadgeV2Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  tone?: BadgeV2Tone;
  variant?: BadgeV2Variant;
  size?: BadgeV2Size;
  children: ReactNode;
};

export const BadgeV2 = forwardRef<HTMLSpanElement, BadgeV2Props>(function BadgeV2(
  { tone = 'neutral', variant = 'solid', size = 'sm', className, children, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      data-tone={tone}
      data-variant={variant}
      data-size={size}
      className={[styles.badge, styles[tone], styles[variant], styles[size], className].filter(Boolean).join(' ')}
    >
      <span className={styles.label}>{children}</span>
    </span>
  );
});
