import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
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
