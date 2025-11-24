
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/United-Pharmacy-LMS-Automation1/',
  optimizeDeps: {
    include: ['xlsx'],
  },
  build: {
    outDir: 'dist',
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
});
