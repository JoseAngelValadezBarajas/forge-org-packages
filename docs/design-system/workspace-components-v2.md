# V2 workspace components

`KbdV2`, `ToggleButtonV2`, `ToolbarV2`, `TableV2`, and `StatisticV2` support tools
where a person works on data for a long time: annotation, review, inspection. They
live in `packages/ui/src/componentsV2` under `data-display` and `actions`, are
independent of V1, and take every color and size from the Theme Engine V2 and the
`--cf-v2-*` geometry. They have no domain logic.

The design source is the
[CoreFoundry Design System V2 file](https://www.figma.com/design/0PqOZvgaNysCVq6CVKilAN).
The Figma `style` property is `variant` here, because `style` is a native React prop.

## KbdV2

A keyboard key for shortcut hints. It renders a native `kbd`.

| Prop | Values | Default |
| --- | --- | --- |
| `size` | `sm`, `md` | `md` |
| `children` | the key's label | required |

Write the label the way the person reads it (`Ctrl`, `Supr`, `←`). Combine several
keys by placing several `KbdV2` side by side.

## ToggleButtonV2

A button with an on/off state, exposed as `aria-pressed`. It looks like a secondary
`ButtonV2` and, when pressed, uses `primaryContainer`, so the state never depends on
color alone: `aria-pressed` and a forced-colors style carry it too.

| Prop | Values | Default |
| --- | --- | --- |
| `size` | `sm`, `md`, `lg` | `md` |
| `pressed`, `onPressedChange` | controlled state | uncontrolled |
| `defaultPressed` | initial state when uncontrolled | `false` |
| `iconStart` | ReactNode | none |
| `children` | label; without it `aria-label` is required | none |

A click handler that calls `preventDefault()` cancels the change. A disabled button
never changes.

## ToolbarV2 and ToolbarSeparatorV2

A group of related controls that is a single tab stop. Arrow keys move between the
enabled controls and wrap around; Home and End jump to the ends. The controls stay
the consumer's: `ButtonV2`, `ToggleButtonV2`, or any `button`.

| Prop | Values | Default |
| --- | --- | --- |
| `orientation` | `horizontal`, `vertical` | `horizontal` |
| `aria-label` or `aria-labelledby` | the toolbar's name | required |

`ToolbarSeparatorV2` draws a divider perpendicular to the toolbar. Only `button`
elements and `[role="button"]` elements take part in the arrow-key navigation, so
put other controls (menus, inputs) outside the toolbar.

## TableV2

A semantic data table. It owns structure, spacing, and accessibility; the cells'
content stays the consumer's.

| Prop | Values | Default |
| --- | --- | --- |
| `columns` | `{ key, header, cell(row, index), width?, align?, rowHeader? }` | required |
| `rows`, `getRowKey` | the data and a stable key for each row | required |
| `caption`, `hideCaption` | the accessible name; keep it for assistive technology only | required, `false` |
| `density` | `comfortable`, `compact` | `comfortable` |
| `empty` | shown in one full-width cell when there are no rows | none |
| `currentKey` | marks one row with `aria-current` | none |

Mark the column that names each row with `rowHeader`, so assistive technology reads
it as the row's name. The table scrolls horizontally inside its frame when it does
not fit. It has no sorting, selection, or pagination.

## StatisticV2

A number with its label, unit, and optionally how it changed.

| Prop | Values | Default |
| --- | --- | --- |
| `label`, `value`, `unit` | ReactNode; `unit` is optional | required, required, none |
| `variant` | `plain`, `card`, `trend` | `plain` |
| `trend` | `{ direction, delta, baseline?, intent? }` | none |

`trend` shows only in `card` and `trend`. `direction` is `rising`, `falling`, or
`unchanged`; the arrow is decorative and the direction is also written out for
assistive technology. An increase is not always good, so `intent` (`positive`,
`negative`, `neutral`) is the caller's decision and only tints the arrow. Numeric
formatting, locale, and units are the caller's too.

## `surfaceSunken`

A theme role for work areas that should sit lower than the page: canvases, media
viewers, code wells. It is darker than `background` in dark and high contrast, and
slightly below it in light. `onSurface` reaches 4.5:1, and `outline` and `focusRing`
3:1, against it in every preset and mode.
