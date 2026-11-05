import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { forwardRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import styles from './ButtonV2.module.css';

export type ButtonV2Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonV2Size = 'sm' | 'md' | 'lg';

type ButtonV2Base = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ButtonV2Variant;
  size?: ButtonV2Size;
  loading?: boolean;
  loadingLabel?: string;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
};

export type ButtonV2Props = ButtonV2Base &
  ({ children: ReactNode } | { children?: undefined; 'aria-label': string });

export const ButtonV2 = forwardRef<HTMLButtonElement, ButtonV2Props>(function ButtonV2(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingLabel = 'Saving…',
    iconStart,
    iconEnd,
    className,
    children,
    onClick,
    type = 'button',
    ...props
  },
  ref,
) {
  const iconOnly = children == null;
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      data-variant={variant}
      data-size={size}
      onClick={handleClick}
      className={[styles.button, styles[variant], styles[size], iconOnly && styles.iconOnly, className]
        .filter(Boolean)
        .join(' ')}
    >
      {loading ? (
        <span className={styles.spinner} data-button-spinner aria-hidden="true" />
      ) : (
        iconStart != null && (
          <span className={styles.icon} aria-hidden="true">
            {iconStart}
          </span>
        )
      )}
      {!iconOnly && <span className={styles.label}>{loading ? loadingLabel : children}</span>}
      {!loading && iconEnd != null && (
        <span className={styles.icon} aria-hidden="true">
          {iconEnd}
        </span>
      )}
    </button>
  );
});
