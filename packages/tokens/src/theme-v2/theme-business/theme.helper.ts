import type { SemanticRole } from '../theme-abstractions/index.js';

export const tones = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 98, 99, 100] as const;

export const roles: SemanticRole[] = [
  'background', 'surface', 'surfaceRaised', 'surfaceContainer', 'surfaceVariant', 'onSurface', 'onSurfaceVariant',
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer', 'secondary', 'onSecondary', 'outline',
  'outlineVariant', 'focusRing', 'selection', 'disabled', 'error', 'warning', 'success', 'info', 'actionPrimary',
  'onActionPrimary', 'actionPrimaryHover', 'actionPrimaryPressed', 'onError', 'errorHover', 'errorPressed',
  'surfaceContainerHover', 'surfaceContainerPressed', 'onSuccess', 'onWarning', 'onInfo',
];

export const contrastPairs: [SemanticRole, SemanticRole, number][] = [
  ['onSurface', 'surface', 4.5], ['onSurfaceVariant', 'surfaceVariant', 4.5], ['onPrimary', 'primary', 4.5],
  ['onPrimaryContainer', 'primaryContainer', 4.5], ['onSecondary', 'secondary', 4.5],
  ['onActionPrimary', 'actionPrimary', 4.5], ['focusRing', 'surface', 3], ['outline', 'surface', 3],
  ['primary', 'surface', 3], ['secondary', 'surface', 3], ['error', 'surface', 3], ['warning', 'surface', 3],
  ['success', 'surface', 3], ['info', 'surface', 3],
  ['onActionPrimary', 'actionPrimaryHover', 4.5], ['onActionPrimary', 'actionPrimaryPressed', 4.5],
  ['onError', 'error', 4.5], ['onError', 'errorHover', 4.5], ['onError', 'errorPressed', 4.5],
  ['onSurface', 'surfaceContainer', 4.5], ['onSurface', 'surfaceContainerHover', 4.5],
  ['onSurface', 'surfaceContainerPressed', 4.5],
  ['actionPrimary', 'surface', 3], ['actionPrimaryHover', 'surface', 3], ['actionPrimaryPressed', 'surface', 3],
  ['errorHover', 'surface', 3], ['errorPressed', 'surface', 3],
  ['outline', 'surfaceContainer', 3], ['outline', 'surfaceContainerHover', 3],
  ['outline', 'surfaceContainerPressed', 3],
  ['actionPrimaryHover', 'actionPrimary', 1.1], ['actionPrimaryPressed', 'actionPrimaryHover', 1.1],
  ['errorHover', 'error', 1.1], ['errorPressed', 'errorHover', 1.1],
  ['surfaceContainerHover', 'surfaceContainer', 1.1], ['surfaceContainerPressed', 'surfaceContainerHover', 1.1],
  ['onSuccess', 'success', 4.5], ['onWarning', 'warning', 4.5], ['onInfo', 'info', 4.5],
  ['actionPrimary', 'surfaceContainer', 4.5], ['actionPrimary', 'surfaceContainerHover', 4.5],
  ['error', 'surfaceContainer', 4.5], ['warning', 'surfaceContainer', 4.5],
  ['success', 'surfaceContainer', 4.5], ['info', 'surfaceContainer', 4.5],
  ['error', 'surfaceContainerHover', 4.5], ['focusRing', 'surfaceContainer', 3],
  ['focusRing', 'surfaceContainerHover', 3],
];

export function normalizeColor(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value)) {
    throw new TypeError(`${label} must be a #RRGGBB color`);
  }
  return value.toLowerCase();
}
