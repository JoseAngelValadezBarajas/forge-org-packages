# V2 form controls

`TextInputV2`, `SelectV2`, `CheckboxV2`, and `SwitchV2` live in
`packages/ui/src/componentsV2/forms`. They are independent V2 controls: the V1
`TextInput`, `Select`, `Checkbox`, and `Switch` keep their API and appearance,
and an application can use both. The design source is the
[CoreFoundry Design System V2 file](https://www.figma.com/design/0PqOZvgaNysCVq6CVKilAN).
The Theme Engine V2 is the source of truth for color.

All four wrap a native element, have no validation or domain logic, and inherit
the font family of the consuming application. Set the invalid state with
`aria-invalid`, and link messages with `aria-describedby`.

## TextInputV2

| Prop | Values | Default |
| --- | --- | --- |
| `size` | `sm`, `md`, `lg` | `md` |

All other native input attributes and `ref` go to the `<input>`. `size` replaces
the native numeric attribute. The control does not own a label, helper text, or
adornments, so compose them around it:

```tsx
<label htmlFor="email">Email address</label>
<TextInputV2 id="email" type="email" aria-invalid aria-describedby="email-error" />
<small id="email-error">Please enter a valid email address.</small>
```

## SelectV2

| Prop | Values | Default |
| --- | --- | --- |
| `size` | `sm`, `md`, `lg` | `md` |

`SelectV2` is a styled native `<select>`, not a custom listbox, so keyboard use
and the options popup belong to the browser and vary by platform. `multiple` and
the native numeric `size` are not accepted. `ref` and native attributes go to
the `<select>`; `className` and `style` go to the root, which controls the width.
An `<option value="">` that is selected reads as a placeholder.

## CheckboxV2 and SwitchV2

| Prop | Values | Default |
| --- | --- | --- |
| `children` | label content | none |
| `indeterminate` (`CheckboxV2` only) | boolean | `false` |

`children` renders a clickable label. Without it, the control must be named by
`aria-label`, `aria-labelledby`, or an `id` for an external label, and TypeScript
rejects it otherwise. `ref` and native attributes go to the `<input>`; `className`
and `style` go to the root.

`indeterminate` sets the DOM property, and it stays set after a click until the
prop changes. `SwitchV2` is a native checkbox with `role="switch"`, so Space
toggles it. Both have a 44px target.

## Roles

| State | Field | Checkbox box | Switch track |
| --- | --- | --- | --- |
| Rest | `surfaceContainer` | `surfaceContainer` | `surfaceContainer` |
| Hover | `surfaceContainerHover` | `surfaceContainerHover` | `surfaceContainerHover` |
| Pressed | none | `surfaceContainerPressed` | `surfaceContainerPressed` |
| Selected | none | `actionPrimary` | `actionPrimary` |
| Selected hover | none | `actionPrimaryHover` | `actionPrimaryHover` |
| Selected pressed | none | `actionPrimaryPressed` | `actionPrimaryPressed` |
| Invalid | `error` outline | `error` border | none |
| Disabled | `disabled` | `disabled` when unselected | `disabled` when off |

- **Foreground:** values use `onSurface`, placeholders use `onSurfaceVariant` at
  the Figma opacity, and marks use `onActionPrimary`. The switch thumb uses
  `onSurface` when off and `onActionPrimary` when on.
- **Border:** `outline`.
- **Focus:** a 2px `focusRing` drawn inside the field or the 44px target.
  `SelectV2` also shows it while open.
- **Checked and invalid:** a checked invalid checkbox uses `error` and `onError`.
  Figma only draws the unchecked case, so this keeps the error visible once checked.

Geometry, opacity, and motion come from the `--cf-v2-field-*`, `--cf-v2-select-*`,
`--cf-v2-selection-*`, `--cf-v2-checkbox-*`, and `--cf-v2-switch-*` tokens described
in [Theme Engine V2](theme-engine-v2.md#component-geometry).

## Certification

`npm run check:v2-consumer` covers these controls with the same external project
described in [ButtonV2](button-v2.md#certification). For the default theme and
the four presets in three modes it verifies colors for each state against the
engine roles, contrast after opacity, typing, native keyboard use, label clicks,
disabled and read-only blocking, tab order, target sizes, and an axe scan. The
TypeScript checks reject unnamed selection controls, a numeric `size`, and
`multiple` on `SelectV2`.

These checks use Chromium with automated rules. The native select popup is not
covered, and screen reader, Android, and other browser testing still need people.

## Review

Run `npm run playground:ui` and open the V2 pages under Forms. Each page changes
preset, mode, and primary seed, and shows the four presets in three modes side by
side.
