import { spawnSync } from 'node:child_process';

const packages = ['@forge-org/tokens', '@forge-org/icons', '@forge-org/ui'];
if (!process.env.NODE_AUTH_TOKEN) {
  throw new Error('NODE_AUTH_TOKEN is required; no package was published');
}

for (const packageName of packages) {
  const result = spawnSync('npm', ['publish', '--workspace', packageName, '--access', 'public', '--provenance=false'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
