# Dynamic Theme Engine V2

`@corefoundry-labs/forge-tokens/theme-v2` exposes a React-independent color
engine. It adds `--cf-v2-*` variables; existing `--forge-*` tokens and V1
components retain their published behavior. V1 and V2 can be used together,
and V1 needs no provider. This subpath is in the candidate branch; it is not
available on npm until a future release is published.

## Color model

1. **Seeds:** primary, secondary, neutral, and optional neutral variant,
   tertiary, error, warning, success, and info. Inputs are opaque `#RRGGBB`.
2. **Tonal palettes:** fixed tones from 0 through 100 generated with HCT.
3. **Semantic roles:** surfaces, foregrounds, actions, outlines, focus,
   selection, disabled state, and feedback colors. Light, dark, and high
   contrast each use explicit tone assignments. High contrast is currently a
   dark appearance with a black surface and lighter primary.
4. **Component roles:** `actionPrimary` and `onActionPrimary` demonstrate an
   additive component layer. Future V2 components may consume these roles or
   define further `--cf-v2-*` component tokens.

HCT was selected over OKLCH because its tone is tied to contrast and the
Apache-2.0 `@material/material-color-utilities` package supplies the tonal
solver. [HCT](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/hct.ts)
and [OKLCH](https://colorjs.io/docs/spaces) are perceptual color models;
this engine uses HCT and its own role assignments. It does not claim exact
Material 3 Expressive parity. The dependency is pinned at 0.3.0 (about 758 kB
unpacked); 0.4.0 was rejected because its root import failed under Node ESM
in this environment. FormiAI and AutoFund presets are provisional demos.

## Public API

- `createTheme(config)` validates seeds and returns palettes, semantic roles,
  component roles, and the normalized configuration.
- `generatePalette(seed)` produces a deterministic HCT tonal scale.
- `generateThemeCss(theme, selector)` returns scoped CSS. Selectors are limited
  to a single class, ID, or data attribute to prevent accidental global CSS and
  injection. It never accesses the DOM.
- `applyTheme(element, theme)` sets variables on the explicit element only.
- `validateTheme(theme)` returns validation errors and contrast results;
  `contrastRatio(a, b)` is also exported.
- `presets` provides Forge, FormiAI, AutoFund, and a neutral example.

No API touches the DOM at import time. Theme creation, CSS generation, and
validation work in Node/SSR. The consumer owns system preference detection,
state, and persistence. For a system preference, resolve `matchMedia` in the
application and pass `light` or `dark`; the engine deliberately accepts no
`system` mode.

## Vanilla and SSR

```ts
import { createTheme, applyTheme, generateThemeCss } from '@corefoundry-labs/forge-tokens/theme-v2';

const config = {
  name: 'my-product',
  colors: { primary: '#008e83', secondary: '#75bba7', neutral: '#253330' },
  mode: 'light' as const,
};
const theme = createTheme(config); // safe on the server
const css = generateThemeCss(theme, '.my-product'); // serialize for SSR
const element = document.querySelector<HTMLElement>('.my-product');
if (element) applyTheme(element, theme); // browser only
// For runtime changes, generate another theme and apply it to the same element:
if (element) applyTheme(element, createTheme({ ...config, mode: 'dark' }));
if (element) applyTheme(element, createTheme({ ...config, mode: 'high-contrast' }));
```

## React and Vite

Install the released package when this subpath becomes available, then keep
theme state in the application. A scoped element requires no provider:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { applyTheme, createTheme, type ThemeMode } from '@corefoundry-labs/forge-tokens/theme-v2';
import './app.css';

export function App() {
  const [mode, setMode] = useState<ThemeMode>('light');
  const scope = useRef<HTMLElement>(null);
  const theme = useMemo(() => createTheme({
    name: 'my-product', mode,
    colors: { primary: '#008e83', secondary: '#75bba7', neutral: '#253330' },
  }), [mode]);
  useEffect(() => { if (scope.current) applyTheme(scope.current, theme); }, [theme]);
  return <section ref={scope} className="my-product">
    <button onClick={() => setMode('dark')}>Dark mode</button>
    <button onClick={() => setMode('light')}>Light mode</button>
    <button onClick={() => setMode('high-contrast')}>High contrast</button>
  </section>;
}
```

```css
.my-product { background: var(--cf-v2-surface); color: var(--cf-v2-on-surface); }
.my-product button { background: var(--cf-v2-action-primary); color: var(--cf-v2-on-action-primary); }
.my-product button:focus-visible { outline: 3px solid var(--cf-v2-focus-ring); outline-offset: 3px; }
```

For SSR without a flash, emit `generateThemeCss(theme, '.my-product')` in a
server-rendered stylesheet. `applyTheme` requires an explicit element and
does not change the document root implicitly.

## Contrast and limitations

Foregrounds are selected as black or white according to the better WCAG
relative-luminance contrast. The validator checks text pairs at 4.5:1 and
focus, outline, action, and feedback colors against the surface at 3:1.
`outlineVariant` is decorative and is not a guaranteed interactive boundary.
Large text may use 3:1 under
WCAG, but generated foregrounds target the stricter 4.5:1. Broken or missing
roles/palettes and insufficient ratios yield diagnostics; generation fails
if its result cannot satisfy the checked pairs.

These checks are not a complete WCAG 2.2 AA certification: applications must
review actual adjacent colors, focus visibility and size, text sizes, keyboard
use, and assistive technology. Disabled controls need a disabled semantic state
and a cue beyond color. Custom feedback seeds can change conventional color
meaning; consumers must validate their communication. No offline persistence,
automatic system mode, typography, or component V2 implementations are included.

## Playground and verification

From the repository root, run `npm ci`, `npm run build`, then
`npm run playground:theme-v2`. The playground uses the public subpath, allows
changing seeds and modes, shows palettes and contrast, and exports JSON/CSS.
`npm run quality` runs unit, browser, package, and V1 compatibility checks.
The compatibility gate also installs the candidate tarballs in an external
consumer and exercises the V2 API in TypeScript, Node, and Chromium. The
automated screenshots under `docs/evidence/theme-v2` show two presets/modes;
they are not human-reviewed Figma parity evidence.
