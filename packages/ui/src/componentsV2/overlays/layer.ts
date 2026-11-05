import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type Ref,
  type RefObject,
} from 'react';
import { computePosition, type OverlayAlign, type OverlayPlacement } from './position';

export type OverlayTriggerProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> };
export type OverlayTrigger = ReactElement<OverlayTriggerProps>;

type NodeRef = RefObject<HTMLElement | null>;
type Layer = { node: () => HTMLElement | null; escape: () => void };

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  'iframe',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

export function focusableIn(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    (element) => element.tabIndex >= 0 && element.checkVisibility?.() !== false,
  );
}

export function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

export function chain<E>(...handlers: (((event: E) => void) | undefined)[]) {
  return (event: E) => {
    for (const handler of handlers) handler?.(event);
  };
}

export function useLatest<T>(value: T) {
  const latest = useRef(value);
  useLayoutEffect(() => {
    latest.current = value;
  });
  return latest;
}

export function useOpenLifecycle(open: boolean, onOpen: () => () => void) {
  const opener = useLatest(onOpen);
  const teardown = useRef<(() => void) | null>(null);
  const finish = useCallback(() => {
    teardown.current?.();
    teardown.current = null;
  }, []);

  useLayoutEffect(() => {
    if (open) teardown.current = opener.current();
    else finish();
  }, [open, opener, finish]);

  useLayoutEffect(() => finish, [finish]);
}

const layers: Layer[] = [];

function topLayer() {
  return [...layers]
    .reverse()
    .find((layer) => !layers.some((other) => other !== layer && layer.node()?.contains(other.node())));
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return;
  const layer = topLayer();
  if (!layer) return;
  event.preventDefault();
  layer.escape();
}

export function useEscapeLayer(active: boolean, nodeRef: NodeRef, onEscape: () => void) {
  const latest = useLatest(onEscape);
  useLayoutEffect(() => {
    if (!active) return;
    const layer: Layer = { node: () => nodeRef.current, escape: () => latest.current() };
    if (layers.push(layer) === 1) document.addEventListener('keydown', onDocumentKeyDown);
    return () => {
      layers.splice(layers.indexOf(layer), 1);
      if (layers.length === 0) document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [active, nodeRef, latest]);
}

export function useDismiss(active: boolean, panelRef: NodeRef, anchorRef: NodeRef, onDismiss: () => void) {
  const latest = useLatest(onDismiss);
  useLayoutEffect(() => {
    if (!active) return;
    const dismiss = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      latest.current();
    };
    document.addEventListener('pointerdown', dismiss, true);
    document.addEventListener('focusin', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss, true);
      document.removeEventListener('focusin', dismiss);
    };
  }, [active, panelRef, anchorRef, latest]);
}

export function useOpenState(
  open: boolean | undefined,
  defaultOpen: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
) {
  const [internal, setInternal] = useState(defaultOpen ?? false);
  const latest = useLatest(onOpenChange);
  const controlled = open !== undefined;
  const current = controlled ? open : internal;
  const change = useCallback(
    (next: boolean) => {
      if (!controlled) setInternal(next);
      latest.current?.(next);
    },
    [controlled, latest],
  );
  return [current, change] as const;
}

type AnchoredPanel = {
  open: boolean;
  anchorRef: NodeRef;
  panelRef: NodeRef;
  placement: OverlayPlacement;
  align: OverlayAlign;
  restoreFocus?: boolean;
  onShown?: () => void;
};

export function useAnchoredPanel({
  open,
  anchorRef,
  panelRef,
  placement,
  align,
  restoreFocus = false,
  onShown,
}: AnchoredPanel) {
  const shown = useLatest(onShown);

  useOpenLifecycle(open, () => {
    const panel = panelRef.current;
    const previous = document.activeElement;
    panel?.showPopover?.();
    return () => {
      const active = document.activeElement;
      const lost = !active || active === document.body || panel?.contains(active);
      panel?.hidePopover?.();
      if (!restoreFocus || !lost) return;
      const target = previous instanceof HTMLElement && previous !== document.body ? previous : anchorRef.current;
      target?.focus({ preventScroll: true });
    };
  });

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!open || !panel || !anchor) return;
    const update = () => {
      const styles = getComputedStyle(panel);
      const { width, height } = panel.getBoundingClientRect();
      const { left, top, placement: side, arrow } = computePosition({
        anchor: anchor.getBoundingClientRect(),
        panel: { width, height },
        viewport: { width: document.documentElement.clientWidth, height: window.innerHeight },
        placement,
        align,
        offset: parseFloat(styles.getPropertyValue('--overlay-offset')) || 0,
        margin: parseFloat(styles.getPropertyValue('--cf-v2-overlay-viewport-margin')) || 0,
        rtl: styles.direction === 'rtl',
      });
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.setProperty('--overlay-arrow', `${arrow}px`);
      panel.dataset.placement = side;
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
    observer?.observe(panel);
    observer?.observe(anchor);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      observer?.disconnect();
    };
  }, [open, panelRef, anchorRef, placement, align]);

  useLayoutEffect(() => {
    if (open) shown.current?.();
  }, [open, shown]);
}

let locks = 0;
let unlock = () => {};

export function lockScroll() {
  if (locks === 0) {
    const root = document.documentElement;
    const { body } = document;
    const gutter = window.innerWidth - root.clientWidth;
    const overflow = root.style.overflow;
    const padding = body.style.paddingInlineEnd;
    const current = parseFloat(getComputedStyle(body).paddingInlineEnd) || 0;
    root.style.overflow = 'hidden';
    if (gutter > 0) body.style.paddingInlineEnd = `${current + gutter}px`;
    unlock = () => {
      root.style.overflow = overflow;
      body.style.paddingInlineEnd = padding;
    };
  }
  locks += 1;
  return () => {
    locks -= 1;
    if (locks === 0) unlock();
  };
}
