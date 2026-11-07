import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './StatisticV2.module.css';

export type StatisticV2Variant = 'plain' | 'card' | 'trend';
export type StatisticV2TrendDirection = 'rising' | 'falling' | 'unchanged';
/** Whether the change is good, bad or neither. An increase is not always positive, so the caller decides. */
export type StatisticV2TrendIntent = 'positive' | 'negative' | 'neutral';

export type StatisticV2Trend = {
  direction: StatisticV2TrendDirection;
  /** The change itself, for example `+12.4%`. */
  delta: ReactNode;
  /** What it is compared with, for example `from previous sample`. */
  baseline?: ReactNode;
  intent?: StatisticV2TrendIntent;
};

export type StatisticV2Props = Omit<HTMLAttributes<HTMLDListElement>, 'children'> & {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  /** `trend` uses the card style and shows the `trend` line when one is given. */
  variant?: StatisticV2Variant;
  trend?: StatisticV2Trend;
};

const arrows: Record<StatisticV2TrendDirection, string> = { rising: '↗', falling: '↘', unchanged: '→' };
const words: Record<StatisticV2TrendDirection, string> = { rising: 'Rising', falling: 'Falling', unchanged: 'Unchanged' };

/** A number with its label, unit and, optionally, how it changed. Meaning and formatting stay with the caller. */
export const StatisticV2 = forwardRef<HTMLDListElement, StatisticV2Props>(function StatisticV2(
  { label, value, unit, variant = 'plain', trend, className, ...props },
  ref,
) {
  return (
    <dl
      {...props}
      ref={ref}
      data-variant={variant}
      className={[styles.statistic, variant !== 'plain' && styles.card, className].filter(Boolean).join(' ')}
    >
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>
        <span className={styles.number}>{value}</span>
        {unit != null && <span className={styles.unit}>{unit}</span>}
      </dd>
      {trend && variant !== 'plain' && (
        <dd className={styles.trend} data-direction={trend.direction} data-intent={trend.intent ?? 'neutral'}>
          <span className={styles.arrow} aria-hidden="true">
            {arrows[trend.direction]}
          </span>
          <span className={styles.hidden}>{words[trend.direction]} </span>
          <span>{trend.delta}</span>
          {trend.baseline != null && <span>{trend.baseline}</span>}
        </dd>
      )}
    </dl>
  );
});
