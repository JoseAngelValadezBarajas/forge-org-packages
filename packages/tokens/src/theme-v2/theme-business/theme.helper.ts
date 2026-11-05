import type { SemanticRole } from '../theme-abstractions/index.js';

export const tones = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 98, 99, 100] as const;

export const roles: SemanticRole[] = [
  'background', 'surface', 'surfaceRaised', 'surfaceContainer', 'surfaceVariant', 'onSurface', 'onSurfaceVariant',
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer', 'secondary', 'onSecondary', 'outline',
  'outlineVariant', 'focusRing', 'selection', 'disabled', 'error', 'warning', 'success', 'info', 'actionPrimary',
  'onActionPrimary',
];

export const contrastPairs: [SemanticRole, SemanticRole, number][] = [
  ['onSurface', 'surface', 4.5], ['onSurfaceVariant', 'surfaceVariant', 4.5], ['onPrimary', 'primary', 4.5],
  ['onPrimaryContainer', 'primaryContainer', 4.5], ['onSecondary', 'secondary', 4.5],
  ['onActionPrimary', 'actionPrimary', 4.5], ['focusRing', 'surface', 3], ['outline', 'surface', 3],
  ['primary', 'surface', 3], ['secondary', 'surface', 3], ['error', 'surface', 3], ['warning', 'surface', 3],
  ['success', 'surface', 3], ['info', 'surface', 3],
];

export function normalizeColor(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value)) {
    throw new TypeError(`${label} must be a #RRGGBB color`);
  }
  return value.toLowerCase();
}
