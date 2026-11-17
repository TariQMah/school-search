import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const src = (p: string) => fileURLToPath(new URL(`../src/${p}`, import.meta.url));

// The demo imports '@skolo-saka/school-search' exactly as the website does; here that name points at
// the package source, so the demo always runs the component that gets built and published.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@skolo-saka/school-search/styles.css', replacement: src('styles.css') },
      { find: /^@skolo-saka\/school-search$/, replacement: src('index.ts') },
    ],
  },
  server: { port: 5173 },
});
