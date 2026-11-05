import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';

/** Structural adapter for themes produced by forge-tokens/theme-v2. */
export interface ThemeScopeTheme {
  readonly roles: Readonly<Record<string, string>>;
  readonly mode?: 'light' | 'dark' | 'high-contrast';
}

export interface ThemeScopeProps extends HTMLAttributes<HTMLDivElement> {
  theme: ThemeScopeTheme;
}

type ThemeStyle = CSSProperties & Record<`--cf-v2-${string}`, string>;

export const ThemeScope = forwardRef<HTMLDivElement, ThemeScopeProps>(function ThemeScope(
  { theme, style, children, ...props },
  ref,
) {
  const scopedStyle: ThemeStyle = { ...style };
  for (const [role, value] of Object.entries(theme.roles)) {
    // This adapter serializes semantic roles; palette generation stays in forge-tokens.
    const property = `--cf-v2-${role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}` as const;
    scopedStyle[property] = value;
  }
  if (theme.mode) scopedStyle.colorScheme = theme.mode === 'light' ? 'light' : 'dark';

  return (
    <div {...props} ref={ref} style={scopedStyle} data-cf-theme-mode={theme.mode}>
      {children}
    </div>
  );
});
