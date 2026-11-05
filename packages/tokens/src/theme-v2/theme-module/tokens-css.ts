import type { ThemeMode } from '../theme-abstractions/index.js';
import { createTheme } from '../theme-business/index.js';
import { geometry } from './geometry.js';
import { presets } from './presets.js';
import { cssDeclarations, cssVariableName } from './theme-css.js';

const modeSelector = (mode: ThemeMode) => `[data-cf-theme-mode="${mode}"]`;
const inheritedSelector = (mode: ThemeMode) => `[data-theme="${mode}"]:not([data-cf-theme-mode])`;

function block(selector: string, declarations: readonly (readonly [string, string])[]): string {
  return `${selector} {\n${declarations.map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}\n`;
}

function roleDeclarations(mode: ThemeMode) {
  return cssDeclarations(createTheme({ ...presets.forge, mode }));
}

export function generateTokensCss(): string {
  const geometryDeclarations = Object.entries(geometry).flatMap(([component, tokens]) =>
    Object.entries(tokens).map(([token, value]) => [cssVariableName(`${component}-${token}`), value] as const),
  );
  return [
    block(`:root, ${modeSelector('dark')}`, roleDeclarations('dark')),
    block(inheritedSelector('dark'), roleDeclarations('dark')),
    block(inheritedSelector('light'), roleDeclarations('light')),
    block(modeSelector('light'), [['color-scheme', 'light'], ...roleDeclarations('light')]),
    block(modeSelector('high-contrast'), roleDeclarations('high-contrast')),
    block(`${modeSelector('dark')}, ${modeSelector('high-contrast')}`, [['color-scheme', 'dark']]),
    block(':root', geometryDeclarations),
  ].join('');
}
