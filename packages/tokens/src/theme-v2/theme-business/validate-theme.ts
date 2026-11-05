import { paletteNames, semanticRoles, themeModes, tones, type Theme, type ThemeValidation } from '../theme-abstractions/index.js';
import { contrastRatio } from './contrast.js';
import { contrastPairs, highContrastPairs } from './theme.helper.js';

export function validateTheme(theme: Theme): ThemeValidation {
  const errors: string[] = [];
  if (!theme || typeof theme !== 'object' || !theme.roles || typeof theme.roles !== 'object') {
    return { valid: false, errors: ['Theme roles are required'], contrasts: [] };
  }
  if (typeof theme.name !== 'string' || !theme.name.trim() || theme.name.length > 80) errors.push('Theme name is invalid');
  if (!themeModes.includes(theme.mode)) errors.push('Theme mode is invalid');
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
  for (const role of semanticRoles) if (!/^#[\da-f]{6}$/i.test(theme.roles[role] ?? '')) errors.push(`Invalid or missing role: ${role}`);

  const pairs = theme.mode === 'high-contrast' ? [...contrastPairs, ...highContrastPairs] : contrastPairs;
  const contrasts = pairs
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
  return semanticRoles.map((role) => [role, theme.roles[role]] as const);
}
