import { defineConfig } from 'vite';

// Tablet/desktop web game. `--host` is enabled so a real tablet on the LAN can
// load the dev server for true touch testing.
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
