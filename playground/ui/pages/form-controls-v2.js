import React, { useState } from 'react';
import { CheckboxV2, SelectV2, SwitchV2, TextInputV2 } from '@corefoundry-labs/forge-ui';
import { PresetMatrix, Section } from './button-v2.js';

const h = React.createElement;
const sizes = [['sm', 'SM · 32px'], ['md', 'MD · 40px'], ['lg', 'LG · 48px']];
const options = [
  h('option', { key: 'empty', value: '' }, 'Choose an option'),
  ...['Option A', 'Option B', 'Option C', 'Option D'].map((option) => h('option', { key: option }, option)),
];

function Cell({ title, children }) {
  return h('div', { className: 'control-cell' }, h('span', { className: 'control-title' }, title), children);
}

function Sizes({ render }) {
  return h(Section, { title: 'Sizes', note: 'Height 32 / 40 / 48 px, radius 10 px, padding 12 px.' },
    h('div', { className: 'control-grid' },
      ...sizes.map(([size, title]) => h(Cell, { key: size, title }, render(size))),
    ),
  );
}

function FieldComposition({ id, label, hint, error, control }) {
  return h(Section, { title: 'Field composition', note: 'The label and messages live outside the control and link to it through htmlFor and aria-describedby.' },
    h('div', { className: 'control-grid' },
      h('div', { className: 'control-cell' },
        h('label', { htmlFor: `${id}-helper` }, label),
        control({ id: `${id}-helper`, 'aria-describedby': `${id}-helper-text` }),
        h('small', { id: `${id}-helper-text`, className: 'control-hint' }, hint),
      ),
      h('div', { className: 'control-cell' },
        h('label', { htmlFor: `${id}-error` }, label),
        control({ id: `${id}-error`, 'aria-invalid': true, 'aria-describedby': `${id}-error-text` }),
        h('small', { id: `${id}-error-text`, className: 'control-error' }, error),
      ),
    ),
  );
}

export function TextInputV2Host() {
  const [value, setValue] = useState('');
  const text = (label, props) => h(TextInputV2, { 'aria-label': label, placeholder: 'Enter a value...', ...props });
  return h('section', { className: 'button-host', 'aria-label': 'TextInputV2' },
    h(Sizes, { render: (size) => text(`Size ${size}`, { size, 'data-testid': `text-${size}` }) }),
    h(Section, { title: 'States', note: 'Hover the fields, or use Tab to see the focus state.' },
      h('div', { className: 'control-grid' },
        h(Cell, { title: 'Default' }, text('Default', { value, onChange: (event) => setValue(event.target.value), 'data-testid': 'text-default' })),
        h(Cell, { title: 'Filled' }, text('Filled', { defaultValue: 'hello@sample.dev', 'data-testid': 'text-filled' })),
        h(Cell, { title: 'Invalid' }, text('Invalid', { 'aria-invalid': true, 'data-testid': 'text-invalid' })),
        h(Cell, { title: 'Disabled' }, text('Disabled', { disabled: true, 'data-testid': 'text-disabled' })),
        h(Cell, { title: 'Read only' }, text('Read only', { readOnly: true, defaultValue: 'Read-only value', 'data-testid': 'text-readonly' })),
      ),
    ),
    h(FieldComposition, { id: 'text', label: 'Email address', hint: 'Only used for account notifications.', error: 'Please enter a valid email address.', control: (props) => h(TextInputV2, { type: 'email', autoComplete: 'email', placeholder: 'hello@sample.dev', ...props }) }),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: (scope) => [
      text(`Value ${scope}`, { key: 'value', size: 'sm', defaultValue: 'hello@sample.dev' }),
      text(`Placeholder ${scope}`, { key: 'placeholder', size: 'sm' }),
      text(`Invalid ${scope}`, { key: 'invalid', size: 'sm', 'aria-invalid': true }),
    ] }),
  );
}

export function SelectV2Host() {
  const [value, setValue] = useState('');
  const select = (label, props) => h(SelectV2, { 'aria-label': label, ...props }, options);
  return h('section', { className: 'button-host', 'aria-label': 'SelectV2' },
    h(Sizes, { render: (size) => select(`Size ${size}`, { size, 'data-testid': `select-${size}` }) }),
    h(Section, { title: 'States', note: 'The options popup belongs to the browser and the operating system, so it varies by platform.' },
      h('div', { className: 'control-grid' },
        h(Cell, { title: 'Closed' }, select('Closed', { value, onChange: (event) => setValue(event.target.value), 'data-testid': 'select-default' })),
        h(Cell, { title: 'Selected' }, select('Selected', { defaultValue: 'Option B', 'data-testid': 'select-filled' })),
        h(Cell, { title: 'Invalid' }, select('Invalid', { 'aria-invalid': true, 'data-testid': 'select-invalid' })),
        h(Cell, { title: 'Disabled' }, select('Disabled', { disabled: true, 'data-testid': 'select-disabled' })),
      ),
    ),
    h(FieldComposition, { id: 'select', label: 'Plan', hint: 'You can change it at any time.', error: 'Please choose an option.', control: (props) => h(SelectV2, props, options) }),
    h(PresetMatrix, { className: 'control-matrix-cell', cell: (scope) => [
      select(`Placeholder ${scope}`, { key: 'placeholder', size: 'sm' }),
      select(`Selected ${scope}`, { key: 'selected', size: 'sm', defaultValue: 'Option B' }),
      select(`Invalid ${scope}`, { key: 'invalid', size: 'sm', 'aria-invalid': true }),
    ] }),
  );
}

function SelectAll() {
  const [items, setItems] = useState({ Design: true, Engineering: false });
  const values = Object.values(items);
  const all = values.every(Boolean);
  return h('div', { className: 'control-cell' },
    h(CheckboxV2, {
      checked: all,
      indeterminate: !all && values.some(Boolean),
      onChange: (event) => setItems(Object.fromEntries(Object.keys(items).map((key) => [key, event.target.checked]))),
      'data-testid': 'checkbox-all',
    }, 'All teams'),
    ...Object.keys(items).map((key) => h(CheckboxV2, {
      key,
      checked: items[key],
      onChange: (event) => setItems({ ...items, [key]: event.target.checked }),
      'data-testid': `checkbox-${key.toLowerCase()}`,
    }, key)),
  );
}

export function CheckboxV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'CheckboxV2' },
    h(Section, { title: 'States', note: 'Each box is 20 px inside a 44 px target. Clicking the label toggles it, and Tab shows the focus ring around the target.' },
      h('div', { className: 'control-grid' },
        h(CheckboxV2, { 'data-testid': 'checkbox-unchecked' }, 'Unchecked'),
        h(CheckboxV2, { defaultChecked: true, 'data-testid': 'checkbox-checked' }, 'Checked'),
        h(CheckboxV2, { indeterminate: true, 'data-testid': 'checkbox-mixed' }, 'Indeterminate'),
        h(CheckboxV2, { 'aria-invalid': true, 'data-testid': 'checkbox-invalid' }, 'Invalid'),
        h(CheckboxV2, { disabled: true, defaultChecked: true, 'data-testid': 'checkbox-disabled' }, 'Disabled checked'),
        h(CheckboxV2, { disabled: true, 'data-testid': 'checkbox-disabled-off' }, 'Disabled'),
      ),
    ),
    h(Section, { title: 'Mixed state', note: 'Indeterminate is a DOM property that the parent derives from its own state.' }, h(SelectAll)),
    h(PresetMatrix, { className: 'control-matrix-row', cell: (scope) => [
      h(CheckboxV2, { key: 'off', 'aria-label': `Unchecked ${scope}` }),
      h(CheckboxV2, { key: 'on', 'aria-label': `Checked ${scope}`, defaultChecked: true }),
      h(CheckboxV2, { key: 'mixed', 'aria-label': `Mixed ${scope}`, indeterminate: true }),
      h(CheckboxV2, { key: 'invalid', 'aria-label': `Invalid ${scope}`, 'aria-invalid': true }),
    ] }),
  );
}

export function SwitchV2Host() {
  return h('section', { className: 'button-host', 'aria-label': 'SwitchV2' },
    h(Section, { title: 'States', note: 'A 44 × 26 px track with an 18 px thumb inside a 44 px target. Space toggles it.' },
      h('div', { className: 'control-grid' },
        h(SwitchV2, { 'data-testid': 'switch-off' }, 'Off'),
        h(SwitchV2, { defaultChecked: true, 'data-testid': 'switch-on' }, 'On'),
        h(SwitchV2, { disabled: true, defaultChecked: true, 'data-testid': 'switch-disabled' }, 'Disabled on'),
        h(SwitchV2, { disabled: true, 'data-testid': 'switch-disabled-off' }, 'Disabled off'),
      ),
    ),
    h(Section, { title: 'Label and hint', note: 'Helper text is composed outside the control.' },
      h('div', { className: 'control-cell' },
        h(SwitchV2, { defaultChecked: true, 'aria-describedby': 'switch-hint' }, 'Notifications'),
        h('small', { id: 'switch-hint', className: 'control-hint' }, 'Sent to your account email.'),
      ),
    ),
    h(PresetMatrix, { className: 'control-matrix-row', cell: (scope) => [
      h(SwitchV2, { key: 'off', 'aria-label': `Off ${scope}` }),
      h(SwitchV2, { key: 'on', 'aria-label': `On ${scope}`, defaultChecked: true }),
    ] }),
  );
}
