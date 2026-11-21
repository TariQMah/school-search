import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const src = (p: string) => fileURLToPath(new URL(`../src/${p}`, import.meta.url));

// The demo imports '@skolo-saka/school-search' exactly as the website does; here that name points at
// the package source, so the demo always runs the component that gets built and published.
const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  // Live search: the website whose public school API the demo uses (default production). See
  // demo/src/liveSearch.ts.
  const origin = (loadEnv(mode, root, 'VITE_').VITE_SKOLO_SAKA_ORIGIN || process.env.VITE_SKOLO_SAKA_ORIGIN || 'https://www.skolosaka.co.za').replace(/\/+$/, '');
  return {
    root,
    plugins: [react()],
    resolve: {
      alias: [
        { find: '@skolo-saka/school-search/styles.css', replacement: src('styles.css') },
        { find: /^@skolo-saka\/school-search$/, replacement: src('index.ts') },
      ],
    },
    // GitHub Pages serves the demo from /school-search/; set DEMO_BASE for that build.
    base: process.env.DEMO_BASE ?? '/',
    build: { outDir: 'dist', emptyOutDir: true },
    // The dev server forwards live searches to the website, so they are same-origin in the browser.
    server: { port: 5173, proxy: { '/api/public/': { target: origin, changeOrigin: true } } },
    preview: { proxy: { '/api/public/': { target: origin, changeOrigin: true } } },
  };
});
