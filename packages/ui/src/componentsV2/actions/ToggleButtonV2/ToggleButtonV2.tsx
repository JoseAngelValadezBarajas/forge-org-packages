import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { forwardRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import styles from './ToggleButtonV2.module.css';

export type ToggleButtonV2Size = 'sm' | 'md' | 'lg';

type ToggleButtonV2Base = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-pressed'> & {
  size?: ToggleButtonV2Size;
  /** Controlled state. Pair it with `onPressedChange`. */
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  iconStart?: ReactNode;
};

export type ToggleButtonV2Props = ToggleButtonV2Base &
  ({ children: ReactNode } | { children?: undefined; 'aria-label': string });

/** A button that holds an on/off state and exposes it as `aria-pressed`. */
export const ToggleButtonV2 = forwardRef<HTMLButtonElement, ToggleButtonV2Props>(function ToggleButtonV2(
  {
    size = 'md',
    pressed,
    defaultPressed = false,
    onPressedChange,
    iconStart,
    className,
    children,
    onClick,
    type = 'button',
    ...props
  },
  ref,
) {
  const [inner, setInner] = useState(defaultPressed);
  const controlled = pressed !== undefined;
  const isPressed = controlled ? pressed : inner;
  const iconOnly = children == null;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const next = !isPressed;
    if (!controlled) setInner(next);
    onPressedChange?.(next);
  };

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      aria-pressed={isPressed}
      data-size={size}
      onClick={handleClick}
      className={[styles.toggle, styles[size], iconOnly && styles.iconOnly, className].filter(Boolean).join(' ')}
    >
      {iconStart != null && (
        <span className={styles.icon} aria-hidden="true">
          {iconStart}
        </span>
      )}
      {!iconOnly && <span className={styles.label}>{children}</span>}
    </button>
  );
});
