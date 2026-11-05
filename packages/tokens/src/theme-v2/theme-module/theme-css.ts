import type { Theme } from '../theme-abstractions/index.js';
import { getThemeRoleDeclarations } from '../theme-business/validate-theme.js';

function cssDeclarations(theme: Theme): [string, string][] {
  return getThemeRoleDeclarations(theme).map(([role, value]) => [
    `--cf-v2-${role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    value,
  ]);
}

export function generateThemeCss(theme: Theme, selector: string): string {
  if (typeof selector !== 'string' || !/^(?:\.[a-zA-Z_][\w-]*|#[a-zA-Z_][\w-]*|\[data-[a-zA-Z0-9_-]+(?:="[a-zA-Z0-9_-]+")?\])$/.test(selector)) {
    throw new TypeError('Selector must be a class, ID, or data attribute scope');
  }
  return `${selector} {\n${cssDeclarations(theme).map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}\n`;
}

export function applyTheme(target: { style: { setProperty(name: string, value: string): void } }, theme: Theme): void {
  if (!target?.style || typeof target.style.setProperty !== 'function') {
    throw new TypeError('A target with a style.setProperty method is required');
  }
  for (const [name, value] of cssDeclarations(theme)) target.style.setProperty(name, value);
}
