import React, { useState } from 'react';
import { ButtonV2, ThemeScope } from '@corefoundry-labs/forge-ui';
import { ArrowRight, Plus, Search, Trash } from '@corefoundry-labs/forge-icons';
import { createTheme, presets } from '@corefoundry-labs/forge-tokens/theme-v2';

const h = React.createElement;
const variants = ['primary', 'secondary', 'ghost', 'danger'];
const sizes = ['sm', 'md', 'lg'];
const modes = ['light', 'dark', 'high-contrast'];

function Section({ title, note, children }) {
  return h('section', { className: 'button-section', 'aria-label': title },
    h('h3', null, title),
    note && h('p', { className: 'button-note' }, note),
    children,
  );
}

function VariantsAndSizes() {
  return h(Section, { title: 'Variants and sizes', note: 'Height 32 / 40 / 48 px, radius 10 px.' },
    h('div', { className: 'button-table', role: 'presentation' },
      ...variants.map((variant) => h('div', { className: 'button-row', key: variant },
        h('span', { className: 'button-row-label' }, variant),
        ...sizes.map((size) => h(ButtonV2, { key: size, variant, size, 'data-testid': `${variant}-${size}` }, 'Continue')),
      )),
    ),
  );
}

function LoadingDemo({ variant }) {
  const [loading, setLoading] = useState(false);
  const [saves, setSaves] = useState(0);
  const save = () => {
    setLoading(true);
    setSaves((count) => count + 1);
    setTimeout(() => setLoading(false), 1500);
  };
  return h(ButtonV2, { variant, size: 'sm', loading, onClick: save, 'data-testid': `${variant}-try`, 'data-saves': saves }, 'Save');
}

function InteractionStates() {
  const columns = ['Default', 'Disabled', 'Loading', 'Try it'];
  return h(Section, { title: 'Interaction states', note: 'Hover and press any enabled button, or use Tab to see the focus ring. "Try it" runs a real 1.5 s save.' },
    h('div', { className: 'button-table', role: 'presentation' },
      h('div', { className: 'button-row button-row--head' },
        h('span', { className: 'button-row-label' }, 'State'),
        ...columns.map((column) => h('span', { className: 'button-col', key: column }, column)),
      ),
      ...variants.map((variant) => h('div', { className: 'button-row', key: variant },
        h('span', { className: 'button-row-label' }, variant),
        h('span', { className: 'button-col' }, h(ButtonV2, { variant, size: 'sm', 'data-testid': `${variant}-default` }, 'Continue')),
        h('span', { className: 'button-col' }, h(ButtonV2, { variant, size: 'sm', disabled: true, 'data-testid': `${variant}-disabled` }, 'Continue')),
        h('span', { className: 'button-col' }, h(ButtonV2, { variant, size: 'sm', loading: true, 'data-testid': `${variant}-loading` }, 'Continue')),
        h('span', { className: 'button-col' }, h(LoadingDemo, { variant })),
      )),
    ),
  );
}

function IconCompositions() {
  return h(Section, { title: 'Icon compositions', note: 'Icons come from forge-icons and inherit the foreground role of each variant.' },
    h('div', { className: 'button-icons' },
      h(ButtonV2, { iconStart: h(Plus) }, 'Add item'),
      h(ButtonV2, { variant: 'secondary', iconEnd: h(ArrowRight) }, 'Continue'),
      h(ButtonV2, { variant: 'danger', iconStart: h(Trash) }, 'Delete'),
      h(ButtonV2, { variant: 'ghost', 'aria-label': 'Search', iconStart: h(Search), 'data-testid': 'icon-only' }),
    ),
  );
}

function PresetMatrix() {
  return h(Section, { title: 'Theme Engine presets', note: 'Four presets in three modes, each inside its own ThemeScope. These cells ignore the controls above.' },
    h('div', { className: 'button-matrix-scroll' },
      h('div', { className: 'button-matrix' },
        h('span'),
        ...modes.map((mode) => h('span', { className: 'button-matrix-head', key: mode }, mode)),
        ...Object.entries(presets).flatMap(([key, preset]) => [
          h('span', { className: 'button-matrix-head', key }, preset.name),
          ...modes.map((mode) => h(ThemeScope, {
            key: `${key}-${mode}`,
            theme: createTheme({ ...preset, mode }),
            className: 'button-matrix-cell',
            'data-testid': `matrix-${key}-${mode}`,
          }, ...variants.map((variant) => h(ButtonV2, { key: variant, variant, size: 'sm' }, 'Continue')))),
        ]),
      ),
    ),
  );
}

export function ButtonV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'ButtonV2' },
    h(VariantsAndSizes),
    h(InteractionStates),
    h(IconCompositions),
    h(PresetMatrix),
  );
}
