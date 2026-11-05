import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import {
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import {
  chain,
  useAnchoredPanel,
  useDismiss,
  useEscapeLayer,
  useOpenState,
  useTriggerRef,
  type OverlayTrigger,
} from '../layer';
import type { OverlayAlign, OverlayPlacement } from '../position';
import styles from './DropdownMenuV2.module.css';

export type DropdownMenuV2Density = 'compact' | 'comfortable';

export type DropdownMenuV2Action = {
  type?: 'item';
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
};

export type DropdownMenuV2Separator = { type: 'separator'; id: string };
export type DropdownMenuV2Item = DropdownMenuV2Action | DropdownMenuV2Separator;

export type DropdownMenuV2Props = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role' | 'popover'> & {
  trigger: OverlayTrigger;
  items: readonly DropdownMenuV2Item[];
  density?: DropdownMenuV2Density;
  placement?: OverlayPlacement;
  align?: OverlayAlign;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type Entry = 'first' | 'last' | 'menu';

const typeaheadReset = 500;

export const DropdownMenuV2 = forwardRef<HTMLDivElement, DropdownMenuV2Props>(function DropdownMenuV2(
  {
    trigger,
    items,
    density = 'compact',
    placement = 'bottom',
    align = 'start',
    open: openProp,
    defaultOpen,
    onOpenChange,
    id,
    className,
    onKeyDown,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...props
  },
  ref,
) {
  const generated = useId();
  const menuId = id ?? generated;
  const triggerId = trigger.props.id ?? `${menuId}-trigger`;
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange);
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const attachTrigger = useTriggerRef(anchorRef, trigger.props.ref);
  const entry = useRef<Entry>('menu');
  const query = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useImperativeHandle(ref, () => panelRef.current as HTMLDivElement);

  useEffect(() => () => clearTimeout(timer.current), []);

  const actions = () => [
    ...(panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []),
  ];
  const focus = (element?: HTMLElement | null) => element?.focus({ preventScroll: true });
  const close = () => setOpen(false);

  useEscapeLayer(open, panelRef, close);
  useDismiss(open, panelRef, anchorRef, close);
  useAnchoredPanel({
    open,
    anchorRef,
    panelRef,
    placement,
    align,
    restoreFocus: true,
    onShown: () => {
      const enabled = actions();
      const target = { first: enabled[0], last: enabled[enabled.length - 1], menu: undefined }[entry.current];
      focus(target ?? panelRef.current);
    },
  });

  const openAt = (position: Entry) => {
    entry.current = position;
    setOpen(true);
  };

  const onTriggerClick = (event: MouseEvent<HTMLElement>) => {
    if (open) close();
    else openAt(event.detail === 0 ? 'first' : 'menu');
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openAt(event.key === 'ArrowDown' ? 'first' : 'last');
  };

  const typeahead = (key: string, enabled: HTMLButtonElement[], index: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      query.current = '';
    }, typeaheadReset);
    query.current += key.toLowerCase();
    const search = new Set(query.current).size === 1 ? query.current.charAt(0) : query.current;
    const start = search.length === 1 ? index + 1 : Math.max(index, 0);
    const ordered = [...enabled.slice(start), ...enabled.slice(0, start)];
    focus(ordered.find((item) => item.textContent?.trim().toLowerCase().startsWith(search)));
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    event.currentTarget.dataset.input = 'keyboard';
    const enabled = actions();
    const index = enabled.indexOf(document.activeElement as HTMLButtonElement);
    const moves: Record<string, HTMLButtonElement | undefined> = {
      ArrowDown: enabled[(index + 1) % enabled.length],
      ArrowUp: enabled[index <= 0 ? enabled.length - 1 : index - 1],
      Home: enabled[0],
      End: enabled[enabled.length - 1],
    };
    if (event.key in moves) {
      event.preventDefault();
      focus(moves[event.key]);
    } else if (event.key === 'Tab') {
      focus(anchorRef.current);
      close();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (event.key === ' ' && !query.current) return;
      event.preventDefault();
      typeahead(event.key, enabled, index);
    }
  };

  const select = (item: DropdownMenuV2Action) => {
    focus(anchorRef.current);
    close();
    item.onSelect?.();
  };

  const hover = (event: PointerEvent<HTMLButtonElement>) => {
    if (panelRef.current) panelRef.current.dataset.input = 'pointer';
    if (document.activeElement !== event.currentTarget) focus(event.currentTarget);
  };

  const withIcons = items.some((item) => item.type !== 'separator' && item.icon != null);

  return (
    <>
      {cloneElement(trigger, {
        ref: attachTrigger,
        id: triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        onClick: chain(trigger.props.onClick, onTriggerClick),
        onKeyDown: chain(trigger.props.onKeyDown, onTriggerKeyDown),
      })}
      <div
        {...props}
        ref={panelRef}
        id={menuId}
        role="menu"
        popover="manual"
        tabIndex={-1}
        aria-label={label}
        aria-labelledby={labelledBy ?? (label ? undefined : triggerId)}
        data-state={open ? 'open' : 'closed'}
        data-density={density}
        onKeyDown={onMenuKeyDown}
        className={[styles.menu, styles[density], className].filter(Boolean).join(' ')}
      >
        {items.map((item) =>
          item.type === 'separator' ? (
            <div key={item.id} role="separator" className={styles.separator} />
          ) : (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              data-destructive={item.destructive || undefined}
              onClick={() => select(item)}
              onPointerMove={hover}
              onPointerLeave={() => focus(panelRef.current)}
              className={[styles.item, item.destructive && styles.destructive].filter(Boolean).join(' ')}
            >
              {withIcons && (
                <span className={styles.icon} aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className={styles.label}>{item.label}</span>
            </button>
          ),
        )}
      </div>
    </>
  );
});
