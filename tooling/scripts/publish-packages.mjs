import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const registry = 'https://registry.npmjs.org';
const shell = process.platform === 'win32';
const directories = ['tokens', 'icons', 'ui'];

const isPublished = (name, version) => {
  const result = spawnSync('npm', ['view', `${name}@${version}`, 'version', '--registry', registry], { encoding: 'utf8', shell });
  return result.stdout.trim() === version;
};

for (const directory of directories) {
  const { name, version } = JSON.parse(readFileSync(`packages/${directory}/package.json`, 'utf8'));
  if (isPublished(name, version)) {
    console.log(`${name}@${version} is already published`);
    continue;
  }
  const result = spawnSync('npm', ['publish', '--workspace', name, '--registry', registry, '--access', 'public'], { stdio: 'inherit', shell });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
