import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { Check, Close } from '@corefoundry-labs/forge-icons';
import { forwardRef, type HTMLAttributes, type MouseEventHandler, type ReactNode } from 'react';
import styles from './AlertV2.module.css';

export type AlertV2Tone = 'info' | 'success' | 'warning' | 'error' | 'neutral';
export type AlertV2Variant = 'soft' | 'solid' | 'outline';

type AlertV2Base = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> & {
  tone?: AlertV2Tone;
  variant?: AlertV2Variant;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  onDismiss?: MouseEventHandler<HTMLButtonElement>;
  dismissLabel?: string;
};

export type AlertV2Props = AlertV2Base &
  ({ title: ReactNode } | { description: ReactNode } | { children: ReactNode });

const glyphs: Record<AlertV2Tone, ReactNode> = {
  info: 'i',
  success: <Check />,
  warning: '!',
  error: '×',
  neutral: '•',
};

export const AlertV2 = forwardRef<HTMLDivElement, AlertV2Props>(function AlertV2(
  {
    tone = 'info',
    variant = 'soft',
    title,
    description,
    children,
    icon,
    actions,
    onDismiss,
    dismissLabel = 'Close',
    role = tone === 'error' ? 'alert' : 'status',
    className,
    ...props
  },
  ref,
) {
  const body = description ?? children;

  return (
    <div
      {...props}
      ref={ref}
      role={role}
      data-tone={tone}
      data-variant={variant}
      className={[styles.alert, styles[tone], styles[variant], className].filter(Boolean).join(' ')}
    >
      {icon !== null && (
        <span className={styles.icon} aria-hidden="true">
          {icon ?? glyphs[tone]}
        </span>
      )}
      <div className={styles.content}>
        {title != null && <div className={styles.title}>{title}</div>}
        {body != null && <div className={styles.description}>{body}</div>}
        {actions != null && <div className={styles.actions}>{actions}</div>}
      </div>
      {onDismiss && (
        <button type="button" className={styles.dismiss} aria-label={dismissLabel} onClick={onDismiss}>
          <Close aria-hidden="true" />
        </button>
      )}
    </div>
  );
});
