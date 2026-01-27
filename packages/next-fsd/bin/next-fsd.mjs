#!/usr/bin/env node
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import degit from 'degit';

function parseArgs(argv) {
  const args = argv.slice(2);

  let projectName;
  let template = process.env.NEXT_FSD_TEMPLATE || 'begench/next-starter';
  let ref = process.env.NEXT_FSD_REF || 'main';
  let force = false;

  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--help' || a === '-h') return { help: true };
    if (a === '--force' || a === '-f') {
      force = true;
      continue;
    }
    if (a === '--template' || a === '-t') {
      template = args[i + 1];
      i += 1;
      continue;
    }
    if (a === '--ref' || a === '-r') {
      ref = args[i + 1];
      i += 1;
      continue;
    }
    if (!a.startsWith('-') && !projectName) {
      projectName = a;
    }
  }

  return { projectName, template, ref, force, help: false };
}

function usage() {
  return `
Usage:
  npx next-fsd <project-name> [--template <repo>] [--ref <branch-or-tag>] [--force]

Examples:
  npx next-fsd my-app
  npx next-fsd my-app --template my-org/next-starter --ref main

Environment variables:
  NEXT_FSD_TEMPLATE   Default template repo (e.g. my-org/next-starter)
  NEXT_FSD_REF        Default ref (e.g. main)
`.trim();
}

function isLikelyLocalPath(p) {
  return p.startsWith('/') || p.startsWith('./') || p.startsWith('../') || p.startsWith('file:');
}

function normalizeLocalPath(p) {
  if (p.startsWith('file:')) {
    return fileURLToPath(p);
  }
  return p;
}

async function copyDir(sourceDir, targetDir, { force, ignore = [] }) {
  const ignoreSet = new Set(ignore);

  const entries = await readdir(sourceDir, { withFileTypes: true });
  await mkdir(targetDir, { recursive: true });

  for (const entry of entries) {
    if (ignoreSet.has(entry.name)) continue;

    const from = path.join(sourceDir, entry.name);
    const to = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDir(from, to, { force, ignore });
      continue;
    }

    if (entry.isFile()) {
      await copyFile(from, to);
      continue;
    }
  }
}

async function updatePackageJsonName(targetDir, projectName) {
  const pkgPath = path.join(targetDir, 'package.json');
  const raw = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);

  pkg.name = projectName;
  // Most starter repos are templates; mark generated apps as private by default.
  if (pkg.private === undefined) pkg.private = true;

  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

async function main() {
  const { help, projectName, template, ref, force } = parseArgs(process.argv);

  if (help || !projectName) {
    // eslint-disable-next-line no-console
    console.log(usage());
    process.exit(help ? 0 : 1);
  }

  const cwd = process.cwd();
  const targetDir = path.resolve(cwd, projectName);

  // Ensure parent exists
  await mkdir(path.dirname(targetDir), { recursive: true });

  // eslint-disable-next-line no-console
  console.log(`\nCreating a new Next FSD app in ${targetDir}`);

  if (force) {
    await rm(targetDir, { recursive: true, force: true });
  } else {
    try {
      const s = await stat(targetDir);
      if (s.isDirectory()) {
        throw new Error(
          `Target directory already exists: ${targetDir}\n` +
            `Re-run with --force to overwrite.`,
        );
      }
    } catch {
      // ok
    }
  }

  if (isLikelyLocalPath(template)) {
    const sourceDir = path.resolve(cwd, normalizeLocalPath(template));
    // eslint-disable-next-line no-console
    console.log(`Using local template: ${sourceDir}\n`);
    await copyDir(sourceDir, targetDir, {
      force,
      ignore: ['.cursor', '.vscode', 'node_modules', '.git', '.next', 'coverage', 'packages'],
    });
  } else {
    const source = `${template}#${ref}`;
    const emitter = degit(source, { cache: false, force, verbose: true });
    // eslint-disable-next-line no-console
    console.log(`Using template: ${source}\n`);
    await emitter.clone(targetDir);
  }

  await updatePackageJsonName(targetDir, projectName);

  // eslint-disable-next-line no-console
  console.log('\nDone.\n');
  // eslint-disable-next-line no-console
  console.log('Next steps:');
  // eslint-disable-next-line no-console
  console.log(`  cd ${projectName}`);
  // eslint-disable-next-line no-console
  console.log('  npm install');
  // eslint-disable-next-line no-console
  console.log('  npm run dev');
}

// If this file is invoked directly, run main().
const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

