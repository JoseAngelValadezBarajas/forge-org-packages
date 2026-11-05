# @corefoundry-labs/forge-tokens

Design tokens for Forge. The package carries two independent systems: the V1 tokens and Theme Engine V2.

## V1 tokens

`tokens.json` is authoritative, and it generates the CSS variables (`--forge-*`). They cover surfaces, text, borders, interactive states, focus, status, selection, overlays, elevations, spacing, radius, typography, motion, responsive values, and border widths. The generated `--forge-palette-*` values are implementation foundations sampled from the token source, not palette scales defined in Figma.

```css
@import '@corefoundry-labs/forge-tokens/tokens.css';

.panel {
  color: var(--forge-text-primary);
  background: var(--forge-surface-raised);
  border-color: var(--forge-border-subtle);
}
```

Dark is the default on `:root`. Set `data-theme="light"` on a host element to scope light tokens.

## Theme Engine V2

`@corefoundry-labs/forge-tokens/theme-v2` generates accessible color themes from brand seeds, and `theme-v2/tokens.css` ships the Forge preset as the default.

```ts
import { applyTheme, createTheme, presets } from '@corefoundry-labs/forge-tokens/theme-v2';

applyTheme(element, createTheme({ ...presets.forge, mode: 'light' }));
```

Semantic roles such as `--cf-v2-surface` are public. Component tokens such as `--cf-v2-button-height-md` are internal, so do not depend on them. V2 follows `data-theme`, and `data-cf-theme-mode` overrides it with `light`, `dark`, or `high-contrast`. See the [Theme Engine V2 guide](../../docs/design-system/theme-engine-v2.md).

## Development

From the repository root:

```bash
npm run build --workspace=@corefoundry-labs/forge-tokens
npm test --workspace=@corefoundry-labs/forge-tokens
```

The build regenerates the V1 CSS and the V2 stylesheet. Applications must import the package exports, not its source directory.
