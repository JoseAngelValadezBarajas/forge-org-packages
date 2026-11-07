import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type FocusEvent,
} from 'react';
import styles from './ToolbarV2.module.css';

export type ToolbarV2Orientation = 'horizontal' | 'vertical';

type ToolbarV2Base = Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'aria-orientation' | 'aria-label' | 'aria-labelledby'> & {
  orientation?: ToolbarV2Orientation;
};

export type ToolbarV2Props = ToolbarV2Base &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

const OrientationContext = createContext<ToolbarV2Orientation>('horizontal');

const ITEMS = 'button:not(:disabled), [role="button"]:not([aria-disabled="true"])';
const KEYS: Record<ToolbarV2Orientation, { next: string; previous: string }> = {
  horizontal: { next: 'ArrowRight', previous: 'ArrowLeft' },
  vertical: { next: 'ArrowDown', previous: 'ArrowUp' },
};

/**
 * A group of related controls that is one tab stop. Arrow keys move between the controls, Home and End jump
 * to the first and last. The controls themselves stay the consumer's: buttons, toggle buttons or menus.
 */
export const ToolbarV2 = forwardRef<HTMLDivElement, ToolbarV2Props>(function ToolbarV2(
  { orientation = 'horizontal', className, children, onKeyDown, onFocus, ...props },
  forwardedRef,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const active = useRef<HTMLElement | null>(null);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  const items = () => (root.current ? Array.from(root.current.querySelectorAll<HTMLElement>(ITEMS)) : []);

  // Exactly one control is reachable with Tab; the others are reached with the arrow keys.
  useLayoutEffect(() => {
    const all = items();
    const current = active.current && all.includes(active.current) ? active.current : all[0];
    for (const item of all) item.tabIndex = item === current ? 0 : -1;
    active.current = current ?? null;
  });

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    onFocus?.(event);
    const target = event.target as HTMLElement;
    if (!items().includes(target)) return;
    active.current = target;
    for (const item of items()) item.tabIndex = item === target ? 0 : -1;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const all = items();
    const index = all.indexOf(event.target as HTMLElement);
    if (index < 0 || all.length === 0) return;
    const keys = KEYS[orientation];
    let next: number | undefined;
    if (event.key === keys.next) next = (index + 1) % all.length;
    else if (event.key === keys.previous) next = (index - 1 + all.length) % all.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = all.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    all[next].focus();
  };

  return (
    <OrientationContext.Provider value={orientation}>
      <div
        {...props}
        ref={setRef}
        role="toolbar"
        aria-orientation={orientation}
        data-orientation={orientation}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className={[styles.toolbar, styles[orientation], className].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </OrientationContext.Provider>
  );
});

export type ToolbarSeparatorV2Props = Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'children'>;

/** A divider between groups of controls. It is perpendicular to the toolbar's direction. */
export const ToolbarSeparatorV2 = forwardRef<HTMLDivElement, ToolbarSeparatorV2Props>(function ToolbarSeparatorV2(
  { className, ...props },
  ref,
) {
  const orientation = useContext(OrientationContext);
  return (
    <div
      {...props}
      ref={ref}
      role="separator"
      aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
      className={[styles.separator, className].filter(Boolean).join(' ')}
    />
  );
});
