# V2 feedback and identity components

`ProgressV2`, `SkeletonV2`, and `SnackbarV2` live in
`packages/ui/src/componentsV2/feedback`, and `AvatarV2` lives in `data-display`.
They are independent V2 components: the V1 `Progress`, `Skeleton`, and `Toast`
keep their API and appearance, and an application can use both. The design source
is the
[CoreFoundry Design System V2 file](https://www.figma.com/design/0PqOZvgaNysCVq6CVKilAN).
The Theme Engine V2 is the source of truth for color.

All of them inherit the font family of the consuming application and have no
domain logic. Motion stops with `prefers-reduced-motion`.

## ProgressV2

| Prop | Values | Default |
| --- | --- | --- |
| `label` or `aria-label` or `aria-labelledby` | accessible name | required |
| `value`, `max` | numbers, value clamped to `0..max` | `max` is 100 |
| `indeterminate` | `true`, instead of `value` | none |
| `shape` | `linear`, `circular` | `linear` |
| `status` | `normal`, `success`, `error` | `normal` |
| `valueLabel` | ReactNode, `null` hides it | percent, `Ongoing`, or `…` |

TypeScript requires a value or `indeterminate`, and rejects both together.
`aria-valuenow`, `aria-valuemin`, and `aria-valuemax` exist only for determinate
progress. A linear `label` is visible, while a circular one is only the accessible
name.

`status` changes color only, so say the outcome in words, for example
`valueLabel="35%, failed"`. The role is not a live region, so announce only
meaningful changes from the consumer. Segmented step progress is a composition of
several `ProgressV2`, and a stepper remains a separate navigation component.

## SkeletonV2

| Prop | Values | Default |
| --- | --- | --- |
| `shape` | `text`, `rectangle`, `circle` | `text` |
| `size` | `sm`, `md` | `sm` |
| `animation` | `none`, `pulse`, `wave` | `none` |
| `width`, `height` | CSS sizes that override the shape | from the shape |

Skeletons are always `aria-hidden`. The parent owns the status: it sets `aria-busy`
and announces loading once. Motion is opt-in, and static is a valid baseline. Card,
list, and table placeholders are compositions, shown in the component host.

## SnackbarV2

| Prop | Values | Default |
| --- | --- | --- |
| `title` | ReactNode | required |
| `description` | ReactNode | none |
| `tone` | `neutral`, `info`, `success`, `warning`, `error` | `neutral` |
| `density` | `compact`, `detailed` | `compact` |
| `action` | ReactNode, a real button | none |
| `onDismiss` | `(reason: 'timeout' \| 'close') => void` | none |
| `dismissible`, `dismissLabel` | close button | `true`, `Dismiss` |
| `duration` | milliseconds, `null` keeps it open | see below |
| `role` | ARIA role | `alert` for error, else `status`, or none inside a stack |

The parent owns the list and removes an item in `onDismiss`, so a snackbar never
removes itself. There is no global store or queue, because Figma leaves that to a
later runtime adapter.

`duration` defaults to 5000 ms. It defaults to `null` for an error or a snackbar
with an action, because a person must have time to read or act. The timer pauses
while the pointer is over the snackbar, while focus is inside it, and while the
page is hidden, and it resumes with the time left.

A snackbar never takes focus when it appears. If it closes while focus is inside
it, focus returns to where it came from.

`SnackbarStackV2` places snackbars at `bottom-center`, the default, or `bottom-end`.
Like the [V2 overlays](overlays-v2.md), it renders in place and rises into the top
layer, so it inherits its `ThemeScope` and needs the same browsers. Declare it
inside the theme scope and render it from the start. It is a polite live region,
and it must exist before the first message for that message to be announced.
Inside it, routine snackbars have no role of their own, so they are not announced
twice, and errors keep `role="alert"`. A `DialogV2` opened later covers it and makes it inert, so
render a stack inside the dialog when a message must appear there. The stack adds
no limit, so show few messages at once, and keep it clear of critical controls on
small screens.

## AvatarV2

| Prop | Values | Default |
| --- | --- | --- |
| `alt` | string, empty when decorative | required |
| `src`, `loading` | image source and loading mode | none |
| `initials` | string | none |
| `size` | `sm` 32 px, `md` 40 px, `lg` 56 px | `sm` |
| `shape` | `circle`, `rounded` | `circle` |
| `statusTone`, `statusLabel` | `neutral`, `success`, `warning`, `error`, and text | none |

Content follows one order: the image once it has loaded, then initials, then the
generic glyph. A failed image falls back on its own, and a new `src` tries again.
The image is cropped with `object-fit: cover`.

A named avatar is `role="img"`. With `alt=""` it is hidden from assistive
technology, unless a status gives it meaning. TypeScript requires `statusLabel`
with `statusTone`, and the label joins the accessible name, so color is not the
only signal.

`AvatarGroupV2` overlaps its avatars, sets their `size`, and turns everything past
`max` into a count. It requires an accessible name. `moreLabel` translates the
count, which reads `2 more` by default. If the group name already lists the people,
give the avatars an empty `alt` to avoid repeating them.

## Roles and tokens

| Part | Roles |
| --- | --- |
| Progress | `actionPrimary`, `success`, `error` on `surfaceContainer` |
| Skeleton | `surfaceContainerHover`, `surfaceContainerPressed` for the wave |
| Snackbar | `surfaceContainer`, `onSurface`, `outline`, and the tone role |
| Avatar | `primaryContainer`, `onPrimaryContainer`, `surfaceContainerHover` |

The groups `progress`, `skeleton`, `snackbar`, and `avatar` live in the V2 geometry.

## Forced colors

In Windows High Contrast, V2 keeps state visible with system colors: the selected
tab, the progress fill, skeletons, snackbar and status marks, and the highlighted
menu item. Surfaces that rely on a background get a border.

## Differences from Figma

- Progress labels use `onSurface`. Figma has fixed colors for a dark canvas, which
  are nearly invisible on a light surface.
- Linear progress has no padding of its own and fills its container. The 280 px and
  12 px of the master are a specimen.
- The ring track and arc share one 31.5 px radius, while the Figma arc sits on a
  30 px radius inside the track.
- The group ring uses the `surface` role instead of the fixed `#161a20`.
- The close button is a 32 px target with the `Close` icon, not a bare `×`.
- The status dot sits on the avatar. Figma places it next to the text, but its
  geometry note mentions dot offsets.
- The fallback glyph is the `User` icon from `forge-icons`, so it follows the theme.
- `SnackbarStackV2` and `AvatarGroupV2` are additions, because a placement prop on
  one snackbar cannot stack, and Figma asks for groups as a composition.

## Verification

Run `npm run check:v2-consumer` to certify these components from packed tarballs
across 13 theme scopes, including real timers, image failures, and the stack in the
top layer. Set `V2_BROWSER` to `firefox` or `webkit` to use another engine, and CI
runs all three. Live region announcements, Safari itself, and physical devices are
not covered and need manual review.
