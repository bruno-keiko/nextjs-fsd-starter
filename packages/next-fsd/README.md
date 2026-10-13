# `next-fsd`

Create a new project based on a Next.js + Feature-Sliced Design starter.

## Usage

```bash
npx next-fsd my-app
```

In an interactive terminal, the CLI asks:

1. Whether to include a local database (PGlite, Drizzle, and migrations), defaulting to **No**.
2. Which AI coding tools you use. Select one or more by number or name.

Use flags to skip either prompt. Without an interactive terminal, the defaults are **no database** and **shared AI guidance**.

Requires Node.js 22.18 or newer. Each CLI release downloads its matching reviewed `next-fsd-v<version>` template tag. Use `--ref main` for development; custom templates default to `main`.

Generated projects include the template's `AGENTS.md`, the official FSD skill in `.agents/skills/feature-sliced-design/`, and `skills-lock.json` with its pinned upstream revision. The skill and its references are ready to reuse in each new project.

After scaffolding, the CLI runs `npx skills@1.7.2` against the bundled skill to install it locally for the selected tools. It preserves the pinned upstream lockfile. Claude Code and Gemini CLI also receive instruction files that import `AGENTS.md`; existing instructions are preserved. The skill installer needs npm access or a cached copy of the pinned CLI.

Choosing no database removes DB code, packages, scripts, environment settings, and database setup sections from the generated README. The demo counter uses an in-memory store, and Playwright starts the app without a database server.

Frontend-only setup refreshes the copied dependency lockfile using `npx --yes npm@10.9.9 install --package-lock-only --ignore-scripts`, so clean installs omit DB packages too. The pinned npm version keeps the lockfile compatible with Node 22 CI. This step needs npm registry access or cached dependencies; it does not install the app's dependencies or run package scripts. The scaffolder's own package is excluded from generated apps.

## Options

```bash
--template, -t   Template repo (degit format, e.g. org/repo)
--ref, -r        Branch/tag/commit (default: main)
--include, -i    Comma-separated features (default: frontend only)
                 Use --include db for database support
--no-db         Create a project without database support; skip the DB prompt
--ai-tool       Comma-separated AI tools; skip the tool prompt
--force, -f      Overwrite target dir if it exists
--minimal       Keep the homepage and counter; omit about/portfolio demos
```

Supported AI tool names: `claude-code`, `cursor`, `codex`, `github-copilot`, `gemini-cli`, `opencode`, `windsurf`, and `universal` (shared guidance). `claude`, `copilot`, and `gemini` are accepted aliases. Use `none` to skip additional AI-tool setup; the bundled instructions and skill remain available.

## Examples

```bash
npx next-fsd my-app                                       # Ask about database and AI tools
npx next-fsd my-app --no-db --ai-tool claude-code          # No database, Claude Code setup
npx next-fsd my-app --include db --ai-tool cursor,codex    # Database, multiple AI tools
npx next-fsd my-app --no-db --ai-tool none                 # Skip both prompts and skill installation
npx next-fsd my-app --minimal --no-db --ai-tool cursor     # Minimal frontend
```

## Environment

```bash
NEXT_FSD_TEMPLATE=org/repo
NEXT_FSD_REF=main
```

## Publishing notes

This folder is a standalone npm package. Publish `packages/next-fsd` to npm as `next-fsd`.

Run its setup regression tests with `npm test --prefix packages/next-fsd` from the repository root.
Run `npm run test:generated --prefix packages/next-fsd` to validate clean installs, lint, types, FSD, dependencies, translations, and builds for all four database/demo combinations. See [PUBLISHING.md](https://github.com/bruno-keiko/nextjs-fsd-starter/blob/main/packages/next-fsd/PUBLISHING.md) for the versioned release procedure.
