import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

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
    source,
    cwd,
    target: path.join(cwd, 'app'),
    record: path.join(root, 'installer.json'),
    env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, NEXT_FSD_TEST_RECORD: path.join(root, 'installer.json') },
  };
}

function runCli(f, args = [], answers = [], env = {}) {
  return new Promise((resolve, reject) => {
    const cliArgs = ['app', '--template', f.source, ...args];
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
  assert.equal(pkg.scripts['db-server:file'], undefined);
  assert.equal(pkg.scripts.dev, 'next dev');
  const lock = JSON.parse(await readFile(path.join(f.target, 'package-lock.json'), 'utf8'));
  assert.equal(lock.name, 'app');
  assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, pkg.devDependencies);
  assert.equal(await exists(path.join(f.target, 'drizzle.config.ts')), false);
  assert.equal(await exists(path.join(f.target, 'src/entities/counter/model/schema.ts')), false);
  assert.equal(await exists(path.join(f.target, 'src/entities/counter/model/counter-store.ts')), true);
  assert.equal(await exists(path.join(f.target, 'src/shared/lib/counter-store.ts')), false);
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
