# Next.js Starter with Feature-Sliced Design

🚀 **Production-ready Next.js boilerplate** with App Router, Tailwind CSS, TypeScript, and **Feature-Sliced Design (FSD)** architecture ⚡️

Prioritizing developer experience first: Next.js, TypeScript, ESLint, Prettier, Lefthook (replacing Husky), Lint-Staged, Vitest (replacing Jest), Testing Library, Playwright, Commitlint, VSCode, Tailwind CSS, Database with DrizzleORM (PostgreSQL, SQLite, and MySQL), Local database with PGlite, Logging with LogTape (replacing Pino.js), Storybook, Multi-language (i18n), **shadcn/ui components**, and more.

## 🚀 Quick Start with CLI

The easiest way to get started is using our CLI tool:

```bash
npx next-fsd my-app
cd my-app
npm install
npm run dev
```

The CLI asks whether you want a local database and which AI coding tools you use. The database choice defaults to **No**. It then installs the bundled official FSD skill for the tools you select.

Use flags to choose directly:

```bash
npx next-fsd my-app --no-db --ai-tool claude-code
npx next-fsd my-app --include db --ai-tool cursor,codex
```

AI tools can be selected by number or name, including multiple tools separated by commas. Supported names are `claude-code`, `cursor`, `codex`, `github-copilot`, `gemini-cli`, `opencode`, `windsurf`, `universal`, and `none` (skip additional tool setup). Non-interactive runs default to no database and shared AI guidance. See the [CLI guide](https://github.com/bruno-keiko/nextjs-fsd-starter/blob/main/packages/next-fsd/README.md) for details.

Visit [npm package](https://www.npmjs.com/package/next-fsd) for more information.

**Or** clone this repository and use it as a starting point for your own Next.js project (includes full database setup).

### Features

Developer experience first, extremely flexible code structure and only keep what you need:

- ⚡ [Next.js](https://nextjs.org) with App Router support
- 🔥 Type checking [TypeScript](https://www.typescriptlang.org)
- 💎 Integrate with [Tailwind CSS](https://tailwindcss.com)
- 🎨 [shadcn/ui](https://ui.shadcn.com) components for beautiful, accessible UI
- 🏗️ Feature-Sliced Design (FSD) architecture for scalable code organization
- ✅ Strict Mode for TypeScript and React 19
- 📦 Type-safe ORM with DrizzleORM, compatible with PostgreSQL, SQLite, and MySQL
- 💽 Offline and local development database with PGlite
- 🌐 Multi-language (i18n) with next-intl
- ♻️ Type-safe environment variables with T3 Env
- ⌨️ Form handling with React Hook Form
- 🔴 Validation library with Zod
- 📏 Linter with [ESLint](https://eslint.org) (default Next.js, Next.js Core Web Vitals, Tailwind CSS and Antfu configuration)
- 💖 Code Formatter with Prettier
- 🦊 Husky for Git Hooks (replaced by Lefthook)
- 🚫 Lint-staged for running linters on Git staged files
- 🚓 Lint git commit with Commitlint
- 📓 Write standard compliant commit messages with Commitizen
- 🔍 Unused files and dependencies detection with Knip
- 🌍 I18n validation and missing translation detection with i18n-check
- 🦺 Unit Testing with Vitest and Browser mode (replacing React Testing Library)
- 🧪 Integration and E2E Testing with Playwright
- 👷 Run tests on pull request with GitHub Actions
- 🎉 Storybook for UI development
- 📝 Logging with LogTape
- 🎁 Automatic changelog generation with Semantic Release
- 🔍 Visual regression testing
- 💡 Absolute Imports using `@` prefix
- 🗂 VSCode configuration: Debug, Settings, Tasks and Extensions
- 🤖 SEO metadata, JSON-LD and Open Graph tags
- 🗺️ Sitemap.xml and robots.txt
- 👷 Automatic dependency updates with Dependabot
- ⌘ Database exploration with Drizzle Studio and CLI migration tool with Drizzle Kit
- ⚙️ Bundler Analyzer
- 🌈 Include a FREE minimalist theme
- 💯 Maximize lighthouse score

Built-in features from Next.js:

- ☕ Minify HTML & CSS
- 💨 Live reload
- ✅ Cache busting

### Philosophy

- Nothing is hidden from you, allowing you to make any necessary adjustments to suit your requirements and preferences.
- Dependencies are regularly updated on a monthly basis
- Start for free without upfront costs
- Easy to customize
- Minimal code
- Unstyled template
- SEO-friendly
- 🚀 Production-ready

### Requirements

- Node.js 22.18+ and npm

### Getting started

#### Option 1: Using the CLI (Recommended)

```bash
npx next-fsd my-app              # Ask about database and AI tools
# or
npx next-fsd my-app --no-db --ai-tool cursor
cd my-app
npm install
npm run dev
```

#### Option 2: Clone and Install

Run the following command on your local environment:

```shell
npm install
```

For your information, all dependencies are updated every month.

Then, you can run the project locally in development mode with live reload by executing:

```shell
npm run dev
```

Open http://localhost:3000 with your favorite browser to see your project. For your information, the project is already pre-configured with a local database using PGlite. No extra setup is required to run the project locally.

Need advanced features? Extend this starter as needed for your product.

### Set up remote database

The project uses DrizzleORM, a type-safe ORM that is compatible with PostgreSQL, SQLite, and MySQL databases. By default, the project is configured to seamlessly work with PostgreSQL, and you have the flexibility to choose any PostgreSQL database provider of your choice.

When you launch the project locally for the first time, it automatically creates a PostgreSQL database on your local machine. This allows you to work with a PostgreSQL database without Docker or any additional setup.

To set up a remote and production database, you need to create a PostgreSQL database and obtain the connection string. You can use any PostgreSQL database provider of your choice. Copy the connection string and add the `DATABASE_URL` variable to the `.env.local` file.

#### Create a fresh and empty database

If you want to create a fresh and empty database, you just need to remove the folder `local.db` from the root of the project. The next time you run the project, a new database will be created automatically.

### Translation (i18n) setup

For translation, the project uses `next-intl`. You can manage translations by editing the locale files in the `src/shared/config/locales` directory.

### Project structure

```shell
.
├── .agents/skills                  # Bundled official FSD agent skill
├── AGENTS.md                       # Shared AI coding instructions
├── README.md                       # README file
├── .github                         # GitHub folder
│   ├── actions                     # Reusable actions
│   └── workflows                   # GitHub Actions workflows
├── .storybook                      # Storybook folder
├── .vscode                         # VSCode configuration
├── migrations                      # Database migrations
├── public                          # Public assets folder
├── src
│   ├── app                         # Next JS App (App Router)
│   ├── shared                      # Shared layer (ui, utils, lib, config)
│   │   └── ui                      # shadcn/ui components
│   ├── entities                    # Entities layer
│   ├── features                    # Features layer
│   └── widgets                     # Widgets layer
├── tests
│   ├── e2e                         # E2E tests, also includes Monitoring as Code
│   └── integration                 # Integration tests
├── drizzle.config.ts               # Drizzle ORM configuration
├── eslint.config.mjs               # ESLint configuration
├── next.config.ts                  # Next JS configuration
├── playwright.config.ts            # Playwright configuration
├── skills-lock.json                # Pinned upstream skill revision
├── vitest.config.mts               # Vitest configuration
└── tsconfig.json                   # TypeScript configuration
```

### AI coding instructions

[AGENTS.md](AGENTS.md) contains the shared, repo-specific instructions for AI coding tools: project conventions, validation, template variants, and this starter's layout adaptations.

The [official Feature-Sliced Design skill](https://github.com/feature-sliced/skills) is bundled in [.agents/skills/feature-sliced-design/](.agents/skills/feature-sliced-design/SKILL.md), including its reference files. `AGENTS.md` directs agents to consult it for architecture tasks. Generated projects include the instructions, skill, and [skills-lock.json](skills-lock.json), which pins the upstream revision and content hash. The CLI installs the bundled copy for your selected AI tools and creates `CLAUDE.md` or `GEMINI.md` imports when needed. ESLint excludes upstream skill files so their examples stay unchanged.

The skill was installed locally using the official `skills` CLI. To reproduce the pinned installation:

```bash
npx skills@1.7.2 add https://github.com/feature-sliced/skills/tree/5e95aaebb84541742686e56352b7569acf4306f1 --skill feature-sliced-design --agent universal --copy --yes
```

To update it, replace the revision in that command with a reviewed upstream commit, then review the skill and lockfile changes together. Tools with another skill location can install the bundled copy with `npx skills add ./.agents/skills --skill feature-sliced-design --agent <agent-name> --yes`.

Use it directly with tools that support [AGENTS.md](https://agents.md/). If your tool requires another instruction filename, use its supported import mechanism to reference this file. For example, Claude Code configurations that require `CLAUDE.md` can use a file containing `@AGENTS.md`.

### Customization

You can easily configure the starter by searching the entire project for `FIXME:` to make quick customizations. Here are some of the most important files to customize:

- `src/shared/utils/AppConfig.ts`: configuration file
- `src/widgets/base-template/ui/base-template.tsx`: default theme
- `next.config.ts`: Next.js configuration
- `.env`: default environment variables

You have full access to the source code for further customization. The provided code is just an example to help you start your project. The sky's the limit 🚀.

### Change database schema

To modify the database schema in the project, update `./src/entities/counter/model/schema.ts`.

After making changes to the schema, generate a migration by running the following command:

```shell
npm run db:generate
```

This will create a migration file that reflects your schema changes.

After making sure your database is running, you can apply the generated migration using:

```shell
npm run db:migrate
```

There is no need to restart the Next.js server for the changes to take effect.

### Commit Message Format

For a newly scaffolded folder, initialize Git and install the hooks before committing:

```shell
git init
npm run hooks:install
```

Lefthook runs staged-file linting, TypeScript checks, and the full FSD architecture check before commits. Architecture errors block the commit; warnings remain advisory. The same architecture check also runs in CI. Run it manually with `npm run check:fsd`.

The check uses [Steiger and the official FSD plugin](https://github.com/feature-sliced/steiger). `steiger.config.mjs` starts from the recommended rules, allows Next.js route folder names, and treats the existing Shared `utils`/`types` segment names as warnings.

The project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification, meaning all commit messages must be formatted accordingly. To help you write commit messages, the project provides an interactive CLI that guides you through the commit process. To use it, run the following command:

```shell
npm run commit
```

One of the benefits of using Conventional Commits is the ability to automatically generate GitHub releases. It also allows us to automatically determine the next version number based on the types of commits that are included in a release.

### Testing

All unit tests are located alongside the source code in the same directory, making them easier to find. The unit test files follow this format: `*.test.ts` or `*.test.tsx`. The project uses Vitest and React Testing Library for unit testing. You can run the tests with the following command:

```shell
npm run test
```

### Integration & E2E Testing

The project uses Playwright for integration and end-to-end (E2E) testing. Integration test files use the `*.spec.ts` extension, while E2E test files use the `*.e2e.ts` extension. You can run the tests with the following commands:

```shell
npx playwright install # Only for the first time in a new environment
npm run test:e2e
```

### Storybook

Storybook is configured for UI component development and testing. The project uses Storybook with Next.js and Vite integration, including accessibility testing and documentation features.

Stories are located alongside your components in the `src` directory and follow the pattern `*.stories.ts` or `*.stories.tsx`.

You can run Storybook in development mode with:

```shell
npm run storybook
```

This will start Storybook on http://localhost:6006 where you can view and interact with your UI components in isolation.

To run Storybook tests in headless mode, you can use the following command:

```shell
npm run storybook:test
```

### Local Production Build

Generate an optimized production build locally using a temporary in-memory Postgres database:

```shell
npm run build-local
```

This command:

- Starts a temporary in-memory Database server
- Runs database migrations with Drizzle Kit
- Builds the Next.js app for production
- Shuts down the temporary DB when the build finishes

Notes:

- By default, it uses a local database, but you can also use `npm run build` with a remote database.
- This only creates the build, it doesn't start the server. To run the build locally, use `npm run start`.

### Deploy to production

During the build process, database migrations are automatically executed, so there's no need to run them manually. However, you must define `DATABASE_URL` in your environment variables.

Then, you can generate a production build with:

```shell
$ npm run build
```

It generates an optimized production build of the boilerplate. To test the generated build, run:

```shell
$ npm run start
```

This command starts a local server using the production build. You can now open http://localhost:3000 in your preferred browser to see the result.

### Logging

The project uses LogTape for logging. In the development environment, logs are displayed in the console by default. For production, you can configure additional logging sinks as needed.

### Useful commands

### Code Quality and Validation

The project includes several commands to ensure code quality and consistency. You can run:

- `npm run lint` to check for linting errors
- `npm run lint:fix` to automatically fix fixable issues from the linter
- `npm run check:types` to verify type safety across the entire project
- `npm run check:fsd` to validate FSD architecture and import boundaries
- `npm run check:deps` help identify unused dependencies and files
- `npm run check:i18n` ensures all translations are complete and properly formatted

#### Bundle Analyzer

Next.js Boilerplate includes a built-in bundle analyzer. It can be used to analyze the size of your JavaScript bundles. To begin, run the following command:

```shell
npm run build-stats
```

By running the command, it'll automatically open a new browser window with the results.

#### Database Studio

The project is already configured with Drizzle Studio to explore the database. You can run the following command to open the database studio:

```shell
npm run db:studio
```

Then, you can open https://local.drizzle.studio with your favorite browser to explore your database.

### VSCode information (optional)

If you are VSCode user, you can have a better integration with VSCode by installing the suggested extension in `.vscode/extension.json`. The starter code comes up with Settings for a seamless integration with VSCode. The Debug configuration is also provided for frontend and backend debugging experience.

With the plugins installed in your VSCode, ESLint and Prettier can automatically fix the code and display errors. The same applies to testing: you can install the VSCode Vitest extension to automatically run your tests, and it also shows the code coverage in context.

Pro tips: if you need a project wide-type checking with TypeScript, you can run a build with <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> on Mac.

### License

Licensed under the MIT License. See [LICENSE](LICENSE) for more information.
