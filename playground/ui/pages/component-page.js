import React from 'react';
import { Demo } from '../demos.js';
import { ButtonV2Host } from './button-v2.js';
import { FeedbackComparison } from './feedback-comparison.js';
import { AlertV2Host, BadgeV2Host, CardV2Host, TabsV2Host } from './display-v2.js';
import { CheckboxV2Host, SelectV2Host, SwitchV2Host, TextInputV2Host } from './form-controls-v2.js';

const h = React.createElement;
const customPages = {
  AlertV2: AlertV2Host,
  BadgeV2: BadgeV2Host,
  ButtonV2: ButtonV2Host,
  CardV2: CardV2Host,
  CheckboxV2: CheckboxV2Host,
  FeedbackStateV2: FeedbackComparison,
  SelectV2: SelectV2Host,
  SwitchV2: SwitchV2Host,
  TabsV2: TabsV2Host,
  TextInputV2: TextInputV2Host,
};

export function ComponentPage({ page, theme, preview, controls }) {
  const Custom = customPages[page.name];
  const content = Custom ? h(Custom) : h(Demo, { name: page.name, theme });
  return h('article', { className: 'component-page' },
    h('header', { className: 'component-header' },
      h('p', { className: 'eyebrow' }, `${page.category} · ${page.version}`),
      h('h1', null, page.name),
      h('p', { className: 'intro' }, page.description),
    ),
    controls,
    page.version === 'V1'
      ? h('div', { className: 'v1-stage' }, content)
      : h('div', { className: 'theme-preview', ref: preview }, content),
    h('section', { className: 'component-code', 'aria-label': 'Example code' },
      h('h2', null, 'Example'),
      h('pre', null, h('code', null, page.code)),
    ),
  );
}
