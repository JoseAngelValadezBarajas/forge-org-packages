import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './ProgressV2.module.css';

export type ProgressV2Shape = 'linear' | 'circular';
export type ProgressV2Status = 'normal' | 'success' | 'error';

type ProgressV2Base = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'role' | 'aria-label' | 'aria-labelledby' | 'aria-valuenow' | 'aria-valuemin' | 'aria-valuemax'
> & {
  shape?: ProgressV2Shape;
  status?: ProgressV2Status;
  valueLabel?: ReactNode;
};

type ProgressV2Name =
  | { label: string; 'aria-label'?: undefined; 'aria-labelledby'?: undefined }
  | { label?: undefined; 'aria-label': string; 'aria-labelledby'?: undefined }
  | { label?: undefined; 'aria-label'?: undefined; 'aria-labelledby': string };

type ProgressV2Value =
  | { value: number; max?: number; indeterminate?: false }
  | { indeterminate: true; value?: undefined; max?: undefined };

export type ProgressV2Props = ProgressV2Base & ProgressV2Name & ProgressV2Value;

const center = 35;
const radius = 31.5;

export const ProgressV2 = forwardRef<HTMLDivElement, ProgressV2Props>(function ProgressV2(
  {
    shape = 'linear',
    status = 'normal',
    value,
    max = 100,
    indeterminate = false,
    label,
    valueLabel,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
    ...props
  },
  ref,
) {
  const limit = max > 0 ? max : 100;
  const current = Math.min(Math.max(Number.isFinite(value) ? (value as number) : 0, 0), limit);
  const percent = (current / limit) * 100;
  const circular = shape === 'circular';
  const fallback = indeterminate ? (circular ? '…' : 'Ongoing') : `${Math.round(percent)}%`;
  const text = valueLabel === undefined ? fallback : valueLabel;

  return (
    <div
      {...props}
      ref={ref}
      role="progressbar"
      aria-label={label ?? ariaLabel}
      aria-labelledby={labelledBy}
      aria-valuenow={indeterminate ? undefined : current}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : limit}
      data-shape={shape}
      data-status={status}
      data-indeterminate={indeterminate || undefined}
      className={[styles.progress, styles[shape], styles[status], className].filter(Boolean).join(' ')}
    >
      {circular ? (
        <>
          <svg className={styles.ring} viewBox="0 0 70 70" aria-hidden="true">
            <circle className={styles.ringTrack} cx={center} cy={center} r={radius} />
            {(indeterminate || percent > 0) && (
              <circle
                className={[styles.ringArc, indeterminate && styles.spin].filter(Boolean).join(' ')}
                cx={center}
                cy={center}
                r={radius}
                pathLength={100}
                strokeDasharray={`${indeterminate ? 25 : percent} 100`}
              />
            )}
          </svg>
          {text != null && <span className={styles.ringValue}>{text}</span>}
        </>
      ) : (
        <>
          {(label != null || text != null) && (
            <div className={styles.header}>
              {label != null && <span className={styles.label}>{label}</span>}
              {text != null && <span className={styles.value}>{text}</span>}
            </div>
          )}
          <div className={styles.track}>
            <div
              className={[styles.fill, indeterminate && styles.moving].filter(Boolean).join(' ')}
              style={indeterminate ? undefined : { width: `${percent}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
});
