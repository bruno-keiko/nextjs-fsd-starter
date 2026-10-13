import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ['./src/app/**'],
    rules: {
      // Next.js route folders such as [locale]/api are not FSD segments.
      'fsd/no-reserved-folder-names': 'off',
    },
  },
  {
    files: ['./src/shared/{utils,types}/**'],
    rules: {
      // Keep existing segment names; report naming advice without blocking commits.
      'fsd/segments-by-purpose': 'warn',
    },
  },
]);
