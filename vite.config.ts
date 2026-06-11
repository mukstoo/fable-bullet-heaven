import { defineConfig } from 'vite';

// base './' so the build works from any subpath (GitHub Pages project site)
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600
  },
  server: {
    port: 5173
  }
});
