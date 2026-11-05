# V2 overlays

`DialogV2`, `TooltipV2`, `PopoverV2`, and `DropdownMenuV2` live in
`packages/ui/src/componentsV2/overlays`. They are independent V2 components: the
V1 `Dialog`, `Popover`, and `Tooltip` keep their API and appearance, and an
application can use both. The design source is the
[CoreFoundry Design System V2 file](https://www.figma.com/design/0PqOZvgaNysCVq6CVKilAN).
The Theme Engine V2 is the source of truth for color.

All four inherit the font family of the consuming application and have no domain
logic. Heights shown on the Figma masters are specimens, so these components size
to their content.

## How overlays render

Overlays do not use a portal. Each one renders where it is declared and rises
into the browser top layer, with `dialog.showModal()` for `DialogV2` and
`popover="manual"` for the other three. This has three consequences:

- An overlay inherits the `--cf-v2-*` tokens of its `ThemeScope`, so a dialog
  inside a scoped theme uses that theme.
- No `overflow`, `z-index`, or `transform` on an ancestor can clip or cover it, so
  no z-index token exists.
- Tab order follows the document, and an overlay nested in another stays in its
  DOM subtree.

`popover="manual"` is used instead of `auto` so the `open` prop stays in charge in
controlled use. The components implement outside press and Escape themselves.

Browser support follows the Popover API: Chrome and Edge 114, Safari 17, and
Firefox 125. An older browser still shows the overlay with fixed positioning, but
an ancestor can then clip or cover it.

Escape closes one layer at a time. A tooltip closes before the popover beneath it,
and a popover before its dialog. A consumer handler that calls `preventDefault()`
on the keydown keeps every layer open.

Placement is collision-aware. An overlay flips to the opposite side when its side
has no room and the other has more, and shifts to keep a 16 px viewport margin.
`left` and `right` are physical sides, while `align` `start` and `end` mirror in
right-to-left documents.

## DialogV2

| Prop | Values | Default |
| --- | --- | --- |
| `open`, `onOpenChange` | controlled state | required |
| `title` | ReactNode, rendered as an `h2` | required |
| `description` | ReactNode, linked with `aria-describedby` | none |
| `children`, `footer` | ReactNode slots | none |
| `size` | `sm` 350 px, `md` 445 px, `lg` 560 px | `sm` |
| `closeOnEscape` | boolean | `true` |
| `initialFocusRef` | ref to the element to focus on open | first focusable |

The dialog is modal: the page behind it is inert, Tab wraps inside it, page scroll
is locked with the scrollbar gutter preserved, and focus returns to the opener
when it closes or unmounts. `open` is the only source of truth, so Escape and the
native cancel request only call `onOpenChange(false)`.

TypeScript requires a `footer` with `closeOnEscape={false}`, so a dialog always
has a way out. Footer actions are composed, usually from `ButtonV2`, and hold no
business logic. Put the safe action first: initial focus lands on it, so Enter
does not confirm a destructive action. Clicking the backdrop does not close a
dialog, because Figma defines no such behavior and a stray click must not discard
work.

A long body scrolls while the title and footer stay in place, and becomes
keyboard reachable only when it overflows. Actions wrap on narrow screens and
reach a 44 px target on coarse pointers.

## TooltipV2

| Prop | Values | Default |
| --- | --- | --- |
| `content` | string | required |
| `children` | one element that forwards its ref and props | required |
| `placement` | `top`, `bottom`, `left`, `right` | `top` |
| `delay` | milliseconds before it appears | `300` |

`content` is a string, so TypeScript rejects interactive children. Links, fields,
and actions belong in `PopoverV2`. The tooltip is linked with `aria-describedby`,
which keeps the trigger's accessible name and any description it already has.

It opens on hover and on keyboard focus, and a pointer can move onto it without
closing it. Escape closes it and leaves focus on the trigger, and pressing the
trigger also closes it. Touch never opens a tooltip, so the information must not
be essential. Give icon-only triggers an `aria-label`, because a tooltip is a
description and not a name.

A disabled native button fires no pointer events. Wrap it in a focusable element
or explain the state in visible text.

## PopoverV2

| Prop | Values | Default |
| --- | --- | --- |
| `trigger` | one element that forwards its ref and props | required without `anchorRef` |
| `anchorRef`, `open`, `onOpenChange` | external anchor, controlled | required without `trigger` |
| `open`, `defaultOpen`, `onOpenChange` | with `trigger`, optional | closed |
| `title` or `aria-label` or `aria-labelledby` | accessible name | required |
| `description`, `children` | ReactNode | none |
| `width` | `compact` 250 px, `regular` 312 px | `compact` |
| `placement` | `top`, `bottom`, `left`, `right` | `bottom` |
| `align` | `start`, `center`, `end` | `start` |
| `role` | an ARIA role that matches the content | `dialog` |
| `initialFocus` | `content`, `none` | `content` |

A popover is nonmodal: it has no focus trap, no `aria-modal`, and no scroll lock.
Escape, an outside press, and moving focus out of it all close it. Focus returns
to where it was unless the user already moved it somewhere else.

With the default role, the trigger gets `aria-haspopup="dialog"` and
`aria-expanded`. With another role, such as `group`, it behaves as a disclosure and
gets `aria-expanded` and `aria-controls`. Use `initialFocus="none"` when the
content is read-only and focus should stay on the trigger.

## DropdownMenuV2

| Prop | Values | Default |
| --- | --- | --- |
| `trigger` | one element that forwards its ref and props | required |
| `items` | actions and separators, see below | required |
| `density` | `compact` 232 px, `comfortable` 264 px | `compact` |
| `placement` | `top`, `bottom`, `left`, `right` | `bottom` |
| `align` | `start`, `center`, `end` | `start` |
| `open`, `defaultOpen`, `onOpenChange` | optional control | closed |
| `aria-label`, `aria-labelledby` | menu name | the trigger |

An action is `{ id, label, icon?, disabled?, destructive?, onSelect? }` and a
separator is `{ type: 'separator', id }`. `label` is a string because typeahead
searches it. `destructive` only changes the color to the `error` role. The icon
column is reserved as soon as one item has an icon, so labels stay aligned.

| Key | Action |
| --- | --- |
| ArrowDown, ArrowUp on the trigger | open at the first or last item |
| Enter, Space on the trigger | open at the first item |
| ArrowDown, ArrowUp | move through enabled items, wrapping |
| Home, End | first and last enabled item |
| Letters | typeahead over enabled labels |
| Enter, Space | activate the item, close, return to the trigger |
| Escape | close and return to the trigger |
| Tab | close and continue from the trigger |

Hover highlights an item with `surfaceContainerHover`. The focus ring appears only
for keyboard use. Focus returns to the trigger before `onSelect` runs, so an action
can open a `DialogV2` and focus comes back to the trigger when it closes.

`menuitemcheckbox` and `menuitemradio`, submenus, and links are not included. This
is an action menu, not primary navigation.

## Roles and tokens

| Part | Roles |
| --- | --- |
| Surfaces | `surfaceContainer`, `onSurface`, `outline` |
| Keyboard focus | `focusRing` |
| Highlighted item | `surfaceContainerHover` |
| Destructive item | `error` |

The groups `overlay`, `dialog`, `tooltip`, `popover`, and `menu` live in the V2
geometry. The dialog backdrop is `--cf-v2-dialog-backdrop`, based on the Figma
`#171b22` sample with an alpha of 0.72. Figma shows a solid sample, so that alpha
is a proposal.

The engine requires `error` and `onSurface` to reach 4.5:1 on
`surfaceContainerHover`, and `focusRing` to reach 3:1 on `surfaceContainer` and
`surfaceContainerHover`.

## Differences from Figma

- Tooltip width is a 215 px maximum instead of a fixed width, so a short label does
  not sit in a wide box.
- The tooltip pointer touches the surface and has an `outline` stroke. In Figma it
  floats between tooltip and target, and a `surfaceContainer` fill alone is nearly
  invisible on the surface.
- Tooltip offset is 14 px on all four sides. Figma specimens show 14 px around the
  pointer vertically and 8 px horizontally.
- Footer actions are `ButtonV2`, so they use its geometry instead of the 105 x 36 px
  sample, and `Cancel` uses the `secondary` variant.
- The `◇` menu glyph is a placeholder, so `icon` is optional content.

## Verification

Run `npm run check:v2-consumer` to certify the four components from packed
tarballs across 13 theme scopes in Chromium. It checks real focus, Escape order,
collision, clipping, and the menu to dialog flow, and runs axe on open overlays.
Screen readers, other browsers, and physical Android devices are not covered and
need manual review.
