import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';
import react from '@vitejs/plugin-react';
import * as ts from 'typescript';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const baselinePath = join(root, 'tooling', 'compatibility', 'public-api-baseline-1.0.2.json');
const packageDirectories = {
  '@corefoundry-labs/forge-tokens': 'tokens',
  '@corefoundry-labs/forge-icons': 'icons',
  '@corefoundry-labs/forge-ui': 'ui',
};

function normalizeNames(names) {
  return [...new Set(names)].sort();
}

function compareRecord(label, baseline, candidate, failures, { allowAdditions = false } = {}) {
  baseline ??= {};
  candidate ??= {};
  for (const [key, value] of Object.entries(baseline)) {
    if (candidate[key] !== value) failures.push(`${label} ${key} changed or was removed`);
  }
  if (!allowAdditions) {
    for (const key of Object.keys(candidate)) {
      if (!(key in baseline)) failures.push(`${label} ${key} was added`);
    }
  }
}

function compareDependencyNames(baseline = {}, candidate = {}, failures) {
  for (const name of Object.keys(baseline)) {
    if (!(name in candidate)) failures.push(`runtime dependency ${name} was removed`);
  }
}

export function comparePublicSurface(baseline, candidate) {
  const failures = [];
  if (baseline.name !== candidate.name) failures.push(`package name changed: ${baseline.name}`);

  for (const [subpath, conditions] of Object.entries(baseline.exports)) {
    const current = candidate.exports?.[subpath];
    if (current === undefined) {
      failures.push(`removed public subpath ${subpath}`);
      continue;
    }
    if (conditions && typeof conditions === 'object') {
      for (const condition of Object.keys(conditions)) {
        if (!current || typeof current !== 'object' || !(condition in current)) {
          failures.push(`removed ${condition} condition from public subpath ${subpath}`);
        }
      }
    }
  }

  for (const name of normalizeNames(baseline.runtimeExports)) {
    if (!candidate.runtimeExports.includes(name)) failures.push(`removed runtime export ${name}`);
  }
  for (const name of normalizeNames(baseline.typeExports)) {
    if (!candidate.typeExports.includes(name)) failures.push(`removed type export ${name}`);
  }
  for (const [name, source] of Object.entries(baseline.aliases)) {
    if (candidate.aliases[name] !== source) failures.push(`removed or changed compatibility alias ${name}`);
  }

  compareRecord('peer dependency contract', baseline.peerDependencies, candidate.peerDependencies, failures);
  compareDependencyNames(baseline.dependencies, candidate.dependencies, failures);
  compareRecord('public CSS token', baseline.cssVariables, candidate.cssVariables, failures, { allowAdditions: true });
  compareRecord('public token value', baseline.tokenValues, candidate.tokenValues, failures, { allowAdditions: true });
  return failures;
}

function parseExports(source) {
  const exports = [];
  const pattern = /^export\s+(type\s+)?\{([^}]+)\}/gm;
  for (const match of source.matchAll(pattern)) {
    for (const item of match[2].split(',')) {
      const declaration = item.trim();
      if (!declaration) continue;
      const [sourceName, exportedName] = declaration.split(/\s+as\s+/);
      exports.push({
        name: (exportedName ?? sourceName).trim(),
        source: sourceName.trim(),
        typeOnly: Boolean(match[1]),
      });
    }
  }
  return exports;
}

function flattenValues(value, prefix = '', output = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, nested] of Object.entries(value)) {
      flattenValues(nested, prefix ? `${prefix}.${key}` : key, output);
    }
  } else {
    output[prefix] = value;
  }
  return output;
}

function readCssVariables(css) {
  const values = {};
  for (const block of css.matchAll(/([^{}]+)\{([^{}]*)\}/gs)) {
    const selector = block[1].replace(/\s+/g, ' ').trim();
    for (const property of block[2].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      values[`${selector} ${property[1]}`] = property[2].trim();
    }
  }
  return values;
}

function exportTargets(value) {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(exportTargets);
}

async function loadSurface(packageRoot) {
  const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  const rootExport = manifest.exports?.['.'];
  const runtimeEntry = rootExport && typeof rootExport === 'object' ? rootExport.import : undefined;
  const typeEntry = rootExport && typeof rootExport === 'object' ? rootExport.types : undefined;
  const runtimeSource = runtimeEntry ? await readFile(join(packageRoot, runtimeEntry), 'utf8') : '';
  const typeSource = typeEntry ? await readFile(join(packageRoot, typeEntry), 'utf8') : '';
  const parsedTypes = parseExports(typeSource);
  const cssVariables = {};
  for (const [subpath, value] of Object.entries(manifest.exports ?? {})) {
    if (!subpath.endsWith('.css')) continue;
    const cssPath = value && typeof value === 'object' ? value.default : value;
    if (typeof cssPath === 'string') {
      Object.assign(cssVariables, readCssVariables(await readFile(join(packageRoot, cssPath), 'utf8')));
    }
  }

  let tokenValues = {};
  const tokenPath = manifest.exports?.['./tokens.json'];
  if (typeof tokenPath === 'string') {
    tokenValues = flattenValues(JSON.parse(await readFile(join(packageRoot, tokenPath), 'utf8')));
  }

  for (const [subpath, exportValue] of Object.entries(manifest.exports ?? {})) {
    for (const target of exportTargets(exportValue)) {
      assert.ok(target.startsWith('./'), `${manifest.name} export ${subpath} has an unsafe target ${target}`);
      await readFile(join(packageRoot, target));
    }
  }

  return {
    name: manifest.name,
    version: manifest.version,
    exports: manifest.exports ?? {},
    runtimeExports: parseExports(runtimeSource)
      .filter(({ typeOnly }) => !typeOnly)
      .map(({ name }) => name),
    typeExports: parsedTypes.filter(({ typeOnly }) => typeOnly).map(({ name }) => name),
    aliases: Object.fromEntries(parsedTypes.filter(({ name, source }) => name !== source).map(({ name, source }) => [name, source])),
    peerDependencies: manifest.peerDependencies ?? {},
    dependencies: manifest.dependencies ?? {},
    cssVariables,
    tokenValues,
  };
}

async function readBaseline() {
  const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
  assert.equal(Object.keys(baseline.packages).length, 3, 'baseline must contain all three npm packages');
  for (const [name, entry] of Object.entries(baseline.packages)) {
    assert.equal(entry.version, '1.0.2', `${name} baseline version must remain 1.0.2`);
    assert.match(entry.integrity, /^sha512-[A-Za-z0-9+/]+=*$/);
    assert.ok(entry.tarball.startsWith(`${baseline.registry}/`));
  }
  return baseline;
}

function verifyIntegrity(bytes, integrity, label) {
  const [algorithm, expected] = integrity.split('-', 2);
  const actual = createHash(algorithm).update(bytes).digest('base64');
  assert.equal(actual, expected, `${label} does not match its pinned npm integrity`);
}

async function downloadBaseline(baseline, archiveDirectory) {
  const archives = {};
  await mkdir(archiveDirectory, { recursive: true });
  for (const [name, entry] of Object.entries(baseline.packages)) {
    const response = await fetch(entry.tarball);
    assert.equal(response.ok, true, `could not download ${name}@${entry.version}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    verifyIntegrity(bytes, entry.integrity, `${name}@${entry.version}`);
    const filename = `${packageDirectories[name]}-baseline-${entry.version}.tgz`;
    const destination = join(archiveDirectory, filename);
    await writeFile(destination, bytes);
    archives[name] = destination;
  }
  return archives;
}

function runNpm(args, options = {}) {
  const npmExecPath = process.env.npm_execpath;
  assert.ok(npmExecPath, 'run the compatibility gate through npm so npm_execpath is available');
  const result = spawnSync(process.execPath, [npmExecPath, ...args], {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`npm ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

async function packCandidate(archiveDirectory, baseline) {
  const archives = {};
  for (const name of Object.keys(baseline.packages)) {
    const output = runNpm(['pack', `--workspace=${name}`, '--json', `--pack-destination=${archiveDirectory}`]);
    const [packed] = JSON.parse(output);
    assert.equal(packed.name, name);
    const destination = join(archiveDirectory, packed.filename);
    archives[name] = destination;
  }
  return archives;
}

async function extractArchives(archives, destinationRoot) {
  await mkdir(destinationRoot, { recursive: true });
  const packageRoots = {};
  for (const [name, archive] of Object.entries(archives)) {
    const destination = join(destinationRoot, packageDirectories[name]);
    await mkdir(destination, { recursive: true });
    execFileSync('tar', ['-xzf', archive, '-C', destination], { stdio: 'pipe' });
    packageRoots[name] = join(destination, 'package');
  }
  return packageRoots;
}

async function installConsumer(rootDirectory, archives, packageLabel, lock) {
  const consumerDirectory = join(rootDirectory, packageLabel);
  await mkdir(consumerDirectory, { recursive: true });
  const dependencies = Object.fromEntries(
    Object.entries(archives).map(([name, archive]) => [
      name,
      `file:${relative(consumerDirectory, archive).replaceAll('\\', '/')}`,
    ]),
  );
  const versions = lock.packages;
  dependencies.react = versions['node_modules/react'].version;
  dependencies['react-dom'] = versions['node_modules/react-dom'].version;
  const manifest = {
    name: `fds-compatibility-${packageLabel}`,
    private: true,
    type: 'module',
    dependencies,
    devDependencies: {
      '@types/react': versions['node_modules/@types/react'].version,
      '@types/react-dom': versions['node_modules/@types/react-dom'].version,
    },
  };
  await writeFile(join(consumerDirectory, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  runNpm(
    [
      'install',
      '--prefix',
      consumerDirectory,
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-package-lock',
      '--registry=https://registry.npmjs.org',
    ],
  );
  return consumerDirectory;
}

function allTypeScriptConfig() {
  return {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: false,
      noEmit: true,
      resolveJsonModule: true,
      allowSyntheticDefaultImports: true,
      allowArbitraryExtensions: true,
      ignoreDeprecations: '6.0',
    },
    include: ['src/legacy-consumer.tsx'],
  };
}

function consumerSource(baseline) {
  const entries = baseline.packages;
  const tokensName = '@corefoundry-labs/forge-tokens';
  const iconsName = '@corefoundry-labs/forge-icons';
  const uiName = '@corefoundry-labs/forge-ui';
  const icons = entries[iconsName];
  const ui = entries[uiName];
  return `
import * as React from 'react';
import '@corefoundry-labs/forge-tokens/tokens.css';
import '@corefoundry-labs/forge-ui/styles.css';
import tokens from '@corefoundry-labs/forge-tokens/tokens.json';
import tokenManifest from '@corefoundry-labs/forge-tokens/package.json';
import iconManifest from '@corefoundry-labs/forge-icons/package.json';
import uiManifest from '@corefoundry-labs/forge-ui/package.json';
import { ${icons.runtimeExports.join(', ')} } from '${iconsName}';
import type { ${icons.typeExports.join(', ')} } from '${iconsName}';
import { ${ui.runtimeExports.join(', ')} } from '${uiName}';
import type { ${ui.typeExports.join(', ')} } from '${uiName}';

export const allV1Icons = [${icons.runtimeExports.join(', ')}];
export const allV1Components = [${ui.runtimeExports.join(', ')}];
export const v1ThemeTypes: SystemTheme[] = ['dark', 'light'];
export const iconContract: IconProps = { size: 20, title: 'Add' };
export const buttonContract: ButtonProps = { variant: 'primary', size: 'medium', loading: false };
export const aliasContract: InputProps = { value: 'V1 input', onChange: () => undefined };
export const tokenContract: string = tokens.colors.dark.accent;
export const packageSubpathContract: string[] = [tokenManifest.version, iconManifest.version, uiManifest.version];
export const themeContract: SystemTheme = useSystemTheme();
export const cardContract = <Card as="article" variant="elevated" aria-label="Summary" />;
export const chipContract = <StatusChip tone="reported">Reported</StatusChip>;
export const inputContract = <><Input aria-label="Old Input alias" /><TextInput aria-label="TextInput" /></>;
export const refContract = React.createRef<SVGSVGElement>();
export const usageContract = <><Button onClick={() => undefined}>Save</Button><Table caption="Work items" columns={[]} rows={[]} /><Dialog open={false} title="Details" /></>;
`;
}

function tscResult(consumerDirectory, tsconfigName = 'tsconfig.json') {
  return spawnSync(
    process.execPath,
    [join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '--project', join(consumerDirectory, tsconfigName)],
    { cwd: consumerDirectory, encoding: 'utf8' },
  );
}

async function writeConsumerFixture(consumerDirectory, baseline) {
  await mkdir(join(consumerDirectory, 'src'), { recursive: true });
  await writeFile(join(consumerDirectory, 'src', 'legacy-consumer.tsx'), consumerSource(baseline));
  await writeFile(join(consumerDirectory, 'tsconfig.json'), `${JSON.stringify(allTypeScriptConfig(), null, 2)}\n`);
}

async function isolateCandidateTypePackageIds(consumerDirectory, baseline) {
  for (const name of Object.keys(baseline.packages)) {
    const manifestPath = join(consumerDirectory, 'node_modules', name, 'package.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.version = `${manifest.version}-compat.0`;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

function findSymbol(checker, moduleSymbol, name) {
  const exported = checker.getExportsOfModule(moduleSymbol).find((symbol) => symbol.name === name);
  if (!exported) return undefined;
  return exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
}

function genericArguments(symbol) {
  const declaration = symbol?.declarations?.find(
    (node) => ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node),
  );
  return Array.from({ length: declaration?.typeParameters?.length ?? 0 }, () => 'any');
}

function hasDefaultTypeParameter(symbol) {
  const declaration = symbol?.declarations?.find(
    (node) => ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node),
  );
  return declaration?.typeParameters?.some((parameter) => parameter.default) ?? false;
}

async function writeTypeCompatibility(candidateDirectory, baselineDirectory, baseline) {
  const candidatePackages = join(candidateDirectory, 'node_modules', '@corefoundry-labs');
  const baselinePackages = join(baselineDirectory, 'node_modules', '@corefoundry-labs');
  const paths = {
    '@compat-v1/forge-icons': [join(baselinePackages, 'forge-icons', 'dist', 'index.d.ts')],
    '@compat-v1/forge-ui': [join(baselinePackages, 'forge-ui', 'dist', 'index.d.ts')],
    '@compat-v1/forge-tokens/tokens.css': [join(baselinePackages, 'forge-tokens', 'dist', 'tokens.css.d.ts')],
    '@compat-v1/forge-tokens/tokens.json': [join(baselinePackages, 'forge-tokens', 'dist', 'tokens.json')],
  };
  const source = `import * as LegacyIcons from '@compat-v1/forge-icons';\nimport * as CurrentIcons from '@corefoundry-labs/forge-icons';\nimport * as LegacyUI from '@compat-v1/forge-ui';\nimport * as CurrentUI from '@corefoundry-labs/forge-ui';\n`;
  const filePath = join(candidateDirectory, 'src', 'compatibility.ts');
  await writeFile(filePath, source);
  const options = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: false,
    noEmit: true,
    allowArbitraryExtensions: true,
    ignoreDeprecations: '6.0',
    baseUrl: candidateDirectory,
    paths,
  };
  const probe = ts.createProgram([filePath], options);
  const checker = probe.getTypeChecker();
  const probeSource = probe.getSourceFile(filePath);
  const moduleSymbols = new Map();
  for (const statement of probeSource.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    const symbol = checker.getSymbolAtLocation(statement.moduleSpecifier);
    if (symbol) moduleSymbols.set(specifier, symbol);
  }
  const legacyIcons = moduleSymbols.get('@compat-v1/forge-icons');
  const currentIcons = moduleSymbols.get('@corefoundry-labs/forge-icons');
  const legacyUi = moduleSymbols.get('@compat-v1/forge-ui');
  const currentUi = moduleSymbols.get('@corefoundry-labs/forge-ui');
  assert.ok(legacyIcons && currentIcons && legacyUi && currentUi, 'could not resolve baseline and candidate package types');
  const lines = [
    source.trimEnd(),
    'type IsCompatible<Old, Current> = [Old] extends [Current] ? true : false;',
    'type IsExact<Left, Right> = [Left] extends [Right] ? ([Right] extends [Left] ? true : false) : false;',
    'type Assert<T extends true> = T;',
    'const _compat_systemThemeReturn: LegacyUI.SystemTheme = CurrentUI.useSystemTheme();',
  ];
  const compare = (name, oldModule, currentModule, kind) => {
    const before = findSymbol(checker, oldModule, name);
    const args = kind === 'type' ? genericArguments(before) : [];
    const suffix = args.length ? `<${args.join(', ')}>` : '';
    if (kind === 'runtime') {
      const oldNamespace = oldModule === legacyIcons ? 'LegacyIcons' : 'LegacyUI';
      const currentNamespace = currentModule === currentIcons ? 'CurrentIcons' : 'CurrentUI';
      lines.push(`const _compat_${name}: Assert<IsCompatible<typeof ${oldNamespace}.${name}, typeof ${currentNamespace}.${name}>> = true;`);
      lines.push(`const _compat_signature_${name}: typeof ${oldNamespace}.${name} = ${currentNamespace}.${name};`);
    } else {
      const oldNs = oldModule === legacyIcons ? 'LegacyIcons' : 'LegacyUI';
      const currentNs = currentModule === currentIcons ? 'CurrentIcons' : 'CurrentUI';
      lines.push(`const _compat_${name}: Assert<IsCompatible<${oldNs}.${name}${suffix}, ${currentNs}.${name}${suffix}>> = true;`);
      if (hasDefaultTypeParameter(before)) {
        lines.push(`const _compat_default_${name}: Assert<IsExact<${oldNs}.${name}, ${currentNs}.${name}>> = true;`);
      }
    }
  };
  for (const name of baseline.packages['@corefoundry-labs/forge-icons'].runtimeExports) {
    compare(name, legacyIcons, currentIcons, 'runtime');
  }
  for (const name of baseline.packages['@corefoundry-labs/forge-icons'].typeExports) {
    compare(name, legacyIcons, currentIcons, 'type');
  }
  for (const name of baseline.packages['@corefoundry-labs/forge-ui'].runtimeExports) {
    compare(name, legacyUi, currentUi, 'runtime');
  }
  for (const name of baseline.packages['@corefoundry-labs/forge-ui'].typeExports) {
    compare(name, legacyUi, currentUi, 'type');
  }
  await writeFile(filePath, `${lines.join('\n')}\n`);
  await writeFile(join(candidateDirectory, 'tsconfig.compatibility.json'), `${JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      skipLibCheck: false,
      noEmit: true,
      allowArbitraryExtensions: true,
      ignoreDeprecations: '6.0',
      baseUrl: '.',
      paths: Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, value.map((path) => relative(candidateDirectory, path).replaceAll('\\', '/'))])),
    },
    include: ['src/compatibility.ts'],
  }, null, 2)}\n`);
}

async function browserSmoke(consumerDirectory, baseline) {
  const packageVersions = [];
  for (const name of Object.keys(baseline.packages)) {
    const packageManifestPath = join(consumerDirectory, 'node_modules', name, 'package.json');
    const packageManifest = JSON.parse(await readFile(packageManifestPath, 'utf8'));
    packageVersions.push(packageManifest.version);
  }
  const icons = baseline.packages['@corefoundry-labs/forge-icons'].runtimeExports;
  const ui = baseline.packages['@corefoundry-labs/forge-ui'].runtimeExports;
  const uiSymbols = ui.filter((name) => name !== 'useSystemTheme');
  const source = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import * as UI from '@corefoundry-labs/forge-ui';
import * as Icons from '@corefoundry-labs/forge-icons';
import tokens from '@corefoundry-labs/forge-tokens/tokens.json';
import tokenManifest from '@corefoundry-labs/forge-tokens/package.json';
import iconManifest from '@corefoundry-labs/forge-icons/package.json';
import uiManifest from '@corefoundry-labs/forge-ui/package.json';
import '@corefoundry-labs/forge-tokens/tokens.css';
import '@corefoundry-labs/forge-ui/styles.css';
const everyIcon = [${icons.map((name) => `Icons.${name}`).join(', ')}];
const everyComponent = [${ui.map((name) => `UI.${name}`).join(', ')}];
function App() {
  UI.useSystemTheme();
  return <main data-testid="consumer" data-runtime-count={everyIcon.length + everyComponent.length}>
    <UI.Button>Compatibility action</UI.Button>
    <UI.Input aria-label="V1 Input alias" />
    <UI.StatusChip tone="reported">Reported</UI.StatusChip>
    <UI.Table caption="Work items" columns={[]} rows={[]} />
    <UI.Dialog open={false} title="Details" />
    <span data-testid="token-value">{tokens.colors.dark.accent}</span>
    <span data-testid="package-versions">{[tokenManifest.version, iconManifest.version, uiManifest.version].join(',')}</span>
    <span hidden>{everyIcon.map((Icon, index) => <Icon key={index} aria-hidden="true" />)}</span>
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);
`;
  await mkdir(join(consumerDirectory, 'src'), { recursive: true });
  await writeFile(join(consumerDirectory, 'src', 'browser-smoke.tsx'), source);
  await writeFile(join(consumerDirectory, 'index.html'), '<!doctype html><html data-theme="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/browser-smoke.tsx"></script></body></html>');

  const server = await createServer({
    configFile: false,
    root: consumerDirectory,
    plugins: [react()],
    server: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(server.resolvedUrls.local[0]);
    await page.getByTestId('consumer').waitFor();
    await page.getByRole('button', { name: 'Compatibility action' }).waitFor();
    await page.getByRole('textbox', { name: 'V1 Input alias' }).waitFor();
    assert.equal(await page.getByTestId('token-value').textContent(), '#d8874d');
    assert.equal(await page.getByTestId('package-versions').textContent(), packageVersions.join(','));
    assert.equal(await page.getByText('Reported').textContent(), 'Reported');
    assert.equal(await page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--forge-accent').trim()), '#d8874d');
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server.close();
  }
}

async function runTypecheck(consumerDirectory, config = 'tsconfig.json') {
  const result = tscResult(consumerDirectory, config);
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

async function verifyBaselineSnapshot(baseline, surfaces) {
  for (const [name, pinned] of Object.entries(baseline.packages)) {
    const surface = surfaces[name];
    assert.equal(surface.name, name);
    assert.equal(surface.version, pinned.version);
    assert.deepEqual(surface.exports, pinned.exports, `${name} package exports differ from the pinned npm contract`);
    assert.deepEqual(normalizeNames(surface.runtimeExports), normalizeNames(pinned.runtimeExports), `${name} runtime exports differ from the pinned npm contract`);
    assert.deepEqual(normalizeNames(surface.typeExports), normalizeNames(pinned.typeExports), `${name} type exports differ from the pinned npm contract`);
    assert.deepEqual(surface.aliases, pinned.aliases, `${name} aliases differ from the pinned npm contract`);
    assert.deepEqual(surface.peerDependencies, pinned.peerDependencies, `${name} peer dependencies differ from the pinned npm contract`);
    assert.deepEqual(surface.dependencies, pinned.dependencies, `${name} dependencies differ from the pinned npm contract`);
  }
}

export async function runCompatibilityGate() {
  const baseline = await readBaseline();
  const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
  const work = await mkdtemp(join(tmpdir(), 'corefoundry-compatibility-'));
  const archiveDirectory = join(work, 'archives');
  try {
    const baselineArchives = await downloadBaseline(baseline, archiveDirectory);
    const candidateArchives = await packCandidate(archiveDirectory, baseline);
    const baselineRoots = await extractArchives(baselineArchives, join(work, 'baseline-extracted'));
    const candidateRoots = await extractArchives(candidateArchives, join(work, 'candidate-extracted'));
    const baselineSurfaces = {};
    const candidateSurfaces = {};
    for (const name of Object.keys(baseline.packages)) {
      baselineSurfaces[name] = await loadSurface(baselineRoots[name]);
      candidateSurfaces[name] = await loadSurface(candidateRoots[name]);
    }
    await verifyBaselineSnapshot(baseline, baselineSurfaces);
    for (const name of Object.keys(baseline.packages)) {
      const failures = comparePublicSurface(baselineSurfaces[name], candidateSurfaces[name]);
      assert.deepEqual(failures, [], `${name} breaks its published 1.0.2 surface:\n${failures.join('\n')}`);
    }

    const baselineConsumer = await installConsumer(work, baselineArchives, 'baseline-consumer', lock);
    const candidateConsumer = await installConsumer(work, candidateArchives, 'candidate-consumer', lock);
    await writeConsumerFixture(baselineConsumer, baseline);
    await writeConsumerFixture(candidateConsumer, baseline);

    const baselineTypes = await runTypecheck(baselineConsumer);
    assert.equal(baselineTypes.status, 0, `published 1.0.2 consumer did not compile:\n${baselineTypes.output}`);
    const candidateTypes = await runTypecheck(candidateConsumer);
    assert.equal(candidateTypes.status, 0, `candidate external consumer did not compile:\n${candidateTypes.output}`);

    await browserSmoke(baselineConsumer, baseline);
    await browserSmoke(candidateConsumer, baseline);

    await isolateCandidateTypePackageIds(candidateConsumer, baseline);
    await writeTypeCompatibility(candidateConsumer, baselineConsumer, baseline);
    const typeCompatibility = await runTypecheck(candidateConsumer, 'tsconfig.compatibility.json');
    assert.equal(typeCompatibility.status, 0, `candidate types are incompatible with published 1.0.2:\n${typeCompatibility.output}`);

    const candidateUiRoot = join(candidateConsumer, 'node_modules', '@corefoundry-labs', 'forge-ui');
    const declarationsPath = join(candidateUiRoot, 'dist', 'index.d.ts');
    const declarations = await readFile(declarationsPath, 'utf8');
    const brokenDeclarations = declarations.replace(/^export \{ TextInput as Input \} from .*;\r?\n/m, '');
    assert.notEqual(brokenDeclarations, declarations, 'negative probe could not find the published V1 Input alias');
    try {
      await writeFile(declarationsPath, brokenDeclarations);
      const brokenConsumer = await runTypecheck(candidateConsumer);
      assert.notEqual(brokenConsumer.status, 0, 'compatibility gate accepted an intentionally removed V1 Input alias');
      assert.match(brokenConsumer.output, /Input/, 'negative probe failed for an unrelated reason');
    } finally {
      await writeFile(declarationsPath, declarations);
    }

    const hookDeclarationPath = join(candidateUiRoot, 'dist', 'hooks', 'useSystemTheme.d.ts');
    const hookDeclaration = await readFile(hookDeclarationPath, 'utf8');
    const widenedHookDeclaration = hookDeclaration.replace(
      'useSystemTheme(): SystemTheme;',
      'useSystemTheme(): SystemTheme | undefined;',
    );
    assert.notEqual(widenedHookDeclaration, hookDeclaration, 'negative probe could not find useSystemTheme return type');
    try {
      await writeFile(hookDeclarationPath, widenedHookDeclaration);
      const widenedConsumer = await runTypecheck(candidateConsumer);
      assert.notEqual(widenedConsumer.status, 0, 'compatibility gate accepted a widened V1 hook return type');
      assert.match(widenedConsumer.output, /SystemTheme/, 'return widening probe failed for an unrelated reason');
      const widenedCompatibility = await runTypecheck(candidateConsumer, 'tsconfig.compatibility.json');
      assert.notEqual(
        widenedCompatibility.status,
        0,
        'type comparator accepted a widened V1 hook return type',
      );
    } finally {
      await writeFile(hookDeclarationPath, hookDeclaration);
    }

    const cardDeclarationPath = join(candidateUiRoot, 'dist', 'components', 'surfaces', 'Card', 'Card.d.ts');
    const cardDeclaration = await readFile(cardDeclarationPath, 'utf8');
    const changedCardDefault = cardDeclaration.replace(
      "CardProps<T extends CardElement = 'div'>",
      "CardProps<T extends CardElement = 'article'>",
    );
    assert.notEqual(changedCardDefault, cardDeclaration, 'negative probe could not find CardProps default type argument');
    try {
      await writeFile(cardDeclarationPath, changedCardDefault);
      const changedDefault = await runTypecheck(candidateConsumer, 'tsconfig.compatibility.json');
      assert.notEqual(changedDefault.status, 0, 'type comparator accepted a changed CardProps default type argument');
      assert.match(changedDefault.output, /TS2344/, 'generic default probe failed for an unrelated reason');
    } finally {
      await writeFile(cardDeclarationPath, cardDeclaration);
    }

    return {
      baselinePackages: Object.keys(baseline.packages).length,
      runtimeExports: Object.values(baseline.packages).reduce((count, entry) => count + entry.runtimeExports.length, 0),
      typeExports: Object.values(baseline.packages).reduce((count, entry) => count + entry.typeExports.length, 0),
      consumers: 2,
      negativeProbes: ['removed Input alias rejected', 'widened V1 return type rejected', 'changed generic type default rejected'],
      result: 'passed',
    };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await runCompatibilityGate();
    console.log(`Public compatibility gate passed: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
