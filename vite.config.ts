
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Use root base when serving locally, and GitHub Pages base for production builds
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/' : '/United-Pharmacy-LMS-Automation1/',
  optimizeDeps: {
    include: ['xlsx'],
  },
  build: {
    outDir: 'dist',
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
}));
