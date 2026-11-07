export const tones = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 98, 99, 100] as const;
export type Tone = (typeof tones)[number];

export const themeModes = ['light', 'dark', 'high-contrast'] as const;
export type ThemeMode = (typeof themeModes)[number];

export const paletteNames = ['primary', 'secondary', 'neutral', 'neutralVariant', 'tertiary', 'error', 'warning', 'success', 'info'] as const;

export const semanticRoles = [
  'background', 'surface', 'surfaceRaised', 'surfaceSunken', 'surfaceContainer', 'surfaceContainerHover', 'surfaceContainerPressed',
  'surfaceVariant', 'onSurface', 'onSurfaceVariant', 'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'outline', 'outlineVariant', 'focusRing', 'selection', 'disabled', 'scrim', 'shadow',
  'error', 'onError', 'errorHover', 'errorPressed', 'warning', 'onWarning', 'success', 'onSuccess', 'info', 'onInfo',
  'actionPrimary', 'onActionPrimary', 'actionPrimaryHover', 'actionPrimaryPressed',
] as const;
export type SemanticRole = (typeof semanticRoles)[number];
