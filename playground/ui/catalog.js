// Public component inventory. Input is a compatibility alias, not another component.
const groups = {
  Actions: [
    ['ButtonV2', 'A reusable action driven by Theme Engine roles.', '<ButtonV2 variant="primary" size="md" onClick={save}>Continue</ButtonV2>', 'const save = () => {};'],
    ['Button', 'Clear actions, from primary to quiet.', '<Button onClick={() => setCount(count + 1)}>Add task</Button>', 'const [count, setCount] = useState(0);'],
    ['IconButton', 'Compact actions with an accessible name.', '<IconButton aria-label="Favorite" aria-pressed={favorite} onClick={() => setFavorite(!favorite)}>★</IconButton>', 'const [favorite, setFavorite] = useState(false);'],
  ],
  Forms: [
    ['TextInputV2', 'A native text primitive driven by Theme Engine roles.', '<TextInputV2 aria-label="Project name" size="md" value={name} onChange={e => setName(e.target.value)} />', 'const [name, setName] = useState("Atlas");'],
    ['SelectV2', 'A native select trigger driven by Theme Engine roles.', '<SelectV2 aria-label="Environment" value={env} onChange={e => setEnv(e.target.value)}><option value="">Choose an option</option><option>Production</option></SelectV2>', 'const [env, setEnv] = useState("");'],
    ['CheckboxV2', 'A native checkbox with a 44 px target and mixed state.', '<CheckboxV2 checked={checked} onChange={e => setChecked(e.target.checked)}>Email updates</CheckboxV2>', 'const [checked, setChecked] = useState(true);'],
    ['SwitchV2', 'A native switch with a 44 px target.', '<SwitchV2 checked={enabled} onChange={e => setEnabled(e.target.checked)}>Notifications</SwitchV2>', 'const [enabled, setEnabled] = useState(true);'],
    ['TextInput','Single-line text. Also exported as Input.', '<TextInput aria-label="Project name" value={name} onChange={e => setName(e.target.value)} />', 'const [name, setName] = useState("Atlas");'],
    ['Textarea', 'Room for context and longer descriptions.', '<Textarea aria-label="Description" value={text} onChange={e => setText(e.target.value)} />', 'const [text, setText] = useState("A new workspace.");'],
    ['Checkbox', 'An independent, explicit choice.', '<label><Checkbox checked={checked} onChange={e => setChecked(e.target.checked)} /> Email updates</label>', 'const [checked, setChecked] = useState(true);'],
    ['Radio', 'One choice from a related group.', '<label><Radio name="plan" checked={plan === "team"} onChange={() => setPlan("team")} /> Team</label>', 'const [plan, setPlan] = useState("personal");'],
    ['Switch', 'A setting that takes effect immediately.', '<label><Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Notifications</label>', 'const [enabled, setEnabled] = useState(true);'],
    ['Select', 'A familiar native single selection.', '<Select aria-label="Environment" value={env} onChange={e => setEnv(e.target.value)}><option>Development</option><option>Production</option></Select>', 'const [env, setEnv] = useState("Development");'],
    ['MultiSelect', 'Select several options with checkbox rows.', '<MultiSelect label="Teams" presentation="checkboxList" options={[{value:"design",label:"Design"},{value:"engineering",label:"Engineering"}]} value={teams} onValuesChange={setTeams} />', 'const [teams, setTeams] = useState(["design"]);'],
    ['SearchField', 'Search text with a working clear action.', '<SearchField aria-label="Search projects" value={query} onChange={e => setQuery(e.target.value)} clearable onClear={() => setQuery("")} />', 'const [query, setQuery] = useState("");'],
    ['FilePicker', 'Choose a local file; nothing is uploaded.', '<FilePicker title="Choose attachment" metadata={file} state={file ? "selected" : "empty"} onChange={e => setFile(e.target.files?.[0]?.name ?? "")} />', 'const [file, setFile] = useState("");'],
    ['FormField', 'A label, helpful hint, and connected control.', '<FormField label="Workspace" htmlFor="workspace" hint="Visible to your team."><TextInput id="workspace" defaultValue="Atlas" /></FormField>', '', ['TextInput']],
    ['FormActions', 'Consistent save and cancel actions.', '<FormActions onSave={() => setMessage("Saved locally")} onCancel={() => setMessage("Changes discarded")} />', 'const [message, setMessage] = useState("");'],
  ],
  Navigation: [
    ['TabsV2', 'An accessible tablist with panels, driven by Theme Engine roles.', '<TabsV2 aria-label="Project views" value={view} onValueChange={setView} items={[{id:"overview",label:"Overview",content:"Project overview"},{id:"activity",label:"Activity",content:"No recent activity"}]} />', 'const [view, setView] = useState("overview");'],
    ['Tabs', 'Keyboard-friendly views in the same context.', '<Tabs label="Project views" tabs={[{id:"overview",label:"Overview",content:"Project overview"},{id:"activity",label:"Activity",content:"No recent activity"}]} />'],
    ['Breadcrumbs', 'A readable path through your workspace.', '<Breadcrumbs items={[{label:"Library",href:"#catalog"},{label:"Components"}]} />'],
    ['MenuItem', 'Selection and actions inside a menu.', '<div role="menu" aria-label="Project menu"><MenuItem selected={selected} onSelect={() => setSelected(!selected)}>Pin project</MenuItem></div>', 'const [selected, setSelected] = useState(false);'],
    ['StepperStep', 'Show progress through a short workflow.', '<ol><StepperStep index={1} label="Details" state="complete" /><StepperStep index={2} label="Review" state="current" /></ol>'],
  ],
  Surfaces: [
    ['CardV2', 'A layout surface with slots and an optional interactive style.', '<CardV2 variant="outlined" header="Atlas workspace" footer="Updated today">A home for your next idea.</CardV2>'],
    ['Card', 'A calm container for related content.', '<Card variant="elevated"><h3>Atlas workspace</h3><p>A home for your next idea.</p></Card>'],
    ['MetricCard', 'A number with enough context to mean something.', '<MetricCard label="Active projects" value="24" detail="Across 3 workspaces" />'],
  ],
  Status: [
    ['BadgeV2', 'A compact status, category or count label.', '<BadgeV2 tone="success" variant="subtle" size="md">Completed</BadgeV2>'],
    ['Badge', 'Small labels for count and classification.', '<Badge tone="accent">Design system</Badge>'],
    ['StatusChip', 'Communicate state at a glance.', '<StatusChip tone="success">Ready</StatusChip>'],
  ],
  Feedback: [
    ['AlertV2', 'Contextual feedback with tones, actions and dismiss.', '<AlertV2 tone="info" variant="soft" title="New version" description="Reload to get the latest changes." />'],
    ['Alert', 'Contextual information that stays in view.', '<Alert tone="info" heading="Preview workspace" message="Changes in this demo stay on this page." />'],
    ['StatePanel', 'A unified V1 panel for content states.', '<StatePanel kind="readOnly" title="View-only workspace" description="You can review every project." />'],
    ['Progress', 'Make a measurable operation understandable.', '<Progress label="Demo progress" value={progress} max={100} />', 'const [progress, setProgress] = useState(40);'],
    ['Tooltip', 'Extra context on hover or keyboard focus.', '<Tooltip content="Saved on this page only"><button type="button" onClick={() => setSaved(true)}>Save draft</button></Tooltip>', 'const [saved, setSaved] = useState(false);'],
    ['Skeleton', 'A quiet placeholder while content is loading.', '<Skeleton kind="list" />'],
    ['Toast', 'A brief confirmation after a local action.', '<Toast tone="success">Draft saved locally</Toast>'],
    ['EmptyState', 'Explain the first step in an empty space.', '<EmptyState title="No projects yet" description="Your next idea starts here." />'],
    ['LoadingState', 'A clear, accessible loading indicator.', '<LoadingState label="Loading projects" />'],
    ['ErrorState', 'Explain what happened and how to recover.', '<ErrorState title="Could not load projects" description="Try again when you are ready." />'],
    ['FeedbackStateV2', 'Four content states using scoped semantic colors.', '<FeedbackStateV2 state="empty" title="No projects yet" description="Create your first project." headingLevel={3} />'],
  ],
  'Data display': [
    ['RecordRow', 'A record, its metadata, and its current state.', '<RecordRow title="Atlas" metadata="Updated just now" status={<StatusChip tone="success">Ready</StatusChip>} />', '', ['StatusChip']],
    ['KeyValueRow', 'Readable pairs of labels and values.', '<KeyValueRow label="Environment" value="Development" />'],
    ['TableRow', 'Semantic cells for your own table composition.', '<table><caption>Projects</caption><tbody><TableRow cells={["Atlas", "Ready"]} /></tbody></table>'],
    ['Table', 'Structured data with native table semantics.', '<Table caption="Projects" columns={[{key:"name",label:"Name"},{key:"status",label:"Status"}]} rows={[{name:"Atlas",status:"Ready"},{name:"Orbit",status:"Draft"}]} />'],
  ],
  Overlays: [
    ['DialogV2', 'A modal surface with focus containment and scroll lock.', '<><ButtonV2 onClick={() => setOpen(true)}>Open dialog</ButtonV2><DialogV2 open={open} onOpenChange={setOpen} title="Confirm action" description="Review the details before continuing." footer={<ButtonV2 onClick={() => setOpen(false)}>Continue</ButtonV2>} /></>', 'const [open, setOpen] = useState(false);', ['ButtonV2']],
    ['TooltipV2', 'Short plain text on hover or keyboard focus.', '<TooltipV2 content="Additional information"><ButtonV2 variant="secondary">Focus or hover</ButtonV2></TooltipV2>', '', ['ButtonV2']],
    ['PopoverV2', 'A nonmodal surface anchored to a trigger.', '<PopoverV2 trigger={<ButtonV2 variant="secondary">More options</ButtonV2>} title="Preferences" description="Choose how information is presented." />', '', ['ButtonV2']],
    ['DropdownMenuV2', 'A semantic menu of contextual actions.', '<DropdownMenuV2 trigger={<ButtonV2 variant="secondary">More actions</ButtonV2>} items={[{id:"edit",label:"Edit"},{id:"delete",label:"Delete",destructive:true}]} />', '', ['ButtonV2']],
    ['Dialog', 'A focused decision with native modal behavior.', '<><button onClick={() => setOpen(true)}>Open dialog</button><Dialog open={open} onClose={() => setOpen(false)} title="Review draft" actions={<button onClick={() => setOpen(false)}>Done</button>} /></>', 'const [open, setOpen] = useState(false);'],
    ['Popover', 'Disclosure for useful secondary information.', '<Popover trigger="Workspace details"><p>Atlas · Development</p></Popover>'],
  ],
  Layout: [
    ['SectionHeader', 'Consistent hierarchy for a section of content.', '<SectionHeader eyebrow="Workspace" title="Recent projects" counter="3" headingLevel={3} />'],
    ['Divider', 'Separate adjacent groups without visual noise.', '<div><p>Project details</p><Divider /><p>Team settings</p></div>'],
    ['CodeLabel', 'A compact technical identifier.', '<CodeLabel>project/atlas</CodeLabel>'],
  ],
  Theming: [
    ['ThemeScope', 'A local V2 theme boundary with no global changes.', '<ThemeScope theme={theme}><FeedbackStateV2 state="readOnly" title="Scoped theme" description="Only this subtree receives the theme." /></ThemeScope>', 'const theme = createTheme(presets.forge);', ['FeedbackStateV2']],
  ],
};

export const catalog = Object.entries(groups).flatMap(([category, items]) => items.map(([name, description, jsx, setup = '', imports = []]) => ({
  name, category, description,
  version: name === 'ThemeScope' ? 'V2 theming' : name.endsWith('V2') ? 'V2' : 'V1',
  code: `${setup.includes('useState') ? 'import { useState } from "react";\n' : ''}import { ${[name, ...imports].join(', ')} } from "@corefoundry-labs/forge-ui";\n${name === 'ThemeScope' ? 'import { createTheme, presets } from "@corefoundry-labs/forge-tokens/theme-v2";\n' : ''}\nexport function Example() {\n${setup ? `  ${setup}\n` : ''}  return (\n    ${jsx}\n  );\n}`,
})));
export const categories = Object.keys(groups);
