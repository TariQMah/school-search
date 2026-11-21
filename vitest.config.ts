import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  // The demo imports '@skolo-saka/school-search' as an app would. In tests that name points at the
  // package source, as in demo/vite.config.ts, so tests never depend on a built dist/.
  resolve: {
    alias: [
      { find: '@skolo-saka/school-search/styles.css', replacement: src('styles.css') },
      { find: /^@skolo-saka\/school-search$/, replacement: src('index.ts') },
    ],
  },
  test: { environment: 'jsdom', globals: true, setupFiles: ['test/setup.ts'], include: ['test/**/*.test.tsx'] },
});
