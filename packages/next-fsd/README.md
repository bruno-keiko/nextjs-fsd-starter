# `next-fsd`

Create a new project based on a Next.js + Feature-Sliced Design starter.

## Usage

```bash
npx next-fsd my-app
```

## Options

```bash
--template, -t   Template repo (degit format, e.g. org/repo)
--ref, -r        Branch/tag/commit (default: main)
--force, -f      Overwrite target dir if it exists
```

## Environment

```bash
NEXT_FSD_TEMPLATE=org/repo
NEXT_FSD_REF=main
```

## Publishing notes

This folder is a standalone npm package. Publish `packages/next-fsd` to npm as `next-fsd`.

