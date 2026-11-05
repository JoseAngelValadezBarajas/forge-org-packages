import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type DialogHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from 'react';
import { focusableIn, lockScroll, useEscapeLayer, useOpenLifecycle } from '../layer';
import styles from './DialogV2.module.css';

export type DialogV2Size = 'sm' | 'md' | 'lg';

type DialogV2Base = Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  'open' | 'title' | 'children' | 'aria-labelledby' | 'aria-describedby' | 'aria-modal'
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  size?: DialogV2Size;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

export type DialogV2Props = DialogV2Base &
  ({ closeOnEscape?: true; footer?: ReactNode } | { closeOnEscape: false; footer: ReactNode });

export const DialogV2 = forwardRef<HTMLDialogElement, DialogV2Props>(function DialogV2(
  {
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    size = 'sm',
    closeOnEscape = true,
    initialFocusRef,
    className,
    onCancel,
    onClose,
    onKeyDown,
    ...props
  },
  ref,
) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  useImperativeHandle(ref, () => dialogRef.current as HTMLDialogElement);

  const escape = () => {
    if (closeOnEscape) onOpenChange(false);
  };
  useEscapeLayer(open, dialogRef, escape);

  useOpenLifecycle(open, () => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    if (dialog && !dialog.open) dialog.showModal?.();
    initialFocusRef?.current?.focus();
    const unlock = lockScroll();
    return () => {
      unlock();
      dialog?.close?.();
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true });
    };
  });

  useEffect(() => {
    const body = bodyRef.current;
    if (!open || !body || typeof ResizeObserver === 'undefined') return;
    const measure = () => setScrollable(body.scrollHeight > body.clientHeight);
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    for (const child of body.children) observer.observe(child);
    measure();
    return () => observer.disconnect();
  }, [open, children]);

  const trapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    onKeyDown?.(event);
    if (event.key !== 'Tab' || event.defaultPrevented) return;
    const dialog = event.currentTarget;
    const items = focusableIn(dialog);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      event.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const cancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    onCancel?.(event);
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    escape();
  };

  const close = (event: SyntheticEvent<HTMLDialogElement>) => {
    onClose?.(event);
    if (event.target === event.currentTarget && open) onOpenChange(false);
  };

  return (
    <dialog
      {...props}
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={description != null ? `${id}-description` : undefined}
      tabIndex={-1}
      data-size={size}
      onCancel={cancel}
      onClose={close}
      onKeyDown={trapFocus}
      className={[styles.dialog, styles[size], className].filter(Boolean).join(' ')}
    >
      <h2 id={`${id}-title`} className={styles.title}>
        {title}
      </h2>
      {description != null && (
        <div id={`${id}-description`} className={styles.description}>
          {description}
        </div>
      )}
      {children != null && (
        <div ref={bodyRef} className={styles.body} tabIndex={scrollable ? 0 : undefined}>
          {children}
        </div>
      )}
      {footer != null && <div className={styles.footer}>{footer}</div>}
    </dialog>
  );
});
