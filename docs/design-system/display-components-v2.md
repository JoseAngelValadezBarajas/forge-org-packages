# V2 display components

`CardV2`, `BadgeV2`, `TabsV2`, and `AlertV2` live in
`packages/ui/src/componentsV2`, under `surfaces`, `status`, `navigation`, and
`feedback`. They are independent V2 components: the V1 `Card`, `Badge`, `Tabs`,
and `Alert` keep their API and appearance, and an application can use both. The
design source is the
[CoreFoundry Design System V2 file](https://www.figma.com/design/0PqOZvgaNysCVq6CVKilAN).
The Theme Engine V2 is the source of truth for color.

All four inherit the font family of the consuming application and have no domain
logic. The Figma `style` property is `variant` here, because `style` is a native
React prop. Heights and widths shown on the Figma masters are specimens, so these
components size to their content and container.

## CardV2

| Prop | Values | Default |
| --- | --- | --- |
| `variant` | `default`, `outlined`, `elevated`, `interactive` | `default` |
| `as` | `div`, `section`, `article`, `aside`; `button`, `a` when interactive | `div`; `button` when interactive |
| `header`, `footer`, `children` | ReactNode slots | none |

A static card is a container: TypeScript rejects `onClick`, `disabled`, and `href`
on it, and it has no hover, focus, or role. Only `variant="interactive"` is an
action, and the whole surface is then a native button, or a link with
`as="a"` and `href`.

Inside an interactive card the slots render as `span`, so pass phrasing content
and no nested controls. The `footer` slot uses `actionPrimary`.

## BadgeV2

| Prop | Values | Default |
| --- | --- | --- |
| `tone` | `neutral`, `primary`, `success`, `warning`, `error`, `info` | `neutral` |
| `variant` | `solid`, `subtle`, `outline` | `solid` |
| `size` | `sm`, `md` | `sm` |

Badges are static text and are never interactive or dismissible. Say the status
in words, because color alone does not convey it. A long label truncates inside
its container.

## TabsV2

| Prop | Values | Default |
| --- | --- | --- |
| `items` | `{ id, label, content, disabled? }[]` | required |
| `aria-label` or `aria-labelledby` | string | required |
| `value`, `defaultValue` | item `id` | first enabled item |
| `onValueChange` | `(id) => void` | none |
| `variant` | `underline`, `pill` | `underline` |
| `size` | `sm`, `md` | `md` |
| `activation` | `automatic`, `manual` | `automatic` |

`TabsV2` is not a router. Arrow keys, Home, and End move between enabled tabs,
wrap at the ends, and follow the text direction. With `manual` activation they
only move focus, and Enter or Space selects. Tab then reaches the panel.

Panels stay mounted and are hidden with the `hidden` attribute, so their state
survives a tab change. DOM ids are generated, so two instances can share item
ids. A list wider than its container scrolls horizontally.

## AlertV2

| Prop | Values | Default |
| --- | --- | --- |
| `tone` | `info`, `success`, `warning`, `error`, `neutral` | `info` |
| `variant` | `soft`, `solid`, `outline` | `soft` |
| `title`, `description` | ReactNode | none |
| `icon` | ReactNode, or `null` to remove it | tone mark |
| `actions` | ReactNode | none |
| `onDismiss` | click handler | none |
| `dismissLabel` | string | `Close` |
| `role` | native role | `alert` for `error`, otherwise `status` |

An alert needs a `title`, a `description`, or `children`, and TypeScript rejects
an empty one. `children` is the description when `description` is missing.

`role="alert"` interrupts screen readers, so only `error` uses it by default. Pass
`role="note"` for an alert that is already on the page and does not need to be
announced.

`AlertV2` has no retry or queue logic. Compose buttons through `actions`. The
dismiss button only calls `onDismiss`, so the parent removes the alert and decides
where focus goes. The dismiss focus ring uses the foreground color, so it stays
visible on solid fills, but a `ButtonV2` placed inside a solid alert keeps
`focusRing`, which can have low contrast there. Prefer `soft` or `outline` for
alerts with actions.

## Roles

| Component | Role use |
| --- | --- |
| `CardV2` | `surfaceContainer` fill, `surface` when outlined, `surfaceContainerHover`, `outline`, `onSurface`, `actionPrimary`, `disabled` |
| `BadgeV2` solid | The tone fill with its foreground, or `surfaceContainer` with `onSurface` for neutral |
| `BadgeV2` subtle, outline | `surfaceContainer` fill with the tone as text, and as border when outlined |
| `TabsV2` | `surface`, `onSurface`, `surfaceContainerHover`; selected uses `actionPrimary`; pill selected and panel use `surfaceContainer` |
| `AlertV2` soft | `surfaceContainer` fill, `onSurface` text, and the tone fill for the icon |
| `AlertV2` solid | The tone fill with its foreground, and the icon inverted |
| `AlertV2` outline | `surface` fill, `onSurface` text, and the tone as border and icon |

The tone fills are `actionPrimary`, `success`, `warning`, `error`, and `info`, with
`onActionPrimary`, `onSuccess`, `onWarning`, `onError`, and `onInfo`. Neutral
`outline` badges and alerts use the `outline` role as their border.

Geometry, opacity, and motion come from the `--cf-v2-card-*`, `--cf-v2-badge-*`,
`--cf-v2-tabs-*`, and `--cf-v2-alert-*` tokens described in
[Theme Engine V2](theme-engine-v2.md#component-geometry).

## Certification

`npm run check:v2-consumer` covers these components with the same external project
described in [ButtonV2](button-v2.md#certification). For the default theme and the
four presets in three modes it verifies colors for each tone and style against the
engine roles, contrast after opacity, keyboard use, focus, ARIA relationships,
roving tabindex, alert roles, dismissal, and an axe scan. The TypeScript checks
reject a static card that acts like a control, an empty alert, unnamed tabs, and
unknown badge tones.

These checks use Chromium with automated rules. Screen reader announcements and
other browsers still need people.

## Review

Run `npm run playground:ui` and open the V2 pages under Surfaces, Status,
Navigation, and Feedback. Each page changes preset, mode, and primary seed, and
shows the four presets in three modes side by side.
