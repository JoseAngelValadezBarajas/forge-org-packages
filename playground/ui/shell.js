import React, { useState } from 'react';
import { presets } from '@corefoundry-labs/forge-tokens/theme-v2';
import { catalog, categories } from './catalog.js';

const h = React.createElement;

function navGroups(query) {
  const term = query.trim().toLowerCase();
  const items = catalog.filter((item) => item.name.toLowerCase().includes(term));
  return [
    ['V2 components', items.filter((item) => item.version !== 'V1')],
    ...categories.map((category) => [
      `V1 · ${category}`,
      items.filter((item) => item.version === 'V1' && item.category === category),
    ]),
  ].filter(([, group]) => group.length > 0);
}

export function Sidebar({ current }) {
  const [query, setQuery] = useState('');
  const groups = navGroups(query);
  return h('aside', { className: 'host-sidebar' },
    h('p', { className: 'eyebrow' }, 'COREFOUNDRY / FORGE UI'),
    h('p', { className: 'host-title' }, 'Component host'),
    h('input', {
      type: 'search',
      className: 'host-search',
      placeholder: 'Find a component',
      'aria-label': 'Find a component',
      value: query,
      onChange: (event) => setQuery(event.target.value),
    }),
    h('nav', { className: 'host-nav', 'aria-label': 'Components' },
      groups.length === 0 && h('p', { className: 'host-empty' }, 'No components found'),
      ...groups.map(([title, items]) => h('section', { key: title },
        h('h2', null, title),
        h('ul', null, ...items.map((item) => h('li', { key: item.name },
          h('a', { href: `#/${item.name}`, 'aria-current': item.name === current ? 'page' : undefined }, item.name),
        ))),
      )),
    ),
  );
}

export function ThemeControls({ preset, mode, primary, onPreset, onMode, onPrimary }) {
  return h('div', { className: 'controls' },
    h('label', null, 'Preset', h('select', { value: preset, onChange: (event) => onPreset(event.target.value), 'aria-label': 'Theme preset' },
      ...Object.keys(presets).map((name) => h('option', { key: name, value: name }, presets[name].name)),
    )),
    h('label', null, 'Mode', h('select', { value: mode, onChange: (event) => onMode(event.target.value), 'aria-label': 'Theme mode' },
      ...['light', 'dark', 'high-contrast'].map((name) => h('option', { key: name, value: name }, name)),
    )),
    h('label', null, 'Primary seed', h('input', { type: 'color', value: primary, onChange: (event) => onPrimary(event.target.value), 'aria-label': 'Primary seed' })),
  );
}
