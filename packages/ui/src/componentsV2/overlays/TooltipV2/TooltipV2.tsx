import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import {
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type PointerEvent,
} from 'react';
import { chain, useAnchoredPanel, useEscapeLayer, useLatest, useTriggerRef, type OverlayTrigger } from '../layer';
import type { OverlayPlacement } from '../position';
import styles from './TooltipV2.module.css';

export type TooltipV2Placement = OverlayPlacement;

export type TooltipV2Props = Omit<HTMLAttributes<HTMLDivElement>, 'content' | 'children' | 'role' | 'popover'> & {
  content: string;
  children: OverlayTrigger;
  placement?: TooltipV2Placement;
  delay?: number;
};

const hoverGrace = 120;
let visible: { current: () => void } | null = null;

export const TooltipV2 = forwardRef<HTMLDivElement, TooltipV2Props>(function TooltipV2(
  { content, children, placement = 'top', delay = 300, id, className, onPointerEnter, onPointerLeave, ...props },
  ref,
) {
  const generated = useId();
  const tooltipId = id ?? generated;
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const sources = useRef({ hover: false, focus: false });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useImperativeHandle(ref, () => panelRef.current as HTMLDivElement);

  const dismiss = () => {
    sources.current = { hover: false, focus: false };
    clearTimeout(timer.current);
    if (visible === self) visible = null;
    setOpen(false);
  };
  const self = useLatest(dismiss);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (visible === self) visible = null;
    },
    [self],
  );

  const track = (source: 'hover' | 'focus', active: boolean) => {
    sources.current[source] = active;
    const wanted = sources.current.hover || sources.current.focus;
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => {
        if (wanted && visible !== self) {
          visible?.current();
          visible = self;
        } else if (!wanted && visible === self) {
          visible = null;
        }
        setOpen(wanted);
      },
      wanted ? delay : hoverGrace,
    );
  };

  const enter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch') track('hover', true);
  };
  const leave = () => track('hover', false);

  useEscapeLayer(open, panelRef, dismiss);
  useAnchoredPanel({ open, anchorRef, panelRef, placement, align: 'center' });

  const trigger = children.props;
  const attachTrigger = useTriggerRef(anchorRef, trigger.ref);

  return (
    <>
      {cloneElement(children, {
        ref: attachTrigger,
        'aria-describedby': [trigger['aria-describedby'], tooltipId].filter(Boolean).join(' '),
        onPointerEnter: chain(trigger.onPointerEnter, enter),
        onPointerLeave: chain(trigger.onPointerLeave, leave),
        onPointerDown: chain(trigger.onPointerDown, dismiss),
        onFocus: chain(trigger.onFocus, (event: FocusEvent<HTMLElement>) => {
          if (event.currentTarget.matches(':focus-visible')) track('focus', true);
        }),
        onBlur: chain(trigger.onBlur, () => track('focus', false)),
      })}
      <div
        {...props}
        ref={panelRef}
        id={tooltipId}
        role="tooltip"
        popover="manual"
        data-state={open ? 'open' : 'closed'}
        onPointerEnter={chain(onPointerEnter, enter)}
        onPointerLeave={chain(onPointerLeave, leave)}
        className={[styles.tooltip, className].filter(Boolean).join(' ')}
      >
        {content}
        <svg className={styles.arrow} viewBox="0 0 12 9" aria-hidden="true">
          <path d="M0 9 6 0l6 9" />
        </svg>
      </div>
    </>
  );
});
