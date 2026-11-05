import React, { useRef, useState } from 'react';
import {
  AvatarGroupV2,
  AvatarV2,
  ButtonV2,
  ProgressV2,
  SkeletonV2,
  SnackbarStackV2,
  SnackbarV2,
} from '@corefoundry-labs/forge-ui';
import { PresetMatrix, Section } from './button-v2.js';

const h = React.createElement;
const tones = ['neutral', 'info', 'success', 'warning', 'error'];
const titleCase = (text) => `${text[0].toUpperCase()}${text.slice(1)}`;

function Segmented() {
  return h('div', { className: 'segmented' },
    h('div', { className: 'segmented-track', 'data-testid': 'progress-segments' },
      ...[1, 2, 3, 4, 5].map((step) => h(ProgressV2, { key: step, 'aria-label': `Step ${step}`, value: step <= 3 ? 100 : 0, valueLabel: null })),
    ),
    h('span', { className: 'control-hint' }, 'Step 3 of 5. Stepper remains a separate navigation component.'),
  );
}

export function ProgressV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'ProgressV2' },
    h(Section, { title: 'Shapes', note: 'Linear 8 px and circular 70 px. Motion stops with reduced motion.' },
      h('div', { className: 'status-grid' },
        h(ProgressV2, { label: 'Processing', value: 68, 'data-testid': 'progress-linear' }),
        h(ProgressV2, { label: 'Processing', indeterminate: true, 'data-testid': 'progress-linear-indeterminate' }),
        h(ProgressV2, { shape: 'circular', label: 'Processing', value: 68, 'data-testid': 'progress-circular' }),
        h(ProgressV2, { shape: 'circular', label: 'Processing', indeterminate: true, 'data-testid': 'progress-circular-indeterminate' }),
      ),
    ),
    h(Section, { title: 'Value and status', note: 'Say the outcome in words, because color alone does not convey it.' },
      h('div', { className: 'status-grid' },
        h(ProgressV2, { label: 'Started', value: 12 }),
        h(ProgressV2, { label: 'In progress', value: 68 }),
        h(ProgressV2, { label: 'Completed', value: 100, status: 'success', 'data-testid': 'progress-success' }),
        h(ProgressV2, { label: 'Failed', value: 35, status: 'error', valueLabel: '35%, failed', 'data-testid': 'progress-error' }),
      ),
    ),
    h(Section, { title: 'Composition', note: 'Segmented progress is a composition, not another variant.' }, h(Segmented)),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: () => [h(ProgressV2, { key: 'progress', label: 'Processing', value: 68 })] }),
  );
}

const line = (size, width) => h(SkeletonV2, { size, width });

function ListRows({ animation }) {
  return h('div', { className: 'skeleton-rows' },
    ...[0, 1, 2].map((row) => h('div', { className: 'skeleton-row', key: row },
      h(SkeletonV2, { shape: 'circle', animation }),
      h('div', { className: 'skeleton-lines' }, h(SkeletonV2, { size: 'md', animation }), h(SkeletonV2, { animation })),
    )),
  );
}

export function SkeletonV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'SkeletonV2' },
    h(Section, { title: 'Shapes', note: 'Three shapes in two sizes, hidden from assistive technology.' },
      h('div', { className: 'status-grid' },
        ...['text', 'rectangle', 'circle'].flatMap((shape) => ['sm', 'md'].map((size) => h(SkeletonV2, { key: `${shape}-${size}`, shape, size, 'data-testid': `skeleton-${shape}-${size}` }))),
      ),
    ),
    h(Section, { title: 'Compositions', note: 'The parent owns the status: it announces loading once and sets aria-busy.' },
      h('div', { className: 'status-grid', 'aria-busy': 'true', role: 'status', 'aria-label': 'Loading content' },
        h('div', { className: 'skeleton-card' }, h(SkeletonV2, { shape: 'rectangle', size: 'md' }), h(SkeletonV2, { size: 'md' }), h(SkeletonV2)),
        h(ListRows),
        h('div', { className: 'skeleton-rows' },
          ...[0, 1, 2, 3].map((row) => h('div', { className: 'skeleton-row', key: row }, line('sm', '34%'), line('sm', '27%'), line('sm', '27%'))),
        ),
      ),
    ),
    h(Section, { title: 'Motion', note: 'Optional, and it stops with reduced motion.' },
      h('div', { className: 'status-grid' },
        ...['none', 'pulse', 'wave'].map((animation) => h(SkeletonV2, { key: animation, size: 'md', animation, 'data-testid': `skeleton-${animation}` })),
      ),
    ),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: () => [
      h('div', { className: 'skeleton-row', key: 'row' }, h(SkeletonV2, { shape: 'circle' }), h('div', { className: 'skeleton-lines' }, h(SkeletonV2, { width: 120 }), h(SkeletonV2, { width: 80 }))),
    ] }),
  );
}

function Notifier() {
  const next = useRef(0);
  const [items, setItems] = useState([]);
  const [placement, setPlacement] = useState('bottom-center');
  const add = (tone, extra = {}) => {
    next.current += 1;
    setItems((current) => [...current, { id: next.current, tone, title: `${titleCase(tone)} ${next.current}`, ...extra }]);
  };
  const remove = (id) => setItems((current) => current.filter((item) => item.id !== id));
  return h(React.Fragment, null,
    h('div', { className: 'overlay-row' },
      h(ButtonV2, { variant: 'secondary', onClick: () => add('success', { duration: 4000 }), 'data-testid': 'snackbar-add' }, 'Show snackbar'),
      h(ButtonV2, { variant: 'secondary', onClick: () => add('error'), 'data-testid': 'snackbar-add-error' }, 'Show error, stays'),
      h(ButtonV2, {
        variant: 'secondary',
        onClick: () => setPlacement(placement === 'bottom-center' ? 'bottom-end' : 'bottom-center'),
        'data-testid': 'snackbar-placement',
      }, `Placement: ${placement}`),
    ),
    h(SnackbarStackV2, { placement, 'data-testid': 'snackbar-stack' },
      ...items.map(({ id, ...item }) => h(SnackbarV2, { key: id, ...item, onDismiss: () => remove(id) })),
    ),
  );
}

export function SnackbarV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'SnackbarV2' },
    h(Section, { title: 'Tones and density', note: 'Five tones in two densities. These specimens are static, so they use role note and no timer.' },
      h('div', { className: 'overlay-row' },
        ...tones.flatMap((tone) => [
          h(SnackbarV2, { key: `${tone}-c`, tone, role: 'note', duration: null, title: 'Notification', onDismiss: () => {}, 'data-testid': `snackbar-${tone}-compact` }),
          h(SnackbarV2, { key: `${tone}-d`, tone, role: 'note', duration: null, density: 'detailed', title: 'Notification', description: 'Additional context for this update.', onDismiss: () => {}, 'data-testid': `snackbar-${tone}-detailed` }),
        ]),
      ),
    ),
    h(Section, { title: 'Stack and lifecycle', note: 'Hover or focus a snackbar to pause it. Errors and snackbars with an action stay until dismissed.' },
      h(Notifier),
    ),
    h(Section, { title: 'With action', note: 'The action is a real button, composed by the consumer.' },
      h(SnackbarV2, { tone: 'success', role: 'note', title: 'Changes saved', action: h(ButtonV2, { variant: 'ghost', size: 'sm' }, 'Undo'), onDismiss: () => {} }),
    ),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: () => [
      h(SnackbarV2, { key: 'snackbar', tone: 'success', role: 'note', duration: null, title: 'Changes saved', onDismiss: () => {} }),
    ] }),
  );
}

const portrait = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" fill="#dfe3e8"/><circle cx="28" cy="22" r="10" fill="#b9c2cc"/><path d="M8 56c2-16 12-22 20-22s18 6 20 22z" fill="#8c98a6"/></svg>')}`;

export function AvatarV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'AvatarV2' },
    h(Section, { title: 'Sizes and content', note: 'Image, then initials, then the generic glyph. A failed image falls back on its own.' },
      ...['sm', 'md', 'lg'].map((size) => h('div', { className: 'avatar-row', key: size },
        h(AvatarV2, { size, alt: 'Initials', initials: 'CF', 'data-testid': `avatar-${size}-initials` }),
        h(AvatarV2, { size, alt: 'Image', src: portrait, initials: 'CF', 'data-testid': `avatar-${size}-image` }),
        h(AvatarV2, { size, alt: 'Fallback', 'data-testid': `avatar-${size}-fallback` }),
        h(AvatarV2, { size, alt: 'Broken image', src: 'data:image/png;base64,AAAA', initials: 'CF', 'data-testid': `avatar-${size}-broken` }),
      )),
    ),
    h(Section, { title: 'Status and shape', note: 'A status always has a label, so color is not the only signal.' },
      h('div', { className: 'avatar-row' },
        ...[['success', 'Available'], ['warning', 'Away'], ['error', 'Busy'], ['neutral', 'Offline']].map(([tone, label]) => h(AvatarV2, { key: tone, size: 'lg', alt: 'Ada', initials: 'AL', statusTone: tone, statusLabel: label, 'data-testid': `avatar-status-${tone}` })),
        h(AvatarV2, { size: 'lg', shape: 'rounded', alt: 'Rounded', initials: 'CF', 'data-testid': 'avatar-rounded' }),
      ),
    ),
    h(Section, { title: 'Group', note: 'The overlap and the count are a composition. Name the group, and the count reads as a phrase.' },
      h('div', { className: 'avatar-row' },
        ...['sm', 'md', 'lg'].map((size) => h(AvatarGroupV2, { key: size, 'aria-label': `Team ${size}`, size, max: 4, 'data-testid': `avatar-group-${size}` },
          h(AvatarV2, { alt: 'Ada', src: portrait }),
          h(AvatarV2, { alt: 'Core Foundry', initials: 'CF' }),
          h(AvatarV2, { alt: 'Unknown' }),
          h(AvatarV2, { alt: 'Grace', src: portrait }),
          h(AvatarV2, { alt: 'Linus', initials: 'LT' }),
          h(AvatarV2, { alt: 'Margaret', initials: 'MH' }),
          h(AvatarV2, { alt: 'Alan', initials: 'AT' }),
        )),
      ),
    ),
    h(PresetMatrix, { className: 'control-matrix-row', cell: () => [
      h(AvatarV2, { key: 'initials', size: 'md', alt: 'Initials', initials: 'CF' }),
      h(AvatarV2, { key: 'image', size: 'md', alt: 'Image', src: portrait }),
      h(AvatarV2, { key: 'fallback', size: 'md', alt: 'Fallback' }),
    ] }),
  );
}
