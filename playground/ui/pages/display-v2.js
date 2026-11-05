import React, { useState } from 'react';
import { AlertV2, BadgeV2, ButtonV2, CardV2, TabsV2 } from '@corefoundry-labs/forge-ui';
import { PresetMatrix, Section } from './button-v2.js';

const h = React.createElement;
const badgeTones = ['neutral', 'primary', 'success', 'warning', 'error', 'info'];
const badgeVariants = ['solid', 'subtle', 'outline'];
const alertTones = ['info', 'success', 'warning', 'error', 'neutral'];
const alertVariants = ['soft', 'solid', 'outline'];
const titleCase = (text) => `${text[0].toUpperCase()}${text.slice(1)}`;

function sampleCard(props) {
  return h(CardV2, {
    header: 'Section title',
    footer: 'Optional content / action →',
    ...props,
  }, 'Content goes here. Use any React children.');
}

function Clicks() {
  const [clicks, setClicks] = useState(0);
  return sampleCard({
    variant: 'interactive',
    onClick: () => setClicks(clicks + 1),
    'data-testid': 'card-button',
    'data-count': clicks,
  });
}

export function CardV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'CardV2' },
    h(Section, { title: 'Styles', note: 'Radius 14 px, padding 20 px, gap 12 px. Static cards have no hover or focus.' },
      h('div', { className: 'control-grid' },
        ...['default', 'outlined', 'elevated'].map((variant) => sampleCard({ key: variant, variant, 'data-testid': `card-${variant}` })),
      ),
    ),
    h(Section, { title: 'Interactive', note: 'The whole surface is a real button or link. Hover it, or use Tab and Enter.' },
      h('div', { className: 'control-grid' },
        h(Clicks),
        sampleCard({ variant: 'interactive', as: 'a', href: '#/CardV2', 'data-testid': 'card-link' }),
        sampleCard({ variant: 'interactive', disabled: true, 'data-testid': 'card-disabled' }),
      ),
    ),
    h(Section, { title: 'Composition', note: 'Slots accept content, not domain models.' },
      h('div', { className: 'control-grid' },
        h(CardV2, { variant: 'outlined', as: 'article', header: h('h3', null, 'Atlas'), footer: h(BadgeV2, { tone: 'success', variant: 'subtle' }, 'Ready') }, 'Header as a heading, with a badge in the footer.'),
        h(CardV2, { header: 'Only a header' }),
        h(CardV2, null, 'Only a body.'),
      ),
    ),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: () => [sampleCard({ key: 'card', variant: 'outlined' })] }),
  );
}

export function BadgeV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'BadgeV2' },
    h(Section, { title: 'Tones and styles', note: 'Static text, never interactive. The word carries the meaning, not the color.' },
      h('div', { className: 'badge-table' },
        h('span'),
        ...badgeVariants.map((variant) => h('span', { className: 'control-title', key: variant }, titleCase(variant))),
        ...badgeTones.flatMap((tone) => [
          h('span', { className: 'control-title', key: tone }, titleCase(tone)),
          ...badgeVariants.map((variant) => h('span', { key: `${tone}-${variant}` },
            h(BadgeV2, { tone, variant, size: 'md', 'data-testid': `badge-${tone}-${variant}` }, titleCase(tone)),
          )),
        ]),
      ),
    ),
    h(Section, { title: 'Sizes', note: 'Height 24 / 30 px, fully rounded, padding 10 px.' },
      h('div', { className: 'badge-row' },
        h(BadgeV2, { tone: 'primary', size: 'sm', 'data-testid': 'badge-sm' }, 'Small'),
        h(BadgeV2, { tone: 'primary', size: 'md', 'data-testid': 'badge-md' }, 'Medium'),
      ),
    ),
    h(Section, { title: 'Composition', note: 'Counts and glyphs are content. A long label truncates inside its container.' },
      h('div', { className: 'badge-row' },
        h(BadgeV2, { tone: 'primary', size: 'md' }, '12 new'),
        h(BadgeV2, { tone: 'success', variant: 'subtle', size: 'md' }, '✓ Completed'),
        h(BadgeV2, { variant: 'outline', size: 'md' }, 'Category · UI'),
        h('span', { className: 'badge-narrow' },
          h(BadgeV2, { tone: 'info', variant: 'subtle', size: 'md', 'data-testid': 'badge-long' }, 'A very long status label'),
        ),
      ),
    ),
    h(PresetMatrix, { className: 'control-matrix-row', cell: () => [
      h(BadgeV2, { key: 'solid', tone: 'primary' }, 'Solid'),
      h(BadgeV2, { key: 'subtle', tone: 'primary', variant: 'subtle' }, 'Subtle'),
      h(BadgeV2, { key: 'success', tone: 'success' }, 'Success'),
      h(BadgeV2, { key: 'warning', tone: 'warning' }, 'Warning'),
    ] }),
  );
}

const panel = (title) => h(React.Fragment, null,
  h('strong', { className: 'tabs-panel-title' }, title),
  h('span', null, 'Content for the selected tab. Consumers control the associated panel and selection state.'),
);
const tabItems = [
  { id: 'overview', label: 'Overview', content: panel('Overview') },
  { id: 'activity', label: 'Activity', content: panel('Activity') },
  { id: 'locked', label: 'Locked', content: panel('Locked'), disabled: true },
  { id: 'settings', label: 'Settings', content: panel('Settings') },
];

function ControlledTabs() {
  const [value, setValue] = useState('activity');
  return h('div', { className: 'control-cell' },
    h(TabsV2, { 'aria-label': 'Controlled', items: tabItems, value, onValueChange: setValue, 'data-testid': 'tabs-controlled' }),
    h('span', { className: 'control-hint', 'data-testid': 'tabs-value' }, `Selected: ${value}`),
  );
}

export function TabsV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'TabsV2' },
    h(Section, { title: 'Styles and sizes', note: 'Use the arrow keys, Home and End. Disabled tabs are skipped.' },
      h('div', { className: 'tabs-grid' },
        h(TabsV2, { 'aria-label': 'Underline md', items: tabItems, 'data-testid': 'tabs-underline-md' }),
        h(TabsV2, { 'aria-label': 'Underline sm', items: tabItems, size: 'sm', 'data-testid': 'tabs-underline-sm' }),
        h(TabsV2, { 'aria-label': 'Pill md', items: tabItems, variant: 'pill', 'data-testid': 'tabs-pill-md' }),
        h(TabsV2, { 'aria-label': 'Pill sm', items: tabItems, variant: 'pill', size: 'sm', 'data-testid': 'tabs-pill-sm' }),
      ),
    ),
    h(Section, { title: 'Selection', note: 'Controlled through value, or manual activation: arrows move focus, and Enter or Space selects.' },
      h('div', { className: 'tabs-grid' },
        h(ControlledTabs),
        h(TabsV2, { 'aria-label': 'Manual', items: tabItems, activation: 'manual', 'data-testid': 'tabs-manual' }),
      ),
    ),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: (scope) => [
      h(TabsV2, { key: 'tabs', 'aria-label': `Tabs ${scope}`, size: 'sm', items: tabItems.slice(0, 2) }),
    ] }),
  );
}

function DismissibleAlert() {
  const [open, setOpen] = useState(true);
  if (!open) return h(ButtonV2, { variant: 'secondary', size: 'sm', onClick: () => setOpen(true), 'data-testid': 'alert-restore' }, 'Show the alert again');
  return h(AlertV2, {
    variant: 'outline',
    title: 'Info notice',
    description: 'The parent decides when this alert leaves.',
    onDismiss: () => setOpen(false),
    'data-testid': 'alert-dismissible',
  });
}

export function AlertV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'AlertV2' },
    h(Section, { title: 'Tones and styles', note: 'Five tones in three styles. Errors use role alert, and the rest use role status.' },
      h('div', { className: 'alert-table' },
        ...alertVariants.map((variant) => h('span', { className: 'control-title', key: variant }, titleCase(variant))),
        ...alertTones.flatMap((tone) => alertVariants.map((variant) => h(AlertV2, {
          key: `${tone}-${variant}`,
          tone,
          variant,
          role: 'note',
          title: `${titleCase(tone)} notice`,
          description: 'Useful information with next steps.',
          'data-testid': `alert-${tone}-${variant}`,
        }))),
      ),
    ),
    h(Section, { title: 'Actions, dismiss and content', note: 'Actions are composed, so the alert has no retry or fetch logic.' },
      h('div', { className: 'control-grid' },
        h(AlertV2, {
          tone: 'error',
          role: 'note',
          title: 'Error notice',
          description: 'Useful information with next steps.',
          actions: h(ButtonV2, { variant: 'secondary', size: 'sm' }, 'Retry'),
        }),
        h(DismissibleAlert),
        h(AlertV2, {
          tone: 'warning',
          role: 'note',
          title: 'Warning notice',
          description: 'A longer description wraps onto several lines and the alert grows with its content, so nothing is cut off.',
        }),
      ),
    ),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: () => [
      h(AlertV2, { key: 'alert', role: 'note', title: 'Info notice', description: 'Useful information with next steps.' }),
    ] }),
  );
}
