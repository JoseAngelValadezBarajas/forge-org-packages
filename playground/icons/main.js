import './style.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as icons from '@corefoundry-labs/forge-icons';

const h = React.createElement;
const entries = Object.entries(icons).sort(([a], [b]) => a.localeCompare(b));
const root = createRoot(document.querySelector('#app'));

function Catalog() {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState('');
  const normalized = query.trim().toLowerCase();
  const visible = entries.filter(([name]) => name.toLowerCase().includes(normalized));

  const header = h('header', { className: 'page-header' },
    h('p', { className: 'eyebrow' }, 'COREFOUNDRY / FORGE ICONS'),
    h('h1', null, 'Icon catalog'),
    h('p', { className: 'intro' }, 'Browse the public icons, preview their default rendering, and copy a ready-to-use import.'),
  );
  const search = h('label', { className: 'search' },
    h('span', null, 'Search icons'),
    h('input', { type: 'search', 'aria-label': 'Search icons', placeholder: 'Name, e.g. Search or Chevron', value: query, onChange: (event) => setQuery(event.target.value) }),
  );
  const cards = visible.map(([name, Icon]) => {
    const snippet = `import { ${name} } from '@corefoundry-labs/forge-icons';`;
    return h('article', { key: name, className: 'icon-card', 'data-icon-card': '', 'data-icon-name': name },
      h('div', { className: 'icon-preview' }, h(Icon, { size: 30, 'aria-hidden': true })),
      h('h2', null, name),
      h('code', { className: 'import-code' }, snippet),
      h('button', { type: 'button', 'aria-label': `Copy ${name} import`, onClick: async () => {
        await navigator.clipboard.writeText(snippet);
        setCopied(name);
        setTimeout(() => setCopied((current) => current === name ? '' : current), 1200);
      } }, copied === name ? 'Copied' : 'Copy import'),
    );
  });
  const grid = h('section', { className: 'icon-grid', 'aria-label': 'Available icons' },
    ...(cards.length ? cards : [h('p', { key: 'empty', className: 'empty-state' }, 'No icons match that search.')]),
  );
  const count = h('p', { id: 'result-count', className: 'result-count', 'aria-live': 'polite' }, `${visible.length} ${visible.length === 1 ? 'icon' : 'icons'}`);
  const main = h('main', null, h('div', { className: 'toolbar' }, search, count), grid);
  return h(React.Fragment, null, header, main);
}

root.render(h(Catalog));
