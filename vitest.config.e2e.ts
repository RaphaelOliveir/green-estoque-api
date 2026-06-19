import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    hookTimeout: 30000,
    testTimeout: 30000,
    setupFiles: ['./test/setup.ts'],
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
