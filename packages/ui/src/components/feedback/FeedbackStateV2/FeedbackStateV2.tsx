import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react';
import styles from './FeedbackStateV2.module.css';

export type FeedbackStateV2Kind = 'loading' | 'empty' | 'error' | 'readOnly';

export interface FeedbackStateV2Props extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'role' | 'aria-busy' | 'aria-describedby' | 'aria-labelledby'
> {
  state: FeedbackStateV2Kind;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export const FeedbackStateV2 = forwardRef<HTMLDivElement, FeedbackStateV2Props>(function FeedbackStateV2({
  state,
  title,
  description,
  icon,
  actions,
  headingLevel = 3,
  className,
  ...props
}, ref) {
  const id = `forge-feedback-state-v2-${useId().replace(/:/g, '')}`;
  const titleId = `${id}-title`;
  const hasDescription = description != null && typeof description !== 'boolean';
  const hasIcon = icon != null && typeof icon !== 'boolean';
  const hasActions = actions != null && typeof actions !== 'boolean';
  const descriptionId = hasDescription ? `${id}-description` : undefined;
  const role = state === 'loading' ? 'status' : state === 'error' ? 'alert' : 'region';
  const hasMarker = state === 'loading' || hasIcon;
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    <div
      {...props}
      ref={ref}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-state={state}
      className={
        [styles.panel, styles[state], hasMarker && styles.hasMarker, className]
          .filter(Boolean)
          .join(' ')
      }
    >
      {state === 'loading' ? (
        <span className={styles.spinner} data-feedback-spinner aria-hidden="true" />
      ) : (
        hasIcon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )
      )}
      <div className={styles.content}>
        <Heading id={titleId} className={styles.heading}>{title}</Heading>
        {hasDescription && <div id={descriptionId} className={styles.description}>{description}</div>}
        {hasActions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
});
