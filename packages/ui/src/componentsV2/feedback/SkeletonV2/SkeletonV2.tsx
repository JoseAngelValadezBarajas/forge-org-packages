import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import styles from './SkeletonV2.module.css';

export type SkeletonV2Shape = 'text' | 'rectangle' | 'circle';
export type SkeletonV2Size = 'sm' | 'md';
export type SkeletonV2Animation = 'none' | 'pulse' | 'wave';

export type SkeletonV2Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'role'> & {
  shape?: SkeletonV2Shape;
  size?: SkeletonV2Size;
  animation?: SkeletonV2Animation;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
};

export const SkeletonV2 = forwardRef<HTMLSpanElement, SkeletonV2Props>(function SkeletonV2(
  { shape = 'text', size = 'sm', animation = 'none', width, height, className, style, ...props },
  ref,
) {
  const sized = { ...(width !== undefined && { width }), ...(height !== undefined && { height }), ...style };

  return (
    <span
      {...props}
      ref={ref}
      aria-hidden="true"
      data-shape={shape}
      data-size={size}
      data-animation={animation}
      style={sized}
      className={[styles.skeleton, styles[shape], styles[size], styles[animation], className].filter(Boolean).join(' ')}
    />
  );
});
