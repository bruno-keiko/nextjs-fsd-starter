import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import spawn from 'cross-spawn';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const cli = fileURLToPath(new URL('../bin/next-fsd.mjs', import.meta.url));
const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'next-fsd-generated-')));
const variants = [
  { name: 'frontend', database: false, minimal: false },
  { name: 'database', database: true, minimal: false },
  { name: 'frontend-minimal', database: false, minimal: true },
  { name: 'database-minimal', database: true, minimal: true },
];
const selected = process.argv[2];
if (selected && !variants.some(variant => variant.name === selected)) {
  throw new Error(`Unknown variant: ${selected}`);
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed in ${cwd} (${signal || code})`));
      }
    });
  });
}

try {
  for (const variant of variants.filter(item => !selected || selected === item.name)) {
    const target = path.join(root, variant.name);
    process.stdout.write(`\nChecking generated ${variant.name} project...\n`);
    await run(process.execPath, [cli, variant.name, '--template', repo, '--ai-tool', 'none', ...(variant.database ? ['--include', 'db'] : ['--no-db']), ...(variant.minimal ? ['--minimal'] : [])], root);
    assert.equal(await readFile(path.join(target, 'skills-lock.json'), 'utf8'), await readFile(path.join(repo, 'skills-lock.json'), 'utf8'));
    await run('npx', ['--yes', 'npm@10.9.9', 'ci', '--no-audit', '--no-fund'], target);
    const pkg = JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8'));
    if (!variant.database) {
      const lock = JSON.parse(await readFile(path.join(target, 'package-lock.json'), 'utf8'));
      for (const dependency of ['drizzle-orm', 'pg', 'drizzle-kit', '@electric-sql/pglite-socket']) {
        assert.equal(pkg.dependencies?.[dependency] || pkg.devDependencies?.[dependency], undefined);
        assert.equal(lock.packages[`node_modules/${dependency}`], undefined);
      }
    }
    for (const check of ['lint', 'check:types', 'check:fsd', 'check:deps', 'check:i18n', 'build-local']) {
      await run('npm', ['run', check], target);
    }
    for (const locale of ['en', 'fr']) {
      const html = await readFile(path.join(target, `.next/server/app/${locale}.html`), 'utf8');
      assert.equal(html.includes('DrizzleORM'), variant.database, `${locale} homepage must match its database selection`);
    }
    process.stdout.write(`Generated ${variant.name} passed.\n`);
  }
} catch (error) {
  process.stderr.write(`Generated projects are available for inspection at ${root}\n`);
  throw error;
}
await rm(root, { recursive: true, force: true });
