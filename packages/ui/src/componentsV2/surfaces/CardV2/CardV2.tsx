import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import {
  createElement,
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import styles from './CardV2.module.css';

export type CardV2Variant = 'default' | 'outlined' | 'elevated' | 'interactive';

type CardV2Slots = {
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

type CardV2Static = Omit<HTMLAttributes<HTMLElement>, 'children' | 'onClick'> &
  CardV2Slots & {
    variant?: Exclude<CardV2Variant, 'interactive'>;
    as?: 'div' | 'section' | 'article' | 'aside';
    onClick?: never;
    disabled?: never;
    href?: never;
  };

type CardV2Button = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  CardV2Slots & {
    variant: 'interactive';
    as?: 'button';
  };

type CardV2Link = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'> &
  CardV2Slots & {
    variant: 'interactive';
    as: 'a';
    href: string;
  };

export type CardV2Props = CardV2Static | CardV2Button | CardV2Link;

export const CardV2 = forwardRef<HTMLElement, CardV2Props>(function CardV2(
  { variant = 'default', as, header, footer, children, className, ...props },
  ref,
) {
  const interactive = variant === 'interactive';
  const tag: ElementType = as ?? (interactive ? 'button' : 'div');
  const Slot = interactive ? 'span' : 'div';

  return createElement(
    tag,
    {
      ...(tag === 'button' ? { type: 'button' } : undefined),
      ...props,
      ref,
      'data-variant': variant,
      className: [styles.card, styles[variant], className].filter(Boolean).join(' '),
    },
    header != null && <Slot className={styles.header}>{header}</Slot>,
    children != null && <Slot className={styles.body}>{children}</Slot>,
    footer != null && <Slot className={styles.footer}>{footer}</Slot>,
  );
});
