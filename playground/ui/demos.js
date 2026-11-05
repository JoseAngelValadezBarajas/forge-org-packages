import React, { useState } from 'react';
import * as UI from '@corefoundry-labs/forge-ui';

const h = React.createElement;
const button = (label, onClick, props = {}) => h(UI.Button, { size: 'small', onClick, ...props }, label);
const row = (...children) => h('div', { className: 'demo-row' }, ...children);
const note = (text) => h('p', { className: 'demo-note', role: 'status' }, text);

// Each card owns its state. No demo writes to storage or contacts a service.
export function Demo({ name, theme }) {
  const [count, setCount] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(false);
  const [items, setItems] = useState(['design']);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const inputProps = { value, onChange: e => setValue(e.target.value) };
  switch (name) {
    case 'Button': return row(button('Add task', () => setCount(count + 1)), button('Reset', () => setCount(0), { variant: 'secondary' }), note(`${count} tasks added`));
    case 'IconButton': return row(h(UI.IconButton, { 'aria-label': 'Favorite', 'aria-pressed': checked, onClick: () => setChecked(!checked) }, checked ? '★' : '☆'), note(checked ? 'Added to favorites' : 'Not favorited'));
    case 'TextInput': return h(UI.TextInput, { ...inputProps, 'aria-label': 'Project name', placeholder: 'Name your next project' });
    case 'Textarea': return h(UI.Textarea, { ...inputProps, 'aria-label': 'Project description', rows: 3, placeholder: 'What are you building?' });
    case 'Checkbox': return row(h('label', { className: 'demo-label' }, h(UI.Checkbox, { checked, onChange: e => setChecked(e.target.checked) }), 'Email updates'), note(checked ? 'Subscribed locally' : 'Updates off'));
    case 'Switch': return row(h('label', { className: 'demo-label' }, h(UI.Switch, { checked, onChange: e => setChecked(e.target.checked) }), 'Notifications'), note(checked ? 'Enabled' : 'Disabled'));
    case 'Radio': return h('fieldset', { className: 'demo-fieldset' }, h('legend', null, 'Workspace plan'), ...['Personal', 'Team'].map(plan => h('label', { key: plan, className: 'demo-label' }, h(UI.Radio, { name: 'demo-plan', checked: (value || 'Personal') === plan, onChange: () => setValue(plan) }), plan)));
    case 'Select': return h(UI.Select, { value: value || 'Development', onChange: e => setValue(e.target.value), 'aria-label': 'Environment' }, ...['Development', 'Staging', 'Production'].map(item => h('option', { key: item }, item)));
    case 'MultiSelect': return h(UI.MultiSelect, { label: 'Teams', presentation: 'checkboxList', value: items, onValuesChange: setItems, options: [{ value: 'design', label: 'Design' }, { value: 'engineering', label: 'Engineering' }] });
    case 'SearchField': return h('div', { className: 'demo-stack' }, h(UI.SearchField, { ...inputProps, 'aria-label': 'Search projects', placeholder: 'Find a project…', clearable: true, onClear: () => setValue('') }), note(['Atlas', 'Orbit', 'Studio'].filter(x => x.toLowerCase().includes(value.toLowerCase())).join(' · ') || 'No matching projects'));
    case 'FilePicker': return h(UI.FilePicker, { title: 'Choose attachment', description: 'Local preview only. No file is uploaded.', state: value ? 'selected' : 'empty', metadata: value || 'No file selected', onChange: e => setValue(e.target.files?.[0]?.name || '') });
    case 'FormField': return h(UI.FormField, { label: 'Workspace', htmlFor: 'demo-workspace', hint: 'Visible to your team.' }, h(UI.TextInput, { id: 'demo-workspace', defaultValue: 'Atlas' }));
    case 'FormActions': return h('div', { className: 'demo-stack' }, h(UI.FormActions, { onSave: () => setMessage('Saved locally'), onCancel: () => setMessage('Changes discarded') }), note(message || 'Try saving or canceling.'));
    case 'Tabs': return h(UI.Tabs, { label: 'Project views', tabs: [{ id: 'demo-overview', label: 'Overview', content: 'Your workspace, at a glance.' }, { id: 'demo-activity', label: 'Activity', content: 'No recent activity. A fresh start.' }] });
    case 'Breadcrumbs': return h(UI.Breadcrumbs, { items: [{ label: 'Library', href: '#catalog' }, { label: 'Components' }, { label: 'Breadcrumbs' }] });
    case 'MenuItem': return h('div', { className: 'demo-stack' }, h('div', { role: 'menu', 'aria-label': 'Project menu' }, h(UI.MenuItem, { selected: checked, onSelect: () => setChecked(!checked) }, checked ? 'Unpin project' : 'Pin project')), note(checked ? 'Project pinned' : 'Project unpinned'));
    case 'StepperStep': return h('div', { className: 'demo-stack' }, h('ol', { className: 'demo-steps' }, ...['Details', 'Review', 'Finish'].map((label, i) => h(UI.StepperStep, { key: label, label, index: i + 1, state: i < count ? 'complete' : i === count ? 'current' : 'upcoming' }))), button(count === 2 ? 'Start again' : 'Next step', () => setCount((count + 1) % 3), { variant: 'secondary' }));
    case 'Card': return h(UI.Card, { variant: 'elevated' }, h('strong', null, 'Atlas workspace'), h('p', { className: 'demo-note' }, 'A home for your next idea.'), h(UI.Badge, { tone: 'accent' }, 'Design system'));
    case 'MetricCard': return h(UI.MetricCard, { label: 'Active projects', value: '24', detail: 'Across 3 workspaces' });
    case 'Badge': return row(h(UI.Badge, { tone: 'accent' }, 'Design system'), h(UI.Badge, { tone: 'neutral' }, '12'), h(UI.Badge, { tone: 'success' }, 'New'));
    case 'StatusChip': return row(h(UI.StatusChip, { tone: 'success' }, 'Ready'), h(UI.StatusChip, { tone: 'warning' }, 'In review'), h(UI.StatusChip, { tone: 'neutral' }, 'Draft'));
    case 'Alert': return h(UI.Alert, { tone: 'info', heading: 'Preview workspace', message: 'Changes in this demo stay on this page.' });
    case 'StatePanel': return h(UI.StatePanel, { kind: checked ? 'empty' : 'readOnly', title: checked ? 'Editing enabled locally' : 'View-only workspace', description: 'Explore without changing a real project.', action: button(checked ? 'View only' : 'Enable editing', () => setChecked(!checked), { variant: 'secondary' }) });
    case 'Progress': return h('div', { className: 'demo-stack' }, h(UI.Progress, { label: 'Demo progress', value: count, max: 100 }), row(button(count === 100 ? 'Reset progress' : 'Advance progress', () => setCount(count === 100 ? 0 : count + 25), { variant: 'secondary' }), note(`${count}% complete`)));
    case 'Tooltip': return row(h(UI.Tooltip, { content: 'Saved on this page only' }, button('Save draft', () => setMessage('Draft saved locally'), { variant: 'secondary' })), note(message || 'Hover or focus for context.'));
    case 'Skeleton': return h(UI.Skeleton, { kind: 'list' });
    case 'Toast': return h('div', { className: 'demo-stack' }, button('Save draft', () => setCount(count + 1), { variant: 'secondary' }), h(UI.Toast, { tone: 'success' }, count ? `Draft saved locally (${count})` : 'Ready to save a draft'));
    case 'EmptyState': return h(UI.EmptyState, { title: checked ? 'Project created' : 'No projects yet', description: checked ? 'Your demo project is ready.' : 'Your next idea starts here.', actions: button(checked ? 'Reset demo' : 'Create project', () => setChecked(!checked)) });
    case 'LoadingState': return h('div', { className: 'demo-stack' }, checked ? h(UI.StatusChip, { tone: 'success' }, 'Projects loaded') : h(UI.LoadingState, { label: 'Loading projects' }), button(checked ? 'Restart loading' : 'Finish loading', () => setChecked(!checked), { variant: 'secondary' }));
    case 'ErrorState': return checked ? h('div', { className: 'demo-stack' }, h(UI.Alert, { tone: 'success', message: 'Projects loaded locally.' }), button('Reset error', () => setChecked(false), { variant: 'secondary' })) : h(UI.ErrorState, { title: 'Could not load projects', description: 'Try the local recovery action.', actions: button('Retry', () => setChecked(true), { variant: 'secondary' }) });
    case 'FeedbackStateV2': return h(UI.ThemeScope, { theme }, h(UI.FeedbackStateV2, { state: checked ? 'readOnly' : 'empty', title: checked ? 'Demo project created' : 'No projects yet', description: 'Scoped semantic colors follow the theme controls.', headingLevel: 3, actions: button(checked ? 'Reset demo' : 'Create project', () => setChecked(!checked)) }));
    case 'RecordRow': return h('table', { className: 'demo-table' }, h('caption', null, 'Projects'), h('tbody', null, h(UI.RecordRow, { title: 'Atlas', metadata: 'Updated just now', status: h(UI.StatusChip, { tone: 'success' }, 'Ready') })));
    case 'KeyValueRow': return h('dl', { className: 'demo-stack' }, h(UI.KeyValueRow, { label: 'Environment', value: 'Development' }), h(UI.KeyValueRow, { label: 'Region', value: 'US West', muted: true }));
    case 'TableRow': return h('table', { className: 'demo-table' }, h('caption', null, 'Project status'), h('thead', null, h(UI.TableRow, { header: true, cells: ['Project', 'Status'] })), h('tbody', null, h(UI.TableRow, { cells: ['Atlas', 'Ready'] }), h(UI.TableRow, { warning: true, cells: ['Orbit', 'Review'] })));
    case 'Table': return h(UI.Table, { caption: 'Projects', columns: [{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }], rows: [{ name: 'Atlas', status: 'Ready' }, { name: 'Orbit', status: 'Draft' }] });
    case 'Dialog': return h(React.Fragment, null, button('Open dialog', () => setOpen(true)), h(UI.Dialog, { open, onClose: () => setOpen(false), onCancel: () => setOpen(false), title: 'Review draft', description: 'This action only updates the demo.', actions: row(button('Cancel', () => setOpen(false), { variant: 'secondary' }), button('Confirm', () => { setOpen(false); setMessage('Draft confirmed locally'); })) }), note(message || 'Open to try focus and Escape.'));
    case 'Popover': return h(UI.Popover, { trigger: 'Workspace details' }, h('p', null, 'Atlas · Development'), h('p', { className: 'demo-note' }, 'Three projects. One shared workspace.'));
    case 'SectionHeader': return h(UI.SectionHeader, { eyebrow: 'Workspace', title: 'Recent projects', counter: 3, headingLevel: 3 });
    case 'Divider': return h('div', { className: 'demo-stack' }, h('span', null, 'Project details'), h(UI.Divider), h('span', { className: 'demo-note' }, 'Team settings'));
    case 'CodeLabel': return row(h(UI.CodeLabel, null, 'project/atlas'), h(UI.CodeLabel, null, 'v1.0.2'));
    case 'ThemeScope': return h(UI.ThemeScope, { theme, className: 'scope-demo' }, h('span', { className: 'scope-swatch', 'aria-hidden': true }), h(UI.FeedbackStateV2, { state: 'readOnly', title: 'A theme of its own', description: 'Change the theme controls to explore this boundary.', headingLevel: 3 }));
    default: throw new Error(`Missing demo: ${name}`);
  }
}

export function SystemThemeDemo() {
  const mode = UI.useSystemTheme();
  return h('p', null, 'Your system preference: ', h('strong', null, mode), '. This utility reads the operating system; it does not change the gallery.');
}
