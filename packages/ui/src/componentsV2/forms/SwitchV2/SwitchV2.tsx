import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import { forwardRef, type InputHTMLAttributes } from 'react';
import type { SelectionControlName } from '../selectionControl';
import styles from './SwitchV2.module.css';

type SwitchV2Base = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role' | 'size' | 'children'>;

export type SwitchV2Props = SwitchV2Base & SelectionControlName;

export const SwitchV2 = forwardRef<HTMLInputElement, SwitchV2Props>(function SwitchV2(
  { className, style, children, ...props },
  ref,
) {
  const Root = children == null ? 'span' : 'label';

  return (
    <Root
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={style}
      data-disabled={props.disabled || undefined}
    >
      <span className={styles.target}>
        <input {...props} ref={ref} type="checkbox" role="switch" className={styles.input} />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </span>
      {children != null && <span className={styles.label}>{children}</span>}
    </Root>
  );
});
