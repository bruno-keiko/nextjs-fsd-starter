# `next-fsd`

Create a new project based on a Next.js + Feature-Sliced Design starter.

## Usage

```bash
npx next-fsd my-app
```

By default, scaffolds a **frontend-only** project (no database). Use `--include db` when you need database features (Drizzle, PGLite, migrations).

## Options

```bash
--template, -t   Template repo (degit format, e.g. org/repo)
--ref, -r        Branch/tag/commit (default: main)
--include, -i    Comma-separated features (default: frontend only)
                 Use --include db for database support
--force, -f      Overwrite target dir if it exists
```

## Examples

```bash
npx next-fsd my-app                    # Frontend only (default)
npx next-fsd my-app --include db       # With database (Drizzle, PGLite)
```

## Environment

```bash
NEXT_FSD_TEMPLATE=org/repo
NEXT_FSD_REF=main
```

## Publishing notes

This folder is a standalone npm package. Publish `packages/next-fsd` to npm as `next-fsd`.

