# Next.js Starter with Feature-Sliced Design

A Next.js App Router starter with React 19, TypeScript, Tailwind CSS, next-intl, and Feature-Sliced Design. Database support and AI-tool setup are selected when creating a project.

## Getting started

Use Node.js **22.18 or newer** and npm:

```bash
npx next-fsd my-app
cd my-app
npm install
npm run dev
```

The CLI asks about a local database (default **No**) and the AI coding tools you use. It installs the bundled official FSD skill for the selected tools.

Choose directly with flags:

```bash
npx next-fsd my-app --no-db --ai-tool cursor
npx next-fsd my-app --include db --ai-tool claude-code,cursor
npx next-fsd my-app --minimal --no-db --ai-tool none
```

`--minimal` keeps the homepage and counter and removes the about/portfolio demos. Non-interactive runs default to no database and shared AI guidance. See the [CLI guide](https://github.com/bruno-keiko/nextjs-fsd-starter/blob/main/packages/next-fsd/README.md) for supported tools and options.

Each published CLI version uses the matching reviewed `next-fsd-v<version>` template tag. Use `--ref main` to try development changes. Custom templates default to `main`.

To work on this repository itself:

```bash
git clone https://github.com/bruno-keiko/nextjs-fsd-starter.git
cd nextjs-fsd-starter
npm ci
npm run dev
```

The repository includes the full database example. Open http://localhost:3000 after starting the app.

## Included tools

- ESLint for code style and formatting; Lefthook and Commitlint for commit checks
- Vitest for unit/browser tests, Playwright for E2E tests, and Storybook for components
- Steiger for FSD boundaries, Knip for unused code, and i18n-check for translations
- React Hook Form and Zod for forms; T3 Env for environment validation; LogTape for logging
- Optional Type-safe ORM with Drizzle and a local PGlite database
- GitHub Actions for validation and GitHub releases; Dependabot for dependency updates

## Project layout

- `src/app/`: Next.js routes, layouts, metadata, and page composition
- `src/shared/`: UI primitives, API utilities, configuration, translations, and styles
- `src/entities/counter/`: counter model, validation, and server UI
- `src/features/counter-increment/`: counter form
- `src/widgets/base-template/`: shared page shell
- `tests/`: Playwright integration and E2E tests

Translations live in `src/shared/config/locales/`. Update each locale when changing keys. Set app details in `src/shared/utils/AppConfig.ts`, environment validation in `src/shared/lib/Env.ts`, and colors in `src/shared/styles/global.css`.

## AI instructions

[AGENTS.md](AGENTS.md) contains repository conventions and validation commands. The [official FSD skill](https://github.com/feature-sliced/skills) is bundled in [.agents/skills/feature-sliced-design/](.agents/skills/feature-sliced-design/SKILL.md); [skills-lock.json](skills-lock.json) records the reviewed upstream revision and content hash.

The CLI installs that bundled copy for your selected tools. Claude Code and Gemini CLI receive files importing `AGENTS.md`. To reproduce the upstream skill installation:

```bash
npx skills@1.7.2 add https://github.com/feature-sliced/skills/tree/5e95aaebb84541742686e56352b7569acf4306f1 --skill feature-sliced-design --agent universal --copy --yes
```

Review skill updates and their lockfile together. To install the bundled copy for another tool:

```bash
npx skills@1.7.2 add ./.agents/skills --skill feature-sliced-design --agent <agent-name> --copy --yes
```

## API utilities

Import `ApiFetcher` from `@/shared/api-client` and supply the API prefix. It preserves request headers and supports JSON and multipart bodies. Supply credential getters/setters, a refresh callback, and an unauthorized callback when the application needs authentication. The utilities do not choose cookie storage or authentication routes.

## Commits and validation

For a new project folder, initialize Git and install its hooks:

```bash
git init
npm run hooks:install
```

Lefthook checks staged-file lint, TypeScript, and FSD boundaries before committing. Commitlint enforces [Conventional Commits](https://www.conventionalcommits.org/), such as `feat: add profile page` or `fix: correct counter validation`. Use `npm run commit` for an interactive commit-message prompt.

```bash
npm run lint
npm run check:types
npm run check:fsd
npm run check:deps
npm run check:i18n
npm run test
```

FSD naming warnings for the existing Shared `utils` and `types` segments remain advisory. CI runs the same checks, production builds on Node 22/24, and browser tests. Repository maintainers can also run `npm test --prefix packages/next-fsd` and `npm run test:generated --prefix packages/next-fsd` to validate the CLI and all generated variants.

## Browser tests and Storybook

```bash
npx playwright install
npm run test:e2e
npm run storybook
npm run storybook:test
```

Storybook runs at http://localhost:6006. Chromatic uploads run only when `CHROMATIC_PROJECT_TOKEN` is configured in repository secrets.

<!-- database-only:start -->
## Database-enabled projects

PGlite supplies a local PostgreSQL-compatible database without Docker. `npm run dev` starts it and applies migrations. Local database files are stored in `local.db`.

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

Schema changes belong in `src/entities/counter/model/schema.ts`; review generated migrations before applying them. Drizzle Studio opens at https://local.drizzle.studio.

For a build with a temporary in-memory database:

```bash
npm run build-local
```

For a remote PostgreSQL database, set `DATABASE_URL` in `.env.local` or the deployment environment. Apply migrations as part of deployment, then use `npm run build:next` with the database available.
<!-- database-only:end -->

## Builds

```bash
npm run build
npm run start
npm run build-stats
```

`build-stats` opens the bundle analyzer. Generated projects without database support build and run without a database server. Their demo counter is stored in memory and resets when the server restarts.

## License

[MIT](LICENSE).
