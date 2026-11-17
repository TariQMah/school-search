import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // declarations come from tsc (tsconfig.build.json)
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // The component uses state and effects, so Next.js apps need it marked as a client component.
  banner: { js: "'use client';" },
});
