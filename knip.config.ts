import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // Files to exclude from Knip analysis
  ignore: [
    '.storybook/**/*',
    'src/shared/lib/I18n.ts',
    'src/shared/types/I18n.ts',
    'src/shared/utils/Helpers.ts',
    'tests/**/*.ts',
  ],
  // Dependencies to ignore during analysis
  ignoreDependencies: [
    '@commitlint/types',
    'conventional-changelog-conventionalcommits',
    'vite',
  ],
  // Binaries to ignore during analysis
  ignoreBinaries: [
    'production', // False positive raised with dotenv-cli
  ],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};

export default config;
