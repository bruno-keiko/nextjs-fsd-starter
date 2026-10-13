import type { KnipConfig } from 'knip';
import { existsSync } from 'node:fs';

const config: KnipConfig = {
  workspaces: {
    '.': {
      // Public starter APIs remain available for generated projects to consume.
      entry: ['steiger.config.mjs', 'src/shared/ui/index.ts', 'src/shared/api-client/index.ts', 'src/shared/lib/Env.ts'],
    },
    ...(existsSync(new URL('./packages/next-fsd/package.json', import.meta.url))
      ? {
          'packages/next-fsd': {
            entry: ['tests/**/*.test.mjs'],
            project: ['bin/**/*.mjs', 'tests/**/*.mjs', 'scripts/**/*.mjs'],
          },
        }
      : {}),
  },
  // Files to exclude from Knip analysis
  ignore: [
    '.storybook/**/*',
    'src/shared/lib/I18n.ts',
    'src/shared/types/index.ts',
    'src/shared/utils/Helpers.ts',
    'tests/**/*.ts',
  ],
  // Dependencies to ignore during analysis
  ignoreDependencies: [
    '@commitlint/types',
    'conventional-changelog-conventionalcommits',
    'vite',
  ],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};

export default config;
