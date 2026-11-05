import React, { useRef, useState } from 'react';
import { Copy, Edit, MoreVertical, Trash, Archive, ChevronDown } from '@corefoundry-labs/forge-icons';
import { ButtonV2, CheckboxV2, DialogV2, DropdownMenuV2, PopoverV2, TooltipV2 } from '@corefoundry-labs/forge-ui';
import { PresetMatrix, Section } from './button-v2.js';

const h = React.createElement;
const description = 'Review the details before continuing.';

function DialogDemo({ id, label, buttonVariant = 'secondary', footer, ...props }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return h(React.Fragment, null,
    h(ButtonV2, { variant: buttonVariant, onClick: () => setOpen(true), 'data-testid': `${id}-open` }, label),
    h(DialogV2, {
      open,
      onOpenChange: setOpen,
      title: 'Confirm action',
      description,
      'data-testid': id,
      footer: footer ? footer(close) : h(React.Fragment, null,
        h(ButtonV2, { variant: 'secondary', size: 'sm', onClick: close }, 'Cancel'),
        h(ButtonV2, { size: 'sm', onClick: close }, 'Continue'),
      ),
      ...props,
    }),
  );
}

const terms = Array.from({ length: 12 }, (_, index) => h('p', { key: index }, `Clause ${index + 1}. The body scrolls while the title and the actions stay in place.`));

export function DialogV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'DialogV2' },
    h(Section, { title: 'Sizes', note: 'Max width 350 / 445 / 560 px, bounded by a 16 px gutter on small screens.' },
      h('div', { className: 'overlay-row' },
        h(DialogDemo, { id: 'dialog-sm', label: 'Small', size: 'sm' }),
        h(DialogDemo, { id: 'dialog-md', label: 'Medium', size: 'md' }),
        h(DialogDemo, { id: 'dialog-lg', label: 'Large', size: 'lg' }),
      ),
    ),
    h(Section, { title: 'Composition', note: 'Actions are composed. Focus is contained, Escape closes, and focus returns to the opener.' },
      h('div', { className: 'overlay-row' },
        h(DialogDemo, {
          id: 'dialog-destructive',
          label: 'Destructive',
          buttonVariant: 'danger',
          footer: (close) => h(React.Fragment, null,
            h(ButtonV2, { variant: 'secondary', size: 'sm', onClick: close }, 'Cancel'),
            h(ButtonV2, { variant: 'danger', size: 'sm', onClick: close }, 'Delete'),
          ),
        }),
        h(DialogDemo, { id: 'dialog-scroll', label: 'Scrollable body', size: 'md' }, h('div', { className: 'overlay-terms' }, terms)),
        h(DialogDemo, { id: 'dialog-locked', label: 'Escape disabled', closeOnEscape: false }),
      ),
    ),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: (scope) => [
      h(DialogDemo, { key: 'dialog', id: `dialog-${scope}`, label: 'Open dialog' }),
    ] }),
  );
}

export function TooltipV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'TooltipV2' },
    h(Section, { title: 'Placements', note: 'Hover or focus each target. The tooltip flips and shifts near the viewport edge.' },
      h('div', { className: 'overlay-placements' },
        ...['top', 'bottom', 'left', 'right'].map((placement) => h(TooltipV2, { key: placement, content: 'Additional information', placement, 'data-testid': `tooltip-${placement}` },
          h(ButtonV2, { variant: 'secondary', 'data-testid': `tooltip-${placement}-trigger` }, placement),
        )),
      ),
    ),
    h(Section, { title: 'Content', note: 'Short plain text only. It supplements a visible label and never hides essential instructions.' },
      h('div', { className: 'overlay-row' },
        h(TooltipV2, { content: 'Copy the link', 'data-testid': 'tooltip-icon' },
          h(ButtonV2, { variant: 'ghost', 'aria-label': 'Copy', iconStart: h(Copy), 'data-testid': 'tooltip-icon-trigger' }),
        ),
        h(TooltipV2, { content: 'Long text wraps onto several lines and is never clipped by the tooltip surface.', 'data-testid': 'tooltip-long' },
          h(ButtonV2, { variant: 'secondary', 'data-testid': 'tooltip-long-trigger' }, 'Long text'),
        ),
        h('div', { className: 'overlay-clip' },
          h(TooltipV2, { content: 'Not clipped by this box', 'data-testid': 'tooltip-clip' },
            h(ButtonV2, { variant: 'secondary', 'data-testid': 'tooltip-clip-trigger' }, 'overflow hidden'),
          ),
        ),
      ),
    ),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: () => [
      h(TooltipV2, { key: 'tooltip', content: 'Additional information' }, h(ButtonV2, { variant: 'secondary', size: 'sm' }, 'Hover me')),
    ] }),
  );
}

function Preferences() {
  return h('div', { className: 'overlay-option' },
    h(CheckboxV2, { defaultChecked: true }, 'Show descriptions'),
    h('p', { className: 'overlay-note' }, 'Additional controls can be supplied as content.'),
  );
}

const moreOptions = (id) => h(ButtonV2, { variant: 'secondary', iconEnd: h(ChevronDown), 'data-testid': `${id}-trigger` }, 'More options');

function AnchoredPopover() {
  const anchor = useRef(null);
  const [open, setOpen] = useState(false);
  return h(React.Fragment, null,
    h('span', { ref: anchor, className: 'control-hint' }, 'External anchor'),
    h(ButtonV2, { variant: 'secondary', onClick: () => setOpen(true), 'data-testid': 'popover-anchored-open' }, 'Open from elsewhere'),
    h(PopoverV2, { anchorRef: anchor, open, onOpenChange: setOpen, 'aria-label': 'Anchored details', description: 'Controlled through open and anchorRef.', 'data-testid': 'popover-anchored' }),
  );
}

export function PopoverV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'PopoverV2' },
    h(Section, { title: 'Widths', note: 'Compact 250 px and regular 312 px. Height follows the content.' },
      h('div', { className: 'overlay-row' },
        h(PopoverV2, { trigger: moreOptions('popover-compact'), title: 'Preferences', description: 'Choose how information is presented.', 'data-testid': 'popover-compact' }, h(Preferences)),
        h(PopoverV2, { trigger: moreOptions('popover-regular'), title: 'Preferences', description: 'Choose how information is presented.', width: 'regular', 'data-testid': 'popover-regular' }, h(Preferences)),
      ),
    ),
    h(Section, { title: 'Placement and control', note: 'Escape, an outside press, or leaving with focus closes it. It is nonmodal, so the page stays usable.' },
      h('div', { className: 'overlay-placements' },
        ...['top', 'bottom', 'left', 'right'].map((placement) => h(PopoverV2, {
          key: placement,
          trigger: h(ButtonV2, { variant: 'secondary', 'data-testid': `popover-${placement}-trigger` }, placement),
          title: 'Preferences',
          description: 'Choose how information is presented.',
          placement,
          align: 'center',
          'data-testid': `popover-${placement}`,
        })),
      ),
      h('div', { className: 'overlay-row' }, h(AnchoredPopover)),
    ),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: (scope) => [
      h(PopoverV2, { key: 'popover', trigger: h(ButtonV2, { variant: 'secondary', size: 'sm' }, 'More options'), title: `Preferences ${scope}`, description: 'Choose how information is presented.' }),
    ] }),
  );
}

const menuItems = (onSelect = () => {}) => [
  { id: 'edit', label: 'Edit', icon: h(Edit), onSelect: () => onSelect('Edit') },
  { id: 'duplicate', label: 'Duplicate', icon: h(Copy), onSelect: () => onSelect('Duplicate') },
  { type: 'separator', id: 'split' },
  { id: 'archive', label: 'Archive unavailable', icon: h(Archive), disabled: true },
  { id: 'delete', label: 'Delete', icon: h(Trash), destructive: true, onSelect: () => onSelect('Delete') },
];

const moreActions = (id) => h(ButtonV2, { variant: 'secondary', iconEnd: h(MoreVertical), 'data-testid': `${id}-trigger` }, 'More actions');

function MenuWithResult() {
  const [last, setLast] = useState('None');
  return h('div', { className: 'control-cell' },
    h(DropdownMenuV2, { trigger: moreActions('menu-compact'), items: menuItems(setLast), 'data-testid': 'menu-compact' }),
    h('span', { className: 'control-hint', 'data-testid': 'menu-result' }, `Last action: ${last}`),
  );
}

function MenuToDialog() {
  const [open, setOpen] = useState(false);
  return h(React.Fragment, null,
    h(DropdownMenuV2, {
      trigger: moreActions('menu-dialog'),
      items: [{ id: 'delete', label: 'Delete', icon: h(Trash), destructive: true, onSelect: () => setOpen(true) }],
      'data-testid': 'menu-dialog',
    }),
    h(DialogV2, {
      open,
      onOpenChange: setOpen,
      title: 'Delete this item?',
      description: 'The menu closes and focus returns to its trigger after this dialog.',
      'data-testid': 'menu-dialog-confirm',
      footer: h(React.Fragment, null,
        h(ButtonV2, { variant: 'secondary', size: 'sm', onClick: () => setOpen(false) }, 'Cancel'),
        h(ButtonV2, { variant: 'danger', size: 'sm', onClick: () => setOpen(false) }, 'Delete'),
      ),
    }),
  );
}

export function DropdownMenuV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'DropdownMenuV2' },
    h(Section, { title: 'Density', note: 'Arrow keys, Home, End and typeahead move through enabled items. Enter or Space activates, and Escape closes.' },
      h('div', { className: 'overlay-row' },
        h(MenuWithResult),
        h(DropdownMenuV2, { trigger: moreActions('menu-comfortable'), items: menuItems(), density: 'comfortable', 'data-testid': 'menu-comfortable' }),
      ),
    ),
    h(Section, { title: 'Composition', note: 'A menu action can open a dialog. Actions are callbacks, so the menu holds no business logic.' },
      h('div', { className: 'overlay-row' }, h(MenuToDialog)),
    ),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: () => [
      h(DropdownMenuV2, { key: 'menu', trigger: h(ButtonV2, { variant: 'secondary', size: 'sm' }, 'More actions'), items: menuItems() }),
    ] }),
  );
}
