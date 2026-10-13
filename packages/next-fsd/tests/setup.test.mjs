import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateProjectPaths } from '../bin/paths.mjs';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const cli = fileURLToPath(new URL('../bin/next-fsd.mjs', import.meta.url));

async function fixture(t) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'next-fsd-setup-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'template');
  const cwd = path.join(root, 'projects with spaces');
  const bin = path.join(root, 'bin');
  await Promise.all([mkdir(source), mkdir(cwd), mkdir(bin)]);
  await cp(path.join(repo, '.agents'), path.join(source, '.agents'), { recursive: true });
  const files = {
    'package.json': await readFile(path.join(repo, 'package.json'), 'utf8'),
    'package-lock.json': await readFile(path.join(repo, 'package-lock.json'), 'utf8'),
    'skills-lock.json': await readFile(path.join(repo, 'skills-lock.json'), 'utf8'),
    'AGENTS.md': '# Template instructions\n',
    'README.md': await readFile(path.join(repo, 'README.md'), 'utf8'),
    '.github/workflows/CI.yml': await readFile(path.join(repo, '.github/workflows/CI.yml'), 'utf8'),
    'packages/next-fsd/package.json': '{"name":"next-fsd"}\n',
    'CLAUDE.md': '# Existing team guidance\n',
    '.env': 'DATABASE_URL=postgres://localhost/example\nNEXT_PUBLIC_APP_URL=http://localhost:3000\n',
    '.env.production': '# DATABASE_URL=postgres://example/production\nNEXT_PUBLIC_APP_URL=https://example.test\n',
    'drizzle.config.ts': 'export default {};\n',
    'migrations/0000.sql': 'CREATE TABLE example (id integer);\n',
    'src/shared/lib/DB.ts': 'export const db = {};\n',
    'src/shared/lib/index.ts': 'export { db } from \'./DB\';\n',
    'src/shared/lib/Env.ts': 'export const Env = {};\n',
    'src/shared/utils/DBConnection.ts': 'export const connection = {};\n',
    'src/entities/counter/model/schema.ts': 'export const counterSchema = {};\n',
    'src/entities/counter/model/index.ts': 'export { counterSchema } from \'./schema\';\n',
    'src/entities/counter/ui/current-count.tsx': 'export const CurrentCount = () => null;\n',
    'src/entities/counter/index.server.ts': 'export { CurrentCount } from \'./ui\';\n',
    'src/shared/config/StarterConfig.ts': await readFile(path.join(repo, 'src/shared/config/StarterConfig.ts'), 'utf8'),
    'src/shared/config/locales/en.json': await readFile(path.join(repo, 'src/shared/config/locales/en.json'), 'utf8'),
    'src/shared/config/locales/fr.json': await readFile(path.join(repo, 'src/shared/config/locales/fr.json'), 'utf8'),
    'src/app/[locale]/(marketing)/layout.tsx': await readFile(path.join(repo, 'src/app/[locale]/(marketing)/layout.tsx'), 'utf8'),
    'src/app/[locale]/(marketing)/about/page.tsx': 'export default () => null;\n',
    'src/app/[locale]/(marketing)/portfolio/page.tsx': 'export default () => null;\n',
    'tests/e2e/Sanity.check.e2e.ts': await readFile(path.join(repo, 'tests/e2e/Sanity.check.e2e.ts'), 'utf8'),
    'tests/e2e/I18n.e2e.ts': await readFile(path.join(repo, 'tests/e2e/I18n.e2e.ts'), 'utf8'),
    'tests/e2e/Visual.e2e.ts': await readFile(path.join(repo, 'tests/e2e/Visual.e2e.ts'), 'utf8'),
    'playwright.config.ts': await readFile(path.join(repo, 'playwright.config.ts'), 'utf8'),
  };
  for (const [file, contents] of Object.entries(files)) {
    const location = path.join(source, file);
    await mkdir(path.dirname(location), { recursive: true });
    await writeFile(location, contents);
  }

  // Stub the external npx boundary; the scaffolder, prompts, and file system are real.
  const installer = path.join(bin, 'installer.cjs');
  await writeFile(installer, `
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
if (args[1] === 'npm@10.9.9') {
  fs.writeFileSync(process.env.NEXT_FSD_TEST_LOCK_RECORD, JSON.stringify({ args, cwd: process.cwd() }));
  process.exit(process.env.NEXT_FSD_TEST_LOCK_FAIL ? 2 : 0);
}
fs.writeFileSync(process.env.NEXT_FSD_TEST_RECORD, JSON.stringify({ args, cwd: process.cwd() }));
fs.writeFileSync('skills-lock.json', JSON.stringify({ skills: { local: true } }));
if (process.env.NEXT_FSD_TEST_INSTALL_FAIL) process.exit(2);
const selected = args.slice(args.indexOf('--agent') + 1, args.indexOf('--copy'));
const destinations = { 'claude-code': '.claude', windsurf: '.windsurf' };
for (const tool of selected) {
  if (destinations[tool]) {
    const target = path.join(destinations[tool], 'skills', 'feature-sliced-design');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync('.agents/skills/feature-sliced-design', target, { recursive: true });
  }
}
`);
  if (process.platform === 'win32') {
    await writeFile(path.join(bin, 'npx.cmd'), `@"${process.execPath}" "${installer}" %*\r\n`);
  } else {
    await writeFile(path.join(bin, 'npx'), `#!/bin/sh\nexec '${process.execPath.replaceAll('\'', '\'\\\'\'')}' '${installer.replaceAll('\'', '\'\\\'\'')}' "$@"\n`, { mode: 0o755 });
  }
  return {
    root,
    source,
    cwd,
    target: path.join(cwd, 'app'),
    record: path.join(root, 'installer.json'),
    lockRecord: path.join(root, 'lock-updater.json'),
    env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, NEXT_FSD_TEST_RECORD: path.join(root, 'installer.json'), NEXT_FSD_TEST_LOCK_RECORD: path.join(root, 'lock-updater.json') },
  };
}

function runCli(f, args = [], answers = [], env = {}, projectName = 'app') {
  return new Promise((resolve, reject) => {
    const cliArgs = [projectName, '--template', f.source, ...args];
    const command = answers.length
      ? ['--input-type=module', '-e', `process.stdin.isTTY = true; process.stdout.isTTY = true; process.argv = ${JSON.stringify([process.execPath, cli, ...cliArgs])}; await import(${JSON.stringify(cli)});`]
      : [cli, ...cliArgs];
    const child = spawn(process.execPath, command, { cwd: f.cwd, env: { ...f.env, ...env }, stdio: 'pipe' });
    let stdout = '';
    let pendingPrompts = '';
    let stderr = '';
    let next = 0;
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`CLI timed out: ${stdout}\n${stderr}`));
    }, 10000);
    child.stdout.on('data', (data) => {
      stdout += data;
      pendingPrompts += data;
      if (answers[next] && pendingPrompts.includes(answers[next].prompt)) {
        const answer = answers[next++];
        pendingPrompts = pendingPrompts.slice(pendingPrompts.indexOf(answer.prompt) + answer.prompt.length);
        child.stdin.write(`${answer.value}\n`);
      }
    });
    child.stderr.on('data', (data) => {
      stderr += data;
    });
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
    if (!answers.length) {
      child.stdin.end();
    }
  });
}

async function exists(file) {
  try {
    await readFile(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

test('non-interactive defaults create a project without DB support and keep the pinned shared skill', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f);
  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /Include a local database|Choose numbers/);
  const pkg = JSON.parse(await readFile(path.join(f.target, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies['drizzle-orm'], undefined);
  assert.equal(pkg.dependencies.pg, undefined);
  assert.equal(pkg.devDependencies['drizzle-kit'], undefined);
  assert.equal(pkg.devDependencies['dotenv-cli'], undefined);
  assert.equal(pkg.devDependencies['npm-run-all'], undefined);
  assert.equal(pkg.scripts['db-server:file'], undefined);
  assert.equal(pkg.scripts.dev, 'next dev');
  const lock = JSON.parse(await readFile(path.join(f.target, 'package-lock.json'), 'utf8'));
  assert.equal(lock.name, 'app');
  assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, pkg.devDependencies);
  const lockCommand = JSON.parse(await readFile(f.lockRecord, 'utf8'));
  assert.equal(lockCommand.cwd, f.target);
  assert.deepEqual(lockCommand.args, ['--yes', 'npm@10.9.9', 'install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund']);
  assert.equal(await exists(path.join(f.target, 'drizzle.config.ts')), false);
  assert.equal(await exists(path.join(f.target, 'src/entities/counter/model/schema.ts')), false);
  assert.equal(await exists(path.join(f.target, 'src/entities/counter/model/counter-store.ts')), true);
  assert.equal(await exists(path.join(f.target, 'src/shared/lib/counter-store.ts')), false);
  assert.equal(await exists(path.join(f.target, 'packages/next-fsd/package.json')), false);
  const workflow = await readFile(path.join(f.target, '.github/workflows/CI.yml'), 'utf8');
  assert.match(workflow, /if: hashFiles\('packages\/next-fsd\/package\.json'\) != ''/);
  assert.ok(pkg.scripts['build-local']);
  for (const name of ['.env', '.env.production']) {
    assert.doesNotMatch(await readFile(path.join(f.target, name), 'utf8'), /DATABASE_URL/);
  }
  assert.match(await readFile(path.join(f.target, '.env'), 'utf8'), /NEXT_PUBLIC_APP_URL/);
  assert.doesNotMatch(await readFile(path.join(f.target, 'playwright.config.ts'), 'utf8'), /db-server/);
  assert.doesNotMatch(await readFile(path.join(f.target, 'README.md'), 'utf8'), /### Set up remote database|### Change database schema|#### Database Studio|During the build process, database migrations/);
  assert.equal(await readFile(path.join(f.target, 'skills-lock.json'), 'utf8'), await readFile(path.join(f.source, 'skills-lock.json'), 'utf8'));
  assert.equal(await readFile(path.join(f.target, '.agents/skills/feature-sliced-design/SKILL.md'), 'utf8'), await readFile(path.join(f.source, '.agents/skills/feature-sliced-design/SKILL.md'), 'utf8'));
});

test('--include db preserves DB support and none skips the external installer', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, ['--include', 'db', '--ai-tool', 'none']);
  assert.equal(result.code, 0, result.stderr);
  const pkg = JSON.parse(await readFile(path.join(f.target, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies['drizzle-orm'], '^0.45.1');
  assert.ok(pkg.scripts['db-server:file']);
  assert.equal(await exists(path.join(f.target, 'drizzle.config.ts')), true);
  assert.equal(await exists(path.join(f.target, 'src/entities/counter/model/counter-store.ts')), false);
  assert.match(await readFile(path.join(f.target, '.env'), 'utf8'), /DATABASE_URL/);
  assert.match(await readFile(path.join(f.target, 'playwright.config.ts'), 'utf8'), /db-server/);
  assert.equal(await exists(f.record), false);
  assert.equal(await exists(f.lockRecord), false);
});

test('lockfile update failures preserve the project and explain how to retry', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, ['--no-db', '--ai-tool', 'none'], [], { NEXT_FSD_TEST_LOCK_FAIL: '1' });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Dependency lockfile setup failed[\s\S]*Retry inside it: npx --yes npm@10\.9\.9 install --package-lock-only/);
  assert.equal(await exists(path.join(f.target, 'package.json')), true);
  assert.equal(await exists(f.record), false);
  assert.doesNotMatch(result.stdout, /Done\./);
});

test('multiple AI tools receive their skill setup and context imports while retaining team instructions', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, ['--no-db', '--ai-tool=claude,cursor,gemini,opencode,windsurf']);
  assert.equal(result.code, 0, result.stderr);
  for (const agent of ['.claude', '.windsurf']) {
    assert.equal(await readFile(path.join(f.target, agent, 'skills/feature-sliced-design/SKILL.md'), 'utf8'), await readFile(path.join(f.source, '.agents/skills/feature-sliced-design/SKILL.md'), 'utf8'));
  }
  assert.equal(await readFile(path.join(f.target, 'CLAUDE.md'), 'utf8'), '@AGENTS.md\n\n# Existing team guidance\n');
  assert.equal(await readFile(path.join(f.target, 'GEMINI.md'), 'utf8'), '@AGENTS.md\n');
  const record = JSON.parse(await readFile(f.record, 'utf8'));
  assert.equal(record.cwd, f.target);
  assert.deepEqual(record.args, ['--yes', 'skills@1.7.2', 'add', './.agents/skills', '--skill', 'feature-sliced-design', '--agent', 'claude-code', 'cursor', 'gemini-cli', 'opencode', 'windsurf', '--copy', '--yes']);
  assert.equal(await readFile(path.join(f.target, 'skills-lock.json'), 'utf8'), await readFile(path.join(f.source, 'skills-lock.json'), 'utf8'));
});

test('interactive choices select DB support and tools before creating the project', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, [], [
    { prompt: 'Include a local database (PGlite + Drizzle)? [y/N]', value: 'yes' },
    { prompt: 'Choose numbers or tool names, separated by commas [8]:', value: '1,2' },
  ]);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(await exists(path.join(f.target, 'drizzle.config.ts')), true);
  assert.equal(await exists(path.join(f.target, '.claude/skills/feature-sliced-design/SKILL.md')), true);
});

test('interactive defaults leave out DB support and install shared guidance', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, [], [
    { prompt: 'Include a local database (PGlite + Drizzle)? [y/N]', value: '' },
    { prompt: 'Choose numbers or tool names, separated by commas [8]:', value: '' },
  ]);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(await exists(path.join(f.target, 'drizzle.config.ts')), false);
});

test('invalid interactive answers are retried before applying a valid selection', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, [], [
    { prompt: 'Include a local database (PGlite + Drizzle)? [y/N]', value: 'maybe' },
    { prompt: 'Include a local database (PGlite + Drizzle)? [y/N]', value: 'no' },
    { prompt: 'Choose numbers or tool names, separated by commas [8]:', value: '99' },
    { prompt: 'Choose numbers or tool names, separated by commas [8]:', value: '9' },
  ]);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Enter yes or no/);
  assert.match(result.stdout, /Unknown AI tool/);
  assert.equal(await exists(f.record), false);
  assert.equal(await exists(path.join(f.target, 'drizzle.config.ts')), false);
});

test('explicit flags bypass both prompts even in an interactive terminal', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, ['--include=db', '--ai-tool', 'none'], [{ prompt: 'never appears', value: '' }]);
  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /Include a local database|Which AI coding tools/);
});

test('templates without the bundled skill fail clearly when AI setup is requested', async (t) => {
  const f = await fixture(t);
  await rm(path.join(f.source, '.agents'), { recursive: true });
  const result = await runCli(f, ['--ai-tool', 'cursor']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /template does not include the official FSD skill/);
  assert.equal(await exists(f.record), false);
  assert.equal(await exists(path.join(f.target, 'package.json')), true);
});

test('installer failures keep the project and the pinned source, and give a retry command', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, ['--ai-tool', 'claude-code'], [], { NEXT_FSD_TEST_INSTALL_FAIL: '1' });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /AI-tool setup failed[\s\S]*Retry inside it: npx skills@1\.7\.2/);
  assert.doesNotMatch(result.stdout, /Done\./);
  assert.equal(await exists(path.join(f.target, 'package.json')), true);
  assert.equal(await readFile(path.join(f.target, 'skills-lock.json'), 'utf8'), await readFile(path.join(f.source, 'skills-lock.json'), 'utf8'));
});

for (const [args, error] of [
  [['--ai-tool', 'unknown'], /Unknown AI tool/],
  [['--ai-tool', 'none,cursor'], /Choose none by itself/],
  [['--ai-tool'], /requires a tool name/],
  [['--include'], /requires a feature name/],
  [['--unknown'], /Unknown option/],
  [['--include', 'auth'], /Unsupported feature/],
  [['--template'], /requires a repository/],
  [['--ref'], /requires a branch/],
  [['--include='], /requires a feature/],
  [['second-app'], /Unexpected argument/],
  [['--no-db', '--include', 'db'], /cannot be combined/],
]) {
  test(`invalid options (${args.join(' ')}) fail before writing a project`, async (t) => {
    const f = await fixture(t);
    const result = await runCli(f, args);
    assert.equal(result.code, 1);
    assert.match(result.stderr, error);
    assert.equal(await exists(path.join(f.target, 'package.json')), false);
  });
}

test('an existing project is preserved unless force is explicitly requested', async (t) => {
  const f = await fixture(t);
  await mkdir(f.target);
  await writeFile(path.join(f.target, 'keep.txt'), 'existing work');
  const result = await runCli(f);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Target already exists/);
  assert.equal(await readFile(path.join(f.target, 'keep.txt'), 'utf8'), 'existing work');
  assert.equal(await exists(f.record), false);
});

for (const target of ['.', '..']) {
  test(`force refuses the current directory and its parent (${target})`, async (t) => {
    const f = await fixture(t);
    await writeFile(path.join(f.cwd, 'keep.txt'), 'keep');
    const result = await runCli(f, ['--force', '--ai-tool', 'none'], [], {}, target);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Refusing to use/);
    assert.equal(await readFile(path.join(f.cwd, 'keep.txt'), 'utf8'), 'keep');
  });
}

for (const position of ['same', 'inside', 'parent']) {
  test(`force refuses targets ${position} the local template`, async (t) => {
    const f = await fixture(t);
    let target = f.source;
    let source = f.source;
    if (position === 'inside') {
      target = path.join(source, 'new-app');
    }
    if (position === 'parent') {
      source = path.join(f.source, 'nested-template');
      await mkdir(source);
    }
    const before = await readFile(path.join(f.source, 'package.json'), 'utf8');
    const result = await runCli(f, ['--force', '--template', source, '--ai-tool', 'none'], [], {}, target);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must be separate directories/);
    assert.equal(await readFile(path.join(f.source, 'package.json'), 'utf8'), before);
  });
}

test('path checks reject roots and home without mutating them', async () => {
  await assert.rejects(validateProjectPaths(process.cwd(), path.parse(process.cwd()).root), /Refusing to use/);
  await assert.rejects(validateProjectPaths(process.cwd(), os.homedir()), /Refusing to use/);
});

test('path checks follow symlinks before testing source overlap', { skip: process.platform === 'win32' }, async (t) => {
  const f = await fixture(t);
  const alias = path.join(f.cwd, 'template-alias');
  await symlink(f.source, alias, 'dir');
  await assert.rejects(validateProjectPaths(f.cwd, path.join(alias, 'new-app'), f.source), /must be separate directories/);
  assert.equal(await exists(path.join(f.source, 'package.json')), true);
});

test('nested project paths use a valid package basename', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, ['--include', 'db', '--ai-tool', 'none'], [], {}, 'projects/nested-app');
  assert.equal(result.code, 0, result.stderr);
  const pkg = JSON.parse(await readFile(path.join(f.cwd, 'projects/nested-app/package.json'), 'utf8'));
  assert.equal(pkg.name, 'nested-app');
});

test('invalid package names fail before creating directories', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, ['--ai-tool', 'none'], [], {}, 'INVALID NAME');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Invalid project name/);
  assert.equal(await exists(path.join(f.cwd, 'INVALID NAME/package.json')), false);
});

test('force overwrites only a separate target', async (t) => {
  const f = await fixture(t);
  await mkdir(f.target);
  await writeFile(path.join(f.target, 'old.txt'), 'old');
  const result = await runCli(f, ['--force', '--include=db', '--ai-tool=none']);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(await exists(path.join(f.target, 'old.txt')), false);
  assert.equal(await exists(path.join(f.source, 'package.json')), true);
});

test('local templates omit private environment files and runtime databases', async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.source, '.env.local'), 'PRIVATE=fixture');
  await writeFile(path.join(f.source, 'local.db'), 'fixture database');
  const result = await runCli(f, ['--include=db', '--ai-tool=none']);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(await exists(path.join(f.target, '.env.local')), false);
  assert.equal(await exists(path.join(f.target, 'local.db')), false);
  assert.equal(await exists(path.join(f.target, '.env')), true);
});

test('no-database projects use memory copy in every configured locale', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, ['--no-db', '--ai-tool=none']);
  assert.equal(result.code, 0, result.stderr);
  assert.match(await readFile(path.join(f.target, 'src/shared/config/StarterConfig.ts'), 'utf8'), /database: false/);
  const english = JSON.parse(await readFile(path.join(f.target, 'src/shared/config/locales/en.json'), 'utf8'));
  const french = JSON.parse(await readFile(path.join(f.target, 'src/shared/config/locales/fr.json'), 'utf8'));
  assert.match(english.CounterForm.presentation, /stored in memory/);
  assert.match(french.CounterForm.presentation, /stocké en mémoire/);
  assert.doesNotMatch(english.Counter.meta_description, /DB|database/);
  assert.doesNotMatch(french.Counter.meta_description, /DB|base de données/);
});

for (const database of [false, true]) {
  test(`minimal projects remove demo pages, navigation, translations, and stale E2E tests (db=${database})`, async (t) => {
    const f = await fixture(t);
    const result = await runCli(f, ['--minimal', ...(database ? ['--include=db'] : ['--no-db']), '--ai-tool=none']);
    assert.equal(result.code, 0, result.stderr);
    for (const route of ['about', 'portfolio']) {
      assert.equal(await exists(path.join(f.target, `src/app/[locale]/(marketing)/${route}/page.tsx`)), false);
    }
    assert.doesNotMatch(await readFile(path.join(f.target, 'src/app/[locale]/(marketing)/layout.tsx'), 'utf8'), /\/about|\/portfolio/);
    for (const locale of ['en', 'fr']) {
      const messages = JSON.parse(await readFile(path.join(f.target, `src/shared/config/locales/${locale}.json`), 'utf8'));
      assert.equal(messages.About, undefined);
      assert.equal(messages.Portfolio, undefined);
      assert.equal(messages.PortfolioSlug, undefined);
      assert.equal(messages.RootLayout.about_link, undefined);
      assert.ok(messages.Counter);
    }
    for (const testFile of ['Sanity.check', 'I18n', 'Visual']) {
      assert.doesNotMatch(await readFile(path.join(f.target, `tests/e2e/${testFile}.e2e.ts`), 'utf8'), /\/about|\/portfolio/);
    }
    assert.match(await readFile(path.join(f.target, 'tests/e2e/I18n.e2e.ts'), 'utf8'), /\/fr\/counter/);
  });
}

test('help identifies the template tag associated with the CLI version', async (t) => {
  const f = await fixture(t);
  const result = await runCli(f, ['--help']);
  const pkg = JSON.parse(await readFile(path.join(repo, 'packages/next-fsd/package.json'), 'utf8'));
  assert.equal(result.code, 0);
  assert.match(result.stdout, new RegExp(`next-fsd-v${pkg.version.replaceAll('.', '\\.')}`));
});

test('invalid local templates do not erase an existing force target', async (t) => {
  const f = await fixture(t);
  const source = path.join(f.root, 'not-a-template');
  await mkdir(source);
  await mkdir(f.target);
  await writeFile(path.join(f.target, 'keep.txt'), 'keep');
  const result = await runCli(f, ['--force', '--template', source, '--ai-tool=none']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /must contain a valid package.json/);
  assert.equal(await readFile(path.join(f.target, 'keep.txt'), 'utf8'), 'keep');
});
