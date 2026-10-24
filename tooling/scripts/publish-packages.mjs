import { spawnSync } from 'node:child_process';

const packages = ['@corefoundry-labs/forge-tokens', '@corefoundry-labs/forge-icons', '@corefoundry-labs/forge-ui'];
for (const packageName of packages) {
  const result = spawnSync('npm', ['publish', '--workspace', packageName, '--access', 'public'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
