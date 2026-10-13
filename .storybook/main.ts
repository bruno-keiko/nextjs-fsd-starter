import type { StorybookConfig } from '@storybook/nextjs-vite';
import { mergeConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: [
    '../public',
  ],
  features: {
    experimentalRSC: true,
  },
  core: {
    disableTelemetry: true,
  },
  viteFinal(config) {
    return mergeConfig(config, {
      plugins: [tsconfigPaths({ projects: ['./tsconfig.test.json'] })],
    });
  },
};
export default config;
