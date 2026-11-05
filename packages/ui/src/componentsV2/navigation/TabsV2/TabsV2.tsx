import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import {
  forwardRef,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import styles from './TabsV2.module.css';

export type TabsV2Variant = 'underline' | 'pill';
export type TabsV2Size = 'sm' | 'md';
export type TabsV2Activation = 'automatic' | 'manual';

export type TabsV2Item = {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};

type TabsV2Base = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'defaultValue' | 'onChange' | 'aria-label' | 'aria-labelledby'
> & {
  items: readonly TabsV2Item[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  variant?: TabsV2Variant;
  size?: TabsV2Size;
  activation?: TabsV2Activation;
};

export type TabsV2Props = TabsV2Base &
  ({ 'aria-label': string; 'aria-labelledby'?: undefined } | { 'aria-label'?: undefined; 'aria-labelledby': string });

export const TabsV2 = forwardRef<HTMLDivElement, TabsV2Props>(function TabsV2(
  {
    items,
    value,
    defaultValue,
    onValueChange,
    variant = 'underline',
    size = 'md',
    activation = 'automatic',
    className,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...props
  },
  ref,
) {
  const base = useId();
  const [internal, setInternal] = useState(defaultValue);
  const [focused, setFocused] = useState<string | null>(null);
  const tabs = useRef(new Map<string, HTMLButtonElement>());

  const enabled = items.filter((item) => !item.disabled);
  const requested = value ?? internal;
  const selected = enabled.find((item) => item.id === requested) ?? enabled[0];
  const tabStop = focused ?? selected?.id;

  const select = (id: string) => {
    if (id === selected?.id && (requested === undefined || requested === id)) return;
    if (value === undefined) setInternal(id);
    onValueChange?.(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const index = enabled.findIndex((item) => item.id === id);
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const targets: Record<string, TabsV2Item | undefined> = {
      [rtl ? 'ArrowLeft' : 'ArrowRight']: enabled[(index + 1) % enabled.length],
      [rtl ? 'ArrowRight' : 'ArrowLeft']: enabled[(index - 1 + enabled.length) % enabled.length],
      Home: enabled[0],
      End: enabled[enabled.length - 1],
    };
    const target = targets[event.key];
    if (!target) return;
    event.preventDefault();
    setFocused(target.id);
    tabs.current.get(target.id)?.focus();
    if (activation === 'automatic') select(target.id);
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
  };

  if (items.length === 0) return null;

  return (
    <div
      {...props}
      ref={ref}
      data-variant={variant}
      data-size={size}
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      <div role="tablist" aria-label={label} aria-labelledby={labelledBy} className={styles.list} onBlur={onBlur}>
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              if (node) tabs.current.set(item.id, node);
              else tabs.current.delete(item.id);
            }}
            id={`${base}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={item.id === selected?.id}
            aria-controls={`${base}-panel-${index}`}
            tabIndex={item.id === tabStop ? 0 : -1}
            disabled={item.disabled}
            onClick={() => {
              setFocused(item.id);
              select(item.id);
            }}
            onKeyDown={(event) => onKeyDown(event, item.id)}
            className={[styles.tab, styles[variant], styles[size]].join(' ')}
          >
            <span>{item.label}</span>
            {variant === 'underline' && <span className={styles.indicator} aria-hidden="true" />}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div
          key={item.id}
          id={`${base}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${index}`}
          tabIndex={0}
          hidden={item.id !== selected?.id}
          className={styles.panel}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
});
