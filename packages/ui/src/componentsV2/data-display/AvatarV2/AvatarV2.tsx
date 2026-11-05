import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { User } from '@corefoundry-labs/forge-icons';
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import styles from './AvatarV2.module.css';

export type AvatarV2Size = 'sm' | 'md' | 'lg';
export type AvatarV2Shape = 'circle' | 'rounded';
export type AvatarV2StatusTone = 'neutral' | 'success' | 'warning' | 'error';

type AvatarV2Base = Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'role' | 'aria-label' | 'aria-hidden'> & {
  alt: string;
  src?: string;
  initials?: string;
  size?: AvatarV2Size;
  shape?: AvatarV2Shape;
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading'];
};

export type AvatarV2Props = AvatarV2Base &
  ({ statusTone?: undefined; statusLabel?: undefined } | { statusTone: AvatarV2StatusTone; statusLabel: string });

export type AvatarGroupV2Props = Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'aria-label' | 'aria-labelledby'> & {
  children: ReactNode;
  size?: AvatarV2Size;
  max?: number;
  moreLabel?: (count: number) => string;
} & ({ 'aria-label': string; 'aria-labelledby'?: undefined } | { 'aria-label'?: undefined; 'aria-labelledby': string });

export const AvatarV2 = forwardRef<HTMLSpanElement, AvatarV2Props>(function AvatarV2(
  { alt, src, initials, size = 'sm', shape = 'circle', loading, statusTone, statusLabel, className, ...props },
  ref,
) {
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const usable = src ? src !== failed : false;
  const visible = usable && src === loaded;
  const name = [alt, statusLabel].filter(Boolean).join(', ');
  const content = visible ? 'image' : initials ? 'initials' : 'fallback';

  return (
    <span
      {...props}
      ref={ref}
      role={name ? 'img' : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : true}
      data-size={size}
      data-shape={shape}
      data-content={content}
      className={[styles.avatar, styles[size], styles[shape], className].filter(Boolean).join(' ')}
    >
      <span className={styles.surface}>
        {content === 'initials' && <span className={styles.initials}>{initials}</span>}
        {content === 'fallback' && <User className={styles.glyph} aria-hidden="true" />}
        {usable && (
          <img
            ref={(node) => {
              if (node?.complete && node.naturalWidth > 0) setLoaded(src as string);
            }}
            className={[styles.image, visible && styles.visible].filter(Boolean).join(' ')}
            src={src}
            alt=""
            loading={loading}
            onLoad={() => setLoaded(src as string)}
            onError={() => setFailed(src as string)}
          />
        )}
      </span>
      {statusTone && <span className={[styles.status, styles[statusTone]].join(' ')} data-status={statusTone} />}
    </span>
  );
});

export const AvatarGroupV2 = forwardRef<HTMLDivElement, AvatarGroupV2Props>(function AvatarGroupV2(
  { children, size = 'sm', max, moreLabel = (count) => `${count} more`, className, ...props },
  ref,
) {
  const items = Children.toArray(children).filter((child): child is ReactElement<AvatarV2Props> => isValidElement(child));
  const shown = max !== undefined && max >= 0 ? items.slice(0, max) : items;
  const hidden = items.length - shown.length;

  return (
    <div
      {...props}
      ref={ref}
      role="group"
      data-size={size}
      className={[styles.group, styles[`group-${size}`], className].filter(Boolean).join(' ')}
    >
      {shown.map((item) => cloneElement(item, { size }))}
      {hidden > 0 && (
        <span role="img" aria-label={moreLabel(hidden)} className={[styles.avatar, styles[size], styles.count].join(' ')}>
          +{hidden}
        </span>
      )}
    </div>
  );
});
