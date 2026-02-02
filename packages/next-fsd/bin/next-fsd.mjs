#!/usr/bin/env node
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import degit from 'degit';

function parseArgs(argv) {
  const args = argv.slice(2);

  let projectName;
  let template = process.env.NEXT_FSD_TEMPLATE || 'bruno-keiko/nextjs-fsd-starter';
  let ref = process.env.NEXT_FSD_REF || 'main';
  let force = false;
  const include = new Set();

  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--help' || a === '-h') return { help: true };
    if (a === '--force' || a === '-f') {
      force = true;
      continue;
    }
    if (a === '--include' || a === '-i') {
      const value = args[i + 1] || '';
      value.split(',').map((s) => s.trim()).filter(Boolean).forEach((f) => include.add(f));
      i += 1;
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

  return { projectName, template, ref, force, include, help: false };
}

function usage() {
  return `
Usage:
  npx next-fsd <project-name> [options]

Options:
  --template, -t   Template repo (degit format, e.g. org/repo)
  --ref, -r        Branch/tag/commit (default: main)
  --include, -i    Comma-separated features to include (default: frontend only)
                   Use --include db for database (Drizzle, PGLite, migrations)
  --force, -f      Overwrite target dir if it exists

Examples:
  npx next-fsd my-app
  npx next-fsd my-app --include db
  npx next-fsd my-app --template my-org/next-starter --ref main

Environment variables:
  NEXT_FSD_TEMPLATE   Default template repo
  NEXT_FSD_REF        Default ref (e.g. main)
`.trim();
}

function isLikelyLocalPath(p) {
  return p === '.' || p.startsWith('/') || p.startsWith('./') || p.startsWith('../') || p.startsWith('file:');
}

function normalizeLocalPath(p) {
  if (p === '.') return '.';
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

/** Remove database-related code and switch counter to in-memory store (frontend-only mode) */
async function stripDb(targetDir) {
  const root = targetDir;

  // Delete DB-related files and dirs
  const toRemove = [
    'drizzle.config.ts',
    'migrations',
    path.join('src', 'shared', 'lib', 'DB.ts'),
    path.join('src', 'shared', 'utils', 'DBConnection.ts'),
    path.join('src', 'entities', 'counter', 'model', 'schema.ts'),
  ];

  for (const p of toRemove) {
    const full = path.join(root, p);
    if (existsSync(full)) {
      await rm(full, { recursive: true, force: true });
    }
  }

  // Create in-memory counter store
  const counterStorePath = path.join(root, 'src', 'shared', 'lib', 'counter-store.ts');
  await mkdir(path.dirname(counterStorePath), { recursive: true });
  await writeFile(
    counterStorePath,
    `// In-memory counter store for frontend-only projects (no database)

const store = new Map<number, number>();

export function getCount(id: number): number {
  return store.get(id) ?? 0;
}

export function increment(id: number, delta: number): number {
  const next = (store.get(id) ?? 0) + delta;
  store.set(id, next);
  return next;
}
`,
    'utf8',
  );

  // Replace counter model index (no schema, just type)
  const modelIndexPath = path.join(root, 'src', 'entities', 'counter', 'model', 'index.ts');
  await mkdir(path.dirname(modelIndexPath), { recursive: true });
  await writeFile(
    modelIndexPath,
    `export type Counter = { id: number; count: number };
`,
    'utf8',
  );

  // Replace API counter route
  const apiRoutePath = path.join(root, 'src', 'app', '[locale]', 'api', 'counter', 'route.ts');
  await mkdir(path.dirname(apiRoutePath), { recursive: true });
  await writeFile(
    apiRoutePath,
    `import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { increment } from '@/shared/lib/counter-store';
import { logger } from '@/shared/lib';
import { CounterValidation } from '@/entities/counter';

export const PUT = async (request: Request) => {
  const json = await request.json();
  const parse = CounterValidation.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const id = Number((await headers()).get('x-e2e-random-id')) || 0;
  const count = increment(id, parse.data.increment);

  logger.info('Counter has been incremented');

  return NextResponse.json({ count });
};
`,
    'utf8',
  );

  // Replace CurrentCount component
  const currentCountPath = path.join(root, 'src', 'entities', 'counter', 'ui', 'current-count.tsx');
  await writeFile(
    currentCountPath,
    `import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { getCount } from '@/shared/lib/counter-store';
import { logger } from '@/shared/lib';

export const CurrentCount = async () => {
  const t = await getTranslations('CurrentCount');
  const id = Number((await headers()).get('x-e2e-random-id')) || 0;
  const count = getCount(id);

  logger.info('Counter fetched successfully');

  return (
    <div>
      {t('count', { count })}
    </div>
  );
};
`,
    'utf8',
  );

  // Update shared/lib/index.ts - remove db export
  const sharedLibPath = path.join(root, 'src', 'shared', 'lib', 'index.ts');
  if (existsSync(sharedLibPath)) {
    let libContent = await readFile(sharedLibPath, 'utf8');
    libContent = libContent.replace(/^export \{ db \} from '\.\/DB';?\r?\n?/m, '');
    await writeFile(sharedLibPath, libContent, 'utf8');
  }

  // Update Env.ts - make DATABASE_URL optional
  const envPath = path.join(root, 'src', 'shared', 'lib', 'Env.ts');
  if (existsSync(envPath)) {
    await writeFile(
      envPath,
      `import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

export const Env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
});
`,
      'utf8',
    );
  }

  // Update package.json - remove db deps and scripts
  const pkgPath = path.join(root, 'package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));

  const dbDeps = ['drizzle-orm', 'pg'];
  const dbDevDeps = ['drizzle-kit', '@electric-sql/pglite-socket', '@types/pg'];
  if (pkg.dependencies) {
    dbDeps.forEach((d) => delete pkg.dependencies[d]);
  }
  if (pkg.devDependencies) {
    dbDevDeps.forEach((d) => delete pkg.devDependencies[d]);
  }

  const dbScripts = ['db-server:file', 'db-server:memory', 'db:generate', 'db:migrate', 'db:studio'];
  if (pkg.scripts) {
    dbScripts.forEach((s) => delete pkg.scripts[s]);
    pkg.scripts.dev = pkg.scripts['dev:next'] || 'next dev';
    pkg.scripts.build = pkg.scripts['build:next'] || 'next build --webpack';
    pkg.scripts['build-local'] = pkg.scripts.build; // CI uses build-local
  }

  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

  // Update next.config.ts - remove migrations from outputFileTracingIncludes
  const nextConfigPath = path.join(root, 'next.config.ts');
  if (existsSync(nextConfigPath)) {
    let nextContent = await readFile(nextConfigPath, 'utf8');
    nextContent = nextContent.replace(
      /,?\s*outputFileTracingIncludes: \{\s*'\/': \[.*?migrations.*?\],\s*\}/s,
      '',
    );
    await writeFile(nextConfigPath, nextContent, 'utf8');
  }

  // Update .env - remove DATABASE_URL
  const envFile = path.join(root, '.env');
  if (existsSync(envFile)) {
    let envContent = await readFile(envFile, 'utf8');
    envContent = envContent.replace(/#?\\s*DATABASE_URL=.*\\n?/g, '');
    envContent = envContent.replace(/#?\\s*#.*[Dd]atabase.*\\n?/g, '');
    await writeFile(envFile, envContent.trim() + '\n', 'utf8');
  }
}

async function main() {
  const { help, projectName, template, ref, force, include } = parseArgs(process.argv);

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

  // Default: frontend-only. Use --include db for database features.
  if (!include.has('db')) {
    // eslint-disable-next-line no-console
    console.log('Configuring frontend-only (no database)...');
    await stripDb(targetDir);
  }

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

// Always run main() when this file is executed
main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

