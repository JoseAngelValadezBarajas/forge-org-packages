import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const evidenceDirectory = join(root, 'docs', 'evidence', 'v2-consumer');
const packages = ['@corefoundry-labs/forge-tokens', '@corefoundry-labs/forge-icons', '@corefoundry-labs/forge-ui'];
const presets = ['forge', 'formiai', 'autofund', 'neutral'];
const modes = ['light', 'dark', 'high-contrast'];
const variants = ['primary', 'secondary', 'ghost', 'danger'];
const sizes = { sm: '32px', md: '40px', lg: '48px' };
const axeVersion = '4.10.3';
const fills = {
  primary: { rest: 'actionPrimary', hover: 'actionPrimaryHover', pressed: 'actionPrimaryPressed', on: 'onActionPrimary' },
  secondary: { rest: 'surfaceContainer', hover: 'surfaceContainerHover', pressed: 'surfaceContainerPressed', on: 'onSurface' },
  ghost: { rest: null, hover: 'surfaceContainerHover', pressed: 'surfaceContainerPressed', on: 'onSurface' },
  danger: { rest: 'error', hover: 'errorHover', pressed: 'errorPressed', on: 'onError' },
};

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', shell: command === 'npm' && process.platform === 'win32' });
  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed:\n${result.stdout}${result.stderr}`);
  return result.stdout;
}

const rgb = (hex) => `rgb(${[1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)).join(', ')})`;
const luminance = (color) => {
  const [red, green, blue] = color.match(/[\d.]+/g).slice(0, 3).map((channel) => {
    const value = Number(channel) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};
const contrast = (first, second) => {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};
const blend = (foreground, background, alpha) => {
  const channels = (color) => color.match(/[\d.]+/g).slice(0, 3).map(Number);
  const [front, back] = [channels(foreground), channels(background)];
  return `rgb(${front.map((channel, index) => channel * alpha + back[index] * (1 - alpha)).join(', ')})`;
};

function packArchives(directory) {
  const archives = {};
  const contents = {};
  for (const name of packages) {
    const [packed] = JSON.parse(run('npm', ['pack', `--workspace=${name}`, '--json', `--pack-destination=${directory}`], root));
    assert.equal(packed.name, name);
    archives[name] = join(directory, packed.filename);
    contents[name] = { version: packed.version, files: packed.files.map((file) => file.path) };
  }
  const versions = new Set(Object.values(contents).map((entry) => entry.version));
  assert.equal(versions.size, 1, 'the three packages must share one release version');
  for (const file of ['dist/theme-v2/tokens.css', 'dist/theme-v2/tokens.css.d.ts', 'dist/theme-v2/index.js']) {
    assert.ok(contents['@corefoundry-labs/forge-tokens'].files.includes(file), `tokens tarball is missing ${file}`);
  }
  const components = [['actions', 'ButtonV2'], ...['TextInputV2', 'SelectV2', 'CheckboxV2', 'SwitchV2'].map((name) => ['forms', name]), ['surfaces', 'CardV2'], ['status', 'BadgeV2'], ['navigation', 'TabsV2'], ['feedback', 'AlertV2']];
  for (const [group, name] of components) {
    for (const extension of ['js', 'd.ts', 'module.css']) {
      const file = `dist/componentsV2/${group}/${name}/${name}.${extension}`;
      assert.ok(contents['@corefoundry-labs/forge-ui'].files.includes(file), `ui tarball is missing ${file}`);
    }
  }
  return { archives, version: [...versions][0] };
}

async function installConsumer(directory, archives, version) {
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')).packages;
  const pinned = (name) => lock[`node_modules/${name}`].version;
  const dependencies = Object.fromEntries(Object.entries(archives).map(([name, archive]) => [
    name,
    `file:${relative(directory, archive).replaceAll('\\', '/')}`,
  ]));
  await mkdir(join(directory, 'src'), { recursive: true });
  await writeFile(join(directory, 'package.json'), `${JSON.stringify({
    name: 'corefoundry-v2-external-consumer',
    private: true,
    type: 'module',
    dependencies: { ...dependencies, react: pinned('react'), 'react-dom': pinned('react-dom') },
    devDependencies: {
      '@types/react': pinned('@types/react'),
      '@types/react-dom': pinned('@types/react-dom'),
      '@vitejs/plugin-react': pinned('@vitejs/plugin-react'),
      'axe-core': axeVersion,
      typescript: pinned('typescript'),
      vite: pinned('vite'),
    },
  }, null, 2)}\n`);
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', '--install-links=true', '--registry=https://registry.npmjs.org'], directory);

  for (const name of packages) {
    const installed = join(directory, 'node_modules', ...name.split('/'));
    assert.equal(lstatSync(installed).isSymbolicLink(), false, `${name} is a link`);
    const real = realpathSync(installed);
    assert.ok(real.startsWith(realpathSync(directory)), `${name} resolves outside the consumer`);
    assert.ok(!real.startsWith(`${root}${sep}`), `${name} resolves into the monorepo`);
    assert.equal(JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8')).version, version);
  }
}

async function writeConsumer(directory) {
  await writeFile(join(directory, 'vite.config.js'), "import react from '@vitejs/plugin-react';\nexport default { plugins: [react()] };\n");
  await writeFile(join(directory, 'index.html'), '<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>V2 consumer</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n');
  await writeFile(join(directory, 'tsconfig.json'), `${JSON.stringify({
    compilerOptions: {
      target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true,
      skipLibCheck: false, noEmit: true, types: [], allowArbitraryExtensions: true, ignoreDeprecations: '6.0',
    },
    include: ['src/main.tsx'],
  }, null, 2)}\n`);
  await writeFile(join(directory, 'tsconfig.negative.json'), `${JSON.stringify({
    extends: './tsconfig.json',
    include: ['src/negative.tsx'],
  }, null, 2)}\n`);
  await writeFile(join(directory, 'src', 'negative.tsx'), `import { AlertV2, BadgeV2, ButtonV2, CardV2, CheckboxV2, DialogV2, DropdownMenuV2, PopoverV2, SelectV2, SwitchV2, TabsV2, TextInputV2, TooltipV2 } from '@corefoundry-labs/forge-ui';
export const missingName = <ButtonV2 iconStart={<svg />} />;
export const unnamedCheckbox = <CheckboxV2 />;
export const unnamedSwitch = <SwitchV2 />;
export const nativeInputSize = <TextInputV2 size={20} />;
export const multipleSelect = <SelectV2 multiple />;
export const clickableStaticCard = <CardV2 onClick={() => undefined}>Body</CardV2>;
export const buttonWithoutInteractive = <CardV2 as="button">Body</CardV2>;
export const emptyAlert = <AlertV2 />;
export const unnamedTabs = <TabsV2 items={[]} />;
export const unknownBadgeTone = <BadgeV2 tone="danger">Label</BadgeV2>;
export const disabledStaticCard = <CardV2 disabled>Body</CardV2>;
export const linkedStaticCard = <CardV2 href="#card">Body</CardV2>;
export const untitledDialog = <DialogV2 open onOpenChange={() => undefined} />;
export const inescapableDialog = <DialogV2 open onOpenChange={() => undefined} title="Stuck" closeOnEscape={false} />;
export const interactiveTooltip = <TooltipV2 content={<button />}><button /></TooltipV2>;
export const unnamedPopover = <PopoverV2 trigger={<button />} />;
export const unanchoredPopover = <PopoverV2 title="Floating" />;
export const unlabeledMenuItem = <DropdownMenuV2 trigger={<button />} items={[{ id: 'edit' }]} />;
export const menuWithoutTrigger = <DropdownMenuV2 items={[]} />;
`);
  await writeFile(join(directory, 'src', 'main.tsx'), `import { useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertV2, BadgeV2, Button, ButtonV2, CardV2, CheckboxV2, DialogV2, DropdownMenuV2, FeedbackStateV2, PopoverV2, SelectV2, SwitchV2, TabsV2, TextInputV2, ThemeScope, TooltipV2, type DialogV2Props, type DialogV2Size, type DropdownMenuV2Density, type DropdownMenuV2Item, type DropdownMenuV2Props, type PopoverV2Props, type PopoverV2Width, type TooltipV2Placement, type TooltipV2Props, type AlertV2Props, type AlertV2Tone, type AlertV2Variant, type BadgeV2Props, type BadgeV2Tone, type BadgeV2Variant, type CardV2Props, type TabsV2Item, type TabsV2Props, type ButtonV2Props, type ButtonV2Size, type ButtonV2Variant, type CheckboxV2Props, type SelectV2Props, type SwitchV2Props, type TextInputV2Props } from '@corefoundry-labs/forge-ui';
import { Search } from '@corefoundry-labs/forge-icons';
import { createTheme, presets, type ThemeMode } from '@corefoundry-labs/forge-tokens/theme-v2';

const variants: ButtonV2Variant[] = ['primary', 'secondary', 'ghost', 'danger'];
const sizes: ButtonV2Size[] = ['sm', 'md', 'lg'];
const modes: ThemeMode[] = ['light', 'dark', 'high-contrast'];
const props: ButtonV2Props = { variant: 'primary', children: 'Typed' };

function Counter({ id, ...rest }: { id: string; variant: ButtonV2Variant; children: ReactNode; disabled?: boolean; loading?: boolean }) {
  const [count, setCount] = useState(0);
  return <ButtonV2 {...rest} data-testid={id} data-count={count} onClick={() => setCount(count + 1)} />;
}

const textProps: TextInputV2Props = { size: 'md', type: 'email', autoComplete: 'email' };
const selectProps: SelectV2Props = { size: 'md', name: 'plan' };
const checkboxProps: CheckboxV2Props = { children: 'Typed', indeterminate: false };
const switchProps: SwitchV2Props = { 'aria-label': 'Typed switch' };
const options = <><option value="">Choose an option</option><option value="a">Option A</option><option value="b">Option B</option></>;

function Controls({ id }: { id: string }) {
  const [text, setText] = useState('');
  const [plan, setPlan] = useState('');
  return <div style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
    <label htmlFor={id + '-text'}>Email</label>
    <TextInputV2 {...textProps} id={id + '-text'} data-testid={id + '-text'} placeholder="Enter a value..." value={text} onChange={(event) => setText(event.target.value)} />
    <TextInputV2 aria-label="Invalid email" aria-invalid aria-describedby={id + '-error'} data-testid={id + '-text-invalid'} />
    <small id={id + '-error'} style={{ color: 'var(--cf-v2-error)' }}>Enter a valid email address.</small>
    <TextInputV2 aria-label="Disabled email" disabled data-testid={id + '-text-disabled'} />
    <TextInputV2 aria-label="Read-only email" readOnly defaultValue="Read-only value" data-testid={id + '-text-readonly'} />
    <SelectV2 {...selectProps} aria-label="Plan" data-testid={id + '-select'} value={plan} onChange={(event) => setPlan(event.target.value)}>{options}</SelectV2>
    <SelectV2 aria-label="Selected plan" defaultValue="b" data-testid={id + '-select-filled'}>{options}</SelectV2>
    <SelectV2 aria-label="Invalid plan" aria-invalid data-testid={id + '-select-invalid'}>{options}</SelectV2>
    <SelectV2 aria-label="Disabled plan" disabled data-testid={id + '-select-disabled'}>{options}</SelectV2>
    <CheckboxV2 data-testid={id + '-checkbox'}>Accept terms</CheckboxV2>
    <CheckboxV2 defaultChecked data-testid={id + '-checkbox-checked'}>Checked option</CheckboxV2>
    <CheckboxV2 indeterminate data-testid={id + '-checkbox-mixed'}>Mixed option</CheckboxV2>
    <CheckboxV2 aria-invalid data-testid={id + '-checkbox-invalid'}>Invalid option</CheckboxV2>
    <CheckboxV2 aria-invalid defaultChecked data-testid={id + '-checkbox-invalid-checked'}>Invalid checked option</CheckboxV2>
    <CheckboxV2 disabled defaultChecked data-testid={id + '-checkbox-disabled'}>Disabled option</CheckboxV2>
    <SwitchV2 data-testid={id + '-switch'}>Alerts</SwitchV2>
    <SwitchV2 defaultChecked data-testid={id + '-switch-on'}>Sync</SwitchV2>
    <SwitchV2 disabled defaultChecked data-testid={id + '-switch-disabled'}>Locked</SwitchV2>
  </div>;
}

const badgeTones: BadgeV2Tone[] = ['neutral', 'primary', 'success', 'warning', 'error', 'info'];
const badgeVariants: BadgeV2Variant[] = ['solid', 'subtle', 'outline'];
const alertTones: AlertV2Tone[] = ['info', 'success', 'warning', 'error', 'neutral'];
const alertVariants: AlertV2Variant[] = ['soft', 'solid', 'outline'];
const cardProps: CardV2Props = { variant: 'outlined', header: 'Typed card' };
const badgeProps: BadgeV2Props = { tone: 'info', children: 'Typed badge' };
const alertProps: AlertV2Props = { tone: 'info', role: 'note', title: 'Typed alert' };
const tabItems: TabsV2Item[] = [
  { id: 'one', label: 'One', content: 'Panel one' },
  { id: 'two', label: 'Two', content: 'Panel two', disabled: true },
  { id: 'three', label: 'Three', content: 'Panel three' },
  { id: 'four', label: 'Four', content: 'Panel four' },
];
const tabsProps: TabsV2Props = { 'aria-label': 'Typed tabs', items: tabItems, size: 'sm' };

function Display({ id }: { id: string }) {
  const [clicks, setClicks] = useState(0);
  const [open, setOpen] = useState(true);
  return <div style={{ display: 'grid', gap: 8, maxWidth: 660 }}>
    {(['default', 'outlined', 'elevated'] as const).map((variant) => <CardV2 key={variant} variant={variant} header="Title" footer="Footer" data-testid={id + '-card-' + variant}>Body</CardV2>)}
    <CardV2 variant="interactive" header="Open" footer="Footer" data-testid={id + '-card-button'} data-count={clicks} onClick={() => setClicks(clicks + 1)}>Body</CardV2>
    <CardV2 variant="interactive" header="Locked" disabled data-testid={id + '-card-disabled'} data-count={clicks} onClick={() => setClicks(clicks + 1)}>Body</CardV2>
    <CardV2 variant="interactive" as="a" href="#card" header="Link" data-testid={id + '-card-link'}>Body</CardV2>
    {badgeTones.flatMap((tone) => badgeVariants.map((variant) => <BadgeV2 key={tone + variant} tone={tone} variant={variant} data-testid={id + '-badge-' + tone + '-' + variant}>{tone}</BadgeV2>))}
    <TabsV2 aria-label={id + ' tabs'} items={tabItems} data-testid={id + '-tabs'} />
    <TabsV2 aria-label={id + ' pill tabs'} items={tabItems} variant="pill" size="sm" data-testid={id + '-tabs-pill'} />
    <TabsV2 aria-label={id + ' manual tabs'} items={tabItems} activation="manual" data-testid={id + '-tabs-manual'} />
    {alertTones.flatMap((tone) => alertVariants.map((variant) => <AlertV2 key={tone + variant} tone={tone} variant={variant} title="Notice" description="Useful information." data-testid={id + '-alert-' + tone + '-' + variant} />))}
    {open && <AlertV2 tone="warning" variant="solid" title="Dismissible" onDismiss={() => setOpen(false)} data-testid={id + '-alert-dismiss'} />}
  </div>;
}

const placements: TooltipV2Placement[] = ['top', 'bottom', 'left', 'right'];
const dialogSizes: DialogV2Size[] = ['sm', 'md', 'lg'];
const widths: PopoverV2Width[] = ['compact', 'regular'];
const densities: DropdownMenuV2Density[] = ['compact', 'comfortable'];

function ModalDemo({ id, label, ...props }: { id: string; label: string } & Partial<DialogV2Props>) {
  const [open, setOpen] = useState(false);
  const rest = props as DialogV2Props;
  return <>
    <ButtonV2 variant="secondary" size="sm" data-testid={id + '-open'} onClick={() => setOpen(true)}>{label}</ButtonV2>
    <DialogV2 {...rest} title={'Dialog ' + id} open={open} onOpenChange={setOpen} data-testid={id} />
  </>;
}

function Overlays({ id }: { id: string }) {
  const [selected, setSelected] = useState('none');
  const [confirm, setConfirm] = useState(false);
  const [anchored, setAnchored] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const items: DropdownMenuV2Item[] = [
    { id: 'edit', label: 'Edit', onSelect: () => setSelected('edit') },
    { id: 'duplicate', label: 'Duplicate', onSelect: () => setSelected('duplicate') },
    { type: 'separator', id: 'split' },
    { id: 'archive', label: 'Archive unavailable', disabled: true, onSelect: () => setSelected('archive') },
    { id: 'delete', label: 'Delete', destructive: true, onSelect: () => setSelected('delete') },
  ];
  const actions = <>
    <ButtonV2 variant="secondary" size="sm" data-testid={id + '-cancel'}>Cancel</ButtonV2>
    <ButtonV2 size="sm" data-testid={id + '-continue'}>Continue</ButtonV2>
  </>;
  return <div data-testid={id + '-overlays'} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
    <ModalDemo id={id + '-dialog'} label="Dialog" size="md" description="Review the details." footer={actions}>Body</ModalDemo>
    <ModalDemo id={id + '-dialog-plain'} label="Plain" />
    <ModalDemo id={id + '-dialog-locked'} label="Locked" closeOnEscape={false} footer={<ButtonV2 size="sm" data-testid={id + '-locked-ok'}>Ok</ButtonV2>} />
    <ModalDemo id={id + '-dialog-scroll'} label="Scroll" footer={<ButtonV2 size="sm">Done</ButtonV2>}><div style={{ height: 3000 }}>Long</div></ModalDemo>
    <ModalDemo id={id + '-dialog-nested'} label="Nested">
      <PopoverV2 trigger={<ButtonV2 size="sm" data-testid={id + '-nested-trigger'}>Nested popover</ButtonV2>} title="Inner" data-testid={id + '-nested'} />
    </ModalDemo>
    <div style={{ overflow: 'hidden', height: 34, display: 'flex', gap: 8, alignItems: 'center' }} data-testid={id + '-clip'}>
      {placements.map((placement) => <TooltipV2 key={placement} content={'Tip ' + placement} placement={placement} delay={0} data-testid={id + '-tip-' + placement}>
        <ButtonV2 variant="secondary" size="sm" data-testid={id + '-tip-' + placement + '-trigger'}>{placement}</ButtonV2>
      </TooltipV2>)}
      <PopoverV2 trigger={<ButtonV2 variant="secondary" size="sm" data-testid={id + '-popover-trigger'}>Popover</ButtonV2>} title={'Popover ' + id} description="Choose how it looks." data-testid={id + '-popover'}>
        <TextInputV2 aria-label={'Popover field ' + id} data-testid={id + '-popover-field'} />
      </PopoverV2>
      <DropdownMenuV2 trigger={<ButtonV2 variant="secondary" size="sm" data-testid={id + '-menu-trigger'}>Menu</ButtonV2>} items={items} data-testid={id + '-menu'} />
    </div>
    <span data-testid={id + '-menu-result'}>{selected}</span>
    <ButtonV2 ref={anchor} variant="secondary" size="sm" data-testid={id + '-anchored-open'} onClick={() => setAnchored(true)}>Anchored</ButtonV2>
    <PopoverV2 anchorRef={anchor} open={anchored} onOpenChange={setAnchored} aria-label={'Anchored ' + id} data-testid={id + '-anchored'} />
    <DialogV2 open={confirm} onOpenChange={setConfirm} title={'Flow ' + id} data-testid={id + '-flow-dialog'} />
    <DropdownMenuV2 trigger={<ButtonV2 variant="secondary" size="sm" data-testid={id + '-flow-trigger'}>Flow</ButtonV2>} items={[{ id: 'confirm', label: 'Confirm', onSelect: () => setConfirm(true) }]} data-testid={id + '-flow'} />
  </div>;
}

function Scope({ id }: { id: string }) {
  return <>
    {variants.map((variant) => <Counter key={variant} id={id + '-' + variant} variant={variant}>{variant + ' action'}</Counter>)}
    {variants.map((variant) => <Counter key={variant} id={id + '-' + variant + '-disabled'} variant={variant} disabled>{variant + ' disabled'}</Counter>)}
    {variants.map((variant) => <Counter key={variant} id={id + '-' + variant + '-loading'} variant={variant} loading>{variant + ' loading'}</Counter>)}
    <FeedbackStateV2 data-testid={id + '-loading-state'} state="loading" title="Loading" headingLevel={2} />
    <FeedbackStateV2 data-testid={id + '-empty-state'} state="empty" title={id + ' empty'} description="Nothing here yet." headingLevel={2} />
    <FeedbackStateV2 data-testid={id + '-error-state'} state="error" title={id + ' error'} description="It failed." headingLevel={2} />
    <FeedbackStateV2 data-testid={id + '-readonly-state'} state="readOnly" title={id + ' read only'} description="View only." headingLevel={2} />
    <Controls id={id} />
    <Display id={id} />
    <Overlays id={id} />
  </>;
}

const tooltipProps: TooltipV2Props = { content: 'Typed', children: <ButtonV2 size="sm" data-testid="typed-tooltip-trigger">Tooltip</ButtonV2>, delay: 0, 'data-testid': 'typed-tooltip' } as TooltipV2Props;
const popoverProps = { title: 'Typed' } satisfies Partial<PopoverV2Props>;
const menuProps = { items: [{ id: 'one', label: 'One' }] } satisfies Partial<DropdownMenuV2Props>;

function App() {
  return <main>
    <h1>External consumer</h1>
    <Button data-testid="v1-button">V1 action</Button>
    <ButtonV2 {...props} data-testid="typed" />
    {sizes.map((size) => <ButtonV2 key={size} size={size} data-testid={'size-' + size}>Size</ButtonV2>)}
    {sizes.map((size) => <ButtonV2 key={size} size={size} variant="ghost" aria-label={'Search ' + size} iconStart={<Search />} data-testid={'icon-' + size} />)}
    {sizes.map((size) => <TextInputV2 key={size} size={size} aria-label={'Text ' + size} data-testid={'text-' + size} />)}
    {sizes.map((size) => <SelectV2 key={size} size={size} aria-label={'Select ' + size} data-testid={'select-' + size}>{options}</SelectV2>)}
    <section aria-label="default" data-testid="default" style={{ background: 'var(--cf-v2-surface)', color: 'var(--cf-v2-on-surface)', padding: 16 }}>
      <CheckboxV2 {...checkboxProps} data-testid="typed-checkbox" />
      <SwitchV2 {...switchProps} data-testid="typed-switch" />
      <CardV2 {...cardProps} data-testid="typed-card" />
      <BadgeV2 {...badgeProps} data-testid="typed-badge" />
      <AlertV2 {...alertProps} data-testid="typed-alert" />
      <TabsV2 {...tabsProps} data-testid="typed-tabs" />
      <BadgeV2 size="sm" data-testid="badge-sm">Small</BadgeV2>
      <BadgeV2 size="md" data-testid="badge-md">Medium</BadgeV2>
      <span style={{ display: 'inline-flex', width: 80 }}><BadgeV2 data-testid="badge-long">A very long status label that truncates</BadgeV2></span>
      <div data-testid="typed-overlays">
      {dialogSizes.map((size) => <ModalDemo key={size} id={'size-dialog-' + size} label={'Dialog ' + size} size={size} />)}
      <TooltipV2 {...tooltipProps} />
      {widths.map((width) => <PopoverV2 key={width} {...popoverProps} width={width} trigger={<ButtonV2 size="sm" data-testid={'width-' + width + '-trigger'}>{width}</ButtonV2>} data-testid={'width-' + width} />)}
      {densities.map((density) => <DropdownMenuV2 key={density} {...menuProps} density={density} trigger={<ButtonV2 size="sm" data-testid={'density-' + density + '-trigger'}>{density}</ButtonV2>} data-testid={'density-' + density} />)}
      </div>
      <Scope id="default" />
    </section>
    {Object.entries(presets).flatMap(([key, preset]) => modes.map((mode) => (
      <ThemeScope key={key + mode} theme={createTheme({ ...preset, mode })} data-testid={key + '-' + mode} aria-label={key + ' ' + mode} role="region" style={{ background: 'var(--cf-v2-surface)', color: 'var(--cf-v2-on-surface)', padding: 16 }}>
        <Scope id={key + '-' + mode} />
      </ThemeScope>
    )))}
    <div style={{ height: 900 }} />
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
`);
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createNetServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

async function waitForServer(url) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      await new Promise((done) => setTimeout(done, 200));
    }
  }
  throw new Error(`preview did not start at ${url}`);
}

async function certifyScope(page, id, roles, report) {
  const button = (name) => page.getByTestId(`${id}-${name}`);
  const style = (locator, property) => locator.evaluate((element, key) => getComputedStyle(element)[key], property);
  const surface = await style(page.getByTestId(id), 'backgroundColor');
  assert.equal(surface, rgb(roles.surface), `${id} surface`);

  for (const variant of variants) {
    const target = button(variant);
    const role = fills[variant];
    const check = (fill, label) => {
      const ratio = contrast(rgb(roles[role.on]), fill);
      report.minimumText = Math.min(report.minimumText, ratio);
      assert.ok(ratio >= 4.5, `${id} ${variant} ${label} text ${ratio.toFixed(2)}`);
      report.checks += 1;
    };
    assert.equal(await style(target, 'color'), rgb(roles[role.on]), `${id} ${variant} foreground`);
    const rest = await style(target, 'backgroundColor');
    if (role.rest) assert.equal(rest, rgb(roles[role.rest]), `${id} ${variant} rest`);
    else assert.equal(rest, 'rgba(0, 0, 0, 0)', `${id} ghost rest`);
    check(role.rest ? rest : surface, 'rest');

    await target.hover();
    assert.equal(await style(target, 'backgroundColor'), rgb(roles[role.hover]), `${id} ${variant} hover`);
    check(rgb(roles[role.hover]), 'hover');
    await page.mouse.down();
    assert.equal(await style(target, 'backgroundColor'), rgb(roles[role.pressed]), `${id} ${variant} pressed`);
    check(rgb(roles[role.pressed]), 'pressed');
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await target.evaluate((element) => { element.dataset.baseline = element.dataset.count; });

    if (variant === 'primary' || variant === 'danger') {
      for (const fill of [role.rest, role.hover, role.pressed]) {
        const ratio = contrast(rgb(roles[fill]), surface);
        report.minimumBoundary = Math.min(report.minimumBoundary, ratio);
        assert.ok(ratio >= 3, `${id} ${fill} boundary ${ratio.toFixed(2)}`);
      }
    }
    if (variant === 'secondary') {
      assert.equal(await style(target, 'borderTopColor'), rgb(roles.outline), `${id} outline`);
      for (const fill of [role.rest, role.hover, role.pressed]) {
        const ratio = contrast(rgb(roles.outline), rgb(roles[fill]));
        report.minimumBoundary = Math.min(report.minimumBoundary, ratio);
        assert.ok(ratio >= 3, `${id} outline on ${fill} ${ratio.toFixed(2)}`);
      }
    }

    const before = Number(await target.getAttribute('data-count'));
    await target.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    assert.equal(Number(await target.getAttribute('data-count')), before + 2, `${id} ${variant} keyboard activation`);

    const disabled = button(`${variant}-disabled`);
    assert.equal(await disabled.isDisabled(), true);
    assert.equal(await style(disabled, 'backgroundColor'), rgb(roles.disabled), `${id} ${variant} disabled`);
    await disabled.click({ force: true });
    assert.equal(await disabled.getAttribute('data-count'), '0', `${id} ${variant} disabled click`);

    const loading = button(`${variant}-loading`);
    assert.equal(await loading.getAttribute('aria-busy'), 'true');
    assert.equal(await loading.getAttribute('aria-disabled'), 'true');
    assert.equal(await loading.textContent(), 'Saving…');
    assert.equal(await loading.locator('[data-button-spinner]').count(), 1);
    await loading.click({ force: true });
    await loading.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    assert.equal(await loading.getAttribute('data-count'), '0', `${id} ${variant} loading activation`);
    assert.equal(await loading.evaluate((element) => document.activeElement === element), true, `${id} ${variant} loading focus`);
    report.states += 6;
  }

  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('Tab');
  await button('primary').focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const focused = button('primary');
  assert.equal(await focused.evaluate((element) => document.activeElement === element), true, `${id} tab order`);
  assert.equal(await style(focused, 'outlineStyle'), 'solid');
  assert.equal(await style(focused, 'outlineWidth'), '2px');
  assert.equal(await style(focused, 'outlineOffset'), '3px');
  assert.equal(await style(focused, 'outlineColor'), rgb(roles.focusRing));
  const ring = contrast(rgb(roles.focusRing), surface);
  report.minimumFocus = Math.min(report.minimumFocus, ring);
  assert.ok(ring >= 3, `${id} focus ring ${ring.toFixed(2)}`);

  const order = await page.getByTestId(id).evaluate((element) => [...element.querySelectorAll('button[data-size]:not([data-testid$="-overlays"] *)')].filter((node) => node.tabIndex >= 0 && !node.disabled).length);
  assert.equal(order, 8, `${id} focusable buttons`);

  for (const [state, role] of [['loading-state', 'status'], ['empty-state', 'region'], ['error-state', 'alert'], ['readonly-state', 'region']]) {
    const panel = page.getByTestId(`${id}-${state}`);
    assert.equal(await panel.getAttribute('role'), role, `${id} ${state} role`);
    assert.ok(await panel.getAttribute('aria-labelledby'), `${id} ${state} name`);
    const color = await style(panel.getByRole('heading'), 'color');
    assert.equal(color, rgb(roles.onSurface), `${id} ${state} heading`);
    report.feedback += 1;
  }
  assert.equal(await style(page.getByTestId(`${id}-empty-state`), 'backgroundColor'), rgb(roles.surface), `${id} feedback surface`);
}

async function certifyControls(page, id, roles, geometry, report) {
  const control = (name) => page.getByTestId(`${id}-${name}`);
  const style = (locator, property, pseudo) => locator.evaluate((element, [key, target]) => getComputedStyle(element, target)[key], [property, pseudo]);
  const sibling = (locator) => locator.locator('xpath=following-sibling::span[1]');
  const surface = rgb(roles.surface);
  const ratio = (key, minimum, foreground, background, label) => {
    const value = contrast(foreground, background);
    report[key] = Math.min(report[key], value);
    assert.ok(value >= minimum, `${id} ${label} ${value.toFixed(2)}`);
    report.checks += 1;
  };
  const leave = async () => {
    await page.mouse.up();
    await page.mouse.move(0, 0);
  };
  const focusRing = async (locator, label) => {
    assert.equal(await style(locator, 'outlineStyle'), 'solid', `${id} ${label} focus style`);
    assert.equal(await style(locator, 'outlineWidth'), '2px', `${id} ${label} focus width`);
    assert.equal(await style(locator, 'outlineOffset'), '-2px', `${id} ${label} focus offset`);
    assert.equal(await style(locator, 'outlineColor'), rgb(roles.focusRing), `${id} ${label} focus color`);
  };
  const tabInto = async (locator) => {
    await locator.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    assert.equal(await locator.evaluate((element) => document.activeElement === element), true, `${id} tab order`);
  };

  for (const [name, placeholderOpacity] of [['text', Number(geometry.field.placeholderOpacity)], ['select', Number(geometry.select.placeholderOpacity)]]) {
    const target = control(name);
    assert.equal(await style(target, 'backgroundColor'), rgb(roles.surfaceContainer), `${id} ${name} rest`);
    assert.equal(await style(target, 'borderTopColor'), rgb(roles.outline), `${id} ${name} border`);
    ratio('minimumBoundary', 3, rgb(roles.outline), surface, `${name} border on surface`);
    for (const fill of ['surfaceContainer', 'surfaceContainerHover']) {
      ratio('minimumBoundary', 3, rgb(roles.outline), rgb(roles[fill]), `${name} border on ${fill}`);
      ratio('minimumText', 4.5, rgb(roles.onSurface), rgb(roles[fill]), `${name} value on ${fill}`);
      ratio('minimumText', 4.5, blend(rgb(roles.onSurfaceVariant), rgb(roles[fill]), placeholderOpacity), rgb(roles[fill]), `${name} placeholder on ${fill}`);
    }
    await target.hover();
    assert.equal(await style(target, 'backgroundColor'), rgb(roles.surfaceContainerHover), `${id} ${name} hover`);
    await leave();

    const invalid = control(`${name}-invalid`);
    assert.equal(await invalid.getAttribute('aria-invalid'), 'true');
    assert.equal(await style(invalid, 'outlineColor'), rgb(roles.error), `${id} ${name} invalid`);
    assert.equal(await style(invalid, 'outlineWidth'), '2px', `${id} ${name} invalid width`);
    ratio('minimumBoundary', 3, rgb(roles.error), rgb(roles.surfaceContainer), `${name} invalid outline`);

    const disabled = control(`${name}-disabled`);
    assert.equal(await disabled.isDisabled(), true);
    assert.equal(await style(disabled, 'backgroundColor'), rgb(roles.disabled), `${id} ${name} disabled`);
    assert.equal(await style(disabled, 'opacity'), name === 'text' ? geometry.field.disabledOpacity : geometry.select.disabledOpacity, `${id} ${name} disabled opacity`);
    report.controls += 4;
  }

  const text = control('text');
  assert.equal(await style(text, 'color'), rgb(roles.onSurface), `${id} text color`);
  assert.equal(await style(text, 'color', '::placeholder'), rgb(roles.onSurfaceVariant), `${id} placeholder color`);
  assert.equal(await style(text, 'opacity', '::placeholder'), geometry.field.placeholderOpacity, `${id} placeholder opacity`);
  await tabInto(text);
  await focusRing(text, 'text');
  await page.keyboard.type('a@b');
  assert.equal(await text.inputValue(), 'a@b', `${id} text typing`);
  await text.fill('');
  assert.equal(await control('text-invalid').evaluate((element) => document.getElementById(element.getAttribute('aria-describedby'))?.textContent), 'Enter a valid email address.', `${id} text error link`);
  ratio('minimumText', 4.5, rgb(roles.error), surface, 'error message');

  const readonly = control('text-readonly');
  assert.equal(await style(readonly, 'opacity'), geometry.field.readonlyOpacity, `${id} read-only opacity`);
  const opacity = Number(geometry.field.readonlyOpacity);
  const readonlyFill = blend(rgb(roles.surfaceContainer), surface, opacity);
  ratio('minimumText', 4.5, blend(rgb(roles.onSurface), readonlyFill, opacity), readonlyFill, 'read-only value');
  await readonly.hover();
  assert.equal(await style(readonly, 'backgroundColor'), rgb(roles.surfaceContainer), `${id} read-only hover`);
  await leave();
  await readonly.focus();
  await page.keyboard.type('x');
  assert.equal(await readonly.inputValue(), 'Read-only value', `${id} read-only typing`);

  const select = control('select');
  assert.notEqual(await style(select, 'color'), rgb(roles.onSurface), `${id} select placeholder must differ from a value`);
  assert.equal(await style(control('select-filled'), 'color'), rgb(roles.onSurface), `${id} select value`);
  assert.equal(await select.locator('option').first().evaluate((element) => getComputedStyle(element).color), rgb(roles.onSurface), `${id} option color`);
  const chevron = select.locator('xpath=following-sibling::*[1]');
  assert.equal(await style(chevron, 'width'), '16px');
  assert.equal(await style(chevron, 'pointerEvents'), 'none');
  await tabInto(select);
  await focusRing(select, 'select');
  await page.keyboard.press('ArrowDown');
  assert.equal(await select.inputValue(), 'a', `${id} select keyboard`);
  await select.selectOption('');

  const checkbox = control('checkbox');
  const box = sibling(checkbox);
  assert.equal(await style(box, 'width'), '20px');
  assert.equal(await style(box, 'borderTopLeftRadius'), '5px');
  assert.deepEqual(await checkbox.evaluate((element) => { const { width, height } = element.getBoundingClientRect(); return [width, height]; }), [44, 44], `${id} checkbox target`);
  assert.equal(await style(box, 'backgroundColor'), rgb(roles.surfaceContainer), `${id} checkbox rest`);
  assert.equal(await style(box, 'borderTopColor'), rgb(roles.outline), `${id} checkbox border`);
  await checkbox.hover();
  assert.equal(await style(box, 'backgroundColor'), rgb(roles.surfaceContainerHover), `${id} checkbox hover`);
  await page.mouse.down();
  assert.equal(await style(box, 'backgroundColor'), rgb(roles.surfaceContainerPressed), `${id} checkbox pressed`);
  await leave();
  assert.equal(await checkbox.isChecked(), true, `${id} checkbox pointer toggle`);
  await checkbox.locator('xpath=ancestor::label').getByText('Accept terms').click();
  assert.equal(await checkbox.isChecked(), false, `${id} checkbox label toggle`);
  await leave();
  await tabInto(checkbox);
  await focusRing(checkbox, 'checkbox');
  assert.equal(await style(checkbox, 'borderTopLeftRadius'), '10px');
  await page.keyboard.press('Space');
  assert.equal(await checkbox.isChecked(), true, `${id} checkbox Space`);
  await page.keyboard.press('Space');
  assert.equal(await checkbox.isChecked(), false, `${id} checkbox Space off`);

  const checked = control('checkbox-checked');
  const checkedBox = sibling(checked);
  assert.equal(await style(checkedBox, 'backgroundColor'), rgb(roles.actionPrimary), `${id} checkbox checked`);
  assert.equal(await style(checkedBox.locator('svg').first(), 'display'), 'block', `${id} check mark`);
  assert.equal(await style(checkedBox.locator('svg').first(), 'color'), rgb(roles.onActionPrimary), `${id} check mark color`);
  await checked.hover();
  assert.equal(await style(checkedBox, 'backgroundColor'), rgb(roles.actionPrimaryHover), `${id} checkbox checked hover`);
  await page.mouse.down();
  assert.equal(await style(checkedBox, 'backgroundColor'), rgb(roles.actionPrimaryPressed), `${id} checkbox checked pressed`);
  await leave();
  await checked.check();
  await leave();
  for (const fill of ['actionPrimary', 'actionPrimaryHover', 'actionPrimaryPressed']) {
    ratio('minimumBoundary', 3, rgb(roles.onActionPrimary), rgb(roles[fill]), `mark on ${fill}`);
    ratio('minimumBoundary', 3, rgb(roles[fill]), surface, `${fill} control boundary`);
  }

  const mixed = control('checkbox-mixed');
  assert.equal(await mixed.evaluate((element) => element.indeterminate), true, `${id} mixed property`);
  assert.equal(await style(sibling(mixed).locator('svg').last(), 'display'), 'block', `${id} mixed mark`);
  assert.equal(await style(sibling(mixed).locator('svg').first(), 'display'), 'none', `${id} mixed hides the check`);
  await mixed.focus();
  await page.keyboard.press('Space');
  assert.equal(await mixed.evaluate((element) => element.indeterminate), true, `${id} mixed survives activation`);
  await page.keyboard.press('Space');

  assert.equal(await style(sibling(control('checkbox-invalid')), 'borderTopColor'), rgb(roles.error), `${id} checkbox invalid`);
  const invalidChecked = sibling(control('checkbox-invalid-checked'));
  assert.equal(await style(invalidChecked, 'backgroundColor'), rgb(roles.error), `${id} checkbox invalid checked`);
  assert.equal(await style(invalidChecked.locator('svg').first(), 'color'), rgb(roles.onError), `${id} checkbox invalid mark`);
  ratio('minimumBoundary', 3, rgb(roles.onError), rgb(roles.error), 'invalid mark');

  const disabled = control('checkbox-disabled');
  assert.equal(await style(sibling(disabled), 'opacity'), geometry.checkbox.disabledOpacity, `${id} checkbox disabled`);
  await disabled.click({ force: true });
  assert.equal(await disabled.isChecked(), true, `${id} checkbox disabled click`);
  report.controls += 6;

  const toggle = control('switch');
  const track = sibling(toggle);
  const thumb = track.locator('span');
  assert.equal(await toggle.getAttribute('role'), 'switch');
  assert.ok(await page.getByRole('switch', { name: 'Alerts' }).count() > 0, `${id} switch name`);
  assert.deepEqual(await toggle.evaluate((element) => { const { width, height } = element.getBoundingClientRect(); return [width, height]; }), [44, 44], `${id} switch target`);
  assert.equal(await style(track, 'width'), '44px');
  assert.equal(await style(track, 'height'), '26px');
  assert.equal(await style(thumb, 'width'), '18px');
  assert.equal(await style(track, 'backgroundColor'), rgb(roles.surfaceContainer), `${id} switch off`);
  assert.equal(await style(track, 'outlineColor'), rgb(roles.outline), `${id} switch outline`);
  assert.equal(await style(thumb, 'backgroundColor'), rgb(roles.onSurface), `${id} switch thumb off`);
  assert.equal(await style(thumb, 'left'), '5px', `${id} switch thumb off position`);
  ratio('minimumBoundary', 3, rgb(roles.onSurface), rgb(roles.surfaceContainer), 'switch thumb off');
  ratio('minimumBoundary', 3, rgb(roles.outline), surface, 'switch outline');
  await toggle.hover();
  assert.equal(await style(track, 'backgroundColor'), rgb(roles.surfaceContainerHover), `${id} switch hover`);
  await leave();
  await tabInto(toggle);
  await focusRing(toggle, 'switch');
  assert.equal(await style(toggle, 'borderTopLeftRadius'), '12px');
  await page.keyboard.press('Space');
  assert.equal(await toggle.isChecked(), true, `${id} switch Space`);
  assert.equal(await style(track, 'backgroundColor'), rgb(roles.actionPrimary), `${id} switch on`);
  assert.equal(await style(thumb, 'backgroundColor'), rgb(roles.onActionPrimary), `${id} switch thumb on`);
  assert.equal(await style(thumb, 'left'), '22px', `${id} switch thumb on position`);
  ratio('minimumBoundary', 3, rgb(roles.onActionPrimary), rgb(roles.actionPrimary), 'switch thumb on');
  await page.keyboard.press('Space');
  assert.equal(await toggle.isChecked(), false, `${id} switch Space off`);
  await toggle.locator('xpath=ancestor::label').getByText('Alerts').click();
  assert.equal(await toggle.isChecked(), true, `${id} switch label`);
  await toggle.locator('xpath=ancestor::label').getByText('Alerts').click();
  await leave();

  const on = control('switch-on');
  await on.hover();
  assert.equal(await style(sibling(on), 'backgroundColor'), rgb(roles.actionPrimaryHover), `${id} switch on hover`);
  await leave();
  const locked = control('switch-disabled');
  assert.equal(await style(sibling(locked), 'opacity'), geometry.switch.disabledOpacity, `${id} switch disabled`);
  await locked.click({ force: true });
  assert.equal(await locked.isChecked(), true, `${id} switch disabled click`);
  report.controls += 5;
}

async function certifyDisplay(page, id, roles, geometry, report) {
  const part = (name) => page.getByTestId(`${id}-${name}`);
  const style = (locator, property) => locator.evaluate((element, key) => getComputedStyle(element)[key], property);
  const surface = rgb(roles.surface);
  const ratio = (key, minimum, foreground, background, label) => {
    const value = contrast(foreground, background);
    report[key] = Math.min(report[key], value);
    assert.ok(value >= minimum, `${id} ${label} ${value.toFixed(2)}`);
    report.checks += 1;
  };
  const leave = async () => {
    await page.mouse.up();
    await page.mouse.move(0, 0);
  };
  const focusRing = async (locator, label, color = rgb(roles.focusRing)) => {
    assert.equal(await style(locator, 'outlineStyle'), 'solid', `${id} ${label} focus style`);
    assert.equal(await style(locator, 'outlineWidth'), '2px', `${id} ${label} focus width`);
    assert.equal(await style(locator, 'outlineOffset'), '-2px', `${id} ${label} focus offset`);
    assert.equal(await style(locator, 'outlineColor'), color, `${id} ${label} focus color`);
  };
  const isActive = (locator) => locator.evaluate((element) => document.activeElement === element);
  const tabInto = async (locator) => {
    await locator.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    assert.equal(await isActive(locator), true, `${id} tab order`);
  };

  for (const [variant, fill] of [['default', 'surfaceContainer'], ['outlined', 'surface'], ['elevated', 'surfaceContainer']]) {
    const card = part(`card-${variant}`);
    assert.equal(await style(card, 'backgroundColor'), rgb(roles[fill]), `${id} card ${variant}`);
    assert.equal(await style(card, 'borderTopLeftRadius'), '14px');
    assert.equal(await style(card, 'paddingTop'), '20px');
    assert.equal(await style(card, 'rowGap'), '12px');
    assert.equal(await card.getAttribute('role'), null, `${id} static card role`);
    assert.equal(await card.evaluate((element) => element.tabIndex), -1, `${id} static card must not be focusable`);
    await card.hover();
    assert.equal(await style(card, 'backgroundColor'), rgb(roles[fill]), `${id} static card hover`);
    await leave();
    const opacity = Number(geometry.card.bodyOpacity);
    ratio('minimumText', 4.5, blend(rgb(roles.onSurface), rgb(roles[fill]), opacity), rgb(roles[fill]), `card body on ${fill}`);
    ratio('minimumText', 4.5, rgb(roles.actionPrimary), rgb(roles[fill]), `card footer on ${fill}`);
    report.display += 1;
  }
  assert.equal(await style(part('card-outlined'), 'borderTopColor'), rgb(roles.outline), `${id} card border`);
  assert.notEqual(await style(part('card-elevated'), 'boxShadow'), 'none', `${id} card shadow`);
  assert.equal(await style(part('card-default'), 'boxShadow'), 'none', `${id} default card shadow`);
  assert.equal(await style(part('card-default').locator('> div').last(), 'color'), rgb(roles.actionPrimary), `${id} card footer`);

  const action = part('card-button');
  assert.equal(await action.evaluate((element) => element.tagName), 'BUTTON');
  assert.equal(await action.getAttribute('type'), 'button');
  assert.equal(await page.getByTestId(id).getByRole('button', { name: 'Open Body Footer' }).count(), 1, `${id} interactive card name`);
  assert.equal(await style(action, 'backgroundColor'), rgb(roles.surfaceContainer), `${id} interactive rest`);
  assert.equal(await style(action, 'borderTopColor'), rgb(roles.outline));
  await action.hover();
  assert.equal(await style(action, 'backgroundColor'), rgb(roles.surfaceContainerHover), `${id} interactive hover`);
  await leave();
  ratio('minimumText', 4.5, rgb(roles.actionPrimary), rgb(roles.surfaceContainerHover), 'card footer on hover');
  await tabInto(action);
  await focusRing(action, 'card');
  const before = Number(await action.getAttribute('data-count'));
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  assert.equal(Number(await action.getAttribute('data-count')), before + 2, `${id} card keyboard`);
  const locked = part('card-disabled');
  assert.equal(await locked.isDisabled(), true);
  assert.equal(await style(locked, 'backgroundColor'), rgb(roles.disabled), `${id} card disabled`);
  assert.equal(await style(locked, 'opacity'), geometry.card.disabledOpacity);
  const count = await locked.getAttribute('data-count');
  await locked.click({ force: true });
  assert.equal(await locked.getAttribute('data-count'), count, `${id} card disabled click`);
  const link = part('card-link');
  assert.equal(await link.evaluate((element) => element.tagName), 'A');
  assert.equal(await link.getAttribute('href'), '#card');
  assert.equal(await style(link, 'textDecorationLine'), 'none');
  await link.focus();
  report.display += 3;

  for (const [tone, fill, on, accent, border] of [
    ['neutral', 'surfaceContainer', 'onSurface', 'onSurface', 'outline'],
    ['primary', 'actionPrimary', 'onActionPrimary', 'actionPrimary', 'actionPrimary'],
    ['success', 'success', 'onSuccess', 'success', 'success'],
    ['warning', 'warning', 'onWarning', 'warning', 'warning'],
    ['error', 'error', 'onError', 'error', 'error'],
    ['info', 'info', 'onInfo', 'info', 'info'],
  ]) {
    const solid = part(`badge-${tone}-solid`);
    assert.equal(await style(solid, 'backgroundColor'), rgb(roles[fill]), `${id} ${tone} solid fill`);
    assert.equal(await style(solid, 'color'), rgb(roles[on]), `${id} ${tone} solid text`);
    ratio('minimumText', 4.5, rgb(roles[on]), rgb(roles[fill]), `${tone} solid badge`);
    for (const variant of ['subtle', 'outline']) {
      const badge = part(`badge-${tone}-${variant}`);
      assert.equal(await style(badge, 'backgroundColor'), rgb(roles.surfaceContainer), `${id} ${tone} ${variant} fill`);
      assert.equal(await style(badge, 'color'), rgb(roles[accent]), `${id} ${tone} ${variant} text`);
    }
    ratio('minimumText', 4.5, rgb(roles[accent]), rgb(roles.surfaceContainer), `${tone} subtle badge`);
    const outlined = part(`badge-${tone}-outline`);
    assert.equal(await style(outlined, 'borderTopColor'), rgb(roles[border]), `${id} ${tone} outline border`);
    assert.equal(await style(outlined, 'borderTopWidth'), '1px');
    ratio('minimumBoundary', 3, rgb(roles[border]), rgb(roles.surfaceContainer), `${tone} badge outline`);
    assert.equal(await solid.evaluate((element) => element.tabIndex), -1, `${id} badge must not be focusable`);
    report.display += 3;
  }

  const tabs = part('tabs');
  const tab = (root, name) => root.getByRole('tab', { name, exact: true });
  const panel = (root) => root.getByRole('tabpanel');
  assert.equal(await tabs.getByRole('tablist', { name: `${id} tabs` }).count(), 1, `${id} tablist name`);
  const one = tab(tabs, 'One');
  const three = tab(tabs, 'Three');
  const four = tab(tabs, 'Four');
  assert.equal(await one.getAttribute('aria-selected'), 'true');
  assert.equal(await style(one, 'color'), rgb(roles.actionPrimary), `${id} selected tab`);
  assert.equal(await style(one.locator('span').last(), 'backgroundColor'), rgb(roles.actionPrimary), `${id} indicator`);
  assert.equal(await style(one.locator('span').last(), 'height'), '3px');
  assert.equal(await style(one, 'height'), '44px');
  assert.equal(await style(three, 'color'), rgb(roles.onSurface), `${id} unselected tab`);
  ratio('minimumText', 4.5, rgb(roles.actionPrimary), surface, 'selected tab');
  assert.equal(await style(tabs, 'backgroundColor'), surface, `${id} tabs surface`);
  assert.equal(await style(panel(tabs), 'backgroundColor'), rgb(roles.surfaceContainer), `${id} panel`);
  assert.equal(await one.getAttribute('aria-controls'), await panel(tabs).getAttribute('id'), `${id} aria-controls`);
  assert.equal(await panel(tabs).getAttribute('aria-labelledby'), await one.getAttribute('id'), `${id} aria-labelledby`);
  await three.hover();
  assert.equal(await style(three, 'backgroundColor'), rgb(roles.surfaceContainerHover), `${id} tab hover`);
  await leave();
  ratio('minimumText', 4.5, rgb(roles.onSurface), rgb(roles.surfaceContainerHover), 'tab hover');
  assert.equal(await style(tab(tabs, 'Two'), 'opacity'), geometry.tabs.disabledOpacity, `${id} disabled tab`);
  assert.equal(await tab(tabs, 'Two').isDisabled(), true);

  await tabInto(one);
  await focusRing(one, 'tab');
  await page.keyboard.press('ArrowRight');
  assert.equal(await isActive(three), true, `${id} ArrowRight skips disabled`);
  assert.equal(await three.getAttribute('aria-selected'), 'true', `${id} automatic activation`);
  assert.match(await panel(tabs).textContent(), /Panel three/, `${id} panel follows`);
  assert.deepEqual(await tabs.getByRole('tab', { includeHidden: true }).evaluateAll((nodes) => nodes.map((node) => node.tabIndex)), [-1, -1, 0, -1], `${id} roving tabindex`);
  await page.keyboard.press('End');
  assert.equal(await isActive(four), true, `${id} End`);
  await page.keyboard.press('ArrowRight');
  assert.equal(await isActive(one), true, `${id} wrap`);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await isActive(four), true, `${id} wrap back`);
  await page.keyboard.press('Home');
  assert.equal(await isActive(one), true, `${id} Home`);
  await page.keyboard.press('Tab');
  assert.equal(await isActive(panel(tabs)), true, `${id} Tab reaches the panel`);
  await focusRing(panel(tabs), 'panel');

  const pill = part('tabs-pill');
  const pillOne = tab(pill, 'One');
  assert.equal(await style(pillOne, 'backgroundColor'), rgb(roles.surfaceContainer), `${id} pill selected`);
  assert.equal(await style(pillOne, 'color'), rgb(roles.actionPrimary), `${id} pill text`);
  assert.equal(await style(pillOne, 'borderTopLeftRadius'), '10px');
  assert.equal(await style(pillOne, 'height'), '36px');
  assert.equal(await pillOne.locator('span').count(), 1, `${id} pill has no indicator`);
  ratio('minimumText', 4.5, rgb(roles.actionPrimary), rgb(roles.surfaceContainer), 'pill tab');

  const manual = part('tabs-manual');
  const manualOne = tab(manual, 'One');
  const manualThree = tab(manual, 'Three');
  await manualOne.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await isActive(manualThree), true, `${id} manual focus`);
  assert.equal(await manualOne.getAttribute('aria-selected'), 'true', `${id} manual keeps selection`);
  await page.keyboard.press('Enter');
  assert.equal(await manualThree.getAttribute('aria-selected'), 'true', `${id} manual Enter`);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  assert.equal(await manualOne.getAttribute('aria-selected'), 'true', `${id} manual Space`);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Tab');
  assert.equal(await manualOne.getAttribute('tabindex'), '0', `${id} tab stop returns to the selected tab`);
  report.display += 4;

  const descriptionOpacity = Number(geometry.alert.descriptionOpacity);
  for (const [tone, fill, on, border] of [
    ['info', 'info', 'onInfo', 'info'],
    ['success', 'success', 'onSuccess', 'success'],
    ['warning', 'warning', 'onWarning', 'warning'],
    ['error', 'error', 'onError', 'error'],
    ['neutral', 'surfaceContainer', 'onSurface', 'outline'],
  ]) {
    for (const [variant, background, text] of [['soft', 'surfaceContainer', 'onSurface'], ['solid', fill, on], ['outline', 'surface', 'onSurface']]) {
      const alert = part(`alert-${tone}-${variant}`);
      const icon = alert.locator('> span').first();
      const [iconFill, iconText] = variant === 'solid' ? [on, fill] : [fill, on];
      assert.equal(await alert.getAttribute('role'), tone === 'error' ? 'alert' : 'status', `${id} ${tone} role`);
      assert.equal(await style(alert, 'backgroundColor'), rgb(roles[background]), `${id} ${tone} ${variant} fill`);
      assert.equal(await style(alert, 'color'), rgb(roles[text]), `${id} ${tone} ${variant} text`);
      assert.equal(await style(icon, 'backgroundColor'), rgb(roles[iconFill]), `${id} ${tone} ${variant} icon`);
      assert.equal(await style(icon, 'color'), rgb(roles[iconText]), `${id} ${tone} ${variant} glyph`);
      assert.equal(await icon.getAttribute('aria-hidden'), 'true');
      ratio('minimumText', 4.5, rgb(roles[text]), rgb(roles[background]), `${tone} ${variant} title`);
      ratio('minimumText', 4.5, blend(rgb(roles[text]), rgb(roles[background]), descriptionOpacity), rgb(roles[background]), `${tone} ${variant} description`);
      ratio('minimumBoundary', 3, rgb(roles[iconText]), rgb(roles[iconFill]), `${tone} ${variant} glyph`);
      report.display += 1;
    }
    const outlined = part(`alert-${tone}-outline`);
    assert.equal(await style(outlined, 'borderTopColor'), rgb(roles[border]), `${id} ${tone} border`);
    ratio('minimumBoundary', 3, rgb(roles[border]), surface, `${tone} alert border`);
  }
  const alert = part('alert-info-soft');
  assert.equal(await style(alert, 'borderTopLeftRadius'), '12px');
  assert.equal(await style(alert, 'paddingTop'), '16px');
  assert.equal(await style(alert.locator('> span').first(), 'width'), '26px');

  const dismissible = part('alert-dismiss');
  const close = dismissible.getByRole('button', { name: 'Close', exact: true });
  assert.equal(await style(close, 'width'), '32px', `${id} dismiss target`);
  assert.equal(await style(close, 'color'), rgb(roles.onWarning), `${id} dismiss color`);
  await tabInto(close);
  await focusRing(close, 'dismiss', rgb(roles.onWarning));
  ratio('minimumFocus', 3, rgb(roles.onWarning), rgb(roles.warning), 'dismiss focus on solid');
  await page.keyboard.press('Enter');
  assert.equal(await dismissible.count(), 0, `${id} dismiss removes the alert`);
  report.display += 1;
}

async function certifyOverlays(page, id, roles, geometry, report) {
  const part = (name) => page.getByTestId(`${id}-${name}`);
  const style = (locator, property, pseudo) => locator.evaluate((element, [key, target]) => getComputedStyle(element, target)[key], [property, pseudo]);
  const box = (locator) => locator.evaluate((element) => {
    const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
    return { left, top, right, bottom, width, height };
  });
  const isActive = (locator) => locator.evaluate((element) => document.activeElement === element);
  const onTop = (locator) => locator.evaluate((element) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    const hit = document.elementFromPoint(left + width / 2, top + height / 2);
    return element === hit || element.contains(hit);
  });
  const topLayer = (locator) => locator.evaluate((element) => element.matches(':modal, :popover-open'));
  const rootOverflow = () => page.evaluate(() => document.documentElement.style.overflow);
  const fill = rgb(roles.surfaceContainer);
  const ratio = (key, minimum, foreground, background, label) => {
    const value = contrast(foreground, background);
    report[key] = Math.min(report[key], value);
    assert.ok(value >= minimum, `${id} ${label} ${value.toFixed(2)}`);
    report.checks += 1;
  };
  const leave = async () => {
    await page.mouse.up();
    await page.mouse.move(0, 0);
  };
  const press = async (locator, key = 'Enter') => {
    await locator.focus();
    await page.keyboard.press(key);
  };
  const surface = async (locator, label, radius) => {
    assert.equal(await style(locator, 'backgroundColor'), fill, `${id} ${label} fill`);
    assert.equal(await style(locator, 'color'), rgb(roles.onSurface), `${id} ${label} text`);
    assert.equal(await style(locator, 'borderTopColor'), rgb(roles.outline), `${id} ${label} border`);
    assert.equal(await style(locator, 'borderTopWidth'), '1px', `${id} ${label} border width`);
    assert.equal(await style(locator, 'borderTopLeftRadius'), radius, `${id} ${label} radius`);
    assert.equal(await topLayer(locator), true, `${id} ${label} top layer`);
  };
  const ring = async (locator, label) => {
    assert.equal(await style(locator, 'outlineStyle'), 'solid', `${id} ${label} focus style`);
    assert.equal(await style(locator, 'outlineWidth'), '2px', `${id} ${label} focus width`);
    assert.equal(await style(locator, 'outlineColor'), rgb(roles.focusRing), `${id} ${label} focus color`);
  };

  ratio('minimumText', 4.5, rgb(roles.onSurface), fill, 'overlay text');
  ratio('minimumBoundary', 3, rgb(roles.outline), fill, 'overlay border');
  ratio('minimumFocus', 3, rgb(roles.focusRing), fill, 'overlay focus');

  const opener = part('dialog-open');
  const dialog = part('dialog');
  assert.equal(await dialog.isVisible(), false, `${id} dialog starts closed`);
  await press(opener);
  await dialog.waitFor();
  await surface(dialog, 'dialog', '12px');
  assert.equal(await page.getByTestId(id).getByRole('dialog', { name: `Dialog ${id}-dialog` }).count(), 1, `${id} dialog name`);
  assert.equal(await dialog.getAttribute('aria-modal'), 'true');
  assert.equal(await style(dialog, 'width'), '445px', `${id} dialog width`);
  assert.equal(await style(dialog, 'paddingTop'), '19px');
  assert.equal(await style(dialog, 'paddingLeft'), '20px');
  assert.equal(await style(dialog, 'paddingBottom'), '15px');
  assert.equal(await style(dialog, 'rowGap'), '12px');
  assert.equal(await style(dialog, 'backgroundColor', '::backdrop'), geometry.dialog.backdrop.replaceAll(/\s+/g, '').replaceAll(',', ', '), `${id} backdrop`);
  const heading = dialog.getByRole('heading', { level: 2 });
  assert.equal(await style(heading, 'fontSize'), '18px', `${id} dialog title`);
  assert.equal(await style(heading, 'fontWeight'), '700');
  const opacity = Number(geometry.dialog.descriptionOpacity);
  ratio('minimumText', 4.5, blend(rgb(roles.onSurface), fill, opacity), fill, 'dialog description');
  assert.equal(await rootOverflow(), 'hidden', `${id} scroll lock`);
  const cancel = part('cancel');
  const proceed = part('continue');
  assert.equal(await isActive(cancel), true, `${id} dialog initial focus`);
  assert.equal(await style(dialog.locator('> div').last(), 'columnGap'), '9px', `${id} dialog footer gap`);
  await page.keyboard.press('Tab');
  assert.equal(await isActive(proceed), true, `${id} dialog tab`);
  await page.keyboard.press('Tab');
  assert.equal(await isActive(cancel), true, `${id} dialog tab wraps`);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await isActive(proceed), true, `${id} dialog shift tab wraps`);
  assert.equal(await opener.evaluate((element) => element.closest('[inert]') !== null || !element.checkVisibility() || document.elementFromPoint(element.getBoundingClientRect().left + 1, element.getBoundingClientRect().top + 1) !== element), true, `${id} page behind the modal is unreachable`);
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await isActive(opener), true, `${id} dialog restores focus`);
  assert.equal(await rootOverflow(), '', `${id} scroll unlock`);
  report.overlays += 4;

  const plain = part('dialog-plain');
  await press(part('dialog-plain-open'));
  await plain.waitFor();
  assert.equal(await isActive(plain), true, `${id} dialog without controls takes focus`);
  await ring(plain, 'dialog');
  await page.keyboard.press('Tab');
  assert.equal(await isActive(plain), true, `${id} dialog without controls keeps focus`);
  await page.keyboard.press('Escape');
  await plain.waitFor({ state: 'hidden' });

  const locked = part('dialog-locked');
  await press(part('dialog-locked-open'));
  await locked.waitFor();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  assert.equal(await locked.isVisible(), true, `${id} locked dialog ignores Escape`);
  assert.equal(await topLayer(locked), true, `${id} locked dialog stays modal`);
  await locked.evaluate((element) => element.close());
  await locked.waitFor({ state: 'hidden' });

  const scroller = part('dialog-scroll');
  await press(part('dialog-scroll-open'));
  await scroller.waitFor();
  const scrollBox = await box(scroller);
  const viewport = page.viewportSize();
  assert.ok(scrollBox.bottom <= viewport.height - 16 && scrollBox.top >= 16, `${id} long dialog stays inside the viewport`);
  const body = scroller.locator('> div').first();
  assert.equal(await body.evaluate((element) => element.scrollHeight > element.clientHeight), true, `${id} dialog body scrolls`);
  assert.equal(await body.getAttribute('tabindex'), '0', `${id} scrollable body is keyboard reachable`);
  const done = scroller.getByRole('button', { name: 'Done' });
  assert.equal(await onTop(done), true, `${id} footer stays operable`);
  await page.keyboard.press('Escape');
  await scroller.waitFor({ state: 'hidden' });

  const nested = part('dialog-nested');
  const inner = part('nested');
  await press(part('dialog-nested-open'));
  await nested.waitFor();
  await press(part('nested-trigger'));
  await inner.waitFor();
  assert.equal(await onTop(inner), true, `${id} popover above its dialog`);
  await page.keyboard.press('Escape');
  await inner.waitFor({ state: 'hidden' });
  assert.equal(await nested.isVisible(), true, `${id} Escape closes only the top layer`);
  assert.equal(await isActive(part('nested-trigger')), true, `${id} nested focus`);
  await page.keyboard.press('Escape');
  await nested.waitFor({ state: 'hidden' });
  report.overlays += 4;

  for (const placement of ['top', 'bottom', 'left', 'right']) {
    const trigger = part(`tip-${placement}-trigger`);
    const tip = part(`tip-${placement}`);
    assert.equal(await trigger.getAttribute('aria-describedby'), await tip.getAttribute('id'), `${id} tooltip description`);
    await trigger.evaluate((element) => window.scrollBy(0, element.getBoundingClientRect().top - window.innerHeight / 2));
    await trigger.hover();
    await tip.waitFor();
    await surface(tip, `tooltip ${placement}`, '8px');
    assert.equal(await tip.getAttribute('role'), 'tooltip');
    assert.equal(await tip.getAttribute('data-placement'), placement, `${id} tooltip side`);
    assert.equal(await style(tip, 'fontSize'), '12px');
    assert.equal(await style(tip, 'fontWeight'), '500');
    assert.equal(await style(tip, 'paddingLeft'), '12px');
    assert.equal(await style(tip, 'paddingTop'), '11px');
    assert.equal(await tip.locator('a, button, input, select, textarea').count(), 0, `${id} tooltip stays non-interactive`);
    assert.equal(await onTop(tip), true, `${id} tooltip ${placement} escapes overflow hidden`);
    const anchorBox = await box(trigger);
    const tipBox = await box(tip);
    const gaps = { top: anchorBox.top - tipBox.bottom, bottom: tipBox.top - anchorBox.bottom, left: anchorBox.left - tipBox.right, right: tipBox.left - anchorBox.right };
    assert.ok(Math.abs(gaps[placement] - 14) < 1, `${id} tooltip ${placement} offset ${gaps[placement]}`);
    const arrow = tip.locator('svg');
    assert.equal(await style(arrow, 'fill'), fill, `${id} tooltip arrow fill`);
    assert.equal(await style(arrow, 'stroke'), rgb(roles.outline), `${id} tooltip arrow stroke`);
    const arrowBox = await box(arrow);
    const center = (value) => (['top', 'bottom'].includes(placement) ? (value.left + value.right) / 2 : (value.top + value.bottom) / 2);
    assert.ok(Math.abs(center(arrowBox) - center(anchorBox)) < 2, `${id} tooltip ${placement} arrow points at the anchor`);
    const edge = { top: arrowBox.top - tipBox.bottom, bottom: tipBox.top - arrowBox.bottom, left: arrowBox.left - tipBox.right, right: tipBox.left - arrowBox.right };
    assert.ok(Math.abs(edge[placement]) <= 2, `${id} tooltip ${placement} arrow touches the surface ${edge[placement]}`);
    await page.keyboard.press('Escape');
    await tip.waitFor({ state: 'hidden' });
    await leave();
    report.overlays += 1;
  }

  if (id === 'default') {
    const early = part('tip-left');
    await early.evaluate((element) => {
      const observer = new MutationObserver(() => {
        if (element.dataset.state !== 'open') return;
        observer.disconnect();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      });
      observer.observe(element, { attributes: true, attributeFilter: ['data-state'] });
    });
    await part('tip-left-trigger').hover();
    await page.waitForTimeout(300);
    assert.equal(await early.getAttribute('data-state'), 'closed', 'Escape works from the moment an overlay opens');
    await leave();
    report.overlays += 1;
  }

  const tipTrigger = part('tip-top-trigger');
  const tip = part('tip-top');
  await press(part('tip-bottom-trigger'), 'Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await isActive(tipTrigger), true, `${id} tooltip tab target`);
  await tip.waitFor();
  await page.keyboard.press('Escape');
  await tip.waitFor({ state: 'hidden' });
  assert.equal(await isActive(tipTrigger), true, `${id} tooltip Escape keeps focus`);
  await page.keyboard.press('Tab');
  await part('tip-bottom').waitFor();
  await page.keyboard.press('Tab');
  await part('tip-bottom').waitFor({ state: 'hidden' });
  await tipTrigger.evaluate((element) => window.scrollBy(0, element.getBoundingClientRect().top - 4));
  await tipTrigger.hover();
  await tip.waitFor();
  assert.equal(await tip.getAttribute('data-placement'), 'bottom', `${id} tooltip flips at the viewport edge`);
  await leave();
  await tip.waitFor({ state: 'hidden' });
  report.overlays += 2;

  const popTrigger = part('popover-trigger');
  const popover = part('popover');
  const field = part('popover-field');
  await popTrigger.evaluate((element) => window.scrollBy(0, element.getBoundingClientRect().top - 120));
  assert.equal(await popTrigger.getAttribute('aria-expanded'), 'false');
  assert.equal(await popTrigger.getAttribute('aria-haspopup'), 'dialog');
  await press(popTrigger);
  await popover.waitFor();
  await surface(popover, 'popover', '12px');
  assert.equal(await popTrigger.getAttribute('aria-expanded'), 'true');
  assert.equal(await popover.getAttribute('aria-modal'), null, `${id} popover is nonmodal`);
  assert.equal(await page.getByTestId(id).getByRole('dialog', { name: `Popover ${id}` }).count(), 1, `${id} popover name`);
  assert.equal(await style(popover, 'width'), '250px');
  assert.equal(await style(popover, 'paddingTop'), '15px');
  assert.equal(await style(popover, 'paddingLeft'), '16px');
  assert.equal(await style(popover, 'rowGap'), '12px');
  assert.equal(await style(popover.locator('> div').first(), 'fontSize'), '15px');
  assert.equal(await style(popover.locator('> div').nth(1), 'opacity'), geometry.popover.separatorOpacity);
  ratio('minimumText', 4.5, blend(rgb(roles.onSurface), fill, Number(geometry.popover.descriptionOpacity)), fill, 'popover description');
  assert.equal(await isActive(field), true, `${id} popover moves focus to its control`);
  assert.equal(await onTop(popover), true, `${id} popover escapes overflow hidden`);
  const triggerBox = await box(popTrigger);
  const popBox = await box(popover);
  assert.ok(Math.abs(popBox.top - triggerBox.bottom - 10) < 1, `${id} popover offset`);
  assert.ok(Math.abs(popBox.left - triggerBox.left) < 1, `${id} popover start alignment`);
  assert.equal(await rootOverflow(), '', `${id} popover keeps page scroll`);
  await page.keyboard.press('Escape');
  await popover.waitFor({ state: 'hidden' });
  assert.equal(await isActive(popTrigger), true, `${id} popover restores focus`);
  await press(popTrigger);
  await popover.waitFor();
  await press(popTrigger, 'Enter');
  await popover.waitFor({ state: 'hidden' });
  await press(popTrigger);
  await popover.waitFor();
  await page.mouse.click(2, 2);
  await popover.waitFor({ state: 'hidden' });
  await press(popTrigger);
  await popover.waitFor();
  await page.keyboard.press('Tab');
  await popover.waitFor({ state: 'hidden' });
  await popTrigger.evaluate((element) => window.scrollBy(0, element.getBoundingClientRect().bottom - window.innerHeight + 4));
  await press(popTrigger);
  await popover.waitFor();
  assert.equal(await popover.getAttribute('data-placement'), 'top', `${id} popover flips at the viewport edge`);
  await page.keyboard.press('Escape');
  await popover.waitFor({ state: 'hidden' });
  const anchored = part('anchored');
  await press(part('anchored-open'));
  await anchored.waitFor();
  assert.ok(Math.abs((await box(anchored)).left - (await box(part('anchored-open'))).left) < 1 || (await anchored.getAttribute('data-placement')) !== 'bottom', `${id} anchorRef positions the popover`);
  await page.keyboard.press('Escape');
  await anchored.waitFor({ state: 'hidden' });
  report.overlays += 5;

  const menuTrigger = part('menu-trigger');
  const menu = part('menu');
  const item = (name) => menu.getByRole('menuitem', { name, exact: true });
  const result = part('menu-result');
  await menuTrigger.evaluate((element) => window.scrollBy(0, element.getBoundingClientRect().top - 120));
  assert.equal(await menuTrigger.getAttribute('aria-haspopup'), 'menu');
  await press(menuTrigger, 'ArrowDown');
  await menu.waitFor();
  await surface(menu, 'menu', '12px');
  assert.equal(await page.getByTestId(id).getByRole('menu', { name: 'Menu' }).count(), 1, `${id} menu name`);
  assert.equal(await menuTrigger.getAttribute('aria-expanded'), 'true');
  assert.equal(await style(menu, 'width'), '232px');
  assert.equal(await style(menu, 'paddingTop'), '8px');
  assert.equal(await style(menu, 'paddingLeft'), '7px');
  assert.equal(await style(menu, 'rowGap'), '4px');
  assert.equal(await onTop(menu), true, `${id} menu escapes overflow hidden`);
  const edit = item('Edit');
  const destroy = item('Delete');
  assert.equal(await isActive(edit), true, `${id} menu first item`);
  assert.equal(await style(edit, 'height'), '38px');
  assert.equal(await style(edit, 'borderTopLeftRadius'), '7px');
  assert.equal(await style(edit, 'fontSize'), '12px');
  assert.equal(await style(edit, 'fontWeight'), '500');
  assert.equal(await style(edit, 'backgroundColor'), rgb(roles.surfaceContainerHover), `${id} highlighted item`);
  await ring(edit, 'menu item');
  ratio('minimumText', 4.5, rgb(roles.onSurface), rgb(roles.surfaceContainerHover), 'highlighted item');
  ratio('minimumFocus', 3, rgb(roles.focusRing), rgb(roles.surfaceContainerHover), 'menu item focus');
  const separator = menu.getByRole('separator');
  assert.equal(await separator.evaluate((element) => element.tabIndex), -1, `${id} separator is not focusable`);
  assert.equal(await style(separator, 'opacity'), geometry.menu.separatorOpacity);
  assert.equal(await style(destroy, 'color'), rgb(roles.error), `${id} destructive item`);
  ratio('minimumText', 4.5, rgb(roles.error), fill, 'destructive item');
  ratio('minimumText', 4.5, rgb(roles.error), rgb(roles.surfaceContainerHover), 'destructive item highlighted');
  const archive = item('Archive unavailable');
  assert.equal(await archive.isDisabled(), true);
  assert.equal(await style(archive, 'opacity'), geometry.menu.disabledOpacity, `${id} disabled item`);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  assert.equal(await isActive(destroy), true, `${id} menu skips disabled`);
  await page.keyboard.press('ArrowDown');
  assert.equal(await isActive(edit), true, `${id} menu wraps`);
  await page.keyboard.press('End');
  assert.equal(await isActive(destroy), true, `${id} menu End`);
  await page.keyboard.press('Home');
  assert.equal(await isActive(edit), true, `${id} menu Home`);
  await page.keyboard.type('du');
  assert.equal(await isActive(item('Duplicate')), true, `${id} menu typeahead`);
  await page.waitForTimeout(550);
  await page.keyboard.press('Enter');
  await menu.waitFor({ state: 'hidden' });
  assert.equal(await result.textContent(), 'duplicate', `${id} menu Enter`);
  assert.equal(await isActive(menuTrigger), true, `${id} menu restores focus`);
  await page.keyboard.press('ArrowUp');
  await menu.waitFor();
  assert.equal(await isActive(destroy), true, `${id} menu opens at the last item`);
  await page.keyboard.press('Space');
  await menu.waitFor({ state: 'hidden' });
  assert.equal(await result.textContent(), 'delete', `${id} menu Space`);
  await page.keyboard.press('Enter');
  await menu.waitFor();
  assert.equal(await isActive(edit), true, `${id} keyboard click opens at the first item`);
  await page.keyboard.press('Escape');
  await menu.waitFor({ state: 'hidden' });
  assert.equal(await isActive(menuTrigger), true, `${id} menu Escape`);
  await menuTrigger.click();
  await menu.waitFor();
  assert.equal(await isActive(menu), true, `${id} pointer open focuses the menu`);
  await edit.hover();
  assert.equal(await style(edit, 'backgroundColor'), rgb(roles.surfaceContainerHover), `${id} hover highlights`);
  assert.equal(await style(edit, 'outlineStyle'), 'none', `${id} hover is not keyboard focus`);
  await archive.click({ force: true });
  assert.equal(await menu.isVisible(), true, `${id} disabled item keeps the menu open`);
  assert.equal(await result.textContent(), 'delete', `${id} disabled item does not activate`);
  await page.mouse.click(2, 2);
  await menu.waitFor({ state: 'hidden' });
  await press(menuTrigger, 'ArrowDown');
  await menu.waitFor();
  await page.keyboard.press('Tab');
  await menu.waitFor({ state: 'hidden' });
  report.overlays += 6;

  const flowTrigger = part('flow-trigger');
  const flow = part('flow');
  const confirm = part('flow-dialog');
  await press(flowTrigger, 'ArrowDown');
  await flow.waitFor();
  await page.keyboard.press('Enter');
  await confirm.waitFor();
  assert.equal(await flow.isVisible(), false, `${id} menu closes before the dialog`);
  await page.keyboard.press('Escape');
  await confirm.waitFor({ state: 'hidden' });
  assert.equal(await isActive(flowTrigger), true, `${id} focus returns through dialog and menu`);
  report.overlays += 1;
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function certifyBrowser(url, directory, evidence) {
  const engine = await import(pathToFileURL(join(directory, 'node_modules/@corefoundry-labs/forge-tokens/dist/theme-v2/index.js')).href);
  const axeSource = readFileSync(join(directory, 'node_modules/axe-core/axe.min.js'), 'utf8');
  const browser = await chromium.launch({ headless: true });
  const report = { scopes: 0, states: 0, feedback: 0, controls: 0, display: 0, overlays: 0, checks: 0, minimumText: Infinity, minimumBoundary: Infinity, minimumFocus: Infinity, axeViolations: 0, axeRulesPassed: 0 };
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) errors.push(message.text());
    });
    await page.goto(url);
    await page.getByTestId('default-primary').waitFor();

    const style = (id, property) => page.getByTestId(id).evaluate((element, key) => getComputedStyle(element)[key], property);
    for (const [size, height] of Object.entries(sizes)) {
      assert.equal(await style(`size-${size}`, 'height'), height);
      assert.equal(await style(`size-${size}`, 'borderTopLeftRadius'), '10px');
      assert.equal(await style(`icon-${size}`, 'height'), height);
      assert.equal(await style(`icon-${size}`, 'width'), height);
      assert.equal(await page.getByRole('button', { name: `Search ${size}` }).count(), 1);
      assert.equal(await page.getByTestId(`icon-${size}`).locator('svg').evaluate((element) => getComputedStyle(element).width), '16px');
    }
    assert.equal(await page.getByTestId('typed').getAttribute('type'), 'button');
    assert.equal(await style('badge-sm', 'height'), '24px');
    assert.equal(await style('badge-sm', 'fontSize'), '11px');
    assert.equal(await style('badge-md', 'height'), '30px');
    assert.equal(await style('badge-md', 'fontSize'), '12px');
    assert.equal(await style('badge-md', 'borderTopLeftRadius'), '999px');
    assert.equal(await page.getByTestId('badge-long').evaluate((element) => { const label = element.firstElementChild; return label.scrollWidth > label.clientWidth && element.getBoundingClientRect().width <= 80; }), true, 'a long badge must truncate inside its container');
    for (const [size, height] of Object.entries(sizes)) {
      for (const name of ['text', 'select']) {
        assert.equal(await style(`${name}-${size}`, 'height'), height, `${name} ${size} height`);
        assert.equal(await style(`${name}-${size}`, 'borderTopLeftRadius'), '10px', `${name} ${size} radius`);
        assert.equal(await style(`${name}-${size}`, 'paddingLeft'), '12px', `${name} ${size} padding`);
      }
    }

    for (const [size, width] of [['sm', '350px'], ['md', '445px'], ['lg', '560px']]) {
      await page.getByTestId(`size-dialog-${size}-open`).click();
      await page.getByTestId(`size-dialog-${size}`).waitFor();
      assert.equal(await style(`size-dialog-${size}`, 'width'), width, `dialog ${size} width`);
      await page.keyboard.press('Escape');
      await page.getByTestId(`size-dialog-${size}`).waitFor({ state: 'hidden' });
    }
    for (const [id, width] of [['width-compact', '250px'], ['width-regular', '312px'], ['density-compact', '232px'], ['density-comfortable', '264px']]) {
      await page.getByTestId(`${id}-trigger`).click();
      await page.getByTestId(id).waitFor();
      assert.equal(await style(id, 'width'), width, `${id} width`);
      await page.keyboard.press('Escape');
      await page.getByTestId(id).waitFor({ state: 'hidden' });
    }
    await page.getByTestId('typed-tooltip-trigger').hover();
    await page.getByTestId('typed-tooltip').waitFor();
    assert.equal(await page.getByTestId('typed-tooltip').evaluate((element) => parseFloat(getComputedStyle(element).width) <= 215), true, 'tooltip max width');
    await page.mouse.move(0, 0);
    await page.getByTestId('typed-tooltip').waitFor({ state: 'hidden' });

    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    assert.equal(await style('size-md', 'fontFamily'), body, 'ButtonV2 must inherit the consumer font family');
    for (const id of ['text-md', 'select-md', 'typed-card', 'typed-badge', 'typed-alert', 'typed-tabs']) assert.equal(await style(id, 'fontFamily'), body, `${id} must inherit the consumer font family`);

    assert.equal(await page.locator('html').evaluate((element) => getComputedStyle(element).colorScheme), 'light', 'V2 stylesheet must not override the V1 color scheme');
    assert.equal(await style('v1-button', 'backgroundColor'), rgb(await page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--forge-accent').trim())), 'V1 Button color changed');

    await certifyScope(page, 'default', engine.createTheme(engine.presets.forge).roles, report);
    await certifyControls(page, 'default', engine.createTheme(engine.presets.forge).roles, engine.geometry, report);
    await certifyDisplay(page, 'default', engine.createTheme(engine.presets.forge).roles, engine.geometry, report);
    await certifyOverlays(page, 'default', engine.createTheme(engine.presets.forge).roles, engine.geometry, report);
    report.scopes += 1;
    for (const preset of presets) {
      for (const mode of modes) {
        const { roles } = engine.createTheme({ ...engine.presets[preset], mode });
        await certifyScope(page, `${preset}-${mode}`, roles, report);
        await certifyControls(page, `${preset}-${mode}`, roles, engine.geometry, report);
        await certifyDisplay(page, `${preset}-${mode}`, roles, engine.geometry, report);
        await certifyOverlays(page, `${preset}-${mode}`, roles, engine.geometry, report);
        report.scopes += 1;
      }
    }
    assert.equal(await style('default-primary-loading', 'cursor'), 'progress');
    assert.equal(await page.getByTestId('default-primary-loading').locator('[data-button-spinner]').evaluate((element) => getComputedStyle(element).animationName), 'none', 'reduced motion must stop the spinner');

    await page.addScriptTag({ content: axeSource });
    const openAxe = async (testId) => page.getByTestId(testId).evaluate(async (element) => {
      const result = await window.axe.run(element, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
      return { violations: result.violations.map((rule) => rule.id), incomplete: result.incomplete.map((rule) => `${rule.id}: ${rule.nodes.map((node) => node.html.slice(0, 80)).join(' | ')}`) };
    });
    for (const scope of ['forge-light', 'forge-dark', 'neutral-high-contrast']) {
      for (const [open, panel] of [['dialog-open', 'dialog'], ['popover-trigger', 'popover'], ['menu-trigger', 'menu']]) {
        await page.getByTestId(`${scope}-${open}`).focus();
        await page.keyboard.press('Enter');
        await page.getByTestId(`${scope}-${panel}`).waitFor();
        const result = await openAxe(`${scope}-${panel}`);
        assert.deepEqual(result.violations, [], `axe found violations in the open ${scope} ${panel}`);
        assert.deepEqual(result.incomplete, [], `axe could not resolve the open ${scope} ${panel}`);
        await page.keyboard.press('Escape');
        await page.getByTestId(`${scope}-${panel}`).waitFor({ state: 'hidden' });
        report.openAxeRuns = (report.openAxeRuns ?? 0) + 1;
      }
    }
    const axe = await page.evaluate(async () => {
      const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
      return {
        passes: result.passes.map((rule) => rule.id),
        incomplete: result.incomplete.map((rule) => ({
          id: rule.id,
          nodes: rule.nodes.length,
          reasons: Object.entries(Object.groupBy(rule.nodes, (node) => node.any[0]?.data?.messageKey ?? 'unknown')).map(([reason, nodes]) => `${reason}: ${nodes.length} (${nodes[0].target.join(' ')} "${nodes[0].html.slice(0, 80)}")`),
        })),
        violations: result.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => `${node.target.join(' ')} ${node.failureSummary ?? ''}`.slice(0, 220)) })),
      };
    });
    report.axeViolations = axe.violations.length;
    report.axeRulesPassed = axe.passes.length;
    report.axeIncomplete = axe.incomplete;
    assert.deepEqual(axe.violations, [], 'axe found WCAG violations');
    assert.deepEqual(axe.incomplete, [], 'axe could not resolve every rule');
    assert.ok(axe.passes.includes('color-contrast'), 'axe must evaluate color contrast');

    await page.setViewportSize({ width: 375, height: 800 });
    const inside = (id) => page.getByTestId(id).evaluate((element) => {
      const { left, right, top, bottom } = element.getBoundingClientRect();
      return left >= 16 && right <= document.documentElement.clientWidth - 16 && top >= 16 && bottom <= window.innerHeight - 16;
    });
    await page.getByTestId('size-dialog-lg-open').click();
    await page.getByTestId('size-dialog-lg').waitFor();
    assert.equal(await inside('size-dialog-lg'), true, 'a large dialog keeps its gutters at 375px');
    await page.keyboard.press('Escape');
    await page.getByTestId('size-dialog-lg').waitFor({ state: 'hidden' });
    for (const id of ['width-regular', 'density-comfortable']) {
      await page.getByTestId(`${id}-trigger`).click();
      await page.getByTestId(id).waitFor();
      assert.equal(await inside(id), true, `${id} stays in the viewport at 375px`);
      await page.keyboard.press('Escape');
      await page.getByTestId(id).waitFor({ state: 'hidden' });
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'horizontal overflow at 375px');
    assert.deepEqual(errors, [], 'browser console reported problems');

    if (evidence) {
      await mkdir(evidenceDirectory, { recursive: true });
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.getByTestId('forge-light').screenshot({ path: join(evidenceDirectory, 'forge-light.png') });
      await page.getByTestId('forge-high-contrast').screenshot({ path: join(evidenceDirectory, 'forge-high-contrast.png') });
    }

    const motion = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const animated = await motion.newPage();
    await animated.goto(url);
    await animated.getByTestId('default-primary-loading').waitFor();
    assert.notEqual(await animated.getByTestId('default-primary-loading').locator('[data-button-spinner]').evaluate((element) => getComputedStyle(element).animationName), 'none', 'spinner must animate by default');
  } finally {
    await browser.close();
  }
  return report;
}

export async function runV2ConsumerCertification({ evidence = false } = {}) {
  const work = await mkdtemp(join(tmpdir(), 'corefoundry-v2-consumer-'));
  assert.ok(!realpathSync(work).startsWith(`${root}${sep}`), 'the consumer must live outside the monorepo');
  const consumer = join(work, 'consumer');
  await mkdir(consumer, { recursive: true });
  let preview;
  try {
    const { archives, version } = packArchives(work);
    await installConsumer(consumer, archives, version);
    await writeConsumer(consumer);

    const tsc = join('node_modules', 'typescript', 'bin', 'tsc');
    run(process.execPath, [tsc, '--project', 'tsconfig.json'], consumer);
    const negative = spawnSync(process.execPath, [tsc, '--project', 'tsconfig.negative.json'], { cwd: consumer, encoding: 'utf8' });
    assert.notEqual(negative.status, 0, 'the negative consumer must not compile');
    for (const line of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
      assert.ok(`${negative.stdout}${negative.stderr}`.includes(`negative.tsx(${line},`), `negative.tsx line ${line} must be rejected`);
    }

    const vite = join('node_modules', 'vite', 'bin', 'vite.js');
    run(process.execPath, [vite, 'build'], consumer);
    const port = await freePort();
    preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: consumer, stdio: 'ignore' });
    const url = `http://127.0.0.1:${port}/`;
    await waitForServer(url);
    const report = await certifyBrowser(url, consumer, evidence);
    const result = {
      version,
      installedFrom: 'npm pack tarballs, no workspace links',
      production: 'vite build + vite preview in Chromium',
      typeChecks: ['strict consumer compiled', 'icon-only ButtonV2 without aria-label rejected', 'unnamed CheckboxV2 and SwitchV2 rejected', 'numeric TextInputV2 size rejected', 'SelectV2 multiple rejected', 'static CardV2 with onClick, disabled, href or as button rejected', 'empty AlertV2 rejected', 'unnamed TabsV2 rejected', 'unknown BadgeV2 tone rejected', 'untitled DialogV2 rejected', 'DialogV2 without Escape or footer rejected', 'interactive TooltipV2 content rejected', 'unnamed or unanchored PopoverV2 rejected', 'unlabeled DropdownMenuV2 item and missing trigger rejected'],
      ...report,
      minimumText: Number(report.minimumText.toFixed(2)),
      minimumBoundary: Number(report.minimumBoundary.toFixed(2)),
      minimumFocus: Number(report.minimumFocus.toFixed(2)),
      result: 'passed',
    };
    if (evidence) await writeFile(join(evidenceDirectory, 'certification.json'), `${JSON.stringify(result, null, 2)}\n`);
    return result;
  } finally {
    preview?.kill();
    await rm(work, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 }).catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await runV2ConsumerCertification({ evidence: process.argv.includes('--evidence') });
    console.log(`V2 consumer certification passed: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
