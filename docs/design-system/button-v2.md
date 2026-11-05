# ButtonV2

`ButtonV2` is the first component in `packages/ui/src/componentsV2`. It is an
independent V2 action: V1 `Button` keeps its API and appearance, and an
application can use both. The design source is the
[CoreFoundry Design System V2 file](https://www.figma.com/design/0PqOZvgaNysCVq6CVKilAN).
The Theme Engine V2 is the source of truth for color.

## API

| Prop | Values | Default |
| --- | --- | --- |
| `variant` | `primary`, `secondary`, `ghost`, `danger` | `primary` |
| `size` | `sm`, `md`, `lg` | `md` |
| `loading` | boolean | `false` |
| `loadingLabel` | string | `Saving…` |
| `iconStart`, `iconEnd` | ReactNode | none |

All native button attributes and `ref` are forwarded. `type` defaults to
`button`. A button without children must have `aria-label`, and TypeScript
rejects it otherwise.

## Behavior

- **Disabled:** uses the native `disabled` attribute.
- **Loading:** shows a spinner and `loadingLabel`, sets `aria-busy` and
  `aria-disabled`, and blocks activation and form submission. The button stays
  focusable, so keyboard users keep their place.
- **Focus:** `focus-visible` draws a 2px `focusRing` outline with a 3px offset.
- **Icons:** decorative, sized to 16px, and inherit the foreground role.
  Icon-only buttons are square at 32, 40, or 48px.
- **Typography:** inherits the font family of the consuming application.
- **Reduced motion:** the spinner stops and transitions are removed.

## Roles

| Variant | Rest | Hover | Pressed | Foreground |
| --- | --- | --- | --- | --- |
| `primary` | `actionPrimary` | `actionPrimaryHover` | `actionPrimaryPressed` | `onActionPrimary` |
| `secondary` | `surfaceContainer` | `surfaceContainerHover` | `surfaceContainerPressed` | `onSurface` |
| `ghost` | transparent | `surfaceContainerHover` | `surfaceContainerPressed` | `onSurface` |
| `danger` | `error` | `errorHover` | `errorPressed` | `onError` |

`secondary` adds an `outline` border. Disabled buttons use the `disabled` role
with the foreground of their variant. Geometry, typography, and motion come
from the `--cf-v2-button-*` tokens described in
[Theme Engine V2](theme-engine-v2.md#component-geometry). An architecture test
rejects V1 tokens, V1 imports, unknown V2 tokens, and hardcoded colors or
dimensions in `componentsV2`.

## Default theme

Importing `@corefoundry-labs/forge-ui` loads
`@corefoundry-labs/forge-tokens/theme-v2/tokens.css`, so V2 components use the
Forge theme when there is no explicit theme. `FeedbackStateV2` follows the same
default. `ThemeScope` and `applyTheme` replace it within their scope.

## Certification

`npm run check:v2-consumer` packs the three packages, installs the tarballs in a
temporary React project outside the repository, and proves that none of them is
a link into the monorepo. It compiles the project in strict TypeScript, confirms
that an unnamed icon-only button does not compile, builds it with Vite, and
drives the production build in Chromium.

For the default theme and the four presets in three modes it verifies:

- Rest, hover, and pressed colors against the engine roles for each variant.
- Text at 4.5:1, action and outline boundaries at 3:1, and the focus ring at 3:1.
- Enter and Space activation, disabled and loading click blocking, focus retention
  while loading, and tab order.
- `FeedbackStateV2` roles, accessible names, and themed colors.
- An axe scan against the WCAG 2.0, 2.1, and 2.2 A and AA rules.
- Heights, icon-only squares, inherited font family, reduced motion, and no
  horizontal overflow at 375px.
- That V1 `Button` keeps its color and that the V2 stylesheet leaves the V1
  `color-scheme` alone.

`npm run check:v2-consumer` runs as part of `npm test`, `npm run quality`, and the
Quality workflow. To refresh the files in `docs/evidence/v2-consumer`, run
`node tooling/scripts/v2-consumer-certification.mjs --evidence` after a build.

These checks use Chromium with automated rules. They are not a complete WCAG
certification: screen reader and other browser testing still need people.

## Review

Run `npm run playground:ui` and open the ButtonV2 page. The host changes preset,
mode, and primary seed, and shows the four presets in three modes side by side.
