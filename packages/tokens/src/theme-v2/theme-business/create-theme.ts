import { themeModes, type BrandColors, type Theme, type ThemeConfig, type Tone } from '../theme-abstractions/index.js';
import { contrastRatio } from './contrast.js';
import { generatePalette } from './palette.js';
import { normalizeColor } from './theme.helper.js';
import { validateTheme } from './validate-theme.js';

type StateTones = readonly [rest: Tone, hover: Tone, pressed: Tone];

function foreground(background: string): string {
  return contrastRatio('#000000', background) >= contrastRatio('#ffffff', background) ? '#000000' : '#ffffff';
}

export function createTheme(config: ThemeConfig): Theme {
  if (!config || typeof config.name !== 'string' || !config.name.trim() || config.name.length > 80) {
    throw new TypeError('Theme name must be a non-empty string of at most 80 characters');
  }
  if (!themeModes.includes(config.mode)) {
    throw new TypeError('Theme mode must be light, dark, or high-contrast');
  }
  if (!config.colors || typeof config.colors !== 'object') throw new TypeError('Theme colors are required');

  const colors: Required<BrandColors> = {
    primary: normalizeColor(config.colors.primary, 'primary'),
    secondary: normalizeColor(config.colors.secondary, 'secondary'),
    neutral: normalizeColor(config.colors.neutral, 'neutral'),
    neutralVariant: normalizeColor(config.colors.neutralVariant ?? config.colors.neutral, 'neutralVariant'),
    tertiary: normalizeColor(config.colors.tertiary ?? config.colors.secondary, 'tertiary'),
    error: normalizeColor(config.colors.error ?? '#b3261e', 'error'),
    warning: normalizeColor(config.colors.warning ?? '#946000', 'warning'),
    success: normalizeColor(config.colors.success ?? '#207a45', 'success'),
    info: normalizeColor(config.colors.info ?? '#245da8', 'info'),
  };
  const palettes = Object.fromEntries(Object.entries(colors).map(([key, value]) => [key, generatePalette(value)])) as Theme['palettes'];
  const dark = config.mode !== 'light';
  const high = config.mode === 'high-contrast';
  const surface = palettes.neutral[dark ? (high ? 0 : 10) : 98];
  const surfaceVariant = palettes.neutralVariant[high ? 20 : dark ? 30 : 90];
  const actionTones: StateTones = high ? [90, 85, 80] : dark ? [80, 75, 70] : [40, 35, 30];
  const errorTones: StateTones = high ? [90, 85, 80] : dark ? [80, 75, 70] : [40, 35, 30];
  const containerTones: StateTones = high ? [10, 15, 20] : dark ? [20, 25, 30] : [95, 90, 85];
  const accentTone: Tone = high ? 90 : dark ? 80 : 40;
  const primary = palettes.primary[actionTones[0]];
  const error = palettes.error[errorTones[0]];
  const primaryContainer = palettes.primary[high ? 20 : dark ? 30 : 90];
  const secondary = palettes.secondary[accentTone];
  const warning = palettes.warning[accentTone];
  const success = palettes.success[accentTone];
  const info = palettes.info[accentTone];
  const roleValues: Theme['roles'] = {
    background: surface,
    surface,
    surfaceRaised: palettes.neutral[high ? 5 : dark ? 15 : 100],
    surfaceContainer: palettes.neutral[containerTones[0]],
    surfaceContainerHover: palettes.neutral[containerTones[1]],
    surfaceContainerPressed: palettes.neutral[containerTones[2]],
    surfaceVariant,
    onSurface: foreground(surface),
    onSurfaceVariant: foreground(surfaceVariant),
    primary,
    onPrimary: foreground(primary),
    primaryContainer,
    onPrimaryContainer: foreground(primaryContainer),
    secondary,
    onSecondary: foreground(secondary),
    outline: palettes.neutralVariant[high ? 90 : dark ? 70 : 40],
    outlineVariant: palettes.neutralVariant[high ? 70 : dark ? 40 : 80],
    focusRing: foreground(surface),
    selection: primaryContainer,
    disabled: palettes.neutral[dark ? 40 : 70],
    scrim: palettes.neutral[10],
    shadow: palettes.neutral[0],
    error,
    onError: foreground(error),
    errorHover: palettes.error[errorTones[1]],
    errorPressed: palettes.error[errorTones[2]],
    warning,
    onWarning: foreground(warning),
    success,
    onSuccess: foreground(success),
    info,
    onInfo: foreground(info),
    actionPrimary: primary,
    onActionPrimary: foreground(primary),
    actionPrimaryHover: palettes.primary[actionTones[1]],
    actionPrimaryPressed: palettes.primary[actionTones[2]],
  };
  const theme: Theme = { name: config.name, mode: config.mode, colors, palettes, roles: roleValues };
  const result = validateTheme(theme);
  if (!result.valid) throw new Error(`Theme is invalid: ${result.errors.join('; ')}`);
  return theme;
}
