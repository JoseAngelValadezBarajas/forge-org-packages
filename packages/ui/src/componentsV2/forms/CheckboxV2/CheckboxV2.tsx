import '@corefoundry-labs/forge-tokens/theme-v2/tokens.css';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react';
import type { SelectionControlName } from '../selectionControl';
import styles from './CheckboxV2.module.css';

type CheckboxV2Base = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'children'> & {
  indeterminate?: boolean;
};

export type CheckboxV2Props = CheckboxV2Base & SelectionControlName;

export const CheckboxV2 = forwardRef<HTMLInputElement, CheckboxV2Props>(function CheckboxV2(
  { indeterminate = false, className, style, children, onChange, ...props },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.currentTarget.indeterminate = indeterminate;
    onChange?.(event);
  };

  const Root = children == null ? 'span' : 'label';

  return (
    <Root
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={style}
      data-disabled={props.disabled || undefined}
    >
      <span className={styles.target}>
        <input {...props} ref={inputRef} type="checkbox" onChange={handleChange} className={styles.input} />
        <span className={styles.box} aria-hidden="true">
          <svg className={styles.check} viewBox="0 0 20 20" fill="none">
            <path
              d="M4 10L8.2 14.2L16 6"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg className={styles.mixed} viewBox="0 0 20 20" fill="none">
            <path d="M4 10H16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      {children != null && <span className={styles.label}>{children}</span>}
    </Root>
  );
});
