import { TonalPalette, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

export type ThemeMode = 'light' | 'dark' | 'high-contrast';
export type BrandColors = { primary: string; secondary: string; neutral: string; neutralVariant?: string; tertiary?: string; error?: string; warning?: string; success?: string; info?: string };
export type ThemeConfig = { name: string; colors: BrandColors; mode: ThemeMode };
export type Tone = 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 55 | 60 | 65 | 70 | 75 | 80 | 85 | 90 | 95 | 98 | 99 | 100;
export type TonalScale = Record<Tone, string>;
export type SemanticRole = 'background' | 'surface' | 'surfaceRaised' | 'surfaceContainer' | 'surfaceVariant' | 'onSurface' | 'onSurfaceVariant' | 'primary' | 'onPrimary' | 'primaryContainer' | 'onPrimaryContainer' | 'secondary' | 'onSecondary' | 'outline' | 'outlineVariant' | 'focusRing' | 'selection' | 'disabled' | 'error' | 'warning' | 'success' | 'info' | 'actionPrimary' | 'onActionPrimary';
export type Theme = { name: string; mode: ThemeMode; colors: Required<BrandColors>; palettes: Record<keyof Required<BrandColors>, TonalScale>; roles: Record<SemanticRole, string> };
export type ContrastCheck = { foreground: SemanticRole; background: SemanticRole; ratio: number; minimum: number; passed: boolean };
export type ThemeValidation = { valid: boolean; errors: string[]; contrasts: ContrastCheck[] };

const tones = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 98, 99, 100] as const;
const roles: SemanticRole[] = ['background', 'surface', 'surfaceRaised', 'surfaceContainer', 'surfaceVariant', 'onSurface', 'onSurfaceVariant', 'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer', 'secondary', 'onSecondary', 'outline', 'outlineVariant', 'focusRing', 'selection', 'disabled', 'error', 'warning', 'success', 'info', 'actionPrimary', 'onActionPrimary'];
const pairs: [SemanticRole, SemanticRole, number][] = [['onSurface', 'surface', 4.5], ['onSurfaceVariant', 'surfaceVariant', 4.5], ['onPrimary', 'primary', 4.5], ['onPrimaryContainer', 'primaryContainer', 4.5], ['onSecondary', 'secondary', 4.5], ['onActionPrimary', 'actionPrimary', 4.5], ['focusRing', 'surface', 3], ['outline', 'surface', 3], ['primary', 'surface', 3], ['secondary', 'surface', 3], ['error', 'surface', 3], ['warning', 'surface', 3], ['success', 'surface', 3], ['info', 'surface', 3]];

function color(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value)) throw new TypeError(`${label} must be a #RRGGBB color`);
  return value.toLowerCase();
}

export function generatePalette(seed: string): TonalScale {
  const palette = TonalPalette.fromInt(argbFromHex(color(seed, 'seed')));
  return Object.fromEntries(tones.map((tone) => [tone, hexFromArgb(palette.tone(tone))])) as TonalScale;
}

export function contrastRatio(a: string, b: string): number {
  const luminance = (value: string) => {
    const hex = color(value, 'contrast color');
    const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const [x, y] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (x + 0.05) / (y + 0.05);
}

function foreground(background: string): string {
  return contrastRatio('#000000', background) >= contrastRatio('#ffffff', background) ? '#000000' : '#ffffff';
}

export function createTheme(config: ThemeConfig): Theme {
  if (!config || typeof config.name !== 'string' || !config.name.trim() || config.name.length > 80) throw new TypeError('Theme name must be a non-empty string of at most 80 characters');
  if (!['light', 'dark', 'high-contrast'].includes(config.mode)) throw new TypeError('Theme mode must be light, dark, or high-contrast');
  if (!config.colors || typeof config.colors !== 'object') throw new TypeError('Theme colors are required');
  const c: Required<BrandColors> = { primary: color(config.colors.primary, 'primary'), secondary: color(config.colors.secondary, 'secondary'), neutral: color(config.colors.neutral, 'neutral'), neutralVariant: color(config.colors.neutralVariant ?? config.colors.neutral, 'neutralVariant'), tertiary: color(config.colors.tertiary ?? config.colors.secondary, 'tertiary'), error: color(config.colors.error ?? '#b3261e', 'error'), warning: color(config.colors.warning ?? '#946000', 'warning'), success: color(config.colors.success ?? '#207a45', 'success'), info: color(config.colors.info ?? '#245da8', 'info') };
  const palettes = Object.fromEntries(Object.entries(c).map(([key, value]) => [key, generatePalette(value)])) as Theme['palettes'];
  const dark = config.mode !== 'light';
  const high = config.mode === 'high-contrast';
  const surface = palettes.neutral[dark ? (high ? 0 : 10) : 98];
  const surfaceVariant = palettes.neutralVariant[dark ? 30 : 90];
  const primary = palettes.primary[dark ? (high ? 90 : 80) : 40];
  const primaryContainer = palettes.primary[dark ? 30 : 90];
  const secondary = palettes.secondary[dark ? 80 : 40];
  const roleValues: Theme['roles'] = {
    background: surface, surface, surfaceRaised: palettes.neutral[dark ? 15 : 100], surfaceContainer: palettes.neutral[dark ? 20 : 95], surfaceVariant,
    onSurface: foreground(surface), onSurfaceVariant: foreground(surfaceVariant), primary, onPrimary: foreground(primary), primaryContainer, onPrimaryContainer: foreground(primaryContainer), secondary, onSecondary: foreground(secondary),
    outline: palettes.neutralVariant[dark ? 70 : 40], outlineVariant: palettes.neutralVariant[dark ? 40 : 80], focusRing: foreground(surface), selection: primaryContainer, disabled: palettes.neutral[dark ? 40 : 70],
    error: palettes.error[dark ? 80 : 40], warning: palettes.warning[dark ? 80 : 40], success: palettes.success[dark ? 80 : 40], info: palettes.info[dark ? 80 : 40], actionPrimary: primary, onActionPrimary: foreground(primary),
  };
  const theme: Theme = { name: config.name, mode: config.mode, colors: c, palettes, roles: roleValues };
  const result = validateTheme(theme);
  if (!result.valid) throw new Error(`Theme is invalid: ${result.errors.join('; ')}`);
  return theme;
}

export function validateTheme(theme: Theme): ThemeValidation {
  const errors: string[] = [];
  if (!theme || typeof theme !== 'object' || !theme.roles || typeof theme.roles !== 'object') return { valid: false, errors: ['Theme roles are required'], contrasts: [] };
  if (typeof theme.name !== 'string' || !theme.name.trim() || theme.name.length > 80) errors.push('Theme name is invalid');
  if (!['light', 'dark', 'high-contrast'].includes(theme.mode)) errors.push('Theme mode is invalid');
  if (!theme.colors || typeof theme.colors !== 'object') errors.push('Theme colors are required');
  else for (const key of ['primary', 'secondary', 'neutral', 'neutralVariant', 'tertiary', 'error', 'warning', 'success', 'info'] as const) if (!/^#[\da-f]{6}$/i.test(theme.colors[key] ?? '')) errors.push(`Invalid seed: ${key}`);
  if (!theme.palettes || typeof theme.palettes !== 'object') errors.push('Theme palettes are required');
  else for (const key of ['primary', 'secondary', 'neutral', 'neutralVariant', 'tertiary', 'error', 'warning', 'success', 'info'] as const) {
    if (!theme.palettes[key] || tones.some((tone) => !/^#[\da-f]{6}$/i.test(theme.palettes[key][tone] ?? ''))) errors.push(`Invalid palette: ${key}`);
  }
  for (const role of roles) if (!/^#[\da-f]{6}$/i.test(theme.roles[role] ?? '')) errors.push(`Invalid or missing role: ${role}`);
  const contrasts = pairs.filter(([fg, bg]) => /^#[\da-f]{6}$/i.test(theme.roles[fg] ?? '') && /^#[\da-f]{6}$/i.test(theme.roles[bg] ?? '')).map(([fg, bg, minimum]) => {
    const ratio = contrastRatio(theme.roles[fg], theme.roles[bg]);
    if (ratio < minimum) errors.push(`${fg} on ${bg} requires ${minimum}:1 (got ${ratio.toFixed(2)}:1)`);
    return { foreground: fg, background: bg, ratio, minimum, passed: ratio >= minimum };
  });
  return { valid: errors.length === 0, errors, contrasts };
}

function declarations(theme: Theme): [string, string][] {
  const validation = validateTheme(theme);
  if (!validation.valid) throw new Error(`Theme is invalid: ${validation.errors.join('; ')}`);
  return roles.map((role) => [`--cf-v2-${role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, theme.roles[role]]);
}

export function generateThemeCss(theme: Theme, selector: string): string {
  if (typeof selector !== 'string' || !/^(?:\.[a-zA-Z_][\w-]*|#[a-zA-Z_][\w-]*|\[data-[a-zA-Z0-9_-]+(?:="[a-zA-Z0-9_-]+")?\])$/.test(selector)) throw new TypeError('Selector must be a class, ID, or data attribute scope');
  return `${selector} {\n${declarations(theme).map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}\n`;
}

export function applyTheme(target: { style: { setProperty(name: string, value: string): void } }, theme: Theme): void {
  if (!target?.style || typeof target.style.setProperty !== 'function') throw new TypeError('A target with a style.setProperty method is required');
  for (const [name, value] of declarations(theme)) target.style.setProperty(name, value);
}

export const presets: Readonly<Record<'forge' | 'formiai' | 'autofund' | 'neutral', ThemeConfig>> = {
  forge: { name: 'Forge', colors: { primary: '#d8874d', secondary: '#bc8a70', neutral: '#24272a' }, mode: 'dark' },
  formiai: { name: 'FormiAI (demo)', colors: { primary: '#008e83', secondary: '#75bba7', neutral: '#253330' }, mode: 'light' },
  autofund: { name: 'AutoFund (demo)', colors: { primary: '#4058b5', secondary: '#7986cb', neutral: '#292e3d' }, mode: 'light' },
  neutral: { name: 'Neutral', colors: { primary: '#666666', secondary: '#777777', neutral: '#555555' }, mode: 'light' },
};
