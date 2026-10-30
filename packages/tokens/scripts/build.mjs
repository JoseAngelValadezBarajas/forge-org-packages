import { execFileSync } from 'node:child_process';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, [join(packageRoot, 'scripts', 'generate-tokens.mjs')], {
  cwd: packageRoot,
  stdio: 'inherit',
});
const dist = join(packageRoot, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(packageRoot, 'src', 'tokens.css'), join(dist, 'tokens.css'));
await writeFile(
  join(dist, 'tokens.css.d.ts'),
  'declare const stylesheet: string;\nexport default stylesheet;\n',
);
await cp(join(packageRoot, 'tokens.json'), join(dist, 'tokens.json'));
execFileSync(process.execPath, [resolve(packageRoot, '../../node_modules/typescript/bin/tsc'), '--project', join(packageRoot, 'tsconfig.theme-v2.json')], {
  cwd: packageRoot,
  stdio: 'inherit',
});
