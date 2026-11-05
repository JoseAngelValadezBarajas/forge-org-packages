import React from 'react';
import { Button, EmptyState, ErrorState, FeedbackStateV2, LoadingState, StatePanel } from '@corefoundry-labs/forge-ui';

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

export function FeedbackComparison() {
  return h(React.Fragment, null,
    h('p', { className: 'preview-note' }, 'V1 components and buttons use Forge tokens. FeedbackStateV2 uses the scoped dynamic theme.'),
    h('div', { className: 'comparison' }, h(Examples, { version: 'v1' }), h(Examples, { version: 'v2' })),
  );
}
