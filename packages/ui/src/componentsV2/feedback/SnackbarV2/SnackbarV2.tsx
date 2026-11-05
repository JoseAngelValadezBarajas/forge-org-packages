import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { Close } from '@corefoundry-labs/forge-icons';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { chain, useLatest, useOpenLifecycle } from '../../overlays/layer';
import styles from './SnackbarV2.module.css';

export type SnackbarV2Tone = 'neutral' | 'info' | 'success' | 'warning' | 'error';
export type SnackbarV2Density = 'compact' | 'detailed';
export type SnackbarV2DismissReason = 'timeout' | 'close';
export type SnackbarStackV2Placement = 'bottom-center' | 'bottom-end';

export type SnackbarV2Props = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> & {
  title: ReactNode;
  description?: ReactNode;
  tone?: SnackbarV2Tone;
  density?: SnackbarV2Density;
  action?: ReactNode;
  dismissible?: boolean;
  dismissLabel?: string;
  duration?: number | null;
  onDismiss?: (reason: SnackbarV2DismissReason) => void;
};

export type SnackbarStackV2Props = Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'popover'> & {
  placement?: SnackbarStackV2Placement;
};

const defaultDuration = 5000;

export const SnackbarV2 = forwardRef<HTMLDivElement, SnackbarV2Props>(function SnackbarV2(
  {
    title,
    description,
    tone = 'neutral',
    density = 'compact',
    action,
    dismissible = true,
    dismissLabel = 'Dismiss',
    duration = action != null || tone === 'error' ? null : defaultDuration,
    onDismiss,
    role = tone === 'error' ? 'alert' : 'status',
    className,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dismiss = useLatest(onDismiss);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const remaining = useRef<number | null>(null);
  const startedAt = useRef(0);
  const pauses = useRef(new Set<string>());
  const returnTo = useRef<EventTarget | null>(null);
  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

  const run = useCallback(() => {
    if (timer.current !== undefined || pauses.current.size > 0 || remaining.current === null) return;
    startedAt.current = Date.now();
    timer.current = setTimeout(() => {
      timer.current = undefined;
      remaining.current = null;
      dismiss.current?.('timeout');
    }, remaining.current);
  }, [dismiss]);

  const pause = useCallback((reason: string) => {
    pauses.current.add(reason);
    if (rootRef.current) rootRef.current.dataset.paused = 'true';
    if (timer.current === undefined || remaining.current === null) return;
    clearTimeout(timer.current);
    timer.current = undefined;
    remaining.current = Math.max(remaining.current - (Date.now() - startedAt.current), 0);
  }, []);

  const resume = useCallback(
    (reason: string) => {
      pauses.current.delete(reason);
      if (pauses.current.size === 0 && rootRef.current) delete rootRef.current.dataset.paused;
      run();
    },
    [run],
  );

  useEffect(() => {
    remaining.current = duration;
    run();
    return () => {
      clearTimeout(timer.current);
      timer.current = undefined;
    };
  }, [duration, run]);

  useEffect(() => {
    const sync = () => (document.hidden ? pause('hidden') : resume('hidden'));
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [pause, resume]);

  useLayoutEffect(() => {
    const node = rootRef.current;
    return () => {
      const target = returnTo.current;
      if (node?.contains(document.activeElement) && target instanceof HTMLElement) {
        target.focus({ preventScroll: true });
      }
    };
  }, []);

  const focusIn = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) returnTo.current = event.relatedTarget;
    pause('focus');
  };

  const focusOut = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) resume('focus');
  };

  return (
    <div
      {...props}
      ref={rootRef}
      role={role}
      data-tone={tone}
      data-density={density}
      onPointerEnter={chain(onPointerEnter, () => pause('hover'))}
      onPointerLeave={chain(onPointerLeave, () => resume('hover'))}
      onFocus={chain(onFocus, focusIn)}
      onBlur={chain(onBlur, focusOut)}
      className={[styles.snackbar, styles[tone], styles[density], className].filter(Boolean).join(' ')}
    >
      <span className={styles.indicator} aria-hidden="true" />
      <div className={styles.text}>
        <div className={styles.title}>{title}</div>
        {description != null && <div className={styles.description}>{description}</div>}
      </div>
      {action != null && <div className={styles.action}>{action}</div>}
      {dismissible && onDismiss && (
        <button type="button" className={styles.dismiss} aria-label={dismissLabel} onClick={() => onDismiss('close')}>
          <Close aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

export const SnackbarStackV2 = forwardRef<HTMLDivElement, SnackbarStackV2Props>(function SnackbarStackV2(
  { placement = 'bottom-center', 'aria-label': label = 'Notifications', className, children, ...props },
  ref,
) {
  const stackRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => stackRef.current as HTMLDivElement);

  useOpenLifecycle(true, () => {
    const stack = stackRef.current;
    stack?.showPopover?.();
    return () => stack?.hidePopover?.();
  });

  return (
    <div
      {...props}
      ref={stackRef}
      role="region"
      aria-label={label}
      popover="manual"
      data-placement={placement}
      className={[styles.stack, styles[placement === 'bottom-end' ? 'end' : 'center'], className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
});
