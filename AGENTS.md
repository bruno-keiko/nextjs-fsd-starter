# Repository guidance

## Architecture

- For FSD architecture tasks, read the official skill at [.agents/skills/feature-sliced-design/SKILL.md](.agents/skills/feature-sliced-design/SKILL.md), then only the reference files relevant to the task. Its upstream revision is pinned in `skills-lock.json`.
- This starter currently combines Next.js routing and page composition in `src/app/`, including locale routes under `[locale]`, instead of using separate FSD `_app`/`_pages` layers. Keep route-specific code there when extending this layout; use the skill's Next.js integration reference when deliberately migrating to separate layers.
- The counter's server component is exported from `src/entities/counter/index.server.ts`; its default `index.ts` exposes model and validation exports for other consumers.

## Project conventions

- Translations live in `src/shared/config/locales/`; locale configuration is in `src/shared/utils/AppConfig.ts` and `src/shared/lib/I18nRouting.ts`. Update each configured locale when adding translation keys.
- Reuse UI primitives in `src/shared/ui/` and theme variables in `src/shared/styles/global.css`.
- Environment validation lives in `src/shared/lib/Env.ts`; logging is configured in `src/shared/lib/Logger.ts`.
- Follow `eslint.config.mjs` for code style rather than maintaining separate style instructions.

## Validation

- For code changes, run `npm run lint` and `npm run check:types`, plus checks relevant to the change.
- Run `npm run check:fsd` for architecture validation; `steiger.config.mjs` defines the rules, enforced by Lefthook before commits and by CI.
- Vitest's `unit` project runs `.test.ts` files in Node; its `ui` project runs `.test.tsx` files in Chromium. Run either with `npm run test -- --project unit` or `npm run test -- --project ui`. Playwright tests live in `tests/`.
- For translation changes, run `npm run check:i18n`.

## Template and CLI

- When present, `packages/next-fsd/bin/next-fsd.mjs` scaffolds this repo. Changes to template paths or database setup must remain compatible with its frontend-only default and `--include db` variant.
- The CLI prompts for database support and AI tools in interactive terminals; `--no-db`, `--include db`, and `--ai-tool` provide explicit choices. When the CLI package is present, run its regression tests with `npm test --prefix packages/next-fsd` when changing setup behavior.
- `--minimal` removes the about/portfolio demo routes. When the CLI package is present, run `npm run test:generated --prefix packages/next-fsd` for changes to generated output; it validates clean installs, static checks, and builds for all four database/demo combinations.
- Published CLI versions use the matching `next-fsd-v<version>` template tag. Custom templates default to `main`; `--ref` overrides the choice.
- Generated projects must include `AGENTS.md`, `.agents/skills/feature-sliced-design/`, and `skills-lock.json` so the official guidance and its pinned source travel with the template.
- Database files and scripts exist in the full template and DB-enabled projects. The frontend-only variant removes them; check the project's `package.json` before using database commands. For DB-enabled projects, `npm run build-local` builds with a temporary in-memory PGlite database.
