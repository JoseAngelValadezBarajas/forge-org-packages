import type { Theme, ThemeValidation } from '../theme-abstractions/index.js';
import { contrastRatio } from './contrast.js';
import { contrastPairs, roles, tones } from './theme.helper.js';

const paletteNames = ['primary', 'secondary', 'neutral', 'neutralVariant', 'tertiary', 'error', 'warning', 'success', 'info'] as const;

export function validateTheme(theme: Theme): ThemeValidation {
  const errors: string[] = [];
  if (!theme || typeof theme !== 'object' || !theme.roles || typeof theme.roles !== 'object') {
    return { valid: false, errors: ['Theme roles are required'], contrasts: [] };
  }
  if (typeof theme.name !== 'string' || !theme.name.trim() || theme.name.length > 80) errors.push('Theme name is invalid');
  if (!['light', 'dark', 'high-contrast'].includes(theme.mode)) errors.push('Theme mode is invalid');
  if (!theme.colors || typeof theme.colors !== 'object') errors.push('Theme colors are required');
  else {
    for (const key of paletteNames) if (!/^#[\da-f]{6}$/i.test(theme.colors[key] ?? '')) errors.push(`Invalid seed: ${key}`);
  }
  if (!theme.palettes || typeof theme.palettes !== 'object') errors.push('Theme palettes are required');
  else {
    for (const key of paletteNames) {
      if (!theme.palettes[key] || tones.some((tone) => !/^#[\da-f]{6}$/i.test(theme.palettes[key][tone] ?? ''))) {
        errors.push(`Invalid palette: ${key}`);
      }
    }
  }
  for (const role of roles) if (!/^#[\da-f]{6}$/i.test(theme.roles[role] ?? '')) errors.push(`Invalid or missing role: ${role}`);

  const contrasts = contrastPairs
    .filter(([foreground, background]) => /^#[\da-f]{6}$/i.test(theme.roles[foreground] ?? '') && /^#[\da-f]{6}$/i.test(theme.roles[background] ?? ''))
    .map(([foreground, background, minimum]) => {
      const ratio = contrastRatio(theme.roles[foreground], theme.roles[background]);
      if (ratio < minimum) errors.push(`${foreground} on ${background} requires ${minimum}:1 (got ${ratio.toFixed(2)}:1)`);
      return { foreground, background, ratio, minimum, passed: ratio >= minimum };
    });
  return { valid: errors.length === 0, errors, contrasts };
}

export function getThemeRoleDeclarations(theme: Theme) {
  const validation = validateTheme(theme);
  if (!validation.valid) throw new Error(`Theme is invalid: ${validation.errors.join('; ')}`);
  return roles.map((role) => [role, theme.roles[role]] as const);
}
