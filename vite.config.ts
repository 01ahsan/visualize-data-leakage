/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /<repository-name>/.
// Change this if you rename the repository.
const REPO_NAME = 'visualize-data-leakage';

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 20000,
  },
});
