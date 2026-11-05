import './style.css';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, EmptyState, ErrorState, LoadingState, StatePanel, FeedbackStateV2 } from '@corefoundry-labs/forge-ui';
import { applyTheme, createTheme, presets } from '@corefoundry-labs/forge-tokens/theme-v2';

const h = React.createElement;

function Examples({ version }) {
  const retry = h(Button, { size: 'small', variant: 'secondary' }, 'Retry');
  const create = h(Button, { size: 'small' }, 'Create project');
  const examples = version === 'v2'
    ? [
        h(FeedbackStateV2, { state: 'loading', title: 'Loading projects', description: 'Your projects will appear here in a moment.' }),
        h(FeedbackStateV2, { state: 'empty', title: 'No projects yet', description: 'Create a project to start organizing work.', actions: create }),
        h(FeedbackStateV2, { state: 'error', title: 'Could not load projects', description: 'Check your connection and try again.', actions: retry }),
        h(FeedbackStateV2, { state: 'readOnly', title: 'Projects are read only', description: 'You can review these projects, but your role cannot edit them.' }),
      ]
    : [
        h(LoadingState, { label: 'Loading projects' }),
        h(EmptyState, { title: 'No projects yet', description: 'Create a project to start organizing work.', actions: create }),
        h(ErrorState, { title: 'Could not load projects', description: 'Check your connection and try again.', actions: retry }),
        h(StatePanel, { kind: 'readOnly', title: 'Projects are read only', description: 'You can review these projects, but your role cannot edit them.' }),
      ];
  return h('section', { className: `version version--${version}`, 'aria-label': `${version.toUpperCase()} examples` },
    h('h2', null, version === 'v2' ? 'FeedbackStateV2' : 'Existing V1 components'),
    ...examples.map((example, index) => h('div', { className: 'example', key: index },
      h('p', { className: 'eyebrow' }, ['Loading', 'Empty', 'Error', 'Read only'][index]),
      example,
    )),
  );
}

function App() {
  const [preset, setPreset] = useState('forge');
  const [mode, setMode] = useState(presets.forge.mode);
  const [primary, setPrimary] = useState(presets.forge.colors.primary);
  const preview = useRef(null);

  useEffect(() => {
    const selected = presets[preset];
    applyTheme(preview.current, createTheme({ ...selected, mode, colors: { ...selected.colors, primary } }));
  }, [preset, mode, primary]);

  function choosePreset(event) {
    const next = event.target.value;
    setPreset(next);
    setMode(presets[next].mode);
    setPrimary(presets[next].colors.primary);
  }

  return h('main', null,
    h('header', null,
      h('p', { className: 'eyebrow' }, 'COREFOUNDRY / FORGE UI'),
      h('h1', null, 'Feedback components'),
      h('p', { className: 'intro' }, 'Compare the existing V1 components with FeedbackStateV2. Theme controls apply V2 semantic tokens to the preview.'),
    ),
    h('div', { className: 'controls' },
      h('label', null, 'Preset', h('select', { value: preset, onChange: choosePreset, 'aria-label': 'Theme preset' },
        ...Object.keys(presets).map((name) => h('option', { key: name, value: name }, presets[name].name)),
      )),
      h('label', null, 'Mode', h('select', { value: mode, onChange: (event) => setMode(event.target.value), 'aria-label': 'Theme mode' },
        ...['light', 'dark', 'high-contrast'].map((name) => h('option', { key: name, value: name }, name)),
      )),
      h('label', null, 'Primary seed', h('input', { type: 'color', value: primary, onChange: (event) => setPrimary(event.target.value), 'aria-label': 'Primary seed' })),
    ),
    h('div', { className: 'theme-preview', ref: preview },
      h('p', { className: 'preview-note' }, 'V1 components and buttons use Forge tokens. FeedbackStateV2 uses the scoped dynamic theme.'),
      h('div', { className: 'comparison' }, h(Examples, { version: 'v1' }), h(Examples, { version: 'v2' })),
    ),
  );
}

createRoot(document.querySelector('#app')).render(h(App));
