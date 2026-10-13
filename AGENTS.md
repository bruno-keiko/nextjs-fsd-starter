# Repository guidance

## Architecture

- `src/app/` is the Next.js App Router, including locale routes under `[locale]`. This starter has no separate FSD pages layer.
- Keep dependencies flowing from `app` → `widgets` → `features` → `entities` → `shared`. Slices within the same layer must not import each other; `shared` contains infrastructure and UI primitives.
- Import slices through their public entry points, such as `@/entities/counter`. Add separate server/client entry points only when needed to preserve runtime boundaries.
- Keep route-specific code near its route; extract reusable code into lower layers when needed. Create only the segments a slice uses.

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
- Database files and scripts exist in the full template and DB-enabled projects. The frontend-only variant removes them; check the project's `package.json` before using database commands. For DB-enabled projects, `npm run build-local` builds with a temporary in-memory PGlite database.
