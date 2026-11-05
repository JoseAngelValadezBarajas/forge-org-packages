import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import {
  cloneElement,
  forwardRef,
  useId,
  useImperativeHandle,
  useRef,
  type AriaRole,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  chain,
  focusableIn,
  useAnchoredPanel,
  useDismiss,
  useEscapeLayer,
  useOpenState,
  useTriggerRef,
  type OverlayTrigger,
} from '../layer';
import type { OverlayAlign, OverlayPlacement } from '../position';
import styles from './PopoverV2.module.css';

export type PopoverV2Width = 'compact' | 'regular';
export type PopoverV2Placement = OverlayPlacement;
export type PopoverV2Align = OverlayAlign;

type PopoverV2Base = Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'role' | 'popover' | 'aria-label' | 'aria-labelledby'
> & {
  description?: ReactNode;
  children?: ReactNode;
  width?: PopoverV2Width;
  placement?: PopoverV2Placement;
  align?: PopoverV2Align;
  role?: AriaRole;
  initialFocus?: 'content' | 'none';
};

type PopoverV2Name =
  | { title: ReactNode; 'aria-label'?: undefined; 'aria-labelledby'?: undefined }
  | { title?: undefined; 'aria-label': string; 'aria-labelledby'?: undefined }
  | { title?: undefined; 'aria-label'?: undefined; 'aria-labelledby': string };

type PopoverV2Anchor =
  | {
      trigger: OverlayTrigger;
      anchorRef?: undefined;
      open?: boolean;
      defaultOpen?: boolean;
      onOpenChange?: (open: boolean) => void;
    }
  | {
      trigger?: undefined;
      anchorRef: RefObject<HTMLElement | null>;
      open: boolean;
      defaultOpen?: undefined;
      onOpenChange: (open: boolean) => void;
    };

export type PopoverV2Props = PopoverV2Base & PopoverV2Name & PopoverV2Anchor;

export const PopoverV2 = forwardRef<HTMLDivElement, PopoverV2Props>(function PopoverV2(
  {
    trigger,
    anchorRef: externalAnchor,
    open: openProp,
    defaultOpen,
    onOpenChange,
    title,
    description,
    children,
    width = 'compact',
    placement = 'bottom',
    align = 'start',
    role = 'dialog',
    initialFocus = 'content',
    id,
    className,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...props
  },
  ref,
) {
  const generated = useId();
  const panelId = id ?? generated;
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const anchorRef = externalAnchor ?? triggerRef;
  const attachTrigger = useTriggerRef(triggerRef, trigger?.props.ref);
  useImperativeHandle(ref, () => panelRef.current as HTMLDivElement);

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
      const panel = panelRef.current;
      if (initialFocus === 'none' || !panel) return;
      (focusableIn(panel)[0] ?? panel).focus({ preventScroll: true });
    },
  });

  const titleId = `${panelId}-title`;

  return (
    <>
      {trigger &&
        cloneElement(trigger, {
          ref: attachTrigger,
          'aria-haspopup': role === 'dialog' ? 'dialog' : undefined,
          'aria-expanded': open,
          'aria-controls': role === 'dialog' ? undefined : panelId,
          onClick: chain(trigger.props.onClick, (_event: MouseEvent<HTMLElement>) => setOpen(!open)),
        })}
      <div
        {...props}
        ref={panelRef}
        id={panelId}
        role={role}
        popover="manual"
        tabIndex={-1}
        aria-label={label}
        aria-labelledby={labelledBy ?? (title != null ? titleId : undefined)}
        data-state={open ? 'open' : 'closed'}
        data-width={width}
        className={[styles.popover, styles[width], className].filter(Boolean).join(' ')}
      >
        {title != null && (
          <>
            <div id={titleId} className={styles.title}>
              {title}
            </div>
            <div className={styles.separator} aria-hidden="true" />
          </>
        )}
        {description != null && <div className={styles.description}>{description}</div>}
        {children}
      </div>
    </>
  );
});
